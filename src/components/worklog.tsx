'use client';
import { Checkbox } from './checkbox';
import { useDebouncedValue, useLocalStorage } from '@mantine/hooks';
import {
  IconArchive,
  IconChecklist,
  IconDatabase,
  IconFiles,
  IconFolders,
  IconLayoutDashboard,
  IconLink,
  IconRefresh,
  IconSearch,
  IconSettings,
} from '@tabler/icons-react';
import Link from 'next/link';
import { cva } from 'cva';
const navigationItem = cva({
  base: 'nav-item no-underline',
  variants: { selected: { true: 'selected', false: '' } },
});
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { deleteEntity, deletionPreview, type DeletionTarget } from '../application/deletion';
import { type SearchFilter } from '../application/queries';
import { deleteTask, planTaskDeletion } from '../application/task-deletion';
import { addAttachment, unlinkAttachment, updateTopic } from '../application/workspace';
import type { StorageInfo } from '../domain/model';
import { native } from '../infrastructure/native';
import { notifications } from '../infrastructure/notifications';
import { useUpdates } from '../infrastructure/use-updates';
import { useWorkspace } from '../infrastructure/use-workspace';
import dynamic from 'next/dynamic';
const UpdateDialog = dynamic(() => import('./application-updates').then((m) => m.UpdateDialog));
import type { Editor } from './editors';
const EntityEditor = dynamic(() => import('./editors').then((m) => m.EntityEditor));
const FileRelationships = dynamic(() =>
  import('./related-dialogs').then((m) => m.FileRelationships),
);
const SourceDetail = dynamic(() => import('./related-dialogs').then((m) => m.SourceDetail));
import { ThemeControl } from './theme-control';
import { Button, Confirm } from './ui';
import { ScrollArea } from './scroll-area';
type Page =
  'overview' | 'topics' | 'tasks' | 'sources' | 'search' | 'files' | 'archive' | 'settings';
type Confirmation = {
  title: string;
  description: string;
  action: (purgeBackups?: boolean) => Promise<void>;
  includeBackups?: boolean;
  confirmLabel?: string;
};
const navigation = [
  { id: 'overview', label: 'Overview', icon: IconLayoutDashboard },
  { id: 'topics', label: 'Topics', icon: IconFolders },
  { id: 'tasks', label: 'Tasks', icon: IconChecklist },
  { id: 'sources', label: 'Sources', icon: IconLink },
  { id: 'search', label: 'Search everything', icon: IconSearch },
  { id: 'files', label: 'Files', icon: IconFiles },
  { id: 'archive', label: 'Archive', icon: IconArchive },
  { id: 'settings', label: 'Storage & backups', icon: IconSettings },
] as const;

function useWorklogController() {
  const wb = useWorkspace();
  const updates = useUpdates();
  const w = wb.workspace;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const page = (pathname.split('/')[1] || 'overview') as Page;
  const topicId = page === 'topics' ? (params.get('topic') ?? '') : '';
  function setTopicId(id: string) {
    if (id) router.push('/topics?topic=' + encodeURIComponent(id));
    else if (page === 'topics') router.push('/topics');
  }
  const [editor, setEditor] = useState<Editor | null>(null);
  const [sourceId, setSourceId] = useState('');
  const [fileId, setFileId] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [purgeBackups, setPurgeBackups] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [filters, setFilters] = useLocalStorage<Record<string, SearchFilter>>({
    key: 'worklog.filters.v1',
    defaultValue: {},
  });
  const [sort, setSort] = useLocalStorage<'updated' | 'due' | 'priority' | 'name'>({
    key: 'worklog.topic-sort',
    defaultValue: 'updated',
  });
  const [taskView, setTaskView] = useState('open');
  const filter = filters[page] ?? {};
  const [debouncedQuery] = useDebouncedValue(filter.query ?? '', 150);
  const effective = { ...filter, query: debouncedQuery };
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
    void wb.run(() => native.openFile(id));
  };
  async function attach() {
    const file = await wb.run(() => native.attach());
    if (!file && file !== undefined) notifications.info('File selection canceled.');
    if (file) {
      if (
        await wb.update((current) =>
          addAttachment(current, { ...file, topicIds: topicId ? [topicId] : [] }),
        )
      )
        setFileId(file.id);
    }
  }
  function askArchive() {
    if (!selectedTopic) return;
    const topic = selectedTopic;
    setConfirmation({
      title: topic.archived ? 'Restore topic from archive?' : 'Archive this topic?',
      description:
        'The full history, tasks, sources and attachments are preserved. Archived topics are available from Archive.',
      action: async () => {
        if (
          await wb.update((current) =>
            updateTopic(current, topic.id, { archived: !topic.archived }),
          )
        )
          setConfirmation(null);
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
      description: `Delete “${task.title}” permanently?\n\n${plan.taskIds.length} task(s), including affected subtasks.\n${plan.activityIds.length} linked history/annotation record(s), including previous corrections.\n${titles}${plan.taskIds.length > 5 ? '\n…' : ''}${plan.includesRecurrence ? '\n\nThis removes the entire recurring series and its existing instances so they cannot be generated again.' : ''}${plan.sharedActivityCount ? `\n\n${plan.sharedActivityCount} annotation(s) are also shared with other tasks or topics. Those annotations will be deleted in full.` : ''}\n\nNo recycle bin or deletion history is kept. Sources and managed files remain; their links to deleted records are removed. Existing backups and exports are unchanged. This cannot be undone.`,
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
        ? 'annotation'
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

${target.kind === 'workspace' ? 'All records, annotation corrections and managed files, including orphaned copies, will be removed.' : target.kind === 'topic' ? 'Tasks and their linked annotations are deleted in full, including annotations shared elsewhere. Other shared annotations, sources and files are preserved with their remaining relationships.' : target.kind === 'source' ? 'References to this source are removed from tasks and annotations; their text remains. Files exclusive to this source are deleted.' : target.kind === 'activity' ? 'The annotation and all previous corrections are removed, along with files exclusive to it.' : 'The managed copy is physically deleted from disk and removed from all workspace views. The original file outside Worklog is untouched.'}

No recycle bin or deletion history is kept. Existing exports outside Worklog are unchanged. This cannot be undone.`,
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
  function askUnlink(id: string) {
    setConfirmation({
      title: 'Remove direct topic relationship?',
      description:
        'The managed file stays on disk. Relationships through other items are preserved.',
      action: async () => {
        if (await wb.update((current) => unlinkAttachment(current, id, 'topicIds', topicId)))
          setConfirmation(null);
      },
    });
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
  const addForPage =
    page === 'sources'
      ? () => setEditor({ kind: 'source' })
      : page === 'tasks'
        ? () => setEditor({ kind: 'task' })
        : () => setEditor({ kind: 'topic' });
  const newItemName = page === 'sources' ? 'source' : page === 'tasks' ? 'task' : 'topic';

  return {
    wb,
    updates,
    w,
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
    taskView,
    setTaskView,
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
    attach,
    askArchive,
    askDeleteTask,
    askDelete,
    deleteRecord,
    askUnlink,
    inspectImport,
    heading,
    addForPage,
    newItemName,
  };
}
const WorklogContext = createContext<ReturnType<typeof useWorklogController> | null>(null);
export function useWorklog() {
  const context = useContext(WorklogContext);
  if (!context) throw new Error('Worklog layout is required');
  return context;
}
export default function Worklog({ children }: { children: ReactNode }) {
  const value = useWorklogController();
  const {
    wb,
    updates,
    w,
    page,
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
    selectedTopic,
    selectedSource,
    selectedFile,
    openTopic,
    openFile,
    askDelete,
    deleteRecord,
    heading,
  } = value;
  return (
    <WorklogContext.Provider value={value}>
      <div className="app-shell h-dvh ">
        <aside className="sidebar h-full">
          <div className="brand">
            <span className="brand-mark">W</span>
            <span>
              Worklog<small>Personal operations</small>
            </span>
          </div>
          <nav aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.id}
                className={navigationItem({ selected: page === item.id })}
                href={item.id === 'overview' ? '/' : '/' + item.id}
                onClick={() => setSourceId('')}
                aria-current={page === item.id ? 'page' : undefined}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.id === 'topics' && (
                  <small>{w.topics.filter((t) => !t.archived).length}</small>
                )}
              </Link>
            ))}
          </nav>
          <div className="sidebar-footer">
            <IconDatabase size={17} />
            <div>
              <strong>Local workspace</strong>
              <small>
                {wb.loading
                  ? 'Opening database…'
                  : wb.ready
                    ? 'Stored on this device'
                    : 'Desktop runtime required'}
              </small>
            </div>
          </div>
        </aside>
        <main id="main-content" className='flex-[1] flex flex-col h-full'>
          <header className="app-header">
            <span>{selectedTopic ? 'Topics / Workspace' : heading}</span>
            <div className="flex items-center gap-4">
              <ThemeControl />
              <span className="muted text-xs">
                {wb.busy ? 'Saving…' : 'No integrations · No sync'}
              </span>
              <Button
                size="sm"
                aria-label="Reload workspace"
                disabled={wb.busy || !wb.ready}
                onClick={() => {
                  void wb.refresh(true);
                }}
              >
                <IconRefresh size={16} />
              </Button>
            </div>
          </header>
          <ScrollArea label='main' className='flex-1'>

          <div className="main-content">
            {!wb.loading && !wb.ready && (
              <div className="notice mb-6">
                <strong>
                  {wb.error
                    ? 'Database could not be opened.'
                    : 'Desktop capabilities are unavailable in a browser.'}
                </strong>
                <p>
                  Run <code>pnpm tauri dev</code> to use SQLite, files and backups on this device.
                </p>
                {wb.error && (
                  <Button
                    size="sm"
                    onClick={() => {
                      void wb.refresh();
                    }}
                  >
                    Try again
                  </Button>
                )}
              </div>
            )}
            {wb.loading ? (
              <div className="empty" role="status">
                Opening your local workspace…
              </div>
            ) : (
              children
            )}
            </div>
            </ScrollArea>
        </main>
        {updates.open && <UpdateDialog updates={updates} />}
        {editor && (
          <EntityEditor
            onDelete={deleteRecord}
            editor={editor}
            workspace={w}
            busy={wb.busy}
            error={wb.error}
            openFile={openFile}
            onClose={() => {
              if (!wb.busy) setEditor(null);
            }}
            onSave={wb.update}
          />
        )}
        {selectedSource && !editor && (
          <SourceDetail
            onDelete={() => askDelete({ kind: 'source', id: sourceId })}
            deleteFile={(id) => askDelete({ kind: 'attachment', id })}
            source={selectedSource}
            error={wb.error}
            w={w}
            close={() => setSourceId('')}
            edit={() => {
              setEditor({ kind: 'source', id: sourceId });
              setSourceId('');
            }}
            openTopic={openTopic}
            openOriginal={() => {
              void wb.run(() => native.openReference(selectedSource.url));
            }}
            openFile={openFile}
            manageFile={(id) => {
              setSourceId('');
              setFileId(id);
            }}
          />
        )}
        {selectedFile && (
          <FileRelationships
            file={selectedFile}
            wb={wb}
            close={() => setFileId('')}
            onDelete={() => askDelete({ kind: 'attachment', id: fileId })}
          />
        )}
        {confirmation && (
          <Confirm
            confirmLabel={confirmation.confirmLabel}
            title={confirmation.title}
            description={confirmation.description}
            onCancel={() => {
              if (!wb.busy) setConfirmation(null);
            }}
            onConfirm={() => {
              void confirmation.action(purgeBackups);
            }}
            busy={wb.busy}
            error={wb.error}
          >
            {confirmation.includeBackups && (
              <label className="flex items-center gap-2 my-4">
                <Checkbox
                  checked={purgeBackups}
                  disabled={wb.busy}
                  onCheckedChange={(checked) => setPurgeBackups(checked === true)}
                />{' '}
                Also delete local backups stored by Worklog
              </label>
            )}
          </Confirm>
        )}
      </div>
    </WorklogContext.Provider>
  );
}
