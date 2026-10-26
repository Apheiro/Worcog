'use client';
import { useLabels } from '../i18n/use-labels';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Source } from '../domain/model';
import {
  isSourceType,
  messagingContexts,
  sourceParticipantLabel,
  sourceFields,
  sourceType,
  initialSourcePlatform,
  matchesSourcePlatform,
  type SourceFormValues,
  type SourcePlatform,
} from '../domain/sources';
import { human, selectOptions, sourceKinds } from '../domain/options';
import { Confirm, DateInput, Field, Input, MultiSelect, Select, Textarea } from './core';

/** Shared fields for task-owned source creation and source metadata editing. */
export function SourceFields({
  value,
  onChange,
  sources,
  onDeletePlatform,
  disabled,
}: {
  value: SourceFormValues;
  onChange: (patch: Partial<SourceFormValues>) => void;
  sources: Source[];
  onDeletePlatform: (platform: SourcePlatform) => void;
  disabled?: boolean;
}) {
  const localize = useLabels();
  const tr = useTranslations('ui');
  const [createdPlatforms, setCreatedPlatforms] = useState<SourcePlatform[]>([]);
  const [pending, setPending] = useState<SourcePlatform | null>(null);
  const usage = pending
    ? sources.filter((source) => matchesSourcePlatform(source, pending)).length
    : 0;
  function remove(platform: SourcePlatform) {
    onDeletePlatform(platform);
    setCreatedPlatforms((items) =>
      items.filter(
        (item) =>
          item.kind !== platform.kind ||
          item.name.toLocaleLowerCase() !== platform.name.toLocaleLowerCase(),
      ),
    );
    if (
      value.kind === platform.kind &&
      value.platform.toLocaleLowerCase() === platform.name.toLocaleLowerCase()
    )
      onChange({ platform: '' });
    setPending(null);
  }
  const fields = value.kind ? sourceFields[value.kind] : undefined;
  const names = [
    ...sources
      .filter((source) => sourceType(source.kind) === value.kind)
      .map(initialSourcePlatform),
    ...createdPlatforms
      .filter((platform) => platform.kind === value.kind)
      .map((platform) => platform.name),
    value.platform,
  ].filter(Boolean);
  const platforms = [
    ...new Map(names.map((name) => [name.toLocaleLowerCase(), name])).values(),
  ].sort((a, b) => a.localeCompare(b));
  return (
    <fieldset disabled={disabled} className="min-w-0 m-0 p-0 border-0">
      <Field label={tr('type')}>
        <Select
          value={value.kind}
          onValueChange={(kind) => {
            if (isSourceType(kind)) onChange({ kind });
          }}
          options={[
            { value: '', label: tr('choose_a_source_type_2'), disabled: true },
            ...selectOptions(sourceKinds).map((option) => ({
              ...option,
              label: localize(option.label),
            })),
          ]}
          disabled={disabled}
        />
      </Field>
      {fields && (
        <>
          <MultiSelect
            label={tr('system_platform')}
            options={platforms}
            value={value.platform ? [value.platform] : []}
            onValueChange={(values) => onChange({ platform: values[0] ?? '' })}
            onCreate={(name) => {
              const kind = value.kind;
              if (isSourceType(kind)) setCreatedPlatforms((names) => [...names, { kind, name }]);
            }}
            onDelete={(name) => {
              if (!isSourceType(value.kind)) return;
              const platform = { kind: value.kind, name };
              if (sources.some((source) => matchesSourcePlatform(source, platform)))
                setPending(platform);
              else remove(platform);
            }}
            multiple={false}
            disabled={disabled}
          />
          {value.kind === 'mail' && (
            <Field label={tr('subject')}>
              <Input
                value={value.subject}
                maxLength={500}
                onChange={(event) => onChange({ subject: event.target.value })}
              />
            </Field>
          )}
          {fields.identifier && (
            <Field label={localize(fields.identifier)}>
              <Input
                value={value.identifier}
                maxLength={1000}
                onChange={(event) => onChange({ identifier: event.target.value })}
              />
            </Field>
          )}
          {fields.link && (
            <Field
              label={localize(fields.link)}
              hint={
                value.kind === 'url'
                  ? tr('external_http_or_https_link')
                  : tr('optional_http_https_or_teams_link')
              }
            >
              <Input
                required={value.kind === 'url'}
                type={value.kind === 'url' ? 'url' : 'text'}
                pattern={value.kind === 'url' ? 'https?://.+' : undefined}
                value={value.url}
                maxLength={4096}
                placeholder="https://…"
                onChange={(event) => onChange({ url: event.target.value })}
              />
            </Field>
          )}
          {fields.date && (
            <Field label={localize(fields.date)}>
              <DateInput
                withTime
                value={value.eventAt}
                onValueChange={(eventAt) => onChange({ eventAt })}
              />
            </Field>
          )}
          {value.kind === 'messaging' && (
            <Field label={tr('identify_conversation_by')}>
              <Select
                value={value.messageContext}
                options={messagingContexts.map((option) => ({
                  ...option,
                  label: localize(option.label),
                }))}
                disabled={disabled}
                onValueChange={(mode) => {
                  const option = messagingContexts.find((option) => option.value === mode);
                  if (option) onChange({ messageContext: option.value });
                }}
              />
            </Field>
          )}
          {fields.participants && (
            <Field
              label={localize(
                sourceParticipantLabel({
                  kind: value.kind || 'mail',
                  messageContext: value.messageContext,
                }),
              )}
            >
              <Input
                value={value.participants}
                onChange={(event) => onChange({ participants: event.target.value })}
              />
            </Field>
          )}
          <Field label={tr('context')}>
            <Textarea
              value={value.notes}
              rows={3}
              onChange={(event) => onChange({ notes: event.target.value })}
            />
          </Field>
        </>
      )}
      {pending && (
        <Confirm
          title={tr('delete_platform_value0', { value0: pending.name })}
          description={tr(
            'this_will_clear_the_platform_from_value0_source_s_of_type_value1_sources_and_their_task_links_will_b',
            { value0: usage, value1: localize(human(pending.kind)) },
          )}
          confirmLabel={tr('delete_platform')}
          busy={!!disabled}
          onCancel={() => setPending(null)}
          onConfirm={() => remove(pending)}
        />
      )}
    </fieldset>
  );
}
