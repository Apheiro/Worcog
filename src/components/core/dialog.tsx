'use client';
import { useTranslations } from 'next-intl';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Dialog from '@radix-ui/react-dialog';
import { IconX } from '@tabler/icons-react';
import { cva } from 'cva';
import { useId, type ReactNode } from 'react';
import { Button } from './button';
import { ScrollArea } from './scroll-area';

const modal = cva({
  base: [
    'modal',
    'fixed grid [grid-template-rows:auto_minmax(0,_1fr)_auto] [top:50%] [left:50%] [transform:translate(-50%,_-50%)] [max-height:88dvh] overflow-hidden [background:var(--surface)] [width:min(520px,_calc(100vw_-_40px))] [border-radius:8px] [padding:24px] [z-index:50] [border:1px_solid_var(--border)] [box-shadow:0_15px_55px_#0002]',
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
  footer,
  onClose,
  wide = false,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  const tr = useTranslations('ui');
  const descriptionId = useId();
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
          onInteractOutside={(event) => {
            const target = event.detail.originalEvent.target;
            if (target instanceof Element && target.closest('[data-window-titlebar]'))
              event.preventDefault();
          }}
          className={modal({ wide, className })}
          aria-describedby={description ? descriptionId : undefined}
        >
          <div className="modal-header flex shrink-0 items-center justify-between [gap:15px] [margin-bottom:22px] [&_h2]:[font-size:19px] [&_h2]:[font-weight:600] [&_h2]:[overflow-wrap:anywhere] [&_.button]:border-0">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button tone="ghost" size="icon" aria-label={tr('close_dialog')}>
                <IconX size={18} />
              </Button>
            </Dialog.Close>
          </div>
          <ScrollArea label={tr('value0_content', { value0: title })} className="min-h-0">
            <div className="pr-3">
              {description && (
                <Dialog.Description id={descriptionId} className="muted [color:var(--muted)] mb-5">
                  {description}
                </Dialog.Description>
              )}
              {children}
            </div>
          </ScrollArea>
          {footer && (
            <div className="form-footer flex shrink-0 flex-wrap items-center justify-end gap-2 mt-4 pt-4 [border-top:1px_solid_var(--border)]">
              {footer}
            </div>
          )}
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
  confirmLabel,
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
  const tr = useTranslations('ui');
  return (
    <AlertDialog.Root open>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="overlay fixed [inset:0] [background:var(--overlay)] [z-index:40]" />
        <AlertDialog.Content className="modal fixed grid [grid-template-rows:auto_minmax(0,_1fr)_auto] [top:50%] [left:50%] [transform:translate(-50%,_-50%)] [max-height:88dvh] overflow-hidden [background:var(--surface)] [width:min(520px,_calc(100vw_-_40px))] [border-radius:8px] [padding:24px] [z-index:50] [border:1px_solid_var(--border)] [box-shadow:0_15px_55px_#0002] [@media(max-width:800px)]:[padding:20px]">
          <AlertDialog.Title className="shrink-0">{title}</AlertDialog.Title>
          <ScrollArea label={tr('value0_content', { value0: title })} className="min-h-0">
            <div className="pr-3">
              <AlertDialog.Description className="my-5 whitespace-pre-wrap">
                {description}
              </AlertDialog.Description>
              {children}
              {error && (
                <p className="overdue [color:var(--danger-ink)] [font-weight:550]">{error}</p>
              )}
            </div>
          </ScrollArea>
          <div className="form-footer flex shrink-0 [justify-content:flex-end] [gap:9px] [margin-top:24px] [padding-top:18px] [border-top:1px_solid_var(--border)]">
            <Button onClick={onCancel} disabled={busy}>
              {tr('cancel')}{' '}
            </Button>
            <Button tone="danger" onClick={onConfirm} disabled={busy}>
              {busy ? tr('working') : (confirmLabel ?? tr('confirm'))}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
