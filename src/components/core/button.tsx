'use client';

import { cva, type VariantProps } from 'cva';
import type { ComponentPropsWithRef } from 'react';

const button = cva({
  base: 'button inline-flex items-center justify-center gap-2 rounded-[5px] font-[550] [line-height:1.2] [color:var(--ink)] disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:[outline-color:var(--focus)]',
  variants: {
    tone: {
      quiet:
        'button-quiet [border:1px_solid_var(--border)] [background:var(--surface)] [&:hover:not(:disabled)]:[background:var(--hover)] [&:hover:not(:disabled)]:[border-color:var(--border-strong)]',
      primary:
        'button-primary [border:1px_solid_var(--primary)] [background:var(--primary)] [color:var(--on-primary)] [&:hover:not(:disabled)]:[background:var(--primary-hover)]',
      danger:
        'button-danger [border:1px_solid_var(--danger-fill)] [background:var(--danger-fill)] [color:var(--on-danger)] [&:hover:not(:disabled)]:[background:var(--danger-fill-hover)]',
      ghost:
        'button-ghost border border-transparent bg-transparent [&:hover:not(:disabled)]:[background:var(--hover)]',
      link: 'title-link border-0 bg-transparent p-0 text-left [overflow-wrap:anywhere] [&:hover:not(:disabled)]:underline underline-offset-3',
      chip: 'source-chip [border:1px_solid_var(--border)] [background:var(--surface-soft)] [color:var(--secondary)] px-[7px] py-[3px] text-[11px] font-normal text-left [overflow-wrap:anywhere] [&:hover:not(:disabled)]:[background:var(--hover)]',
      row: 'action-row w-full justify-start rounded-none border-0 [border-bottom:1px_solid_var(--border)] [background:var(--surface)] px-5 py-[14px] text-left text-[13px] last:border-b-0 [&:hover:not(:disabled)]:[background:var(--canvas)] [&_strong]:font-[550]',
    },
    size: {
      md: 'px-3 py-2 min-h-9 text-[13px] whitespace-nowrap',
      sm: 'button-sm px-2 py-[5px] min-h-[29px] text-xs whitespace-nowrap',
      icon: 'w-8 h-8 p-0 shrink-0',
      auto: '',
    },
  },
  defaultVariants: { tone: 'quiet', size: 'md' },
});

export type ButtonProps = ComponentPropsWithRef<'button'> & VariantProps<typeof button>;

export function Button({ tone, size, className, ...props }: ButtonProps) {
  return <button className={button({ tone, size, className })} {...props} />;
}
