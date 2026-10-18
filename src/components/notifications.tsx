'use client';
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
    <button
      type="button"
      className="toast-close"
      aria-label="Dismiss notification"
      onClick={closeToast}
    >
      <IconX size={17} aria-hidden="true" />
    </button>
  );
}
export function Notifications() {
  return (
    <ToastContainer
      position="bottom-right"
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
