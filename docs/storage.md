# Storage, export and recovery

Worklog resolves locations through Tauri's path APIs using the application
identifier `com.worklog.desktop`. Open the app's storage/settings view to see
the resolved locations on your machine; do not assume a fixed home-directory
path or move an active SQLite database manually.

| Location                           | Contents                                                       |
| ---------------------------------- | -------------------------------------------------------------- |
| `app_data_dir()/workspace.sqlite3` | Primary SQLite database                                        |
| `app_data_dir()/attachments/`      | App-managed document copies                                    |
| `app_data_dir()/backups/`          | Local backup archives, including safety backups before restore |
| `app_cache_dir()`                  | Regenerable cache only                                         |

Primary records and documents are kept outside cache because operating systems
and cleanup tools can erase cache. Directory and file errors are reported to the
user. The database uses foreign keys, WAL mode, versioned migrations and atomic
transactions. Keep backups outside the application-data directory as well: a
local backup alone does not protect against disk failure, account loss or
deletion of the whole application directory.

## Managed documents

The native picker asks you to choose a document to copy into managed storage.
Generated UUID filenames avoid collisions, while metadata keeps the original
name, inferred MIME type, byte size and date added. Moving or deleting the
original file does not affect that managed copy. The same document can link to
topics, tasks, annotations and sources. Removing a link retains the copy and its
metadata. Explicit **Delete file** removes its metadata and physical managed copy.

Each file may be at most 100 MiB. The app accepts passive documents, images and
plain text; executable files, scripts, HTML, shortcuts and macro-enabled Office
formats are excluded. Content signatures are checked where available in
addition to the extension. Files open in the operating system's registered
application rather than inside an executable-content preview. This screening
does not replace an antivirus scanner or make arbitrary documents trustworthy.

## Create a backup or portable export

To share individual attachments, Ctrl+click their file chips on task cards
(Command+click is also supported). The selection persists while navigating the
workspace. The floating **Export** control saves one file as a copy, or multiple
files as a ZIP containing only those documents. Duplicate filenames receive a
numeric suffix inside the ZIP. Canceling the save dialog retains the selection;
successful export clears it. Missing or inaccessible files stop the export with
an error and retain the selection. Choose a new destination filename; existing
files are never overwritten. This export uses saved local versions, so save any
pending embedded-editor changes first. It is separate from a workspace backup.

Use **Backup** to create a local archive in the backups directory. Use **Export**
to select a destination outside the app directory. Choose a new filename:
export refuses an existing destination to avoid overwriting another file.
Canceling the picker makes no changes.

Both actions produce a ZIP archive containing `workspace.json` and managed files
under `attachments/`. The manifest has `formatVersion: 1`, a workspace revision,
and arrays named `topics`, `tasks`, `activities`, `sources` and `attachments`.
Entity relationships use stable IDs; attachment metadata maps each document to
its managed filename. It is a documented JSON format in a standard ZIP container,
independent of a particular SQLite file layout.

Contacts share one directory for task/topic assignees and topic requesters. Names
are unique without regard to case; email, job title and area are optional. Existing
name-only assignees appear automatically in Contacts. Renaming a contact updates
its assignments and requester references; deleting one removes those references,
without deleting tasks or topics. Migration 5 stores contact details in SQLite
metadata. Backups and exports include the `contacts` directory and each topic's
optional `requesterName`; older archives without these fields remain supported.

The exporter reads a consistent logical snapshot of SQLite while holding the
same native lock used by writes, and packages immutable managed document copies.
It does not copy the live SQLite file or ignore its WAL. Missing or changed
managed files stop the operation instead of producing an apparently complete
backup. The archive limit is 2 GiB in total; a manifest may be at most 50 MiB and
an archive at most 100,001 entries. Keep a successful export in a protected
location. Exports are not encrypted and may contain confidential notes and files.

## Import and restore

1. Choose **Import / restore** and select a Worklog ZIP archive.
2. Review the inspected archive summary and the replacement warning.
3. Confirm only when you intend to replace the current workspace.

Import is a complete replacement, not a merge. The native service validates the
format version, fields, dates, IDs, relations, file metadata and archive entries
before it offers confirmation. It rejects traversal paths, symlinks, duplicate
entries, unknown entries, unsupported document types and missing files. The
validated selection is staged behind a token so the confirmation applies to
that inspected archive.

Before replacing records, restore creates a full safety backup of the current
workspace in `backups/`. Imported documents receive fresh managed filenames to
avoid colliding with existing files; database replacement is transactional.
Existing physical files are retained. A corrupt or incompatible archive, failed
safety backup or failed database operation returns an error rather than silently
discarding the previous workspace. Use an earlier valid ZIP through the same
restore flow to recover. A backup on another disk remains necessary for recovery
from hardware or operating-system failures.

## Scope

The application is local-first, has no background cloud backup, and does not
encrypt SQLite or attachments. Use operating-system disk encryption and access
controls appropriate to the sensitivity of your work. Export formats may evolve;
unsupported versions are rejected explicitly rather than guessed. Import merges,
automatic retention policies and database repair tools
are outside this first version's scope.

## Deleting tasks

Permanent task deletion removes live task records, affected descendants and
recurrence families, and all linked activities and their revisions in one
transactional workspace save. There is no trash, deletion audit event, automatic
pre-deletion backup or retained recurrence tombstone. Reusable sources and
managed files are retained; links to deleted tasks/activities are removed.
Confirmation includes affected counts and warns about shared annotations and
whole-series deletion. Canceling or a failed save preserves the original data.

Previously created backups/exports are not rewritten, and restoring an older
archive can restore its old tasks. Deleting records in the app is not secure
erasure of SQLite free pages, WAL files, external documents or copies on other
devices.

## Deleting other items or clearing the workspace

Delete controls are available for topics, sources, annotations and files, both in
their views and in existing-item editors where applicable. Each operation shows
affected counts and requires confirmation against the reviewed workspace revision.

- **Topic:** deletes tasks (including descendants and recurrence families), all
  annotations citing those tasks, exclusively owned topic annotations, and
  exclusive sources/files. Shared task-linked annotations are deleted in full,
  as stated in confirmation. Other shared items retain their remaining links.
- **Source:** deletes the reference and removes its IDs from tasks/annotations.
  Their text and corrections remain. Exclusive source files are deleted.
- **Annotation:** deletes its text and all corrections, plus exclusive files.
- **File:** deletes the managed copy and all its workspace relationships. It
  does not delete its original outside the managed directory.
- **Delete all workspace data:** clears all records and managed file copies,
  including unreferenced copies left by earlier restores. An optional checkbox
  also deletes local archives inside Worklog's backups directory. External
  exports, originals, preferences and files on other devices are unaffected.

No operation creates a deletion history, trash record or automatic backup.
Previously created backups remain unless local backup removal is selected.

Database migration 2 adds a durable queue of pending filenames, separate from
workspace history. Removed metadata and cleanup intent commit atomically;
physical file removal runs after commit. Failure to remove a locked or
inaccessible file returns the committed workspace with a visible cleanup warning,
rather than pretending the database change failed. Pending jobs retry on load,
save and **Retry file cleanup** in settings. Successful jobs are removed.
Referenced filenames are protected from stale jobs. Cleanup only targets validated
filenames inside the managed attachments/backups directories and refuses replaced
directory links; it never traverses subdirectories. SQLite logical deletion does
not guarantee forensic erasure of disk pages or independent archives.

## Downloaded application updates

Verified executable downloads, temporary partials and small rotating diagnostics
live in `app_cache_dir()/updates`, separate from primary data and backups.
The cache is regenerable and may be cleared by the operating system. Production
update credentials use Windows Credential Manager; development credentials have
a separate browser storage entry and are not included in workspace exports.
See [application updates](updates.md).
