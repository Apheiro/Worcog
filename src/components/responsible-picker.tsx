'use client';

import { useState } from 'react';
import type { Task, Topic, Workspace } from '../domain/model';
import { assignedNames, responsibleDirectory, responsibleKey, withoutResponsibles } from '../domain/responsibles';
import { Confirm, MultiSelect } from './core';

export function useResponsibleDraft(workspace: Workspace, item?: Task | Topic) {
  const [selected, onChange] = useState(item ? assignedNames(item) : []);
  const [created, setCreated] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  return {
    selected,
    onChange,
    created,
    removed,
    names: [...new Set([...withoutResponsibles(responsibleDirectory(workspace), removed), ...created])],
    onCreate: (name: string) => setCreated((names) => [...names, name]),
    onDelete: (name: string) => {
      setRemoved((names) => [...new Set([...names, name])]);
      onChange((names) => withoutResponsibles(names, [name]));
      setCreated((names) => withoutResponsibles(names, [name]));
    },
  };
}

export function ResponsiblePicker({
  names,
  selected,
  onChange,
  onCreate,
  onDelete,
  workspace,
  disabled,
}: {
  names: string[];
  selected: string[];
  onChange: (names: string[]) => void;
  onCreate: (name: string) => void;
  onDelete: (name: string) => void;
  workspace: Workspace;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const assigned = (item: Task | Topic) => pending !== null &&
    assignedNames(item).some((name) => responsibleKey(name) === responsibleKey(pending));
  const taskCount = workspace.tasks.filter(assigned).length;
  const topicCount = workspace.topics.filter(assigned).length;
  return (
    <>
      <MultiSelect
        label="Assignees"
        options={names}
        value={selected}
        onValueChange={onChange}
        onCreate={onCreate}
        onDelete={(name) => {
          const key = responsibleKey(name);
          const used = [...workspace.tasks, ...workspace.topics].some((item) =>
            assignedNames(item).some((assigned) => responsibleKey(assigned) === key));
          if (used) setPending(name);
          else onDelete(name);
        }}
        disabled={disabled}
      />
      {pending !== null && (
        <Confirm
          title={`Delete assignee “${pending}”?`}
          description={`This will remove the name from the directory and unassign it from ${taskCount} task(s) and ${topicCount} topic(s), including archived topics. Tasks, topics and other assignees will be preserved. Changes apply when you save this form.`}
          confirmLabel="Delete assignee"
          busy={!!disabled}
          onCancel={() => setPending(null)}
          onConfirm={() => { onDelete(pending); setPending(null); }}
        />
      )}
    </>
  );
}
