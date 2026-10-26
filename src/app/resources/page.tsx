'use client';
import { useTranslations } from 'next-intl';
import { searchWorkspace } from '../../application/queries';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/core';
import { SourceList, FileList } from '../../components/work-lists';
import { useWorcog } from '../../providers/worcog';
import { WorkspaceSection } from '../../components/workspace-section';

export default function Page() {
  const tr = useTranslations('ui');
  const { w, setSourceId, setFileId, openFile, effective, filter, setFilter, askDelete } =
    useWorcog();
  const selected = filter.type === 'file' ? 'file' : 'source';
  const results = searchWorkspace(w, { ...effective, type: selected });
  const ids = new Set(results.map((result) => result.id));
  const sources = w.sources.filter((source) => ids.has(source.id));
  const files = w.attachments.filter((file) => ids.has(file.id));
  return (
    <WorkspaceSection>
      <Tabs
        value={selected}
        onValueChange={(value) => {
          if (value === 'source' || value === 'file') setFilter({ type: value, sourceKind: '' });
        }}
      >
        <TabsList aria-label={tr('resource_sections')}>
          <TabsTrigger value="source"> {tr('sources')} </TabsTrigger>
          <TabsTrigger value="file"> {tr('files')} </TabsTrigger>
        </TabsList>
        <TabsContent value="source">
          <SourceList
            sources={sources}
            onOpen={setSourceId}
            onDelete={(id) => askDelete({ kind: 'source', id })}
          />
        </TabsContent>
        <TabsContent value="file">
          <FileList
            files={files}
            open={openFile}
            manage={setFileId}
            onDelete={(id) => askDelete({ kind: 'attachment', id })}
          />
        </TabsContent>
      </Tabs>
    </WorkspaceSection>
  );
}
