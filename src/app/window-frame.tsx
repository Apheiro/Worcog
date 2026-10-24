'use client';
import type { ReactNode } from 'react';
import { IconCopy, IconMinus, IconSquare, IconX } from '@tabler/icons-react';
import { cva } from 'cva';
import { Button } from '../components/core/button';
import { useWindowControls } from '../infrastructure/use-window-controls';

const captionButton = cva({
  base: 'window-control h-full w-11 shrink-0 [&.window-control]:rounded-none [&.window-control]:border-0 [&.window-control]:focus-visible:[outline-offset:-3px]',
  variants: {
    close: {
      false: '',
      true: '[&.window-control:hover]:[background:var(--danger-fill)] [&.window-control:hover]:[color:var(--on-danger)]',
    },
  },
});

export function WindowFrame({ children }: { children: ReactNode }) {
  const { desktop, maximized, minimize, toggleMaximize, close } = useWindowControls();
  const controls = [
    { label: 'Minimize window', icon: IconMinus, action: minimize, close: false },
    {
      label: maximized ? 'Restore window' : 'Maximize window',
      icon: maximized ? IconCopy : IconSquare,
      action: toggleMaximize,
      close: false,
    },
    { label: 'Close window', icon: IconX, action: close, close: true },
  ];
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden [background:var(--canvas)]">
      {desktop && (
        <header
          data-window-titlebar
          aria-label="Window title bar"
          className="relative z-80 pointer-events-auto flex h-8 shrink-0 select-none items-center [background:var(--surface)] [color:var(--muted)] [border-bottom:1px_solid_var(--border)]"
        >
          <div
            data-tauri-drag-region
            className="flex h-full min-w-0 flex-1 items-center gap-2 px-3"
          >
            <img
              src="/icon.png"
              alt=""
              width={18}
              height={18}
              draggable={false}
              className="pointer-events-none shrink-0"
            />
            <span className="pointer-events-none truncate text-[11px]">Worcog</span>
          </div>
          <div className="flex h-full shrink-0" role="group" aria-label="Window controls">
            {controls.map((control) => (
              <Button
                key={control.label}
                type="button"
                tone="ghost"
                size="auto"
                title={control.label}
                aria-label={control.label}
                className={captionButton({ close: control.close })}
                onClick={control.action}
              >
                <control.icon size={13} stroke={1.5} aria-hidden="true" />
              </Button>
            ))}
          </div>
        </header>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
