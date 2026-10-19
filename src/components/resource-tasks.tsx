'use client';
import { useWorklog } from '../providers/worklog';
import { Button } from './core';

export function ResourceTasks({ sourceId, fileId }: { sourceId?: string; fileId?: string }) {
  const { w, editTask } = useWorklog();
  const file = fileId ? w.attachments.find((item) => item.id === fileId) : undefined;
  const tasks = w.tasks.filter((task) =>
    sourceId ? task.sourceIds.includes(sourceId) : file?.taskIds.includes(task.id),
  );
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs [color:var(--muted)]">
      <span>Tasks:</span>
      {tasks.length ? (
        tasks.map((task) => (
          <Button key={task.id} size="auto" tone="link" onClick={() => editTask(task.id)}>
            {task.title}
          </Button>
        ))
      ) : (
        <span>No linked tasks</span>
      )}
    </div>
  );
}
