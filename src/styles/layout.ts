// UnoCSS shortcuts keep component styles and responsive states together.
export const layoutStyles = {
  'app-shell': [
    // '[&_main]:[margin-left:228px] [&_main]:flex-1 [&_main]:min-w-0',
    // '[@media(max-width:1150px)]:[&_main]:[margin-left:200px]',
    // '[@media(max-width:800px)]:[&_main]:[margin-left:65px]',
    'flex [min-height:100vh]',
  ],
  sidebar: [
    // fixed [top:0] [bottom:0]
    '[width:228px] [background:var(--sidebar)] [border-right:1px_solid_var(--border)] flex flex-col [padding:29px_16px_20px]',
    '[&_nav]:flex [&_nav]:flex-col [&_nav]:[gap:4px]',
    '[@media(max-width:1150px)]:[width:200px] [@media(max-width:1150px)]:[padding:24px_12px]',
    '[@media(max-width:800px)]:[width:65px] [@media(max-width:800px)]:[padding:20px_8px]',
  ],
  brand: [
    'flex items-center [gap:11px] [padding:0_9px_32px] [font-size:19px] [font-weight:650] [letter-spacing:-0.5px] [line-height:1.25]',
    '[&_small]:block [&_small]:[color:var(--muted)] [&_small]:[font-size:11px] [&_small]:[font-weight:400] [&_small]:[letter-spacing:0] [&_small]:[margin-top:4px]',
    '[@media(max-width:800px)]:[padding:0_8px_25px]',
    '[@media(max-width:800px)]:[&_>_span:last-child]:hidden',
  ],
  'brand-mark': [
    '[width:31px] [height:33px] grid [place-items:center] [background:var(--primary)] [color:var(--on-primary)] [border-radius:6px] [font-size:18px]',
  ],
  'nav-item': [
    'flex [gap:11px] items-center text-left w-full [padding:10px_12px] [border:none] [background:transparent] [color:var(--muted)] [border-radius:5px] [font-size:13px]',
    '[&:hover]:[background:var(--hover)]',
    '[&.selected]:[color:var(--ink)] [&.selected]:[background:var(--selected)] [&.selected]:[font-weight:600]',
    '[&_small]:ml-auto [&_small]:[background:var(--selected)] [&_small]:[border-radius:3px] [&_small]:[padding:0_5px] [&_small]:[font-size:10px]',
    '[&:nth-last-child(2)]:[margin-top:23px]',
    '[@media(max-width:800px)]:[&_span]:hidden',
    '[@media(max-width:800px)]:[&_small]:hidden',
    '[@media(max-width:800px)]:[padding:12px] [@media(max-width:800px)]:justify-center',
  ],
  'sidebar-footer': [
    '[margin-top:auto] flex [gap:10px] items-center [padding:14px_9px_0] [color:var(--muted)]',
    '[&_strong]:block [&_strong]:[font-size:11px] [&_strong]:[font-weight:550] [&_strong]:[color:var(--secondary)]',
    '[&_small]:[font-size:10px] [&_small]:block',
    '[@media(max-width:800px)]:hidden',
  ],
  'app-header': [
    '[height:61px] [border-bottom:1px_solid_var(--border)] flex items-center justify-between [padding:0_35px] [background:var(--surface)] [font-size:12px] [color:var(--muted)]',
    '[@media(max-width:800px)]:[padding:0_20px]',
    '[@media(max-width:800px)]:[&_.text-xs]:hidden',
  ],
  'main-content': [
    '[max-width:1500px] [padding:35px_38px_60px] [margin:0_auto]',
    '[@media(max-width:1150px)]:[padding:27px_25px]',
    '[@media(max-width:800px)]:[padding:25px_20px]',
  ],
  'page-heading': [
    'flex items-start justify-between [gap:24px] [margin-bottom:29px]',
    '[&_h1_+_p]:[margin-top:9px] [&_h1_+_p]:[font-size:13px]',
    '[&_>_.button]:[margin-top:22px]',
    '[@media(max-width:1150px)]:[&_h1]:[font-size:27px]',
    '[@media(max-width:800px)]:flex-wrap [@media(max-width:800px)]:[gap:15px]',
    '[@media(max-width:800px)]:[&_>_.button]:[margin-top:0]',
    '[@media(max-width:800px)]:[&_h1]:[font-size:26px]',
  ],
  'skip-link': [
    'fixed [top:-100px] [left:240px] [background:var(--surface)] [color:var(--ink)] [z-index:200] [padding:10px] [border:1px_solid]',
    '[&:focus]:[top:10px]',
  ],
};
