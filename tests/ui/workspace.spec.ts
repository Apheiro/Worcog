import { expect, test, type Page } from '@playwright/test';
import type { Workspace } from '../../src/domain/model';
import { emptyWorkspace } from '../../src/domain/model';
async function mockDesktop(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-17T12:00:00Z'));
  await page.addInitScript(() => {
    const blank = {
      formatVersion: 1,
      revision: 0,
      topics: [],
      tasks: [],
      activities: [],
      sources: [],
      attachments: [],
    };
    Object.defineProperty(window, 'isTauri', { value: true });
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      value: {
        invoke: async (
          command: string,
          args?: { workspace: Workspace; purgeWorkspaceFiles?: boolean; purgeBackups?: boolean },
        ) => {
          const load = () =>
            JSON.parse(
              sessionStorage.getItem('test.workspace') ?? JSON.stringify(blank),
            ) as Workspace;
          if (command === 'update_status')
            return {
              currentVersion: '0.1.0',
              repository: 'Apheiro/Worklog',
              tokenSaved: sessionStorage.getItem('test.updateTokenSaved') === 'yes',
              credentialSupported: true,
              platformSupported: true,
              profile:
                sessionStorage.getItem('test.updateProfile') === 'development'
                  ? 'development'
                  : 'production',
            };
          if (command === 'set_update_token') {
            // The test double tracks presence only, never persists token contents.
            const token = args && 'token' in args ? args.token : null;
            sessionStorage.setItem('test.updateTokenSaved', token ? 'yes' : 'no');
            return {
              currentVersion: '0.1.0',
              repository: 'Apheiro/Worklog',
              tokenSaved: !!token,
              credentialSupported: true,
              platformSupported: true,
              profile:
                sessionStorage.getItem('test.updateProfile') === 'development'
                  ? 'development'
                  : 'production',
            };
          }
          if (command === 'check_updates') {
            sessionStorage.setItem(
              'test.developmentTokenSent',
              args && 'developmentToken' in args && args.developmentToken ? 'yes' : 'no',
            );
            if (sessionStorage.getItem('test.updateCheckError'))
              throw new Error('GitHub authentication failed. Replace the saved token.');
            const value = sessionStorage.getItem('test.availableUpdate');
            return value ? JSON.parse(value) : null;
          }
          if (command === 'download_update') {
            sessionStorage.setItem(
              'test.downloadCount',
              String(Number(sessionStorage.getItem('test.downloadCount') ?? 0) + 1),
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (sessionStorage.getItem('test.updateDownloadError')) {
              sessionStorage.removeItem('test.updateDownloadError');
              throw new Error('Update SHA-256 does not match GitHub metadata.');
            }
            return {
              downloadPath: 'C:/WorklogCache/updates/worklog-v0.2.0-windows-x64.exe',
              currentExecutable: 'C:/Apps/Worklog/worklog.exe',
            };
          }
          if (command === 'open_update_folder') {
            sessionStorage.setItem('test.updateFolderOpened', 'yes');
            return null;
          }
          if (command === 'load_workspace') {
            const w = load();
            return { workspace: { ...w, tasks: [...w.tasks].reverse() }, cleanupWarning: null };
          }
          if (command === 'save_workspace') {
            const delay = Number(sessionStorage.getItem('test.delay') ?? 0);
            if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
            if (sessionStorage.getItem('test.fail')) {
              sessionStorage.removeItem('test.fail');
              throw new Error('Test storage permission denied. Try again.');
            }
            if (!args) throw new Error('Missing workspace');
            if (args.workspace.revision !== load().revision) throw new Error('Stale workspace');
            const next = { ...args.workspace, revision: args.workspace.revision + 1 };
            sessionStorage.setItem('test.workspace', JSON.stringify(next));
            sessionStorage.setItem(
              'test.saveOptions',
              JSON.stringify({
                purgeWorkspaceFiles: args.purgeWorkspaceFiles,
                purgeBackups: args.purgeBackups,
              }),
            );
            return {
              workspace: next,
              cleanupWarning: sessionStorage.getItem('test.cleanupWarning'),
            };
          }
          if (command === 'cleanup_deleted_files') return null;
          if (command === 'attach_file')
            return {
              id: 'file-test',
              originalName: 'report.pdf',
              managedName: 'file-test.pdf',
              mime: 'application/pdf',
              size: 100,
              addedAt: new Date().toISOString(),
              topicIds: [],
              taskIds: [],
              sourceIds: [],
              activityIds: [],
            };
          if (command === 'create_backup' || command === 'export_workspace') {
            if (command === 'export_workspace' && sessionStorage.getItem('test.cancel'))
              return null;
            sessionStorage.setItem('test.backup', JSON.stringify(load()));
            return '/test/backup.zip';
          }
          if (command === 'inspect_import')
            return { token: 'test-token', summary: 'Restore the saved test backup.' };
          if (command === 'restore_import') {
            const next = JSON.parse(sessionStorage.getItem('test.backup') ?? '{}') as Workspace;
            next.revision = load().revision + 1;
            sessionStorage.setItem('test.workspace', JSON.stringify(next));
            return next;
          }
          if (command === 'open_reference' || command === 'open_attachment') {
            sessionStorage.setItem('test.referenceOpened', 'yes');
            return null;
          }
          if (command === 'storage_info')
            return {
              data: '/test/data',
              attachments: '/test/attachments',
              cache: '/test/cache',
              backups: '/test/backups',
            };
          throw new Error(`Unexpected command ${command}`);
        },
      },
    });
  });
}
async function createTopic(page: Page, title: string) {
  await page.getByRole('button', { name: 'New topic', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill(title);
  await dialog.getByLabel('Summary', { exact: true }).fill('Investigate the operational incident.');
  await dialog.getByLabel('Next action', { exact: true }).fill('Review evidence');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
test('manual reference, dated annotation, task, attachment, search and restore', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockDesktop(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Give your work a place to live' })).toBeVisible();
  await createTopic(page, 'Network incident');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await page.getByRole('button', { name: 'Network incident', exact: true }).click();
  await page.getByRole('button', { name: 'Source', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('InvGate investigation');
  await dialog.getByLabel('Type', { exact: true }).selectOption('invgate');
  await dialog.getByLabel('External identifier').fill('INC-42');
  await dialog.getByLabel('System / platform').fill('InvGate');
  await dialog.getByLabel('Event date and time (local)').fill('2026-01-02T09:00');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Annotation', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Annotation', { exact: true })
    .fill('Confirmed root cause with the support team.');
  await dialog.getByLabel('Type', { exact: true }).selectOption('decision');
  await dialog.getByLabel('Event date and time (local)').fill('2026-01-01T09:00');
  await dialog.getByRole('checkbox', { name: /InvGate investigation/ }).check();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.timeline > li').first()).toContainText('Confirmed root cause');
  await expect(page.locator('.timeline > li').first()).toContainText('Recorded');
  await page.getByRole('button', { name: 'Task', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Review mitigation');
  await dialog.getByLabel('Owner', { exact: true }).fill('Test operator');
  await dialog.getByLabel('Due date', { exact: true }).fill('2026-12-31');
  await dialog.getByLabel('Priority', { exact: true }).selectOption('high');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('report.pdf');
  await page.getByRole('button', { name: 'Save relationships' }).click();
  await page.getByRole('tab', { name: /Files/ }).click();
  await expect(page.getByRole('button', { name: 'report.pdf', exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Search everything' }).click();
  await page.getByRole('textbox', { name: 'Search text' }).fill('INC-42');
  await expect(page.locator('.search-result')).toHaveCount(2);
  await page.reload();
  await page.getByRole('navigation').getByRole('link', { name: 'Search everything' }).click();
  await expect(page.locator('.search-result')).toHaveCount(2);
  await page.getByRole('navigation').getByRole('link', { name: 'Storage & backups' }).click();
  await page.getByRole('button', { name: 'Create backup', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Backup created' })).toBeVisible();
  await page.getByRole('button', { name: 'Import / restore…' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('Replace workspace');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Import / restore…' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Workspace restored' })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Overview', exact: true }).click();
  await page.screenshot({ path: 'test-results/worklog-ui.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('recoverable write failure retains the form and does not insert data', async ({ page }) => {
  await mockDesktop(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'New topic', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Retry safely');
  await page.evaluate(() => sessionStorage.setItem('test.fail', 'yes'));
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('permission denied');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const count = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem('test.workspace') ?? '{}').topics.length as number,
  );
  expect(count).toBe(1);
});

test('reuse sources across topics, preserve corrections, subtasks and archive history', async ({
  page,
}) => {
  await mockDesktop(page);
  await page.goto('/');
  await createTopic(page, 'First topic');
  await createTopic(page, 'Second topic');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await page.getByRole('button', { name: 'First topic', exact: true }).click();
  await page.getByRole('button', { name: 'Source', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Shared email');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'All topics', exact: true }).click();
  await page.getByRole('button', { name: 'Second topic', exact: true }).click();
  await page.getByRole('button', { name: 'Source', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Reuse an existing reference').selectOption({ label: 'Shared email' });
  await dialog.getByRole('button', { name: 'Link source', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const sources = await page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem('test.workspace') ?? '{}').sources as {
        topicIds: string[];
      }[],
  );
  expect(sources).toHaveLength(1);
  expect(sources[0].topicIds).toHaveLength(2);
  await page.getByRole('button', { name: 'Annotation', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Annotation', { exact: true }).fill('Original decision');
  await dialog.getByLabel('Event date and time (local)').fill('2026-01-01T10:00');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit annotation', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Annotation', { exact: true }).fill('Corrected decision');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.timeline')).toContainText('1 previous correction');
  await page.locator('.timeline summary').click();
  await expect(page.locator('.revision')).toContainText('Original decision');
  await page.getByRole('button', { name: 'Task', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Parent work');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('tab', { name: /Tasks/ }).click();
  await page.getByRole('button', { name: 'Add subtask to Parent work' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Child work');
  await dialog.getByLabel('Due date', { exact: true }).fill('2026-01-01');
  await expect(dialog.getByLabel('Parent task')).toHaveValue(
    await page.evaluate(
      () => (JSON.parse(sessionStorage.getItem('test.workspace') ?? '{}') as Workspace).tasks[0].id,
    ),
  );
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.task-child')).toContainText('Child work');
  const titles = page.locator('.task-row .title-link');
  await expect(titles).toHaveText(['Parent work', 'Child work']);
  await page.getByRole('navigation').getByRole('link', { name: 'Tasks', exact: true }).click();
  // Global tasks are sorted by due date before being grouped into their hierarchy.
  await expect(titles).toHaveText(['Parent work', 'Child work']);
  await page.reload();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await page.getByRole('button', { name: 'Second topic', exact: true }).click();
  await page.getByRole('tab', { name: /Tasks/ }).click();
  // The native load order may differ from insertion order after a restart.
  await expect(titles).toHaveText(['Parent work', 'Child work']);
  await page.getByRole('button', { name: 'Mark Child work completed' }).click();
  await expect(page.getByLabel('Status of Child work')).toHaveValue('completed');
  await page.getByRole('main').getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unarchive', exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Second topic', exact: true })).toBeVisible();
});

test('dark theme persists across reloads and applies to dialogs and form fields', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: 'light' });
  await mockDesktop(page);
  await page.goto('/');
  const theme = page.getByRole('combobox', { name: 'Color theme' });
  await theme.selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(18, 18, 18)');
  // Check the entire active dark palette, including warning/error colors.
  const tintedColors = await page.evaluate(() => {
    const root = document.documentElement;
    const computed = getComputedStyle(root);
    const probe = document.createElement('span');
    document.body.append(probe);
    const tinted: string[] = [];
    for (const sheet of document.styleSheets) {
      for (const rule of sheet.cssRules) {
        if (
          !(rule instanceof CSSStyleRule) ||
          !rule.selectorText.includes('data-theme') ||
          !root.matches(rule.selectorText)
        )
          continue;
        for (const name of rule.style) {
          if (!name.startsWith('--')) continue;
          probe.style.color = computed.getPropertyValue(name);
          const rgb = getComputedStyle(probe)
            .color.match(/[\d.]+/g)
            ?.map(Number);
          if (rgb && (rgb[0] !== rgb[1] || rgb[1] !== rgb[2])) tinted.push(name);
        }
      }
    }
    probe.remove();
    return tinted;
  });
  expect(tintedColors).toEqual([]);
  await page.reload();
  await expect(theme).toHaveValue('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'New topic', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveCSS('background-color', 'rgb(28, 28, 28)');
  await expect(dialog.getByLabel('Title', { exact: true })).toHaveCSS(
    'color',
    'rgb(240, 240, 240)',
  );
  await page.screenshot({ path: 'test-results/worklog-dark-dialog.png' });
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.screenshot({ path: 'test-results/worklog-dark.png', fullPage: true });
  await theme.selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(250, 250, 250)');
  expect(errors).toEqual([]);
});

test('system theme follows OS changes while an explicit selection takes precedence', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('worklog.theme.v1', 'invalid-preference'));
  await page.goto('/');
  const theme = page.getByRole('combobox', { name: 'Color theme' });
  await expect(theme).toHaveValue('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await theme.selectOption('dark');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await theme.selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

async function addTask(page: Page, title: string, recurring = false) {
  await page.getByRole('button', { name: 'Task', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill(title);
  if (recurring) {
    await dialog.getByLabel('Due date', { exact: true }).fill('2026-10-15');
    await dialog.getByLabel('Repeat', { exact: true }).selectOption('daily');
  }
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

test('permanent task deletion confirms its scope, cancels safely, retries errors and removes live history', async ({
  page,
}) => {
  await mockDesktop(page);
  await page.goto('/');
  await createTopic(page, 'Deletion topic');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await page.getByRole('button', { name: 'Deletion topic', exact: true }).click();
  await addTask(page, 'Delete test parent');
  await addTask(page, 'Keep task');
  await page.getByRole('button', { name: 'Annotation', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Annotation', { exact: true }).fill('Remove this linked history');
  await dialog.getByRole('checkbox', { name: 'Delete test parent', exact: true }).check();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('tab', { name: /Tasks/ }).click();
  await page.getByLabel('Status of Delete test parent').selectOption('in_progress');
  await expect(page.getByLabel('Status of Delete test parent')).toHaveValue('in_progress');
  await page.getByRole('button', { name: 'Add subtask to Delete test parent' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Delete test child');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'File', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog
    .getByRole('group', { name: 'Tasks', exact: true })
    .getByRole('checkbox', { name: 'Delete test parent', exact: true })
    .check();
  await dialog
    .getByRole('group', { name: 'Annotations', exact: true })
    .getByRole('checkbox', { name: 'Remove this linked history', exact: true })
    .check();
  await dialog.getByRole('button', { name: 'Save relationships' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete task Delete test parent', exact: true }).click();
  const confirmation = page.getByRole('alertdialog');
  await expect(confirmation).toContainText('2 task(s)');
  await expect(confirmation).toContainText('2 linked history/annotation');
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Delete test parent', exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Tasks', exact: true }).click();
  await page.getByRole('button', { name: 'Delete task Delete test parent', exact: true }).click();
  await page.evaluate(() => sessionStorage.setItem('test.fail', 'yes'));
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(confirmation.getByText(/permission denied/)).toBeVisible();
  const failed = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem('test.workspace') ?? '{}') as Workspace,
  );
  expect(failed.tasks).toHaveLength(3);
  expect(failed.activities).toHaveLength(2);
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(page.locator('.task-row .title-link')).toHaveText(['Keep task']);
  await page.reload();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await page.getByRole('button', { name: 'Deletion topic', exact: true }).click();
  await expect(page.locator('.timeline')).toHaveCount(0);
  await page.getByRole('tab', { name: /Files/ }).click();
  await expect(page.getByRole('button', { name: 'report.pdf', exact: true })).toBeVisible();
  const saved = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem('test.workspace') ?? '{}') as Workspace,
  );
  expect(saved.tasks.map((task) => task.title)).toEqual(['Keep task']);
  expect(saved.activities).toEqual([]);
  expect(saved.attachments[0].taskIds).toEqual([]);
  expect(saved.attachments[0].activityIds).toEqual([]);
  await page.getByRole('navigation').getByRole('link', { name: 'Search everything' }).click();
  await page.getByRole('textbox', { name: 'Search text' }).fill('Delete test');
  await expect(page.locator('.search-result')).toHaveCount(0);
});

test('deleting an occurrence from its editor removes the whole recurring series without regeneration', async ({
  page,
}) => {
  await mockDesktop(page);
  await page.goto('/');
  await createTopic(page, 'Recurring deletion');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await page.getByRole('button', { name: 'Recurring deletion', exact: true }).click();
  await addTask(page, 'Recurring test task', true);
  await page.getByRole('tab', { name: /Tasks/ }).click();
  const rows = page.locator('.task-row .title-link');
  await expect(rows).toHaveCount(3);
  await rows.nth(1).click();
  let editor = page.getByRole('dialog');
  await editor.getByRole('button', { name: 'Delete task', exact: true }).click();
  const confirmation = page.getByRole('alertdialog');
  await expect(confirmation).toContainText('entire recurring series');
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(editor).toBeVisible();
  await editor.getByRole('button', { name: 'Delete task', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  editor = page.getByRole('dialog');
  await expect(editor).toHaveCount(0);
  await expect(rows).toHaveCount(0);
  await page.reload();
  const saved = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem('test.workspace') ?? '{}') as Workspace,
  );
  expect(saved.tasks).toEqual([]);
  expect(saved.activities).toEqual([]);
});

test('annotations, sources and managed files can be permanently deleted from their views', async ({
  page,
}) => {
  await mockDesktop(page);
  await page.goto('/');
  await createTopic(page, 'Disposable topic');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await page.getByRole('button', { name: 'Disposable topic', exact: true }).click();
  await page.getByRole('button', { name: 'Annotation', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Annotation', { exact: true }).fill('Disposable annotation');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete annotation', exact: true }).click();
  const confirmation = page.getByRole('alertdialog');
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.timeline')).toContainText('Disposable annotation');
  await page.getByRole('button', { name: 'Delete annotation', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(page.locator('.timeline')).toHaveCount(0);
  await page.getByRole('button', { name: 'Source', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Disposable source');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('tab', { name: /Sources/ }).click();
  await page.getByRole('button', { name: 'Disposable source', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Delete source', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.source-row')).toHaveCount(0);
  await page.getByRole('button', { name: 'File', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Save relationships' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('navigation').getByRole('link', { name: 'Files', exact: true }).click();
  await page.getByRole('button', { name: 'Delete file report.pdf' }).click();
  await expect(confirmation).toContainText('physically deleted');
  await page.evaluate(() =>
    sessionStorage.setItem(
      'test.cleanupWarning',
      'Records deleted, but 1 file(s) could not be removed.',
    ),
  );
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(page.locator('.file-row')).toHaveCount(0);
  await expect(page.getByRole('alert').filter({ hasText: 'could not be removed' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.file-row')).toHaveCount(0);
  const saved = (await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('test.workspace')!),
  )) as Workspace;
  expect(saved.topics).toHaveLength(1);
  expect(saved.sources).toEqual([]);
  expect(saved.activities).toEqual([]);
  expect(saved.attachments).toEqual([]);
});

test('topic deletion removes its descendants and editor supports deleting topics', async ({
  page,
}) => {
  await mockDesktop(page);
  await page.goto('/');
  await createTopic(page, 'Topic to delete');
  await createTopic(page, 'Topic to keep');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await page.getByRole('button', { name: 'Topic to delete', exact: true }).click();
  await addTask(page, 'Owned task');
  await page.getByRole('button', { name: 'Delete topic', exact: true }).click();
  const confirmation = page.getByRole('alertdialog');
  await expect(confirmation).toContainText('1 tasks');
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const editor = page.getByRole('dialog');
  await editor.getByRole('button', { name: 'Delete topic', exact: true }).click();
  await page.evaluate(() => sessionStorage.setItem('test.fail', 'true'));
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(confirmation.getByText(/permission denied/)).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(sessionStorage.getItem('test.workspace')!).topics.length),
  ).toBe(2);
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(editor).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Topic to keep', exact: true })).toBeVisible();
  const saved = (await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('test.workspace')!),
  )) as Workspace;
  expect(saved.tasks).toEqual([]);
  expect(saved.topics.map((t) => t.title)).toEqual(['Topic to keep']);
});

test('clear workspace requires confirmation and allows including local backups', async ({
  page,
}) => {
  await mockDesktop(page);
  await page.goto('/');
  await createTopic(page, 'Reset fixture');
  await page.getByRole('navigation').getByRole('link', { name: 'Storage & backups' }).click();
  await page.getByRole('button', { name: 'Delete all workspace data', exact: true }).click();
  const confirmation = page.getByRole('alertdialog');
  await expect(
    confirmation.getByRole('checkbox', { name: 'Also delete local backups stored by Worklog' }),
  ).not.toBeChecked();
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(sessionStorage.getItem('test.workspace')!).topics.length),
  ).toBe(1);
  await page.getByRole('button', { name: 'Delete all workspace data', exact: true }).click();
  await confirmation
    .getByRole('checkbox', { name: 'Also delete local backups stored by Worklog' })
    .check();
  await page.screenshot({ path: 'test-results/deletion-confirmation.png' });
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(confirmation).toHaveCount(0);
  const saved = (await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('test.workspace')!),
  )) as Workspace;
  expect(
    [saved.topics, saved.tasks, saved.activities, saved.sources, saved.attachments].every(
      (items) => items.length === 0,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => JSON.parse(sessionStorage.getItem('test.saveOptions')!)),
  ).toEqual({ purgeWorkspaceFiles: true, purgeBackups: true });
  await page.getByRole('button', { name: 'Retry file cleanup' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'File cleanup complete.' }),
  ).toBeVisible();
});

test('Toastify covers loading, success, information, warnings and errors with a neutral dark theme', async ({
  page,
}) => {
  await mockDesktop(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Color theme' }).selectOption('dark');
  await page.getByRole('button', { name: 'New topic', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Notification fixture');
  await page.evaluate(() => sessionStorage.setItem('test.delay', '1500'));
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  const pending = page.locator('.Toastify__toast').filter({ hasText: 'Working:' });
  await expect(pending).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await expect(dialog).toHaveCount(0);
  await expect(pending).toHaveCount(0);
  const success = page.getByRole('status').filter({ hasText: 'Success: Saved locally.' });
  await expect(success).toBeVisible();
  const progressColor = await success
    .locator('.Toastify__progress-bar--animated')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  const channels = progressColor.match(/[0-9.]+/g)?.map(Number);
  expect(channels?.[0]).toBe(channels?.[1]);
  expect(channels?.[1]).toBe(channels?.[2]);
  await expect(success).toHaveCount(0, { timeout: 10000 });
  await page.getByRole('navigation').getByRole('link', { name: 'Storage & backups' }).click();
  await page.evaluate(() => sessionStorage.setItem('test.cancel', 'yes'));
  await page.getByRole('button', { name: 'Export archive…' }).click();
  const info = page.getByRole('status').filter({ hasText: 'Information: Export canceled.' });
  await expect(info).toBeVisible();
  await info.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(info).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete all workspace data' }).click();
  await page.evaluate(() => {
    sessionStorage.removeItem('test.delay');
    sessionStorage.setItem('test.fail', 'yes');
  });
  const confirmation = page.getByRole('alertdialog');
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  const error = page
    .getByRole('alert')
    .filter({ hasText: 'Error: Test storage permission denied.' });
  await expect(error).toBeVisible();
  await expect(confirmation).toBeVisible();
  await page.evaluate(() =>
    sessionStorage.setItem('test.cleanupWarning', 'Records deleted, but file cleanup is pending.'),
  );
  await confirmation.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(error).toHaveCount(0);
  const warning = page
    .getByRole('alert')
    .filter({ hasText: 'Warning: Records deleted, but file cleanup is pending.' });
  await expect(warning).toBeVisible();
  const tinted = await warning.evaluate((element) => {
    return [element, ...element.querySelectorAll('svg')].flatMap((node) => {
      const style = getComputedStyle(node);
      return ['color', 'backgroundColor', 'borderTopColor'].filter((key) => {
        const rgb = style
          .getPropertyValue(key.replace(/[A-Z]/g, (match) => '-' + match.toLowerCase()))
          .match(/[\d.]+/g)
          ?.map(Number);
        return rgb && (rgb[0] !== rgb[1] || rgb[1] !== rgb[2]);
      });
    });
  });
  expect(tinted).toEqual([]);
  await page.keyboard.press('Alt+t');
  await expect(warning).toBeFocused();
  await page.screenshot({ path: 'test-results/worklog-toast-dark.png' });
  await warning.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(warning).toHaveCount(0);
});

const updateFixture = {
  currentVersion: '0.1.0',
  version: '0.2.0',
  filename: 'worklog-v0.2.0-windows-x64.exe',
  size: 10485760,
  notes:
    '# Worklog 0.2.0\n\n## Improvements\n\n- Faster searches\n- Better keyboard navigation\n\n[Read documentation](https://github.com/Apheiro/Worklog)\n\n[Unsafe link](javascript:alert(1))\n\n![Remote image](https://example.invalid/track.png)\n\n<script>window.untrustedRelease=true</script>\n\n' +
    Array.from(
      { length: 50 },
      (_, i) => `### Change ${i + 1}\n\nDetailed release notes for this synthetic update.`,
    ).join('\n\n'),
};
test('updates announce only available releases, render safe scrollable notes and retry verified downloads', async ({
  page,
}) => {
  await mockDesktop(page);
  const remoteRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://example.invalid')) remoteRequests.push(request.url());
  });
  await page.addInitScript(
    (value) => sessionStorage.setItem('test.availableUpdate', JSON.stringify(value)),
    updateFixture,
  );
  await page.goto('/');
  const announcement = page.getByRole('button', { name: /Worklog 0.2.0 is available/ });
  await expect(announcement).toBeVisible();
  await announcement.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Worklog 0.2.0 is available' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Improvements', exact: true })).toBeVisible();
  await expect(dialog.locator('img,script,iframe')).toHaveCount(0);
  await expect(dialog.getByRole('link', { name: 'Unsafe link' })).toHaveCount(0);
  expect(remoteRequests).toEqual([]);
  const viewport = dialog.locator('.release-viewport');
  expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(
    dialog.getByRole('button', { name: 'Download update', exact: true }),
  ).toBeInViewport();
  await dialog.getByRole('link', { name: 'Read documentation' }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('test.referenceOpened'))).toBe('yes');
  await page.evaluate(() => sessionStorage.setItem('test.updateDownloadError', 'yes'));
  await dialog.getByRole('button', { name: 'Download update', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Downloading and verifying…' })).toBeDisabled();
  await expect(dialog.getByText('Update SHA-256 does not match GitHub metadata.')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('test.downloadCount'))).toBe('1');
  await dialog.getByRole('button', { name: 'Retry download' }).click();
  await expect(dialog.getByRole('heading', { name: 'Verified download' })).toBeVisible();
  await expect(dialog).toContainText('C:/Apps/Worklog/worklog.exe');
  await expect(dialog).toContainText('Keep a copy of your previous EXE');
  await dialog.getByRole('button', { name: 'Open download folder' }).click();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('test.updateFolderOpened')))
    .toBe('yes');
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeInViewport();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.setViewportSize({ width: 1100, height: 660 });
  await expect(dialog.getByRole('button', { name: 'Open download folder' })).toBeInViewport();
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeInViewport();
  const instructions = dialog.getByRole('region', { name: 'Manual replacement instructions' });
  await instructions.focus();
  await page.keyboard.press('End');
  await expect.poll(() => instructions.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/application-update.png' });
  await dialog.getByRole('button', { name: 'Open download folder' }).click();
  expect(await page.evaluate(() => 'untrustedRelease' in window)).toBe(false);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('test.downloadCount'))).toBe('2');
});
test('automatic update failures stay silent while manual checks and token management are explicit', async ({
  page,
}) => {
  await mockDesktop(page);
  await page.addInitScript(() => {
    sessionStorage.setItem('test.updateCheckError', 'yes');
    localStorage.setItem(
      'worklog.updates.github-token.development.v1',
      'development-token-ignored-by-production',
    );
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.locator('.Toastify__toast--error')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('link', { name: 'Storage & backups' }).click();
  await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'GitHub authentication failed' }),
  ).toBeVisible();
  const token = page.getByLabel('GitHub token (optional)', { exact: true });
  await expect(token).toHaveValue('');
  expect(await page.evaluate(() => sessionStorage.getItem('test.developmentTokenSent'))).toBe('no');
  await token.fill('synthetic-token-never-a-real-secret');
  await page.getByRole('button', { name: 'Save / replace token' }).click();
  await expect(token).toHaveValue('');
  await expect(page.getByText(/GitHub token saved/, { exact: false }).first()).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem('synthetic-token-never-a-real-secret')),
  ).toBeNull();
  await page.getByRole('button', { name: 'Remove token', exact: true }).click();
  await expect(page.getByText('Anonymous access', { exact: false })).toBeVisible();
  await page.evaluate(() => sessionStorage.removeItem('test.updateCheckError'));
  await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'No downloadable stable update' }),
  ).toBeVisible();
});

test('development update credentials use only their separate localStorage entry', async ({
  page,
}) => {
  await mockDesktop(page);
  await page.addInitScript(() => {
    sessionStorage.setItem('test.updateProfile', 'development');
    sessionStorage.setItem('test.updateTokenSaved', 'yes');
    localStorage.setItem('worklog.updates.github-token.development.v1', 'synthetic-dev-token');
  });
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('test.developmentTokenSent')))
    .toBe('yes');
  await page.getByRole('navigation').getByRole('link', { name: 'Storage & backups' }).click();
  await expect(
    page.getByText(/Development profile: this token is stored unencrypted/),
  ).toBeVisible();
  const token = page.getByLabel('GitHub token (optional)', { exact: true });
  await expect(token).toHaveValue('');
  await token.fill('synthetic-dev-replacement');
  await page.getByRole('button', { name: 'Save / replace token' }).click();
  await expect(token).toHaveValue('');
  expect(
    await page.evaluate(() => localStorage.getItem('worklog.updates.github-token.development.v1')),
  ).toBe('synthetic-dev-replacement');
  expect(await page.evaluate(() => sessionStorage.getItem('test.updateTokenSaved'))).toBe('yes');
  await page.getByRole('button', { name: 'Remove token', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem('worklog.updates.github-token.development.v1')),
    )
    .toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('test.updateTokenSaved'))).toBe('yes');
  await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('test.developmentTokenSent')))
    .toBe('no');
});

test('search stays visible beside collapsed filters in every section', async ({ page }) => {
  await mockDesktop(page);
  await page.goto('/');
  for (const name of [/^Topics/, /^Tasks/, /^Sources/, /^Search everything$/, /^Archive$/]) {
    await page.getByRole('navigation').getByRole('link', { name }).click();
    const toggle = page.locator('.filters-toggle');
    const search = page.getByRole('textbox', { name: 'Search text' });
    const category = page.getByLabel('Category', { exact: true });
    await expect(search).toBeVisible();
    await expect(category).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const searchBox = await search.boundingBox();
    const toggleBox = await toggle.boundingBox();
    expect(searchBox!.width).toBeGreaterThan(toggleBox!.width);
    expect(searchBox!.x + searchBox!.width).toBeLessThanOrEqual(toggleBox!.x);
    expect(
      Math.abs(searchBox!.y + searchBox!.height / 2 - toggleBox!.y - toggleBox!.height / 2),
    ).toBeLessThan(2);
    await search.fill('Test search');
    await expect(toggle).not.toContainText('active');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(category).toBeVisible();
    await page.locator('.filter-controls input[type="date"]').first().fill('2026-01-01');
    await expect(toggle).toContainText('1 active');
    const controlsBox = await page.locator('.filter-controls').boundingBox();
    expect(controlsBox!.y).toBeGreaterThanOrEqual(toggleBox!.y + toggleBox!.height);
    await toggle.click();
    await expect(category).toBeHidden();
    await expect(search).toHaveValue('Test search');
    await expect(toggle).toContainText('1 active');
    await toggle.focus();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(search).toHaveValue('');
    await expect(toggle).not.toContainText('active');
  }
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await expect(page.getByRole('textbox', { name: 'Search text' })).toBeVisible();
  await expect(page.locator('.filters-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('routes support direct entry, topic links, reload and browser history', async ({ page }) => {
  await mockDesktop(page);
  await page.goto('/tasks/');
  await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await expect(page).toHaveURL(/\/topics\/$/);
  await createTopic(page, 'Routed topic');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Topics/ })
    .click();
  await page.getByRole('button', { name: 'Routed topic', exact: true }).click();
  await expect(page).toHaveURL(/\/topics\/\?topic=/);
  const topicURL = page.url();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Routed topic', exact: true })).toBeVisible();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /^Tasks/ })
    .click();
  await expect(page).toHaveURL(/\/tasks\/$/);
  await page.goBack();
  await expect(page).toHaveURL(topicURL);
  await expect(page.getByRole('heading', { name: 'Routed topic', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible();
});

test('task resources replace topic paths and open linked sources and files without editing the task', async ({
  page,
}) => {
  const now = '2026-10-17T12:00:00Z';
  const workspace = emptyWorkspace();
  const topicId = 'resource-topic';
  const taskId = 'review-task';
  const timestamps = { createdAt: now, updatedAt: now };
  workspace.topics.push({
    ...timestamps,
    id: topicId,
    title: 'Resource topic',
    summary: '',
    category: 'General',
    status: 'pending',
    priority: 'normal',
    owner: '',
    participants: '',
    tags: [],
    nextAction: '',
    targetDate: null,
    closedAt: null,
    archived: false,
    relatedTopicIds: [],
  });
  workspace.sources = ['Incident email', 'Manual reference', 'Unrelated source'].map(
    (title, index) => ({
      ...timestamps,
      id: `source-${index}`,
      title,
      kind: 'email',
      platform: '',
      identifier: index === 0 ? 'MAIL-42' : '',
      url: index === 0 ? 'https://example.invalid/incident' : '',
      eventAt: now,
      participants: '',
      notes: '',
      tags: [],
      topicIds: [topicId],
    }),
  );
  workspace.tasks.push({
    ...timestamps,
    id: taskId,
    title: 'Review evidence',
    description: '',
    topicId,
    parentId: null,
    status: 'pending',
    priority: 'normal',
    owner: '',
    startDate: null,
    dueDate: null,
    completedAt: null,
    nextAction: '',
    tags: [],
    sourceIds: workspace.sources.slice(0, 2).map((source) => source.id),
    recurrence: 'none',
    recurrenceRootId: null,
    occurrenceDate: null,
  });
  workspace.tasks.push({
    ...workspace.tasks[0],
    id: 'unlinked-child',
    title: 'Unlinked child',
    parentId: taskId,
    sourceIds: [],
  });
  workspace.attachments.push({
    id: 'evidence-file',
    originalName: 'Evidence report with a long descriptive name.pdf',
    managedName: 'evidence-file.pdf',
    mime: 'application/pdf',
    size: 100,
    addedAt: now,
    topicIds: [],
    taskIds: [taskId],
    activityIds: [],
    sourceIds: [],
  });
  workspace.attachments.push({
    ...workspace.attachments[0],
    id: 'unrelated-file',
    originalName: 'Unrelated file.pdf',
    managedName: 'unrelated-file.pdf',
    taskIds: [],
    topicIds: [topicId],
  });
  await mockDesktop(page);
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem('test.workspace'))
      sessionStorage.setItem('test.workspace', JSON.stringify(value));
  }, workspace);
  await page.goto(`/topics/?topic=${topicId}`);
  await page.getByRole('tab', { name: /Tasks/ }).click();
  const row = page
    .locator('.task-row')
    .filter({ has: page.getByRole('button', { name: 'Review evidence', exact: true }) });
  await expect(row.locator('.row-subtitle')).toHaveCount(0);
  const resources = row.getByRole('list', { name: 'Resources for Review evidence' });
  await expect(resources.getByRole('listitem')).toHaveCount(3);
  await expect(resources).not.toContainText('Unrelated');
  await expect(page.locator('.task-child').getByRole('list')).toHaveCount(0);
  const source = resources.getByRole('button', {
    name: 'View source Incident email · MAIL-42',
    exact: true,
  });
  await source.focus();
  await page.keyboard.press('Enter');
  let dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Incident email', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Open original' }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('test.referenceOpened'))).toBe('yes');
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await resources
    .getByRole('button', { name: 'View source Manual reference', exact: true })
    .click();
  dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('heading', { name: 'Manual reference', exact: true }),
  ).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open original' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await page.evaluate(() => sessionStorage.removeItem('test.referenceOpened'));
  const file = resources.getByRole('button', {
    name: `Open file ${workspace.attachments[0].originalName}`,
    exact: true,
  });
  await file.focus();
  await page.keyboard.press('Enter');
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem('test.referenceOpened')))
    .toBe('yes');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('tab', { name: /Tasks/ }).click();
  await expect(resources.getByRole('listitem')).toHaveCount(3);
  await page.getByRole('navigation').getByRole('link', { name: 'Tasks', exact: true }).click();
  await expect(row.locator('.row-subtitle')).toContainText('Resource topic');
  await expect(resources.getByRole('listitem')).toHaveCount(3);
});
