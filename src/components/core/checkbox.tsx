'use client';

import * as Primitive from '@radix-ui/react-checkbox';
import { IconCheck, IconMinus } from '@tabler/icons-react';
import { cva } from 'cva';
import type { ComponentPropsWithRef } from 'react';

const checkbox = cva({
  base: [
    'checkbox',
    'inline-flex items-center justify-center shrink-0 w-5 h-5 p-0 rounded [border:1px_solid_var(--border-strong)] [background:var(--surface)] [color:var(--secondary)]',
    '[&:hover:not(:disabled)]:[border-color:var(--focus)]',
    '[&:focus-visible]:[outline:none] [&:focus-visible]:[border-color:var(--focus)]',
    '[&[data-state=checked]]:[background:var(--checkbox-fill)] [&[data-state=checked]]:[border-color:var(--checkbox-fill)] [&[data-state=checked]]:[color:var(--checkbox-mark)]',
    '[&[data-state=indeterminate]]:[background:var(--checkbox-fill)] [&[data-state=indeterminate]]:[border-color:var(--checkbox-fill)] [&[data-state=indeterminate]]:[color:var(--checkbox-mark)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  variants: {
    appearance: {
      default: '',
      task: [
        'task-checkbox',
        '[&.task-checkbox]:w-6 [&.task-checkbox]:h-6 [&.task-checkbox]:rounded-md',
      ],
    },
  },
  defaultVariants: { appearance: 'default' },
});

type CheckboxProps = Omit<ComponentPropsWithRef<typeof Primitive.Root>, 'children' | 'asChild'> & {
  appearance?: 'default' | 'task';
};

export function Checkbox({ appearance, className, ...props }: CheckboxProps) {
  return (
    <Primitive.Root className={checkbox({ appearance, className })} {...props}>
      <Primitive.Indicator className="checkbox-indicator flex items-center justify-center [&_.checkbox-mixed]:hidden [&[data-state=indeterminate]_.checkbox-mixed]:block [&[data-state=indeterminate]_.checkbox-check]:hidden">
        <IconCheck size={14} stroke={2.5} aria-hidden="true" className="checkbox-check" />
        <IconMinus size={14} stroke={2.5} aria-hidden="true" className="checkbox-mixed" />
      </Primitive.Indicator>
    </Primitive.Root>
  );
}
