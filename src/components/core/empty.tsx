import type { ReactNode } from 'react';

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
