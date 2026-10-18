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
          <div className="toolbar">
            <span className="muted text-sm">{topics.length} topics</span>
            <label className="ml-auto text-sm" htmlFor="topic-sort">
              Sort by
            </label>
            <Select
              id="topic-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="updated">Last updated</option>
              <option value="due">Target date</option>
              <option value="priority">Priority</option>
              <option value="name">Name</option>
            </Select>
          </div>
          <TopicTable topics={topics} open={openTopic} />
        </>
      }
    </Section>
  );
}
