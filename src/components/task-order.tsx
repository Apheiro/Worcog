'use client';
import { useId } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { taskSortOptions } from '../application/task-order';
import { useWorcog } from '../providers/worcog';
import { Button, Select } from './core';

export function TaskOrder() {
  const id = useId();
  const { taskSort, setTaskSort, hideCompletedRootTasks, setHideCompletedRootTasks } = useWorcog();
  return (
    <div className="flex flex-wrap items-center gap-2">
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
      <Button
        type="button"
        size="sm"
        aria-pressed={hideCompletedRootTasks}
        aria-label={`${hideCompletedRootTasks ? 'Show' : 'Hide'} completed main tasks`}
        title="Only affects main tasks; subtasks remain visible"
        className="[&[aria-pressed=true]]:[background:var(--selected)]"
        onClick={() => setHideCompletedRootTasks((value) => !value)}
      >
        {hideCompletedRootTasks ? <IconEye size={15} aria-hidden="true" /> : <IconEyeOff size={15} aria-hidden="true" />}
        {hideCompletedRootTasks ? 'Show completed' : 'Hide completed'}
      </Button>
    </div>
  );
}
