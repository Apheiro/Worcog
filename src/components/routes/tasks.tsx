'use client';
import { filterTasks } from '../../application/queries';
import { updateTask } from '../../application/workspace';
import type { Status } from '../../domain/model';
import { TaskList } from '../work-lists';
import { useWorklog } from '../worklog';
import { Section } from './section';
export default function Route() {
  const { wb, w, setEditor, taskView, setTaskView, effective, askDeleteTask } = useWorklog();
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
            <span className="muted text-sm ml-auto">{tasks.length} tasks · grouped by parent</span>
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
      }
    </Section>
  );
}
