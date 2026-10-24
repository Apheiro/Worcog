'use client';
import { useState, type KeyboardEvent } from 'react';
import { IconKeyboard, IconPencil } from '@tabler/icons-react';
import { defaultShortcuts, shortcutActions, shortcutLabel, shortcutProfileSchema, type ShortcutAction, type ShortcutPlatform } from '../domain/shortcuts';
import { useWorcog } from '../providers/worcog';
import { Button, Card, CardContent, CardHeader, Input, Select } from './core';

export function ShortcutSettings() {
  const { shortcuts } = useWorcog();
  const [selected, setSelected] = useState<ShortcutPlatform | null>(null);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState<ShortcutAction | null>(null);
  const [preview, setPreview] = useState('');
  const [feedback, setFeedback] = useState('');
  const platform = selected ?? shortcuts.platform;
  const profile = shortcuts.profiles[platform];
  function beginRecording(action: ShortcutAction) {
    setRecording(action); setPreview(''); setError(''); setFeedback('');
  }
  function capture(event: KeyboardEvent<HTMLInputElement>, action: ShortcutAction) {
    if (event.key === 'Tab') return;
    if (recording !== action) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        beginRecording(action);
      }
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat || event.nativeEvent.isComposing) return;
    if (['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) {
      setPreview([...(event.ctrlKey ? ['Ctrl'] : []), ...(event.altKey ? ['Alt'] : []), ...(event.metaKey ? ['Meta'] : []), ...(event.shiftKey ? ['Shift'] : [])].join('+') + '+');
      return;
    }
    if (event.key === 'Escape') {
      setError('');
      setFeedback('Shortcut unchanged.');
      setRecording(null);
      return;
    }
    let binding = '';
    if (event.key !== 'Backspace' && event.key !== 'Delete') {
      const key = event.code.replace(/^Key|^Digit/, '');
      binding = [...(event.ctrlKey ? ['Ctrl'] : []), ...(event.altKey ? ['Alt'] : []), ...(event.metaKey ? ['Meta'] : []), ...(event.shiftKey ? ['Shift'] : []), key].join('+');
    }
    const result = shortcutProfileSchema.safeParse({ ...profile, [action]: binding });
    if (!result.success) { setError('Use a modifier with a letter, number or navigation key, or a function key. Each action needs a different shortcut.'); return; }
    shortcuts.save(platform, result.data);
    setError('');
    setFeedback(binding ? `Saved: ${shortcutLabel(binding, platform)}.` : 'Shortcut disabled.');
    setRecording(null);
  }
  return (
    <Card>
      <CardHeader className="flex-wrap gap-3">
        <h2>Keyboard shortcuts</h2>
        <Select aria-label="Shortcut profile" value={platform} onValueChange={(value) => { setSelected(value as ShortcutPlatform); setRecording(null); setError(''); setFeedback(''); }} options={[{ value: 'windows', label: 'Windows' }, { value: 'macos', label: 'macOS' }]} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs [color:var(--muted)]">Click a shortcut and press the new combination. It saves automatically; Escape cancels. Profiles are saved separately on this device and activate automatically for its OS.</p>
        {shortcutActions.map(({ id, label, scope }) => (
          <div key={id} className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor={`shortcut-${id}`} className="flex min-w-0 flex-col gap-1 text-sm">{label}<span className="text-xs [color:var(--muted)]">{scope}</span></label>
            <div className="flex w-full flex-col gap-1.5 sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1 sm:w-60">
                  {recording === id
                    ? <IconKeyboard size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 [color:var(--ink)]" />
                    : <IconPencil size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 [color:var(--muted)]" />}
                  <Input
                    id={`shortcut-${id}`}
                    data-shortcut-recorder
                    readOnly
                    value={recording === id ? shortcutLabel(preview, platform) : shortcutLabel(profile[id], platform)}
                    placeholder={recording === id ? 'Press a combination…' : 'Disabled'}
                    title="Click to change shortcut"
                    aria-describedby={`shortcut-hint-${id}`}
                    aria-invalid={recording === id && !!error}
                    onFocus={() => beginRecording(id)}
                    onClick={() => { if (recording !== id) beginRecording(id); }}
                    onBlur={() => setRecording(null)}
                    onKeyDown={(event) => capture(event, id)}
                    onKeyUp={(event) => {
                      if (recording !== id) return;
                      const modifiers = [...(event.ctrlKey ? ['Ctrl'] : []), ...(event.altKey ? ['Alt'] : []), ...(event.metaKey ? ['Meta'] : []), ...(event.shiftKey ? ['Shift'] : [])];
                      setPreview(modifiers.length ? modifiers.join('+') + '+' : '');
                    }}
                    className={`w-full cursor-pointer [&.control]:pl-9 text-xs font-mono [&.control:hover]:[border-color:var(--border-strong)] ${recording === id ? '[&.control]:[border-color:var(--ink)] [&.control]:[background:var(--selected)]' : ''}`}
                  />
                </div>
              </div>
              <p id={`shortcut-hint-${id}`} className="text-xs [color:var(--muted)]">{recording === id ? 'Listening… Escape cancels · Delete disables' : 'Click to change'}</p>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label id="export-modifier-label" className="flex flex-col gap-1 text-sm">Select attachments for export<span className="text-xs [color:var(--muted)]">Modifier + click, or modifier + Enter / Space on a file chip</span></label>
          <Select aria-labelledby="export-modifier-label" value={profile.selectFileModifier} onValueChange={(value) => shortcuts.save(platform, { ...profile, selectFileModifier: value as typeof profile.selectFileModifier })} options={['Ctrl', 'Meta', 'Alt', 'Shift'].map((value) => ({ value, label: shortcutLabel(value, platform) }))} />
        </div>
        {error && <p role="alert" className="text-xs [color:var(--danger-ink)]">{error}</p>}
        {feedback && <p role="status" className="text-xs [color:var(--secondary)]">{feedback}</p>}
        <div><Button size="sm" onClick={() => { shortcuts.save(platform, defaultShortcuts[platform]); setRecording(null); setError(''); setFeedback('Default shortcuts restored.'); }}>Restore {platform === 'macos' ? 'macOS' : 'Windows'} defaults</Button></div>
        <p className="text-xs [color:var(--muted)]">System shortcuts may take precedence. Tab, Escape, Enter, drag controls and menu navigation keep their standard accessibility behavior. The Menu key still opens context menus.</p>
      </CardContent>
    </Card>
  );
}
