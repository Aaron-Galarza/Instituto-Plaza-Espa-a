'use client';

import { useMemo } from 'react';
import { WEEKDAY_SHORT_LABELS, isoWeekday, minutesToTime, type ScheduleOccurrence } from '@plaza/shared';
import { dayNumber, shortDate, today } from '@/lib/format';
import { useHourBounds, layoutEvents } from './agenda-layout';

const MONTH_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

export function WeekView({
  from,
  to,
  byDate,
  onSelect,
  onOpenDay,
}: {
  from: string;
  to: string;
  byDate: Map<string, ScheduleOccurrence[]>;
  onSelect: (occurrence: ScheduleOccurrence) => void;
  onOpenDay: (date: string) => void;
}) {
  const days = useMemo(() => {
    const list: string[] = [];
    let cursor = from;
    let guard = 0;
    while (cursor <= to && guard < 7) {
      list.push(cursor);
      const [year, month, day] = cursor.split('-').map(Number) as [number, number, number];
      const next = new Date(Date.UTC(year, month - 1, day + 1));
      cursor = next.toISOString().slice(0, 10);
      guard += 1;
    }
    return list;
  }, [from, to]);

  const all = days.flatMap((day) => byDate.get(day) ?? []);
  const { startHour, endHour } = useHourBounds(all);
  const hours = endHour - startHour;
  const height = hours * 60;
  const pixelPerMinute = 1;
  const todayValue = today();

  return (
    <div className="week-shell">
      <div className="week-header">
        <div className="week-corner" />
        {days.map((day) => (
          <button
            key={day}
            type="button"
            className="week-head"
            data-today={day === todayValue}
            onClick={() => onOpenDay(day)}
            aria-label={`Ver el día ${shortDate(day)}`}
          >
            <span>{WEEKDAY_SHORT_LABELS[isoWeekday(day)]}</span>
            <strong>{dayNumber(day)}</strong>
            <span>
              {MONTH_SHORT[Number(day.slice(5, 7)) - 1]} · {shortDate(day).slice(6)}
            </span>
          </button>
        ))}
      </div>
      <div className="week-scroll">
        <div className="week-bodygrid" style={{ height }}>
          <div className="week-times" style={{ height }}>
            {Array.from({ length: hours + 1 }).map((_, index) => (
              <span
                key={`week-time-${index}`}
                className="week-time-label"
                style={{ top: index * 60 }}
                aria-hidden="true"
              >
                {minutesToTime((startHour + index) * 60)}
              </span>
            ))}
          </div>
          {days.map((day) => {
            const events = byDate.get(day) ?? [];
            const laidOut = layoutEvents(events);
            return (
              <div className="week-lane" key={day} style={{ height }}>
                {laidOut.map((event) => {
                  const top = Math.max(0, (event.startMinute - startHour * 60) * pixelPerMinute);
                  const eventHeight = Math.max(
                    22,
                    (event.endMinute - event.startMinute) * pixelPerMinute,
                  );
                  const width = `calc(${100 / event.columns}% - 4px)`;
                  const left = `calc(${(event.column / event.columns) * 100}% + 2px)`;
                  return (
                    <button
                      key={event.key}
                      type="button"
                      className="week-event"
                      data-status={event.status}
                      data-conflict={event.conflictCount > 0}
                      style={{ top, height: eventHeight, left, width }}
                      onClick={() => onSelect(event)}
                      aria-label={`${event.patientName}, ${minutesToTime(event.startMinute)} a ${minutesToTime(event.endMinute)}`}
                    >
                      <strong>{event.patientName}</strong>
                      <span>
                        {minutesToTime(event.startMinute)} ·{' '}
                        {event.segments.map((segment) => segment.serviceName).join(' / ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
