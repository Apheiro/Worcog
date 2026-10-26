import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Markdown from 'markdown-to-jsx';
import { WorkspaceSection } from '../../components/workspace-section';
import { GuideContent } from './guide-content';

// Read at build time so the desktop static export includes both guides offline.
export const dynamic = 'force-static';

export default async function Page() {
  const [english, spanish] = await Promise.all([
    readFile(path.join(process.cwd(), 'docs/user-guide.md'), 'utf8'),
    readFile(path.join(process.cwd(), 'docs/user-guide.es.md'), 'utf8'),
  ]);
  const markdownOptions = {
    disableParsingRawHTML: true,
    slugify: (heading: string) =>
      heading
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-'),
  };
  return (
    <WorkspaceSection>
      <article className="max-w-4xl text-[13px] [line-height:1.8] [overflow-wrap:anywhere] [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-5 [&_h2]:[border-top:1px_solid_var(--border)] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:scroll-mt-6 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-medium [&_p]:my-3 [&_p]:[color:var(--secondary)] [&_ul]:my-3 [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:pl-5 [&_li]:my-1 [&_li]:[color:var(--secondary)] [&_strong]:[color:var(--ink)] [&_a]:[color:var(--ink)] [&_a]:underline [&_a]:underline-offset-3 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-3 [&_a:focus-visible]:[outline-color:var(--focus)] [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:[background:var(--surface-soft)] [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:my-4 [&_table]:text-xs [&_th]:text-left [&_th]:font-medium [&_th]:[color:var(--ink)] [&_th]:[background:var(--surface-soft)] [&_th]:p-3 [&_td]:p-3 [&_td]:[color:var(--secondary)] [&_th]:[border-bottom:1px_solid_var(--border)] [&_td]:[border-bottom:1px_solid_var(--border)]">
        <GuideContent
          en={<Markdown options={markdownOptions}>{english}</Markdown>}
          es={<Markdown options={markdownOptions}>{spanish}</Markdown>}
        />
      </article>
    </WorkspaceSection>
  );
}
