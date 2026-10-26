'use client';
import { useTranslations } from 'next-intl';

import { useResizeObserver } from '@mantine/hooks';
import { IconDownload, IconX } from '@tabler/icons-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWorcog } from '../providers/worcog';
import { Button, Tooltip } from './core';

export function WorkspaceDock() {
  const tr = useTranslations('ui');
  const { documents, attachmentExport, wb } = useWorcog();
  const minimized = documents.windows.filter((instance) => instance.id !== documents.activeId);
  const visible = minimized.length > 0 || attachmentExport.selected.length > 0;
  const [ref, bounds] = useResizeObserver<HTMLDivElement>();
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      '--worcog-dock-height',
      `${visible && bounds.height ? bounds.height + 12 : 0}px`,
    );
    return () => {
      root.style.removeProperty('--worcog-dock-height');
    };
  }, [bounds.height, visible]);
  if (!visible) return null;
  return createPortal(
    <div
      ref={ref}
      inert={documents.activeId !== null}
      aria-label={tr('workspace_actions')}
      className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-40px)] flex-col items-end gap-2"
    >
      {attachmentExport.selected.length > 0 && (
        <div className="flex items-center gap-1 rounded-full p-1 [border:1px_solid_var(--border)] [background:var(--surface)] [box-shadow:0_4px_16px_#0002]">
          <Button
            tone="ghost"
            size="sm"
            className="rounded-full"
            disabled={wb.busy}
            onClick={() => void attachmentExport.exportFiles()}
          >
            <IconDownload size={15} aria-hidden="true" /> {tr('export')}{' '}
            {attachmentExport.selected.length})
          </Button>
          <Button
            tone="ghost"
            size="icon"
            className="rounded-full"
            disabled={wb.busy}
            aria-label={tr('clear_file_selection')}
            title={tr('clear_selection')}
            onClick={attachmentExport.clear}
          >
            <IconX size={15} aria-hidden="true" />
          </Button>
        </div>
      )}
      {minimized.length > 0 && (
        <div
          aria-label={tr('minimized_documents')}
          className="flex max-w-full flex-wrap items-center justify-end gap-1 rounded-full p-1 [border:1px_solid_var(--border)] [background:var(--surface)] [box-shadow:0_4px_16px_#0002]"
        >
          {minimized.map((instance, index) => (
            <Tooltip key={instance.id} content={instance.file.originalName}>
              <Button
                tone="ghost"
                size="icon"
                className="rounded-full"
                aria-label={tr('restore_value0_window_value1', {
                  value0: instance.file.originalName,
                  value1: index + 1,
                })}
                onClick={() => documents.restore(instance.id)}
              >
                <span
                  ref={(element) => documents.registerDockTarget(instance.id, element)}
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full [background:var(--ink)]"
                />
              </Button>
            </Tooltip>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
