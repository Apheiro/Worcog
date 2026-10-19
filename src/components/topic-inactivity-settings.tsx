'use client';
import { useState, type FormEvent } from 'react';
import {
  topicInactivitySchema,
  type TopicInactivitySettings,
} from '../application/topic-inactivity';
import { notifications } from '../infrastructure/notifications';
import { Button, Card, CardContent, CardHeader, Field, Input } from './core';

export function TopicInactivitySettingsForm({
  settings,
  onSave,
}: {
  settings: TopicInactivitySettings;
  onSave: (settings: TopicInactivitySettings) => void;
}) {
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = topicInactivitySchema.safeParse({
      days: Number(data.get('days')),
      initialColor: data.get('initialColor'),
      extremeColor: data.get('extremeColor'),
    });
    if (!result.success) {
      setError('Enter a positive whole number of days and valid colors.');
      return;
    }
    onSave(result.data);
    setError('');
    notifications.success('Topic inactivity settings saved.');
  }
  return (
    <Card className="mb-6">
      <CardHeader>
        <h2>Topic inactivity</h2>
      </CardHeader>
      <CardContent>
        <p className="text-sm [color:var(--muted)] mb-4">
          Indicators transition from the initial color to the final color as a topic approaches
          the inactivity period. They are recalculated when you open the app. Settings are saved on
          this device.
        </p>
        <form onSubmit={submit}>
          <div className="flex flex-wrap items-start gap-4">
            <Field label="Inactivity period (days)">
              <Input
                name="days"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={settings.days}
              />
            </Field>
            <Field label="Initial color">
              <div>
                <Input
                  name="initialColor"
                  type="color"
                  aria-label="Initial inactivity color"
                  defaultValue={settings.initialColor}
                  className="w-9 h-9 cursor-pointer [&[type=color]]:[padding:3px]"
                />
              </div>
            </Field>
            <Field label="Final color">
              <div>
                <Input
                  name="extremeColor"
                  type="color"
                  aria-label="Final inactivity color"
                  defaultValue={settings.extremeColor}
                  className="w-9 h-9 cursor-pointer [&[type=color]]:[padding:3px]"
                />
              </div>
            </Field>
          </div>
          {error && (
            <p role="alert" className="text-xs [color:var(--danger-ink)] mb-3">
              {error}
            </p>
          )}
          <Button type="submit" size="sm" tone="primary">
            Save inactivity settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
