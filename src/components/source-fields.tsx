'use client';
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
import { selectOptions, sourceKinds } from '../domain/options';
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
  const [createdPlatforms, setCreatedPlatforms] = useState<SourcePlatform[]>([]);
  const [pending, setPending] = useState<SourcePlatform | null>(null);
  const usage = pending ? sources.filter((source) => matchesSourcePlatform(source, pending)).length : 0;
  function remove(platform: SourcePlatform) {
    onDeletePlatform(platform);
    setCreatedPlatforms((items) => items.filter((item) => item.kind !== platform.kind ||
      item.name.toLocaleLowerCase() !== platform.name.toLocaleLowerCase()));
    if (value.kind === platform.kind && value.platform.toLocaleLowerCase() === platform.name.toLocaleLowerCase())
      onChange({ platform: '' });
    setPending(null);
  }
  const fields = value.kind ? sourceFields[value.kind] : undefined;
  const names = [
    ...sources
      .filter((source) => sourceType(source.kind) === value.kind)
      .map(initialSourcePlatform),
    ...createdPlatforms.filter((platform) => platform.kind === value.kind).map((platform) => platform.name),
    value.platform,
  ].filter(Boolean);
  const platforms = [
    ...new Map(names.map((name) => [name.toLocaleLowerCase(), name])).values(),
  ].sort((a, b) => a.localeCompare(b));
  return (
    <fieldset disabled={disabled} className="min-w-0 m-0 p-0 border-0">
      <Field label="Type">
        <Select
          value={value.kind}
          onValueChange={(kind) => {
            if (isSourceType(kind)) onChange({ kind });
          }}
          options={[
            { value: '', label: 'Choose a source type', disabled: true },
            ...selectOptions(sourceKinds),
          ]}
          disabled={disabled}
        />
      </Field>
      {fields && (
        <>
          <MultiSelect
            label="System Platform"
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
              if (sources.some((source) => matchesSourcePlatform(source, platform))) setPending(platform);
              else remove(platform);
            }}
            multiple={false}
            disabled={disabled}
          />
          {value.kind === 'mail' && (
            <Field label="Subject">
              <Input
                value={value.subject}
                maxLength={500}
                onChange={(event) => onChange({ subject: event.target.value })}
              />
            </Field>
          )}
          {fields.identifier && (
            <Field label={fields.identifier}>
              <Input
                value={value.identifier}
                maxLength={1000}
                onChange={(event) => onChange({ identifier: event.target.value })}
              />
            </Field>
          )}
          {fields.link && (
            <Field label={fields.link} hint="Optional HTTP, HTTPS or Teams link.">
              <Input
                value={value.url}
                maxLength={4096}
                placeholder="https://…"
                onChange={(event) => onChange({ url: event.target.value })}
              />
            </Field>
          )}
          {fields.date && (
            <Field label={fields.date}>
              <DateInput
                withTime
                value={value.eventAt}
                onValueChange={(eventAt) => onChange({ eventAt })}
              />
            </Field>
          )}
          {value.kind === 'messaging' && (
            <Field label="Identify conversation by">
              <Select
                value={value.messageContext}
                options={messagingContexts}
                disabled={disabled}
                onValueChange={(mode) => {
                  const option = messagingContexts.find((option) => option.value === mode);
                  if (option) onChange({ messageContext: option.value });
                }}
              />
            </Field>
          )}
          <Field
            label={sourceParticipantLabel({
              kind: value.kind || 'mail',
              messageContext: value.messageContext,
            })}
          >
            <Input
              value={value.participants}
              onChange={(event) => onChange({ participants: event.target.value })}
            />
          </Field>
          <Field label="Context">
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
          title={`Delete platform “${pending.name}”?`}
          description={`This will clear the platform from ${usage} source(s) of type ${pending.kind}. Sources and their task links will be preserved. Changes apply when you save the form.`}
          confirmLabel="Delete platform"
          busy={!!disabled}
          onCancel={() => setPending(null)}
          onConfirm={() => remove(pending)}
        />
      )}
    </fieldset>
  );
}
