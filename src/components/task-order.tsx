'use client';
import { useTranslations } from 'next-intl';
import { useLabels } from '../i18n/use-labels';
import { useId } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { taskSortOptions } from '../application/task-order';
import { useWorcog } from '../providers/worcog';
import { Button, Select } from './core';

export function TaskOrder() {
  const tr = useTranslations('ui');
  const localize = useLabels();
  const id = useId();
  const { taskSort, setTaskSort, hideCompletedRootTasks, setHideCompletedRootTasks } = useWorcog();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="shrink-0 text-xs [color:var(--muted)]">
        {' '}
        {tr('order_by')}{' '}
      </label>
      <Select
        id={id}
        value={taskSort}
        onValueChange={(value) => {
          const selected = taskSortOptions.find((option) => option.value === value);
          if (selected) setTaskSort(selected.value);
        }}
        options={taskSortOptions.map((option) => ({ ...option, label: localize(option.label) }))}
        className="[&.select-trigger]:w-auto [&.select-trigger]:text-xs"
      />
      <Button
        type="button"
        size="sm"
        aria-pressed={hideCompletedRootTasks}
        aria-label={tr('value0_completed_main_tasks', {
          value0: hideCompletedRootTasks ? tr('show') : tr('hide'),
        })}
        title={tr('only_affects_main_tasks_subtasks_remain_visible')}
        className="[&[aria-pressed=true]]:[background:var(--selected)]"
        onClick={() => setHideCompletedRootTasks((value) => !value)}
      >
        {hideCompletedRootTasks ? (
          <IconEye size={15} aria-hidden="true" />
        ) : (
          <IconEyeOff size={15} aria-hidden="true" />
        )}
        {hideCompletedRootTasks ? tr('show_completed') : tr('hide_completed')}
      </Button>
    </div>
  );
}
