'use client';
import { Button } from './core/button';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from '@tabler/icons-react';
import { useEffect } from 'react';
import {
  ToastContainer,
  type CloseButtonProps,
  type IconProps,
  type ToastTransitionProps,
} from 'react-toastify/unstyled';

// Completion does not depend on animationend, including with reduced motion.
function InstantTransition({ children, isIn, done, playToast }: ToastTransitionProps) {
  useEffect(() => {
    if (isIn) playToast();
    else done();
  }, [isIn, done, playToast]);
  return <>{children}</>;
}
function NotificationIcon({ type, isLoading }: IconProps) {
  const Icon = isLoading
    ? IconLoader2
    : type === 'success'
      ? IconCircleCheck
      : type === 'error'
        ? IconCircleX
        : type === 'warning'
          ? IconAlertTriangle
          : IconInfoCircle;
  return <Icon size={21} aria-hidden="true" />;
}
function CloseNotification({ closeToast }: CloseButtonProps) {
  return (
    <Button
      tone="ghost"
      size="auto"
      type="button"
      className="toast-close absolute top-2 right-2 h-6 w-6 shrink-0 p-0 [color:inherit]"
      aria-label="Dismiss notification"
      onClick={closeToast}
    >
      <IconX size={17} aria-hidden="true" />
    </Button>
  );
}
export function Notifications() {
  return (
    <ToastContainer
      className="[--toastify-color-light:var(--surface)] [--toastify-color-dark:var(--surface)] [--toastify-color-info:var(--ink)] [--toastify-color-success:var(--ink)] [--toastify-color-warning:var(--warning-ink)] [--toastify-color-error:var(--danger-ink)] [--toastify-color-progress-light:var(--ink)] [--toastify-color-progress-dark:var(--ink)] [--toastify-color-progress-success:var(--ink)] [--toastify-color-progress-info:var(--ink)] [--toastify-color-progress-warning:var(--warning-ink)] [--toastify-color-progress-error:var(--danger-ink)] [--toastify-text-color-light:var(--ink)] [--toastify-text-color-dark:var(--ink)] [--toastify-font-family:inherit] [--toastify-toast-width:390px] [--toastify-z-index:100] [&_.Toastify__toast-icon]:[color:inherit] [@media(prefers-reduced-motion:reduce)]:[&_.Toastify__progress-bar]:invisible"
      toastClassName="[border:1px_solid_var(--border-strong)] [border-radius:5px] [background:var(--surface)] [color:var(--ink)] [font-size:13px] [gap:10px] [overflow-wrap:anywhere] [&.Toastify__toast]:min-h-0 [&.Toastify__toast]:pl-3 [&.Toastify__toast]:pr-10 [&.Toastify__toast]:py-3 [&.Toastify__toast--warning]:[background:var(--warning-bg)] [&.Toastify__toast--warning]:[border-color:var(--warning-border)] [&.Toastify__toast--warning]:[color:var(--warning-ink)] [&.Toastify__toast--error]:[background:var(--danger-bg)] [&.Toastify__toast--error]:[border-color:var(--danger-border)] [&.Toastify__toast--error]:[color:var(--danger-ink)]"
      position="bottom-right"
      style={{ bottom: 'calc(20px + var(--worcog-dock-height, 0px))' }}
      limit={4}
      closeOnClick={false}
      draggable={false}
      pauseOnHover
      pauseOnFocusLoss
      transition={InstantTransition}
      icon={NotificationIcon}
      closeButton={CloseNotification}
      aria-label="Notifications (Alt+T to focus)"
    />
  );
}
