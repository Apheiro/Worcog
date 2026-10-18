'use client';
import { Dashboard } from '../dashboard';
import { useWorklog } from '../worklog';
export default function Route() {
  const { w, setEditor, enabled, openTopic } = useWorklog();
  return (
    <Dashboard
      workspace={w}
      openTopic={openTopic}
      newTopic={() => setEditor({ kind: 'topic' })}
      enabled={enabled}
    />
  );
}
