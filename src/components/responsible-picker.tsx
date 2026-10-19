'use client';

import { MultiSelect } from './core/multi-select';

export function ResponsiblePicker({
  names,
  selected,
  onChange,
  onCreate,
  disabled,
}: {
  names: string[];
  selected: string[];
  onChange: (names: string[]) => void;
  onCreate: (name: string) => void;
  disabled?: boolean;
}) {
  return (
    <MultiSelect
      label="Assignees"
      options={names}
      value={selected}
      onValueChange={onChange}
      onCreate={onCreate}
      disabled={disabled}
    />
  );
}
