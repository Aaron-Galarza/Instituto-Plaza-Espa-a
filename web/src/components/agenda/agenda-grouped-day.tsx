'use client';

import { minutesToTime, type ScheduleOccurrence } from '@plaza/shared';
import { EmptyState } from '@/components/ui';
import type { DayGrouping } from './agenda-types';

export function GroupedDayView({
  occurrences,
  grouping,
  onSelect,
}: {
  occurrences: ScheduleOccurrence[];
  grouping: Exclude<DayGrouping, 'time'>;
  onSelect: (occurrence: ScheduleOccurrence) => void;
}) {
  if (occurrences.length === 0) {
    return (
      <EmptyState
        title="Sin jornadas para esta fecha"
        description="Elegí otra fecha para ver la distribución."
      />
    );
  }
  const groups = new Map<string, ScheduleOccurrence[]>();
  for (const occurrence of occurrences) {
    const labels =
      grouping === 'patient'
        ? [occurrence.patientName]
        : grouping === 'professional'
          ? occurrence.segments.flatMap((segment) =>
              segment.professionals.map((professional) => professional.name),
            )
          : grouping === 'service'
            ? occurrence.segments.map((segment) => segment.serviceName)
            : grouping === 'space'
              ? occurrence.segments.map((segment) => segment.spaceName ?? 'Sin espacio')
              : occurrence.segments.map((segment) => segment.groupName ?? 'Sin grupo');
    for (const label of new Set(labels.length > 0 ? labels : ['Sin asignar'])) {
      const list = groups.get(label) ?? [];
      if (!list.some((item) => item.key === occurrence.key)) list.push(occurrence);
      groups.set(label, list);
    }
  }
  return (
    <div className="stack gap-16">
      {[...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'es'))
        .map(([label, entries]) => (
          <section className="panel" key={label}>
            <div className="panel-head">
              <h2>{label}</h2>
              <span className="tiny muted">{entries.length} jornadas</span>
            </div>
            <div className="grouped-day-list">
              {entries
                .sort((a, b) => a.startMinute - b.startMinute)
                .map((occurrence) => (
                  <button
                    className="grouped-day-row"
                    type="button"
                    key={occurrence.key}
                    onClick={() => onSelect(occurrence)}
                  >
                    <span className="tabular">
                      {minutesToTime(occurrence.startMinute)}–{minutesToTime(occurrence.endMinute)}
                    </span>
                    <strong>{occurrence.patientName}</strong>
                    <span className="muted">
                      {[...new Set(occurrence.segments.map((segment) => segment.serviceName))].join(
                        ' · ',
                      )}
                    </span>
                    {occurrence.conflictCount > 0 ? (
                      <span className="badge" data-tone="ink">
                        {occurrence.conflictCount} conflictos
                      </span>
                    ) : null}
                  </button>
                ))}
            </div>
          </section>
        ))}
    </div>
  );
}
