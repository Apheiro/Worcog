import type { MessageContext, Source, SourceKind, SourceType } from './model';
import { sourceKinds, human } from './options';

export function isSourceType(value: string): value is SourceType {
  return sourceKinds.some((kind) => kind === value);
}

/** Legacy provider-specific categories remain readable without guessing unrelated source types. */
export function sourceType(kind: SourceKind): SourceType | undefined {
  if (isSourceType(kind)) return kind;
  if (kind === 'email') return 'mail';
  if (kind === 'invgate') return 'ticketing';
  if (kind === 'teams' || kind === 'phone') return 'messaging';
  return undefined;
}

export const sourceKindLabel = (kind: SourceKind) => human(sourceType(kind) ?? 'uncategorized');

export const sourceFields: Record<
  SourceType,
  {
    platforms: string[];
    identifier?: string;
    link?: string;
    date?: string;
    participants: string;
  }
> = {
  mail: {
    platforms: ['Outlook', 'Gmail'],
    date: 'Date',
    participants: 'Sender / recipients',
  },
  ticketing: {
    platforms: ['InvGate', 'Jira', 'ServiceNow', 'Zendesk'],
    identifier: 'Ticket identifier',
    link: 'Ticket link',
    participants: 'Requester / contacts',
  },
  meeting: {
    platforms: ['Teams', 'Google Meet', 'Zoom'],
    link: 'Meeting / recording link',
    date: 'Meeting date and time',
    participants: 'Attendees',
  },
  messaging: {
    platforms: ['Teams', 'Slack', 'WhatsApp', 'Signal'],
    link: 'Message / conversation link',
    date: 'Date/Time',
    participants: 'Participants',
  },
};

export interface SourceFormValues {
  kind: SourceType | '';
  subject: string;
  messageContext: MessageContext;
  platform: string;
  identifier: string;
  url: string;
  eventAt: string;
  participants: string;
  notes: string;
}

export const emptySourceForm = (): SourceFormValues => ({
  kind: 'mail',
  subject: '',
  messageContext: 'participants',
  platform: '',
  identifier: '',
  url: '',
  eventAt: '',
  participants: '',
  notes: '',
});

export function initialSourcePlatform(source: Source): string {
  return (
    source.platform ||
    (source.kind === 'teams' ? 'Teams' : source.kind === 'invgate' ? 'InvGate' : '')
  );
}

export const messagingContexts = [
  { value: 'sender', label: 'Sender' },
  { value: 'participants', label: 'Participants' },
  { value: 'group', label: 'Group Name' },
] as const;

export function sourceParticipantLabel(source: Pick<Source, 'kind' | 'messageContext'>): string {
  if (sourceType(source.kind) === 'messaging')
    return (
      messagingContexts.find((option) => option.value === (source.messageContext ?? 'participants'))
        ?.label ?? 'Participants'
    );
  const type = sourceType(source.kind);
  return type ? sourceFields[type].participants : 'Participants';
}
