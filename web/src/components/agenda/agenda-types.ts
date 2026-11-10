export type AgendaViewMode = 'day' | 'week' | 'month';
export type DayGrouping = 'time' | 'patient' | 'professional' | 'service' | 'space' | 'group';

export interface AgendaFilters {
  patientId: string; professionalId: string; serviceId: string; spaceId: string; groupId: string;
}

export const EMPTY_FILTERS: AgendaFilters = {
  patientId: '', professionalId: '', serviceId: '', spaceId: '', groupId: '',
};
