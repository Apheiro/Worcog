import type { Contact, Workspace } from './model';
import { responsibleDirectory, responsibleKey } from './responsibles';

/** Include existing name-only assignments without changing legacy workspaces on load. */
export function contactDirectory(workspace: Workspace): Contact[] {
  const saved = new Map((workspace.contacts ?? []).map((contact) => [responsibleKey(contact.name), contact]));
  return responsibleDirectory(workspace).map((name) =>
    saved.get(responsibleKey(name)) ?? { name, email: '', jobTitle: '', area: '' },
  );
}
