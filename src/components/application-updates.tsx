'use client';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { IconDownload } from '@tabler/icons-react';
import Markdown from 'markdown-to-jsx';
import { useState, type ReactNode } from 'react';
import { errorMessage, native } from '../infrastructure/native';
import { notifications } from '../infrastructure/notifications';
import type { UpdateController } from '../infrastructure/use-updates';
import { Button, Field, Input, Modal } from './ui';

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
      className="release-notes"
      options={{ disableParsingRawHTML: true, overrides: { a: ReleaseLink, img: () => null } }}
    >
      {notes || 'No release notes were provided.'}
    </Markdown>
  );
}
export function ApplicationUpdates({ updates: u }: { updates: UpdateController }) {
  const [token, setToken] = useState('');
  return (
    <section className="section mt-6">
      <div className="section-heading">
        <h2>Application updates</h2>
      </div>
      <div className="settings-body">
        <p>
          Download verified Windows x64 updates from Apheiro/Worklog on GitHub. Updates are
          installed manually.
        </p>
        <p className="muted text-sm my-3">
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
          <p className="muted text-sm">
            Downloading application updates is supported on Windows x64.
          </p>
        )}
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
          <p className="muted text-sm my-3">
            Public repositories work without a token. For a private repository, use a fine-grained
            personal access token restricted to Apheiro/Worklog with Contents: Read. This also
            permits reading repository source code; GitHub does not provide a releases-only read
            permission here. Production tokens stay in Windows Credential Manager.
          </p>
          {u.status?.profile === 'development' && (
            <p className="notice my-3">
              Development profile: this token is stored unencrypted in this browser&apos;s separate
              localStorage entry. It is never copied to or from Windows production credentials.
              Requests still go to the real GitHub repository through Rust.
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
        {u.error && <p className="notice mt-4">{u.error}</p>}
      </div>
    </section>
  );
}
export function UpdateDialog({ updates: u }: { updates: UpdateController }) {
  if (!u.open || !u.available) return null;
  return (
    <Modal
      className="update-modal"
      title={`Worklog ${u.available.version} is available`}
      description={`Installed: ${u.available.currentVersion} · Download: ${u.available.filename} · ${(u.available.size / 1024 / 1024).toFixed(1)} MiB`}
      onClose={u.close}
      wide
    >
      <div className="update-dialog-body">
        <ScrollArea.Root className="release-scroll">
          <ScrollArea.Viewport className="release-viewport" tabIndex={0} aria-label="Release notes">
            <ReleaseNotes notes={u.available.notes} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" className="release-scrollbar">
            <ScrollArea.Thumb className="release-thumb" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
        {u.error && <p className="notice my-3">{u.error}</p>}
        {u.receipt && (
          <section
            className="update-receipt"
            tabIndex={0}
            aria-label="Manual replacement instructions"
          >
            <h3>Verified download</h3>
            <dl className="metadata my-3">
              <dt>New executable</dt>
              <dd>{u.receipt.downloadPath}</dd>
              <dt>Running executable</dt>
              <dd>{u.receipt.currentExecutable}</dd>
            </dl>
            <ol>
              <li>Close Worklog normally.</li>
              <li>Keep a copy of your previous EXE.</li>
              <li>
                Replace the previous EXE with the downloaded file in the application location shown
                above.
              </li>
              <li>
                Run the new executable. Your workspace remains in its existing application-data
                directory.
              </li>
            </ol>
          </section>
        )}
        <p className="muted text-xs my-3">
          SHA-256 checks integrity against GitHub metadata. It does not replace an independent
          publisher signature. Worklog will not close, run or replace executables automatically.
        </p>
        <div className="form-footer">
          <Button disabled={!!u.busy} onClick={u.close}>
            Close
          </Button>
          {u.receipt ? (
            <Button
              disabled={!!u.busy}
              onClick={() => {
                void u.openFolder();
              }}
            >
              Open download folder
            </Button>
          ) : (
            <Button
              tone="primary"
              disabled={!!u.busy || !u.status?.platformSupported}
              onClick={() => {
                void u.download();
              }}
            >
              <IconDownload size={16} />
              {u.busy === 'download'
                ? 'Downloading and verifying…'
                : u.error
                  ? 'Retry download'
                  : 'Download update'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
