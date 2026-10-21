'use client';

import { useState, type ComponentPropsWithoutRef } from 'react';
import { DatePicker, DateTimePicker } from '@kalyx/react/headless';
import dayjs from 'dayjs';
import { DayjsAdapter } from '@kalyx/adapter-dayjs';
import { IconCalendar } from '@tabler/icons-react';
import { cva } from 'cva';

const dateInput = cva({
  base: 'control w-full min-w-0 rounded-[5px] [border:1px_solid_var(--border)] [background:var(--surface)] [color:var(--ink)] py-2 pl-2.5 [&.control]:pr-9 text-[13px] [&:focus]:outline-none [&:focus-visible]:outline-none focus:[border-color:var(--focus)] disabled:cursor-not-allowed disabled:opacity-45',
});

export type DateInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  withTime?: boolean;
};

/** Forms use calendar dates or local datetimes; UTC stays at the picker boundary. */
export function DateInput({
  value,
  defaultValue = '',
  onValueChange,
  name,
  disabled,
  readOnly,
  className,
  withTime = false,
  ...props
}: DateInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const date = value ?? internalValue;
  const Picker = withTime ? DateTimePicker : DatePicker;
  const iso = date ? (withTime ? dayjs(date).toISOString() : `${date}T00:00:00.000Z`) : null;
  const timeClasses = {
    root: 'm-0 h-28 overflow-y-auto overscroll-contain list-none p-1 rounded [border:1px_solid_var(--border)]',
    option:
      'rounded px-2 py-1.5 text-center text-xs cursor-pointer [color:var(--ink)] hover:[background:var(--hover)] focus-visible:[outline:2px_solid_var(--focus)] focus-visible:[outline-offset:-2px] [&[aria-selected=true]]:[background:var(--primary)] [&[aria-selected=true]]:[color:var(--on-primary)]',
  };
  return (
    <div className="relative min-w-0 w-full">
      <Picker
        adapter={DayjsAdapter}
        value={iso}
        onChange={(iso) => {
          const next = iso
            ? withTime
              ? dayjs(iso).format('YYYY-MM-DDTHH:mm')
              : iso.slice(0, 10)
            : '';
          if (value === undefined) setInternalValue(next);
          onValueChange?.(next);
        }}
        displayFormat={withTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'}
        displayTimezone={withTime ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined}
        disabled={disabled}
        readOnly={readOnly}
      >
        <Picker.Input
          {...props}
          disabled={disabled}
          placeholder={props.placeholder ?? (withTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD')}
          className={dateInput({ className })}
        />
        <DatePicker.Trigger
          disabled={disabled || readOnly}
          aria-label={withTime ? 'Open calendar and time' : 'Open calendar'}
          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded border-0 bg-transparent [color:var(--muted)] hover:[background:var(--hover)] focus-visible:[outline:2px_solid_var(--focus)]"
        >
          <IconCalendar size={16} aria-hidden="true" />
        </DatePicker.Trigger>
        <Picker.Popover className="z-60 w-64 max-w-[calc(100vw-24px)] rounded-md [border:1px_solid_var(--border)] [background:var(--surface)] [color:var(--ink)] p-3 [box-shadow:0_4px_16px_#0002]">
          <Picker.Calendar
            fixedWeeks
            classNames={{
              header: 'flex items-center justify-between gap-2 mb-3',
              title: 'text-xs font-medium',
              navButton:
                'h-7 w-7 rounded border-0 bg-transparent text-sm hover:[background:var(--hover)] focus-visible:[outline:2px_solid_var(--focus)]',
              grid: 'w-full border-collapse text-xs',
              gridCell: 'p-0 text-center',
              weekdayHeader: 'h-7 text-[10px] font-normal [color:var(--muted)]',
              day: 'h-8 w-8 rounded border-0 bg-transparent text-xs [color:var(--ink)] hover:[background:var(--hover)] focus-visible:[outline:2px_solid_var(--focus)] focus-visible:[outline-offset:-2px] [&[data-selected=true]]:[background:var(--primary)] [&[data-selected=true]]:[color:var(--on-primary)]',
              dayToday: 'font-bold underline underline-offset-3',
              dayOutsideMonth: 'opacity-40',
              dayDisabled: 'opacity-30 cursor-not-allowed',
            }}
          />
          {withTime && (
            <div className="mt-3 grid grid-cols-2 gap-3 pt-3 [border-top:1px_solid_var(--border)]">
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-xs [color:var(--muted)]">Hours</span>
                <DateTimePicker.HourList aria-label="Hours" classNames={timeClasses} />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-xs [color:var(--muted)]">Minutes</span>
                <DateTimePicker.MinuteList aria-label="Minutes" classNames={timeClasses} />
              </div>
            </div>
          )}
        </Picker.Popover>
      </Picker>
      {name && <input type="hidden" name={name} value={date} disabled={disabled} />}
    </div>
  );
}
