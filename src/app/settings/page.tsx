'use client';
import { Card, CardHeader, CardContent } from '../../components/core/card';
import { IconDatabase, IconDownload, IconUpload } from '@tabler/icons-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/core/tabs';
import { native } from '../../infrastructure/native';
import { notifications } from '../../infrastructure/notifications';
import { TopicInactivitySettingsForm } from '../../components/topic-inactivity-settings';
import { ApplicationUpdates } from '../../components/application-updates';
import { Button, Switch, Input } from '../../components/core';
import { ReminderSettings } from '../../components/reminder-settings';
import { useWorcog } from '../../providers/worcog';
import { WorkspaceSection } from '../../components/workspace-section';
import { ThemeControl } from '../../components/theme-control';
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
    textureEnabled,
    setTextureEnabled,
    textureOpacity,
    setTextureOpacity,
    documentEditorEnabled,
    setDocumentEditorEnabled,
    taskContextMenu,
    setTaskContextMenu,
  } = useWorcog();
  return (
    <WorkspaceSection>
      <Tabs defaultValue="general" className="settings max-w-5xl">
        <TabsList aria-label="Settings sections">
          {[
            { value: 'general', label: 'General' },
            { value: 'storage', label: 'Storage & backups' },
            { value: 'updates', label: 'Updates' },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent forceMount value="general" className="flex flex-col gap-5">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2>Appearance</h2>
                  <p className="text-xs [color:var(--muted)]">Choose a theme for this device.</p>
                </div>
                <ThemeControl />
              </div>
              <div className="flex items-center justify-between gap-4 pt-4 [border-top:1px_solid_var(--border)]">
                <div className="flex flex-col gap-1">
                  <p id="texture-preference-label" className="text-sm font-medium">
                    Texture overlay
                  </p>
                  <p className="text-xs [color:var(--muted)]">Add a subtle grain across the app.</p>
                </div>
                <Switch
                  aria-labelledby="texture-preference-label"
                  checked={textureEnabled}
                  onCheckedChange={(checked) => setTextureEnabled(checked === true)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="texture-opacity" className="text-xs [color:var(--secondary)]">
                  Texture opacity
                </label>
                <Input
                  id="texture-opacity"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={textureOpacity}
                  aria-valuetext={`${textureOpacity}%`}
                  disabled={!textureEnabled}
                  onChange={(event) => setTextureOpacity(Number(event.target.value))}
                  className="min-w-24 max-w-64 flex-1 h-5 cursor-pointer [&.control]:p-0 [&.control]:border-0 [&.control]:bg-transparent [accent-color:var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <output
                  htmlFor="texture-opacity"
                  className="w-9 text-right text-xs tabular-nums [color:var(--muted)]"
                >
                  {textureOpacity}%
                </output>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <h2 id="document-editor-label">Open documents in Worcog</h2>
                <p id="document-editor-description" className="max-w-xl text-xs [color:var(--muted)]">
                  Open Word, Excel, PowerPoint and CSV attachments in the integrated editor.
                  PDFs and other formats use your default application.
                  The editor loads from edit.chaxus.com and processes files on this device;
                  an internet connection is needed to load it. Changes are saved to your local attachment.
                  Turn this off to open files with your default application. Open documents remain available.
                </p>
              </div>
              <Switch
                aria-labelledby="document-editor-label"
                aria-describedby="document-editor-description"
                checked={documentEditorEnabled}
                onCheckedChange={(checked) => setDocumentEditorEnabled(checked === true)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <h2 id="task-context-menu-label">Context menus</h2>
                <p id="task-context-menu-description" className="max-w-xl text-xs [color:var(--muted)]">
                  Replace task three-dot buttons with right-click menus. In the Topics list,
                  right-click a row to edit, archive or delete its topic.
                  You can also focus a task or topic and press Shift + F10, or long-press on touch devices.
                </p>
              </div>
              <Switch
                aria-labelledby="task-context-menu-label"
                aria-describedby="task-context-menu-description"
                checked={taskContextMenu}
                onCheckedChange={setTaskContextMenu}
              />
            </CardContent>
          </Card>
          <TopicInactivitySettingsForm
            key={JSON.stringify(inactivitySettings)}
            settings={inactivitySettings}
            onSave={setInactivitySettings}
          />
          <ReminderSettings />
        </TabsContent>
        <TabsContent forceMount value="storage" className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <h2>Back up and recover</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm [color:var(--muted)]">
                Backups and exports contain a versioned JSON manifest and all managed files in a ZIP
                archive. Keep an export on another device for protection against disk loss.
              </p>
              <div className="flex flex-wrap gap-2">
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
              <p className="text-xs [color:var(--muted)]">
                Restore validates the archive, shows a summary, requests confirmation, and creates a
                safety backup before replacing the workspace. It does not merge records. Archives
                are unencrypted; store them privately.
              </p>
            </CardContent>
          </Card>
          <Card>
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
            <CardContent className="flex flex-col gap-4">
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
              <p className="text-xs [color:var(--muted)]">
                SQLite and managed attachments live in persistent application data. Cache is
                separate and contains no primary records. Unlinking files preserves their managed
                copies.
              </p>
            </CardContent>
          </Card>
          <Card className="[border-color:var(--danger-border)]">
            <CardHeader>
              <h2 className="[color:var(--danger-ink)]">Permanent deletion</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm [color:var(--muted)]">
                Delete individual items using their trash buttons. Delete all removes every topic,
                task, source, activity record and managed file. You can also include local backups in the
                confirmation.
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
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
        </TabsContent>
        <TabsContent forceMount value="updates">
          <ApplicationUpdates updates={updates} />
        </TabsContent>
      </Tabs>
    </WorkspaceSection>
  );
}
