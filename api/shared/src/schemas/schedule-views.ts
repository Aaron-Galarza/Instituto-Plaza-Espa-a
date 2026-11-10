import { statusSchema } from './common';
import type { ScheduleRule } from './schedule-core';
import type { ScheduleException } from './schedule-exceptions';

export type OccurrenceStatus = 'scheduled' | 'modified' | 'cancelled' | 'pending_resolution';

export interface OccurrenceProfessional {
  id: string;
  name: string;
  color: string;
}

export interface OccurrenceSegment {
  id: string;
  serviceId: string;
  serviceName: string;
  modality: string;
  professionalIds: string[];
  professionals: OccurrenceProfessional[];
  groupId: string | null;
  groupName: string | null;
  spaceId: string | null;
  spaceName: string | null;
  startMinute: number;
  endMinute: number;
  notes?: string | null;
}

export interface ScheduleOccurrence {
  key: string;
  date: string;
  ruleId: string;
  seriesId: string;
  ruleVersion: number;
  patientId: string;
  patientName: string;
  patientStatus: string;
  status: OccurrenceStatus;
  startMinute: number;
  endMinute: number;
  segments: OccurrenceSegment[];
  exceptionId: string | null;
  exceptionReason: string | null;
  issueIds: string[];
  conflictCount: number;
}

export const CONFLICT_CODES = [
  'patient_overlap',
  'patient_duplicate',
  'professional_double_booked',
  'professional_unavailable',
  'professional_outside_availability',
  'professional_without_availability',
  'space_capacity_exceeded',
  'group_capacity_exceeded',
  'group_mismatch',
  'professional_not_in_group',
  'missing_professional',
  'outside_rule_bounds',
  'invalid_reference',
] as const;
export type ConflictCode = (typeof CONFLICT_CODES)[number];

export interface ScheduleConflict {
  id: string;
  severity: 'error' | 'warning';
  code: ConflictCode;
  message: string;
  date: string;
  occurrenceKeys: string[];
  ruleIds: string[];
  patientIds: string[];
  professionalIds: string[];
  segmentIds: string[];
  groupId: string | null;
  spaceId: string | null;
}

export interface ScheduleSummary {
  occurrences: number;
  patients: number;
  services: number;
  professionals: number;
  errors: number;
  warnings: number;
}

export interface ScheduleResponse {
  from: string;
  to: string;
  occurrences: ScheduleOccurrence[];
  conflicts: ScheduleConflict[];
  summary: ScheduleSummary;
}

export interface ScheduleValidationResponse {
  errors: ScheduleConflict[];
  warnings: ScheduleConflict[];
  valid: boolean;
}

export interface ScheduleRuleDetail {
  rule: ScheduleRule;
  series: ScheduleRule[];
  exceptions: ScheduleException[];
  patientName: string;
  warnings: ScheduleConflict[];
}

export interface CreateRuleResponse {
  rule: ScheduleRule;
  warnings: ScheduleConflict[];
}

export interface ChangeRuleResponse {
  rule: ScheduleRule;
  exception: ScheduleException | null;
  warnings: ScheduleConflict[];
}

export interface GroupOccupancy {
  groupId: string;
  groupName: string;
  date: string;
  capacity: number;
  maxSimultaneous: number;
  patientIds: string[];
  professionals: OccurrenceProfessional[];
  serviceName: string;
  spaceName: string | null;
  startMinute: number;
  endMinute: number;
}

export const statusSchemaForRules = statusSchema;
