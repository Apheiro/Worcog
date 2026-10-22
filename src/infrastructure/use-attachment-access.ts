'use client';
import { useCallback, useEffect, useState } from 'react';
import type { Attachment } from '../domain/model';
import { desktopAvailable, native, type AttachmentStatus } from './native';

export function useAttachmentAccess(files: Attachment[]) {
  const [statuses, setStatuses] = useState<Record<string, AttachmentStatus>>({});
  useEffect(() => {
    if (!desktopAvailable()) return;
    let active = true;
    void native.attachmentStatuses().then((next) => {
      if (active) setStatuses(next);
    }).catch(() => {
      // Availability is derived UI state; failure must not block workspace editing.
      if (active) setStatuses(Object.fromEntries(files.map((file) => [file.id, 'inaccessible' as const])));
    });
    return () => { active = false; };
  }, [files]);
  const check = useCallback(async (id: string) => {
    const next = await native.attachmentStatuses(id);
    const status = next[id] ?? 'missing';
    setStatuses((current) => ({ ...current, [id]: status }));
    return status;
  }, []);
  return { statuses, check };
}
