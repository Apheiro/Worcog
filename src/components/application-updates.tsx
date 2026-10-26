'use client';
import { useTranslations } from 'next-intl';
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
  const tr = useTranslations('ui');
  return (
    <Markdown
      className="release-notes [overflow-wrap:anywhere] [line-height:1.6] [font-size:13px] [&_:is(h1,_h2,_h3,_h4,_p,_ul,_ol,_pre,_blockquote)]:[margin:12px_0] [&_:is(ul,_ol)]:[padding-left:22px] [&_pre]:[white-space:pre-wrap] [&_pre]:[background:var(--surface-soft)] [&_pre]:[padding:10px] [&_a]:[text-decoration:underline] [&_table]:w-full [&_table]:[font-size:12px]"
      options={{ disableParsingRawHTML: true, overrides: { a: ReleaseLink, img: () => null } }}
    >
      {notes || tr('no_release_notes_were_provided')}
    </Markdown>
  );
}
export function ApplicationUpdates({ updates: u }: { updates: UpdateController }) {
  const tr = useTranslations('ui');
  const [token, setToken] = useState('');
  return (
    <Card>
      <CardHeader>
        <h2> {tr('application_updates')} </h2>
      </CardHeader>
      <CardContent className="settings-body">
        <p>
          {tr(
            'download_verified_updates_for_this_operating_system_from_apheiro_worcog_on_github_windows_uses_a_por',
          )}{' '}
        </p>
        <p className="muted [color:var(--muted)] text-sm my-3">
          {tr('installed')} {u.status?.currentVersion ?? '…'} {tr('profile')}{' '}
          {u.status?.profile ?? '…'} ·{' '}
          {u.status?.tokenSaved ? tr('github_token_saved') : tr('anonymous_access')}
        </p>
        <div className="flex flex-wrap gap-3 my-4">
          <Button
            disabled={!!u.busy}
            onClick={() => {
              void u.check();
            }}
          >
            {u.busy === 'check' ? tr('checking') : tr('check_for_updates')}
          </Button>
          {u.available && (
            <Button onClick={u.show}>
              {' '}
              {tr('view_update')} {u.available.version}
            </Button>
          )}
        </div>
        {!u.status?.platformSupported && u.status && (
          <p className="muted [color:var(--muted)] text-sm">
            {tr(
              'downloading_application_updates_is_supported_on_windows_x64_and_macos_intel_and_apple_silicon',
            )}{' '}
          </p>
        )}
        <details className="mt-5 rounded [border:1px_solid_var(--border)] p-4">
          <summary className="cursor-pointer text-xs font-medium">
            {tr('private_repository_access')}{' '}
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
              label={tr('github_token_optional')}
              hint={tr(
                'leave_this_empty_unless_you_want_to_replace_the_saved_token_its_value_cannot_be_retrieved_here',
              )}
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
              {tr(
                'public_repositories_work_without_a_token_for_a_private_repository_use_a_fine_grained_personal_access',
              )}{' '}
            </p>
            {u.status?.profile === 'development' && (
              <p className="notice [border:1px_solid_var(--warning-border)] [background:var(--warning-bg)] [color:var(--warning-ink)] [padding:13px_16px] [border-radius:4px] [font-size:12px] [&_p]:[margin-top:5px] my-3">
                {tr(
                  'development_profile_this_token_is_stored_unencrypted_in_this_browser_apos_s_separate_localstorage_en',
                )}{' '}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!!u.busy || !token || !u.status?.credentialSupported}>
                {u.busy === 'credential' ? tr('saving') : tr('save_replace_token')}
              </Button>
              <Button
                type="button"
                disabled={!!u.busy || !u.status?.tokenSaved}
                onClick={() => {
                  setToken('');
                  void u.saveToken(null);
                }}
              >
                {tr('remove_token')}{' '}
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
  const tr = useTranslations('ui');
  if (!u.open || !u.available) return null;
  return (
    <Modal
      className="update-modal [&.update-modal]:[top:20px] [&.update-modal]:[transform:translateX(-50%)] [&.update-modal]:[height:min(780px,_calc(100dvh_-_140px))] [&.update-modal]:[max-height:calc(100dvh_-_140px)]"
      title={tr('worcog_value0_is_available', { value0: u.available.version })}
      description={tr('installed_value0_download_value1_value2_mib', {
        value0: u.available.currentVersion,
        value1: u.available.filename,
        value2: (u.available.size / 1024 / 1024).toFixed(1),
      })}
      onClose={u.close}
      wide
      footer={
        <>
          <Button disabled={!!u.busy} onClick={u.close}>
            {' '}
            {tr('close')}{' '}
          </Button>
          {u.receipt ? (
            <Button
              disabled={!!u.busy}
              onClick={() => {
                void u.openFolder();
              }}
            >
              {tr('open_download_folder')}{' '}
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
                ? tr('downloading_and_verifying')
                : u.error
                  ? tr('retry_download')
                  : tr('download_update')}
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
            aria-label={tr('manual_replacement_instructions')}
          >
            <h3> {tr('verified_download')} </h3>
            <dl className="metadata grid [grid-template-columns:100px_minmax(0,_1fr)] [font-size:12px] [gap:10px_15px] [&_dt]:[color:var(--muted)] [&_dd]:m-0 my-3">
              <dt> {tr('downloaded_file')} </dt>
              <dd>{displayExecutablePath(u.receipt.downloadPath)}</dd>
              <dt> {tr('running_app')} </dt>
              <dd>{displayExecutablePath(u.receipt.currentExecutable)}</dd>
            </dl>
            <ol>
              <li> {tr('close_worcog_normally')} </li>
              <li>
                {' '}
                {tr('keep_a_copy_of_your_previous')}{' '}
                {u.status?.platform === 'macos' ? tr('worcog_app') : tr('exe')}.
              </li>
              {u.status?.platform === 'macos' ? (
                <li>
                  {' '}
                  {tr(
                    'extract_the_zip_and_replace_the_previous_worcog_app_with_the_extracted_app_macos_may_require_you_to_',
                  )}{' '}
                </li>
              ) : (
                <li>
                  {' '}
                  {tr(
                    'replace_the_previous_exe_with_the_downloaded_file_in_the_application_location_shown_above',
                  )}{' '}
                </li>
              )}
              <li>
                {tr(
                  'open_the_new_app_your_workspace_remains_in_its_existing_application_data_directory',
                )}{' '}
              </li>
            </ol>
          </section>
        )}
        <p className="muted [color:var(--muted)] text-xs my-3">
          {tr(
            'sha_256_checks_integrity_against_github_metadata_it_does_not_replace_an_independent_publisher_signat',
          )}{' '}
        </p>
      </div>
    </Modal>
  );
}
