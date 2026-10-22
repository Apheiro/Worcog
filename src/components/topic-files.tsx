'use client';
import { useRef, useState } from 'react';
import { IconPaperclip } from '@tabler/icons-react';
import type { Attachment } from '../domain/model';
import { applyWorkspaceChanges } from '../application/workspace-changes';
import { errorMessage, native } from '../infrastructure/native';
import { notifications } from '../infrastructure/notifications';
import type { Workbench } from '../infrastructure/use-workspace';
import { Button } from './core';
import { FileList } from './work-lists';

export function TopicFiles({ topicId, files, wb, open, manage, onDelete }: {
  topicId: string;
  files: Attachment[];
  wb: Workbench;
  open: (id: string) => void;
  manage: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const locked = useRef(false);
  const [uploading, setUploading] = useState(false);
  async function attach() {
    if (locked.current || wb.busy) return;
    locked.current = true;
    setUploading(true);
    let draft: Attachment | null = null;
    let saved = false;
    try {
      draft = await native.attach();
      if (!draft) return;
      const file = { ...draft, topicIds: [topicId] };
      saved = await wb.update((workspace) => {
        if (!workspace.topics.some((topic) => topic.id === topicId))
          throw new Error('This topic no longer exists.');
        return applyWorkspaceChanges(workspace, {
          attachments: [...workspace.attachments, file],
        }, new Date().toISOString());
      });
    } catch (cause) {
      notifications.error(errorMessage(cause));
    } finally {
      if (draft && !saved) {
        try { await native.discardDraft(draft.managedName); }
        catch (cause) { notifications.error(errorMessage(cause)); }
      }
      locked.current = false;
      setUploading(false);
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs [color:var(--muted)]">General topic files and attachments from its tasks.</p>
        <Button size="sm" disabled={wb.busy || uploading} onClick={() => void attach()}>
          <IconPaperclip size={15} /> {uploading ? 'Attaching…' : 'Attach file'}
        </Button>
      </div>
      <FileList files={files} open={open} manage={manage} onDelete={onDelete} />
    </div>
  );
}
