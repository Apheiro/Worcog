'use client';
import { Card, CardHeader, CardContent } from './core/card';
import { IconDownload } from '@tabler/icons-react';
import Markdown from 'markdown-to-jsx';
import { useState, type ReactNode } from 'react';
import { errorMessage, native } from '../infrastructure/native';
import { notifications } from '../infrastructure/notifications';
import type { UpdateController } from '../infrastructure/use-updates';
import { Button, Field, Input, Modal } from './core';

function displayExecutablePath(path: string) {
  if (path.startsWith('\\\\?\\UNC\\')) return '\\\\' + path.slice(8);
  if (path.startsWith('\\\\?\\') && /^[a-z]:\\/i.test(path.slice(4))) return path.slice(4);
  return path;
}

function ReleaseLink({ href, children }: { href?: string; children?: ReactNode }) {
  let safeHref: string | null = null;
  try {
    const url = new URL(href ?? '');
    if (url.protocol === 'https:' && !url.username && !url.password) safeHref = url.href;
  } catch {}
  if (!safeHref) return <span>{children}</span>;
  return (
    <a
      href={safeHref}
      onClick={(event) => {
        event.preventDefault();
        void native
          .openReference(safeHref)
          .catch((cause) => notifications.error(errorMessage(cause)));
      }}
    >
      {children}
    </a>
  );
}
export function ReleaseNotes({ notes }: { notes: string }) {
  return (
    <Markdown
      className="release-notes [overflow-wrap:anywhere] [line-height:1.6] [font-size:13px] [&_:is(h1,_h2,_h3,_h4,_p,_ul,_ol,_pre,_blockquote)]:[margin:12px_0] [&_:is(ul,_ol)]:[padding-left:22px] [&_pre]:[white-space:pre-wrap] [&_pre]:[background:var(--surface-soft)] [&_pre]:[padding:10px] [&_a]:[text-decoration:underline] [&_table]:w-full [&_table]:[font-size:12px]"
      options={{ disableParsingRawHTML: true, overrides: { a: ReleaseLink, img: () => null } }}
    >
      {notes || 'No release notes were provided.'}
    </Markdown>
  );
}
export function ApplicationUpdates({ updates: u }: { updates: UpdateController }) {
  const [token, setToken] = useState('');
  return (
    <Card>
      <CardHeader>
        <h2>Application updates</h2>
      </CardHeader>
      <CardContent className="settings-body">
        <p>
          Download verified updates for this operating system from Apheiro/Worcog on GitHub.
          Windows uses a portable EXE; macOS uses a ZIP containing Worcog.app. Updates are installed manually.
        </p>
        <p className="muted [color:var(--muted)] text-sm my-3">
          Installed: {u.status?.currentVersion ?? '…'} · Profile: {u.status?.profile ?? '…'} ·{' '}
          {u.status?.tokenSaved ? 'GitHub token saved' : 'Anonymous access'}
        </p>
        <div className="flex flex-wrap gap-3 my-4">
          <Button
            disabled={!!u.busy}
            onClick={() => {
              void u.check();
            }}
          >
            {u.busy === 'check' ? 'Checking…' : 'Check for updates'}
          </Button>
          {u.available && <Button onClick={u.show}>View update {u.available.version}</Button>}
        </div>
        {!u.status?.platformSupported && u.status && (
          <p className="muted [color:var(--muted)] text-sm">
            Downloading application updates is supported on Windows x64 and macOS (Intel and Apple Silicon).
          </p>
        )}
        <details className="mt-5 rounded [border:1px_solid_var(--border)] p-4">
          <summary className="cursor-pointer text-xs font-medium">
            Private repository access
          </summary>
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              void u.saveToken(token).then((saved) => {
                if (saved) setToken('');
              });
            }}
          >
            <Field
              label="GitHub token (optional)"
              hint="Leave this empty unless you want to replace the saved token. Its value cannot be retrieved here."
            >
              <Input
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={!!u.busy || !u.status?.credentialSupported}
              />
            </Field>
            <p className="muted [color:var(--muted)] text-sm my-3">
              Public repositories work without a token. For a private repository, use a fine-grained
              personal access token restricted to Apheiro/Worcog with Contents: Read. This also
              permits reading repository source code; GitHub does not provide a releases-only read
              permission here. Production tokens stay in Windows Credential Manager or macOS Keychain.
            </p>
            {u.status?.profile === 'development' && (
              <p className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px] my-3">
                Development profile: this token is stored unencrypted in this browser&apos;s
                separate localStorage entry. It is never copied to or from the system's production
                credentials. Requests still go to the real GitHub repository through Rust.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!!u.busy || !token || !u.status?.credentialSupported}>
                {u.busy === 'credential' ? 'Saving…' : 'Save / replace token'}
              </Button>
              <Button
                type="button"
                disabled={!!u.busy || !u.status?.tokenSaved}
                onClick={() => {
                  setToken('');
                  void u.saveToken(null);
                }}
              >
                Remove token
              </Button>
            </div>
          </form>
        </details>
        {u.error && (
          <p className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px] mt-4">
            {u.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
export function UpdateDialog({ updates: u }: { updates: UpdateController }) {
  if (!u.open || !u.available) return null;
  return (
    <Modal
      className="update-modal [&.update-modal]:[top:20px] [&.update-modal]:[transform:translateX(-50%)] [&.update-modal]:[height:min(780px,_calc(100dvh_-_140px))] [&.update-modal]:[max-height:calc(100dvh_-_140px)]"
      title={`Worcog ${u.available.version} is available`}
      description={`Installed: ${u.available.currentVersion} · Download: ${u.available.filename} · ${(u.available.size / 1024 / 1024).toFixed(1)} MiB`}
      onClose={u.close}
      wide
      footer={
        <>
          <Button disabled={!!u.busy} onClick={u.close}>Close</Button>
          {u.receipt ? (
            <Button disabled={!!u.busy} onClick={() => { void u.openFolder(); }}>
              Open download folder
            </Button>
          ) : (
            <Button tone="primary" disabled={!!u.busy || !u.status?.platformSupported} onClick={() => { void u.download(); }}>
              <IconDownload size={16} />
              {u.busy === 'download' ? 'Downloading and verifying…' : u.error ? 'Retry download' : 'Download update'}
            </Button>
          )}
        </>
      }
    >
      <div className="update-dialog-body">
        <ReleaseNotes notes={u.available.notes} />
        {u.error && (
          <p className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px] my-3">
            {u.error}
          </p>
        )}
        {u.receipt && (
          <section
            className="update-receipt [&_ol]:[padding-left:22px] [font-size:12px] [&_dd]:[overflow-wrap:anywhere] [&:focus-visible]:[outline:2px_solid_var(--focus)] [&:focus-visible]:[outline-offset:-2px]"
            tabIndex={0}
            aria-label="Manual replacement instructions"
          >
            <h3>Verified download</h3>
            <dl className="metadata grid [grid-template-columns:100px_minmax(0,_1fr)] [font-size:12px] [gap:10px_15px] [&_dt]:[color:var(--muted)] [&_dd]:m-0 my-3">
              <dt>Downloaded file</dt>
              <dd>{displayExecutablePath(u.receipt.downloadPath)}</dd>
              <dt>Running app</dt>
              <dd>{displayExecutablePath(u.receipt.currentExecutable)}</dd>
            </dl>
            <ol>
              <li>Close Worcog normally.</li>
              <li>Keep a copy of your previous {u.status?.platform === 'macos' ? 'Worcog.app' : 'EXE'}.</li>
              {u.status?.platform === 'macos' ? (
                <li>Extract the ZIP and replace the previous Worcog.app with the extracted app. macOS may require you to authorize its first launch in Privacy &amp; Security.</li>
              ) : (
                <li>Replace the previous EXE with the downloaded file in the application location shown above.</li>
              )}
              <li>
                Open the new app. Your workspace remains in its existing application-data
                directory.
              </li>
            </ol>
          </section>
        )}
        <p className="muted [color:var(--muted)] text-xs my-3">
          SHA-256 checks integrity against GitHub metadata. It does not replace an independent
          publisher signature. Worcog will not close, run or replace the app automatically.
        </p>
      </div>
    </Modal>
  );
}
