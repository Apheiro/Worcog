'use client';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Card, Tooltip } from './core';
import { FloatingWindow } from './core/floating-window';
import { useWorklog } from '../providers/worklog';
import type { DocumentWindow } from '../infrastructure/use-document-windows';
import { useDocumentEditor } from '../infrastructure/use-document-editor';
import { documentEditorUrl } from '../infrastructure/document-editor';
import { errorMessage, native } from '../infrastructure/native';
import { notifications } from '../infrastructure/notifications';

function DocumentInstance({ instance, active }: { instance: DocumentWindow; active: boolean }) {
  const { documents, wb } = useWorklog();
  const [url] = useState(documentEditorUrl);
  const [confirmClose, setConfirmClose] = useState(false);
  const [checking, setChecking] = useState(false);
  const persist = useCallback(async (version: string, bytes: ArrayBuffer) => {
    let failure: unknown;
    const saved = await wb.run(async () => {
      try {
        const result = await native.saveDocument(instance.file.id, version, bytes);
        wb.accept(result.workspace);
        if (result.cleanupWarning) notifications.warning(result.cleanupWarning);
        return true;
      } catch (cause) { failure = cause; throw cause; }
    }, 'Document saved locally.');
    if (saved !== true) throw new Error(failure ? errorMessage(failure) : 'Worklog is busy. Keep the document open and retry saving.');
  }, [instance.file.id, wb.run, wb.accept]);
  const editor = useDocumentEditor(instance.file, persist);
  const busy = editor.phase === 'saving' || checking;
  async function close() {
    if (busy) return;
    setChecking(true);
    try {
      if (await editor.hasChanges()) setConfirmClose(true);
      else documents.close(instance.id);
    } catch (cause) {
      notifications.error(errorMessage(cause));
      // If the remote editor cannot confirm its state, never discard silently.
      setConfirmClose(true);
    } finally { setChecking(false); }
  }
  return (
    <FloatingWindow
      title={instance.file.originalName}
      open={active}
      busy={busy || confirmClose}
      onClose={() => void close()}
      onMinimize={documents.minimize}
    >
      <iframe
        ref={editor.frame}
        src={url}
        title={`Edit ${instance.file.originalName}`}
        onLoad={editor.loaded}
        onError={() => notifications.error('The document editor could not be loaded.')}
        sandbox="allow-scripts allow-same-origin allow-downloads allow-modals"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="no-referrer"
        inert={confirmClose}
        className="block h-full w-full border-0"
      />
      {editor.phase === 'loading' && (
        <p role="status" className="pointer-events-none absolute left-3 top-3 m-0 rounded px-3 py-2 text-xs [background:var(--surface)] [color:var(--muted)]">
          Opening {instance.file.originalName}…
        </p>
      )}
      {editor.error && (
        <div role="alert" className="absolute left-3 right-3 top-3 flex flex-wrap items-center gap-3 rounded-md p-3 text-xs [background:var(--surface)] [border:1px_solid_var(--border)]">
          <span className="min-w-0 flex-1">{editor.error}</span>
          <Button size="sm" disabled={wb.busy} onClick={() => void wb.run(() => native.openFile(instance.file.id))}>
            Open with default app
          </Button>
        </div>
      )}
      {confirmClose && (
        <div className="absolute inset-0 flex items-center justify-center p-4 [background:var(--overlay)]">
          <Card className="w-full max-w-md p-5" role="alertdialog" aria-modal="true" aria-labelledby={`${instance.id}-close-title`} aria-describedby={`${instance.id}-close-description`}>
            <h3 id={`${instance.id}-close-title`} className="mb-2 text-sm">Save before closing?</h3>
            <p id={`${instance.id}-close-description`} className="mb-4 text-xs [color:var(--muted)]">
              {instance.file.originalName} may contain unsaved changes. Saving updates the local attachment.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button autoFocus size="sm" disabled={busy} onClick={() => setConfirmClose(false)}>Cancel</Button>
              <Button size="sm" disabled={busy} onClick={() => documents.close(instance.id)}>Discard</Button>
              <Button size="sm" tone="primary" disabled={busy} onClick={() => {
                void editor.save().then((saved) => {
                  if (saved) documents.close(instance.id);
                  else setConfirmClose(false);
                });
              }}>{editor.phase === 'saving' ? 'Saving…' : 'Save & close'}</Button>
            </div>
          </Card>
        </div>
      )}
    </FloatingWindow>
  );
}

export function DocumentWindows() {
  const { documents } = useWorklog();
  const minimized = documents.windows.filter((instance) => instance.id !== documents.activeId);
  return (
    <>
      {documents.windows.map((instance) => (
        <DocumentInstance key={instance.id} instance={instance} active={documents.activeId === instance.id} />
      ))}
      {minimized.length > 0 && createPortal(
        <div aria-label="Minimized documents" className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-40px)] flex-wrap items-center gap-1 rounded-full p-1 [border:1px_solid_var(--border)] [background:var(--surface)] [box-shadow:0_4px_16px_#0002]">
          {minimized.map((instance, index) => (
            <Tooltip key={instance.id} content={instance.file.originalName}>
              <Button tone="ghost" size="icon" className="rounded-full" aria-label={`Restore ${instance.file.originalName}, window ${index + 1}`} onClick={() => documents.restore(instance.id)}>
                <span aria-hidden="true" className="h-2 w-2 rounded-full [background:var(--ink)]" />
              </Button>
            </Tooltip>
          ))}
        </div>, document.body,
      )}
    </>
  );
}
