'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { cva } from 'cva';
import { IconDatabase, IconRefresh } from '@tabler/icons-react';
import { native } from '../infrastructure/native';
import { navigation, useWorklog } from '../providers/worklog';
import dynamic from 'next/dynamic';
const UpdateDialog = dynamic(() =>
  import('../components/application-updates').then((m) => m.UpdateDialog),
);
const EntityEditor = dynamic(() => import('../components/editors').then((m) => m.EntityEditor));
const FileDetail = dynamic(() => import('../components/related-dialogs').then((m) => m.FileDetail));
const SourceDetail = dynamic(() =>
  import('../components/related-dialogs').then((m) => m.SourceDetail),
);
import { ThemeControl } from '../components/theme-control';
import { Button, Checkbox, Confirm } from '../components/core';
import { ScrollArea } from '../components/core/scroll-area';

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
  } = useWorklog();
  return (
    <div className="app-shell flex [min-height:100vh] h-dvh ">
      <aside className="sidebar [width:228px] [background:var(--sidebar)] [border-right:1px_solid_var(--border)] flex flex-col [padding:29px_16px_20px] [&_nav]:flex [&_nav]:flex-col [&_nav]:[gap:4px] [@media(max-width:1150px)]:[width:200px] [@media(max-width:1150px)]:[padding:24px_12px] [@media(max-width:800px)]:[width:65px] [@media(max-width:800px)]:[padding:20px_8px] h-full">
        <div className="brand flex items-center [gap:11px] [padding:0_9px_32px] [font-size:19px] [font-weight:650] [letter-spacing:-0.5px] [line-height:1.25] [&_small]:block [&_small]:[color:var(--muted)] [&_small]:[font-size:11px] [&_small]:[font-weight:400] [&_small]:[letter-spacing:0] [&_small]:[margin-top:4px] [@media(max-width:800px)]:[padding:0_8px_25px] [@media(max-width:800px)]:[&_>_span:last-child]:hidden">
          <span className="brand-mark [width:31px] [height:33px] grid [place-items:center] [background:var(--primary)] [color:var(--on-primary)] [border-radius:6px] [font-size:18px]">
            W
          </span>
          <span>
            Worklog<small>Personal operations</small>
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
        <div className="sidebar-footer [margin-top:auto] flex [gap:10px] items-center [padding:14px_9px_0] [color:var(--muted)] [&_strong]:block [&_strong]:[font-size:11px] [&_strong]:[font-weight:550] [&_strong]:[color:var(--secondary)] [&_small]:[font-size:10px] [&_small]:block [@media(max-width:800px)]:hidden">
          <IconDatabase size={17} />
          <div>
            <strong>Local workspace</strong>
            <small>
              {wb.loading
                ? 'Opening database…'
                : wb.ready
                  ? 'Stored on this device'
                  : 'Desktop runtime required'}
            </small>
          </div>
        </div>
      </aside>
      <main id="main-content" className="flex-[1] flex flex-col h-full">
        <header className="app-header [height:61px] [border-bottom:1px_solid_var(--border)] flex items-center justify-between [padding:0_35px] [background:var(--surface)] [font-size:12px] [color:var(--muted)] [@media(max-width:800px)]:[padding:0_20px] [@media(max-width:800px)]:[&_.text-xs]:hidden">
          <span>{selectedTopic ? 'Topics / Workspace' : heading}</span>
          <div className="flex items-center gap-4">
            <ThemeControl />
            <span className="muted [color:var(--muted)] text-xs">
              {wb.busy ? 'Saving…' : 'No integrations · No sync'}
            </span>
            <Button
              size="sm"
              aria-label="Reload workspace"
              disabled={wb.busy || !wb.ready}
              onClick={() => {
                void wb.refresh(true);
              }}
            >
              <IconRefresh size={16} />
            </Button>
          </div>
        </header>
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
              Also delete local backups stored by Worklog
            </label>
          )}
        </Confirm>
      )}
    </div>
  );
}
