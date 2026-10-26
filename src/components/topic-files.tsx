'use client';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { IconPaperclip } from '@tabler/icons-react';
import type { Attachment } from '../domain/model';
import { applyWorkspaceChanges } from '../application/workspace-changes';
import { errorMessage, native } from '../infrastructure/native';
import { notifications } from '../infrastructure/notifications';
import type { Workbench } from '../infrastructure/use-workspace';
import { Button } from './core';
import { AttachmentStatus } from './attachment-status';

export function TopicFiles({
  topicId,
  files,
  wb,
  open,
}: {
  topicId: string;
  files: Attachment[];
  wb: Workbench;
  open: (id: string) => void;
}) {
  const tr = useTranslations('ui');
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
          throw new Error(tr('this_topic_no_longer_exists'));
        return applyWorkspaceChanges(
          workspace,
          {
            attachments: [...workspace.attachments, file],
          },
          new Date().toISOString(),
        );
      });
    } catch (cause) {
      notifications.error(errorMessage(cause));
    } finally {
      if (draft && !saved) {
        try {
          await native.discardDraft(draft.managedName);
        } catch (cause) {
          notifications.error(errorMessage(cause));
        }
      }
      locked.current = false;
      setUploading(false);
    }
  }
  return (
    <ul
      className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 [&_li]:min-w-0 [&_li]:max-w-full"
      aria-label={tr('general_topic_files')}
    >
      {files.map((file) => (
        <li key={file.id}>
          <Button
            tone="chip"
            size="auto"
            type="button"
            className="max-w-full text-left [&_span]:[overflow-wrap:anywhere] [&_svg]:shrink-0"
            aria-label={tr('open_file_value0', { value0: file.originalName })}
            disabled={wb.busy}
            onClick={() => open(file.id)}
          >
            <IconPaperclip size={13} aria-hidden="true" />
            <span>
              {file.originalName}
              <AttachmentStatus id={file.id} />
            </span>
          </Button>
        </li>
      ))}
      <li>
        <Button
          type="button"
          tone="ghost"
          size="auto"
          className="px-1.5 py-1 text-[11px] font-normal [color:var(--muted)]"
          disabled={wb.busy || uploading}
          onClick={() => void attach()}
        >
          <IconPaperclip size={13} aria-hidden="true" />{' '}
          {uploading ? tr('attaching') : tr('attach_file')}
        </Button>
      </li>
    </ul>
  );
}
