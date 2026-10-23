'use client';
import { IconMinus, IconX } from '@tabler/icons-react';
import { motion, useAnimate, usePresence, useReducedMotion } from 'motion/react';
import { useEffectEvent, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';

/** Keep embedded documents mounted while minimized, including throughout transitions. */
export function FloatingWindow({
  title, open, busy, onMinimize, onClose, minimizeTarget, slideDirection = 0, children,
}: {
  title: string;
  open: boolean;
  busy?: boolean;
  onMinimize: () => void;
  onClose: () => void;
  minimizeTarget?: () => DOMRectReadOnly | undefined;
  slideDirection?: -1 | 0 | 1;
  children: ReactNode | ((state: { transitioning: boolean; sliding: boolean }) => ReactNode);
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [present, safeToRemove] = usePresence();
  const reducedMotion = useReducedMotion();
  const [settled, setSettled] = useState(false);
  const titleId = useId();
  const targetBounds = useEffectEvent(() => minimizeTarget?.());
  const remove = useEffectEvent(() => safeToRemove?.());

  useLayoutEffect(() => {
    const element = dialog.current;
    const content = scope.current;
    if (!element || !content) return;
    const visible = open && present;
    const wasOpen = element.open;
    setSettled(false);
    if (!visible && !wasOpen) {
      if (!present) remove();
      return;
    }
    element.setAttribute('closedby', 'closerequest');
    if (visible && !wasOpen) element.show();
    const previousWillChange = content.style.willChange;
    if (!reducedMotion) content.style.willChange = 'transform, opacity';
    const bounds = element.getBoundingClientRect();
    const target = targetBounds();
    const resting = { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 };
    const closing = { ...resting, y: 10, scaleX: 0.97, scaleY: 0.97, opacity: 0 };
    const docked = target ? {
      x: target.left + target.width / 2 - bounds.left - bounds.width / 2,
      y: target.top + target.height / 2 - bounds.top - bounds.height / 2,
      scaleX: target.width / bounds.width,
      scaleY: target.height / bounds.height,
      opacity: 0,
    } : closing;
    const sliding = { ...resting, x: (visible ? 1 : -1) * slideDirection * bounds.width };
    const hidden = reducedMotion ? { ...resting, opacity: 0 }
      : !present ? closing : slideDirection ? sliding : docked;
    const destination = visible ? resting : hidden;
    const start = !wasOpen ? hidden : undefined;
    let cancelled = false;
    const animation = animate(content, start ? {
      x: [start.x, destination.x], y: [start.y, destination.y],
      scaleX: [start.scaleX, destination.scaleX], scaleY: [start.scaleY, destination.scaleY],
      opacity: [start.opacity, destination.opacity],
    } : destination, { duration: reducedMotion ? 0 : slideDirection ? 0.24 : 0.28, ease: [0.22, 1, 0.36, 1] });
    void animation.then(() => {
      if (cancelled) return;
      content.style.willChange = previousWillChange;
      if (!visible) element.close();
      setSettled(visible);
      if (!present) remove();
    });
    return () => {
      cancelled = true;
      animation.stop();
      content.style.willChange = previousWillChange;
    };
  }, [open, present, slideDirection, reducedMotion, animate, scope]);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-70 overflow-hidden">
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: open && present ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.18 }}
        onClick={() => { if (open && present && !busy) onMinimize(); }}
        className="absolute inset-0 [background:var(--overlay)]"
        style={{ pointerEvents: open && present ? 'auto' : 'none' }}
      />
      <dialog
        ref={dialog}
        inert={!open || !present}
        aria-labelledby={titleId}
        aria-modal={open && present || undefined}
        aria-busy={busy}
        onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            if (!busy) onClose();
          }
        }}
        className="pointer-events-auto fixed [top:50%] [left:50%] -translate-x-1/2 -translate-y-1/2 m-0 w-[95vw] [height:calc(100dvh_-_100px)] [max-width:none] [max-height:none] overflow-visible border-0 bg-transparent p-0 [color:var(--ink)] outline-none"
      >
        <div ref={scope} className="relative flex h-full min-h-0 w-full flex-col pt-10">
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
            {typeof children === 'function'
              ? children({ transitioning: !settled, sliding: present && slideDirection !== 0 && !settled })
              : children}
          </div>
        </div>
      </dialog>
    </div>,
    document.body,
  );
}
