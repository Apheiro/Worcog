'use client';
import { CategoryTag } from './category-tag';
import { Card } from './core/card';
import * as Tabs from '@radix-ui/react-tabs';
import { IconArchive, IconArrowLeft, IconEdit, IconLink, IconPlus } from '@tabler/icons-react';
import type { DeletionTarget } from '../application/deletion';
import { updateTask } from '../application/workspace';
import { formatDate, isOpen } from '../domain/dates';
import type { Topic } from '../domain/model';
import { attachmentTopicIds, sourceTopicIds } from '../domain/relationships';
import type { Workbench } from '../infrastructure/use-workspace';
import type { Editor } from './editors';
import { Badge, Button } from './core';
import { assignedNames } from '../domain/responsibles';
import { human } from '../domain/options';
import { FileList, SourceList, TaskList, Timeline } from './work-lists';
export function TopicDetail({
  topic,
  wb,
  edit,
  openSource,
  back,
  archive,
  manageFile,
  openFile,
  deleteTask,
  onDelete,
}: {
  topic: Topic;
  onDelete: (target: DeletionTarget) => void;
  wb: Workbench;
  edit: (editor: Editor) => void;
  openSource: (id: string) => void;
  back: () => void;
  archive: () => void;
  manageFile: (id: string) => void;
  openFile: (id: string) => void;
  deleteTask: (id: string) => void;
}) {
  const w = wb.workspace;
  const tasks = w.tasks.filter((t) => t.topicId === topic.id);
  const sources = w.sources.filter((s) => sourceTopicIds(w, s).includes(topic.id));
  const files = w.attachments.filter((f) => attachmentTopicIds(w, f).includes(topic.id));
  return (
    <>
      <Button size="sm" onClick={back}>
        <IconArrowLeft size={15} /> All topics
      </Button>
      <div className="page-heading flex items-start justify-between [gap:24px] [margin-bottom:29px] [&_h1_+_p]:[margin-top:9px] [&_h1_+_p]:[font-size:13px] [&_>_.button]:[margin-top:22px] [@media(max-width:1150px)]:[&_h1]:[font-size:27px] [@media(max-width:800px)]:flex-wrap [@media(max-width:800px)]:[gap:15px] [@media(max-width:800px)]:[&_>_.button]:[margin-top:0] [@media(max-width:800px)]:[&_h1]:[font-size:26px] mt-5">
        <div className="min-w-0">
          <p className="eyebrow [font-size:11px] [letter-spacing:1.1px] uppercase [color:var(--muted)] [font-weight:600] [margin-bottom:10px]">
            <CategoryTag category={topic.category} /> {topic.archived && '· Archived'}
          </p>
          <h1 className="break-words">{topic.title}</h1>
          <div className="flex gap-2 items-center flex-wrap mt-3">
            <Badge tone={topic.status === 'blocked' ? 'warning' : 'neutral'}>
              {human(topic.status)}
            </Badge>
            <Badge tone={topic.priority === 'urgent' ? 'danger' : 'neutral'}>
              {human(topic.priority)} priority
            </Badge>
            <span className="muted [color:var(--muted)] text-sm">
              {assignedNames(topic).join(', ') || 'Unassigned'} · Updated{' '}
              {formatDate(topic.updatedAt)}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button disabled={wb.busy} onClick={() => edit({ kind: 'topic', id: topic.id })}>
            <IconEdit size={16} /> Edit
          </Button>
          <Button
            tone="danger"
            disabled={wb.busy}
            onClick={() => onDelete({ kind: 'topic', id: topic.id })}
          >
            Delete topic
          </Button>
          <Button disabled={wb.busy} onClick={archive}>
            <IconArchive size={16} />
            {topic.archived ? 'Unarchive' : 'Archive'}
          </Button>
        </div>
      </div>
      <Card className="topic-summary [&_>_div]:[padding:21px_23px] [&_p]:[font-size:13px]">
        <div>
          <h2>Current summary</h2>
          <p className="whitespace-pre-wrap mt-3">
            {topic.summary || 'Add a summary to give this topic context.'}
          </p>
        </div>
      </Card>
      <div className="quick-actions flex items-center [gap:9px] flex-wrap [padding:20px_0_0] [&_>_span]:[margin-right:8px] [@media(max-width:800px)]:[gap:7px] [@media(max-width:800px)]:[&_>_span]:w-full">
        <span className="muted [color:var(--muted)] text-sm">Add to this topic</span>
        <Button size="sm" onClick={() => edit({ kind: 'activity', topicId: topic.id })}>
          <IconPlus size={15} /> Annotation
        </Button>
        <Button size="sm" onClick={() => edit({ kind: 'task', topicId: topic.id })}>
          <IconPlus size={15} /> Task
        </Button>
      </div>
      <Tabs.Root defaultValue="tasks" className="mt-5">
        <Tabs.List
          aria-label="Topic workspace"
          className="tabs flex [gap:26px] [border-bottom:1px_solid_var(--border)] [margin-bottom:20px] [&_button]:[background:transparent] [&_button]:border-0 [&_button]:[border-bottom:2px_solid_transparent] [&_button]:[padding:12px_0] [&_button]:[font-size:13px] [&_button]:[color:var(--muted)] [&_button[data-state=active]]:[color:var(--ink)] [&_button[data-state=active]]:[border-bottom-color:var(--ink)] [&_button[data-state=active]]:[font-weight:600] [&_button_span]:[background:var(--surface-soft)] [&_button_span]:[border-radius:4px] [&_button_span]:[padding:1px_5px] [&_button_span]:[font-size:10px] [&_button_span]:[margin-left:5px] [@media(max-width:800px)]:[gap:18px]"
        >
          <Tabs.Trigger value="tasks">
            Tasks <span>{tasks.filter((t) => isOpen(t.status)).length}</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="sources">
            Sources <span>{sources.length}</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="files">
            Files <span>{files.length}</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tasks">
          <TaskList
            showContext={false}
            onOpenSource={openSource}
            onOpenFile={openFile}
            onDelete={deleteTask}
            tasks={tasks}
            workspace={w}
            busy={wb.busy}
            onEdit={(id) => edit({ kind: 'task', id })}
            onStatus={(id, status) => {
              void wb.update((value) => updateTask(value, id, { status }));
            }}
            onAddSubtask={(task) => edit({ kind: 'task', topicId: topic.id, parentId: task.id })}
          />
        </Tabs.Content>
        <Tabs.Content value="sources">
          <SourceList
            sources={sources}
            onOpen={openSource}
            onDelete={(id) => onDelete({ kind: 'source', id })}
          />
        </Tabs.Content>
        <Tabs.Content value="files">
          <FileList
            onDelete={(id) => onDelete({ kind: 'attachment', id })}
            files={files}
            open={openFile}
            manage={manageFile}
          />
        </Tabs.Content>
        <Tabs.Content value="timeline">
          <Timeline
            workspace={w}
            topicId={topic.id}
            onEdit={(id) => edit({ kind: 'activity', id, topicId: topic.id })}
            onSource={openSource}
            onDelete={(kind, id) => onDelete({ kind, id })}
          />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}
