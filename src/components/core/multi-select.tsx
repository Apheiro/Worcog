'use client';
import { useTranslations } from 'next-intl';

import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { IconCheck, IconChevronDown, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useId, useRef, useState } from 'react';
import { Button } from './button';

export function MultiSelect({
  label,
  options,
  value,
  onValueChange,
  onCreate,
  onDelete,
  disabled,
  multiple = true,
}: {
  label: string;
  options: string[];
  value: string[];
  onValueChange: (value: string[]) => void;
  onCreate: (name: string) => void;
  onDelete?: (name: string) => void;
  disabled?: boolean;
  multiple?: boolean;
}) {
  const tr = useTranslations('ui');
  const id = useId();
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const name = query.trim();
  const term = name.toLocaleLowerCase();
  const selected = new Set(value);
  const filtered = options.filter((option) => option.toLocaleLowerCase().includes(term));
  const exact = options.find((option) => option.toLocaleLowerCase() === term);
  const rank = (option: string) => (option === exact ? 0 : selected.has(option) ? 1 : 2);
  const matches = filtered.sort((a, b) => rank(a) - rank(b)).slice(0, 50);
  const canCreate = !!name && !exact;
  const summary = value.length
    ? value.slice(0, 2).join(', ') + (value.length > 2 ? ` +${value.length - 2}` : '')
    : tr('select_label', { label: label.toLowerCase() });

  function toggle(option: string) {
    onValueChange(
      selected.has(option)
        ? value.filter((item) => item !== option)
        : multiple
          ? [...value, option]
          : [option],
    );
    if (!multiple) {
      setOpen(false);
      setQuery('');
    } else search.current?.focus();
  }
  function create() {
    if (!canCreate || disabled) return;
    onCreate(name);
    onValueChange(multiple ? [...value, name] : [name]);
    setQuery('');
    if (!multiple) setOpen(false);
    else search.current?.focus();
  }

  return (
    <div className="mb-5 min-w-0">
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="block text-xs [color:var(--secondary)] font-medium mb-2"
      >
        {label}
      </label>
      <Popover.Root
        open={open && !disabled}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery('');
        }}
      >
        <Popover.Trigger asChild>
          <Button
            id={id}
            type="button"
            disabled={disabled}
            aria-labelledby={`${id}-label ${id}-value`}
            className="w-full justify-between min-w-0 text-left [&.button:focus-visible]:[outline:none] focus-visible:[border-color:var(--focus)] [&[data-state=open]]:[border-color:var(--focus)]"
          >
            <span
              id={`${id}-value`}
              className={`truncate ${value.length ? '' : '[color:var(--muted)]'}`}
            >
              {summary}
            </span>
            <IconChevronDown
              size={15}
              className="shrink-0 [color:var(--muted)]"
              aria-hidden="true"
            />
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            collisionPadding={8}
            aria-label={label}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              search.current?.focus();
            }}
            className="[z-index:60] [width:var(--radix-popover-trigger-width)] [max-width:calc(100vw_-_16px)] [max-height:var(--radix-popover-content-available-height)] overflow-auto rounded-md [border:1px_solid_var(--border)] [background:var(--surface)] [color:var(--ink)] [box-shadow:0_4px_16px_#0002]"
          >
            <Command label={label} shouldFilter={false} loop>
              <div className="flex items-center gap-2 px-3 [border-bottom:1px_solid_var(--border)] focus-within:[border-color:var(--focus)]">
                <IconSearch
                  size={16}
                  className="shrink-0 [color:var(--muted)]"
                  aria-hidden="true"
                />
                <Command.Input
                  ref={search}
                  value={query}
                  onValueChange={setQuery}
                  maxLength={500}
                  placeholder={tr('search_or_create')}
                  aria-label={tr('search_value0', { value0: label.toLowerCase() })}
                  className="min-w-0 w-full border-0 bg-transparent py-3 text-xs [color:var(--ink)] [&:focus]:[outline:none] [&:focus-visible]:[outline:none]"
                />
              </div>
              <Command.List
                className="max-h-60 overflow-y-auto overscroll-contain p-1"
                aria-label={tr('value0_results', { value0: label })}
              >
                {!filtered.length && (
                  <p className="px-2 py-3 text-xs [color:var(--muted)]">
                    {term
                      ? tr('no_matching_value0', { value0: label.toLowerCase() })
                      : tr('no_value0_yet_type_a_name_to_create_one', {
                          value0: label.toLowerCase(),
                        })}
                  </p>
                )}
                {matches.map((option) => (
                  <div key={option} className="flex items-center gap-1">
                    <Command.Item
                      value={`option:${option}`}
                      aria-checked={selected.has(option)}
                      onSelect={() => toggle(option)}
                      className="min-w-0 flex-1 flex items-center gap-2 rounded px-2 py-2 text-xs cursor-pointer outline-none [overflow-wrap:anywhere] [&[data-selected=true]]:[background:var(--selected)]"
                    >
                      <span
                        aria-hidden="true"
                        className={`flex items-center justify-center shrink-0 w-4 h-4 rounded [border:1px_solid_var(--border-strong)] ${selected.has(option) ? '[background:var(--checkbox-fill)] [border-color:var(--checkbox-fill)] [color:var(--checkbox-mark)]' : ''}`}
                      >
                        {selected.has(option) && <IconCheck size={12} stroke={2.5} />}
                      </span>
                      {option}
                    </Command.Item>
                    {onDelete && (
                      <Button
                        type="button"
                        tone="ghost"
                        size="icon"
                        aria-label={tr('delete_value0', { value0: option })}
                        title={tr('delete_value0', { value0: option })}
                        disabled={disabled}
                        className="[color:var(--muted)] hover:[color:var(--danger-ink)]"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
                        }}
                        onClick={() => {
                          setOpen(false);
                          setQuery('');
                          onDelete(option);
                        }}
                      >
                        <IconTrash size={14} aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))}
                {canCreate && (
                  <Command.Item asChild value={`create:${name}`} onSelect={create}>
                    <Button
                      type="button"
                      tone="ghost"
                      size="auto"
                      className="w-full justify-start gap-2 rounded px-2 py-2 text-xs text-left whitespace-normal [overflow-wrap:anywhere] [&[data-selected=true]]:[background:var(--selected)]"
                    >
                      <IconPlus size={15} className="shrink-0" aria-hidden="true" />
                      <span>{tr('create_named', { name })}</span>
                    </Button>
                  </Command.Item>
                )}
              </Command.List>
              <div className="px-3 py-2 text-xs [color:var(--muted)] [border-top:1px_solid_var(--border)]">
                <span role="status">
                  {value.length} {tr('selected')}{' '}
                </span>
                {filtered.length > matches.length && (
                  <span>
                    {' '}
                    {tr('showing')} {matches.length} {tr('of')} {filtered.length}{' '}
                    {tr('refine_your_search')}{' '}
                  </span>
                )}
              </div>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
