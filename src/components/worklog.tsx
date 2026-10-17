'use client';
import { useState } from 'react';
import { useDebouncedValue, useLocalStorage } from '@mantine/hooks';
import {
  IconArchive,
  IconChecklist,
  IconDatabase,
  IconDownload,
  IconFiles,
  IconFolders,
  IconLayoutDashboard,
  IconLink,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconUpload,
} from '@tabler/icons-react';
import { useWorkspace } from '../infrastructure/use-workspace';
import { notifications } from '../infrastructure/notifications';
import { native } from '../infrastructure/native';
import type { Status, StorageInfo } from '../domain/model';
import { addAttachment, unlinkAttachment, updateTask, updateTopic } from '../application/workspace';
import {
  filterTasks,
  filterTopics,
  searchWorkspace,
  type SearchFilter,
} from '../application/queries';
import { deleteEntity, deletionPreview, type DeletionTarget } from '../application/deletion';
import { deleteTask, planTaskDeletion } from '../application/task-deletion';
import { formatDate } from '../domain/dates';
import { Button, Confirm, Empty } from './ui';
import { ThemeControl } from './theme-control';
import { WorkspaceFilters } from './workspace-filters';
import { EntityEditor, type Editor } from './editors';
import { Dashboard } from './dashboard';
import { TopicDetail } from './topic-detail';
import { FileList, SourceList, TaskList, TopicTable } from './work-lists';
import { FileRelationships, SourceDetail } from './related-dialogs';
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
export default function Worklog() {
  const wb = useWorkspace();
  const w = wb.workspace;
  const [page, setPage] = useState<Page>('overview');
  const [topicId, setTopicId] = useState('');
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
    setPage(next);
    setTopicId('');
  }
  function openTopic(id: string) {
    setPage('topics');
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
  const topics = filterTopics(w, effective, sort, page === 'archive');
  const taskFilter = {
    ...effective,
    openOnly: taskView === 'open',
    overdueOnly: taskView === 'overdue',
    status: taskView === 'blocked' ? ('blocked' as Status) : effective.status,
  };
  const tasks = filterTasks(w, taskFilter);
  const search = searchWorkspace(w, effective);
  const sourceResults = searchWorkspace(w, { ...effective, type: 'source' });
  const sources = w.sources.filter((s) => sourceResults.some((result) => result.id === s.id));
  const heading = navigation.find((item) => item.id === page)?.label ?? '';
  const addForPage =
    page === 'sources'
      ? () => setEditor({ kind: 'source' })
      : page === 'tasks'
        ? () => setEditor({ kind: 'task' })
        : () => setEditor({ kind: 'topic' });
  const newItemName = page === 'sources' ? 'source' : page === 'tasks' ? 'task' : 'topic';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">W</span>
          <span>
            Worklog<small>Personal operations</small>
          </span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? 'nav-item selected' : 'nav-item'}
              onClick={() => navigate(item.id)}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.id === 'topics' && <small>{w.topics.filter((t) => !t.archived).length}</small>}
            </button>
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
      <main id="main-content">
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
          ) : selectedTopic ? (
            <TopicDetail
              topic={selectedTopic}
              wb={wb}
              edit={setEditor}
              openSource={setSourceId}
              openTopic={openTopic}
              back={() => setTopicId('')}
              archive={askArchive}
              attach={() => {
                void attach();
              }}
              manageFile={setFileId}
              openFile={openFile}
              unlinkFile={askUnlink}
              deleteTask={askDeleteTask}
              onDelete={askDelete}
            />
          ) : page === 'overview' ? (
            <Dashboard
              workspace={w}
              openTopic={openTopic}
              newTopic={() => setEditor({ kind: 'topic' })}
              enabled={enabled}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">Your workspace</p>
                  <h1>{heading}</h1>
                  <p className="muted">
                    {page === 'topics'
                      ? 'Every matter, its context, and the next step.'
                      : page === 'tasks'
                        ? 'Track outcomes, deadlines, and recurring work.'
                        : page === 'sources'
                          ? 'Reusable references to the places where work happens.'
                          : page === 'archive'
                            ? 'Preserved topics and their complete history.'
                            : page === 'files'
                              ? 'Managed copies and their relationships across your workspace.'
                              : page === 'search'
                                ? 'Find topics, tasks, annotations and external identifiers.'
                                : 'Persistent data, portable archives and recovery.'}
                  </p>
                </div>
                {['topics', 'tasks', 'sources'].includes(page) && (
                  <Button
                    tone="primary"
                    onClick={addForPage}
                    disabled={!enabled || (page === 'tasks' && !w.topics.length)}
                  >
                    <IconPlus size={17} /> New {newItemName}
                  </Button>
                )}
                {page === 'files' && (
                  <Button
                    tone="primary"
                    disabled={!enabled}
                    onClick={() => {
                      void attach();
                    }}
                  >
                    <IconPlus size={17} /> Attach file
                  </Button>
                )}
              </div>
              {['topics', 'tasks', 'sources', 'search', 'archive'].includes(page) && (
                <WorkspaceFilters
                  page={page}
                  workspace={w}
                  filter={filter}
                  onChange={setFilter}
                  onClear={() => setFilters((current) => ({ ...current, [page]: {} }))}
                />
              )}
              {(page === 'topics' || page === 'archive') && (
                <>
                  <div className="toolbar">
                    <span className="muted text-sm">{topics.length} topics</span>
                    <label className="ml-auto text-sm" htmlFor="topic-sort">
                      Sort by
                    </label>
                    <select
                      id="topic-sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as typeof sort)}
                    >
                      <option value="updated">Last updated</option>
                      <option value="due">Target date</option>
                      <option value="priority">Priority</option>
                      <option value="name">Name</option>
                    </select>
                  </div>
                  <TopicTable topics={topics} open={openTopic} />
                </>
              )}
              {page === 'tasks' && (
                <>
                  <div className="toolbar">
                    <div className="segmented">
                      {['open', 'all', 'overdue', 'blocked'].map((view) => (
                        <button
                          key={view}
                          aria-pressed={taskView === view}
                          onClick={() => setTaskView(view)}
                        >
                          {view[0].toUpperCase() + view.slice(1)}
                        </button>
                      ))}
                    </div>
                    <span className="muted text-sm ml-auto">
                      {tasks.length} tasks · grouped by parent
                    </span>
                  </div>
                  <TaskList
                    onDelete={askDeleteTask}
                    tasks={tasks}
                    workspace={w}
                    busy={wb.busy}
                    onEdit={(id) => setEditor({ kind: 'task', id })}
                    onStatus={(id, status) => {
                      void wb.update((value) => updateTask(value, id, { status }));
                    }}
                    onAddSubtask={(task) =>
                      setEditor({ kind: 'task', topicId: task.topicId, parentId: task.id })
                    }
                  />
                </>
              )}
              {page === 'sources' && (
                <SourceList
                  sources={sources}
                  onOpen={setSourceId}
                  onDelete={(id) => askDelete({ kind: 'source', id })}
                />
              )}
              {page === 'search' &&
                (search.length ? (
                  <div className="search-results">
                    {search.map((result) => (
                      <button
                        className="search-result"
                        key={`${result.type}-${result.id}`}
                        onClick={() => {
                          if (result.type === 'topic') openTopic(result.id);
                          else if (result.type === 'source') setSourceId(result.id);
                          else setEditor({ kind: result.type, id: result.id });
                        }}
                      >
                        <span className="eyebrow">
                          {result.type} · {formatDate(result.date)}
                        </span>
                        <strong>{result.title}</strong>
                        <p className="line-clamp-2 muted">{result.text}</p>
                        <span className="row-subtitle">
                          {result.topicIds
                            .map((id) => w.topics.find((t) => t.id === id)?.title)
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Empty title="No results">
                    Try another phrase, identifier or combination of filters.
                  </Empty>
                ))}
              {page === 'files' && (
                <FileList
                  files={w.attachments}
                  open={openFile}
                  manage={setFileId}
                  onDelete={(id) => askDelete({ kind: 'attachment', id })}
                />
              )}
              {page === 'settings' && (
                <div className="settings">
                  <section className="section">
                    <div className="section-heading">
                      <h2>Back up and recover</h2>
                    </div>
                    <div className="settings-body">
                      <p>
                        Backups and exports contain a versioned JSON manifest and all managed files
                        in a ZIP archive. Keep an export on another device for protection against
                        disk loss.
                      </p>
                      <div className="flex flex-wrap gap-3 my-5">
                        <Button
                          disabled={!enabled}
                          onClick={() => {
                            void wb.run(async () => {
                              const path = await native.backup();
                              notifications.success(`Backup created: ${path}`);
                            });
                          }}
                        >
                          <IconDatabase size={17} /> Create backup
                        </Button>
                        <Button
                          disabled={!enabled}
                          onClick={() => {
                            void wb.run(async () => {
                              const path = await native.export();
                              if (path) notifications.success(`Export saved: ${path}`);
                              else notifications.info('Export canceled.');
                            });
                          }}
                        >
                          <IconDownload size={17} /> Export archive…
                        </Button>
                        <Button
                          disabled={!enabled}
                          onClick={() => {
                            void inspectImport();
                          }}
                        >
                          <IconUpload size={17} /> Import / restore…
                        </Button>
                      </div>
                      <p className="muted text-sm">
                        Restore validates the archive, shows a summary, requests confirmation, and
                        creates a safety backup before replacing the workspace. It does not merge
                        records. Archives are unencrypted; store them privately.
                      </p>
                    </div>
                  </section>
                  <section className="section mt-6">
                    <div className="section-heading">
                      <h2>Storage locations</h2>
                      <Button
                        size="sm"
                        disabled={!enabled}
                        onClick={() => {
                          void wb.run(async () => setStorage(await native.storage()));
                        }}
                      >
                        Show locations
                      </Button>
                    </div>
                    <div className="settings-body">
                      {storage ? (
                        <dl className="metadata">
                          {Object.entries(storage).map(([key, value]) => (
                            <div className="contents" key={key}>
                              <dt>{key}</dt>
                              <dd className="break-all">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="muted">
                          Locations are resolved by Tauri for the current operating system.
                        </p>
                      )}
                      <p className="mt-4 text-sm">
                        SQLite and managed attachments live in persistent application data. Cache is
                        separate and contains no primary records. Unlinking files preserves their
                        managed copies.
                      </p>
                    </div>
                  </section>
                  <section className="section mt-6">
                    <div className="section-heading">
                      <h2>Permanent deletion</h2>
                    </div>
                    <div className="settings-body">
                      <p>
                        Delete individual items using their trash buttons. Delete all removes every
                        topic, task, source, annotation and managed file. You can also include local
                        backups in the confirmation.
                      </p>
                      <div className="flex flex-wrap gap-3 my-5">
                        <Button
                          disabled={!enabled}
                          onClick={() => {
                            void wb.run(async () => {
                              const warning = await native.cleanup();
                              if (warning) notifications.warning(warning);
                              else {
                                notifications.clearWarnings();
                                notifications.success('File cleanup complete.');
                              }
                            });
                          }}
                        >
                          Retry file cleanup
                        </Button>
                        <Button
                          tone="danger"
                          disabled={!enabled}
                          onClick={() => askDelete({ kind: 'workspace' })}
                        >
                          Delete all workspace data
                        </Button>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </main>
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
              <input
                type="checkbox"
                checked={purgeBackups}
                disabled={wb.busy}
                onChange={(event) => setPurgeBackups(event.target.checked)}
              />{' '}
              Also delete local backups stored by Worklog
            </label>
          )}
        </Confirm>
      )}
    </div>
  );
}
