import { z } from 'zod';
import { dateOnlySchema } from './common';
import { ScheduleConflict } from './schedule';
import { AssignmentIssue } from './availability';

export const dashboardQuerySchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
  })
  .refine((value) => value.from <= value.to, {
    message: 'Rango de fechas inválido',
    path: ['from'],
  });
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export interface DashboardMetrics {
  uniquePatients: number;
  journeys: number;
  services: number;
  professionalsWithAssignments: number;
  patientsWithMultipleServices: number;
  patientMinutes: number;
  professionalMinutes: number;
  availableProfessionalMinutes: number;
  maxSimultaneousPatients: number;
  segmentsWithoutProfessional: number;
  pendingConflicts: number;
  pendingRequests: number;
  scheduleChanges: number;
  cancelledOccurrences: number;
  pendingIssues: number;
}

export interface DashboardServiceRow {
  serviceId: string;
  name: string;
  segments: number;
  patients: number;
  patientMinutes: number;
}

export interface DashboardProfessionalRow {
  professionalId: string;
  name: string;
  color: string;
  segments: number;
  patients: number;
  scheduledMinutes: number;
  availableMinutes: number;
  utilizationPct: number | null;
}

export interface DashboardInsurerRow {
  insurerId: string | null;
  name: string;
  patients: number;
  journeys: number;
  services: number;
}

export interface DashboardSpaceRow {
  spaceId: string;
  name: string;
  capacity: number;
  patientMinutes: number;
  maxSimultaneous: number;
  peakUtilizationPct: number;
  daysUsed: number;
}

export interface DashboardDailyRow {
  date: string;
  journeys: number;
  patients: number;
  services: number;
  maxSimultaneous: number;
  conflicts: number;
}

export interface DashboardResponse {
  from: string;
  to: string;
  metrics: DashboardMetrics;
  byService: DashboardServiceRow[];
  byProfessional: DashboardProfessionalRow[];
  byInsurer: DashboardInsurerRow[];
  bySpace: DashboardSpaceRow[];
  daily: DashboardDailyRow[];
  conflicts: ScheduleConflict[];
  pendingIssues: AssignmentIssue[];
}
