'use client';
import { searchWorkspace } from '../../application/queries';
import { formatDate } from '../../domain/dates';
import { Empty } from '../ui';
import { useWorklog } from '../worklog';
import { Section } from './section';
export default function Route() {
  const { w, setEditor, setSourceId, effective, openTopic } = useWorklog();
  const search = searchWorkspace(w, effective);
  return (
    <Section>
      {search.length ? (
        <div className="search-results grid [grid-template-columns:1fr_1fr] [gap:15px] [@media(max-width:800px)]:[grid-template-columns:1fr]">
          {search.map((result) => (
            <button
              className="search-result text-left [padding:20px] [background:var(--surface)] [border:1px_solid_var(--border)] [border-radius:5px] [&:hover]:[border-color:var(--border-strong)] [&_strong]:block [&_strong]:[margin:5px_0] [&_strong]:[font-weight:550] [&_p]:[font-size:12px] [&_p]:[overflow-wrap:anywhere] [&_.eyebrow]:[font-size:9px]"
              key={`${result.type}-${result.id}`}
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
          ))}
        </div>
      ) : (
        <Empty title="No results">Try another phrase, identifier or combination of filters.</Empty>
      )}
    </Section>
  );
}
