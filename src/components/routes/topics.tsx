'use client';
import { filterTopics } from '../../application/queries';
import { TopicDetail } from '../topic-detail';
import { Select } from '../ui';
import { TopicTable } from '../work-lists';
import { useWorklog } from '../worklog';
import { Section } from './section';
export default function Route() {
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
    attach,
    askArchive,
    askDeleteTask,
    askDelete,
    askUnlink,
  } = useWorklog();
  const topics = filterTopics(w, effective, sort, page === 'archive');
  return selectedTopic ? (
    <TopicDetail
      topic={selectedTopic}
      wb={wb}
      edit={setEditor}
      openSource={setSourceId}
      openTopic={openTopic}
      back={() => setTopicId('')}
      archive={askArchive}
      attach={() => {
        void attach();
      }}
      manageFile={setFileId}
      openFile={openFile}
      unlinkFile={askUnlink}
      deleteTask={askDeleteTask}
      onDelete={askDelete}
    />
  ) : (
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
