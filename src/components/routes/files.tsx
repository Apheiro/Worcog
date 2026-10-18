'use client';
import { FileList } from '../work-lists';
import { useWorklog } from '../worklog';
import { Section } from './section';
export default function Route() {
  const { w, setFileId, openFile, askDelete } = useWorklog();
  return (
    <Section>
      {
        <FileList
          files={w.attachments}
          open={openFile}
          manage={setFileId}
          onDelete={(id) => askDelete({ kind: 'attachment', id })}
        />
      }
    </Section>
  );
}
