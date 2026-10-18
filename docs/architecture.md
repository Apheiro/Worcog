# Architecture

The frontend uses Next.js with static export and React with strict TypeScript.
Tauri serves the generated `out/` directory; no Next.js server, Server Actions,
API routes, account credentials, or remote backend are needed. UnoCSS supplies
the utility styles, Radix supplies accessible interaction primitives, CVA keeps
shared component variants together, and Tabler supplies icons. Native date inputs
provide keyboard-accessible date selection.

Each section has a statically exported App Router page (`/`, `/topics/`,
`/tasks/`, `/sources/`, `/search/`, `/files/`, `/archive/`, `/settings/`).
The root layout preserves the workspace controller and dialogs across navigation.
Navigation uses Next.js links; topic details use `/topics/?topic=<id>` so local
records do not require build-time dynamic routes. Direct entry, reload and
browser history preserve the selected topic. Section queries and presentation
live in `src/components/routes/`; dialogs are loaded dynamically.

Component styles are UnoCSS shortcuts grouped by responsibility in `src/styles/`
and registered in `uno.config.ts`. CVA defines shared button, badge, modal,
navigation and form-control variants. `Input` and `Textarea` in `ui.tsx`
centralize native controls; `Field` associates labels and hints. `Select` uses
Radix UI with a simple options/value/onValueChange API, portaled theme-aware
menus, keyboard navigation and native form participation. Empty choices retain
their original empty form value and can be selected again to clear filters. Shared `Checkbox` controls use Radix UI
with native form participation and checked/indeterminate/disabled states.
`TaskRow` composes this checkbox with task details, linked resources and actions
in both task views. Its checked mark stays white in both themes using dedicated
checkbox tokens; checked fill adapts to each theme for contrast.
`globals.css` contains only theme tokens, document defaults, accessibility
rules and external Toastify overrides. Responsive and interactive component
styles belong with the UnoCSS shortcuts rather than global CSS selectors.

The requested CVA beta is published under the renamed `cva` package:
`1.0.0-beta.12` (Apache-2.0). Its installed type definitions were checked and the
app uses the actual `cva({ base, variants, defaultVariants })` API with TypeScript 6. `@kalyx/react` 1.4.7 was verified as MIT-licensed, React 19 compatible, with
documented SSR support and a `DatePicker` API. It is optional and was not installed:
native date and date-time inputs cover this version's controls without another
date adapter or a young optional dependency. Mantine Hooks handles saved UI
preferences and debounced input. Native collection operations cover the current
queries, so `lodash-es` is unnecessary.

## Boundaries

| Area                   | Responsibility                                              |
| ---------------------- | ----------------------------------------------------------- |
| `src/app`              | Static app entry and global layout                          |
| `src/components`       | Workspace screens and reusable controls                     |
| `src/domain`           | Canonical entities, validation and date rules               |
| `src/application`      | Mutations, recurrence, query and timeline rules             |
| `src/infrastructure`   | Typed Tauri command boundary                                |
| `src-tauri/src`        | SQLite, managed files, native dialogs and backup operations |
| `tests` and Rust tests | Synthetic fixtures and behavior checks                      |

UI code does not execute SQL. A workspace is loaded through the native boundary,
validated, changed through application functions and saved transactionally.
SQLite holds separate entity tables and explicit join tables with foreign keys;
JSON payloads preserve each entity's typed fields. This first version favors a
small, comprehensible persistence boundary over incremental SQL commands for
each field. An optimistic workspace revision rejects a stale save rather than
silently overwriting another window's edits.

Search and combined filters operate on the persisted workspace loaded into
memory, including topics, tasks, activity and sources. Native SQL remains
parameterized. Full-text indexing, pagination and incremental persistence are
deferred: the snapshot approach is intended for personal workspaces and is not
an architecture for millions of records. Related-entity lookups use stable IDs;
relations are validated in TypeScript and Rust and constrained in SQLite.

## Dates and traceability

Event, creation and update timestamps are UTC ISO 8601 instants. Local inputs
are converted to an instant and displayed using the operating system's local
timezone. A due date or target date is a `YYYY-MM-DD` calendar date, not midnight
UTC. Changing timezone may change an event's displayed clock time; it does not
move a due date to another day. Timestamp date-range filters follow the local
displayed calendar day; date-only deadlines are filtered without timezone conversion. Timeline ordering uses event time and stable
tie-breaking, independent of record creation time.

Activity corrections retain earlier text revisions and update timestamps. Topic
archiving preserves related records. Task status changes add history rather than
silently replacing the topic's chronology. Sources are reusable entities with
their own metadata; no URL is required. Safe saved links are opened through a
native service, with scheme validation before opening.

## Recurring tasks

Daily, weekly and monthly schedules create independent task records through the
current local date when recurrence is evaluated. The initial task is the first
occurrence; subsequent instances receive pending status and separate completion
timestamps. Monthly dates derive from the original due date, so a January 31
anchor becomes February 28 (or 29) and then March 31. The series ID and occurrence
date are unique, preventing duplicate instances across restarts.

A completed initial task continues its schedule. Canceling the initial task or
archiving its topic pauses generation; resuming catches up missing occurrences.
Each evaluation generates at most 500 missing instances per series; repeated
evaluations continue a larger backlog. After instances exist, start a new series
to change the rule or anchor date. Custom intervals, holidays, end dates and
RFC 5545 recurrence rules are outside this version's scope. Cancel tasks and
archive topics when history should be retained. Permanent task deletion is a
separate, confirmed operation described below.

## Trust boundary

Only the desktop window receives the configured Tauri capabilities. Filesystem,
database, picker and opening operations remain in native commands; the frontend
does not receive unrestricted filesystem or shell permission. Attachment imports
copy files to generated managed names. Removing a relationship preserves the
physical copy. Imported metadata and archive entries are untrusted, validated
before changes, and never executed. CSP limits the bundled webview to local
resources and native IPC. Application data is not encrypted at rest; use OS
account protections and an encrypted disk where required.

Backup/export semantics, size limits and recovery rules are documented in
[storage](storage.md). Release automation and packaging remain separate, as
described in [releases](releases.md).

## First-version limits

Status and priority values are fixed; categories, owners and labels are free-form.
There is one owner field per topic or task. Board layouts, task dependencies,
custom status definitions and automatic external integrations are not included.
Topics can be archived and tasks canceled to retain history. All entity types
can also be permanently deleted with confirmation. Plain-text annotations preserve
previous text on correction; changes to linked sources or event metadata use
created/updated timestamps rather than a complete field-by-field audit log.

`@unocss/postcss` 66 exports a CommonJS object with a default function, while
Next's PostCSS loader expects the function itself. The small
`scripts/unocss-postcss.cjs` adapter selects that export without patching any
dependency. Next's agent-rule generation is disabled to preserve the repository's
own instructions. Tauri adds hashes for bundled inline scripts to the configured
CSP at compile time ([official CSP documentation](https://v2.tauri.app/security/csp/)).

Development and production use webpack consistently. The development-only CSP
permits Next's inline scripts, evaluated source maps and its loopback HMR socket;
the production CSP remains restricted to bundled resources and native IPC.
ESLint 9 is retained because Next's bundled React/accessibility plugin peers
currently exclude ESLint 10. Its registry deprecation is a tooling limitation to
revisit when those upstream peers support the next major.

## Permanent task deletion

`src/application/task-deletion.ts` computes the affected task set before the UI
requests confirmation. The set includes descendants and complete recurrence
families, including families reached through descendants. Removing only a
recurring occurrence would recreate it or require a persistent deletion marker;
this operation intentionally keeps no such marker. Normal child deletion keeps
its parent and siblings.

All activities citing any deleted task are deleted in full, including their
text revisions. Shared annotations are counted explicitly in confirmation.
Unrelated history remains. File metadata drops references to removed tasks and
activities; source entities and physical files are preserved. No deletion event
is added. Topic freshness is updated through the same centralized change
application used by other mutations.

The frontend verifies the confirmed workspace revision before applying the
operation; native optimistic concurrency and the existing SQLite transaction
provide a second check. A failed save leaves the original records intact. No
migration or new native filesystem capability is required. Backups and exports
made before deletion remain independent copies; this is live-record deletion,
not forensic erasure of SQLite pages or existing archives.

## Entity and physical file deletion

`src/application/deletion.ts` applies topic/source/annotation/file deletion and
whole-workspace clearing. It uses the existing task deletion planner and the
central change application to keep relationships valid and update affected topic
timestamps. Confirmation previews use the same domain operation as execution.

Migration 2 adds `pending_file_deletions`. Native workspace saves enqueue removed
managed filenames in the same transaction as record changes, then remove those
files. Failed cleanup remains queued and returns a warning alongside the committed
workspace. The hook accepts that workspace and displays the warning. Reloading
retries pending work. Archive restore retains its existing safety-backup and
physical-file retention behavior. Full clearing also scans orphan managed copies
and optionally local backups; flags are rejected unless the submitted workspace
is empty. No broad filesystem capability or frontend SQL access is added.
See [storage](storage.md) for ownership, shared data and physical deletion rules.

## Notifications

React Toastify 11.1.0 (MIT, React 18/19 peers) renders one global container from
the root layout. The unstyled entry point and bundled CSS avoid runtime style
injection. `src/infrastructure/notifications.ts` centralizes typed success,
error, info, warning and pending messages; operation events trigger notifications
directly rather than mirroring message state through an effect. Duplicate
messages are deduplicated; cleanup warnings remain distinct from save success.
Errors also remain visible in their form/confirmation context without a second
live-region announcement.

Tabler icons and explicit type labels distinguish states without relying on
color. Shared theme tokens preserve monochromatic dark mode. Alt+T focuses the
notification region. Error/warning messages persist until dismissed or resolved;
success/info messages close after five seconds, pausing on hover or focus loss.
Pending messages appear after 600 ms and disappear on completion, including
failure and cancellation. The transition does not depend on animation events;
with reduced motion the invisible progress clock still permits automatic close.

## GitHub update boundary

`src-tauri/src/updates/` owns release selection, semantic version comparison,
the dedicated production credential service, direct HTTP/redirect policy,
streamed verification, cache publication and rotating diagnostics. Blocking
network/file work runs in Tauri's blocking worker pool; operation and filesystem
locks prevent duplicate downloads. The frontend uses a validated typed IPC
boundary in `src/infrastructure/updates.ts` and one update controller for settings,
the existing Toastify container and the existing Radix modal. Release notes use
markdown-to-jsx with raw HTML parsing disabled, image rendering removed and
HTTPS-only native links; Radix ScrollArea bounds the notes.

The debug profile explicitly selects a development-only localStorage credential
adapter. Production never reads that storage or returns its Credential Manager
secret through IPC, and Rust rejects development-token arguments in production.
No general-purpose HTTP/filesystem capability, automatic updater plugin, shell
command or executable-replacement privilege was added. The application version,
identifier and release system remain unchanged. See [updates](updates.md).
