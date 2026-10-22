'use client';

import { useState } from 'react';
import type { Task, Topic, Workspace } from '../domain/model';
import { assignedNames, responsibleDirectory, responsibleKey, withoutResponsibles } from '../domain/responsibles';
import { Confirm, MultiSelect } from './core';

export function useResponsibleDraft(workspace: Workspace, item?: Task | Topic) {
  const [selected, onChange] = useState(item ? assignedNames(item) : []);
  const [created, setCreated] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [requester, onRequesterChange] = useState(item && 'requesterName' in item ? item.requesterName ?? '' : '');
  return {
    selected,
    onChange,
    created,
    removed,
    requester,
    onRequesterChange,
    names: [...new Set([...withoutResponsibles(responsibleDirectory(workspace), removed), ...created])],
    onCreate: (name: string) => {
      setRemoved((names) => withoutResponsibles(names, [name]));
      setCreated((names) => [...withoutResponsibles(names, [name]), name]);
    },
    onDelete: (name: string) => {
      setRemoved((names) => [...new Set([...names, name])]);
      onChange((names) => withoutResponsibles(names, [name]));
      setCreated((names) => withoutResponsibles(names, [name]));
      onRequesterChange((current) => responsibleKey(current) === responsibleKey(name) ? '' : current);
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
  label = 'Assignees',
  multiple = true,
}: {
  names: string[];
  selected: string[];
  onChange: (names: string[]) => void;
  onCreate: (name: string) => void;
  onDelete: (name: string) => void;
  workspace: Workspace;
  disabled?: boolean;
  label?: string;
  multiple?: boolean;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const assigned = (item: Task | Topic) => pending !== null &&
    assignedNames(item).some((name) => responsibleKey(name) === responsibleKey(pending));
  const taskCount = workspace.tasks.filter(assigned).length;
  const requested = (topic: Topic) => pending !== null && responsibleKey(topic.requesterName ?? '') === responsibleKey(pending);
  const topicCount = workspace.topics.filter((topic) => assigned(topic) || requested(topic)).length;
  return (
    <>
      <MultiSelect
        label={label}
        multiple={multiple}
        options={names}
        value={selected}
        onValueChange={onChange}
        onCreate={onCreate}
        onDelete={(name) => {
          const key = responsibleKey(name);
          const used = [...workspace.tasks, ...workspace.topics].some((item) =>
            assignedNames(item).some((assigned) => responsibleKey(assigned) === key)) ||
            workspace.topics.some((topic) => responsibleKey(topic.requesterName ?? '') === key);
          if (used || workspace.contacts?.some((contact) => responsibleKey(contact.name) === key)) setPending(name);
          else onDelete(name);
        }}
        disabled={disabled}
      />
      {pending !== null && (
        <Confirm
          title={`Delete contact “${pending}”?`}
          description={`This will delete the contact and remove its assignee and requester references from ${taskCount} task(s) and ${topicCount} topic(s), including archived topics. Tasks and topics will be preserved. Changes apply when you save this form.`}
          confirmLabel="Delete contact"
          busy={!!disabled}
          onCancel={() => setPending(null)}
          onConfirm={() => { onDelete(pending); setPending(null); }}
        />
      )}
    </>
  );
}
