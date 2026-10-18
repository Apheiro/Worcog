// UnoCSS shortcuts keep component styles and responsive states together.
export const contentStyles = {
  muted: ['[color:var(--muted)]'],
  eyebrow: [
    '[font-size:11px] [letter-spacing:1.1px] uppercase [color:var(--muted)] [font-weight:600] [margin-bottom:10px]',
  ],
  overdue: ['[color:var(--danger-ink)] [font-weight:550]'],
  metrics: [
    'grid [grid-template-columns:repeat(4,_minmax(0,_1fr))] [border:1px_solid_var(--border)] [border-radius:6px] [background:var(--surface)] [margin:25px_0_28px]',
    '[@media(max-width:800px)]:[grid-template-columns:1fr_1fr]',
  ],
  metric: [
    '[padding:19px_23px] [border-right:1px_solid_var(--border)] [font-size:12px] [color:var(--muted)]',
    '[&:last-child]:[border:none]',
    '[&_svg]:[color:var(--muted)]',
    '[&_strong]:block [&_strong]:[color:var(--ink)] [&_strong]:[font-size:30px] [&_strong]:[font-weight:550] [&_strong]:[line-height:1.2] [&_strong]:[margin-top:11px] [&_strong]:[letter-spacing:-0.7px]',
    '[@media(max-width:1150px)]:[padding:15px]',
    '[@media(max-width:800px)]:[&:nth-child(2)]:[border-right:0]',
    '[@media(max-width:800px)]:[&:nth-child(-n_+_2)]:[border-bottom:1px_solid_var(--border)]',
  ],
  'dashboard-grid': [
    'grid [grid-template-columns:minmax(0,_1.2fr)_minmax(0,_1fr)] [gap:25px]',
    '[@media(max-width:1150px)]:[gap:18px]',
    '[@media(max-width:800px)]:[grid-template-columns:1fr]',
  ],
  section: [
    '[border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] overflow-hidden',
    '[&_.table-wrap]:border-0 [&_.table-wrap]:rounded-none',
    '[&_.empty]:border-0 [&_.empty]:rounded-none [&_.empty]:m-0',
  ],
  'section-heading': [
    '[padding:16px_20px] flex items-center justify-between [gap:15px] [min-height:58px] [border-bottom:1px_solid_var(--border)]',
  ],
  'section-empty': ['[padding:30px_22px] [color:var(--muted)] [font-size:13px]'],
  'action-row': [
    'w-full [background:var(--surface)] border-0 [border-bottom:1px_solid_var(--border)] flex items-center [gap:15px] [padding:14px_20px] text-left [font-size:13px]',
    '[&:last-child]:[border-bottom:0]',
    '[&:hover]:[background:var(--canvas)]',
    '[&_strong]:[font-weight:550]',
  ],
  'row-subtitle': [
    'block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]',
  ],
  'task-resources': ['flex flex-wrap gap-1.5 mt-1 list-none p-0 [&_li]:min-w-0 [&_li]:max-w-full'],
  'task-resource': [
    'max-w-full text-left [&_span]:[overflow-wrap:anywhere] [&_svg]:shrink-0 disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  'row-action': [
    '[font-size:12px] [color:var(--muted)] [margin-top:5px] [max-width:520px] [overflow-wrap:anywhere]',
  ],
  'title-link': [
    'p-0 border-0 [background:transparent] [color:var(--ink)] text-left [font-weight:550] [overflow-wrap:anywhere]',
    '[&:hover]:[text-decoration:underline] [&:hover]:[text-underline-offset:3px]',
  ],
  'table-wrap': [
    'overflow-auto [border:1px_solid_var(--border)] [border-radius:4px] [background:var(--surface)]',
  ],
  'data-table': [
    '[border-collapse:collapse] w-full [min-width:760px] text-left [font-size:12px]',
    '[&_th]:[padding:10px_15px] [&_th]:[font-size:10px] [&_th]:[font-weight:600] [&_th]:[color:var(--muted)] [&_th]:[background:var(--surface-soft)] [&_th]:[letter-spacing:0.4px] [&_th]:uppercase [&_th]:[border-bottom:1px_solid_var(--border)] [&_th]:whitespace-nowrap',
    '[&_td]:[padding:15px] [&_td]:[border-bottom:1px_solid_var(--border)] [&_td]:[vertical-align:top]',
    '[&_td:first-child]:[width:38%]',
    '[&_td:nth-child(5)]:whitespace-nowrap',
    '[&_td:nth-child(6)]:whitespace-nowrap',
    '[&_tr:last-child_td]:[border-bottom:none]',
    '[&_tbody_tr:hover]:[background:var(--surface-soft)]',
  ],
  toolbar: [
    'flex items-center [gap:10px] [margin:19px_0]',
    '[&_select]:[font-size:12px] [&_select]:[padding:6px_9px] [&_select]:[max-width:240px]',
    '[@media(max-width:800px)]:flex-wrap',
  ],
  empty: [
    '[padding:45px_30px] [text-align:center] [border:1px_dashed_var(--border)] [border-radius:5px] [background:var(--surface)] [margin:20px_0] [color:var(--muted)]',
    '[&_h3]:[font-size:16px] [&_h3]:[color:var(--ink)] [&_h3]:[font-weight:550]',
    '[&_p]:[font-size:13px] [&_p]:[margin:10px_auto_16px] [&_p]:[max-width:500px]',
  ],
  'topic-summary': [
    'grid [grid-template-columns:minmax(0,_1.7fr)_minmax(0,_1fr)] [border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] overflow-hidden',
    '[&_>_div]:[padding:21px_23px]',
    '[&_p]:[font-size:13px]',
    '[&_.next-action]:[border-left:1px_solid_var(--border)] [&_.next-action]:[background:var(--surface-soft)]',
    '[@media(max-width:800px)]:[grid-template-columns:1fr]',
    '[@media(max-width:800px)]:[&_.next-action]:[border-left:0] [@media(max-width:800px)]:[&_.next-action]:[border-top:1px_solid_var(--border)]',
  ],
  'next-action': ['[&_.eyebrow]:[font-size:10px]'],
  'quick-actions': [
    'flex items-center [gap:9px] flex-wrap [padding:20px_0_0]',
    '[&_>_span]:[margin-right:8px]',
    '[@media(max-width:800px)]:[gap:7px]',
    '[@media(max-width:800px)]:[&_>_span]:w-full',
  ],
  tabs: [
    'flex [gap:26px] [border-bottom:1px_solid_var(--border)] [margin-bottom:20px]',
    '[&_button]:[background:transparent] [&_button]:border-0 [&_button]:[border-bottom:2px_solid_transparent] [&_button]:[padding:12px_0] [&_button]:[font-size:13px] [&_button]:[color:var(--muted)]',
    '[&_button[data-state=active]]:[color:var(--ink)] [&_button[data-state=active]]:[border-bottom-color:var(--ink)] [&_button[data-state=active]]:[font-weight:600]',
    '[&_button_span]:[background:var(--surface-soft)] [&_button_span]:[border-radius:4px] [&_button_span]:[padding:1px_5px] [&_button_span]:[font-size:10px] [&_button_span]:[margin-left:5px]',
    '[@media(max-width:800px)]:[gap:18px]',
  ],
  timeline: [
    'list-none [padding:10px_0] m-0',
    '[&_>_li]:relative [&_>_li]:flex [&_>_li]:[gap:17px] [&_>_li]:[padding-bottom:28px]',
    '[&_>_li:before]:absolute [&_>_li:before]:[left:16px] [&_>_li:before]:[top:30px] [&_>_li:before]:[bottom:0] [&_>_li:before]:content-empty [&_>_li:before]:[width:1px] [&_>_li:before]:[background:var(--border)]',
    '[&_>_li:last-child:before]:hidden',
  ],
  'timeline-dot': [
    '[width:33px] [height:33px] grid [place-items:center] [border:1px_solid_var(--border)] [background:var(--surface-soft)] [border-radius:50%] [color:var(--muted)] shrink-0 [z-index:1]',
  ],
  'timeline-body': [
    '[border:1px_solid_var(--border)] [background:var(--surface)] [border-radius:5px] flex-1 [padding:15px_18px] min-w-0',
    '[&_time]:[font-size:12px] [&_time]:[font-weight:550] [&_time]:[color:var(--muted)]',
    '[&_p]:[font-size:13px] [&_p]:[overflow-wrap:anywhere]',
  ],
  'source-chip': [
    'inline-flex items-center [gap:5px] [border:1px_solid_var(--border)] [background:var(--surface-soft)] [border-radius:4px] [padding:3px_7px] [font-size:11px] [color:var(--secondary)] text-left [overflow-wrap:anywhere]',
    '[&:hover]:[background:var(--hover)]',
  ],
  'task-list': [
    '[border:1px_solid_var(--border)] rounded-lg [background:var(--surface)] overflow-hidden',
  ],
  'source-list': [
    '[border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] overflow-hidden',
  ],
  'task-row': [
    'p-4 flex items-start gap-3 [border-bottom:1px_solid_var(--border)]',
    '[&:hover]:[background:var(--surface-soft)] [&:focus-within]:[background:var(--surface-soft)]',
    '[&:last-child]:border-0',
    '[&_.compact-select]:[font-size:11px] [&_.compact-select]:[padding:4px_7px] [&_.compact-select]:[width:110px] [&_.compact-select]:shrink-0',
    'flex-wrap [&_>_.flex-1]:[min-width:min(220px,_100%_-_40px)]',
  ],
  'task-child': ['pl-8'],
  'task-completed': ['[background:var(--surface-soft)]'],
  'task-actions': ['flex items-center flex-wrap gap-2 ml-auto'],
  'task-action': ['border-transparent [background:transparent]'],
  completed: ['[text-decoration:line-through] [color:var(--muted)]'],
  'inline-icon': ['inline-flex [gap:4px] items-center [margin-left:7px]'],
  'source-row': [
    'flex items-center [gap:14px] w-full text-left [padding:18px] border-0 [border-bottom:1px_solid_var(--border)] [background:var(--surface)]',
    '[&:last-child]:[border-bottom:0]',
    '[&:hover]:[background:var(--surface-soft)]',
    '[&_strong]:[font-size:13px] [&_strong]:[font-weight:550]',
  ],
  'entity-icon': [
    '[width:35px] [height:35px] grid [place-items:center] [background:var(--surface-soft)] [border:1px_solid_var(--border)] [border-radius:5px] [color:var(--muted)]',
  ],
  'file-row': [
    'flex items-center [gap:14px] [padding:16px] [border-bottom:1px_solid_var(--border)] [background:var(--surface)]',
    '[&_>_svg]:[color:var(--muted)]',
    '[@media(max-width:800px)]:flex-wrap',
  ],
  'search-results': [
    'grid [grid-template-columns:1fr_1fr] [gap:15px]',
    '[@media(max-width:800px)]:[grid-template-columns:1fr]',
  ],
  'search-result': [
    'text-left [padding:20px] [background:var(--surface)] [border:1px_solid_var(--border)] [border-radius:5px]',
    '[&:hover]:[border-color:var(--border-strong)]',
    '[&_strong]:block [&_strong]:[margin:5px_0] [&_strong]:[font-weight:550]',
    '[&_p]:[font-size:12px] [&_p]:[overflow-wrap:anywhere]',
    '[&_.eyebrow]:[font-size:9px]',
  ],
  settings: ['[max-width:900px]'],
  'settings-body': ['[padding:21px] [font-size:13px]'],
  metadata: [
    'grid [grid-template-columns:100px_minmax(0,_1fr)] [font-size:12px] [gap:10px_15px]',
    '[&_dt]:[color:var(--muted)]',
    '[&_dd]:m-0',
  ],
  revision: [
    '[border-left:2px_solid_var(--border)] [margin:10px_0] [padding:6px_12px] [background:var(--surface-soft)] [font-size:12px]',
  ],
  'sr-only': [
    'absolute [width:1px] [height:1px] p-0 overflow-hidden [clip:rect(0,_0,_0,_0)] whitespace-nowrap border-0',
  ],
};
