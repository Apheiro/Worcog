'use client';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import * as Popover from '@radix-ui/react-popover';
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
  const tr = useTranslations('ui');
  const [error, setError] = useState('');
  const [excludedWeekdays, setExcludedWeekdays] = useState(settings.excludedWeekdays);
  const [colors, setColors] = useState({
    initialColor: settings.initialColor,
    midpointColor: settings.midpointColor,
    extremeColor: settings.extremeColor,
  });
  const points = [
    { key: 'initialColor', label: tr('initial'), position: '0%', align: 'start' },
    { key: 'midpointColor', label: tr('midpoint'), position: '50%', align: 'center' },
    { key: 'extremeColor', label: tr('final'), position: '100%', align: 'end' },
  ] as const;
  const weekdays = [
    { value: 1, label: tr('monday'), short: tr('short_mon') },
    { value: 2, label: tr('tuesday'), short: tr('short_tue') },
    { value: 3, label: tr('wednesday'), short: tr('short_wed') },
    { value: 4, label: tr('thursday'), short: tr('short_thu') },
    { value: 5, label: tr('friday'), short: tr('short_fri') },
    { value: 6, label: tr('saturday'), short: tr('short_sat') },
    { value: 0, label: tr('sunday'), short: tr('short_sun') },
  ];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = topicInactivitySchema.safeParse({
      days: Number(data.get('days')),
      excludedWeekdays,
      ...colors,
    });
    if (!result.success) {
      setError(tr('enter_a_positive_whole_number_of_days_and_valid_colors'));
      return;
    }
    onSave(result.data);
    setError('');
    notifications.success(tr('topic_inactivity_settings_saved'));
  }
  return (
    <Card>
      <CardHeader>
        <h2> {tr('topic_inactivity')} </h2>
      </CardHeader>
      <CardContent>
        <p className="text-sm [color:var(--muted)] mb-4">
          {tr(
            'indicators_transition_through_three_colors_as_a_topic_approaches_the_inactivity_period_select_a_mark',
          )}{' '}
        </p>
        <form onSubmit={submit}>
          <div className="flex flex-wrap items-start gap-4">
            <Field label={tr('inactivity_period_days')}>
              <Input
                name="days"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={settings.days}
              />
            </Field>
            <div className="min-w-0 flex-1 [flex-basis:260px] mb-4">
              <p className="text-xs [color:var(--secondary)] font-medium mb-3">
                {' '}
                {tr('inactivity_colors')}{' '}
              </p>
              <div className="px-6 pt-6 pb-2">
                <div
                  className="relative h-2 rounded-full [border:1px_solid_var(--border)]"
                  style={{
                    background: `linear-gradient(to right in lab, ${colors.initialColor}, ${colors.midpointColor} 50%, ${colors.extremeColor})`,
                  }}
                >
                  {points.map((point) => (
                    <Popover.Root key={point.key}>
                      <Popover.Trigger asChild>
                        <button
                          type="button"
                          aria-label={tr('value0_inactivity_color_value1', {
                            value0: point.label,
                            value1: colors[point.key],
                          })}
                          className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded [background:transparent] [border:0] cursor-pointer focus-visible:[outline:2px_solid_var(--focus)] focus-visible:[outline-offset:2px]"
                          style={{ left: point.position }}
                        >
                          <span className="absolute bottom-full flex flex-col items-center pointer-events-none">
                            <span className="rounded [border:1px_solid_var(--border)] [background:var(--surface)] [color:var(--secondary)] px-1.5 py-0.5 text-[10px] whitespace-nowrap group-hover:[color:var(--ink)]">
                              {point.label}
                            </span>
                            <span className="h-0 w-0 [border-left:3px_solid_transparent] [border-right:3px_solid_transparent] [border-top:4px_solid_var(--secondary)]" />
                          </span>
                          <span
                            className="h-3 w-3 rounded-full [border:2px_solid_var(--surface)] [box-shadow:0_0_0_1px_var(--secondary)] group-hover:[box-shadow:0_0_0_2px_var(--ink)]"
                            style={{ background: colors[point.key] }}
                          />
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          side="top"
                          align={point.align}
                          sideOffset={8}
                          collisionPadding={12}
                          aria-label={tr('value0_color', { value0: point.label })}
                          className="z-50 rounded-md [border:1px_solid_var(--border)] [background:var(--surface)] [color:var(--ink)] p-3 [box-shadow:0_4px_16px_#0002]"
                        >
                          <label className="flex items-center gap-3 text-xs">
                            <span>{point.label}</span>
                            <Input
                              type="color"
                              value={colors[point.key]}
                              onChange={(event) =>
                                setColors((current) => ({
                                  ...current,
                                  [point.key]: event.target.value,
                                }))
                              }
                              className="h-8 w-8 cursor-pointer [&[type=color]]:[padding:2px]"
                            />
                            <span className="font-mono [color:var(--muted)]">
                              {colors[point.key]}
                            </span>
                          </label>
                          <Popover.Arrow className="[fill:var(--surface)]" />
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  ))}
                </div>
                <div
                  className="mt-3 flex justify-between text-[10px] [color:var(--muted)]"
                  aria-hidden="true"
                >
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
          <fieldset
            className="m-0 mb-4 flex min-w-0 flex-col gap-2 border-0 p-0"
            aria-describedby="inactivity-weekdays-hint"
          >
            <legend className="mb-2 text-xs font-medium [color:var(--secondary)]">
              {' '}
              {tr('pause_inactivity_on')}{' '}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {weekdays.map(({ value, label, short }) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  tone={excludedWeekdays.includes(value) ? 'primary' : 'quiet'}
                  aria-label={label}
                  aria-pressed={excludedWeekdays.includes(value)}
                  title={label}
                  className="min-w-10"
                  onClick={() =>
                    setExcludedWeekdays((current) =>
                      current.includes(value)
                        ? current.filter((day) => day !== value)
                        : [...current, value].sort((a, b) => a - b),
                    )
                  }
                >
                  {short}
                </Button>
              ))}
            </div>
            <p id="inactivity-weekdays-hint" className="text-xs [color:var(--muted)]">
              {' '}
              {tr(
                'selected_weekdays_do_not_count_using_local_time_all_days_count_by_default_deadlines_are_unaffected',
              )}{' '}
            </p>
          </fieldset>
          {error && (
            <p role="alert" className="text-xs [color:var(--danger-ink)] mb-3">
              {error}
            </p>
          )}
          <Button type="submit" size="sm" tone="primary">
            {tr('save_inactivity_settings')}{' '}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
