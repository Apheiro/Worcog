'use client';
import { IconDatabase, IconDownload, IconUpload } from '@tabler/icons-react';
import { native } from '../../infrastructure/native';
import { notifications } from '../../infrastructure/notifications';
import { ApplicationUpdates } from '../application-updates';
import { Button } from '../ui';
import { useWorklog } from '../worklog';
import { Section } from './section';
export default function Route() {
  const { wb, updates, storage, setStorage, enabled, askDelete, inspectImport } = useWorklog();
  return (
    <Section>
      {
        <div className="settings [max-width:900px]">
          <ApplicationUpdates updates={updates} />
          <section className="section [border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] overflow-hidden [&_.table-wrap]:border-0 [&_.table-wrap]:rounded-none [&_.empty]:border-0 [&_.empty]:rounded-none [&_.empty]:m-0">
            <div className="section-heading [padding:16px_20px] flex items-center justify-between [gap:15px] [min-height:58px] [border-bottom:1px_solid_var(--border)]">
              <h2>Back up and recover</h2>
            </div>
            <div className="settings-body [padding:21px] [font-size:13px]">
              <p>
                Backups and exports contain a versioned JSON manifest and all managed files in a ZIP
                archive. Keep an export on another device for protection against disk loss.
              </p>
              <div className="flex flex-wrap gap-3 my-5">
                <Button
                  disabled={!enabled}
                  onClick={() => {
                    void wb.run(async () => {
                      const path = await native.backup();
                      notifications.success(`Backup created: ${path}`);
                    });
                  }}
                >
                  <IconDatabase size={17} /> Create backup
                </Button>
                <Button
                  disabled={!enabled}
                  onClick={() => {
                    void wb.run(async () => {
                      const path = await native.export();
                      if (path) notifications.success(`Export saved: ${path}`);
                      else notifications.info('Export canceled.');
                    });
                  }}
                >
                  <IconDownload size={17} /> Export archive…
                </Button>
                <Button
                  disabled={!enabled}
                  onClick={() => {
                    void inspectImport();
                  }}
                >
                  <IconUpload size={17} /> Import / restore…
                </Button>
              </div>
              <p className="muted [color:var(--muted)] text-sm">
                Restore validates the archive, shows a summary, requests confirmation, and creates a
                safety backup before replacing the workspace. It does not merge records. Archives
                are unencrypted; store them privately.
              </p>
            </div>
          </section>
          <section className="section [border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] overflow-hidden [&_.table-wrap]:border-0 [&_.table-wrap]:rounded-none [&_.empty]:border-0 [&_.empty]:rounded-none [&_.empty]:m-0 mt-6">
            <div className="section-heading [padding:16px_20px] flex items-center justify-between [gap:15px] [min-height:58px] [border-bottom:1px_solid_var(--border)]">
              <h2>Storage locations</h2>
              <Button
                size="sm"
                disabled={!enabled}
                onClick={() => {
                  void wb.run(async () => setStorage(await native.storage()));
                }}
              >
                Show locations
              </Button>
            </div>
            <div className="settings-body [padding:21px] [font-size:13px]">
              {storage ? (
                <dl className="metadata grid [grid-template-columns:100px_minmax(0,_1fr)] [font-size:12px] [gap:10px_15px] [&_dt]:[color:var(--muted)] [&_dd]:m-0">
                  {Object.entries(storage).map(([key, value]) => (
                    <div className="contents" key={key}>
                      <dt>{key}</dt>
                      <dd className="break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="muted [color:var(--muted)]">
                  Locations are resolved by Tauri for the current operating system.
                </p>
              )}
              <p className="mt-4 text-sm">
                SQLite and managed attachments live in persistent application data. Cache is
                separate and contains no primary records. Unlinking files preserves their managed
                copies.
              </p>
            </div>
          </section>
          <section className="section [border:1px_solid_var(--border)] [border-radius:5px] [background:var(--surface)] overflow-hidden [&_.table-wrap]:border-0 [&_.table-wrap]:rounded-none [&_.empty]:border-0 [&_.empty]:rounded-none [&_.empty]:m-0 mt-6">
            <div className="section-heading [padding:16px_20px] flex items-center justify-between [gap:15px] [min-height:58px] [border-bottom:1px_solid_var(--border)]">
              <h2>Permanent deletion</h2>
            </div>
            <div className="settings-body [padding:21px] [font-size:13px]">
              <p>
                Delete individual items using their trash buttons. Delete all removes every topic,
                task, source, annotation and managed file. You can also include local backups in the
                confirmation.
              </p>
              <div className="flex flex-wrap gap-3 my-5">
                <Button
                  disabled={!enabled}
                  onClick={() => {
                    void wb.run(async () => {
                      const warning = await native.cleanup();
                      if (warning) notifications.warning(warning);
                      else {
                        notifications.clearWarnings();
                        notifications.success('File cleanup complete.');
                      }
                    });
                  }}
                >
                  Retry file cleanup
                </Button>
                <Button
                  tone="danger"
                  disabled={!enabled}
                  onClick={() => askDelete({ kind: 'workspace' })}
                >
                  Delete all workspace data
                </Button>
              </div>
            </div>
          </section>
        </div>
      }
    </Section>
  );
}
