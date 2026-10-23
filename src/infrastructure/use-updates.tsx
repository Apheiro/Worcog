'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast, type ToastOptions } from 'react-toastify/unstyled';
import { desktopAvailable, errorMessage } from './native';
import { notifications } from './notifications';
import { updatesApi, type AvailableUpdate, type UpdateStatus, type UpdateReceipt } from './updates';
import { Button } from '../components/core/button';

const updateToast = 'application-update';
export function useUpdates() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [available, setAvailable] = useState<AvailableUpdate | null>(null);
  const [receipt, setReceipt] = useState<UpdateReceipt | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'check' | 'download' | 'credential' | 'folder' | null>(null);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const check = useCallback(async (manual = false) => {
    if (locked.current) return;
    locked.current = true;
    setBusy('check');
    setError('');
    try {
      const found = await updatesApi.check();
      notifications.clearError();
      setAvailable(found);
      setReceipt(null);
      if (found) {
        const content = (
          <Button
            type="button"
            tone="ghost"
            size="auto"
            className="update-toast min-w-0 flex-1 flex-col gap-1 p-0 [&.button]:items-start [&.button]:justify-start [&.button]:text-left [&.button]:border-0 [&.button]:font-normal [&.button]:[color:inherit] [&.button:hover]:bg-transparent"
            onClick={() => setOpen(true)}
          >
            <strong>Worklog {found.version} is available</strong>
            <span className="text-xs [color:var(--muted)]">View release notes and download</span>
          </Button>
        );
        const options: ToastOptions = {
          toastId: updateToast,
          autoClose: false,
          type: 'info',
          role: 'status',
          ariaLabel: `Worklog ${found.version} update available. View release notes.`,
        };
        if (toast.isActive(updateToast)) toast.update(updateToast, { ...options, render: content });
        else toast(content, options);
        if (manual) setOpen(true);
      } else {
        toast.dismiss(updateToast);
        if (manual)
          notifications.info(
            'No downloadable stable update is available. A release may still be building.',
          );
      }
    } catch (cause) {
      setAvailable(null);
      toast.dismiss(updateToast);
      if (manual) {
        const message = errorMessage(cause);
        setError(message);
        notifications.error(message);
      }
    } finally {
      locked.current = false;
      setBusy(null);
    }
  }, []);
  const initialize = useCallback(
    async (manual = false) => {
      try {
        const value = await updatesApi.status();
        setStatus(value);
        if (value.platformSupported || value.profile === 'development') await check(manual);
        else if (manual) notifications.info('Application updates target Windows x64.');
      } catch (cause) {
        if (manual) {
          const message = errorMessage(cause);
          setError(message);
          notifications.error(message);
        }
      }
    },
    [check],
  );
  useEffect(() => {
    if (!desktopAvailable()) return;
    // External startup query; automatic connection/authentication errors stay silent.
    let active = true;
    updatesApi
      .status()
      .then((value) => {
        if (!active) return;
        setStatus(value);
        if (value.platformSupported || value.profile === 'development') void check();
      })
      .catch(() => {
        /* Automatic credential failures are reported by a manual check. */
      });
    return () => {
      active = false;
      toast.dismiss(updateToast);
    };
  }, [check]);
  const saveToken = async (token: string | null) => {
    if (locked.current) return false;
    locked.current = true;
    setBusy('credential');
    setError('');
    try {
      setStatus(await updatesApi.setToken(token));
      notifications.clearError();
      setAvailable(null);
      setReceipt(null);
      toast.dismiss(updateToast);
      notifications.success(
        token === null
          ? 'Update token removed.'
          : status?.profile === 'development'
            ? 'Update token saved in the separate development browser profile.'
            : 'Update token saved in Windows Credential Manager.',
      );
      return true;
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      notifications.error(message);
      return false;
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  const download = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy('download');
    setError('');
    try {
      setReceipt(await updatesApi.download());
      notifications.clearError();
      toast.dismiss(updateToast);
      notifications.success('Update downloaded and verified. Follow the manual replacement steps.');
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      notifications.error(message);
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  const openFolder = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy('folder');
    setError('');
    try {
      await updatesApi.openFolder();
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      notifications.error(message);
    } finally {
      locked.current = false;
      setBusy(null);
    }
  };
  return {
    status,
    available,
    receipt,
    open,
    busy,
    error,
    saveToken,
    download,
    openFolder,
    check: () => initialize(true),
    show: () => setOpen(true),
    close: () => {
      if (!locked.current) setOpen(false);
    },
  };
}
export type UpdateController = ReturnType<typeof useUpdates>;
