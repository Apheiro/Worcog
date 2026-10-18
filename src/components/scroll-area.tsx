'use client';

import * as Primitive from '@radix-ui/react-scroll-area';
import { cva } from 'cva';
import type { ComponentPropsWithRef } from 'react';

const root = cva({ base: 'relative min-h-0 min-w-0 overflow-hidden' });
const viewport = cva({
  base: 'h-full w-full [border-radius:inherit] focus-visible:[outline:2px_solid_var(--focus)] focus-visible:[outline-offset:-2px]',
});
const scrollbar = cva({
  base: 'flex touch-none select-none bg-[var(--surface-soft)] p-0.5',
  variants: {
    orientation: {
      vertical: 'h-full w-2',
      horizontal: 'h-2 flex-col',
    },
  },
});

export type ScrollAreaProps = ComponentPropsWithRef<typeof Primitive.Root> & {
  /** Accessible name for the keyboard-focusable scrolling region. */
  label: string;
  orientation?: 'vertical' | 'horizontal' | 'both';
  viewportProps?: Omit<ComponentPropsWithRef<typeof Primitive.Viewport>, 'children' | 'aria-label'>;
};

/** Set a bounded height/width on the root to define the scrollable area. */
export function ScrollArea({
  children,
  className,
  label,
  orientation = 'vertical',
  viewportProps,
  ...props
}: ScrollAreaProps) {
  const { className: viewportClassName, ...viewportAttributes } = viewportProps ?? {};
  const axes = orientation === 'both' ? (['vertical', 'horizontal'] as const) : [orientation];

  return (
    <Primitive.Root className={root({ className })} {...props}>
      <Primitive.Viewport
        role="region"
        tabIndex={0}
        {...viewportAttributes}
        aria-label={label}
        className={viewport({ className: viewportClassName })}
      >
        {children}
      </Primitive.Viewport>
      {axes.map((axis) => (
        <Primitive.Scrollbar
          key={axis}
          orientation={axis}
          className={scrollbar({ orientation: axis })}
        >
          <Primitive.Thumb className="relative flex-1 rounded-full bg-[var(--border-strong)] before:absolute before:left-1/2 before:top-1/2 before:min-h-5 before:min-w-5 before:-translate-x-1/2 before:-translate-y-1/2 before:content-empty" />
        </Primitive.Scrollbar>
      ))}
      {orientation === 'both' && <Primitive.Corner className="bg-[var(--surface-soft)]" />}
    </Primitive.Root>
  );
}
