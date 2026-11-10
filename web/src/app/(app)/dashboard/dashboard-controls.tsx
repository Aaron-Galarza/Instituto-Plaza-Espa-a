'use client';

import { addMonths } from '@plaza/shared';
import { Field, Input, PageHeader } from '@/components/ui';
import { monthRange, shortDate, today, weekRange } from '@/lib/format';

export function DashboardControls({ from, to, setFrom, setTo }: {
  from: string; to: string; setFrom: (value: string) => void; setTo: (value: string) => void;
}) {
  const moveMonth = (direction: -1 | 1) => {
    const next = monthRange(addMonths(from, direction));
    setFrom(next.from);
    setTo(next.to);
  };
  return (
    <>
      <PageHeader
        eyebrow="Dirección"
        title="Tablero"
        lede="Lectura global de la actividad planificada: pacientes, jornadas, prestaciones, profesionales, espacios y conflictos."
        actions={
          <div className="toolbar">
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => {
                const current = today();
                setFrom(current);
                setTo(current);
              }}
            >
              Hoy
            </button>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => {
                const current = weekRange(today());
                setFrom(current.from);
                setTo(current.to);
              }}
            >
              Semana actual
            </button>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => moveMonth(-1)}
            >
              Mes anterior
            </button>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => {
                const current = monthRange(today());
                setFrom(current.from);
                setTo(current.to);
              }}
            >
              Mes actual
            </button>
            <button className="btn btn-secondary btn-sm" type="button" onClick={() => moveMonth(1)}>
              Mes siguiente
            </button>
          </div>
        }
      />

      <div className="filters" role="group" aria-label="Rango del tablero">
        <Field label="Desde">
          <Input
            type="date"
            value={from}
            max={to}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              setFrom(value);
              if (value > to) setTo(value);
            }}
          />
        </Field>
        <Field label="Hasta">
          <Input
            type="date"
            value={to}
            min={from}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              setTo(value);
              if (value < from) setFrom(value);
            }}
          />
        </Field>
        <div className="stack" style={{ justifyContent: 'flex-end' }}>
          <span className="tiny muted">
            {shortDate(from)} — {shortDate(to)}
          </span>
        </div>
      </div>

    </>
  );
}
