'use client';

import { useEffect, useState } from 'react';
import { useWorcog } from '../providers/worcog';
import { Button, Card, CardContent, CardHeader, Input, Switch } from './core';

export function ReminderSettings() {
  const { reminders, wb } = useWorcog();
  const { status, ready, busy, error } = reminders;
  const disabled = !ready || busy || wb.busy;
  const { preferences } = status;
  const [volumeDraft, setVolumeDraft] = useState(preferences.volume);
  useEffect(() => { setVolumeDraft(preferences.volume); }, [preferences.volume]);
  function volume(value: string) {
    const next = Number(value);
    if (Number.isInteger(next) && next >= 1 && next <= 100 && next !== preferences.volume) void reminders.update({ volume: next });
  }
  return (
    <Card>
      <CardHeader><h2>Tray & reminders</h2></CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-5">
          <div className="flex flex-col gap-1">
            <p id="tray-setting-label" className="text-sm font-medium">Tray icon</p>
            <p id="tray-setting-help" className="text-xs [color:var(--muted)]">Minimize or close the window to keep Worcog running in the tray. Use its menu to exit.</p>
          </div>
          <Switch aria-labelledby="tray-setting-label" aria-describedby="tray-setting-help" checked={preferences.trayEnabled} disabled={disabled} onCheckedChange={(trayEnabled) => void reminders.update({ trayEnabled })} />
        </div>
        <div className="flex items-center justify-between gap-5 pt-5 [border-top:1px_solid_var(--border)]">
          <div className="flex flex-col gap-1">
            <p id="reminders-setting-label" className="text-sm font-medium">Reminder notifications</p>
            <p id="reminders-setting-help" className="text-xs [color:var(--muted)]">Persistent Worcog alerts with repeating sound until dismissed. Enable Tray icon first. Turning it off pauses reminders without deleting them.</p>
          </div>
          <Switch aria-labelledby="reminders-setting-label" aria-describedby="reminders-setting-help" checked={preferences.notificationsEnabled} disabled={disabled || !preferences.trayEnabled} onCheckedChange={(notificationsEnabled) => void reminders.update({ notificationsEnabled })} />
        </div>
        <div className="flex flex-col gap-3 pt-5 [border-top:1px_solid_var(--border)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Reminder sound</p>
              <p className="mt-1 truncate text-xs [color:var(--muted)]" title={preferences.sound?.name}>{preferences.sound?.name ?? 'Default · soft repeating tone'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={disabled} onClick={() => void reminders.chooseSound()}>Choose audio…</Button>
              {preferences.sound && <Button size="sm" disabled={disabled} onClick={() => void reminders.resetSound()}>Use default</Button>}
              <Button size="sm" disabled={disabled || status.pending.length > 0} onClick={() => void reminders.preview()}>{status.previewing ? 'Stop preview' : 'Preview'}</Button>
            </div>
          </div>
          <p className="text-xs [color:var(--muted)]">WAV, MP3, OGG or FLAC · up to 10 MiB / 60 seconds. Worcog keeps a local copy. Preview stops after five seconds; actual reminders repeat until dismissed.</p>
          <label className="flex flex-wrap items-center gap-3 text-xs [color:var(--secondary)]">
            Volume
            <Input type="range" min={1} max={100} step={1} value={volumeDraft} onChange={(event) => setVolumeDraft(Number(event.target.value))} disabled={disabled}
              aria-label="Reminder volume" aria-valuetext={`${volumeDraft}%`}
              onPointerUp={(event) => volume(event.currentTarget.value)} onKeyUp={(event) => volume(event.currentTarget.value)} onBlur={(event) => volume(event.currentTarget.value)}
              className="min-w-24 max-w-64 flex-1 cursor-pointer [&.control]:p-0 [&.control]:border-0 [&.control]:bg-transparent [accent-color:var(--primary)]" />
            <span className="w-9 text-right tabular-nums">{volumeDraft}%</span>
          </label>
        </div>
        {(error || status.error || status.soundError) && <p role="alert" className="text-xs [color:var(--warning-ink)]">{error || status.error || status.soundError}</p>}
        {status.pending.length > 0 && (
          <div className="flex flex-col gap-2 pt-4 [border-top:1px_solid_var(--border)]">
            <p className="text-xs font-medium">Pending reminders ({status.pending.length})</p>
            {status.pending.map((alert) => <div key={`${alert.id}:${alert.at}`} className="flex items-center gap-3">
              <Button tone="link" size="auto" className="min-w-0 flex-1 text-xs" disabled={disabled} onClick={() => void reminders.openTask(alert.id)}>{alert.title}</Button>
              <Button size="sm" disabled={disabled} onClick={() => void reminders.dismiss(alert.id, alert.at)}>Dismiss</Button>
            </div>)}
          </div>
        )}
        {!ready && <Button size="sm" className="self-start" onClick={() => void reminders.refresh()}>Reload reminder settings</Button>}
      </CardContent>
    </Card>
  );
}
