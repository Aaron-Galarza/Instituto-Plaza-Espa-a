import type {
  AssignmentIssue,
  CareGroup,
  Insurer,
  Patient,
  Professional,
  ProfessionalAvailability,
  ScheduleException,
  ScheduleRule,
  Service,
  Space,
} from '@plaza/shared';

export interface SchedulingContext {
  rules: ScheduleRule[];
  exceptions: ScheduleException[];
  groups: CareGroup[];
  services: Service[];
  spaces: Space[];
  professionals: Professional[];
  patients: Patient[];
  insurers: Insurer[];
  availability: ProfessionalAvailability[];
  issues: AssignmentIssue[];
}
