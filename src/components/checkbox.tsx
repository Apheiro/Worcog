'use client';

import * as Primitive from '@radix-ui/react-checkbox';
import { IconCheck, IconMinus } from '@tabler/icons-react';
import { cva } from 'cva';
import type { ComponentPropsWithRef } from 'react';

const checkbox = cva({
  base: 'checkbox',
  variants: { appearance: { default: '', task: 'task-checkbox' } },
  defaultVariants: { appearance: 'default' },
});

type CheckboxProps = Omit<ComponentPropsWithRef<typeof Primitive.Root>, 'children' | 'asChild'> & {
  appearance?: 'default' | 'task';
};

export function Checkbox({ appearance, className, ...props }: CheckboxProps) {
  return (
    <Primitive.Root className={checkbox({ appearance, className })} {...props}>
      <Primitive.Indicator className="checkbox-indicator">
        <IconCheck size={14} stroke={2.5} aria-hidden="true" className="checkbox-check" />
        <IconMinus size={14} stroke={2.5} aria-hidden="true" className="checkbox-mixed" />
      </Primitive.Indicator>
    </Primitive.Root>
  );
}
