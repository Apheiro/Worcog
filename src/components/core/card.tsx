'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'cva';
import type { ComponentPropsWithRef } from 'react';

const card = cva({
  base: 'card [border:1px_solid_var(--border)] rounded-[5px] min-w-0 overflow-hidden [&_.table-wrap]:border-0 [&_.table-wrap]:rounded-none [&_.empty]:border-0 [&_.empty]:rounded-none [&_.empty]:m-0',
  variants: {
    tone: { surface: '[background:var(--surface)]', soft: '[background:var(--surface-soft)]' },
    padding: { none: '', md: 'p-[21px]' },
    interactive: {
      true: 'text-left hover:[border-color:var(--border-strong)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:[outline-color:var(--focus)]',
      false: '',
    },
  },
  defaultVariants: { tone: 'surface', padding: 'none', interactive: false },
});

export type CardProps = ComponentPropsWithRef<'section'> &
  VariantProps<typeof card> & { asChild?: boolean };

export function Card({
  asChild = false,
  tone,
  padding,
  interactive,
  className,
  ...props
}: CardProps) {
  const Component = asChild ? Slot : 'section';
  return <Component className={card({ tone, padding, interactive, className })} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={[
        'section-heading flex items-center justify-between gap-[15px] px-5 py-4 min-h-[58px] [border-bottom:1px_solid_var(--border)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <div className={['p-[21px] text-[13px]', className].filter(Boolean).join(' ')} {...props} />
  );
}
