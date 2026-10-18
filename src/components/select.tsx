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
const trigger = cva({ base: 'control select-trigger' });

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
          className="select-content"
        >
          <Primitive.ScrollUpButton className="select-scroll">
            <IconChevronUp size={14} aria-hidden="true" />
          </Primitive.ScrollUpButton>
          <Primitive.Viewport className="p-1">
            {options.map((option) => (
              <Primitive.Item
                key={option.value}
                value={option.value === '' ? emptyItem : option.value}
                disabled={option.disabled}
                aria-selected={selected === option.value}
                className="select-item"
              >
                <Primitive.ItemText>{option.label}</Primitive.ItemText>
                <span className="select-check" aria-hidden="true">
                  {selected === option.value && <IconCheck size={14} />}
                </span>
              </Primitive.Item>
            ))}
          </Primitive.Viewport>
          <Primitive.ScrollDownButton className="select-scroll">
            <IconChevronDown size={14} aria-hidden="true" />
          </Primitive.ScrollDownButton>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
