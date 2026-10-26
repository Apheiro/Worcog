'use client';
import { useTranslations } from 'next-intl';

import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useId, useState, type FormEvent } from 'react';
import { saveContact } from '../../application/contacts';
import { deleteResponsibles } from '../../application/workspace';
import {
  ActionMenu,
  Button,
  Card,
  Confirm,
  Empty,
  Field,
  Input,
  Modal,
} from '../../components/core';
import { WorkspaceSection } from '../../components/workspace-section';
import { contactDirectory } from '../../domain/contacts';
import type { Contact } from '../../domain/model';
import { assignedNames, responsibleKey } from '../../domain/responsibles';
import { useWorcog } from '../../providers/worcog';

export default function Page() {
  const tr = useTranslations('ui');
  const { w, wb, enabled } = useWorcog();
  const formId = useId();
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ contact: Contact; previousName?: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const contacts = contactDirectory(w);
  const term = query.trim().toLocaleLowerCase();
  const filtered = contacts.filter((contact) =>
    [contact.name, contact.email, contact.jobTitle, contact.area].some((value) =>
      value.toLocaleLowerCase().includes(term),
    ),
  );
  const isPending = (name: string) =>
    pendingDelete !== null && responsibleKey(name) === responsibleKey(pendingDelete);
  const taskCount = w.tasks.filter((task) => assignedNames(task).some(isPending)).length;
  const topicCount = w.topics.filter(
    (topic) => assignedNames(topic).some(isPending) || isPending(topic.requesterName ?? ''),
  ).length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? '').trim();
    const contact = {
      name: get('name'),
      email: get('email'),
      jobTitle: get('jobTitle'),
      area: get('area'),
    };
    if (await wb.update((current) => saveContact(current, contact, editor.previousName)))
      setEditor(null);
  }

  return (
    <WorkspaceSection
      actions={
        <Button
          tone="primary"
          disabled={!enabled}
          onClick={() => {
            wb.setError('');
            setEditor({ contact: { name: '', email: '', jobTitle: '', area: '' } });
          }}
        >
          <IconPlus size={17} /> {tr('new_contact')}{' '}
        </Button>
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm [color:var(--muted)]">
          {filtered.length} {tr('contacts')}{' '}
        </span>
        <Input
          type="search"
          aria-label={tr('search_contacts')}
          placeholder={tr('search_contacts_2')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-64"
        />
      </div>
      {filtered.length ? (
        <Card>
          <div className="overflow-auto">
            <table className="w-full min-w-[650px] border-collapse text-left text-xs [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium [&_th]:[color:var(--muted)] [&_th]:[background:var(--surface-soft)] [&_td]:px-4 [&_td]:py-3 [&_th]:[border-bottom:1px_solid_var(--border)] [&_td]:[border-bottom:1px_solid_var(--border)] [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover]:[background:var(--surface-soft)]">
              <thead>
                <tr>
                  <th scope="col"> {tr('name')} </th>
                  <th scope="col"> {tr('email')} </th>
                  <th scope="col"> {tr('job_title')} </th>
                  <th scope="col"> {tr('area')} </th>
                  <th scope="col">
                    <span className="sr-only"> {tr('actions')} </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => (
                  <tr key={responsibleKey(contact.name)}>
                    <td className="font-medium [overflow-wrap:anywhere]">{contact.name}</td>
                    <td className="[color:var(--muted)] [overflow-wrap:anywhere]">
                      {contact.email || '—'}
                    </td>
                    <td className="[color:var(--muted)] [overflow-wrap:anywhere]">
                      {contact.jobTitle || '—'}
                    </td>
                    <td className="[color:var(--muted)] [overflow-wrap:anywhere]">
                      {contact.area || '—'}
                    </td>
                    <td className="w-10">
                      <ActionMenu
                        label={tr('actions_for_value0', { value0: contact.name })}
                        disabled={!enabled}
                        items={[
                          {
                            label: tr('edit_contact'),
                            icon: <IconEdit size={15} />,
                            opensDialog: true,
                            onSelect: () => {
                              wb.setError('');
                              setEditor({ contact, previousName: contact.name });
                            },
                          },
                          {
                            label: tr('delete_contact'),
                            icon: <IconTrash size={15} />,
                            destructive: true,
                            opensDialog: true,
                            onSelect: () => setPendingDelete(contact.name),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Empty title={term ? tr('no_matching_contacts') : tr('no_contacts_yet')}>
          {term
            ? tr('try_a_different_name_email_job_title_or_area')
            : tr('create_a_contact_here_or_from_an_assignee_or_requester_selector')}
        </Empty>
      )}
      {editor && (
        <Modal
          title={editor.previousName === undefined ? tr('new_contact') : tr('edit_contact')}
          onClose={() => setEditor(null)}
          footer={
            <>
              <Button disabled={wb.busy} onClick={() => setEditor(null)}>
                {' '}
                {tr('cancel')}{' '}
              </Button>
              <Button tone="primary" type="submit" form={formId} disabled={wb.busy}>
                {wb.busy ? tr('saving') : tr('save')}
              </Button>
            </>
          }
        >
          <form id={formId} onSubmit={submit}>
            {wb.error && (
              <p role="alert" className="mb-4 text-xs [color:var(--danger-ink)]">
                {wb.error}
              </p>
            )}
            <Field label={tr('name')}>
              <Input
                name="name"
                autoFocus
                required
                maxLength={500}
                defaultValue={editor.contact.name}
              />
            </Field>
            <Field label={tr('email')}>
              <Input
                name="email"
                type="email"
                maxLength={500}
                defaultValue={editor.contact.email}
              />
            </Field>
            <Field label={tr('job_title')}>
              <Input name="jobTitle" maxLength={500} defaultValue={editor.contact.jobTitle} />
            </Field>
            <Field label={tr('area')}>
              <Input name="area" maxLength={500} defaultValue={editor.contact.area} />
            </Field>
          </form>
        </Modal>
      )}
      {pendingDelete !== null && (
        <Confirm
          title={tr('delete_contact_value0', { value0: pendingDelete })}
          description={tr(
            'this_will_delete_its_contact_details_and_remove_its_assignee_and_requester_references_from_value0_ta',
            { value0: taskCount, value1: topicCount },
          )}
          confirmLabel={tr('delete_contact')}
          busy={wb.busy}
          error={wb.error}
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            if (await wb.update((current) => deleteResponsibles(current, [pendingDelete])))
              setPendingDelete(null);
          }}
        />
      )}
    </WorkspaceSection>
  );
}
