import type {
  AssignmentIssue,
  AuditEvent,
  CareGroup,
  ChangeRequest,
  Insurer,
  Patient,
  Professional,
  ProfessionalAvailability,
  ScheduleException,
  ScheduleRule,
  Service,
  Space,
  User,
} from '@plaza/shared';

/** Usuario persistido: incluye el hash, que nunca se expone por la API. */
export interface UserRecord extends User {
  passwordHash: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  lastLoginIp?: string | null;
}

export interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  patients: Patient[];
  professionals: Professional[];
  insurers: Insurer[];
  services: Service[];
  spaces: Space[];
  careGroups: CareGroup[];
  professionalAvailability: ProfessionalAvailability[];
  scheduleRules: ScheduleRule[];
  scheduleExceptions: ScheduleException[];
  assignmentIssues: AssignmentIssue[];
  changeRequests: ChangeRequest[];
  auditEvents: AuditEvent[];
}

export type CollectionName = keyof DatabaseSchema;
export type DocumentOf<K extends CollectionName> = DatabaseSchema[K][number];

export const COLLECTION_NAMES: readonly CollectionName[] = [
  'users',
  'sessions',
  'patients',
  'professionals',
  'insurers',
  'services',
  'spaces',
  'careGroups',
  'professionalAvailability',
  'scheduleRules',
  'scheduleExceptions',
  'assignmentIssues',
  'changeRequests',
  'auditEvents',
];

export function emptyDatabase(): DatabaseSchema {
  return {
    users: [],
    sessions: [],
    patients: [],
    professionals: [],
    insurers: [],
    services: [],
    spaces: [],
    careGroups: [],
    professionalAvailability: [],
    scheduleRules: [],
    scheduleExceptions: [],
    assignmentIssues: [],
    changeRequests: [],
    auditEvents: [],
  };
}
