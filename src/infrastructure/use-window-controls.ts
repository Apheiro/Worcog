'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { desktopAvailable, errorMessage } from './native';
import { notifications } from './notifications';

const subscribe = () => () => {};
const serverAvailable = () => false;

export function useWindowControls() {
  const desktop = useSyncExternalStore(subscribe, desktopAvailable, serverAvailable);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!desktop) return;
    const window = getCurrentWindow();
    let disposed = false;
    let unlisten: (() => void) | undefined;
    const report = (cause: unknown) => {
      if (!disposed) notifications.error(`Window controls: ${errorMessage(cause)}`);
    };
    async function sync() {
      try {
        const value = await window.isMaximized();
        if (!disposed) setMaximized(value);
      } catch (cause) {
        report(cause);
      }
    }
    void sync();
    void window
      .onResized(() => {
        void sync();
      })
      .then((stop) => {
        if (disposed) stop();
        else unlisten = stop;
      })
      .catch(report);
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [desktop]);

  async function act(action: 'minimize' | 'toggleMaximize' | 'close') {
    if (!desktop) return;
    try {
      const window = getCurrentWindow();
      await window[action]();
      if (action === 'toggleMaximize') setMaximized(await window.isMaximized());
    } catch (cause) {
      notifications.error(`Window controls: ${errorMessage(cause)}`);
    }
  }
  return {
    desktop,
    maximized,
    minimize: () => {
      void act('minimize');
    },
    toggleMaximize: () => {
      void act('toggleMaximize');
    },
    close: () => {
      void act('close');
    },
  };
}
