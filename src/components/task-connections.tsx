'use client';
import { useId, useLayoutEffect, useState, type RefObject } from 'react';
import { entityLinks, linkKey, sameEntity } from '../domain/entity-links';
import { useWorcog } from '../providers/worcog';

/** Draw in the list's left gutter; the solid subtask tree remains independent. */
export function TaskConnections({ container }: { container: RefObject<HTMLDivElement | null> }) {
  const { w, relations } = useWorcog();
  const active = relations.active;
  const arrowId = useId();
  const [paths, setPaths] = useState<{ key: string; d: string; directed: boolean }[]>([]);
  useLayoutEffect(() => {
    const root = container.current;
    if (!root || active?.kind !== 'task') { setPaths([]); return; }
    const element = root;
    const selected = active;
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    function measure() {
      frame = 0;
      const origin = element.getBoundingClientRect();
      const rows = new Map<string, DOMRect>();
      for (const row of element.querySelectorAll<HTMLElement>('[data-entity-kind="task"]')) {
        if (row.dataset.entityId) rows.set(row.dataset.entityId, row.getBoundingClientRect());
        resize.observe(row);
      }
      const next: typeof paths = [];
      for (const link of entityLinks(w)) {
        if (link.from.kind !== 'task' || link.to.kind !== 'task'
          || (!sameEntity(link.from, selected) && !sameEntity(link.to, selected))) continue;
        const from = rows.get(link.from.id);
        const to = rows.get(link.to.id);
        if (!from || !to) continue;
        const x = from.left - origin.left + 24;
        const y = from.top - origin.top + from.height / 2;
        const endX = to.left - origin.left + 24;
        const endY = to.top - origin.top + to.height / 2;
        const lane = 12 - (next.length % 3) * 4;
        const direction = endY >= y ? 1 : -1;
        const radius = Math.min(6, Math.abs(endY - y) / 2);
        next.push({ key: linkKey(link), directed: link.directed,
          d: `M ${x} ${y} H ${lane + radius} Q ${lane} ${y}, ${lane} ${y + direction * radius} V ${endY - direction * radius} Q ${lane} ${endY}, ${lane + radius} ${endY} H ${endX}` });
      }
      setPaths(next);
    }
    measure();
    resize.observe(root);
    const mutation = new MutationObserver(schedule);
    const list = root.querySelector('.task-list');
    if (list) mutation.observe(list, { childList: true, subtree: true });
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); };
  }, [container, w, active]);
  return paths.length ? (
    <svg aria-hidden="true" className="pointer-events-none absolute -left-6 top-0 h-full w-[calc(100%_+_24px)] overflow-visible [color:var(--secondary)]">
      <defs>
        <marker id={arrowId} markerWidth={7} markerHeight={6} refX={6} refY={3} orient="auto" markerUnits="userSpaceOnUse">
          <path d="M 0 0 L 6 3 L 0 6" fill="none" stroke="currentColor" strokeWidth={1} />
        </marker>
      </defs>
      {paths.map((path) => <path key={path.key} d={path.d} fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray="3 4" strokeLinecap="round" markerEnd={path.directed ? `url(#${arrowId})` : undefined} />)}
    </svg>
  ) : null;
}
