import { toast, type ToastOptions } from 'react-toastify/unstyled';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';
const warningIds = new Set<string>();
const labels: Record<NotificationType, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Information',
  warning: 'Warning',
};
function show(type: NotificationType, message: string) {
  const content = `${labels[type]}: ${message}`;
  const options: ToastOptions = {
    type,
    role: type === 'error' || type === 'warning' ? 'alert' : 'status',
    ariaLabel: content,
    autoClose: type === 'error' || type === 'warning' ? false : 5000,
    toastId: type === 'error' ? 'workspace-error' : `${type}:${message}`,
  };
  if (type === 'warning') warningIds.add(String(options.toastId));
  if (type === 'error' && toast.isActive('workspace-error')) {
    toast.update('workspace-error', { ...options, render: content });
  } else toast(content, options);
}
export const notifications = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
  info: (message: string) => show('info', message),
  warning: (message: string) => show('warning', message),
  loading: () =>
    toast.loading('Working: Please wait…', {
      toastId: 'workspace-operation',
      role: 'status',
      ariaLabel: 'Operation in progress',
    }),
  finishLoading: () => toast.dismiss('workspace-operation'),
  clearWarnings: () => {
    for (const id of warningIds) toast.dismiss(id);
    warningIds.clear();
  },
  clearError: () => toast.dismiss('workspace-error'),
};
