'use client';
import { filterTasks } from '../../application/queries';
import { updateTask } from '../../application/workspace';
import type { Status } from '../../domain/model';
import { TaskList } from '../work-lists';
import { useWorklog } from '../worklog';
import { Section } from './section';
export default function Route() {
  const {
    wb,
    w,
    setEditor,
    setSourceId,
    openFile,
    taskView,
    setTaskView,
    effective,
    askDeleteTask,
  } = useWorklog();
  const taskFilter = {
    ...effective,
    openOnly: taskView === 'open',
    overdueOnly: taskView === 'overdue',
    status: taskView === 'blocked' ? ('blocked' as Status) : effective.status,
  };
  const tasks = filterTasks(w, taskFilter);
  return (
    <Section>
      {
        <>
          <div className="toolbar flex items-center [gap:10px] [margin:19px_0] [&_.select-trigger]:[font-size:12px] [&_.select-trigger]:[padding:6px_9px] [&_.select-trigger]:[max-width:240px] [@media(max-width:800px)]:flex-wrap">
            <div className="segmented inline-flex [border:1px_solid_var(--border)] [border-radius:4px] overflow-hidden [background:var(--surface)] [&_button]:[padding:6px_13px] [&_button]:[font-size:12px] [&_button]:[background:transparent] [&_button]:border-0 [&_button]:[border-right:1px_solid_var(--border)] [&_button]:[color:var(--muted)] [&_button:last-child]:border-0 [&_button[aria-pressed=true]]:[background:var(--selected)] [&_button[aria-pressed=true]]:[color:var(--ink)]">
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
            <span className="muted [color:var(--muted)] text-sm ml-auto">
              {tasks.length} tasks · grouped by parent
            </span>
          </div>
          <TaskList
            onOpenSource={setSourceId}
            onOpenFile={openFile}
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
      }
    </Section>
  );
}
