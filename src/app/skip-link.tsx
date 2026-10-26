'use client';
import { useTranslations } from 'next-intl';

export function SkipLink() {
  const t = useTranslations('ui');
  return (
    <a
      className="skip-link fixed [top:-100px] [left:240px] [background:var(--surface)] [color:var(--ink)] [z-index:200] [padding:10px] [border:1px_solid] [&:focus]:[top:10px]"
      href="#main-content"
    >
      {t('skip_to_content')}
    </a>
  );
}
