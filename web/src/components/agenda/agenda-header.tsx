'use client';

import { WEEKDAY_SHORT_LABELS, formatMonth, isoWeekday, type ScheduleSummary } from '@plaza/shared';
import { Button, IconButton, Input } from '@/components/ui';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@/components/icons';
import { dayNumber, shortDate, today } from '@/lib/format';
import type { AgendaViewMode } from './agenda-types';

export function AgendaHeader({ scope, view, date, range, summary, canWrite, canCreate, onView, onDate, onNavigate, onOpenNew }: {
  scope: 'all' | 'own'; view: AgendaViewMode; date: string; range: { from: string; to: string };
  summary: ScheduleSummary; canWrite: boolean; canCreate: boolean;
  onView: (view: AgendaViewMode) => void; onDate: (date: string) => void;
  onNavigate: (direction: -1 | 1) => void; onOpenNew: () => void;
}) {
  return (
    <>
      <div className="agenda-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: 10 }}>
            {scope === 'own' ? 'Mi agenda profesional' : 'Planificación institucional'}
          </p>
          <div className="date-display">
            <span className="day-number" aria-hidden="true">
              {view === 'month' ? String(Number(date.slice(5, 7))) : dayNumber(range.from)}
            </span>
            <div className="date-meta">
              <span className="month-name">
                {view === 'month' ? formatMonth(date) : formatMonth(range.from)}
              </span>
              <span className="year">
                {view === 'day'
                  ? `${WEEKDAY_SHORT_LABELS[isoWeekday(date)]} · ${shortDate(date)}`
                  : view === 'week'
                    ? `Semana del ${shortDate(range.from)} al ${shortDate(range.to)}`
                    : `${shortDate(range.from)} — ${shortDate(range.to)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="toolbar">
          <div className="segmented" role="group" aria-label="Vista de agenda">
            {(['day', 'week', 'month'] as const).map((option) => (
              <button
                key={option}
                type="button"
                data-active={view === option}
                onClick={() => onView(option)}
                aria-pressed={view === option}
              >
                {option === 'day' ? 'Día' : option === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <IconButton label="Período anterior" onClick={() => onNavigate(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          <Button size="sm" onClick={() => onDate(today())}>
            Hoy
          </Button>
          <IconButton label="Período siguiente" onClick={() => onNavigate(1)}>
            <ChevronRightIcon />
          </IconButton>
          <Input
            type="date"
            value={date}
            onChange={(event) => {
              if (event.target.value) onDate(event.target.value);
            }}
            aria-label="Ir a una fecha"
            style={{ width: 148 }}
          />
          {canWrite ? (
            <Button variant="primary" onClick={() => onOpenNew()} disabled={!canCreate}>
              <PlusIcon /> Nueva jornada
            </Button>
          ) : null}
        </div>
      </div>

      <div className="agenda-summary" aria-label="Resumen del período">
        <div className="summary-item">
          <strong>{summary.occurrences}</strong>
          <span>Jornadas</span>
        </div>
        <div className="summary-item">
          <strong>{summary.patients}</strong>
          <span>Pacientes</span>
        </div>
        <div className="summary-item">
          <strong>{summary.services}</strong>
          <span>Tramos de prestación</span>
        </div>
        <div className="summary-item">
          <strong>{summary.professionals}</strong>
          <span>Profesionales</span>
        </div>
        <div className="summary-item">
          <strong style={summary.errors > 0 ? { color: 'var(--ink)' } : undefined}>
            {summary.errors}
          </strong>
          <span>Conflictos bloqueantes</span>
        </div>
        <div className="summary-item">
          <strong>{summary.warnings}</strong>
          <span>Advertencias</span>
        </div>
      </div>

    </>
  );
}
