'use client';

import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useId, useState, type FormEvent } from 'react';
import { saveContact } from '../../application/contacts';
import { deleteResponsibles } from '../../application/workspace';
import { ActionMenu, Button, Card, Confirm, Empty, Field, Input, Modal } from '../../components/core';
import { WorkspaceSection } from '../../components/workspace-section';
import { contactDirectory } from '../../domain/contacts';
import type { Contact } from '../../domain/model';
import { assignedNames, responsibleKey } from '../../domain/responsibles';
import { useWorklog } from '../../providers/worklog';

export default function Page() {
  const { w, wb, enabled } = useWorklog();
  const formId = useId();
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ contact: Contact; previousName?: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const contacts = contactDirectory(w);
  const term = query.trim().toLocaleLowerCase();
  const filtered = contacts.filter((contact) =>
    [contact.name, contact.email, contact.jobTitle, contact.area].some((value) => value.toLocaleLowerCase().includes(term)),
  );
  const isPending = (name: string) => pendingDelete !== null && responsibleKey(name) === responsibleKey(pendingDelete);
  const taskCount = w.tasks.filter((task) => assignedNames(task).some(isPending)).length;
  const topicCount = w.topics.filter((topic) => assignedNames(topic).some(isPending) || isPending(topic.requesterName ?? '')).length;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? '').trim();
    const contact = { name: get('name'), email: get('email'), jobTitle: get('jobTitle'), area: get('area') };
    if (await wb.update((current) => saveContact(current, contact, editor.previousName))) setEditor(null);
  }

  return (
    <WorkspaceSection actions={
      <Button tone="primary" disabled={!enabled} onClick={() => {
        wb.setError('');
        setEditor({ contact: { name: '', email: '', jobTitle: '', area: '' } });
      }}>
        <IconPlus size={17} /> New contact
      </Button>
    }>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm [color:var(--muted)]">{filtered.length} contacts</span>
        <Input
          type="search"
          aria-label="Search contacts"
          placeholder="Search contacts…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-64"
        />
      </div>
      {filtered.length ? (
        <Card>
          <div className="overflow-auto">
            <table className="w-full min-w-[650px] border-collapse text-left text-xs [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium [&_th]:[color:var(--muted)] [&_th]:[background:var(--surface-soft)] [&_td]:px-4 [&_td]:py-3 [&_th]:[border-bottom:1px_solid_var(--border)] [&_td]:[border-bottom:1px_solid_var(--border)] [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover]:[background:var(--surface-soft)]">
              <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Job title</th><th scope="col">Area</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {filtered.map((contact) => (
                  <tr key={responsibleKey(contact.name)}>
                    <td className="font-medium [overflow-wrap:anywhere]">{contact.name}</td>
                    <td className="[color:var(--muted)] [overflow-wrap:anywhere]">{contact.email || '—'}</td>
                    <td className="[color:var(--muted)] [overflow-wrap:anywhere]">{contact.jobTitle || '—'}</td>
                    <td className="[color:var(--muted)] [overflow-wrap:anywhere]">{contact.area || '—'}</td>
                    <td className="w-10">
                      <ActionMenu label={`Actions for ${contact.name}`} disabled={!enabled} items={[
                        { label: 'Edit contact', icon: <IconEdit size={15} />, opensDialog: true, onSelect: () => {
                          wb.setError('');
                          setEditor({ contact, previousName: contact.name });
                        } },
                        { label: 'Delete contact', icon: <IconTrash size={15} />, destructive: true, opensDialog: true, onSelect: () => setPendingDelete(contact.name) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Empty title={term ? 'No matching contacts' : 'No contacts yet'}>
          {term ? 'Try a different name, email, job title or area.' : 'Create a contact here or from an assignee or requester selector.'}
        </Empty>
      )}
      {editor && (
        <Modal title={editor.previousName === undefined ? 'New contact' : 'Edit contact'} onClose={() => setEditor(null)} footer={<>
          <Button disabled={wb.busy} onClick={() => setEditor(null)}>Cancel</Button>
          <Button tone="primary" type="submit" form={formId} disabled={wb.busy}>{wb.busy ? 'Saving…' : 'Save'}</Button>
        </>}>
          <form id={formId} onSubmit={submit}>
            {wb.error && <p role="alert" className="mb-4 text-xs [color:var(--danger-ink)]">{wb.error}</p>}
            <Field label="Name"><Input name="name" autoFocus required maxLength={500} defaultValue={editor.contact.name} /></Field>
            <Field label="Email"><Input name="email" type="email" maxLength={500} defaultValue={editor.contact.email} /></Field>
            <Field label="Job title"><Input name="jobTitle" maxLength={500} defaultValue={editor.contact.jobTitle} /></Field>
            <Field label="Area"><Input name="area" maxLength={500} defaultValue={editor.contact.area} /></Field>
          </form>
        </Modal>
      )}
      {pendingDelete !== null && (
        <Confirm
          title={`Delete contact “${pendingDelete}”?`}
          description={`This will delete its contact details and remove its assignee and requester references from ${taskCount} task(s) and ${topicCount} topic(s), including archived topics. Tasks and topics will be preserved.`}
          confirmLabel="Delete contact"
          busy={wb.busy}
          error={wb.error}
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            if (await wb.update((current) => deleteResponsibles(current, [pendingDelete]))) setPendingDelete(null);
          }}
        />
      )}
    </WorkspaceSection>
  );
}
