// UnoCSS shortcuts keep component styles and responsive states together.
export const controlsStyles = {
  control: [
    '[border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] [padding:8px_10px] min-w-0 max-w-full [color:var(--ink)]',
  ],
  'textarea-control': ['[resize:vertical] [min-height:80px]'],
  'checkbox-control': ['[width:16px] [height:16px] [accent-color:var(--primary)] shrink-0'],
  'select-control': ['cursor-pointer'],
  button: [
    'inline-flex items-center justify-center [gap:7px] [padding:8px_12px] [min-height:36px] [border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] [color:var(--ink)] [line-height:1.2] whitespace-nowrap [font-size:13px] [font-weight:550] [transition:background_0.12s]',
    '[&:hover:not(:disabled)]:[background:var(--hover)] [&:hover:not(:disabled)]:[border-color:var(--border-strong)]',
  ],
  'button-primary': [
    '[background:var(--primary)] [color:var(--on-primary)] [border-color:var(--primary)]',
    '[&:hover:not(:disabled)]:[background:var(--primary-hover)] [&:hover:not(:disabled)]:[color:var(--on-primary)]',
  ],
  'button-danger': [
    '[background:var(--danger-fill)] [color:var(--on-danger)] [border-color:var(--danger-fill)]',
    '[&:hover:not(:disabled)]:[background:var(--danger-fill-hover)] [&:hover:not(:disabled)]:[color:var(--on-danger)]',
  ],
  'button-sm': ['[padding:5px_8px] [min-height:29px] [font-size:12px]'],
  badge: [
    'inline-flex items-center [background:var(--surface-soft)] [color:var(--secondary)] [border:1px_solid_var(--border)] whitespace-nowrap [font-size:11px] [font-weight:550] [border-radius:4px] [padding:2px_7px] [line-height:1.6]',
  ],
  'badge-warning': [
    '[color:var(--warning-ink)] [background:var(--warning-bg)] [border-color:var(--warning-border)]',
  ],
  'badge-danger': [
    '[color:var(--danger-ink)] [background:var(--danger-bg)] [border-color:var(--danger-border)]',
  ],
  filters: [
    '[background:var(--surface)] [border:1px_solid_var(--border)] [border-radius:5px] [margin-bottom:24px]',
  ],
  'filters-header': ['flex items-stretch'],
  'filters-toggle': [
    'shrink-0 border-0 [border-left:1px_solid_var(--border)] rounded-none [padding:10px_16px]',
    '[&[aria-expanded=true]_.filters-chevron]:[transform:rotate(180deg)]',
  ],
  'search-field': [
    'flex flex-1 min-w-0 [gap:10px] items-center [padding:3px_15px] [color:var(--muted)]',
    '[&_>_svg]:shrink-0',
    '[&_input]:border-0 [&_input]:w-full [&_input]:min-w-0 [&_input]:[padding:10px_0] [&_input]:[background:none]',
  ],
  'filter-controls': [
    '[&[hidden]]:hidden',
    '[border-top:1px_solid_var(--border)] flex items-end [gap:12px] flex-wrap [padding:14px_16px]',
    '[&_.field]:m-0 [&_.field]:[min-width:100px] [&_.field]:[max-width:170px] [&_.field]:flex-1',
    '[&_.field_>_span]:[font-size:10px] [&_.field_>_span]:uppercase [&_.field_>_span]:[letter-spacing:0.5px] [&_.field_>_span]:[color:var(--muted)]',
    '[&_input]:[font-size:12px] [&_input]:[min-height:34px] [&_input]:[padding:6px_7px] [&_input]:w-full',
    '[&_select]:[font-size:12px] [&_select]:[min-height:34px] [&_select]:[padding:6px_7px] [&_select]:w-full',
    '[@media(max-width:1150px)]:[&_.field]:[min-width:110px]',
    '[@media(max-width:800px)]:[&_.field]:[min-width:120px] [@media(max-width:800px)]:[&_.field]:[max-width:none]',
  ],
  field: [
    'flex flex-col [gap:6px] [margin-bottom:16px] [font-size:12px]',
    '[&_>_span]:[font-weight:550] [&_>_span]:[color:var(--secondary)]',
    '[&_>_input]:w-full',
    '[&_>_textarea]:w-full',
    '[&_>_select]:w-full',
    '[&_small]:[font-size:11px] [&_small]:[line-height:1.5]',
  ],
  segmented: [
    'inline-flex [border:1px_solid_var(--border)] [border-radius:4px] overflow-hidden [background:var(--surface)]',
    '[&_button]:[padding:6px_13px] [&_button]:[font-size:12px] [&_button]:[background:transparent] [&_button]:border-0 [&_button]:[border-right:1px_solid_var(--border)] [&_button]:[color:var(--muted)]',
    '[&_button:last-child]:border-0',
    '[&_button[aria-pressed=true]]:[background:var(--selected)] [&_button[aria-pressed=true]]:[color:var(--ink)]',
  ],
  'theme-control': [
    'inline-flex items-center [gap:6px] [color:var(--muted)]',
    '[&_select]:[padding:5px_8px] [&_select]:[font-size:12px] [&_select]:[min-height:30px]',
  ],
};
