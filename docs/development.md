# Development

Use Node.js 22, the exact pnpm `packageManager` version, stable Rust and the
[official Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for
the host platform. Do not substitute npm or yarn. Install with
`pnpm install --frozen-lockfile`; dependency changes must regenerate
`pnpm-lock.yaml` through pnpm.

`pnpm tauri dev` starts Next.js and the desktop shell. `pnpm dev` is useful for
frontend layout work, but native operations require the desktop app. A failed
native load is shown as a recoverable error, not replaced with sample data or
browser-only persistence. Keep synthetic test fixtures separate from the real
application-data directory.

Native reminder audio uses Rodio/CPAL. Linux development also needs ALSA
development libraries, for example `libasound2-dev` on Debian/Ubuntu. Windows
audio uses the system backend and works with the portable executable. The
reminder webview is a separate static route with a restricted event capability;
it must not mount the workspace providers, updater or main window controls.
Task schedules belong to workspace data; tray/audio preferences belong to the
device-only native preferences table. Keep this distinction when changing
backup, restore, task completion or recurrence generation.

## Validation commands

| Command                           | Purpose                                                 |
| --------------------------------- | ------------------------------------------------------- |
| `pnpm lint`                       | Prettier, ESLint and Rust formatting checks             |
| `pnpm typecheck`                  | Generate Next route types and check strict TypeScript   |
| `pnpm release:validate`           | Application/lockfile/manifest version consistency       |
| `pnpm test`                       | Domain, application and release tests                   |
| `pnpm test:native`                | Rust SQLite, file validation and archive recovery tests |
| `pnpm test:ui`                    | Chromium UI flows against the static export             |
| `pnpm build`                      | Next.js static production export                        |
| `pnpm tauri build --bundles nsis` | Windows release build and NSIS installer                |

Build the desktop app on its target platform. A successful static export does
not establish that native packaging succeeds. Native builds on Linux need
WebKitGTK and related system libraries; Windows packaging is checked by the
separate Windows workflow. The repository does not claim that a workflow has
run merely because its YAML exists.

## Changes and migrations

### User documentation

Maintain [the user guide](user-guide.md) whenever a user-facing feature,
workflow, setting or shortcut is added, changed or removed. Update the relevant
instructions and shortcut table in the same change. Describe implemented
behavior and its limits, and remove obsolete instructions. Do not duplicate
the guide inside UI code. The Documentation route reads this Markdown file at
build time and bundles it with the static app, so it remains available offline.

### Implementation and migrations

Read `AGENTS.md` first. Preserve pre-existing changes, use Conventional Commits,
and inspect the diff and relevant checks before each commit. This initial
schema is version 1. After deployment, add an incremental migration instead of
editing an applied migration. Keep entity schemas, Rust runtime validation,
export-format validation, SQLite constraints and tests consistent.

Manually check keyboard-only navigation, dialog labels and focus, narrow desktop
windows, long text, empty data, native errors, and canceled file dialogs when
changing UI behavior. Exercise backup and restore using disposable fixtures;
never use a real user's documents or database in automated tests.

## Interface tests

Run `pnpm build`, `pnpm exec playwright install chromium`, then `pnpm test:ui`.
The test server serves the actual static export. Tests inject a native IPC double
only inside the browser test process; the shipped app has no mock backend.
These tests cover forms, navigation, relationships, chronology, corrections,
source reuse, subtasks, archiving, error recovery, and restore confirmation.
Rust tests separately exercise real SQLite and archive/file operations. Native
OS file-picker interaction and opening external programs still need manual checks.
For an existing system Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Some Linux graphics environments require
`GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1 pnpm tauri dev`; use this only
when the default display backend reports Wayland/GBM errors. See
[Tauri's Linux graphics troubleshooting](https://v2.tauri.app/develop/debug/linux-graphics/).
