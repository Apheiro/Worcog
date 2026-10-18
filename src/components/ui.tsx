'use client';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Dialog from '@radix-ui/react-dialog';
import { IconX } from '@tabler/icons-react';
import { cva } from 'cva';
import { Checkbox } from './checkbox';
import { Select } from './select';
export { Select } from './select';
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

const input = cva({
  base: [
    'control',
    '[border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] [padding:8px_10px] min-w-0 max-w-full [color:var(--ink)]',
  ],
});
export function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={input({ className })} {...props} />;
}
export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={input({
        className: 'textarea-control [resize:vertical] [min-height:80px] ' + className,
      })}
      {...props}
    />
  );
}
const modal = cva({
  base: [
    'modal',
    'fixed [top:50%] [left:50%] [transform:translate(-50%,_-50%)] [max-height:88vh] overflow-auto [background:var(--surface)] [width:min(520px,_calc(100vw_-_40px))] [border-radius:8px] [padding:24px] [z-index:50] [border:1px_solid_var(--border)] [box-shadow:0_15px_55px_#0002]',
    '[@media(max-width:800px)]:[padding:20px]',
  ],
  variants: {
    wide: {
      true: ['modal-wide', '[&.modal-wide]:[width:min(690px,_calc(100vw_-_40px))]'],
      false: '',
    },
  },
  defaultVariants: { wide: false },
});

const button = cva({
  base: [
    'button',
    'inline-flex items-center justify-center [gap:7px] [padding:8px_12px] [min-height:36px] [border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] [color:var(--ink)] [line-height:1.2] whitespace-nowrap [font-size:13px] [font-weight:550] [transition:background_0.12s]',
    '[&:hover:not(:disabled)]:[background:var(--hover)] [&:hover:not(:disabled)]:[border-color:var(--border-strong)]',
  ],
  variants: {
    tone: {
      primary: [
        'button-primary',
        '[&.button-primary]:[background:var(--primary)] [&.button-primary]:[color:var(--on-primary)] [&.button-primary]:[border-color:var(--primary)]',
        '[&.button-primary]:[&:hover:not(:disabled)]:[background:var(--primary-hover)] [&.button-primary]:[&:hover:not(:disabled)]:[color:var(--on-primary)]',
      ],
      quiet: 'button-quiet',
      danger: [
        'button-danger',
        '[&.button-danger]:[background:var(--danger-fill)] [&.button-danger]:[color:var(--on-danger)] [&.button-danger]:[border-color:var(--danger-fill)]',
        '[&.button-danger]:[&:hover:not(:disabled)]:[background:var(--danger-fill-hover)] [&.button-danger]:[&:hover:not(:disabled)]:[color:var(--on-danger)]',
      ],
    },
    size: {
      sm: [
        'button-sm',
        '[&.button-sm]:[padding:5px_8px] [&.button-sm]:[min-height:29px] [&.button-sm]:[font-size:12px]',
      ],
      md: '',
    },
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
  base: [
    'badge',
    'inline-flex items-center [background:var(--surface-soft)] [color:var(--secondary)] [border:1px_solid_var(--border)] whitespace-nowrap [font-size:11px] [font-weight:550] [border-radius:4px] [padding:2px_7px] [line-height:1.6]',
  ],
  variants: {
    tone: {
      neutral: '',
      warning: [
        'badge-warning',
        '[&.badge-warning]:[color:var(--warning-ink)] [&.badge-warning]:[background:var(--warning-bg)] [&.badge-warning]:[border-color:var(--warning-border)]',
      ],
      danger: [
        'badge-danger',
        '[&.badge-danger]:[color:var(--danger-ink)] [&.badge-danger]:[background:var(--danger-bg)] [&.badge-danger]:[border-color:var(--danger-border)]',
      ],
    },
  },
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
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed [inset:0] [background:var(--overlay)] [z-index:40]" />
        <Dialog.Content
          className={modal({ wide, className })}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          <div className="modal-header flex items-center justify-between [gap:15px] [margin-bottom:22px] [&_h2]:[font-size:19px] [&_h2]:[font-weight:600] [&_h2]:[overflow-wrap:anywhere] [&_.button]:border-0">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button aria-label="Close dialog">
                <IconX size={18} />
              </Button>
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description id="modal-description" className="muted [color:var(--muted)] mb-5">
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
        <AlertDialog.Overlay className="overlay fixed [inset:0] [background:var(--overlay)] [z-index:40]" />
        <AlertDialog.Content className="modal fixed [top:50%] [left:50%] [transform:translate(-50%,_-50%)] [max-height:88vh] overflow-auto [background:var(--surface)] [width:min(520px,_calc(100vw_-_40px))] [border-radius:8px] [padding:24px] [z-index:50] [border:1px_solid_var(--border)] [box-shadow:0_15px_55px_#0002] [@media(max-width:800px)]:[padding:20px]">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description className="my-5 whitespace-pre-wrap">
            {description}
          </AlertDialog.Description>
          {children}
          <p className="overdue [color:var(--danger-ink)] [font-weight:550]">{error}</p>
          <div className="form-footer flex [justify-content:flex-end] [gap:9px] [margin-top:24px] [padding-top:18px] [border-top:1px_solid_var(--border)]">
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
    ((typeof child.type === 'string' && ['input', 'textarea', 'select'].includes(child.type)) ||
      child.type === Input ||
      child.type === Checkbox ||
      child.type === Select ||
      child.type === Textarea)
      ? cloneElement(child, {
          'aria-labelledby': labelId,
          'aria-describedby': hint ? hintId : undefined,
        })
      : child,
  );
  return (
    <label className="field flex flex-col [gap:6px] [margin-bottom:16px] [font-size:12px] [&_>_span]:[font-weight:550] [&_>_span]:[color:var(--secondary)] [&_>_input]:w-full [&_>_textarea]:w-full [&_>_.select-trigger]:w-full [&_small]:[font-size:11px] [&_small]:[line-height:1.5]">
      <span id={labelId}>{label}</span>
      {controls}
      {hint && (
        <small className="muted [color:var(--muted)]" id={hintId}>
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
    <div className="empty [padding:45px_30px] [text-align:center] [border:1px_dashed_var(--border)] [border-radius:5px] [background:var(--surface)] [margin:20px_0] [color:var(--muted)] [&_h3]:[font-size:16px] [&_h3]:[color:var(--ink)] [&_h3]:[font-weight:550] [&_p]:[font-size:13px] [&_p]:[margin:10px_auto_16px] [&_p]:[max-width:500px]">
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
export const selectOptions = (values: readonly string[]) =>
  values.map((value) => ({ value, label: human(value) }));
