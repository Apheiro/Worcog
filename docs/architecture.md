# Architecture

The frontend uses Next.js with static export and React with strict TypeScript.
Tauri serves the generated `out/` directory; no Next.js server, Server Actions,
API routes, account credentials, or remote backend are needed. UnoCSS supplies
the utility styles, Radix supplies accessible interaction primitives, CVA keeps
shared component variants together, and Tabler supplies icons. Native date inputs
provide keyboard-accessible date selection.

Each section has a statically exported App Router page (`/`, `/topics/`,
`/tasks/`, `/sources/`, `/search/`, `/files/`, `/archive/`, `/settings/`).
The root `app/layout.tsx` mounts `WorklogProvider` and the shared
`app/workspace-layout.tsx`, preserving workspace state and dialogs across navigation.
Navigation uses Next.js links; topic details use `/topics/?topic=<id>` so local
records do not require build-time dynamic routes. Direct entry, reload and
browser history preserve the selected topic. Section queries and presentation
live directly in each `src/app/**/page.tsx`; dialogs are loaded dynamically.
`src/components/` contains reusable application components, including the shared
`WorkspaceSection` heading and filters. Basic UI primitives live in
`src/components/core/`, independently of workspace state and domain options.

Component styles use UnoCSS utilities directly in each component file. CVA
keeps reusable component variants alongside their markup. Only theme tokens
and document defaults are global; `uno.config.ts` registers no component
shortcuts. `Button` in `core/button.tsx` shares action, ghost, link, resource-chip
and row variants, with compact and icon sizes. `Card` in `core/card.tsx` shares
surface/soft tones, padding and interactive states across dashboard modules,
settings, filters, topic summaries and search results. `CardHeader` and
`CardContent` keep module spacing consistent; Radix Slot preserves native
semantics for interactive cards through `asChild`. CVA defines badge, modal,
navigation and form-control variants. `Input` and `Textarea` in `core/input.tsx`
centralize native controls; `Field` associates labels and hints. `Select` uses
Radix UI with a simple options/value/onValueChange API, portaled theme-aware
menus, keyboard navigation and native form participation. Empty choices retain
their original empty form value and can be selected again to clear filters. Shared `Checkbox` controls use Radix UI
with native form participation and checked/indeterminate/disabled states.
`TaskRow` composes this checkbox with task details, linked resources and actions
in both task views. Its checked mark stays white in both themes using dedicated
checkbox tokens; checked fill adapts to each theme for contrast.
`globals.css` contains only theme tokens, document defaults, accessibility
rules. Toastify appearance is defined in `Notifications`. Responsive and interactive component
styles belong directly in their components rather than global CSS selectors
or separate style maps.

The requested CVA beta is published under the renamed `cva` package:
`1.0.0-beta.12` (Apache-2.0). Its installed type definitions were checked and the
app uses the actual `cva({ base, variants, defaultVariants })` API with TypeScript 6. `@kalyx/react` 1.4.7 was verified as MIT-licensed, React 19 compatible, with
documented SSR support and a `DatePicker` API. The core `DateInput` uses its headless
entry with `@kalyx/adapter-dayjs`, keeping dates as `YYYY-MM-DD` in forms and storage.
UTC conversion is confined to the picker boundary. Its `withTime` mode uses Kalyx
`DateTimePicker` with hour/minute selection and local datetime form values.
New tasks default their start date to their creation date; `createdAt` is recorded
automatically and preserved on edits. Mantine Hooks handles saved UI
preferences and debounced input. Native collection operations cover the current
queries, so `lodash-es` is unnecessary.

## Optional document editor

Settings → General → **Open documents in Worklog** controls how attachment clicks
are handled. It defaults to enabled; disabling it restores the default system
application for subsequent opens. DOCX, XLSX, PPTX and CSV use an iframe at
`https://edit.chaxus.com/editor?embed=1`; PDFs and other formats retain the system opener.
The editor is remote code, not bundled with Worklog. Loading requires connectivity
and trusts that provider's deployed code. No account or cloud storage integration
is configured by Worklog.

`use-document-windows` owns independent instances for the provider lifetime.
`FloatingWindow` keeps each iframe mounted when minimized, with one restore dot
per minimized instance. `use-document-editor` implements the provider's
[official postMessage API](https://github.com/ranuts/document/blob/main/docs/embed-api.md),
checking both origin and window identity. Only the opened document's bytes and
name are passed to that frame; workspace state, native paths and IPC credentials
are not shared. CSP allows only that editor origin as a remote frame.

The host reads and saves managed attachments through dedicated native commands.
Save compares a SHA-256 fingerprint to detect stale editor instances, validates
the export, writes a fresh managed copy, and updates the workspace under the
storage lock. Unchanged exports do not create another copy. Replacement queues
the superseded copy for deletion in the same DB transaction; cleanup runs after
commit and retries failures through the existing pending-file-deletions queue.
A failed write/commit leaves the previous file intact. Existing missing or
inaccessible attachment references do not block unrelated workspace saves;
new or replaced references must point to a valid file. File access checks show
"File not found" or "Inaccessible" without deleting metadata or relationships.
Closing checks for unsaved changes and offers save, discard or cancel. Minimizing
does not export or save. The provider documents local processing and no history
in embedded mode; its embed API has no cloud-file deletion operation.

The desktop window uses an undecorated Tauri frame with a theme-aware custom
caption in `app/window-frame.tsx`. Its native control hook lives in
`infrastructure/use-window-controls.ts`; Tauri handles minimize, maximize/restore,
close, title-bar dragging and double-click maximization. Only those window
mutation permissions are added to the main-window capability. The caption stays
available while the workspace loads and is omitted in ordinary browsers. The
workspace fills the remaining height beneath the caption, keeping its existing
scrolling regions.

## Boundaries

| Area                   | Responsibility                                              |
| ---------------------- | ----------------------------------------------------------- |
| `src/app`              | Route pages, route composition and shared Next.js layout    |
| `src/components`       | Reusable functional application components                  |
| `src/components/core`  | Basic reusable UI primitives                                |
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

## Task resources and responsibilities

Task creation starts from a topic, or from a parent task for subtasks; their IDs
are implicit. The task editor owns source creation, file import and resource
linking/unlinking. Sources and Files are management views with metadata and task
membership, without creation or relationship-editing controls. An explicit
resource search is required for reuse; a new task never lists the full catalogue.
Native drops and the file picker share the validated managed-copy importer.
Dropping a source URL opens a source draft for type selection; task and resource records are committed
in one workspace save. Canceling discards only uncommitted uploaded copies;
unlinking saved resources preserves them. Legacy topic/source/annotation resource
relationships remain readable without allowing new links outside task editing.

The responsible directory is stored in SQLite metadata (migration 3) and included
in exports. Task/topic payloads store selected responsible names. Legacy owners
remain readable as initial assignments. Description, start/end dates and repeat
are collapsed under advanced task fields. Owner, Next Action and Labels have no
editing, display or label-search functionality; their legacy payload fields remain
only for compatibility with existing databases and archives.

Source creation and metadata editing share `SourceFields`. Available types are
Mail, Ticketing, Meeting and Messaging; provider names belong to System Platform.
Platform selection uses the shared `MultiSelect` in single-selection mode, with
search and inline creation. Mail exposes subject, date and sender/recipients;
Ticketing exposes ticket identifier/link; Meeting exposes date, attendees and
meeting/recording link; Messaging exposes conversation link, Date/Time and a single context field selected
from Sender, Participants or Group Name. Subject and the conversation context
mode are preserved in source metadata and included in exports.
Hidden metadata is preserved when changing type. Historical Email, InvGate and
Teams/Phone types map to Mail, Ticketing and Messaging respectively; ambiguous
legacy categories require an explicit type selection when edited.

Topic forms omit Participants and Related Topics. Target Date, Summary and
Priority are grouped under advanced fields. A shared category-to-color mapping
is stored in SQLite metadata (migration 4) and exported with the workspace.
Changing a category color applies to the text of all its topic tags, without
a background or border. Historical topic participants and relationships remain
in stored records for archive compatibility without exposing those controls.

Topic inactivity indicators use Day.js elapsed days since the topic's centrally
maintained `updatedAt` timestamp and colord's mix plugin to interpolate between
configurable endpoint colors, clamping at the configured period. Defaults are
14 days, grayish white (`#e5e7eb`) and red (`#ef4444`). Settings persist per device
using the same local preference storage as filters. Indicators are derived when
the workspace loads at startup and rerender after activity or settings changes;
no stored topic timestamps are changed by calculating indicators. Topic tables,
detail and the Overview inactivity section share the indicator and threshold.

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

Status and priority values are fixed; categories are free-form.
Tasks and topics use a shared name-only responsible directory and allow multiple assignments. Board layouts, task dependencies,
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
