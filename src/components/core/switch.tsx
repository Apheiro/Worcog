'use client';

import * as Primitive from '@radix-ui/react-switch';
import type { ComponentPropsWithRef } from 'react';

export function Switch({ className = '', ...props }: ComponentPropsWithRef<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 [border:1px_solid_var(--border-strong)] [background:var(--surface-soft)] data-[state=checked]:[background:var(--primary)] data-[state=checked]:[border-color:var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:[outline-color:var(--focus)] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
      {...props}
    >
      <Primitive.Thumb className="block h-3.5 w-3.5 rounded-full [background:var(--secondary)] data-[state=checked]:[background:var(--on-primary)] data-[state=checked]:translate-x-4 transition-transform motion-reduce:transition-none" />
    </Primitive.Root>
  );
}
