import { z, ZodError } from 'zod';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { workspaceSchema } from '../domain/validation';
import type { Attachment, StorageInfo, Workspace } from '../domain/model';
export const desktopAvailable = () => isTauri();
export type SaveOptions = { purgeWorkspaceFiles?: boolean; purgeBackups?: boolean };
const resultSchema = z.object({
  workspace: workspaceSchema,
  cleanupWarning: z.string().nullable(),
});
export type WorkspaceResult = z.infer<typeof resultSchema>;
export const repository = {
  async load(): Promise<WorkspaceResult> {
    return resultSchema.parse(await invoke('load_workspace'));
  },
  async save(
    next: Workspace,
    expectedRevision: number,
    options: SaveOptions = {},
  ): Promise<WorkspaceResult> {
    workspaceSchema.parse(next);
    return resultSchema.parse(
      await invoke('save_workspace', {
        workspace: { ...next, revision: expectedRevision },
        ...options,
      }),
    );
  },
  async restore(token: string): Promise<Workspace> {
    return workspaceSchema.parse(await invoke('restore_import', { token }));
  },
};
export const native = {
  cleanup: () => invoke<string | null>('cleanup_deleted_files'),
  storage: () => invoke<StorageInfo>('storage_info'),
  attach: () => invoke<Attachment | null>('attach_file'),
  openFile: (id: string) => invoke<void>('open_attachment', { id }),
  openReference: (url: string) => invoke<void>('open_reference', { url }),
  backup: () => invoke<string>('create_backup'),
  export: () => invoke<string | null>('export_workspace'),
  inspect: () => invoke<{ token: string; summary: string } | null>('inspect_import'),
};
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error instanceof ZodError)
      return error.issues
        .slice(0, 3)
        .map((issue) => issue.message)
        .join(' ');
    return error.message;
  }
  return typeof error === 'string'
    ? error
    : 'The operation could not be completed. Please try again.';
}
