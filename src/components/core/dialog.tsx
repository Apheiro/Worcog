'use client';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Dialog from '@radix-ui/react-dialog';
import { IconX } from '@tabler/icons-react';
import { cva } from 'cva';
import type { ReactNode } from 'react';
import { Button } from './button';

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
              <Button tone="ghost" size="icon" aria-label="Close dialog">
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
