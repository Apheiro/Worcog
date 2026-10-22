import type { Contact, Task, Topic, Workspace } from '../domain/model';
import { contactDirectory } from '../domain/contacts';
import { assignedNames, responsibleKey } from '../domain/responsibles';
import { contactSchema } from '../domain/validation';
import { applyWorkspaceChanges } from './workspace-changes';

export function saveContact(workspace: Workspace, input: Contact, previousName?: string): Workspace {
  const contact = contactSchema.parse(input);
  const directory = contactDirectory(workspace);
  const previousKey = previousName === undefined ? undefined : responsibleKey(previousName);
  const key = responsibleKey(contact.name);
  if (previousKey !== undefined && !directory.some((item) => responsibleKey(item.name) === previousKey))
    throw new Error('This contact no longer exists.');
  if (directory.some((item) => responsibleKey(item.name) === key && responsibleKey(item.name) !== previousKey))
    throw new Error('A contact with this name already exists.');
  const now = new Date().toISOString();
  const rename = (name: string) => responsibleKey(name) === previousKey ? contact.name : name;
  function reassign<T extends Task | Topic>(item: T): T {
    const previous = assignedNames(item);
    const responsibleNames = previous.map(rename);
    const owner = rename(item.owner);
    if (owner === item.owner && responsibleNames.every((name, index) => name === previous[index])) return item;
    return { ...item, owner, responsibleNames, updatedAt: now };
  }
  const contacts = [...directory.filter((item) => responsibleKey(item.name) !== previousKey), contact];
  return applyWorkspaceChanges(workspace, {
    contacts,
    responsibleNames: contacts.map((item) => item.name),
    topics: workspace.topics.map((topic) => {
      const next = reassign(topic);
      const requesterName = rename(topic.requesterName ?? '');
      return requesterName !== (topic.requesterName ?? '')
        ? { ...next, requesterName, updatedAt: now }
        : next;
    }),
    tasks: workspace.tasks.map(reassign),
  }, now);
}
