'use client';
import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { IconFileSpreadsheet, IconFileText, IconFileTypePpt, IconFileWord } from '@tabler/icons-react';
import { Button, Card } from './core';
import { FloatingWindow } from './core/floating-window';
import { useWorklog } from '../providers/worklog';
import type { DocumentWindow } from '../infrastructure/use-document-windows';
import { useDocumentEditor } from '../infrastructure/use-document-editor';
import { documentEditorUrl, documentFormat } from '../infrastructure/document-editor';
import { desktopAvailable, errorMessage, native } from '../infrastructure/native';
import { notifications } from '../infrastructure/notifications';

function DocumentLoadingScreen({ filename }: { filename: string }) {
  const format = documentFormat(filename);
  const { Icon, color } = format === 'docx'
    ? { Icon: IconFileWord, color: '#3575cf' }
    : format === 'pptx'
      ? { Icon: IconFileTypePpt, color: '#d76a43' }
      : format === 'xlsx' || format === 'csv'
        ? { Icon: IconFileSpreadsheet, color: '#217346' }
        : { Icon: IconFileText, color: '#888888' };
  return (
    <div
      role="status"
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: `color-mix(in srgb, ${color} 10%, var(--surface))` }}
    >
      <Icon size={64} stroke={1.25} style={{ color }} aria-hidden="true" />
      <span className="sr-only">Opening {filename}…</span>
    </div>
  );
}

function DocumentInstance({ instance, active, nativeShortcuts }: { instance: DocumentWindow; active: boolean; nativeShortcuts: boolean }) {
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
  const navigate = useEffectEvent((direction: -1 | 1) => {
    if (busy || confirmClose || documents.activeId !== instance.id || documents.windows.length < 2) return false;
    documents.navigate(direction);
    return true;
  });
  useEffect(() => {
    if (!active) return;
    function keydown(event: KeyboardEvent) {
      if (nativeShortcuts || !event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.repeat) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (navigate(event.key === 'ArrowLeft' ? -1 : 1)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener('keydown', keydown, true);
    let disposed = false;
    let stop: (() => void) | undefined;
    if (desktopAvailable()) {
      void listen<number>('document-window-navigate', ({ payload }) => {
        if (!disposed && (payload === -1 || payload === 1)) navigate(payload);
      }).then((unlisten) => { if (disposed) unlisten(); else stop = unlisten; })
        .catch((cause) => notifications.error(errorMessage(cause)));
    }
    return () => { disposed = true; stop?.(); window.removeEventListener('keydown', keydown, true); };
  }, [active, nativeShortcuts]);
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
      minimizeTarget={() => documents.dockBounds(instance.id)}
      slideDirection={documents.slideDirection}
      onClose={() => void close()}
      onMinimize={documents.minimize}
    >
      {({ transitioning, sliding }) => {
        const showLoading = !sliding && (transitioning || editor.phase === 'loading');
        return (
          <>
            <iframe
              ref={editor.frame}
              src={url}
              title={`Edit ${instance.file.originalName}`}
              onLoad={editor.loaded}
              onError={() => notifications.error('The document editor could not be loaded.')}
              sandbox="allow-scripts allow-same-origin allow-downloads allow-modals"
              allow="clipboard-read; clipboard-write"
              referrerPolicy="no-referrer"
              inert={confirmClose || showLoading}
              aria-hidden={showLoading || undefined}
              className="block h-full w-full border-0"
            />
            {showLoading && <DocumentLoadingScreen filename={instance.file.originalName} />}
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
          </>
        );
      }}
    </FloatingWindow>
  );
}

export function DocumentWindows() {
  const { documents } = useWorklog();
  const [nativeShortcuts, setNativeShortcuts] = useState(false);
  const canNavigate = documents.activeId !== null && documents.windows.length > 1;
  useEffect(() => {
    if (!desktopAvailable()) return;
    let disposed = false;
    void invoke<boolean>('set_document_shortcuts', { enabled: canNavigate })
      .then((enabled) => { if (!disposed) setNativeShortcuts(enabled); })
      .catch((cause) => { if (!disposed) notifications.error(errorMessage(cause)); });
    return () => { disposed = true; };
  }, [canNavigate]);
  useEffect(() => () => {
    if (desktopAvailable()) void invoke('set_document_shortcuts', { enabled: false }).catch(() => {});
  }, []);
  return (
    <AnimatePresence>
      {documents.windows.map((instance) => (
        <DocumentInstance key={instance.id} instance={instance} active={documents.activeId === instance.id} nativeShortcuts={nativeShortcuts} />
      ))}
    </AnimatePresence>
  );
}
