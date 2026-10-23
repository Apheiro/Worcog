'use client';

import * as Dropdown from '@radix-ui/react-dropdown-menu';
import * as Context from '@radix-ui/react-context-menu';
import { IconDotsVertical } from '@tabler/icons-react';
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { cva } from 'cva';
import { Button } from './button';

export type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
  opensDialog?: boolean;
};
const menuContent = cva({
  base: 'z-60 min-w-40 max-w-[calc(100vw-16px)] rounded-md [border:1px_solid_var(--border)] [background:var(--surface)] [color:var(--ink)] p-1 [box-shadow:0_4px_16px_#0002]',
});
const menuItem = cva({
  base: 'flex items-center gap-2 rounded px-2 py-2 text-xs cursor-pointer outline-none data-[highlighted]:[background:var(--hover)] data-[disabled]:opacity-40 data-[disabled]:pointer-events-none',
  variants: { destructive: { true: '[color:var(--danger-ink)]', false: '' } },
});

export function ActionMenu({
  label,
  items,
  disabled,
}: {
  label: string;
  disabled?: boolean;
  items: ActionMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const pointerOpened = useRef(false);
  const opensDialog = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function cancelClose() {
    clearTimeout(timer.current);
  }
  function scheduleClose() {
    cancelClose();
    timer.current = setTimeout(() => setOpen(false), 120);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Dropdown.Root
      open={open && !disabled}
      onOpenChange={(next) => {
        if (next) opensDialog.current = false;
        setOpen(next);
      }}
      modal={false}
    >
      <Dropdown.Trigger asChild>
        <Button
          type="button"
          tone="ghost"
          size="icon"
          disabled={disabled}
          aria-label={label}
          onPointerEnter={(event) => {
            cancelClose();
            if (event.pointerType === 'mouse' && !disabled) {
              pointerOpened.current = true;
              opensDialog.current = false;
              setOpen(true);
            }
          }}
          onPointerLeave={scheduleClose}
          onPointerDown={() => {
            pointerOpened.current = false;
          }}
          onKeyDown={() => {
            pointerOpened.current = false;
          }}
        >
          <IconDotsVertical size={17} aria-hidden="true" />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          onCloseAutoFocus={(event) => {
            if (pointerOpened.current || opensDialog.current) event.preventDefault();
          }}
          className={menuContent()}
        >
          {items.map((item) => (
            <Dropdown.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={() => {
                cancelClose();
                opensDialog.current = !!item.opensDialog;
                item.onSelect();
              }}
              className={menuItem({ destructive: item.destructive })}
            >
              {item.icon}
              {item.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

export function ContextMenu({ label, items, disabled, children }: {
  label: string;
  items: ActionMenuItem[];
  disabled?: boolean;
  children: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const opensDialog = useRef(false);
  return (
    <Context.Root modal={false} open={open && !disabled} onOpenChange={(next) => {
      if (next) opensDialog.current = false;
      setOpen(next);
    }}>
      <Context.Trigger
        asChild
        disabled={disabled}
        tabIndex={disabled ? undefined : 0}
        aria-haspopup={disabled ? undefined : 'menu'}
        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus)]"
        onKeyDown={(event) => {
          if (disabled || (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10'))) return;
          event.preventDefault();
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true, cancelable: true,
            clientX: bounds.left + Math.min(24, bounds.width),
            clientY: bounds.top + Math.min(24, bounds.height),
          }));
        }}
      >
        {children}
      </Context.Trigger>
      <Context.Portal>
        <Context.Content
          aria-label={label}
          collisionPadding={8}
          onCloseAutoFocus={(event) => { if (opensDialog.current) event.preventDefault(); }}
          className={menuContent()}
        >
          {items.map((item) => (
            <Context.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={() => {
                opensDialog.current = !!item.opensDialog;
                item.onSelect();
              }}
              className={menuItem({ destructive: item.destructive })}
            >
              {item.icon}
              {item.label}
            </Context.Item>
          ))}
        </Context.Content>
      </Context.Portal>
    </Context.Root>
  );
}
