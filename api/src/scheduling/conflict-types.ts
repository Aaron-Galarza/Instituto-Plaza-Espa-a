import type { OccurrenceSegment, ScheduleConflict, ScheduleOccurrence } from '@plaza/shared';

export interface Instance {
  occurrence: ScheduleOccurrence;
  segment: OccurrenceSegment;
}
export interface ConflictInput {
  severity: 'error' | 'warning';
  code: ScheduleConflict['code'];
  message: string;
  date: string;
  instances: Instance[];
  extra?: string;
}
export type AddConflict = (input: ConflictInput) => void;
