// UnoCSS shortcuts keep component styles and responsive states together.
export const dialogsStyles = {
  overlay: ['fixed [inset:0] [background:var(--overlay)] [z-index:40]'],
  modal: [
    'fixed [top:50%] [left:50%] [transform:translate(-50%,_-50%)] [max-height:88vh] overflow-auto [background:var(--surface)] [width:min(520px,_calc(100vw_-_40px))] [border-radius:8px] [padding:24px] [z-index:50] [border:1px_solid_var(--border)] [box-shadow:0_15px_55px_#0002]',
    '[@media(max-width:800px)]:[padding:20px]',
  ],
  'modal-wide': ['[width:min(690px,_calc(100vw_-_40px))]'],
  'modal-header': [
    'flex items-center justify-between [gap:15px] [margin-bottom:22px]',
    '[&_h2]:[font-size:19px] [&_h2]:[font-weight:600] [&_h2]:[overflow-wrap:anywhere]',
    '[&_.button]:border-0',
  ],
  'form-grid': [
    'grid [grid-template-columns:1fr_1fr] [gap:16px]',
    '[@media(max-width:800px)]:[grid-template-columns:1fr] [@media(max-width:800px)]:[gap:0]',
  ],
  'form-footer': [
    'flex [justify-content:flex-end] [gap:9px] [margin-top:24px] [padding-top:18px] [border-top:1px_solid_var(--border)]',
  ],
  checks: [
    '[border:1px_solid_var(--border)] [border-radius:4px] [padding:9px_12px_12px] [margin:0_0_18px] min-w-0',
    '[&_legend]:[font-size:11px] [&_legend]:[color:var(--muted)] [&_legend]:[padding:0_5px]',
  ],
  'check-list': [
    '[max-height:145px] overflow-auto flex flex-col [gap:6px]',
    '[&_label]:flex [&_label]:items-start [&_label]:[gap:8px] [&_label]:[font-size:12px] [&_label]:[overflow-wrap:anywhere]',
    '[&_.checkbox]:[margin-top:2px]',
  ],
  'check-inline': [
    'flex items-start [gap:8px] [font-size:12px] [overflow-wrap:anywhere]',
    '[&_.checkbox]:[margin-top:2px]',
  ],
  notice: [
    '[border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px]',
    '[&_p]:[margin-top:5px]',
  ],
  'toast-close': [
    'inline-flex [align-self:flex-start] shrink-0 [padding:3px] border-0 [background:transparent] [color:inherit]',
  ],
  'update-toast': [
    'flex flex-col [gap:5px] text-left [color:inherit] [background:transparent] border-0 [padding:3px]',
    '[&_span]:[font-size:12px]',
  ],
  'update-dialog-body': ['flex flex-col flex-1 [min-height:0] overflow-hidden', '[&_>_p]:shrink-0'],
  'release-scroll': ['flex-1 [min-height:80px] overflow-hidden'],
  'release-viewport': [
    'h-full w-full [padding-right:16px]',
    '[&:focus-visible]:[outline:2px_solid_var(--focus)] [&:focus-visible]:[outline-offset:-2px]',
  ],
  'release-scrollbar': ['flex [width:8px] [background:var(--surface-soft)] [padding:2px]'],
  'release-thumb': ['flex-1 [background:var(--border-strong)] [border-radius:4px]'],
  'release-notes': [
    '[overflow-wrap:anywhere] [line-height:1.6] [font-size:13px]',
    '[&_:is(h1,_h2,_h3,_h4,_p,_ul,_ol,_pre,_blockquote)]:[margin:12px_0]',
    '[&_:is(ul,_ol)]:[padding-left:22px]',
    '[&_pre]:[white-space:pre-wrap] [&_pre]:[background:var(--surface-soft)] [&_pre]:[padding:10px]',
    '[&_a]:[text-decoration:underline]',
    '[&_table]:w-full [&_table]:[font-size:12px]',
  ],
  'update-receipt': [
    '[&_ol]:[padding-left:22px]',
    'overflow-auto [flex-shrink:1] [min-height:80px] [font-size:12px]',
    '[&_dd]:[overflow-wrap:anywhere]',
    '[&:focus-visible]:[outline:2px_solid_var(--focus)] [&:focus-visible]:[outline-offset:-2px]',
  ],
  'update-modal': [
    'flex flex-col overflow-hidden [top:20px] [transform:translateX(-50%)] [height:min(780px,_calc(100dvh_-_140px))] [max-height:calc(100dvh_-_140px)]',
    '[&_>_.modal-header]:shrink-0',
    '[&_>_.muted]:shrink-0',
    '[&_.form-footer]:shrink-0',
  ],
};
