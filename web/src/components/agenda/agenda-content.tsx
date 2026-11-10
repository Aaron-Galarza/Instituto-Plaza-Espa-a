'use client';

import type { ScheduleOccurrence } from '@plaza/shared';
import { Button, ErrorBox, LoadingBlock } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import { DayView } from './agenda-day';
import { GroupedDayView } from './agenda-grouped-day';
import { WeekView } from './agenda-week';
import { MonthView } from './agenda-month';
import type { AgendaViewMode, DayGrouping } from './agenda-types';

export function AgendaContent({ scheduleQuery, view, dayGrouping, date, range, byDate, setSelected, setView, setDate }: {
  scheduleQuery: { isError: boolean; isLoading: boolean; error: Error | null; refetch: () => unknown };
  view: AgendaViewMode; dayGrouping: DayGrouping; date: string; range: { from: string; to: string };
  byDate: Map<string, ScheduleOccurrence[]>; setSelected: (item: ScheduleOccurrence) => void;
  setView: (view: AgendaViewMode) => void; setDate: (date: string) => void;
}) {
  return (
    <>
          {scheduleQuery.isError ? (
            <div className="stack gap-8">
              <ErrorBox message={errorMessage(scheduleQuery.error)} />
              <Button size="sm" onClick={() => void scheduleQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : scheduleQuery.isLoading ? (
            <LoadingBlock rows={6} />
          ) : view === 'day' ? (
            dayGrouping === 'time' ? (
              <DayView
                date={date}
                occurrences={byDate.get(date) ?? []}
                onSelect={setSelected}
                onOpenDay={() => setView('day')}
              />
            ) : (
              <GroupedDayView
                occurrences={byDate.get(date) ?? []}
                grouping={dayGrouping}
                onSelect={setSelected}
              />
            )
          ) : view === 'week' ? (
            <WeekView
              from={range.from}
              to={range.to}
              byDate={byDate}
              onSelect={setSelected}
              onOpenDay={(day) => {
                setDate(day);
                setView('day');
              }}
            />
          ) : (
            <MonthView
              date={date}
              byDate={byDate}
              onOpenDay={(day) => {
                setDate(day);
                setView('day');
              }}
              onSelect={setSelected}
            />
          )}

          <div className="legend" aria-label="Referencias visuales">
            <span>
              <i data-kind="scheduled" /> Programada
            </span>
            <span>
              <i data-kind="modified" /> Modificada
            </span>
            <span>
              <i data-kind="pending" /> Por resolver
            </span>
            <span>
              <i data-kind="cancelled" /> Cancelada
            </span>
            <span>El borde oscuro indica conflictos.</span>
          </div>
    </>
  );
}
