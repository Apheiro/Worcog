'use client';
import * as Primitive from '@radix-ui/react-tabs';
import type { ComponentPropsWithRef } from 'react';
import { cva } from 'cva';

const list = cva({
  base: 'flex flex-wrap gap-1 mb-6 p-1 rounded-md [border:1px_solid_var(--border)] [background:var(--surface-soft)] w-fit',
});
const trigger = cva({
  base: 'rounded px-4 py-2 text-xs font-medium border-0 bg-transparent [color:var(--muted)] hover:[color:var(--ink)] data-[state=active]:[background:var(--surface)] data-[state=active]:[color:var(--ink)] data-[state=active]:[box-shadow:0_1px_3px_#0001] focus-visible:[outline:2px_solid_var(--focus)] focus-visible:[outline-offset:2px]',
});

export const Tabs = Primitive.Root;
export function TabsList({ className, ...props }: ComponentPropsWithRef<typeof Primitive.List>) {
  return <Primitive.List className={list({ className })} {...props} />;
}
export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithRef<typeof Primitive.Trigger>) {
  return <Primitive.Trigger className={trigger({ className })} {...props} />;
}
export function TabsContent({
  className,
  ...props
}: ComponentPropsWithRef<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      className={['data-[state=inactive]:hidden', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
