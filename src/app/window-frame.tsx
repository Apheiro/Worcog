'use client';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { IconCopy, IconMinus, IconPlus, IconSquare, IconX } from '@tabler/icons-react';
import { cva } from 'cva';
import { Button } from '../components/core/button';
import { useWindowControls } from '../infrastructure/use-window-controls';

const captionButton = cva({
  base: 'window-control shrink-0 [&.window-control]:border-0 [&.window-control]:p-0 [&.window-control]:focus-visible:[outline-offset:-3px]',
  variants: {
    platform: {
      windows: 'h-full w-11 [&.window-control]:rounded-none',
      macos:
        'group/window-control h-6 w-6 [&.window-control]:rounded-full [&.window-control:hover:not(:disabled)]:bg-transparent',
    },
    close: {
      false: '',
      true: '[&.window-control:hover]:[background:var(--danger-fill)] [&.window-control:hover]:[color:var(--on-danger)]',
    },
  },
});

const trafficLight = cva({
  base: 'flex h-3 w-3 items-center justify-center rounded-full [background:var(--muted)] [color:#0009] transition-colors motion-reduce:transition-none',
  variants: {
    action: {
      close:
        'group-hover/window-control:[background:#ff5f57] group-focus-visible/window-control:[background:#ff5f57]',
      minimize:
        'group-hover/window-control:[background:#febc2e] group-focus-visible/window-control:[background:#febc2e]',
      maximize:
        'group-hover/window-control:[background:#28c840] group-focus-visible/window-control:[background:#28c840]',
    },
  },
});

export function WindowFrame({ children }: { children: ReactNode }) {
  const tr = useTranslations('ui');
  const { desktop, platform, maximized, minimize, toggleMaximize, close } = useWindowControls();
  const isMac = platform === 'macos';
  const controls = [
    {
      id: 'minimize',
      label: tr('minimize_window'),
      icon: IconMinus,
      action: minimize,
      close: false,
    },
    {
      id: 'maximize',
      label: maximized ? tr('restore_window') : tr('maximize_window'),
      icon: maximized ? IconCopy : IconSquare,
      action: toggleMaximize,
      close: false,
    },
    { id: 'close', label: tr('close_window'), icon: IconX, action: close, close: true },
  ] as const;
  const orderedControls = isMac ? [controls[2], controls[0], controls[1]] : controls;
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden [background:var(--canvas)]">
      {desktop && (
        <header
          data-window-titlebar
          aria-label={tr('window_title_bar')}
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
            <span className="pointer-events-none truncate text-[11px]"> {tr('worcog')} </span>
          </div>
          <div
            className={`flex h-full shrink-0 items-center ${isMac ? 'order-first px-2' : ''}`}
            role="group"
            aria-label={tr('window_controls')}
          >
            {orderedControls.map((control) => (
              <Button
                key={control.id}
                type="button"
                tone="ghost"
                size="auto"
                title={control.label}
                aria-label={control.label}
                className={captionButton({
                  platform: isMac ? 'macos' : 'windows',
                  close: !isMac && control.close,
                })}
                onClick={control.action}
              >
                {isMac ? (
                  <span className={trafficLight({ action: control.id })}>
                    {control.id === 'maximize' ? (
                      <IconPlus
                        size={9}
                        stroke={2}
                        aria-hidden="true"
                        className="opacity-0 group-hover/window-control:opacity-100 group-focus-visible/window-control:opacity-100"
                      />
                    ) : (
                      <control.icon
                        size={9}
                        stroke={2}
                        aria-hidden="true"
                        className="opacity-0 group-hover/window-control:opacity-100 group-focus-visible/window-control:opacity-100"
                      />
                    )}
                  </span>
                ) : (
                  <control.icon size={13} stroke={1.5} aria-hidden="true" />
                )}
              </Button>
            ))}
          </div>
        </header>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
