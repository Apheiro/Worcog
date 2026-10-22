'use client';
import { IconMinus, IconX } from '@tabler/icons-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';

/** Closing the native dialog hides its DOM without unloading embedded documents. */
export function FloatingWindow({
  title, open, busy, onMinimize, onClose, children,
}: {
  title: string;
  open: boolean;
  busy?: boolean;
  onMinimize: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
    return () => { if (element.open) element.close(); };
  }, [open]);
  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-busy={busy}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      className="fixed [top:50%] [left:50%] -translate-x-1/2 -translate-y-1/2 m-0 w-[95vw] [height:calc(100dvh_-_100px)] [max-width:none] [max-height:none] overflow-visible border-0 bg-transparent p-0 [color:var(--ink)] outline-none [&::backdrop]:[background:var(--overlay)]"
    >
      <div className="relative flex h-full min-h-0 w-full flex-col pt-10">
        <h2 id={titleId} className="sr-only">{title}</h2>
        <div className="absolute right-0 top-0 flex items-center gap-1 rounded-md [background:var(--surface)]">
          <Button tone="ghost" size="icon" aria-label={`Minimize ${title}`} title="Minimize" disabled={busy} onClick={onMinimize}>
            <IconMinus size={18} />
          </Button>
          <Button tone="ghost" size="icon" aria-label={`Close ${title}`} title="Close" disabled={busy} onClick={onClose}>
            <IconX size={18} />
          </Button>
        </div>
        <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-lg">
          {children}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
