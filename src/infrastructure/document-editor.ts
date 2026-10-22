export const documentEditorOrigin = 'https://edit.chaxus.com';
export const maxDocumentSize = 100 * 1024 * 1024;

export function documentFormat(name: string) {
  const extension = name.split('.').pop()?.toLowerCase();
  return ['docx', 'xlsx', 'pptx', 'csv'].find((format) => format === extension);
}

export function documentEditorUrl() {
  const url = new URL('/editor', documentEditorOrigin);
  url.searchParams.set('embed', '1');
  url.searchParams.set('embedOrigin', window.location.origin);
  url.searchParams.set('locale', 'en');
  return url.toString();
}

export async function documentHash(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
