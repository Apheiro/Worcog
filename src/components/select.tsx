'use client';

import { useUncontrolled } from '@mantine/hooks';
import * as Primitive from '@radix-ui/react-select';
import { IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { cva } from 'cva';
import { useId, type ComponentPropsWithRef } from 'react';

export type SelectOption = { value: string; label: string; disabled?: boolean };
type SelectProps = Omit<
  ComponentPropsWithRef<typeof Primitive.Trigger>,
  'children' | 'asChild' | 'value' | 'defaultValue' | 'onChange'
> & {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  required?: boolean;
};
const trigger = cva({
  base: [
    'control',
    '[border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] [padding:8px_10px] min-w-0 max-w-full [color:var(--ink)]',
    'select-trigger',
    'inline-flex items-center justify-between gap-2 text-left cursor-pointer [font-size:13px] [line-height:1.4]',
    '[&:hover:not(:disabled)]:[border-color:var(--border-strong)] [&[data-state=open]]:[border-color:var(--focus)]',
    'disabled:opacity-50 disabled:cursor-not-allowed [&_>_span:first-child]:truncate',
  ],
});

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  disabled,
  className,
  ...props
}: SelectProps) {
  const [selected, setSelected] = useUncontrolled({
    value,
    defaultValue,
    finalValue: options[0]?.value ?? '',
    onChange: onValueChange,
  });
  // Radix reserves the empty string for clearing. Keep real form values intact
  // and use a per-control token only for the selectable clear/all option.
  const emptyItem = useId();
  const emptyOption = options.find((option) => option.value === '');
  return (
    <Primitive.Root
      value={selected}
      onValueChange={(next) => setSelected(next === emptyItem ? '' : next)}
      name={name}
      required={required}
      disabled={disabled}
    >
      <Primitive.Trigger className={trigger({ className })} {...props}>
        <Primitive.Value placeholder={emptyOption?.label} />
        <Primitive.Icon asChild>
          <IconChevronDown size={15} aria-hidden="true" className="shrink-0" />
        </Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          position="popper"
          sideOffset={4}
          collisionPadding={8}
          className="select-content [z-index:60] [min-width:var(--radix-select-trigger-width)] [max-width:calc(100vw_-_16px)] [max-height:min(320px,_var(--radix-select-content-available-height))] overflow-hidden [background:var(--surface)] [color:var(--ink)] [border:1px_solid_var(--border)] rounded-md [box-shadow:0_4px_16px_#0002]"
        >
          <Primitive.ScrollUpButton className="select-scroll flex items-center justify-center py-1 [background:var(--surface)]">
            <IconChevronUp size={14} aria-hidden="true" />
          </Primitive.ScrollUpButton>
          <Primitive.Viewport className="p-1">
            {options.map((option) => (
              <Primitive.Item
                key={option.value}
                value={option.value === '' ? emptyItem : option.value}
                disabled={option.disabled}
                aria-selected={selected === option.value}
                className="select-item relative flex items-center gap-4 cursor-default select-none rounded [padding:7px_30px_7px_9px] [font-size:12px] [line-height:1.4] outline-none [overflow-wrap:anywhere] [&[data-highlighted]]:[background:var(--selected)] [&[data-disabled]]:opacity-45 [&[data-disabled]]:pointer-events-none"
              >
                <Primitive.ItemText>{option.label}</Primitive.ItemText>
                <span
                  className="select-check absolute right-2 flex items-center"
                  aria-hidden="true"
                >
                  {selected === option.value && <IconCheck size={14} />}
                </span>
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
          <Primitive.ScrollDownButton className="select-scroll flex items-center justify-center py-1 [background:var(--surface)]">
            <IconChevronDown size={14} aria-hidden="true" />
          </Primitive.ScrollDownButton>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
