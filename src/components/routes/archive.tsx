'use client';
import { filterTopics } from '../../application/queries';
import { Select } from '../ui';
import { TopicTable } from '../work-lists';
import { useWorklog } from '../worklog';
import { Section } from './section';
export default function Route() {
  const { w, page, sort, setSort, effective, openTopic } = useWorklog();
  const topics = filterTopics(w, effective, sort, page === 'archive');
  return (
    <Section>
      {
        <>
          <div className="toolbar flex items-center [gap:10px] [margin:19px_0] [&_.select-trigger]:[font-size:12px] [&_.select-trigger]:[padding:6px_9px] [&_.select-trigger]:[max-width:240px] [@media(max-width:800px)]:flex-wrap">
            <span className="muted [color:var(--muted)] text-sm">{topics.length} topics</span>
            <label className="ml-auto text-sm" htmlFor="topic-sort">
              Sort by
            </label>
            <Select
              id="topic-sort"
              value={sort}
              onValueChange={(e) => setSort(e as typeof sort)}
              options={[
                { value: 'updated', label: 'Last updated' },
                { value: 'due', label: 'Target date' },
                { value: 'priority', label: 'Priority' },
                { value: 'name', label: 'Name' },
              ]}
            />
          </div>
          <TopicTable topics={topics} open={openTopic} />
        </>
      }
    </Section>
  );
}
