'use client';
import { useRef, useState, type ComponentPropsWithRef, type KeyboardEvent, type SyntheticEvent } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Slot } from '@radix-ui/react-slot';
import { IconArrowLeft, IconArrowRight, IconLink, IconX } from '@tabler/icons-react';
import type { EntityRef } from '../domain/model';
import { entityKey, resolveEntity, sameEntity } from '../domain/entity-links';
import { useWorklog } from '../providers/worklog';
import { Button } from './core';

/** Intercept selection before buttons/checkboxes when choosing a link destination. */
export function useLinkTarget(entity: EntityRef) {
  const { wb, relations } = useWorklog();
  const choosing = !!relations.source;
  const valid = relations.canChoose(entity);
  const highlighted = !!relations.active && (sameEntity(relations.active, entity)
    || relations.targets(relations.active).some((target) => sameEntity(target, entity)));
  function select(event: SyntheticEvent<HTMLElement>) {
    if (!choosing || (event.target instanceof Element && event.target.closest('[data-link-navigate]'))) return;
    event.preventDefault();
    event.stopPropagation();
    if (valid && !wb.busy) void relations.choose(entity);
  }
  return {
    choosing,
    props: {
      'data-entity-kind': entity.kind,
      'data-entity-id': entity.id,
      'data-linked-highlight': highlighted || undefined,
      'data-link-source': sameEntity(relations.source, entity) || undefined,
      'data-link-target': choosing && valid || undefined,
      'aria-description': choosing ? valid ? 'Click to set this item as next after the source.' : 'This item is the source or is already linked.' : undefined,
      ...(choosing ? { tabIndex: 0 } : {}),
      onClickCapture: select,
      onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') select(event);
      },
    },
  };
}

export function EntityLinkTarget({ entity, className, ...props }: ComponentPropsWithRef<typeof Slot> & { entity: EntityRef }) {
  const target = useLinkTarget(entity);
  return <Slot {...props} {...target.props} tabIndex={target.choosing ? 0 : props.tabIndex}
    className={`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus)] [&[data-link-source=true]]:[background:var(--selected)] [&[data-link-target=true]]:cursor-crosshair [&[data-link-target=true]:hover]:[background:var(--selected)] ${className ?? ''}`} />;
}

export function EntityLinks({ entity, className = '', onOpen }: { entity: EntityRef; className?: string; onOpen?: () => void }) {
  const { w, wb, relations, openLinkedEntity } = useWorklog();
  const connections = relations.connections(entity);
  if (!connections.length) return null;
  return (
    <ul className={`m-0 flex list-none flex-wrap gap-1.5 p-0 ${className}`} aria-label="Related items">
      {connections.map(({ target, direction }) => {
        const item = resolveEntity(w, target);
        if (!item) return null;
        const topicName = target.kind === 'task' ? w.topics.find((topic) => topic.id === w.tasks.find((task) => task.id === target.id)?.topicId)?.title : undefined;
        const relation = direction === 'incoming' ? 'Previous' : direction === 'outgoing' ? 'Next' : 'Related';
        const label = `${relation} · ${target.kind === 'task' ? 'Task' : 'Topic'}: ${item.title}${topicName ? ` · ${topicName}` : ''}`;
        const Icon = direction === 'incoming' ? IconArrowLeft : direction === 'outgoing' ? IconArrowRight : IconLink;
        return (
          <li key={entityKey(target)} className="group/connection inline-flex min-w-0 max-w-full items-center gap-0.5">
            <Button tone="chip" size="auto" disabled={wb.busy || !!relations.source} title={label} aria-label={`Open linked ${label}`} onClick={() => { openLinkedEntity(target); onOpen?.(); }} className="min-w-0 max-w-full">
              <Icon size={13} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{relation}: {item.title}</span>
            </Button>
            <Button tone="ghost" size="auto" disabled={wb.busy || !!relations.source} aria-label={`Unlink ${label}`} title="Unlink" onClick={() => void relations.unlink(entity, target)} className="h-5 w-5 shrink-0 p-0 opacity-0 group-hover/connection:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
              <IconX size={12} aria-hidden="true" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export function EntityLinkIndicator({ entity }: { entity: EntityRef }) {
  const { relations } = useWorklog();
  const [open, setOpen] = useState(false);
  const openingItem = useRef(false);
  const targets = relations.targets(entity);
  if (!targets.length || relations.source) return null;
  const highlighted = sameEntity(relations.active, entity)
    || (!!relations.active && relations.targets(relations.active).some((ref) => sameEntity(ref, entity)));
  return (
    <Popover.Root open={open} onOpenChange={(next) => { setOpen(next); relations.pin(next ? entity : null); }}>
      <Popover.Trigger asChild>
        <Button
          tone="ghost" size="auto"
          aria-label={`${targets.length} related items. Show connections.`}
          title="Related items"
          onPointerEnter={() => relations.hover(entity)}
          onPointerLeave={() => relations.clearHover(entity)}
          onFocus={() => relations.hover(entity)}
          onBlur={() => relations.clearHover(entity)}
          className="absolute -left-2 top-1/2 z-20 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full p-0"
        >
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full [box-shadow:0_0_0_2px_var(--surface)] ${highlighted ? '[background:var(--ink)]' : '[background:var(--muted)]'}`} />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="left" sideOffset={8} collisionPadding={10} aria-label="Related items"
          onCloseAutoFocus={(event) => { if (openingItem.current) event.preventDefault(); openingItem.current = false; }}
          className="z-60 max-w-80 rounded-md p-3 [background:var(--surface)] [border:1px_solid_var(--border)] [box-shadow:0_4px_16px_#0002]">
          <EntityLinks entity={entity} onOpen={() => { openingItem.current = true; setOpen(false); }} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function LinkingBanner() {
  const { w, wb, relations } = useWorklog();
  if (!relations.source) return null;
  const source = resolveEntity(w, relations.source);
  if (!source) return null;
  return (
    <div className="flex shrink-0 items-center gap-3 px-5 py-2 text-xs [background:var(--surface-soft)] [border-bottom:1px_solid_var(--border)]">
      <IconLink size={15} className="shrink-0" aria-hidden="true" />
      <span role="status" className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        Previous: <strong>{source.title}</strong> → Click the next task or topic. Navigate freely. Escape cancels.
      </span>
      <Button size="sm" disabled={wb.busy} onClick={relations.cancel}>Cancel</Button>
    </div>
  );
}
