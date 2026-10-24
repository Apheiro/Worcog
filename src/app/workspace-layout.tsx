'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { cva } from 'cva';
import { IconDatabase } from '@tabler/icons-react';
import { native } from '../infrastructure/native';
import { navigation, useWorcog } from '../providers/worcog';
import dynamic from 'next/dynamic';
import { EntityEditor } from '../components/editors';
import { FileDetail, SourceDetail } from '../components/related-dialogs';
import { UpdateDialog } from '../components/application-updates';
import { Button, Checkbox, Confirm } from '../components/core';
import { ScrollArea } from '../components/core/scroll-area';
import { ReminderFallback } from '../components/reminder-fallback';
import { LinkingBanner } from '../components/entity-links';
const DocumentWindows = dynamic(() => import('../components/document-windows').then((m) => m.DocumentWindows), { ssr: false });
const WorkspaceDock = dynamic(() => import('../components/workspace-dock').then((m) => m.WorkspaceDock), { ssr: false });

const navigationItem = cva({
  base: [
    'nav-item',
    'flex [gap:11px] items-center text-left w-full [padding:10px_12px] [border:none] [background:transparent] [color:var(--muted)] [border-radius:5px] [font-size:13px]',
    '[&:hover]:[background:var(--hover)]',
    '[&.selected]:[color:var(--ink)] [&.selected]:[background:var(--selected)] [&.selected]:[font-weight:600]',
    '[&_small]:ml-auto [&_small]:[background:var(--selected)] [&_small]:[border-radius:3px] [&_small]:[padding:0_5px] [&_small]:[font-size:10px]',
    '[&:nth-last-child(2)]:[margin-top:23px]',
    '[@media(max-width:800px)]:[&_span]:hidden',
    '[@media(max-width:800px)]:[&_small]:hidden',
    '[@media(max-width:800px)]:[padding:12px] [@media(max-width:800px)]:justify-center',
    'no-underline',
  ],
  variants: { selected: { true: 'selected', false: '' } },
});

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const {
    wb,
    updates,
    documents,
    w,
    page,
    editor,
    setEditor,
    sourceId,
    setSourceId,
    fileId,
    setFileId,
    confirmation,
    setConfirmation,
    purgeBackups,
    setPurgeBackups,
    selectedTopic,
    selectedSource,
    selectedFile,
    openTopic,
    openFile,
    askDelete,
    deleteRecord,
    heading,
    textureEnabled,
    textureOpacity,
  } = useWorcog();
  return (
    <div inert={documents.activeId !== null} className="app-shell flex h-full min-h-0 w-full">
      {textureEnabled && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[2147483647] [background-image:url(/assets/textures/noisy-texture.png)] [background-repeat:repeat] [background-size:100px_100px]"
          style={{ opacity: textureOpacity / 100 }}
        />
      )}
      <aside className="sidebar [width:228px] [background:var(--sidebar)] [border-right:1px_solid_var(--border)] flex flex-col [padding:29px_16px_20px] [&_nav]:flex [&_nav]:flex-col [&_nav]:[gap:4px] [@media(max-width:1150px)]:[width:200px] [@media(max-width:1150px)]:[padding:24px_12px] [@media(max-width:800px)]:[width:65px] [@media(max-width:800px)]:[padding:20px_8px] h-full">
        <div className="brand flex items-center [gap:11px] [padding:0_9px_32px] [font-size:19px] [font-weight:650] [letter-spacing:-0.5px] [line-height:1.25] [&_small]:block [&_small]:[color:var(--muted)] [&_small]:[font-size:11px] [&_small]:[font-weight:400] [&_small]:[letter-spacing:0] [&_small]:[margin-top:4px] [@media(max-width:800px)]:[padding:0_8px_25px] [@media(max-width:800px)]:[&_>_span:last-child]:hidden">
          <span className="brand-mark [width:31px] [height:33px] grid [place-items:center] [background:var(--primary)] [color:var(--on-primary)] [border-radius:6px] [font-size:18px]">
            W
          </span>
          <span>
            Worcog<small>Personal operations</small>
          </span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.id}
              className={navigationItem({ selected: page === item.id })}
              href={item.id === 'overview' ? '/' : '/' + item.id}
              onClick={() => setSourceId('')}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.id === 'topics' && <small>{w.topics.filter((t) => !t.archived).length}</small>}
            </Link>
          ))}
        </nav>
        <div
          className="sidebar-footer mt-auto flex items-center gap-2 px-2 pt-4 text-[11px] [color:var(--muted)] [@media(max-width:800px)]:hidden"
          role="status"
        >
          <IconDatabase size={14} aria-hidden="true" />
          <span>
            {wb.loading
              ? 'Opening database…'
              : wb.busy
                ? 'Saving…'
                : wb.ready
                  ? 'Stored on this device'
                  : 'Desktop runtime required'}
          </span>
        </div>
      </aside>
      <main id="main-content" className="flex-[1] flex flex-col h-full min-h-0 min-w-0">
        <header className="app-header [height:61px] [border-bottom:1px_solid_var(--border)] flex items-center justify-between [padding:0_35px] [background:var(--surface)] [font-size:12px] [color:var(--muted)] [@media(max-width:800px)]:[padding:0_20px] [@media(max-width:800px)]:[&_.text-xs]:hidden">
          <span>{selectedTopic ? 'Topics / Workspace' : heading}</span>
        </header>
        <LinkingBanner />
        <ScrollArea label="main" className="flex-1">
          <div className="main-content [max-width:1500px] [padding:35px_38px_60px] [margin:0_auto] [@media(max-width:1150px)]:[padding:27px_25px] [@media(max-width:800px)]:[padding:25px_20px]">
            {!wb.loading && !wb.ready && (
              <div className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px] mb-6">
                <strong>
                  {wb.error
                    ? 'Database could not be opened.'
                    : 'Desktop capabilities are unavailable in a browser.'}
                </strong>
                <p>
                  Run <code>pnpm tauri dev</code> to use SQLite, files and backups on this device.
                </p>
                {wb.error && (
                  <Button
                    size="sm"
                    onClick={() => {
                      void wb.refresh();
                    }}
                  >
                    Try again
                  </Button>
                )}
              </div>
            )}
            {wb.loading ? (
              <div
                className="empty [padding:45px_30px] [text-align:center] [border:1px_dashed_var(--border)] [border-radius:5px] [background:var(--surface)] [margin:20px_0] [color:var(--muted)] [&_h3]:[font-size:16px] [&_h3]:[color:var(--ink)] [&_h3]:[font-weight:550] [&_p]:[font-size:13px] [&_p]:[margin:10px_auto_16px] [&_p]:[max-width:500px]"
                role="status"
              >
                Opening your local workspace…
              </div>
            ) : (
              children
            )}
          </div>
        </ScrollArea>
      </main>
      <DocumentWindows />
      <WorkspaceDock />
      <ReminderFallback />
      {updates.open && <UpdateDialog updates={updates} />}
      {editor && (
        <EntityEditor
          key={`${editor.kind}:${editor.id ?? editor.topicId ?? 'new'}:${editor.parentId ?? 'root'}`}
          onDelete={deleteRecord}
          editor={editor}
          workspace={w}
          busy={wb.busy}
          error={wb.error}
          openFile={openFile}
          onClose={() => {
            if (!wb.busy) setEditor(null);
          }}
          onSave={wb.update}
        />
      )}
      {selectedSource && !editor && (
        <SourceDetail
          onDelete={() => askDelete({ kind: 'source', id: sourceId })}
          deleteFile={(id) => askDelete({ kind: 'attachment', id })}
          source={selectedSource}
          error={wb.error}
          w={w}
          close={() => setSourceId('')}
          edit={() => {
            setEditor({ kind: 'source', id: sourceId });
            setSourceId('');
          }}
          openTopic={openTopic}
          openOriginal={() => {
            void wb.run(() => native.openReference(selectedSource.url));
          }}
          openFile={openFile}
          manageFile={(id) => {
            setSourceId('');
            setFileId(id);
          }}
        />
      )}
      {selectedFile && (
        <FileDetail
          file={selectedFile}
          wb={wb}
          close={() => setFileId('')}
          onDelete={() => askDelete({ kind: 'attachment', id: fileId })}
        />
      )}
      {confirmation && (
        <Confirm
          confirmLabel={confirmation.confirmLabel}
          title={confirmation.title}
          description={confirmation.description}
          onCancel={() => {
            if (!wb.busy) setConfirmation(null);
          }}
          onConfirm={() => {
            void confirmation.action(purgeBackups);
          }}
          busy={wb.busy}
          error={wb.error}
        >
          {confirmation.includeBackups && (
            <label className="flex items-center gap-2 my-4">
              <Checkbox
                checked={purgeBackups}
                disabled={wb.busy}
                onCheckedChange={(checked) => setPurgeBackups(checked === true)}
              />{' '}
              Also delete local backups stored by Worcog
            </label>
          )}
        </Confirm>
      )}
    </div>
  );
}
