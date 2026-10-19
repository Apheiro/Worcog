'use client';
import { FileList } from '../../components/work-lists';
import { useWorklog } from '../../providers/worklog';
import { WorkspaceSection } from '../../components/workspace-section';
export default function Page() {
  const { w, setFileId, openFile, askDelete } = useWorklog();
  return (
    <WorkspaceSection>
      {
        <FileList
          files={w.attachments}
          open={openFile}
          manage={setFileId}
          onDelete={(id) => askDelete({ kind: 'attachment', id })}
        />
      }
    </WorkspaceSection>
  );
}
