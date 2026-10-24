export type Status = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'canceled';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type ActivityKind =
  'note' | 'progress' | 'decision' | 'blocker' | 'meeting' | 'outcome' | 'status' | 'milestone';
export type SourceType = 'mail' | 'ticketing' | 'meeting' | 'messaging';
export type SourceKind =
  | SourceType
  | 'email'
  | 'teams'
  | 'invgate'
  | 'document'
  | 'meeting'
  | 'url'
  | 'phone'
  | 'system'
  | 'other';
export interface Base {
  id: string;
  createdAt: string;
  updatedAt: string;
}
export interface Topic extends Base {
  requesterName?: string;
  startDate?: string | null;
  title: string;
  summary: string;
  category: string;
  status: Status;
  priority: Priority;
  /** Legacy import compatibility; use responsibleNames for assignments. */
  owner: string;
  responsibleNames?: string[];
  participants: string;
  tags: string[];
  nextAction: string;
  targetDate: string | null;
  closedAt: string | null;
  archived: boolean;
  relatedTopicIds: string[];
}
export interface Task extends Base {
  reminderAt?: string | null;
  reminderDismissedAt?: string | null;
  order?: number;
  /** Parent group to which the saved Free order belongs; omitted on legacy tasks. */
  orderParentId?: string | null;
  title: string;
  description: string;
  topicId: string;
  parentId: string | null;
  status: Status;
  blockReason?: string;
  priority: Priority;
  /** Legacy import compatibility; use responsibleNames for assignments. */
  owner: string;
  responsibleNames?: string[];
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  nextAction: string;
  tags: string[];
  sourceIds: string[];
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceRootId: string | null;
  occurrenceDate: string | null;
}
export interface Activity extends Base {
  text: string;
  kind: ActivityKind;
  eventAt: string;
  topicIds: string[];
  taskIds: string[];
  sourceIds: string[];
  revisions: { text: string; revisedAt: string }[];
}
export type MessageContext = 'sender' | 'participants' | 'group';
export interface Source extends Base {
  subject?: string;
  messageContext?: MessageContext;
  title: string;
  kind: SourceKind;
  platform: string;
  identifier: string;
  url: string;
  eventAt: string;
  participants: string;
  notes: string;
  tags: string[];
  topicIds: string[];
}
export interface Attachment {
  id: string;
  originalName: string;
  managedName: string;
  mime: string;
  size: number;
  addedAt: string;
  topicIds: string[];
  taskIds: string[];
  activityIds: string[];
  sourceIds: string[];
}
export interface Workspace {
  formatVersion: 1;
  revision: number;
  responsibleNames?: string[];
  contacts?: Contact[];
  categoryColors?: Record<string, string>;
  links?: EntityLink[];
  topics: Topic[];
  tasks: Task[];
  activities: Activity[];
  sources: Source[];
  attachments: Attachment[];
}
export type EntityRef = { kind: 'task' | 'topic'; id: string };
/** Directed precedence: from is previous, to is next; visible from either endpoint. */
export type EntityLink = { from: EntityRef; to: EntityRef };
export interface Contact {
  name: string;
  email: string;
  jobTitle: string;
  area: string;
}
export interface StorageInfo {
  data: string;
  attachments: string;
  cache: string;
  backups: string;
}
export const emptyWorkspace = (): Workspace => ({
  formatVersion: 1,
  revision: 0,
  responsibleNames: [],
  contacts: [],
  categoryColors: {},
  topics: [],
  tasks: [],
  activities: [],
  sources: [],
  attachments: [],
});
