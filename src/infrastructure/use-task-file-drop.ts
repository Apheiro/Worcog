'use client';

import { useEffect, useRef, useState } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import type { Attachment } from '../domain/model';
import { applyWorkspaceChanges } from '../application/workspace-changes';
import { mergeResourceDrafts } from '../application/task-resources';
import { desktopAvailable, errorMessage, native } from './native';
import { notifications } from './notifications';
import type { Workbench } from './use-workspace';

/** One native subscription for all visible task cards, including child tasks. */
export function useTaskFileDrop(wb: Workbench, disabled: boolean) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const locked = useRef(false);
  const latest = useRef({ wb, disabled });
  latest.current = { wb, disabled };

  useEffect(() => {
    if (!desktopAvailable()) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    async function attach(taskId: string, paths: string[]) {
      if (locked.current || !paths.length) return;
      locked.current = true;
      setPendingId(taskId);
      const drafts: Attachment[] = [];
      let saved = false;
      try {
        for (const path of new Set(paths)) {
          const file = await native.attach(path);
          if (file) drafts.push(file);
        }
        if (!drafts.length) return;
        saved = await latest.current.wb.update((workspace) => {
          if (!workspace.tasks.some((task) => task.id === taskId))
            throw new Error('This task no longer exists.');
          const files = drafts.map((file) => ({ ...file, taskIds: [taskId] }));
          return applyWorkspaceChanges(
            workspace,
            {
              attachments: mergeResourceDrafts(workspace.attachments, files),
            },
            new Date().toISOString(),
          );
        });
        if (!saved) notifications.warning('Files were not attached. Please retry.');
      } catch (cause) {
        notifications.error(errorMessage(cause));
      } finally {
        if (!saved) {
          for (const file of drafts) {
            try {
              await native.discardDraft(file.managedName);
            } catch (cause) {
              notifications.error(errorMessage(cause));
            }
          }
        }
        locked.current = false;
        if (!disposed) setPendingId(null);
      }
    }
    void getCurrentWebview()
      .onDragDropEvent(({ payload }) => {
        if (disposed) return;
        if (payload.type === 'leave') {
          setTargetId(null);
          return;
        }
        const { wb: current, disabled } = latest.current;
        if (disabled || !current.ready || current.busy || locked.current) {
          setTargetId(null);
          return;
        }
        const scale = window.devicePixelRatio;
        const card = document
          .elementFromPoint(payload.position.x / scale, payload.position.y / scale)
          ?.closest<HTMLElement>('[data-task-file-drop]');
        const id = card?.dataset.taskFileDrop ?? null;
        setTargetId(payload.type === 'drop' ? null : id);
        if (payload.type === 'drop' && id) void attach(id, payload.paths);
      })
      .then((unlisten) => {
        if (disposed) unlisten();
        else stop = unlisten;
      })
      .catch((cause) => {
        if (!disposed) notifications.error(errorMessage(cause));
      });
    return () => {
      disposed = true;
      stop?.();
    };
  }, []);

  return { targetId, pendingId };
}
