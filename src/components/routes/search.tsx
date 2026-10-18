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
        <div className="search-results">
          {search.map((result) => (
            <button
              className="search-result"
              key={`${result.type}-${result.id}`}
              onClick={() => {
                if (result.type === 'topic') openTopic(result.id);
                else if (result.type === 'source') setSourceId(result.id);
                else setEditor({ kind: result.type, id: result.id });
              }}
            >
              <span className="eyebrow">
                {result.type} · {formatDate(result.date)}
              </span>
              <strong>{result.title}</strong>
              <p className="line-clamp-2 muted">{result.text}</p>
              <span className="row-subtitle">
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
