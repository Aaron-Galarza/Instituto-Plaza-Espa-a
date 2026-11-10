'use client';

import { WEEKDAY_SHORT_LABELS, minutesToTime, type ScheduleOccurrence } from '@plaza/shared';
import { dayNumber, monthGrid, shortDate, today } from '@/lib/format';

export function MonthView({
  date,
  byDate,
  onOpenDay,
  onSelect,
}: {
  date: string;
  byDate: Map<string, ScheduleOccurrence[]>;
  onOpenDay: (date: string) => void;
  onSelect: (occurrence: ScheduleOccurrence) => void;
}) {
  const days = monthGrid(date);
  const month = date.slice(0, 7);
  const todayValue = today();
  const weekdays = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="month-wrap">
      <div className="month-grid">
        {weekdays.map((day) => (
          <div className="month-weekday" key={day}>
            {WEEKDAY_SHORT_LABELS[day]}
          </div>
        ))}
        {days.map((day) => {
          const items = byDate.get(day) ?? [];
          const outside = day.slice(0, 7) !== month;
          return (
            <div
              className="month-day"
              key={day}
              data-outside={outside}
              data-today={day === todayValue}
            >
              <div className="month-date">
                <button
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={`Ver el día ${shortDate(day)}`}
                  style={{
                    border: 0,
                    background: 'transparent',
                    padding: 0,
                    font: 'inherit',
                    fontWeight: 650,
                    color: 'inherit',
                  }}
                >
                  {dayNumber(day)}
                </button>
                {items.length > 0 ? <span className="tiny muted">{items.length}</span> : null}
              </div>
              {items.slice(0, 3).map((occurrence) => (
                <button
                  type="button"
                  key={occurrence.key}
                  className="month-chip"
                  data-status={occurrence.status}
                  onClick={() => onSelect(occurrence)}
                  title={`${minutesToTime(occurrence.startMinute)} ${occurrence.patientName}`}
                >
                  {minutesToTime(occurrence.startMinute)} {occurrence.patientName}
                </button>
              ))}
              {items.length > 3 ? (
                <button
                  type="button"
                  className="month-chip"
                  onClick={() => onOpenDay(day)}
                  style={{
                    background: 'transparent',
                    borderLeftColor: 'var(--slate)',
                    color: 'var(--slate)',
                  }}
                >
                  +{items.length - 3} más
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
