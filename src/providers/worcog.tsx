'use client';
import { useDebouncedValue, useLocalStorage } from '@mantine/hooks';
import {
  IconArchive,
  IconChecklist,
  IconFiles,
  IconFolders,
  IconLayoutDashboard,
  IconHistory,
  IconSettings,
  IconUsers,
  IconBook2,
} from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useState, useEffect, useEffectEvent, type ReactNode } from 'react';
import { listen } from '@tauri-apps/api/event';
import { deleteEntity, deletionPreview, type DeletionTarget } from '../application/deletion';
import {
  defaultTopicInactivitySettings,
  deserializeTopicInactivity,
  type TopicInactivitySettings,
} from '../application/topic-inactivity';
import { type SearchFilter } from '../application/queries';
import type { TaskSort } from '../application/task-order';
import { statusFilter } from '../domain/options';
import { deleteTask, planTaskDeletion } from '../application/task-deletion';
import { updateTopic } from '../application/workspace';
import type { StorageInfo } from '../domain/model';
import { native } from '../infrastructure/native';
import { notifications } from '../infrastructure/notifications';
import { useUpdates } from '../infrastructure/use-updates';
import { useWorkspace } from '../infrastructure/use-workspace';
import { useDocumentWindows } from '../infrastructure/use-document-windows';
import { documentFormat } from '../infrastructure/document-editor';
import { useAttachmentAccess } from '../infrastructure/use-attachment-access';
import { useAttachmentExport } from '../infrastructure/use-attachment-export';
import { useTaskFileDrop } from '../infrastructure/use-task-file-drop';
import { useEntityLinks } from '../infrastructure/use-entity-links';
import { useShortcuts } from '../infrastructure/use-shortcuts';
import type { EntityRef } from '../domain/model';
import { useReminders } from '../infrastructure/use-reminders';
import { reminderApi } from '../infrastructure/reminders';
import { desktopAvailable } from '../infrastructure/native';
import { errorMessage } from '../infrastructure/native';
import type { Editor } from '../components/editors';
type Page = 'overview' | 'topics' | 'tasks' | 'resources' | 'contacts' | 'search' | 'archive' | 'documentation' | 'settings';
type Confirmation = {
  title: string;
  description: string;
  action: (purgeBackups?: boolean) => Promise<void>;
  includeBackups?: boolean;
  confirmLabel?: string;
};
export const navigation = [
  { id: 'overview', label: 'Overview', icon: IconLayoutDashboard },
  { id: 'topics', label: 'Topics', icon: IconFolders },
  { id: 'tasks', label: 'Tasks', icon: IconChecklist },
  { id: 'resources', label: 'Resources', icon: IconFiles },
  { id: 'contacts', label: 'Contacts', icon: IconUsers },
  { id: 'search', label: 'History', icon: IconHistory },
  { id: 'archive', label: 'Archive', icon: IconArchive },
  { id: 'documentation', label: 'Documentation', icon: IconBook2 },
  { id: 'settings', label: 'Settings', icon: IconSettings },
] as const;

function useWorcogController() {
  const wb = useWorkspace();
  const reminders = useReminders();
  const updates = useUpdates();
  const w = wb.workspace;
  const relations = useEntityLinks(wb);
  const shortcuts = useShortcuts();
  const attachmentAccess = useAttachmentAccess(w.attachments);
  const attachmentExport = useAttachmentExport(w, wb);
  const documents = useDocumentWindows();
  const [documentEditorEnabled, setDocumentEditorEnabled] = useLocalStorage<boolean>({
    key: 'worcog.document-editor-enabled',
    defaultValue: true,
    deserialize: (value) => value === undefined ? true : value === 'true',
  });
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const page = (pathname.split('/')[1] || 'overview') as Page;
  const topicId = page === 'topics' || page === 'archive' ? (params.get('topic') ?? '') : '';
  function setTopicId(id: string) {
    const route = page === 'archive' ? '/archive' : '/topics';
    if (id) router.push(route + '?topic=' + encodeURIComponent(id));
    else if (page === 'topics' || page === 'archive') router.push(route);
  }
  const [editor, setEditor] = useState<Editor | null>(null);
  const taskFileDrop = useTaskFileDrop(wb, editor !== null || !!relations.source);
  const exitGuard = editor !== null || documents.windows.length > 0 || wb.busy || reminders.busy || taskFileDrop.pendingId !== null;
  useEffect(() => {
    if (!desktopAvailable()) return;
    void reminderApi.setExitGuard(exitGuard).catch((cause) => notifications.error(errorMessage(cause)));
  }, [exitGuard]);
  const openReminder = useEffectEvent(async (id: string) => {
    if (editor || wb.busy) {
      notifications.warning('Save or close the current form and finish the current operation before opening the reminder task.');
      return;
    }
    await wb.refresh();
    setEditor({ kind: 'task', id });
  });
  const reminderDismissed = useEffectEvent(() => { void wb.refresh(); });
  useEffect(() => {
    if (!desktopAvailable()) return;
    let disposed = false;
    const stops: (() => void)[] = [];
    const subscribe = (promise: Promise<() => void>) => {
      void promise.then((stop) => { if (disposed) stop(); else stops.push(stop); })
        .catch((cause) => { if (!disposed) notifications.error(errorMessage(cause)); });
    };
    subscribe(listen<string>('open-reminder-task', ({ payload }) => { if (!disposed) void openReminder(payload); }));
    subscribe(listen('reminder-dismissed', () => { if (!disposed) reminderDismissed(); }));
    return () => { disposed = true; stops.forEach((stop) => stop()); };
  }, []);
  const [sourceId, setSourceId] = useState('');
  const [fileId, setFileId] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [purgeBackups, setPurgeBackups] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [filters, setFilters] = useLocalStorage<Record<string, SearchFilter>>({
    key: 'worcog.filters.v1',
    defaultValue: {},
  });
  const [sort, setSort] = useLocalStorage<'updated' | 'due' | 'priority' | 'name'>({
    key: 'worcog.topic-sort',
    defaultValue: 'updated',
  });
  const [inactivitySettings, setInactivitySettings] = useLocalStorage<TopicInactivitySettings>({
    key: 'worcog.topic-inactivity.v1',
    defaultValue: defaultTopicInactivitySettings,
    deserialize: deserializeTopicInactivity,
  });
  const [taskView, setTaskView] = useState('open');
  const [taskSort, setTaskSort] = useLocalStorage<TaskSort>({
    key: 'worcog.task-sort',
    defaultValue: 'created',
  });
  const [hideCompletedRootTasks, setHideCompletedRootTasks] = useLocalStorage<boolean>({
    key: 'worcog.hide-completed-root-tasks',
    defaultValue: false,
  });
  const [taskContextMenu, setTaskContextMenu] = useLocalStorage<boolean>({
    key: 'worcog.task-context-menu',
    defaultValue: false,
  });
  const [showTaskRelations, setShowTaskRelations] = useLocalStorage<boolean>({
    key: 'worcog.show-task-relations',
    defaultValue: false,
  });
  const [textureEnabled, setTextureEnabled] = useLocalStorage<boolean>({
    key: 'worcog.texture-enabled',
    defaultValue: true,
  });
  const [textureOpacity, setTextureOpacity] = useLocalStorage<number>({
    key: 'worcog.texture-opacity',
    defaultValue: 50,
    deserialize: (value) => {
      const opacity = Number(value);
      return Number.isFinite(opacity) ? Math.max(0, Math.min(100, opacity)) : 50;
    },
  });
  const filter = filters[page] ?? {};
  const [debouncedQuery] = useDebouncedValue(filter.query ?? '', 150);
  const effective = { ...filter, query: debouncedQuery };
  effective.status = statusFilter(filter.status);
  const setFilter = (patch: Partial<SearchFilter>) =>
    setFilters((current) => ({ ...current, [page]: { ...current[page], ...patch } }));
  const selectedTopic = w.topics.find((t) => t.id === topicId);
  const selectedSource = w.sources.find((s) => s.id === sourceId);
  const selectedFile = w.attachments.find((f) => f.id === fileId);
  const enabled = wb.ready && !wb.busy;
  function navigate(next: Page) {
    router.push(next === 'overview' ? '/' : '/' + next);
  }
  function openTopic(id: string) {
    setTopicId(id);
    setSourceId('');
  }
  const openFile = (id: string) => {
    void (async () => {
      const file = w.attachments.find((attachment) => attachment.id === id);
      const status = await attachmentAccess.check(id);
      if (status !== 'available') {
        notifications.warning(`${status === 'missing' ? 'File not found' : 'File inaccessible'}: ${file?.originalName ?? 'Attachment'}`);
        return;
      }
      if (documentEditorEnabled && file && documentFormat(file.originalName)) documents.open(file);
      else await wb.run(() => native.openFile(id));
    })().catch((cause) => notifications.error(errorMessage(cause)));
  };
  function askArchive(id = selectedTopic?.id) {
    const topic = w.topics.find((item) => item.id === id);
    if (!topic || wb.busy) return;
    setConfirmation({
      title: topic.archived ? 'Restore topic from archive?' : 'Archive this topic?',
      description:
        'The full history, tasks, sources and attachments are preserved. Archived topics are available from Archive.',
      action: async () => {
        if (
          await wb.update((current) =>
            updateTopic(current, topic.id, { archived: !topic.archived }),
          )
        ) {
          setConfirmation(null);
          if (page === 'archive' && topic.archived && selectedTopic?.id === topic.id) setTopicId('');
        }
      },
    });
  }
  function askDeleteTask(id: string) {
    if (wb.busy) return;
    const task = w.tasks.find((task) => task.id === id);
    if (!task) return;
    const plan = planTaskDeletion(w, id);
    const deletedTaskIds = new Set(plan.taskIds);
    const titles = w.tasks
      .filter((task) => deletedTaskIds.has(task.id))
      .slice(0, 5)
      .map((task) => `• ${task.title}`)
      .join('\n');
    const revision = w.revision;
    wb.setError('');
    setConfirmation({
      title: 'Permanently delete task?',
      confirmLabel: 'Delete permanently',
      description: `Delete “${task.title}” permanently?\n\n${plan.taskIds.length} task(s), including affected subtasks.\n${plan.activityIds.length} linked history record(s), including previous corrections.\n${titles}${plan.taskIds.length > 5 ? '\n…' : ''}${plan.includesRecurrence ? '\n\nThis removes the entire recurring series and its existing instances so they cannot be generated again.' : ''}${plan.sharedActivityCount ? `\n\n${plan.sharedActivityCount} history record(s) are also shared with other tasks or topics. Those records will be deleted in full.` : ''}\n\nNo recycle bin or deletion history is kept. Sources and managed files remain; their links to deleted records are removed. Existing backups and exports are unchanged. This cannot be undone.`,
      action: async () => {
        if (
          await wb.update(
            (current) => {
              if (current.revision !== revision)
                throw new Error('The workspace changed. Cancel and review the deletion again.');
              return deleteTask(current, id);
            },
            {},
            'Task and linked history permanently deleted.',
          )
        ) {
          if (editor?.kind === 'task' && editor.id && deletedTaskIds.has(editor.id))
            setEditor(null);
          setConfirmation(null);
        }
      },
    });
  }
  function askDelete(target: DeletionTarget) {
    if (wb.busy) return;
    const preview = deletionPreview(w, target);
    const revision = w.revision;
    const label =
      target.kind === 'activity'
        ? 'activity record'
        : target.kind === 'attachment'
          ? 'file'
          : target.kind;
    const item =
      target.kind === 'workspace'
        ? undefined
        : (target.kind === 'topic'
            ? w.topics
            : target.kind === 'source'
              ? w.sources
              : target.kind === 'activity'
                ? w.activities
                : w.attachments
          ).find((item) => item.id === target.id);
    const name = item
      ? 'title' in item
        ? item.title
        : 'text' in item
          ? item.text.slice(0, 160)
          : item.originalName
      : '';
    wb.setError('');
    setPurgeBackups(false);
    setConfirmation({
      title:
        target.kind === 'workspace'
          ? 'Permanently delete all workspace data?'
          : `Permanently delete ${label}?`,
      confirmLabel: 'Delete permanently',
      includeBackups: target.kind === 'workspace',
      description: `${name ? `Delete “${name}”?\n\n` : ''}This removes: ${preview.description}.

${target.kind === 'workspace' ? 'All records, previous corrections and managed files, including orphaned copies, will be removed.' : target.kind === 'topic' ? 'Tasks and their linked activity records are deleted in full, including records shared elsewhere. Other shared activity records, sources and files are preserved with their remaining relationships.' : target.kind === 'source' ? 'References to this source are removed from tasks and activity records; their text remains. Files exclusive to this source are deleted.' : target.kind === 'activity' ? 'The activity record and all previous corrections are removed, along with files exclusive to it.' : 'The managed copy is physically deleted from disk and removed from all workspace views. The original file outside Worcog is untouched.'}

No recycle bin or deletion history is kept. Existing exports outside Worcog are unchanged. This cannot be undone.`,
      action: async (includeBackups) => {
        if (
          await wb.update(
            (current) => {
              if (current.revision !== revision)
                throw new Error('The workspace changed. Cancel and review the deletion again.');
              return deleteEntity(current, target);
            },
            target.kind === 'workspace'
              ? { purgeWorkspaceFiles: true, purgeBackups: includeBackups === true }
              : {},
            'Permanently deleted.',
          )
        ) {
          setEditor(null);
          setSourceId('');
          setFileId('');
          if (target.kind === 'workspace' || target.kind === 'topic') setTopicId('');
          setConfirmation(null);
        }
      },
    });
  }
  function deleteRecord(kind: Editor['kind'], id: string) {
    if (kind === 'task') askDeleteTask(id);
    else askDelete({ kind, id });
  }
  async function inspectImport() {
    const inspection = await wb.run(() => native.inspect());
    if (inspection === null) notifications.info('Import canceled.');
    if (inspection)
      setConfirmation({
        title: 'Replace workspace from archive?',
        description: `${inspection.summary}\n\nThis replaces the current workspace. A complete safety backup is created first. Import does not merge records.`,
        action: async () => {
          await wb.run(async () => {
            const { repository } = await import('../infrastructure/native');
            wb.accept(await repository.restore(inspection.token));
            setTopicId('');
            setConfirmation(null);
          }, 'Workspace restored.');
        },
      });
  }
  const heading = navigation.find((item) => item.id === page)?.label ?? '';
  const addForPage = () => setEditor({ kind: 'topic' });
  const newItemName = 'topic';
  function editTask(id: string) {
    setSourceId('');
    setFileId('');
    setEditor({ kind: 'task', id });
  }
  function openLinkedEntity(ref: EntityRef) {
    relations.clearHighlight();
    if (ref.kind === 'topic') openTopic(ref.id);
    else editTask(ref.id);
  }

  return {
    wb,
    reminders,
    updates,
    w,
    relations,
    shortcuts,
    showTaskRelations,
    setShowTaskRelations,
    openLinkedEntity,
    page,
    topicId,
    setTopicId,
    editor,
    setEditor,
    sourceId,
    setSourceId,
    fileId,
    setFileId,
    confirmation,
    setConfirmation,
    purgeBackups,
    setPurgeBackups,
    storage,
    setStorage,
    filters,
    setFilters,
    sort,
    setSort,
    inactivitySettings,
    setInactivitySettings,
    taskView,
    setTaskView,
    taskSort,
    setTaskSort,
    hideCompletedRootTasks,
    setHideCompletedRootTasks,
    taskContextMenu,
    setTaskContextMenu,
    textureEnabled,
    setTextureEnabled,
    textureOpacity,
    setTextureOpacity,
    filter,
    debouncedQuery,
    effective,
    setFilter,
    selectedTopic,
    selectedSource,
    selectedFile,
    enabled,
    navigate,
    openTopic,
    openFile,
    attachmentAccess,
    attachmentExport,
    taskFileDrop,
    documents,
    documentEditorEnabled,
    setDocumentEditorEnabled,
    editTask,
    askArchive,
    askDeleteTask,
    askDelete,
    deleteRecord,
    inspectImport,
    heading,
    addForPage,
    newItemName,
  };
}
const WorcogContext = createContext<ReturnType<typeof useWorcogController> | null>(null);
export function useWorcog() {
  const context = useContext(WorcogContext);
  if (!context) throw new Error('WorcogProvider is required');
  return context;
}
export function WorcogProvider({ children }: { children: ReactNode }) {
  const value = useWorcogController();
  return <WorcogContext.Provider value={value}>{children}</WorcogContext.Provider>;
}
