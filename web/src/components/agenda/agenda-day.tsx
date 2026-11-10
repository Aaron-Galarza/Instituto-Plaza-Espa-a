'use client';

import { minutesToTime, type ScheduleOccurrence } from '@plaza/shared';
import { Button, EmptyState } from '@/components/ui';
import { shortDate } from '@/lib/format';
import { useHourBounds, layoutEvents } from './agenda-layout';

export function DayView({
  date,
  occurrences,
  onSelect,
  onOpenDay,
}: {
  date: string;
  occurrences: ScheduleOccurrence[];
  onSelect: (occurrence: ScheduleOccurrence) => void;
  onOpenDay: () => void;
}) {
  const { startHour, endHour } = useHourBounds(occurrences);
  const hours = endHour - startHour;
  const pixelPerMinute = 64 / 60;
  const height = hours * 64;

  if (occurrences.length === 0) {
    return (
      <EmptyState
        title="Sin jornadas para esta fecha"
        description="Cambiá de día o creá una nueva recurrencia para comenzar a planificar."
        action={
          <Button size="sm" onClick={onOpenDay}>
            Ver el día
          </Button>
        }
      />
    );
  }

  const laidOut = layoutEvents(occurrences);

  return (
    <div className="timeline" aria-label={`Agenda del ${shortDate(date)}`}>
      <div className="timeline-inner" style={{ height }}>
        {Array.from({ length: hours }).map((_, index) => (
          <div
            key={`row-${index}`}
            className="hour-row"
            style={{ position: 'absolute', left: 0, right: 0, top: index * 64 }}
            aria-hidden="true"
          />
        ))}
        {Array.from({ length: hours + 1 }).map((_, index) => (
          <span
            key={`label-${index}`}
            className="hour-label"
            style={{ top: (startHour + index) * 64 }}
            aria-hidden="true"
          >
            {minutesToTime((startHour + index) * 60)}
          </span>
        ))}
        <div className="timeline-lane" style={{ height }}>
          {laidOut.map((event) => {
            const top = Math.max(0, (event.startMinute - startHour * 60) * pixelPerMinute);
            const eventHeight = Math.max(
              28,
              (event.endMinute - event.startMinute) * pixelPerMinute,
            );
            const width = `calc(${100 / event.columns}% - 5px)`;
            const left = `calc(${(event.column / event.columns) * 100}% + 2px)`;
            const serviceNames = Array.from(
              new Set(event.segments.map((segment) => segment.serviceName)),
            ).join(' · ');
            const professionalColors = Array.from(
              new Set(
                event.segments.flatMap((segment) =>
                  segment.professionals.map((professional) => professional.color),
                ),
              ),
            );
            return (
              <button
                key={event.key}
                type="button"
                className="event"
                data-status={event.status}
                data-has-conflict={event.conflictCount > 0}
                style={{ top, height: eventHeight, left, width }}
                onClick={() => onSelect(event)}
                aria-label={`${event.patientName}, ${minutesToTime(event.startMinute)} a ${minutesToTime(event.endMinute)}`}
              >
                <span className="event-time">
                  {minutesToTime(event.startMinute)}–{minutesToTime(event.endMinute)}
                </span>
                <span className="event-name">{event.patientName}</span>
                <span className="event-service">
                  {serviceNames}
                  {event.conflictCount > 0 ? ' · ⚠' : ''}
                </span>
                {professionalColors.length > 0 ? (
                  <span className="event-bars" aria-hidden="true">
                    {professionalColors.slice(0, 5).map((color, index) => (
                      <span key={`${color}-${index}`} style={{ color }} />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
