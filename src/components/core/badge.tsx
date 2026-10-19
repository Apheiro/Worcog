import { cva } from 'cva';
import type { ComponentPropsWithoutRef } from 'react';

const badge = cva({
  base: [
    'badge',
    'inline-flex items-center [background:var(--surface-soft)] [color:var(--secondary)] [border:1px_solid_var(--border)] whitespace-nowrap [font-size:11px] [font-weight:550] [border-radius:4px] [padding:2px_7px] [line-height:1.6]',
  ],
  variants: {
    tone: {
      neutral: '',
      warning: [
        'badge-warning',
        '[&.badge-warning]:[color:var(--warning-ink)] [&.badge-warning]:[background:var(--warning-bg)] [&.badge-warning]:[border-color:var(--warning-border)]',
      ],
      danger: [
        'badge-danger',
        '[&.badge-danger]:[color:var(--danger-ink)] [&.badge-danger]:[background:var(--danger-bg)] [&.badge-danger]:[border-color:var(--danger-border)]',
      ],
    },
  },
  defaultVariants: { tone: 'neutral' },
});
export function Badge({
  children,
  tone,
  className,
  ...props
}: ComponentPropsWithoutRef<'span'> & {
  tone?: 'neutral' | 'warning' | 'danger';
}) {
  return (
    <span className={badge({ tone, className })} {...props}>
      {children}
    </span>
  );
}
