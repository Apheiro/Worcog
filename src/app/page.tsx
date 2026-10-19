'use client';
import { Card, CardHeader } from '../components/core/card';
import { IconArrowRight, IconClock, IconFlag, IconLock, IconProgress } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { compareTimestamps, formatTimestamp, isOpen, isOverdue, today } from '../domain/dates';
import { Badge, Button, Empty } from '../components/core';
import { assignedNames } from '../domain/responsibles';
import { human } from '../domain/options';
import { TopicTable } from '../components/work-lists';
import { useWorklog } from '../providers/worklog';

export default function Page() {
  const { w, openTopic, setEditor, enabled } = useWorklog();
  const newTopic = () => setEditor({ kind: 'topic' });
  const topics = w.topics.filter((t) => !t.archived);
  const tasks = w.tasks.filter(
    (t) => isOpen(t.status) && topics.some((topic) => topic.id === t.topicId),
  );
  const overdue = tasks.filter((t) => isOverdue(t));
  const blocked = tasks.filter((t) => t.status === 'blocked');
  const active = topics.filter((t) => t.status === 'in_progress');
  const stale = topics.filter(
    (t) => isOpen(t.status) && dayjs(t.updatedAt).isBefore(dayjs().subtract(14, 'day')),
  );
  const dueSoon = tasks.filter(
    (t) =>
      t.dueDate && t.dueDate >= today() && t.dueDate <= dayjs().add(7, 'day').format('YYYY-MM-DD'),
  );
  const recent = [...w.activities]
    .sort((a, b) => compareTimestamps(b.eventAt, a.eventAt))
    .slice(0, 8);
  const next = [...tasks].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
  return (
    <>
      <div className="page-heading flex items-start justify-between [gap:24px] [margin-bottom:29px] [&_h1_+_p]:[margin-top:9px] [&_h1_+_p]:[font-size:13px] [&_>_.button]:[margin-top:22px] [@media(max-width:1150px)]:[&_h1]:[font-size:27px] [@media(max-width:800px)]:flex-wrap [@media(max-width:800px)]:[gap:15px] [@media(max-width:800px)]:[&_>_.button]:[margin-top:0] [@media(max-width:800px)]:[&_h1]:[font-size:26px]">
        <div>
          <p className="eyebrow [font-size:11px] [letter-spacing:1.1px] uppercase [color:var(--muted)] [font-weight:600] [margin-bottom:10px]">
            Your operational workspace
          </p>
          <h1>Overview</h1>
          <p className="muted [color:var(--muted)]">
            What needs your attention, and where things stand.
          </p>
        </div>
        <Button tone="primary" disabled={!enabled} onClick={newTopic}>
          New topic <IconArrowRight size={16} />
        </Button>
      </div>
      {!topics.length && !w.topics.length && (
        <Empty
          title="Give your work a place to live"
          action={
            <Button tone="primary" disabled={!enabled} onClick={newTopic}>
              Create your first topic
            </Button>
          }
        >
          Start with a project, incident or request. Add its references, decisions and next steps as
          the story develops.
        </Empty>
      )}
      <Card asChild tone="soft">
        <div className="metrics grid [grid-template-columns:repeat(4,_minmax(0,_1fr))] [margin:25px_0_28px] [@media(max-width:800px)]:[grid-template-columns:1fr_1fr]">
          {[
            { title: 'Open tasks', value: tasks.length, icon: IconClock },
            { title: 'Overdue', value: overdue.length, icon: IconFlag },
            { title: 'Blocked tasks', value: blocked.length, icon: IconLock },
            { title: 'Topics in progress', value: active.length, icon: IconProgress },
          ].map((metric) => (
            <div
              className="metric [padding:19px_23px] [border-right:1px_solid_var(--border)] [font-size:12px] [color:var(--muted)] [&:last-child]:[border:none] [&_svg]:[color:var(--muted)] [&_strong]:block [&_strong]:[color:var(--ink)] [&_strong]:[font-size:30px] [&_strong]:[font-weight:550] [&_strong]:[line-height:1.2] [&_strong]:[margin-top:11px] [&_strong]:[letter-spacing:-0.7px] [@media(max-width:1150px)]:[padding:15px] [@media(max-width:800px)]:[&:nth-child(2)]:[border-right:0] [@media(max-width:800px)]:[&:nth-child(-n_+_2)]:[border-bottom:1px_solid_var(--border)]"
              key={metric.title}
            >
              <div className="flex items-center justify-between">
                <span>{metric.title}</span>
                <metric.icon size={18} />
              </div>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </Card>
      <div className="dashboard-grid grid [grid-template-columns:minmax(0,_1.2fr)_minmax(0,_1fr)] [gap:25px] [@media(max-width:1150px)]:[gap:18px] [@media(max-width:800px)]:[grid-template-columns:1fr]">
        <Card>
          <CardHeader>
            <h2>Pending tasks</h2>
            <span className="muted [color:var(--muted)] text-sm">{next.length} tasks</span>
          </CardHeader>
          {next.length ? (
            next.slice(0, 10).map((topic) => (
              <Button
                tone="row"
                size="auto"
                key={topic.id}
                onClick={() => openTopic(topic.topicId)}
              >
                <span className="flex-1">
                  <strong>{topic.title}</strong>
                  <span className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
                    {w.topics.find((item) => item.id === topic.topicId)?.title} ·{' '}
                    {assignedNames(topic).join(', ') || 'Unassigned'}
                  </span>
                </span>
                {topic.dueDate && (
                  <span
                    className={
                      topic.dueDate < today()
                        ? 'overdue [color:var(--danger-ink)] [font-weight:550] text-sm'
                        : 'muted [color:var(--muted)] text-sm'
                    }
                  >
                    {dayjs(topic.dueDate).format('MMM D')}
                  </span>
                )}
                <IconArrowRight size={16} />
              </Button>
            ))
          ) : (
            <p className="section-empty [padding:30px_22px] [color:var(--muted)] [font-size:13px]">
              Pending tasks will appear here.
            </p>
          )}
        </Card>
        <Card>
          <CardHeader>
            <h2>Needs attention</h2>
            <Badge>{new Set([...overdue, ...blocked, ...dueSoon]).size}</Badge>
          </CardHeader>
          {[...new Set([...overdue, ...blocked, ...dueSoon])].slice(0, 8).map((task) => (
            <Button tone="row" size="auto" key={task.id} onClick={() => openTopic(task.topicId)}>
              <span className="flex-1">
                <strong>{task.title}</strong>
                <span className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
                  {w.topics.find((t) => t.id === task.topicId)?.title}
                </span>
              </span>
              <Badge tone={isOverdue(task) ? 'danger' : 'warning'}>
                {isOverdue(task) ? 'Overdue' : task.status === 'blocked' ? 'Blocked' : 'Due soon'}
              </Badge>
            </Button>
          ))}
          {!overdue.length && !blocked.length && !dueSoon.length && (
            <p className="section-empty [padding:30px_22px] [color:var(--muted)] [font-size:13px]">
              No blocked or overdue tasks. Upcoming deadlines will appear here.
            </p>
          )}
        </Card>
      </div>
      <Card className="mt-7">
        <CardHeader>
          <h2>Recently updated topics</h2>
          <span className="muted [color:var(--muted)] text-sm">{topics.length} active topics</span>
        </CardHeader>
        <TopicTable
          topics={[...topics]
            .sort((a, b) => compareTimestamps(b.updatedAt, a.updatedAt))
            .slice(0, 7)}
          open={openTopic}
        />
      </Card>
      <div className="dashboard-grid grid [grid-template-columns:minmax(0,_1.2fr)_minmax(0,_1fr)] [gap:25px] [@media(max-width:1150px)]:[gap:18px] [@media(max-width:800px)]:[grid-template-columns:1fr] mt-7">
        <Card>
          <CardHeader>
            <h2>Recent activity</h2>
          </CardHeader>
          {recent.length ? (
            recent.map((activity) => (
              <Button
                tone="row"
                size="auto"
                key={activity.id}

                onClick={() => {
                  const id =
                    activity.topicIds[0] ??
                    w.tasks.find((t) => activity.taskIds.includes(t.id))?.topicId;
                  if (id) openTopic(id);
                }}
              >
                <span>
                  <span className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
                    {formatTimestamp(activity.eventAt)} · {human(activity.kind)}
                  </span>
                  <span className="line-clamp-2">{activity.text}</span>
                </span>
              </Button>
            ))
          ) : (
            <p className="section-empty [padding:30px_22px] [color:var(--muted)] [font-size:13px]">
              Recorded events across your topics will appear here.
            </p>
          )}
        </Card>
        <Card>
          <CardHeader>
            <h2>Waiting for an update</h2>
            <Badge>{stale.length}</Badge>
          </CardHeader>
          {stale.length ? (
            stale.slice(0, 8).map((topic) => (
              <Button
                tone="row"
                size="auto"
                key={topic.id}
                onClick={() => openTopic(topic.id)}
              >
                <strong>{topic.title}</strong>
                <span className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere] ml-auto">
                  Over 14 days
                </span>
              </Button>
            ))
          ) : (
            <p className="section-empty [padding:30px_22px] [color:var(--muted)] [font-size:13px]">
              No open topics have gone more than 14 days without an update.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
