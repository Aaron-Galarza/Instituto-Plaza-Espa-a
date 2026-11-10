'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Field, Input, Select } from '@/components/ui';
import type { JourneyReference } from './journey-builder';
import type { AgendaFilters as FilterValues, AgendaViewMode, DayGrouping } from './agenda-types';

export function AgendaFilters({ filters, setFilters, view, dayGrouping, setDayGrouping, scope, reference, searchInput, setSearchInput, includeCancelled, setIncludeCancelled }: {
  filters: FilterValues; setFilters: Dispatch<SetStateAction<FilterValues>>; view: AgendaViewMode;
  dayGrouping: DayGrouping; setDayGrouping: (value: DayGrouping) => void; scope: 'all' | 'own';
  reference: JourneyReference | null; searchInput: string; setSearchInput: (value: string) => void;
  includeCancelled: boolean; setIncludeCancelled: (value: boolean) => void;
}) {
  return (
          <div className="filters" role="group" aria-label="Filtros de agenda">
            <Field label="Paciente">
              <Select
                value={filters.patientId}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, patientId: event.target.value }))
                }
              >
                <option value="">Todos los pacientes</option>
                {(reference?.patients ?? []).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.lastName}, {patient.firstName}
                  </option>
                ))}
              </Select>
            </Field>
            {view === 'day' ? (
              <Field label="Agrupar por">
                <Select
                  value={dayGrouping}
                  onChange={(event) => setDayGrouping(event.target.value as DayGrouping)}
                >
                  <option value="time">Horario</option>
                  <option value="patient">Paciente</option>
                  <option value="professional">Profesional</option>
                  <option value="service">Prestación</option>
                  <option value="space">Espacio</option>
                  <option value="group">Grupo</option>
                </Select>
              </Field>
            ) : null}
            {scope === 'all' ? (
              <Field label="Profesional">
                <Select
                  value={filters.professionalId}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, professionalId: event.target.value }))
                  }
                >
                  <option value="">Todos los profesionales</option>
                  {(reference?.professionals ?? [])
                    .filter((professional) => professional.status === 'active')
                    .map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.firstName} {professional.lastName}
                      </option>
                    ))}
                </Select>
              </Field>
            ) : null}
            <Field label="Prestación">
              <Select
                value={filters.serviceId}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, serviceId: event.target.value }))
                }
              >
                <option value="">Todas las prestaciones</option>
                {(reference?.services ?? [])
                  .filter((service) => service.status === 'active')
                  .map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Espacio">
              <Select
                value={filters.spaceId}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, spaceId: event.target.value }))
                }
              >
                <option value="">Todos los espacios</option>
                {(reference?.spaces ?? [])
                  .filter((space) => space.status === 'active')
                  .map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Grupo">
              <Select
                value={filters.groupId}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, groupId: event.target.value }))
                }
              >
                <option value="">Todos los grupos</option>
                {(reference?.groups ?? [])
                  .filter((group) => group.status === 'active')
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Buscar">
              <Input
                type="search"
                value={searchInput}
                placeholder="Paciente, profesional, servicio…"
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </Field>
            <div className="stack" style={{ justifyContent: 'flex-end', paddingBottom: 3 }}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={includeCancelled}
                  onChange={(event) => setIncludeCancelled(event.target.checked)}
                />
                Incluir canceladas
              </label>
            </div>
          </div>

  );
}
