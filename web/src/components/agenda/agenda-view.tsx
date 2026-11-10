'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type GroupOccupancy,
  type ScheduleConflict,
  type ScheduleOccurrence,
  type ScheduleResponse,
  type ScheduleSummary,
} from '@plaza/shared';
import { useAuth } from '@/lib/auth';
import { useDebouncedValue, useReferenceData } from '@/lib/queries';
import { api, queryString } from '@/lib/api';
import { stepDate, today, viewRange } from '@/lib/format';
import { NewJourneyModal } from './new-journey';
import { OccurrencePanel } from './occurrence-panel';
import type { JourneyReference } from './journey-builder';
import { AgendaHeader } from './agenda-header';
import { AgendaFilters } from './agenda-filters';
import { AgendaSidebar } from './agenda-sidebar';
import { AgendaContent } from './agenda-content';
import { EMPTY_FILTERS, type AgendaFilters as AgendaFilterValues, type AgendaViewMode, type DayGrouping } from './agenda-types';

export function AgendaView({ scope = 'all' }: { scope?: 'all' | 'own' }) {
  const { can } = useAuth();
  const referenceQuery = useReferenceData();
  const [view, setView] = useState<AgendaViewMode>(scope === 'own' ? 'day' : 'week');
  const [dayGrouping, setDayGrouping] = useState<DayGrouping>('time');
  const [date, setDate] = useState(today());
  const [filters, setFilters] = useState<AgendaFilterValues>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 280);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [selected, setSelected] = useState<ScheduleOccurrence | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedDate = params.get('date');
    const requestedView = params.get('view');
    if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) setDate(requestedDate);
    if (requestedView === 'day' || requestedView === 'week' || requestedView === 'month')
      setView(requestedView);
    setFilters((current) => ({
      ...current,
      patientId: params.get('patientId') ?? '',
      professionalId: params.get('professionalId') ?? '',
      serviceId: params.get('serviceId') ?? '',
      spaceId: params.get('spaceId') ?? '',
      groupId: params.get('groupId') ?? '',
    }));
  }, []);

  const range = viewRange(view, date);
  const scheduleQuery = useQuery<ScheduleResponse>({
    queryKey: ['schedule', scope, range.from, range.to, filters, search, includeCancelled],
    queryFn: () =>
      api<ScheduleResponse>(
        `/schedule${queryString({
          from: range.from,
          to: range.to,
          patientId: filters.patientId,
          professionalId: scope === 'own' ? undefined : filters.professionalId,
          serviceId: filters.serviceId,
          spaceId: filters.spaceId,
          groupId: filters.groupId,
          search,
          includeCancelled: includeCancelled ? 'true' : undefined,
        })}`,
      ),
  });

  const occupancyQuery = useQuery<GroupOccupancy[]>({
    queryKey: ['group-occupancy', date],
    queryFn: () => api<GroupOccupancy[]>(`/schedule/group-occupancy?date=${date}`),
    staleTime: 20_000,
  });

  const pendingConflicts = useQuery<{ from: string; to: string; conflicts: ScheduleConflict[] }>({
    queryKey: ['pending-conflicts'],
    queryFn: () => api('/schedule/pending-conflicts'),
    enabled: scope === 'all' && can('schedule:write'),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    setSelected(null);
  }, [date, view]);

  const reference = referenceQuery.data;
  const journeyReference: JourneyReference | null = reference
    ? {
        patients: reference.patients,
        professionals: reference.professionals,
        services: reference.services,
        spaces: reference.spaces,
        groups: reference.groups,
      }
    : null;

  const data = scheduleQuery.data;
  const occurrences = data?.occurrences ?? [];
  const conflicts = data?.conflicts ?? [];
  const summary: ScheduleSummary = data?.summary ?? {
    occurrences: 0,
    patients: 0,
    services: 0,
    professionals: 0,
    errors: 0,
    warnings: 0,
  };

  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleOccurrence[]>();
    for (const occurrence of occurrences) {
      const list = map.get(occurrence.date) ?? [];
      list.push(occurrence);
      map.set(occurrence.date, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) => a.startMinute - b.startMinute || a.patientName.localeCompare(b.patientName),
      );
    }
    return map;
  }, [occurrences]);

  const navigate = (direction: -1 | 1) => setDate((current) => stepDate(view, current, direction));

  const selectConflict = (conflict: ScheduleConflict) => {
    const occurrence = occurrences.find((item) => conflict.occurrenceKeys.includes(item.key));
    if (occurrence) setSelected(occurrence);
  };

  const canWrite = can('schedule:write');
  const canSubmitRequest = can('requests:submit');

  return (
    <>
      <AgendaHeader scope={scope} view={view} date={date} range={range} summary={summary}
        canWrite={canWrite} canCreate={Boolean(journeyReference)} onView={setView} onDate={setDate}
        onNavigate={navigate} onOpenNew={() => setNewOpen(true)} />

      <div className="agenda-layout">
        <div className="stack gap-16">
          <AgendaFilters filters={filters} setFilters={setFilters} view={view}
            dayGrouping={dayGrouping} setDayGrouping={setDayGrouping} scope={scope}
            reference={journeyReference} searchInput={searchInput} setSearchInput={setSearchInput}
            includeCancelled={includeCancelled} setIncludeCancelled={setIncludeCancelled} />

          <AgendaContent scheduleQuery={scheduleQuery} view={view} dayGrouping={dayGrouping}
            date={date} range={range} byDate={byDate} setSelected={setSelected}
            setView={setView} setDate={setDate} />
        </div>

        <AgendaSidebar scope={scope} canWrite={canWrite} pendingConflicts={pendingConflicts}
          conflicts={conflicts} occupancyQuery={occupancyQuery} date={date}
          onDate={setDate} onViewDay={() => setView('day')} onSelectConflict={selectConflict} />
      </div>

      {journeyReference ? (
        <NewJourneyModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          date={date}
          reference={journeyReference}
        />
      ) : null}

      <OccurrencePanel
        occurrence={selected}
        onClose={() => setSelected(null)}
        canWrite={canWrite}
        canSubmitRequest={canSubmitRequest}
        reference={
          journeyReference ?? {
            patients: [],
            professionals: [],
            services: [],
            spaces: [],
            groups: [],
          }
        }
      />
    </>
  );
}
