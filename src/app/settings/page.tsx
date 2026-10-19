'use client';
import { Card, CardHeader, CardContent } from '../../components/core/card';
import { IconDatabase, IconDownload, IconUpload } from '@tabler/icons-react';
import { native } from '../../infrastructure/native';
import { notifications } from '../../infrastructure/notifications';
import { TopicInactivitySettingsForm } from '../../components/topic-inactivity-settings';
import { ApplicationUpdates } from '../../components/application-updates';
import { Button } from '../../components/core';
import { useWorklog } from '../../providers/worklog';
import { WorkspaceSection } from '../../components/workspace-section';
export default function Page() {
  const {
    wb,
    updates,
    storage,
    setStorage,
    enabled,
    askDelete,
    inspectImport,
    inactivitySettings,
    setInactivitySettings,
  } = useWorklog();
  return (
    <WorkspaceSection>
      {
        <div className="settings [max-width:900px]">
          <ApplicationUpdates updates={updates} />
          <TopicInactivitySettingsForm
            key={JSON.stringify(inactivitySettings)}
            settings={inactivitySettings}
            onSave={setInactivitySettings}
          />
          <Card>
            <CardHeader>
              <h2>Back up and recover</h2>
            </CardHeader>
            <CardContent className="settings-body">
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
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
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
            </CardHeader>
            <CardContent className="settings-body">
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
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <h2>Permanent deletion</h2>
            </CardHeader>
            <CardContent className="settings-body">
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
            </CardContent>
          </Card>
        </div>
      }
    </WorkspaceSection>
  );
}
