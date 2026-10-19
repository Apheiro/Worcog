'use client';
import { cva } from 'cva';
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Checkbox } from './checkbox';
import { Select } from './select';

const input = cva({
  base: [
    'control',
    '[&:focus]:[outline:none] [&:focus-visible]:[outline:none] focus:[border-color:var(--focus)]',
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
