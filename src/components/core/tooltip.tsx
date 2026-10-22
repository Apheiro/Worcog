'use client';

import * as Primitive from '@radix-ui/react-tooltip';
import type { ReactElement } from 'react';

export function Tooltip({ content, children }: { content: string; children: ReactElement }) {
  return (
    <Primitive.Provider delayDuration={150}>
      <Primitive.Root>
        <Primitive.Trigger asChild>{children}</Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content
            sideOffset={5}
            collisionPadding={8}
            className="z-70 max-w-72 max-h-64 overflow-y-auto rounded-md [border:1px_solid_var(--border)] [background:var(--surface)] [color:var(--ink)] px-3 py-2 text-xs whitespace-pre-wrap [overflow-wrap:anywhere] [box-shadow:0_4px_16px_#0002]"
          >
            {content}
            <Primitive.Arrow className="[fill:var(--surface)]" />
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </Primitive.Provider>
  );
}
