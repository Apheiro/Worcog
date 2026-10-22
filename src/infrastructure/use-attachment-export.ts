'use client';

import { useState } from 'react';
import type { Workspace } from '../domain/model';
import type { Workbench } from './use-workspace';
import { native } from './native';
import { notifications } from './notifications';

export function useAttachmentExport(workspace: Workspace, wb: Workbench) {
  const [ids, setIds] = useState<string[]>([]);
  const selected = workspace.attachments.filter((file) => ids.includes(file.id));
  const selectedIds = new Set(selected.map((file) => file.id));

  function toggle(id: string) {
    if (!wb.ready || wb.busy) return;
    setIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }
  async function exportFiles() {
    if (!selected.length || !wb.ready || wb.busy) return;
    const exportedIds = selected.map((file) => file.id);
    const path = await wb.run(() => native.exportFiles(exportedIds));
    if (typeof path === 'string') {
      setIds((current) => current.filter((id) => !exportedIds.includes(id)));
      notifications.success(`${exportedIds.length === 1 ? 'File' : 'ZIP'} exported to ${path}`);
    }
  }
  return { selected, selectedIds, toggle, clear: () => setIds([]), exportFiles };
}
