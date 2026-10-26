'use client';
import { useLabels } from '../../i18n/use-labels';
import { useDates } from '../../i18n/use-dates';
import { useTranslations } from 'next-intl';
import { useLocalStorage } from '@mantine/hooks';
import { filterTopics } from '../../application/queries';
import type { Topic } from '../../domain/model';
import { calendarDate } from '../../domain/dates';
import { human } from '../../domain/options';
import { responsibleDirectory, responsibleKey } from '../../domain/responsibles';
import { TopicDetail } from '../../components/topic-detail';
import { CategoryTag } from '../../components/category-tag';
import { Select } from '../../components/core';
import { TopicTable } from '../../components/work-lists';
import { useWorcog } from '../../providers/worcog';
import { WorkspaceSection } from '../../components/workspace-section';

const groupOptions = [
  { value: 'none', label: 'None' },
  { value: 'category', label: 'Category' },
  { value: 'requester', label: 'Requester' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'created', label: 'Creation date' },
  { value: 'updated', label: 'Last updated' },
  { value: 'deadline', label: 'Deadline' },
] as const;
type TopicGroup = (typeof groupOptions)[number]['value'];

export default function Page() {
  const localize = useLabels();
  const { formatDate } = useDates();
  const tr = useTranslations('ui');
  const [groupBy, setGroupBy] = useLocalStorage<TopicGroup>({
    key: 'worcog.topic-group',
    defaultValue: 'none',
  });
  const {
    wb,
    w,
    page,
    setTopicId,
    setEditor,
    setSourceId,
    setFileId,
    sort,
    setSort,
    effective,
    selectedTopic,
    openTopic,
    openFile,
    askArchive,
    askDeleteTask,
    askDelete,
  } = useWorcog();
  const topics = filterTopics(w, effective, sort, page === 'archive');
  const dateGrouping = ['created', 'updated', 'deadline'].includes(groupBy);
  const groups = new Map<string, Topic[]>();
  const requesterNames = new Map(
    responsibleDirectory(w).map((name) => [responsibleKey(name), name]),
  );
  function groupKey(topic: Topic): string {
    switch (groupBy) {
      case 'category':
        return topic.category;
      case 'requester':
        return responsibleKey(topic.requesterName ?? '');
      case 'priority':
        return topic.priority;
      case 'status':
        return topic.status;
      case 'created':
        return calendarDate(topic.createdAt);
      case 'updated':
        return calendarDate(topic.updatedAt);
      case 'deadline':
        return topic.targetDate ?? '';
      default:
        return '';
    }
  }
  function groupLabel(key: string): string {
    if (!key)
      return groupBy === 'category'
        ? tr('no_category')
        : groupBy === 'requester'
          ? tr('no_requester')
          : tr('no_deadline');
    if (groupBy === 'requester') return requesterNames.get(key) ?? key;
    if (dateGrouping) return formatDate(key);
    return groupBy === 'category' ? key : localize(human(key));
  }
  if (groupBy !== 'none') {
    for (const topic of topics) {
      const key = groupKey(topic);
      const items = groups.get(key) ?? [];
      items.push(topic);
      groups.set(key, items);
    }
  }
  const grouped = [...groups].sort(([a], [b]) => {
    if (!a) return b ? 1 : 0;
    if (!b) return -1;
    if (dateGrouping) return groupBy === 'deadline' ? a.localeCompare(b) : b.localeCompare(a);
    if (groupBy === 'priority')
      return (
        ['urgent', 'high', 'normal', 'low'].indexOf(a) -
        ['urgent', 'high', 'normal', 'low'].indexOf(b)
      );
    if (groupBy === 'status')
      return (
        ['blocked', 'in_progress', 'pending', 'completed', 'canceled'].indexOf(a) -
        ['blocked', 'in_progress', 'pending', 'completed', 'canceled'].indexOf(b)
      );
    return a.localeCompare(b);
  });
  return selectedTopic ? (
    <TopicDetail
      topic={selectedTopic}
      wb={wb}
      edit={setEditor}
      openSource={setSourceId}
      back={() => setTopicId('')}
      archive={askArchive}
      manageFile={setFileId}
      openFile={openFile}
      deleteTask={askDeleteTask}
      onDelete={askDelete}
    />
  ) : (
    <WorkspaceSection>
      {
        <>
          <div className="toolbar flex items-center [gap:10px] [margin:19px_0] [&_.select-trigger]:[font-size:12px] [&_.select-trigger]:[padding:6px_9px] [&_.select-trigger]:[max-width:240px] [@media(max-width:800px)]:flex-wrap">
            <span className="muted [color:var(--muted)] text-sm">
              {topics.length} {tr('topics')}{' '}
            </span>
            <label className="ml-auto text-sm" htmlFor="topic-sort">
              {tr('sort_by')}{' '}
            </label>
            <Select
              id="topic-sort"
              value={sort}
              onValueChange={(e) => setSort(e as typeof sort)}
              options={[
                { value: 'updated', label: tr('last_updated') },
                { value: 'due', label: tr('target_date') },
                { value: 'priority', label: tr('priority') },
                { value: 'name', label: tr('name') },
              ]}
            />
            <label className="text-sm" htmlFor="topic-group">
              {' '}
              {tr('group_by')}{' '}
            </label>
            <Select
              id="topic-group"
              value={groupBy}
              onValueChange={(value) => {
                const selected = groupOptions.find((option) => option.value === value);
                if (selected) setGroupBy(selected.value);
              }}
              options={groupOptions.map((option) => ({ ...option, label: localize(option.label) }))}
            />
          </div>
          {groupBy !== 'none' && topics.length > 0 ? (
            <div className="flex flex-col gap-5">
              {grouped.map(([key, items]) => (
                <section key={key} aria-label={groupLabel(key)}>
                  <h2 className="mb-2 flex items-center gap-2 text-xs font-medium">
                    {groupBy === 'category' && key ? (
                      <CategoryTag category={key} />
                    ) : (
                      groupLabel(key)
                    )}
                    <span className="font-normal [color:var(--muted)]">{items.length}</span>
                  </h2>
                  <TopicTable
                    topics={items}
                    open={openTopic}
                    showCategory={groupBy !== 'category'}
                  />
                </section>
              ))}
            </div>
          ) : (
            <TopicTable topics={topics} open={openTopic} />
          )}
        </>
      }
    </WorkspaceSection>
  );
}
