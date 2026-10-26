'use client';
import { useTranslations } from 'next-intl';
import { filterTopics } from '../../application/queries';
import { Select } from '../../components/core';
import { TopicTable } from '../../components/work-lists';
import { useWorcog } from '../../providers/worcog';
import { WorkspaceSection } from '../../components/workspace-section';
import { TopicDetail } from '../../components/topic-detail';
export default function Page() {
  const tr = useTranslations('ui');
  const {
    w,
    page,
    sort,
    setSort,
    effective,
    openTopic,
    selectedTopic,
    wb,
    setEditor,
    setSourceId,
    setTopicId,
    askArchive,
    setFileId,
    openFile,
    askDeleteTask,
    askDelete,
  } = useWorcog();
  const topics = filterTopics(w, effective, sort, page === 'archive');
  if (selectedTopic)
    return (
      <TopicDetail
        topic={selectedTopic}
        wb={wb}
        edit={setEditor}
        openSource={setSourceId}
        back={() => setTopicId('')}
        archive={() => askArchive(selectedTopic.id)}
        manageFile={setFileId}
        openFile={openFile}
        deleteTask={askDeleteTask}
        onDelete={askDelete}
      />
    );
  return (
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
          </div>
          <TopicTable topics={topics} open={openTopic} />
        </>
      }
    </WorkspaceSection>
  );
}
