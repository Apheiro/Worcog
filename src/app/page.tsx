'use client';
import { useLabels } from '../i18n/use-labels';
import { useDates } from '../i18n/use-dates';
import { useTranslations } from 'next-intl';
import { TopicInactivityIndicator } from '../components/topic-inactivity-indicator';
import { topicInactivity } from '../application/topic-inactivity';
import { Card, CardHeader } from '../components/core/card';
import { IconArrowRight, IconClock, IconFlag, IconLock, IconProgress } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { compareTimestamps, isOpen, isOverdue, today } from '../domain/dates';
import { Badge, Button, Empty } from '../components/core';
import { human } from '../domain/options';
import { TopicTable } from '../components/work-lists';
import { useWorcog } from '../providers/worcog';

export default function Page() {
  const localize = useLabels();
  const { formatTimestamp } = useDates();
  const tr = useTranslations('ui');
  const {
    w,
    openTopic,
    setEditor,
    enabled,
    inactivitySettings,
    navigate,
    setFilters,
    setTaskView,
  } = useWorcog();
  function showTasks(view: 'open' | 'overdue' | 'blocked') {
    setFilters((current) => ({ ...current, tasks: {} }));
    setTaskView(view);
    navigate('tasks');
  }
  const newTopic = () => setEditor({ kind: 'topic' });
  const topics = w.topics.filter((t) => !t.archived);
  const tasks = w.tasks.filter(
    (t) => isOpen(t.status) && topics.some((topic) => topic.id === t.topicId),
  );
  const overdue = tasks.filter((t) => isOverdue(t));
  const blocked = tasks.filter((t) => t.status === 'blocked');
  const active = topics.filter((t) => t.status === 'in_progress');
  const stale = topics.filter(
    (t) => isOpen(t.status) && topicInactivity(t.updatedAt, inactivitySettings).stale,
  );
  const dueSoon = tasks.filter(
    (t) =>
      t.dueDate && t.dueDate >= today() && t.dueDate <= dayjs().add(7, 'day').format('YYYY-MM-DD'),
  );
  const recent = [...w.activities]
    .sort((a, b) => compareTimestamps(b.eventAt, a.eventAt))
    .slice(0, 8);
  return (
    <>
      <div className="page-heading flex items-start justify-between [gap:24px] [margin-bottom:29px] [&_h1_+_p]:[margin-top:9px] [&_h1_+_p]:[font-size:13px] [&_>_.button]:[margin-top:22px] [@media(max-width:1150px)]:[&_h1]:[font-size:27px] [@media(max-width:800px)]:flex-wrap [@media(max-width:800px)]:[gap:15px] [@media(max-width:800px)]:[&_>_.button]:[margin-top:0] [@media(max-width:800px)]:[&_h1]:[font-size:26px]">
        <div>
          <p className="eyebrow [font-size:11px] [letter-spacing:1.1px] uppercase [color:var(--muted)] [font-weight:600] [margin-bottom:10px]">
            {tr('your_operational_workspace')}{' '}
          </p>
          <h1> {tr('overview')} </h1>
          <p className="muted [color:var(--muted)]">
            {tr('what_needs_your_attention_and_where_things_stand')}{' '}
          </p>
        </div>
        <Button tone="primary" disabled={!enabled} onClick={newTopic}>
          {tr('new_topic')} <IconArrowRight size={16} />
        </Button>
      </div>
      {!topics.length && !w.topics.length && (
        <Empty
          title={tr('give_your_work_a_place_to_live')}
          action={
            <Button tone="primary" disabled={!enabled} onClick={newTopic}>
              {tr('create_your_first_topic')}{' '}
            </Button>
          }
        >
          {tr(
            'start_with_a_project_incident_or_request_add_its_references_decisions_and_next_steps_as_the_story_de',
          )}{' '}
        </Empty>
      )}
      <Card asChild tone="soft">
        <div className="metrics grid [grid-template-columns:repeat(4,_minmax(0,_1fr))] [margin:25px_0_28px] [@media(max-width:800px)]:[grid-template-columns:1fr_1fr]">
          {[
            {
              title: tr('open_tasks'),
              value: tasks.length,
              icon: IconClock,
              onClick: () => showTasks('open'),
            },
            {
              title: tr('overdue_2'),
              value: overdue.length,
              icon: IconFlag,
              onClick: () => showTasks('overdue'),
            },
            {
              title: tr('blocked_tasks'),
              value: blocked.length,
              icon: IconLock,
              onClick: () => showTasks('blocked'),
            },
            {
              title: tr('topics_in_progress'),
              value: active.length,
              icon: IconProgress,
              onClick: () => {
                setFilters((current) => ({ ...current, topics: { status: 'in_progress' } }));
                navigate('topics');
              },
            },
          ].map((metric) => (
            <Button
              type="button"
              tone="ghost"
              size="auto"
              onClick={metric.onClick}
              aria-label={tr('value0_value1_view_results', {
                value0: metric.title,
                value1: metric.value,
              })}
              className="metric [&.button]:block [&.button]:rounded-none [&.button]:text-left [padding:19px_23px] [border-right:1px_solid_var(--border)] [font-size:12px] [color:var(--muted)] [&:last-child]:[border:none] [&_svg]:[color:var(--muted)] [&_strong]:block [&_strong]:[color:var(--ink)] [&_strong]:[font-size:30px] [&_strong]:[font-weight:550] [&_strong]:[line-height:1.2] [&_strong]:[margin-top:11px] [&_strong]:[letter-spacing:-0.7px] [@media(max-width:1150px)]:[padding:15px] [@media(max-width:800px)]:[&:nth-child(2)]:[border-right:0] [@media(max-width:800px)]:[&:nth-child(-n_+_2)]:[border-bottom:1px_solid_var(--border)]"
              key={metric.title}
            >
              <div className="flex items-center justify-between">
                <span>{metric.title}</span>
                <metric.icon size={18} />
              </div>
              <strong>{metric.value}</strong>
            </Button>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader>
          <h2> {tr('needs_attention')} </h2>
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
              {isOverdue(task)
                ? tr('overdue_2')
                : task.status === 'blocked'
                  ? tr('blocked')
                  : tr('due_soon')}
            </Badge>
          </Button>
        ))}
        {!overdue.length && !blocked.length && !dueSoon.length && (
          <p className="section-empty [padding:30px_22px] [color:var(--muted)] [font-size:13px]">
            {tr('no_blocked_or_overdue_tasks_upcoming_deadlines_will_appear_here')}{' '}
          </p>
        )}
      </Card>
      <Card className="mt-7">
        <CardHeader>
          <h2> {tr('recently_updated_topics')} </h2>
          <span className="muted [color:var(--muted)] text-sm">
            {topics.length} {tr('active_topics')}{' '}
          </span>
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
            <h2> {tr('recent_activity')} </h2>
          </CardHeader>
          {recent.length ? (
            recent.map((activity) => (
              <Button
                tone="row"
                size="auto"
                key={activity.id}
                className="[&.action-row]:justify-start [&.action-row]:text-left"
                onClick={() => {
                  const id =
                    activity.topicIds[0] ??
                    w.tasks.find((t) => activity.taskIds.includes(t.id))?.topicId;
                  if (id) openTopic(id);
                }}
              >
                <span className="min-w-0 w-full text-left">
                  <span className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
                    {formatTimestamp(activity.eventAt)} · {localize(human(activity.kind))}
                  </span>
                  <span className="line-clamp-2">{activity.text}</span>
                </span>
              </Button>
            ))
          ) : (
            <p className="section-empty [padding:30px_22px] [color:var(--muted)] [font-size:13px]">
              {tr('recorded_events_across_your_topics_will_appear_here')}{' '}
            </p>
          )}
        </Card>
        <Card>
          <CardHeader>
            <h2> {tr('waiting_for_an_update')} </h2>
            <Badge>{stale.length}</Badge>
          </CardHeader>
          {stale.length ? (
            stale.slice(0, 8).map((topic) => (
              <Button
                tone="row"
                size="auto"
                className="relative overflow-hidden [&.action-row]:[border-radius:inherit]"
                key={topic.id}
                onClick={() => openTopic(topic.id)}
              >
                <TopicInactivityIndicator topic={topic} edge />
                <strong>{topic.title}</strong>
                <span className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere] ml-auto">
                  {inactivitySettings.days} {tr('days_without_activity')}{' '}
                </span>
              </Button>
            ))
          ) : (
            <p className="section-empty [padding:30px_22px] [color:var(--muted)] [font-size:13px]">
              {tr('no_open_topics_have_reached')} {inactivitySettings.days}{' '}
              {tr('days_without_an_update')}{' '}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
