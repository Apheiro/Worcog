'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { notifications } from './notifications';
import { emptyWorkspace, type Workspace } from '../domain/model';
import { generateOccurrences } from '../application/workspace';
import {
  desktopAvailable,
  errorMessage,
  repository,
  type SaveOptions,
  type WorkspaceResult,
} from './native';
const readWorkspace = () => (desktopAvailable() ? repository.load() : Promise.resolve(null));
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const current = useRef(workspace);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const accept = useCallback((value: Workspace) => {
    current.current = value;
    setWorkspace(value);
  }, []);
  const run = useCallback(
    async <T>(action: () => Promise<T>, success = '', showLoading = true): Promise<T | undefined> => {
      if (locked.current) return;
      locked.current = true;
      setBusy(true);
      setError('');
      const pending = showLoading ? setTimeout(() => notifications.loading(), 600) : undefined;
      try {
        const result = await action();
        notifications.clearError();
        if (success) notifications.success(success);
        return result;
      } catch (cause) {
        const message = errorMessage(cause);
        setError(message);
        notifications.error(message);
      } finally {
        clearTimeout(pending);
        notifications.finishLoading();
        locked.current = false;
        setBusy(false);
      }
    },
    [],
  );
  const update = useCallback(
    async (
      transform: (value: Workspace) => Workspace,
      options: SaveOptions = {},
      success: string | false = 'Saved locally.',
    ): Promise<boolean> => {
      const result = await run(async () => {
        if (!desktopAvailable())
          throw new Error('Open Worklog using pnpm tauri dev to save to the desktop database.');
        const next = generateOccurrences(transform(current.current));
        const saved = await repository.save(next, current.current.revision, options);
        accept(saved.workspace);
        if (saved.cleanupWarning) notifications.warning(saved.cleanupWarning);
        else {
          notifications.clearWarnings();
          if (success) notifications.success(success);
        }
        return true;
      }, '', success !== false);
      return result === true;
    },
    [accept, run],
  );
  const hydrate = useCallback(
    async (result: WorkspaceResult | null) => {
      if (result && !locked.current) {
        const value = result.workspace;
        const generated = generateOccurrences(value);
        const saved =
          generated === value ? result : await repository.save(generated, value.revision);
        accept(saved.workspace);
        if (saved.cleanupWarning) notifications.warning(saved.cleanupWarning);
        else notifications.clearWarnings();
        setError('');
        notifications.clearError();
        setReady(true);
      }
      setLoading(false);
    },
    [accept],
  );
  const failedRead = useCallback((cause: unknown) => {
    const message = errorMessage(cause);
    setError(message);
    notifications.error(message);
    setLoading(false);
  }, []);
  const refresh = useCallback(
    async (announce = false) => {
      await readWorkspace()
        .then(async (result) => {
          await hydrate(result);
          if (announce && result) notifications.info('Workspace reloaded.');
        })
        .catch(failedRead);
    },
    [hydrate, failedRead],
  );
  useEffect(() => {
    let active = true;
    // Subscribe to the native request; no derived UI state is calculated in this effect.
    readWorkspace()
      .then((value) => {
        if (active) return hydrate(value);
      })
      .catch((cause) => {
        if (active) failedRead(cause);
      });
    const timer = setInterval(() => {
      void refresh();
    }, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [hydrate, failedRead, refresh]);
  return {
    workspace,
    busy,
    loading,
    ready,
    error,
    update,
    run,
    refresh,
    accept,
    setError,
  };
}
export type Workbench = ReturnType<typeof useWorkspace>;
