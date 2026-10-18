'use client';
import { searchWorkspace } from '../../application/queries';
import { SourceList } from '../work-lists';
import { useWorklog } from '../worklog';
import { Section } from './section';
export default function Route() {
  const { w, setSourceId, effective, askDelete } = useWorklog();
  const sourceResults = searchWorkspace(w, { ...effective, type: 'source' });
  const sources = w.sources.filter((s) => sourceResults.some((result) => result.id === s.id));
  return (
    <Section>
      {
        <SourceList
          sources={sources}
          onOpen={setSourceId}
          onDelete={(id) => askDelete({ kind: 'source', id })}
        />
      }
    </Section>
  );
}
