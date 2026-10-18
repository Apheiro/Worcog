import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { developmentToken, saveDevelopmentToken } from './update-credentials';

const statusSchema = z.object({
  currentVersion: z.string(),
  repository: z.string(),
  tokenSaved: z.boolean(),
  credentialSupported: z.boolean(),
  platformSupported: z.boolean(),
  profile: z.enum(['production', 'development']),
});
const availableSchema = z.object({
  currentVersion: z.string(),
  version: z.string(),
  notes: z.string(),
  filename: z.string(),
  size: z.number().int().positive(),
});
const receiptSchema = z.object({ downloadPath: z.string(), currentExecutable: z.string() });
export type UpdateStatus = z.infer<typeof statusSchema>;
export type AvailableUpdate = z.infer<typeof availableSchema>;
export type UpdateReceipt = z.infer<typeof receiptSchema>;
async function status() {
  const value = statusSchema.parse(await invoke('update_status'));
  return value.profile === 'development' ? { ...value, tokenSaved: !!developmentToken() } : value;
}
async function requestCredentials() {
  const value = await status();
  return value.profile === 'development' ? { developmentToken: developmentToken() } : {};
}
export const updatesApi = {
  status,
  setToken: async (token: string | null) => {
    const value = await status();
    if (value.profile === 'development') {
      saveDevelopmentToken(token);
      return { ...value, tokenSaved: token !== null };
    }
    return statusSchema.parse(await invoke('set_update_token', { token }));
  },
  check: async () =>
    availableSchema.nullable().parse(await invoke('check_updates', await requestCredentials())),
  download: async () =>
    receiptSchema.parse(await invoke('download_update', await requestCredentials())),
  openFolder: () => invoke<void>('open_update_folder'),
};
