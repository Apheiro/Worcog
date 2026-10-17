'use client';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { cva } from 'cva';
import { IconX } from '@tabler/icons-react';
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
const button = cva({
  base: 'button',
  variants: {
    tone: { primary: 'button-primary', quiet: 'button-quiet', danger: 'button-danger' },
    size: { sm: 'button-sm', md: '' },
  },
  defaultVariants: { tone: 'quiet', size: 'md' },
});
export function Button({
  tone = 'quiet',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'quiet' | 'danger';
  size?: 'sm' | 'md';
}) {
  return <button className={button({ tone, size, className })} {...props} />;
}
const badge = cva({
  base: 'badge',
  variants: { tone: { neutral: '', warning: 'badge-warning', danger: 'badge-danger' } },
  defaultVariants: { tone: 'neutral' },
});
export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'warning' | 'danger';
}) {
  return <span className={badge({ tone })}>{children}</span>;
}
export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content
          className={`modal ${wide ? 'modal-wide' : ''}`}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          <div className="modal-header">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button aria-label="Close dialog">
                <IconX size={18} />
              </Button>
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description id="modal-description" className="muted mb-5">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  onCancel,
  busy,
  error,
  confirmLabel = 'Confirm',
  children,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
  error?: string;
  confirmLabel?: string;
  children?: ReactNode;
}) {
  return (
    <AlertDialog.Root open>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="overlay" />
        <AlertDialog.Content className="modal">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description className="my-5 whitespace-pre-wrap">
            {description}
          </AlertDialog.Description>
          {children}
          <p className="overdue">{error}</p>
          <div className="form-footer">
            <Button onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button tone="danger" onClick={onConfirm} disabled={busy}>
              {busy ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const labelId = useId();
  const hintId = useId();
  const controls = Children.map(children, (child) =>
    isValidElement<{ 'aria-labelledby'?: string; 'aria-describedby'?: string }>(child) &&
    typeof child.type === 'string' &&
    ['input', 'textarea', 'select'].includes(child.type)
      ? cloneElement(child, {
          'aria-labelledby': labelId,
          'aria-describedby': hint ? hintId : undefined,
        })
      : child,
  );
  return (
    <label className="field">
      <span id={labelId}>{label}</span>
      {controls}
      {hint && (
        <small className="muted" id={hintId}>
          {hint}
        </small>
      )}
    </label>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export const statuses = ['pending', 'in_progress', 'blocked', 'completed', 'canceled'] as const;
export const priorities = ['low', 'normal', 'high', 'urgent'] as const;
export const activityKinds = [
  'note',
  'progress',
  'decision',
  'blocker',
  'meeting',
  'outcome',
  'status',
  'milestone',
] as const;
export const sourceKinds = [
  'email',
  'teams',
  'invgate',
  'document',
  'meeting',
  'url',
  'phone',
  'system',
  'other',
] as const;
export const human = (s: string) => s.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());
export function Options({ values }: { values: readonly string[] }) {
  return (
    <>
      {values.map((s) => (
        <option key={s} value={s}>
          {human(s)}
        </option>
      ))}
    </>
  );
}
