'use client';
import { useId } from 'react';
import { taskSortOptions } from '../application/task-order';
import { useWorklog } from '../providers/worklog';
import { Select } from './core';

export function TaskOrder() {
  const id = useId();
  const { taskSort, setTaskSort } = useWorklog();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="shrink-0 text-xs [color:var(--muted)]">Order by</label>
      <Select
        id={id}
        value={taskSort}
        onValueChange={(value) => {
          const selected = taskSortOptions.find((option) => option.value === value);
          if (selected) setTaskSort(selected.value);
        }}
        options={[...taskSortOptions]}
        className="[&.select-trigger]:w-auto [&.select-trigger]:text-xs"
      />
    </div>
  );
}
