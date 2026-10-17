'use client';
import dayjs from 'dayjs';
import { IconArrowRight, IconClock, IconFlag, IconLock, IconProgress } from '@tabler/icons-react';
import type { Workspace } from '../domain/model';
import { compareTimestamps, formatTimestamp, isOpen, isOverdue, today } from '../domain/dates';
import { Badge, Button, Empty, human } from './ui';
import { TopicTable } from './work-lists';
export function Dashboard({
  workspace: w,
  openTopic,
  newTopic,
  enabled,
}: {
  workspace: Workspace;
  openTopic: (id: string) => void;
  newTopic: () => void;
  enabled: boolean;
}) {
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
  const next = topics
    .filter((t) => isOpen(t.status) && t.nextAction)
    .sort((a, b) => (a.targetDate ?? '9999').localeCompare(b.targetDate ?? '9999'));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your operational workspace</p>
          <h1>Overview</h1>
          <p className="muted">What needs your attention, and where things stand.</p>
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
      <div className="metrics">
        {[
          { title: 'Open tasks', value: tasks.length, icon: IconClock },
          { title: 'Overdue', value: overdue.length, icon: IconFlag },
          { title: 'Blocked tasks', value: blocked.length, icon: IconLock },
          { title: 'Topics in progress', value: active.length, icon: IconProgress },
        ].map((metric) => (
          <div className="metric" key={metric.title}>
            <div className="flex items-center justify-between">
              <span>{metric.title}</span>
              <metric.icon size={18} />
            </div>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="section">
          <div className="section-heading">
            <h2>Next actions</h2>
            <span className="muted text-sm">{next.length} topics</span>
          </div>
          {next.length ? (
            next.slice(0, 10).map((topic) => (
              <button className="action-row" key={topic.id} onClick={() => openTopic(topic.id)}>
                <span className="flex-1">
                  <strong>{topic.nextAction}</strong>
                  <span className="row-subtitle">
                    {topic.title} · {topic.owner || 'Unassigned'}
                  </span>
                </span>
                {topic.targetDate && (
                  <span
                    className={topic.targetDate < today() ? 'overdue text-sm' : 'muted text-sm'}
                  >
                    {dayjs(topic.targetDate).format('MMM D')}
                  </span>
                )}
                <IconArrowRight size={16} />
              </button>
            ))
          ) : (
            <p className="section-empty">
              Set a next action on a topic to keep your next step visible.
            </p>
          )}
        </section>
        <section className="section">
          <div className="section-heading">
            <h2>Needs attention</h2>
            <Badge>{new Set([...overdue, ...blocked, ...dueSoon]).size}</Badge>
          </div>
          {[...new Set([...overdue, ...blocked, ...dueSoon])].slice(0, 8).map((task) => (
            <button className="action-row" key={task.id} onClick={() => openTopic(task.topicId)}>
              <span className="flex-1">
                <strong>{task.title}</strong>
                <span className="row-subtitle">
                  {w.topics.find((t) => t.id === task.topicId)?.title}
                </span>
              </span>
              <Badge tone={isOverdue(task) ? 'danger' : 'warning'}>
                {isOverdue(task) ? 'Overdue' : task.status === 'blocked' ? 'Blocked' : 'Due soon'}
              </Badge>
            </button>
          ))}
          {!overdue.length && !blocked.length && !dueSoon.length && (
            <p className="section-empty">
              No blocked or overdue tasks. Upcoming deadlines will appear here.
            </p>
          )}
        </section>
      </div>
      <section className="section mt-7">
        <div className="section-heading">
          <h2>Recently updated topics</h2>
          <span className="muted text-sm">{topics.length} active topics</span>
        </div>
        <TopicTable
          topics={[...topics]
            .sort((a, b) => compareTimestamps(b.updatedAt, a.updatedAt))
            .slice(0, 7)}
          open={openTopic}
        />
      </section>
      <div className="dashboard-grid mt-7">
        <section className="section">
          <div className="section-heading">
            <h2>Recent activity</h2>
          </div>
          {recent.length ? (
            recent.map((activity) => (
              <button
                key={activity.id}
                className="action-row"
                onClick={() => {
                  const id =
                    activity.topicIds[0] ??
                    w.tasks.find((t) => activity.taskIds.includes(t.id))?.topicId;
                  if (id) openTopic(id);
                }}
              >
                <span>
                  <span className="row-subtitle">
                    {formatTimestamp(activity.eventAt)} · {human(activity.kind)}
                  </span>
                  <span className="line-clamp-2">{activity.text}</span>
                </span>
              </button>
            ))
          ) : (
            <p className="section-empty">Recorded events across your topics will appear here.</p>
          )}
        </section>
        <section className="section">
          <div className="section-heading">
            <h2>Waiting for an update</h2>
            <Badge>{stale.length}</Badge>
          </div>
          {stale.length ? (
            stale.slice(0, 8).map((topic) => (
              <button className="action-row" key={topic.id} onClick={() => openTopic(topic.id)}>
                <strong>{topic.title}</strong>
                <span className="row-subtitle ml-auto">Over 14 days</span>
              </button>
            ))
          ) : (
            <p className="section-empty">
              No open topics have gone more than 14 days without an update.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
