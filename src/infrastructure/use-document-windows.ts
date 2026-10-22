'use client';
import { useState } from 'react';
import type { Attachment } from '../domain/model';

export type DocumentWindow = { id: string; file: Attachment };

/** Instances belong to the workspace lifetime, so routing never unloads an editor. */
export function useDocumentWindows() {
  const [windows, setWindows] = useState<DocumentWindow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  function open(file: Attachment) {
    const id = crypto.randomUUID();
    setWindows((current) => [...current, { id, file }]);
    setActiveId(id);
  }
  function close(id: string) {
    setWindows((current) => current.filter((window) => window.id !== id));
    setActiveId((current) => current === id ? null : current);
  }
  return { windows, activeId, open, close, restore: setActiveId, minimize: () => setActiveId(null) };
}
