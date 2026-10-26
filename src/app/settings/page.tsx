'use client';
import { useLabels } from '../../i18n/use-labels';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardContent } from '../../components/core/card';
import { IconDatabase, IconDownload, IconUpload } from '@tabler/icons-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/core/tabs';
import { native } from '../../infrastructure/native';
import { notifications } from '../../infrastructure/notifications';
import { TopicInactivitySettingsForm } from '../../components/topic-inactivity-settings';
import { ApplicationUpdates } from '../../components/application-updates';
import { Button, Switch, Input, Select, Field } from '../../components/core';
import { useLanguage } from '../../providers/language';
import { ReminderSettings } from '../../components/reminder-settings';
import { useWorcog } from '../../providers/worcog';
import { WorkspaceSection } from '../../components/workspace-section';
import { ThemeControl } from '../../components/theme-control';
import { ShortcutSettings } from '../../components/shortcut-settings';
export default function Page() {
  const localize = useLabels();
  const tr = useTranslations('ui');
  const { language, setLanguage } = useLanguage();
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
    showTaskRelations,
    setShowTaskRelations,
  } = useWorcog();
  return (
    <WorkspaceSection>
      <Tabs defaultValue="general" className="settings max-w-5xl">
        <TabsList aria-label={tr('settings_sections')}>
          {[
            { value: 'general', label: tr('general') },
            { value: 'storage', label: tr('storage_backups') },
            { value: 'updates', label: tr('updates') },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {localize(tab.label)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent forceMount value="general" className="flex flex-col gap-5">
          <Card>
            <CardContent>
              <Field
                label={tr('language')}
                hint={tr(
                  'applies_immediately_on_this_device_your_content_keeps_its_original_language',
                )}
              >
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value === 'es' ? 'es' : 'en')}
                  options={[
                    { value: 'en', label: tr('english') },
                    { value: 'es', label: tr('espanol') },
                  ]}
                />
              </Field>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2> {tr('appearance')} </h2>
                  <p className="text-xs [color:var(--muted)]">
                    {' '}
                    {tr('choose_a_theme_for_this_device')}{' '}
                  </p>
                </div>
                <ThemeControl />
              </div>
              <div className="flex items-center justify-between gap-4 pt-4 [border-top:1px_solid_var(--border)]">
                <div className="flex flex-col gap-1">
                  <p id="texture-preference-label" className="text-sm font-medium">
                    {tr('texture_overlay')}{' '}
                  </p>
                  <p className="text-xs [color:var(--muted)]">
                    {' '}
                    {tr('add_a_subtle_grain_across_the_app')}{' '}
                  </p>
                </div>
                <Switch
                  aria-labelledby="texture-preference-label"
                  checked={textureEnabled}
                  onCheckedChange={(checked) => setTextureEnabled(checked === true)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="texture-opacity" className="text-xs [color:var(--secondary)]">
                  {tr('texture_opacity')}{' '}
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
                <h2 id="document-editor-label"> {tr('open_documents_in_worcog')} </h2>
                <p
                  id="document-editor-description"
                  className="max-w-xl text-xs [color:var(--muted)]"
                >
                  {tr(
                    'open_word_excel_powerpoint_and_csv_attachments_in_the_integrated_editor_pdfs_and_other_formats_use_y',
                  )}{' '}
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
                <h2 id="task-context-menu-label"> {tr('context_menus')} </h2>
                <p
                  id="task-context-menu-description"
                  className="max-w-xl text-xs [color:var(--muted)]"
                >
                  {tr(
                    'replace_task_three_dot_buttons_with_right_click_menus_in_the_topics_list_right_click_a_row_to_edit_a',
                  )}{' '}
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
          <Card>
            <CardContent className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h2 id="task-relations-label"> {tr('show_task_relationships')} </h2>
                <p id="task-relations-description" className="text-xs [color:var(--muted)]">
                  {' '}
                  {tr(
                    'show_linked_items_below_task_attachments_connections_remain_available_from_the_point_on_each_task_wh',
                  )}{' '}
                </p>
              </div>
              <Switch
                aria-labelledby="task-relations-label"
                aria-describedby="task-relations-description"
                checked={showTaskRelations}
                onCheckedChange={setShowTaskRelations}
              />
            </CardContent>
          </Card>
          <ShortcutSettings />
          <ReminderSettings />
        </TabsContent>
        <TabsContent forceMount value="storage" className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <h2> {tr('back_up_and_recover')} </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm [color:var(--muted)]">
                {tr(
                  'backups_and_exports_contain_a_versioned_json_manifest_and_all_managed_files_in_a_zip_archive_keep_an',
                )}{' '}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!enabled}
                  onClick={() => {
                    void wb.run(async () => {
                      const path = await native.backup();
                      notifications.success(tr('backup_created_value0', { value0: path }));
                    });
                  }}
                >
                  <IconDatabase size={17} /> {tr('create_backup')}{' '}
                </Button>
                <Button
                  disabled={!enabled}
                  onClick={() => {
                    void wb.run(async () => {
                      const path = await native.export();
                      if (path) notifications.success(tr('export_saved_value0', { value0: path }));
                      else notifications.info(tr('export_canceled'));
                    });
                  }}
                >
                  <IconDownload size={17} /> {tr('export_archive')}{' '}
                </Button>
                <Button
                  disabled={!enabled}
                  onClick={() => {
                    void inspectImport();
                  }}
                >
                  <IconUpload size={17} /> {tr('import_restore')}{' '}
                </Button>
              </div>
              <p className="text-xs [color:var(--muted)]">
                {tr(
                  'restore_validates_the_archive_shows_a_summary_requests_confirmation_and_creates_a_safety_backup_befo',
                )}{' '}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2> {tr('storage_locations')} </h2>
              <Button
                size="sm"
                disabled={!enabled}
                onClick={() => {
                  void wb.run(async () => setStorage(await native.storage()));
                }}
              >
                {tr('show_locations')}{' '}
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {storage ? (
                <dl className="metadata grid [grid-template-columns:100px_minmax(0,_1fr)] [font-size:12px] [gap:10px_15px] [&_dt]:[color:var(--muted)] [&_dd]:m-0">
                  {Object.entries(storage).map(([key, value]) => (
                    <div className="contents" key={key}>
                      <dt>{tr(key)}</dt>
                      <dd className="break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="muted [color:var(--muted)]">
                  {tr('locations_are_resolved_by_tauri_for_the_current_operating_system')}{' '}
                </p>
              )}
              <p className="text-xs [color:var(--muted)]">
                {tr(
                  'sqlite_and_managed_attachments_live_in_persistent_application_data_cache_is_separate_and_contains_no',
                )}{' '}
              </p>
            </CardContent>
          </Card>
          <Card className="[border-color:var(--danger-border)]">
            <CardHeader>
              <h2 className="[color:var(--danger-ink)]"> {tr('permanent_deletion')} </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm [color:var(--muted)]">
                {tr(
                  'delete_individual_items_using_their_trash_buttons_delete_all_removes_every_topic_task_source_activit',
                )}{' '}
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
                        notifications.success(tr('file_cleanup_complete'));
                      }
                    });
                  }}
                >
                  {tr('retry_file_cleanup')}{' '}
                </Button>
                <Button
                  tone="danger"
                  disabled={!enabled}
                  onClick={() => askDelete({ kind: 'workspace' })}
                >
                  {tr('delete_all_workspace_data')}{' '}
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
