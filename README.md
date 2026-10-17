# Worklog

A local-first desktop workspace for topics, dated activity, tasks, manually
recorded external sources, and managed documents. Email, Teams and InvGate
references are entered manually. The app does not sign in to accounts, read
messages, synchronize data, or send telemetry. A new workspace contains no demo
records.

## Run locally

Install Node.js 22, the pnpm version declared in `package.json`, stable Rust and
the [Tauri platform prerequisites](https://v2.tauri.app/start/prerequisites/).
On Windows this includes the Microsoft C++ build tools and WebView2.

```sh
pnpm install --frozen-lockfile
pnpm tauri dev
```

`pnpm dev` starts the Next.js frontend alone. Native persistence, file dialogs,
backup and restore require `pnpm tauri dev`; a browser preview cannot substitute
for the desktop runtime.

## Work with your data

Create a topic, add an annotation with the actual event time, and cite an
existing source or record one manually. Sources can be reused across topics.
Add tasks with owners and dates, then copy documents into managed storage using
the file picker. Topic history follows event time, while creation and update
timestamps preserve when information was recorded. Archive topics to retain
their history. Tasks are grouped with each parent before its children, including
in date-sorted views and after reopening the workspace.

Use **Color theme** in the top bar to choose **Light**, **Dark** or **System**.
The selection is saved on this device; System follows operating-system theme
changes. The palette also applies to dialogs, fields, tables and notifications. Dark mode
uses strictly neutral grayscale, including warnings and errors; labels distinguish
those states.

Notifications use React Toastify for success, errors, information, warnings and
operations taking longer than 600 ms. Press **Alt+T** to focus notifications.
Success and information messages close automatically; errors and warnings stay
until dismissed or resolved. Notifications follow the active theme, including
strict grayscale in dark mode.

To remove an incorrect or test task, use its trash button or open its editor and
choose **Delete task**. Review the affected task/history counts and confirm
**Delete permanently**. This removes the task, its descendants and all linked
activity (including earlier corrections), without a recycle bin or deletion log.
Deleting any recurring occurrence removes its entire series to prevent recreation.
Shared annotations are deleted in full and are explicitly listed in the warning;
reusable sources and managed files remain with deleted relationships removed.
Previous backups and exports are unchanged.

You can also permanently delete **topics**, **sources**, **annotations** and
**files**, using the delete controls in their views or editors. Deleting a topic
removes its tasks and exclusive history, sources and files; shared items retain
their remaining relationships. File deletion removes the managed copy from disk,
while original files outside Worklog remain untouched.

To start over, open **Storage & backups → Delete all workspace data**. Review the
counts and optionally check **Also delete local backups stored by Worklog** before
confirming. There is no deletion history or automatic pre-deletion backup. If
a file cannot be removed, Worklog reports pending cleanup and offers a retry.
External exports and backups on other devices remain independent copies.

See [storage and recovery](docs/storage.md) before moving or restoring data.
The app stores primary data in Tauri's persistent app-data directory; cache is
separate. Backups contain confidential workspace information and documents.

## Checks and packaging

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:native
pnpm release:validate
pnpm build
pnpm exec playwright install chromium
pnpm test:ui
pnpm tauri build --bundles nsis
```

The final command requires Windows for the Windows installer. GitHub Actions
provides a Windows runner: open **Actions → Windows build → Run workflow** and
download the run's installer artifact after it succeeds. The installer is
unsigned. See [release and Windows build instructions](docs/releases.md) for
triggers, artifact retention, and Release Please behavior.

See [architecture](docs/architecture.md) and [development](docs/development.md)
for module boundaries, date conventions, supported scope, and validation.

See the [validation handoff](docs/validation.md) for executed checks, platform
limitations and Git status.
