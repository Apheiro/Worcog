'use client';
import { useWorcog } from '../providers/worcog';
import { Button } from './core';

export function ResourceTasks({ sourceId, fileId }: { sourceId?: string; fileId?: string }) {
  const { w, editTask, openTopic, setFileId } = useWorcog();
  const file = fileId ? w.attachments.find((item) => item.id === fileId) : undefined;
  const tasks = w.tasks.filter((task) =>
    sourceId ? task.sourceIds.includes(sourceId) : file?.taskIds.includes(task.id),
  );
  const topics = w.topics.filter((topic) => file?.topicIds.includes(topic.id));
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs [color:var(--muted)]">
      {topics.map((topic) => (
        <Button key={topic.id} size="auto" tone="link" onClick={() => { setFileId(''); openTopic(topic.id); }}>
          Topic: {topic.title}
        </Button>
      ))}
      {(tasks.length > 0 || topics.length === 0) && <span>Tasks:</span>}
      {tasks.length ? (
        tasks.map((task) => (
          <Button key={task.id} size="auto" tone="link" onClick={() => editTask(task.id)}>
            {task.title}
          </Button>
        ))
      ) : (
        topics.length === 0 && <span>No linked tasks</span>
      )}
    </div>
  );
}
