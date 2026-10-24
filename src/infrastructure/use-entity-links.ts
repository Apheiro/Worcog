'use client';
import { useEffect, useMemo, useState } from 'react';
import type { EntityRef } from '../domain/model';
import { entityKey, entityLinks, resolveEntity, sameEntity, type EntityConnection } from '../domain/entity-links';
import { connectEntities, disconnectEntities } from '../application/entity-links';
import type { Workbench } from './use-workspace';

export function useEntityLinks(wb: Workbench) {
  const [source, setSource] = useState<EntityRef | null>(null);
  const [hovered, setHovered] = useState<EntityRef | null>(null);
  const [pinned, setPinned] = useState<EntityRef | null>(null);
  const { targets, connections } = useMemo(() => {
    const index = new Map<string, EntityConnection[]>();
    for (const { from, to, directed } of entityLinks(wb.workspace)) {
      index.set(entityKey(from), [...(index.get(entityKey(from)) ?? []), { target: to, direction: directed ? 'outgoing' : 'related' }]);
      index.set(entityKey(to), [...(index.get(entityKey(to)) ?? []), { target: from, direction: directed ? 'incoming' : 'related' }]);
    }
    const connections = (ref: EntityRef) => index.get(entityKey(ref)) ?? [];
    return { connections, targets: (ref: EntityRef) => connections(ref).map((link) => link.target) };
  }, [wb.workspace]);
  const existing = source ? targets(source) : [];
  useEffect(() => {
    if (!source) return;
    function keydown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setSource(null);
    }
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  }, [source]);
  useEffect(() => {
    if (source && !resolveEntity(wb.workspace, source)) setSource(null);
  }, [wb.workspace, source]);
  function clearHighlight() { setHovered(null); setPinned(null); }
  function start(ref: EntityRef) {
    if (wb.busy || !resolveEntity(wb.workspace, ref)) return;
    clearHighlight();
    setSource(ref);
  }
  const canChoose = (ref: EntityRef) => !!source && !sameEntity(source, ref)
    && !!resolveEntity(wb.workspace, ref) && !existing.some((item) => sameEntity(item, ref));
  async function choose(ref: EntityRef) {
    if (wb.busy || !source || !canChoose(ref)) return;
    const saved = await wb.update((workspace) => connectEntities(workspace, source, ref), {}, false);
    if (saved) setSource(null);
  }
  return {
    source, start, canChoose, choose, targets, connections,
    cancel: () => setSource(null),
    active: pinned ?? hovered,
    hover: setHovered,
    clearHover: (ref: EntityRef) => setHovered((current) => sameEntity(current, ref) ? null : current),
    pin: setPinned,
    clearHighlight,
    unlink: (from: EntityRef, to: EntityRef) => wb.update((workspace) => disconnectEntities(workspace, from, to), {}, false),
  };
}
