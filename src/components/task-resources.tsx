'use client';
import { useTranslations } from 'next-intl';
import { useEffect, useImperativeHandle, useRef, useState, type DragEvent, type Ref } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { IconFile, IconLink, IconUpload, IconX } from '@tabler/icons-react';
import { mergeResourceDrafts, type TaskResourcesDraft } from '../application/task-resources';
import type { Workspace } from '../domain/model';
import { sourceSchema } from '../domain/validation';
import {
  clearSourcePlatforms,
  emptySourceForm,
  isSourceType,
  type SourceFormValues,
} from '../domain/sources';
import { SourceFields } from './source-fields';
import { SourceIcon } from './source-icon';
import { desktopAvailable, errorMessage, native } from '../infrastructure/native';
import { Button, Field, Input } from './core';

export type TaskResourcesHandle = { prepareSave: () => boolean };

export function TaskResources({
  ref,
  workspace: w,
  value,
  onChange,
  disabled,
  onBusyChange,
  openFile,
}: {
  ref?: Ref<TaskResourcesHandle>;
  workspace: Workspace;
  value: TaskResourcesDraft;
  onChange: (value: TaskResourcesDraft) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  openFile: (id: string) => void;
}) {
  const tr = useTranslations('ui');
  const dropZone = useRef<HTMLElement>(null);
  const latest = useRef({ value, onChange, disabled, onBusyChange });
  latest.current = { value, onChange, disabled, onBusyChange };
  const locked = useRef(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [source, setSource] = useState<SourceFormValues & { title: string }>(() => ({
    ...emptySourceForm(),
    title: '',
  }));
  const initialSource = useRef(source);
  useImperativeHandle(ref, () => ({
    prepareSave() {
      const changed = (Object.keys(source) as (keyof typeof source)[]).some(
        (key) => source[key] !== initialSource.current[key],
      );
      if (!creating && !changed) return true;
      setCreating(true);
      setError(
        tr(
          'this_resource_has_not_been_added_yet_add_it_to_the_task_or_discard_the_draft_before_saving',
        ),
      );
      dropZone.current?.scrollIntoView({ block: 'nearest' });
      return false;
    },
  }));
  const savedSources = clearSourcePlatforms(w.sources, value.removedSourcePlatforms ?? []);
  const sources = mergeResourceDrafts(savedSources, value.sources).filter((s) =>
    value.sourceIds.includes(s.id),
  );
  const files = mergeResourceDrafts(w.attachments, value.files).filter((f) =>
    value.fileIds.includes(f.id),
  );
  const savedFileIds = new Set(w.attachments.map((file) => file.id));
  const term = query.trim().toLocaleLowerCase();
  // Existing resources appear only after an explicit search, never as an unfiltered catalogue.
  const matches =
    term.length >= 2
      ? [
          ...savedSources
            .filter(
              (s) =>
                !value.sourceIds.includes(s.id) &&
                `${s.title} ${s.subject ?? ''} ${s.identifier} ${s.participants} ${s.url}`
                  .toLocaleLowerCase()
                  .includes(term),
            )
            .map((s) => ({
              id: s.id,
              title: s.title,
              kind: 'source' as const,
              sourceKind: s.kind,
            })),
          ...w.attachments
            .filter(
              (f) =>
                !value.fileIds.includes(f.id) && f.originalName.toLocaleLowerCase().includes(term),
            )
            .map((f) => ({ id: f.id, title: f.originalName, kind: 'file' as const })),
        ].slice(0, 8)
      : [];

  async function importFiles(paths?: string[]) {
    if (latest.current.disabled || locked.current) return;
    locked.current = true;
    latest.current.onBusyChange(true);
    setError('');
    try {
      for (const path of paths ?? [undefined]) {
        const file = await native.attach(path);
        if (!file) continue;
        const current = latest.current.value;
        const next = {
          ...current,
          files: mergeResourceDrafts(current.files, [file]),
          fileIds: [...new Set([...current.fileIds, file.id])],
        };
        latest.current.value = next;
        latest.current.onChange(next);
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      locked.current = false;
      latest.current.onBusyChange(false);
    }
  }
  const importRef = useRef(importFiles);
  importRef.current = importFiles;
  useEffect(() => {
    if (!desktopAvailable()) return;
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void getCurrentWebview()
      .onDragDropEvent(({ payload }) => {
        if (disposed) return;
        if (payload.type === 'leave') {
          setDragging(false);
          return;
        }
        const rect = dropZone.current?.getBoundingClientRect();
        const x = payload.position.x / window.devicePixelRatio;
        const y = payload.position.y / window.devicePixelRatio;
        const inside =
          !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        setDragging(inside && payload.type !== 'drop');
        if (inside && payload.type === 'drop') void importRef.current(payload.paths);
      })
      .then((stop) => {
        if (disposed) stop();
        else unlisten = stop;
      })
      .catch((cause) => {
        if (!disposed) setError(errorMessage(cause));
      });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  function addSource(input = source) {
    if (!isSourceType(input.kind)) {
      setError(tr('choose_a_source_type'));
      return;
    }
    if (input.kind === 'url' && !/^https?:\/\//i.test(input.url.trim())) {
      setError(tr('enter_an_http_or_https_url'));
      return;
    }
    const now = new Date().toISOString();
    const date = input.eventAt ? new Date(input.eventAt) : new Date(now);
    if (Number.isNaN(date.getTime())) {
      setError(tr('enter_a_valid_source_date'));
      return;
    }
    const parsed = sourceSchema.safeParse({
      ...input,
      id: crypto.randomUUID(),
      title: input.title.trim(),
      eventAt: date.toISOString(),
      createdAt: now,
      updatedAt: now,
      tags: [],
      topicIds: [],
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tr('check_the_source_fields'));
      return;
    }
    const duplicate = [...savedSources, ...value.sources].find(
      (s) =>
        (parsed.data.url && s.url === parsed.data.url) ||
        (parsed.data.identifier &&
          s.identifier.toLocaleLowerCase() === parsed.data.identifier.toLocaleLowerCase() &&
          s.platform.toLocaleLowerCase() === parsed.data.platform.toLocaleLowerCase()),
    );
    const record = duplicate ?? parsed.data;
    onChange({
      ...value,
      sourceIds: [...new Set([...value.sourceIds, record.id])],
      sources: duplicate ? value.sources : [...value.sources, record],
    });
    setCreating(false);
    setSource({ ...emptySourceForm(), title: '' });
    setError('');
  }
  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const text = (
      event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain')
    )
      .split('\n')
      .find((line) => line.trim() && !line.startsWith('#'))
      ?.trim();
    if (text) {
      try {
        const url = new URL(text);
        if (!['https:', 'http:', 'msteams:'].includes(url.protocol))
          throw new Error(tr('unsupported_link'));
        setSource({
          ...emptySourceForm(),
          kind: url.protocol === 'msteams:' ? 'messaging' : 'url',
          title: url.hostname || text,
          url: text,
        });
        setCreating(true);
        setError('');
      } catch {
        setError(tr('drop_a_valid_http_https_or_teams_link'));
      }
    } else if (!desktopAvailable() && event.dataTransfer.files.length)
      setError(tr('open_the_desktop_application_to_import_files'));
  }
  async function removeFile(id: string) {
    const draft = savedFileIds.has(id) ? undefined : value.files.find((file) => file.id === id);
    if (draft) {
      onBusyChange(true);
      try {
        await native.discardDraft(draft.managedName);
      } catch (cause) {
        setError(errorMessage(cause));
        return;
      } finally {
        onBusyChange(false);
      }
    }
    onChange({
      ...value,
      fileIds: value.fileIds.filter((fileId) => fileId !== id),
      files: value.files.filter((file) => file.id !== id),
    });
  }
  return (
    <section
      ref={dropZone}
      aria-label={tr('resources')}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
      className={`mb-5 rounded-lg border border-solid [border-color:var(--border)] p-4 ${dragging ? '[background:var(--selected)]' : '[background:var(--surface-soft)]'}`}
    >
      <h3 className="text-sm font-medium mb-2"> {tr('resources')} </h3>
      <p className="text-xs [color:var(--muted)] mb-3">
        {tr(
          'drop_files_or_a_source_link_here_or_add_a_resource_below_changes_are_applied_when_you_save_the_task',
        )}{' '}
      </p>
      <fieldset disabled={disabled} className="min-w-0 border-0 p-0 m-0">
        <div className="flex flex-wrap gap-2 mb-3">
          <Button
            type="button"
            size="sm"
            onClick={() => setCreating((open) => !open)}
            aria-expanded={creating}
          >
            <IconLink size={15} /> {tr('create_source')}{' '}
          </Button>
          <Button type="button" size="sm" onClick={() => void importFiles()}>
            <IconUpload size={15} /> {tr('upload_file')}{' '}
          </Button>
        </div>
        {(sources.length > 0 || files.length > 0) && (
          <ul className="list-none m-0 p-0 flex flex-col gap-2 mb-3">
            {sources.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs min-w-0">
                <SourceIcon kind={s.kind} size={15} className="shrink-0" />
                {s.url ? (
                  <Button
                    type="button"
                    tone="link"
                    size="auto"
                    className="text-left break-words"
                    onClick={() => {
                      void native
                        .openReference(s.url)
                        .catch((cause) => setError(errorMessage(cause)));
                    }}
                  >
                    {s.title}
                  </Button>
                ) : (
                  <span className="break-words">{s.title}</span>
                )}
                <Button
                  type="button"
                  tone="ghost"
                  size="icon"
                  className="ml-auto shrink-0"
                  aria-label={tr('unlink_value0', { value0: s.title })}
                  onClick={() =>
                    onChange({ ...value, sourceIds: value.sourceIds.filter((id) => id !== s.id) })
                  }
                >
                  <IconX size={14} />
                </Button>
              </li>
            ))}
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-xs min-w-0">
                <IconFile size={15} className="shrink-0" />
                {!savedFileIds.has(f.id) ? (
                  <span className="break-words">
                    {f.originalName}{' '}
                    <span className="[color:var(--muted)]"> {tr('pending_save')} </span>
                  </span>
                ) : (
                  <Button
                    type="button"
                    tone="link"
                    size="auto"
                    className="text-left break-words"
                    onClick={() => openFile(f.id)}
                  >
                    {f.originalName}
                  </Button>
                )}
                <Button
                  type="button"
                  tone="ghost"
                  size="icon"
                  className="ml-auto shrink-0"
                  aria-label={tr('unlink_value0', { value0: f.originalName })}
                  onClick={() => void removeFile(f.id)}
                >
                  <IconX size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Field
          label={tr('find_an_existing_resource')}
          hint={tr('type_at_least_two_characters_to_link_a_specific_saved_resource')}
        >
          <Input
            value={query}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault();
            }}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('search_by_name_identifier_or_link')}
          />
        </Field>
        {term.length >= 2 && (
          <div className="flex flex-col gap-2 mb-3" aria-live="polite">
            {matches.map((match) => (
              <Button
                type="button"
                size="sm"
                key={`${match.kind}:${match.id}`}
                onClick={() => {
                  onChange(
                    match.kind === 'source'
                      ? { ...value, sourceIds: [...new Set([...value.sourceIds, match.id])] }
                      : { ...value, fileIds: [...new Set([...value.fileIds, match.id])] },
                  );
                  setQuery('');
                }}
              >
                {match.kind === 'source' ? (
                  <SourceIcon kind={match.sourceKind} size={14} />
                ) : (
                  <IconFile size={14} />
                )}{' '}
                {match.title}
              </Button>
            ))}
            {!matches.length && (
              <p className="text-xs [color:var(--muted)]"> {tr('no_matching_resources')} </p>
            )}
          </div>
        )}
        {creating && (
          <div
            onKeyDown={(event) => {
              if (
                !event.defaultPrevented &&
                event.key === 'Enter' &&
                event.target instanceof HTMLInputElement
              ) {
                event.preventDefault();
                addSource();
              }
            }}
            className="border-0 border-t border-solid [border-color:var(--border)] pt-4"
          >
            <Field label={tr('source_title')}>
              <Input
                value={source.title}
                maxLength={500}
                onChange={(e) => setSource({ ...source, title: e.target.value })}
              />
            </Field>
            <SourceFields
              value={source}
              onChange={(patch) => setSource((current) => ({ ...current, ...patch }))}
              sources={[...savedSources, ...value.sources]}
              onDeletePlatform={(platform) =>
                onChange({
                  ...value,
                  removedSourcePlatforms: [...(value.removedSourcePlatforms ?? []), platform],
                  sources: clearSourcePlatforms(
                    value.sources,
                    [platform],
                    new Date().toISOString(),
                  ),
                })
              }
              disabled={disabled}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => addSource()}
                disabled={!source.title.trim() || !source.kind}
              >
                {tr('add_source_to_task')}{' '}
              </Button>
              <Button
                type="button"
                size="sm"
                tone="ghost"
                onClick={() => {
                  setSource({ ...emptySourceForm(), title: '' });
                  setCreating(false);
                  setError('');
                }}
              >
                {tr('discard_draft')}{' '}
              </Button>
            </div>
          </div>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="text-xs [color:var(--danger-ink)] mt-3">
          {error}
        </p>
      )}
    </section>
  );
}
