'use client';
import { Card } from '../../components/core/card';
import { searchWorkspace } from '../../application/queries';
import { formatDate } from '../../domain/dates';
import { Empty } from '../../components/core';
import { useWorklog } from '../../providers/worklog';
import { WorkspaceSection } from '../../components/workspace-section';
export default function Page() {
  const { w, setEditor, setSourceId, effective, openTopic } = useWorklog();
  const search = searchWorkspace(w, effective);
  return (
    <WorkspaceSection>
      {search.length ? (
        <div className="search-results grid [grid-template-columns:1fr_1fr] [gap:15px] [@media(max-width:800px)]:[grid-template-columns:1fr]">
          {search.map((result) => (
            <Card asChild padding="md" interactive key={`${result.type}-${result.id}`}>
              <button
                className="search-result text-left [&_strong]:block [&_strong]:[margin:5px_0] [&_strong]:[font-weight:550] [&_p]:[font-size:12px] [&_p]:[overflow-wrap:anywhere] [&_.eyebrow]:[font-size:9px]"
                onClick={() => {
                  if (result.type === 'topic') openTopic(result.id);
                  else if (result.type === 'source') setSourceId(result.id);
                  else setEditor({ kind: result.type, id: result.id });
                }}
              >
                <span className="eyebrow [font-size:11px] [letter-spacing:1.1px] uppercase [color:var(--muted)] [font-weight:600] [margin-bottom:10px]">
                  {result.type} · {formatDate(result.date)}
                </span>
                <strong>{result.title}</strong>
                <p className="line-clamp-2 muted [color:var(--muted)]">{result.text}</p>
                <span className="row-subtitle block [font-size:11px] [color:var(--muted)] [margin-top:3px] [line-height:1.5] [overflow-wrap:anywhere]">
                  {result.topicIds
                    .map((id) => w.topics.find((t) => t.id === id)?.title)
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <Empty title="No results">Try another phrase, identifier or combination of filters.</Empty>
      )}
    </WorkspaceSection>
  );
}
