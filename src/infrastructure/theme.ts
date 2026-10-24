export const themeStorageKey = 'worcog.theme.v1';
const themeChanged = 'worcog:theme-changed';
export const themeOptions = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof themeOptions)[number];
const preference = (value: string | null | undefined): ThemePreference =>
  themeOptions.find((option) => option === value) ?? 'system';

function applyTheme(value: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = value;
  root.dataset.theme =
    value === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : value;
}
export function getThemePreference(): ThemePreference {
  return preference(document.documentElement.dataset.themePreference);
}
export const getServerThemePreference = (): ThemePreference => 'system';
export function setThemePreference(value: ThemePreference) {
  // The selection still works for this session if preference storage is unavailable.
  try {
    window.localStorage.setItem(themeStorageKey, value);
  } catch {}
  applyTheme(value);
  window.dispatchEvent(new Event(themeChanged));
}
export function subscribeToTheme(notify: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => applyTheme(getThemePreference());
  const onStorage = (event: StorageEvent) => {
    if (event.key === themeStorageKey || event.key === null) {
      applyTheme(preference(event.newValue));
      notify();
    }
  };
  window.addEventListener(themeChanged, notify);
  window.addEventListener('storage', onStorage);
  media.addEventListener('change', onSystemChange);
  return () => {
    window.removeEventListener(themeChanged, notify);
    window.removeEventListener('storage', onStorage);
    media.removeEventListener('change', onSystemChange);
  };
}

// Runs in the document head before paint. Tauri hashes this bundled inline script
// for the production CSP. Only a validated preference is read from local storage.
export const themeInitializationScript = `(() => {
  let preference = 'system';
  try {
    const saved = localStorage.getItem(${JSON.stringify(themeStorageKey)});
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {}
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
})();`;
