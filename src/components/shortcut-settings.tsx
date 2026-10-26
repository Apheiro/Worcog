'use client';
import { useTranslations } from 'next-intl';
import { useLabels } from '../i18n/use-labels';
import { useState, type KeyboardEvent } from 'react';
import { IconKeyboard, IconPencil } from '@tabler/icons-react';
import {
  defaultShortcuts,
  shortcutActions,
  shortcutLabel,
  shortcutProfileSchema,
  type ShortcutAction,
  type ShortcutPlatform,
} from '../domain/shortcuts';
import { useWorcog } from '../providers/worcog';
import { Button, Card, CardContent, CardHeader, Input, Select } from './core';

export function ShortcutSettings() {
  const tr = useTranslations('ui');
  const localize = useLabels();
  const { shortcuts } = useWorcog();
  const [selected, setSelected] = useState<ShortcutPlatform | null>(null);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState<ShortcutAction | null>(null);
  const [preview, setPreview] = useState('');
  const [feedback, setFeedback] = useState('');
  const platform = selected ?? shortcuts.platform;
  const profile = shortcuts.profiles[platform];
  function beginRecording(action: ShortcutAction) {
    setRecording(action);
    setPreview('');
    setError('');
    setFeedback('');
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
      setPreview(
        [
          ...(event.ctrlKey ? ['Ctrl'] : []),
          ...(event.altKey ? ['Alt'] : []),
          ...(event.metaKey ? ['Meta'] : []),
          ...(event.shiftKey ? ['Shift'] : []),
        ].join('+') + '+',
      );
      return;
    }
    if (event.key === 'Escape') {
      setError('');
      setFeedback(tr('shortcut_unchanged'));
      setRecording(null);
      return;
    }
    let binding = '';
    if (event.key !== 'Backspace' && event.key !== 'Delete') {
      const key = event.code.replace(/^Key|^Digit/, '');
      binding = [
        ...(event.ctrlKey ? ['Ctrl'] : []),
        ...(event.altKey ? ['Alt'] : []),
        ...(event.metaKey ? ['Meta'] : []),
        ...(event.shiftKey ? ['Shift'] : []),
        key,
      ].join('+');
    }
    const result = shortcutProfileSchema.safeParse({ ...profile, [action]: binding });
    if (!result.success) {
      setError(
        tr(
          'use_a_modifier_with_a_letter_number_or_navigation_key_or_a_function_key_each_action_needs_a_differen',
        ),
      );
      return;
    }
    shortcuts.save(platform, result.data);
    setError('');
    setFeedback(
      binding
        ? tr('saved_shortcut', { shortcut: shortcutLabel(binding, platform) })
        : tr('shortcut_disabled'),
    );
    setRecording(null);
  }
  return (
    <Card>
      <CardHeader className="flex-wrap gap-3">
        <h2> {tr('keyboard_shortcuts')} </h2>
        <Select
          aria-label={tr('shortcut_profile')}
          value={platform}
          onValueChange={(value) => {
            setSelected(value as ShortcutPlatform);
            setRecording(null);
            setError('');
            setFeedback('');
          }}
          options={[
            { value: 'windows', label: tr('windows') },
            { value: 'macos', label: tr('macos') },
          ]}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs [color:var(--muted)]">
          {' '}
          {tr(
            'click_a_shortcut_and_press_the_new_combination_it_saves_automatically_escape_cancels_profiles_are_sa',
          )}{' '}
        </p>
        {shortcutActions.map(({ id, label, scope }) => (
          <div key={id} className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor={`shortcut-${id}`} className="flex min-w-0 flex-col gap-1 text-sm">
              {localize(label)}
              <span className="text-xs [color:var(--muted)]">{localize(scope)}</span>
            </label>
            <div className="flex w-full flex-col gap-1.5 sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1 sm:w-60">
                  {recording === id ? (
                    <IconKeyboard
                      size={15}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 [color:var(--ink)]"
                    />
                  ) : (
                    <IconPencil
                      size={14}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 [color:var(--muted)]"
                    />
                  )}
                  <Input
                    id={`shortcut-${id}`}
                    data-shortcut-recorder
                    readOnly
                    value={
                      recording === id
                        ? shortcutLabel(preview, platform)
                        : shortcutLabel(profile[id], platform)
                    }
                    placeholder={recording === id ? tr('press_a_combination') : tr('disabled')}
                    title={tr('click_to_change_shortcut')}
                    aria-describedby={`shortcut-hint-${id}`}
                    aria-invalid={recording === id && !!error}
                    onFocus={() => beginRecording(id)}
                    onClick={() => {
                      if (recording !== id) beginRecording(id);
                    }}
                    onBlur={() => setRecording(null)}
                    onKeyDown={(event) => capture(event, id)}
                    onKeyUp={(event) => {
                      if (recording !== id) return;
                      const modifiers = [
                        ...(event.ctrlKey ? ['Ctrl'] : []),
                        ...(event.altKey ? ['Alt'] : []),
                        ...(event.metaKey ? ['Meta'] : []),
                        ...(event.shiftKey ? ['Shift'] : []),
                      ];
                      setPreview(modifiers.length ? modifiers.join('+') + '+' : '');
                    }}
                    className={`w-full cursor-pointer [&.control]:pl-9 text-xs font-mono [&.control:hover]:[border-color:var(--border-strong)] ${recording === id ? '[&.control]:[border-color:var(--ink)] [&.control]:[background:var(--selected)]' : ''}`}
                  />
                </div>
              </div>
              <p id={`shortcut-hint-${id}`} className="text-xs [color:var(--muted)]">
                {recording === id
                  ? tr('listening_escape_cancels_delete_disables')
                  : tr('click_to_change')}
              </p>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label id="export-modifier-label" className="flex flex-col gap-1 text-sm">
            {' '}
            {tr('select_attachments_for_export')}{' '}
            <span className="text-xs [color:var(--muted)]">
              {' '}
              {tr('modifier_click_or_modifier_enter_space_on_a_file_chip')}{' '}
            </span>
          </label>
          <Select
            aria-labelledby="export-modifier-label"
            value={profile.selectFileModifier}
            onValueChange={(value) =>
              shortcuts.save(platform, {
                ...profile,
                selectFileModifier: value as typeof profile.selectFileModifier,
              })
            }
            options={['Ctrl', 'Meta', 'Alt', 'Shift'].map((value) => ({
              value,
              label: shortcutLabel(value, platform),
            }))}
          />
        </div>
        {error && (
          <p role="alert" className="text-xs [color:var(--danger-ink)]">
            {error}
          </p>
        )}
        {feedback && (
          <p role="status" className="text-xs [color:var(--secondary)]">
            {feedback}
          </p>
        )}
        <div>
          <Button
            size="sm"
            onClick={() => {
              shortcuts.save(platform, defaultShortcuts[platform]);
              setRecording(null);
              setError('');
              setFeedback(tr('default_shortcuts_restored'));
            }}
          >
            {' '}
            {tr('restore')} {platform === 'macos' ? tr('macos') : tr('windows')}{' '}
            {tr('defaults')}{' '}
          </Button>
        </div>
        <p className="text-xs [color:var(--muted)]">
          {' '}
          {tr(
            'system_shortcuts_may_take_precedence_tab_escape_enter_drag_controls_and_menu_navigation_keep_their_s',
          )}{' '}
        </p>
      </CardContent>
    </Card>
  );
}
