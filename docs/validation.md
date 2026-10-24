# Validation handoff

The implementation was checked on Linux with Node.js 22.23.3, pnpm 12.4.2,
Rust 1.96.1, GTK 3.24.52 and WebKitGTK 2.54.1.

| Check                                  | Result                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`       | Passed; lockfile matches dependencies                                            |
| `pnpm lint`                            | Passed: Prettier, ESLint and Rust formatting                                     |
| `pnpm typecheck`                       | Passed with strict TypeScript and generated Next route types                     |
| `pnpm test`                            | 47 domain/application/release tests passed                                       |
| `pnpm test:native`                     | 31 real SQLite/files/archive/update tests passed                                 |
| `pnpm build`                           | Passed; static export produced in `out/`                                         |
| `pnpm test:ui`                         | 14 Chromium UI workflow tests passed                                             |
| `pnpm tauri build --debug --no-bundle` | Passed; Linux executable produced                                                |
| `pnpm tauri dev`                       | Started Next.js and the desktop executable; webview fetched the app successfully |
| Workflow YAML and release JSON         | Parsed; action pins checked against upstream tags                                |

UI tests use an isolated IPC double and synthetic browser data. Rust tests use
real temporary databases and documents. They are complementary; the browser
tests do not claim to automate native OS pickers. The integrated development
smoke run used isolated application-data/cache directories under `/tmp` and was
stopped intentionally after 35 seconds. An earlier built executable remained
running for a 15-second smoke window. This environment required
`GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1`; default Wayland returned a
protocol error, and X11 alone reported GBM buffer errors. The workaround is
linked in [development](development.md).

Windows compilation/NSIS installation, signing, native picker interaction,
opening documents in external programs, and GitHub Actions execution were not
run here. The Windows workflow includes installation, formatting, types, domain,
native and UI tests, frontend export and unsigned NSIS packaging, but its actual
artifact must be verified by running it on GitHub. No installer or release was
published. Earlier runs used YAML parsing only; the workflow follow-up below also passed actionlint. Neither check is an executed GitHub workflow.

During the initial implementation, Git status/diff checks and commits were unavailable because no valid repository metadata was present. No releases or installers were published during that validation. The original
repository instructions were preserved. Generated frontend/native builds,
SQLite data and test screenshots are ignored, and test data was isolated from
normal application data.

The supported scope and remaining product limits are documented in
[architecture](architecture.md) and [storage](storage.md).

## Dark theme and task hierarchy follow-up

Added persisted Light/Dark/System selection, a pre-paint initialization script,
and shared semantic color tokens covering dialogs, fields, lists, focus, alerts
and notifications. System mode follows OS changes. Chromium screenshots of the
dark dashboard and editor were visually inspected.

Task lists now use stable parent-first grouping in both the topic and global
views. Tests reproduce earlier-due/alphabetically-first children, shuffled load
order, nested descendants, filtered ancestors and reloads. No schema migration
or data rewrite was needed. No dependencies were added.

For this follow-up, lint, typecheck, 18 unit tests, 9 native tests, 5 browser
workflow tests, Next static export and the Linux Tauri debug build passed.
Windows packaging was not rerun. Git was unavailable during that follow-up, so no commit was created.

## Permanent deletion follow-up

Added confirmed task deletion from both task lists and the task editor. It
removes affected descendants, entire recurrence families and linked annotation
history/revisions, cleans attachment relationships, and keeps reusable files and
sources. It creates no deletion event, tombstone or automatic backup.

Validation: 24 domain/application tests, 10 real native persistence tests and 7
browser workflow tests passed. Coverage includes retained independent work,
shared annotations, recurrence without regeneration, canceling deletion, failed
saves and retries, editor deletion, reopening SQLite and exporting after deletion.
Lint, strict types, frontend export and the Linux Tauri debug build passed.
Existing backups remain independent copies. Windows packaging was not executed.

## Complete deletion follow-up

Implemented confirmed deletion for topics, sources, annotations and managed files,
and full workspace clearing with optional local-backup removal. Domain deletion
preserves shared relationships; explicit file deletion removes the managed disk
copy. Migration 2 transactionally queues filenames for cleanup, reports post-commit
failures separately, and retries pending jobs across restarts.

Validation: `pnpm lint`, `pnpm typecheck`, `pnpm test` (33 tests),
`pnpm test:native` (17 tests), `pnpm build`, Chromium `pnpm test:ui`
(10 workflows), and `pnpm tauri build --debug --no-bundle` passed on Linux.
The Chromium run used
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.
New coverage exercises all delete controls, cancellation, failed saves and retry,
workspace reset flags, shared/exclusive ownership, annotation revisions, physical
file removal, missing files, rollback of queued work, migration from version 1,
persistent cleanup failures, original-file preservation and refusal to follow
replaced directory links. Native tests use temporary synthetic fixtures.
No dependency changes or additional permissions were needed. Windows packaging
and actual native picker interaction remain unverified. Git status/diff/commits were unavailable during that follow-up.

## Release automation follow-up

Release Please now invokes the reusable Windows workflow after creating a release.
The build checks out the exact tag, validates aligned package/Tauri/Cargo/lockfile/
manifest versions, preserves all existing checks, and stages an x64 executable,
NSIS installer and SHA-256 checksums. Compilation has read permissions; a separate
write-permission job verifies checksums and uploads to the existing release.
Manual artifact-only builds and explicit publication retries remain available.

Validation passed: actionlint 1.7.7 for both workflows, frozen pnpm install,
`pnpm release:validate`, lint, strict TypeScript, 47 unit tests, 17 native tests,
10 Chromium UI workflows, the Next static export and Linux Tauri debug build.
Fourteen new tests exercise the version gate, mismatches, exact crate matching,
CRLF files, tags and checked-in metadata. The real Release Please 16.18.0 generic
JSON/TOML updaters were run in an isolated temporary tool installation against
all configured extra files; only Worcog's local Cargo.lock version was changed
in the simulated update. No application dependency was added.

Windows compilation/NSIS packaging, the Windows PowerShell staging script,
GitHub Actions execution and actual release uploads could not be exercised in
this Linux environment. Artifacts remain unsigned. No release was published.
Git diff/status and commits were unavailable during that follow-up.

## Toastify and Git initialization follow-up

Added React Toastify 11.1.0 and synchronized the pnpm lockfile. Lint, strict types,
47 unit tests, 17 native tests and 11 Chromium workflows passed. The new UI test
covers slow-operation feedback, automatic dismissal with reduced motion, success,
cancellation information, errors with retry, persistent cleanup warnings, Alt+T
focus, manual dismissal and neutral dark toast colors. A dark screenshot was
visually inspected. No native permissions or storage changes were needed.

The repository was initialized on `main` at the user's request, with the existing
Worcog README retained. The empty remote `Apheiro/Worcog` was checked over SSH.
Generated builds, databases, environment files and test artifacts are excluded
from version control. HTTPS remains the origin fetch URL and the same repository's
SSH URL is configured for authenticated pushes. Windows packaging and actual
GitHub Actions execution remain unverified locally.

## GitHub update download follow-up

Added startup/manual release checks, an optional production Windows Credential
Manager token and an independent development localStorage credential. Release
selection requires a newer stable semantic version and a fully uploaded x64
executable with GitHub SHA-256 metadata. Backend downloads are streamed, size/MZ/
digest verified, published without overwrites and retained for manual replacement.
No application version, Tauri identifier, permissions or release workflow changed.
The canonical behavior and limits are in [updates](updates.md).

Validation passed: frozen pnpm install, lint, strict types, release-version
validation, 47 unit tests, 31 native tests, 14 Chromium workflows, Next static
export and the Linux Tauri debug build. Fourteen new native tests use local HTTP
servers/temporary files for metadata gates, semantic precedence, proxy bypass,
auth headers, redirects, interrupted/corrupt streams, existing files, locks,
cleanup, logging and profile isolation. Three new browser workflows cover
persistent announcements, safe full Markdown, scroll and small-window actions,
download retry, paths/folder opening, silent automatic errors, explicit manual
errors and development/production credential separation. A small-window dark
update modal was visually inspected. Success progress colors were also checked
for grayscale under the dark theme.

An isolated cross-target check of the actual Windows credential adapter succeeded
for `x86_64-pc-windows-msvc`. The full application's cross-target check could not
finish because bundled SQLite needs the MSVC toolchain's `lib.exe`, unavailable
on this Linux host. Neither that adapter check nor Linux compilation is a Windows
runtime/NSIS validation. Native Credential Manager save/read/delete, opening
Explorer, real private-release transfers and manual EXE replacement still need a
Windows run. Tests never used real tokens or fetched real releases.

The pre-existing generated `next-env.d.ts` development references are preserved
and excluded from this feature's changes. No push or release publication was
performed for this follow-up.
