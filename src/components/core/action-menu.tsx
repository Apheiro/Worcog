'use client';

import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { IconDots } from '@tabler/icons-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './button';

export function ActionMenu({
  label,
  items,
  disabled,
}: {
  label: string;
  disabled?: boolean;
  items: {
    label: string;
    icon?: ReactNode;
    onSelect: () => void;
    disabled?: boolean;
    destructive?: boolean;
    opensDialog?: boolean;
  }[];
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
          <IconDots size={17} aria-hidden="true" />
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
          className="z-60 min-w-40 max-w-[calc(100vw-16px)] rounded-md [border:1px_solid_var(--border)] [background:var(--surface)] [color:var(--ink)] p-1 [box-shadow:0_4px_16px_#0002]"
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
              className={`flex items-center gap-2 rounded px-2 py-2 text-xs cursor-pointer outline-none data-[highlighted]:[background:var(--hover)] data-[disabled]:opacity-40 data-[disabled]:pointer-events-none ${item.destructive ? '[color:var(--danger-ink)]' : ''}`}
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
