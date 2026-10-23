Worklog brings topics, tasks, references, contacts and managed files together in
one local workspace. This guide describes the controls available in the app.
It is bundled with Worklog and can be read without an internet connection.

## Contents

- [Getting started](#getting-started)
- [Overview](#overview)
- [Topics](#topics)
- [Tasks and subtasks](#tasks-and-subtasks)
- [Reminders and system tray](#reminders-and-system-tray)
- [Task updates](#task-updates)
- [Resources and sources](#resources-and-sources)
- [Managed files](#managed-files)
- [Selecting and exporting attachments](#selecting-and-exporting-attachments)
- [Editing documents](#editing-documents)
- [Contacts, assignees and requesters](#contacts-assignees-and-requesters)
- [History and topic timeline](#history-and-topic-timeline)
- [Archive and permanent deletion](#archive-and-permanent-deletion)
- [Settings, colors and appearance](#settings-colors-and-appearance)
- [Backups, export and restore](#backups-export-and-restore)
- [Application updates](#application-updates)
- [Keyboard shortcuts and navigation](#keyboard-shortcuts-and-navigation)
- [Storage, privacy and troubleshooting](#storage-privacy-and-troubleshooting)

## Getting started

1. Open the desktop application. A browser preview can show the interface, but
   saving data, attaching files and backups require the desktop runtime.
2. Choose **New topic** from Overview or Topics. Give the topic a title and, if
   needed, select a category, assignees and a requester.
3. Open the topic and choose **+ Task**. Tasks inherit their topic automatically;
   subtasks also inherit their parent.
4. Add references or documents in the task's **Resources** field, then save.
5. Complete tasks with their checkbox. Use **Add update** to record progress or
   **Blocked** to record an obstacle.

Saved records and managed documents are stored on this device. Files selected
for export and expanded task threads are temporary interface state; they are
not a replacement for saving your work or creating backups.

Switch views using the sidebar. Navigation updates the current view without
reloading the application or reopening the local database.

## Overview

Overview summarizes open, overdue and blocked tasks, plus topics in progress.
Click a metric to open its corresponding task or topic view with that filter.
**Needs attention** highlights blocked tasks, missed deadlines and upcoming
deadlines. Recent activity opens the associated topic.

Use **New topic** to start a new matter. Overview is a summary; **History** is
the broader chronological view of recorded workspace movements.

## Topics

A topic groups tasks, sources, files and their timeline. Create one from
**Topics → New topic** or from Overview; click its title to open its workspace.

### Topic fields

- **Title:** identifies the matter.
- **Status:** sets the topic's overall state. Archiving is a separate action.
- **Assignees:** one or more people responsible for the topic.
- **Requester:** the contact who requested the work. This is a single optional
  contact, independent of the assignees.
- **Category:** search for an existing category or type a name to create one.
  The adjacent color control sets the text color for that category across topics.
- **Advanced fields:** contains Start date, Summary, Priority and Target date.
  Raising priority above Normal exposes the target date as **Deadline** outside
  the advanced section.

Category removal clears that category from affected topics after confirmation
and saving the form. It does not delete the topics.

### Topic workspace and organization

Use the **…** menu to edit or delete the topic. **Archive** remains a separate
button. A current summary is shown only when the topic has one. General topic
files appear as compact attachments below that area; **Attach file** adds one
directly to the topic.

The topic tabs are **Tasks**, **Sources**, **Files** and **Timeline**. The Files
tab includes documents associated with the topic and its work. Use **+ Task**
to create a main task inside the current topic.

In the Topics list, search and filters narrow the results. **Sort by** orders
them by last update, target date, priority or name. **Group by** offers category,
requester, priority, status, creation date, last update and deadline. Requester
groups combine the same name regardless of case, preserve the contact's display
name and place topics without one under **No requester** at the end. Grouping by category
shows the category in the group heading instead of repeating it on every row.
Grouping and sorting preferences are saved on this device.
Grouped topic tables share the same column widths, keeping status, priority,
assignees and dates aligned across groups regardless of their contents.

### Topic color indicator

The slim color bar uses the Initial, Midpoint and Final colors configured in
Settings. Without a target date it represents time since the topic's last
activity, relative to the configured inactivity period. Changes to related
tasks and resources also update topic activity.

When a topic has a target date, its bar instead represents elapsed time from
its Start date to the end of its target day. If no Start date is available,
creation time is used. The configured inactivity period does not control this
deadline calculation, but the configured colors still apply. Hover the
indicator for its date or inactivity explanation.

## Tasks and subtasks

Create main tasks from their topic's **+ Task** action. Create a child through
the parent's **… → Add subtask**. Each task has its own card in a tree; children
remain associated with their parent. Click a task title to edit it.

Task fields include Title, Priority, Deadline, Assignees and Resources.
**Advanced fields** contains Description, Start date and Repeat. Creation time
is recorded automatically and new tasks start with today's Start date; there
is no need to enter a creation date yourself.

### Completion, blocking and descriptions

- A new unfinished task is **In progress**. There is no task status selector.
- Use the checkbox to complete it. Unchecking it returns it to In progress.
  Completion does not produce a success notification.
- Use **… → Blocked** to block it. A reason is required. The warning icon shows
  that reason on hover or keyboard focus.
- Use **… → Unblocked** to resume work. Completed tasks cannot be blocked.
- A description icon appears when a task has a description. Hover or focus it
  to read the text without opening the editor.

Task icons appear in this order: blocked warning, updates, description, then
**…**. The actions menu opens on hover and also works by click or keyboard.
It groups Add update, Add subtask, Remove and Blocked / Unblocked.

### Deadlines, ordering and visibility

A task with a deadline shows a small color pill below its checkbox. It uses
your configured Initial, Midpoint and Final colors, based on elapsed time from
creation to the end of the deadline day. Tasks without a deadline have no pill.
The date, with an Overdue label when applicable, appears below the actions.

**Order by** offers creation date oldest/newest first, deadline, priority and
name. Parents remain before their visible descendants; sorting applies to
roots and siblings. Creation-date ordering avoids movement caused merely by
editing a task. The chosen order is saved on this device.

**Hide completed** hides only completed main tasks. Children remain eligible
to appear even when their completed parent is hidden. Other active filters
still apply. The Tasks page offers Open, All, Overdue and Blocked views.

### Repeating tasks

Set **Advanced fields → Repeat** to Daily, Weekly or Monthly and provide a
deadline. Each occurrence is a separate task. Worklog generates due occurrences
when loading or saving the workspace. Repeat controls task generation; reminder
alerts are scheduled separately on individual tasks. Generated occurrences do
not inherit the original task's absolute reminder date.

Deleting any task belonging to a recurring series deletes the series, as
explained in the confirmation, so deleted occurrences are not recreated.

## Reminders and system tray

Both **Tray icon** and **Reminder notifications** are **off by default**.
Enable them under **Settings → General → Tray & reminders**, in that order.
Trying to switch on a task reminder before both settings are enabled shows an
alert explaining the requirement and leaves the task reminder switched off.
The native save layer also enforces this requirement.

### Schedule a reminder

1. Create or edit an unfinished task and switch on **Reminder**.
2. Choose a future **Reminder date and time**, then save the task.
3. The reminder time is independent of the deadline and uses your local time
   for entry and display. It is stored as an absolute timestamp so changing
   time zones does not change the scheduled instant.

Turning off the Reminder switch and saving removes that task's schedule.
Editing other task fields preserves an existing schedule, including an overdue
one. A dismissed reminder is shown as dismissed in the form; change its date to
a new future time to schedule it again. Reopen a completed task before setting
a new reminder.

### Persistent alerts

When a reminder becomes due, Worklog opens its own compact window at the lower
right of the main window's monitor, within the monitor's working area. The
window stays above ordinary windows and does not request keyboard focus when
it appears. Long lists scroll inside it. These are **Worklog windows**, not
Windows notification-center toasts, and they also work with the portable app.

Each alert shows the topic, task and scheduled time. Click its content to
restore Worklog and open that task. If a form or save operation is already
open, Worklog asks you to finish it first instead of discarding it. Opening a
task does not dismiss the alert. Use the alert's **×** to dismiss it explicitly.
Alerts do not time out, and Escape / Alt+F4 does not dismiss the whole queue.

A single sound loops while any reminder is pending; simultaneous reminders do
not stack multiple sounds. Dismissing the last one stops playback and hides
the window. Dismissal is saved with the task, so reopening Worklog does not
repeat an acknowledged reminder. Settings also lists pending reminders with
Open and Dismiss controls. If the separate window cannot be presented, Worklog
restores the main window and provides fallback dismissal controls there.

Completing or canceling a task acknowledges its current reminder. Removing a
task or its reminder also removes the alert. Archived or completed/canceled
topics pause reminders for their tasks; overdue reminders can return when the
topic is active again. Disabling notifications pauses existing schedules and
stops active alerts and sound without deleting the schedules. Disabling the
tray also disables reminder notifications. Re-enabling both settings makes
unacknowledged overdue reminders eligible again.

### Tray behavior and app lifetime

With Tray icon enabled, minimizing **or closing** the main window hides it
while Worklog continues running. Click the tray icon or choose **Open Worklog**
from its menu to restore it. **Exit** fully quits and asks for confirmation
when a form, document or operation is open; save your changes first. Turning the tray off restores the main
window. With the feature off, normal minimize/close behavior applies.

Only one Worklog process runs for this application identity. Starting it again
restores the existing instance, preventing duplicate reminder engines.

The native reminder clock and audio do not depend on a visible browser tab.
Due reminders are checked about every two seconds while the process runs.
After computer sleep or a later app restart, overdue unacknowledged reminders
are detected again. Worklog does not wake a sleeping/off computer, automatically
start at login, or issue alerts while the process is fully exited. Scheduling
depends on the system clock, so keep the computer's date/time accurate.

### Configure the sound

In **Settings → General → Tray & reminders**, choose a custom audio file or
**Use default** to restore the included soft tone. The default is a short,
gentle pulse with pauses, repeated indefinitely for pending alerts.

**Choose audio…** accepts WAV, MP3, OGG and FLAC, up to **10 MiB / 60 seconds**,
mono or stereo, at up to **96 kHz**. Worklog validates the audio and keeps its
own copy; moving the original file does not break reminders. A custom sound
repeats as supplied, so include any desired quiet interval in the file.
**Preview** plays up to five seconds and **Stop preview** stops it. Preview is
available while configuring disabled features, but is disabled while real
reminders are sounding. Stopping a preview cannot silence pending reminders.

Volume is adjustable from 1–100%, with a default of 25%. The operating system's
volume, mute state and selected output device still apply. If the custom file
is missing or unreadable, Worklog reports it and falls back to the default
tone. If audio output is unavailable or interrupted, the visual alerts remain;
Worklog reports the failure and retries audio output. Dismissal stays available.

Tray/reminder settings and custom sounds belong to this device and are not
included in workspace archives. Task schedules and their dismissal state are
included. Restoring an archive restores that archive's reminder state; it does
not enable these optional device features automatically.

## Task updates

Choose **… → Add update**, enter a description and save. The app records the
date and time automatically. Updates document progress; subtasks divide work
into smaller units. Recording an update does not complete the task.

When a task has at least one update, its updates icon toggles a separate thread
between the parent card and its subtasks. Updates have a vertical timeline,
with a date/time and description for every entry, newest first. They do not
have their own cards. Expanding this history does not expand or collapse
subtasks, and vice versa.

## Resources and sources

In a task's create/edit form, **Resources** combines sources and attached files.
Create sources and link or unlink task resources there. Search explicitly to
reuse an existing resource; a new task does not list the entire catalogue.
Click a source chip on a task to inspect its details and open its original
link when one is available.

### Create a source

Choose the new-source action inside Resources, enter a title, then select its
type. **System Platform** is a searchable selector that also creates names.
Platforms are listed for the selected source type.

| Type | Available context fields |
| --- | --- |
| Mail | Subject, Date, Sender / recipients and Context |
| Ticketing | Ticket identifier, Ticket link, Requester / contacts and Context |
| Meeting | Meeting / recording link, Meeting date and time, Attendees and Context |
| Messaging | Message / conversation link, Date/Time, one conversation identity and Context |

For Messaging, **Identify conversation by** switches between Sender,
Participants and Group Name. Only the selected identity field is shown.
Date/time inputs include local time controls when the field supports time.
Source links may use HTTP, HTTPS or Teams links.

Source icons identify their type throughout resource lists, task attachments,
forms, details and timelines: an envelope for Mail, a ticket for Ticketing, a
calendar for Meeting and conversation bubbles for Messaging. Older references
without a recognized type retain the general link icon.

Finish adding the source before saving the task. If a resource form has a
pending draft, Worklog warns and keeps the task form open until you add the
resource or explicitly discard that draft. Saving the task commits its resource
relationships together. Canceling the task discards its uncommitted uploads.

### Manage resources

**Resources** in the sidebar separates **Sources** and **Files** into tabs.
Search or filter to inspect metadata and identify the tasks using a resource.
Source details allow metadata editing and opening the original link. The
management views do not create new task relationships.

Removing a System Platform name clears it from sources of that type after
confirmation and saving. The sources and their task links remain.

## Managed files

Use the file picker or drop files into a task form's Resources area. Worklog
copies them into its managed attachments directory; changing or removing the
original outside Worklog does not change that copy. Topic-level general files
can also be attached from the topic workspace.

Supported attachments include PDF, text, Markdown, CSV, JSON, logs, common
images, DOCX, XLSX, PPTX, ODT, ODS and ODP. Each file may be at most **100 MiB**.
Executables, scripts, shortcuts, HTML and macro-enabled Office files are not
accepted. Attachment support does not mean every format has an embedded editor.

Click a file chip to open it. Depending on the format and your document-editor
setting, it opens in Worklog or through the system's default application.
Files details in Resources let you inspect ownership and metadata or delete
the managed file.

Unlinking a saved file from a task retains its managed copy. Explicitly deleting
the file removes that copy and its relationships; it leaves the original
outside Worklog untouched. If a managed file is removed manually, Worklog
reports **File not found** or **File inaccessible** when accessing it, instead
of preventing unrelated work.

## Selecting and exporting attachments

Hold **Ctrl** and click a file attachment on a task card to select it. Repeat
the gesture to deselect it. On macOS, Command+click also works. Selected chips
are highlighted; clicking normally still opens the file. Sources are not file
attachments and are not included in this selection.

Selection can span tasks and topics and remains while navigating the current
workspace session. **Export (N)** appears at the lower right alongside
minimized documents. **×** clears the selection.

1. Select the attachments you want to share.
2. Choose **Export (N)** and a new destination filename in the save dialog.
3. With one selected file, Worklog writes a standalone copy. With several, it
   creates a ZIP containing only those files, using their original names where
   valid. Duplicate names receive numeric suffixes inside the ZIP.
4. Send the exported copy or ZIP through your usual email, chat or file service.

The managed originals remain in Worklog. Existing destination files are not
overwritten. Canceling or a failed export retains the selection; success clears
it. Missing or inaccessible selected files stop the export with an error.
The combined export size limit is **2 GiB**.

Export uses the saved local files. Save pending changes in an embedded editor
before exporting. An exported copy is independent: later edits in Worklog do
not update copies already shared. File export is different from a full
workspace backup and does not include tasks, contacts or a workspace manifest.

## Editing documents

**Settings → General → Open documents in Worklog** enables the optional
integrated editor for DOCX, XLSX, PPTX and CSV. Other supported attachments,
including PDF, open with the system's default application. Turning the setting
off restores that behavior for all new file openings; existing document
windows remain available.

The embedded editor loads from **edit.chaxus.com** and needs an internet
connection to load. File editing is processed on the device. This is distinct
from Worklog's local database and does not add automatic cloud synchronization
or Microsoft Office account integration.

Documents open in a large floating modal. Its controls minimize or close it.
You can open multiple documents; minimized instances appear as individual
dots at the lower right. Hover a dot to identify its document and click to
restore it.

When closing a document that may contain unsaved changes, choose **Save &
close**, **Discard** or **Cancel**. Saving updates the existing attachment and
keeps its task/topic references; it does not create another attachment for
every edit. If the editor cannot load, its error panel offers **Open with
default app**. Keep a document open and retry if saving fails.

## Contacts, assignees and requesters

**Contacts** manages one directory shared by topic/task assignees and topic
requesters. Existing name-only assignees appear there automatically.

- Choose **New contact** to create one using only a name.
- Email, Job title and Area are optional. Add or edit them through the contact's
  **… → Edit contact** menu.
- Search matches name, email, job title and area.
- Assignees selectors support one or more contacts. The topic's Requester
  selector supports one contact. Search for a name or create one directly
  inside either selector, then save the task or topic.
- Renaming a contact also updates its assignee and requester references.
  Names are unique without regard to letter case.
- Clearing a selection only removes that assignment. Using the selector's
  trash action deletes the contact after any required confirmation and saving
  the form. **Contacts → … → Delete contact** also removes its details and
  assignee/requester references after confirmation, including archived topics.
  Tasks and topics themselves remain.

These are local contact records. Entering an email does not send messages,
invite people, grant access or synchronize an external address book.

## History and topic timeline

**History** shows workspace movements grouped by date, newest first, with
times near the timeline. Scroll down to progressively load older entries or
use **Load older movements**. Search and filters narrow the history; clicking
an entry opens its topic, task or resource.

The history includes creation records, recorded activities and the latest
update timestamps for supported workspace entities. It is not an immutable
audit log of every field edit and does not preserve deleted records.

Inside a topic, **Timeline** brings together its recorded task activity,
status changes and associated source events. It is ordered newest first;
source event time can differ from the time the source was entered. Task
updates also have their own independently collapsible thread on the task.
There is no separate annotation creation workflow.

## Archive and permanent deletion

Use **Archive** on a topic to remove it from active views without deleting its
data. **Archive** in the sidebar lets you find archived topics and restore
them to active work.

Permanent deletion is different. Read the confirmation's affected counts before
continuing. Deleting a task can also delete descendants, a recurring series
and linked activity. Deleting a topic can remove its tasks and exclusively
associated records or files; shared resources retain remaining relationships
when applicable. File deletion removes the managed copy from disk.

There is no recycle bin, deletion history or automatic backup before ordinary
deletions. Previously created backups and exports are not rewritten. Restoring
an older backup may bring back records deleted since that backup.

## Settings, colors and appearance

**Settings → General** contains:

- **Appearance:** Light, Dark or System theme. System follows the operating
  system. This preference is saved on the device.
- **Texture overlay:** enable or disable the grain texture. Opacity adjusts its
  strength, with a default of 50%.
- **Open documents in Worklog:** switch between the integrated document editor
  and opening attachments with the system's default application.
- **Topic inactivity:** set a positive number of days and Initial, Midpoint and
  Final colors. Click the markers on the horizontal gradient to adjust colors,
  then choose **Save inactivity settings**. The default period is 14 days and
  the palette runs from grayish white through a midpoint to red.
- **Tray & reminders:** enable the tray and Worklog reminder notifications,
  configure a custom sound and volume, preview it and manage pending alerts.
  Both optional features start disabled. Appearance, document-editor and
  tray/reminder toggles use accessible switches.

Deadline indicators use these same colors but calculate progress from their
own start/creation and target dates. Topics without a target date use the
inactivity period instead. Device preferences, including colors and texture,
are independent of workspace backups.

**Settings → Storage & backups** contains backup, export, restore, storage
locations, file cleanup and whole-workspace deletion. **Settings → Updates**
contains application update controls.

## Backups, export and restore

Use **Settings → Storage & backups**:

- **Create backup:** writes a local backup in Worklog's backups directory.
- **Export archive…:** writes a full workspace ZIP to a destination you choose.
  Keep a copy on another device to protect against disk loss.
- **Import / restore…:** select a Worklog workspace ZIP, review the summary and
  confirm. Worklog validates it and creates a safety backup before replacement.
- **Show locations:** displays the resolved database, attachments, backups and
  cache locations for this installation.
- **Retry file cleanup:** retries pending removals, for example after another
  application releases a locked file.
- **Delete all workspace data:** permanently clears records and managed files.
  The confirmation optionally includes local backups. External exports,
  original documents and device preferences remain separate.

Workspace archives include topics, tasks, recorded activities, sources,
attachments, contacts and assignments. Restore **replaces** the workspace;
it does not merge two workspaces. A ZIP made by the attachment Export button
is only a set of documents and cannot serve as a workspace restore archive.
Task reminder schedules and dismissals travel with workspace archives; device
tray/notification preferences and custom audio do not.

Archives are not encrypted. Missing or changed managed files can prevent a
complete backup or export; resolve the reported files before retrying. Do not
move an active SQLite database manually. Use the backup/export and restore
controls for moving workspace data.

## Application updates

On supported Windows x64 builds, Worklog checks GitHub Releases on startup.
Use **Settings → Updates → Check for updates** for a manual check. An available
update offers release notes and **Download update**.

The downloaded executable is verified and kept separately from workspace
data. Installation is manual: Worklog does not close itself, replace the
running executable or launch the update automatically. A GitHub credential
can be configured for private releases; entering one does not change how your
workspace data is stored. Connection or access problems from a manual check
are reported in the interface.

## Keyboard shortcuts and navigation

These shortcuts apply in the Worklog interface. Embedded document editors may
handle their own shortcuts while their iframe has focus.

| Shortcut / gesture | Where | Action |
| --- | --- | --- |
| Ctrl + click | File chips on task cards | Select or deselect a file for export without opening it |
| Command + click | File chips on task cards, macOS | Same file selection action |
| Ctrl / Command + Enter or Space | Focused file chip on a task card | Toggle export selection from the keyboard |
| Alt + T | Worklog notifications | Focus the notifications area |
| Tab / Shift + Tab | Worklog controls | Move focus forward or backward |
| Enter / Space | Focused buttons and checkboxes | Activate the control or toggle its checkbox |
| Space | Focused settings switch | Toggle the setting |
| Arrow keys and Enter | Open menus and searchable selectors | Navigate options and select one |
| Left / Right arrow | Focused tab lists | Move between tabs |
| Escape | Standard dialogs, menus and popovers | Request close or dismiss; pending operations may prevent closing |

Hover opens a task's **…** menu, while clicking or keyboard activation remains
available. Hover or focus shows task descriptions, blocked reasons and document
dot tooltips. Closing an embedded document may ask what to do with unsaved
changes. Ordinary file clicks still open files; export selection requires the
modifier key.
Worklog reminder alerts require explicit dismissal with their × button; Escape
and Alt+F4 do not dismiss the pending reminder queue.

## Storage, privacy and troubleshooting

Worklog saves its SQLite database and managed files in the operating system's
persistent application-data directory. Cache contains regenerable data such
as downloaded application updates. The sidebar reports whether storage is
available or an operation is running.

The workspace is local-first. Entering a source does not connect to its email,
ticketing or messaging service or import data automatically. There is no
workspace cloud sync or telemetry. The optional embedded editor loads an
external website, and update checks contact GitHub. Worklog does not encrypt
the database, attached documents or exported archives.

### Common situations

- **Desktop runtime required:** open the desktop app; a frontend browser preview
  cannot access the native database, file dialogs or export commands.
- **Database could not be opened:** check the reported storage location and
  permissions, then use Try again. Do not delete the database to clear an error.
- **File not found / inaccessible:** its managed copy is missing, changed or
  unreadable. Other tasks and topics can still be edited. Reattach a valid copy
  through the appropriate task or topic if needed.
- **A resource draft blocks saving:** add that resource to the task or discard
  its draft explicitly, then save the task again.
- **Export canceled:** the file selection remains so you can retry. Use a new
  destination name if one already exists.
- **Document changes are missing from an export:** save them in the integrated
  editor first. Export reads the saved attachment, not unsaved iframe contents.
- **Pending file cleanup:** close applications holding the file and choose
  Settings → Storage & backups → Retry file cleanup.
- **No update is offered:** the release must be newer and have a compatible,
  fully uploaded Windows executable. A release may appear before its build
  finishes; check again after the build has completed.
- **Cannot enable a reminder:** enable both Tray icon and Reminder notifications
  in Settings → General first. Existing schedules remain paused when disabled.
- **Reminder is visible but silent:** check Worklog volume, system mute/output
  and the reported sound error. A missing custom file uses the default tone;
  unavailable devices are retried. You can still dismiss the visual alert.
- **Worklog disappeared after closing:** with Tray icon enabled, closing hides
  the window. Restore it from the tray; use Exit there to quit fully.
