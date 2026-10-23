'use client';
import { useRef, useState } from 'react';
import type { Attachment } from '../domain/model';

export type DocumentWindow = { id: string; file: Attachment };

/** Instances belong to the workspace lifetime, so routing never unloads an editor. */
export function useDocumentWindows() {
  const [windows, setWindows] = useState<DocumentWindow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<-1 | 0 | 1>(0);
  const dockTargets = useRef(new Map<string, HTMLElement>());
  const dockOrigins = useRef(new Map<string, DOMRect>());
  function registerDockTarget(id: string, element: HTMLElement | null) {
    const previous = dockTargets.current.get(id);
    if (previous) dockOrigins.current.set(id, previous.getBoundingClientRect());
    if (element) dockTargets.current.set(id, element);
    else dockTargets.current.delete(id);
  }
  function dockBounds(id: string) {
    return dockTargets.current.get(id)?.getBoundingClientRect() ?? dockOrigins.current.get(id);
  }
  function restore(id: string) {
    const target = dockTargets.current.get(id);
    if (target) dockOrigins.current.set(id, target.getBoundingClientRect());
    setSlideDirection(0);
    setActiveId(id);
  }
  function navigate(direction: -1 | 1) {
    if (!activeId || windows.length < 2) return;
    const current = windows.findIndex((instance) => instance.id === activeId);
    if (current < 0) return;
    setSlideDirection(direction);
    setActiveId(windows[(current + direction + windows.length) % windows.length].id);
  }
  function open(file: Attachment) {
    const id = crypto.randomUUID();
    setWindows((current) => [...current, { id, file }]);
    setSlideDirection(0);
    setActiveId(id);
  }
  function close(id: string) {
    dockTargets.current.delete(id);
    dockOrigins.current.delete(id);
    setWindows((current) => current.filter((window) => window.id !== id));
    setActiveId((current) => current === id ? null : current);
  }
  function minimize() {
    setSlideDirection(0);
    setActiveId(null);
  }
  return { windows, activeId, slideDirection, open, close, restore, minimize, navigate, registerDockTarget, dockBounds };
}
