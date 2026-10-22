'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { documentEditorOrigin, documentFormat, documentHash, maxDocumentSize } from './document-editor';
import { errorMessage, native } from './native';

const messageSchema = z.object({
  id: z.string().optional(),
  type: z.string().startsWith('document:'),
  payload: z.object({
    dirty: z.boolean().optional(),
    hasDocument: z.boolean().optional(),
    message: z.string().optional(),
    file: z.instanceof(Blob).optional(),
  }).passthrough().optional(),
});
type EditorMessage = z.infer<typeof messageSchema>;
type Pending = {
  resolve: (message: EditorMessage) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export function useDocumentEditor(
  file: { id: string; originalName: string },
  persist: (version: string, bytes: ArrayBuffer) => Promise<void>,
) {
  const frame = useRef<HTMLIFrameElement>(null);
  const pending = useRef(new Map<string, Pending>());
  const version = useRef('');
  const started = useRef(false);
  const opened = useRef(false);
  const frameLoaded = useRef(false);
  const saving = useRef(false);
  const dirtyRef = useRef(false);
  const editGeneration = useRef(0);
  const recovery = useRef<ArrayBuffer | null>(null);
  const alive = useRef(true);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const setChanged = useCallback((value: boolean) => {
    dirtyRef.current = value;
    setDirty(value);
  }, []);

  const command = useCallback((type: string, payload: Record<string, unknown> = {}, timeout = 120_000) => {
    return new Promise<EditorMessage>((resolve, reject) => {
      const target = frame.current?.contentWindow;
      if (!target) { reject(new Error('The document editor is unavailable.')); return; }
      const id = crypto.randomUUID();
      const timer = setTimeout(() => {
        pending.current.delete(id);
        reject(new Error('The editor did not respond. Keep this document open and retry, or use the default application.'));
      }, timeout);
      pending.current.set(id, { resolve, reject, timer });
      target.postMessage({ id, type, payload }, documentEditorOrigin);
    });
  }, []);

  const storeExport = useCallback(async (message: EditorMessage) => {
    const generation = editGeneration.current;
    const blob = message.payload?.file;
    if (!blob || blob.size < 1 || blob.size > maxDocumentSize)
      throw new Error('The editor returned an invalid document. The original was preserved.');
    const bytes = await blob.arrayBuffer();
    recovery.current = bytes;
    setChanged(true);
    const hash = await documentHash(bytes);
    await persistRef.current(version.current, bytes);
    version.current = hash;
    recovery.current = null;
    setChanged(message.payload?.dirty === true || editGeneration.current !== generation);
  }, [setChanged]);

  useEffect(() => {
    alive.current = true;
    const waiting = pending.current;
    const startupTimer = setTimeout(() => {
      if (!opened.current) {
        setError('The remote editor could not open this document. Check your connection or use the default application.');
        setPhase('error');
      }
    }, 120_000);
    async function open() {
      if (started.current) return;
      started.current = true;
      try {
        const bytes = await native.readDocument(file.id);
        const hash = await documentHash(bytes);
        if (!alive.current) return;
        version.current = hash;
        await command('document:open-buffer', { fileName: file.originalName, buffer: bytes, readonly: false });
        if (!alive.current) return;
        opened.current = true;
        clearTimeout(startupTimer);
        setPhase('ready');
      } catch (cause) {
        if (alive.current) { setError(errorMessage(cause)); setPhase('error'); }
      }
    }
    function receive(event: MessageEvent) {
      if (event.origin !== documentEditorOrigin || event.source !== frame.current?.contentWindow) return;
      const parsed = messageSchema.safeParse(event.data);
      if (!parsed.success) return;
      const message = parsed.data;
      if (message.type === 'document:ready') void open();
      if (message.type === 'document:state' && !started.current) void open();
      if (message.type === 'document:dirty-changed') {
        if (message.payload?.dirty === true) editGeneration.current++;
        setChanged(message.payload?.dirty === true || recovery.current !== null || saving.current);
      }
      const request = message.id ? waiting.get(message.id) : undefined;
      if (request && message.id) {
        // Only terminal responses settle commands; progress/dirty events do not.
        if (['document:opened', 'document:saved', 'document:state', 'document:readonly-changed', 'document:error'].includes(message.type)) {
          waiting.delete(message.id);
          clearTimeout(request.timer);
          if (message.type === 'document:error') request.reject(new Error(message.payload?.message || 'The editor could not complete the operation.'));
          else request.resolve(message);
        }
      } else if (message.type === 'document:saved' && opened.current && !saving.current) {
        saving.current = true;
        setPhase('saving');
        void storeExport(message).then(() => {
          if (alive.current) { setError(''); setPhase('ready'); }
        }).catch((cause) => {
          if (alive.current) { setError(errorMessage(cause)); setPhase('error'); }
        }).finally(() => { saving.current = false; });
      } else if (message.type === 'document:error') {
        setError(message.payload?.message || 'The document editor reported an error.');
      }
    }
    window.addEventListener('message', receive);
    return () => {
      alive.current = false;
      clearTimeout(startupTimer);
      window.removeEventListener('message', receive);
      for (const request of waiting.values()) {
        clearTimeout(request.timer);
        request.reject(new Error('The document window was closed.'));
      }
      waiting.clear();
    };
  }, [file.id, file.originalName, command, setChanged, storeExport]);

  function loaded() {
    if (frameLoaded.current && opened.current) {
      setError('The editor page reloaded. Unsaved changes may have been lost; reopen the saved attachment.');
      setPhase('error');
      return;
    }
    frameLoaded.current = true;
    // Also covers a ready event emitted before the iframe load event.
    frame.current?.contentWindow?.postMessage({ type: 'document:get-state' }, documentEditorOrigin);
  }
  async function hasChanges() {
    if (!opened.current || saving.current) return dirtyRef.current || saving.current;
    const state = await command('document:get-state', {}, 8_000);
    const changed = state.payload?.dirty === true || dirtyRef.current || recovery.current !== null;
    setChanged(changed);
    return changed;
  }
  async function save() {
    if (!opened.current || saving.current) return false;
    saving.current = true;
    setPhase('saving');
    setError('');
    try {
      // Export again even after a failed disk save: edits may have continued meanwhile.
      const message = await command('document:save', { targetExt: documentFormat(file.originalName)?.toUpperCase() });
      await storeExport(message);
      setPhase('ready');
      if (dirtyRef.current) setError('The document was saved, but newer edits remain. Save again before closing.');
      return !dirtyRef.current;
    } catch (cause) {
      setChanged(true);
      setError(errorMessage(cause));
      setPhase('error');
      return false;
    } finally { saving.current = false; }
  }
  return { frame, phase, error, dirty, loaded, hasChanges, save };
}
