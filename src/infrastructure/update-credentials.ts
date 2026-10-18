export const developmentTokenKey = 'worklog.updates.github-token.development.v1';
export function developmentToken(): string | null {
  return window.localStorage.getItem(developmentTokenKey);
}
export function saveDevelopmentToken(token: string | null) {
  if (token !== null && (!token || token.length > 4096 || !/^[\x21-\x7e]+$/.test(token))) {
    throw new Error('Enter a valid GitHub token without spaces.');
  }
  if (token === null) window.localStorage.removeItem(developmentTokenKey);
  else window.localStorage.setItem(developmentTokenKey, token);
}
