'use client';
import { searchWorkspace } from '../../application/queries';
import { SourceList } from '../../components/work-lists';
import { useWorklog } from '../../providers/worklog';
import { WorkspaceSection } from '../../components/workspace-section';
export default function Page() {
  const { w, setSourceId, effective, askDelete } = useWorklog();
  const sourceResults = searchWorkspace(w, { ...effective, type: 'source' });
  const sources = w.sources.filter((s) => sourceResults.some((result) => result.id === s.id));
  return (
    <WorkspaceSection>
      {
        <SourceList
          sources={sources}
          onOpen={setSourceId}
          onDelete={(id) => askDelete({ kind: 'source', id })}
        />
      }
    </WorkspaceSection>
  );
}
