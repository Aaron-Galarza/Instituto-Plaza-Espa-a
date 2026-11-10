'use client';

import { PROFESSIONAL_COLORS } from '@plaza/shared';
import { Field, Input, Select } from '@/components/ui';

export function ProfessionalFilters({ search, status, onSearch, onStatus }: {
  search: string; status: string; onSearch: (value: string) => void; onStatus: (value: string) => void;
}) {
  return (
      <div className="filters" role="group" aria-label="Filtros de profesionales">
        <Field label="Buscar">
          <Input
            type="search"
            value={search}
            placeholder="Nombre, apellido o especialidad"
            onChange={(event) => onSearch(event.target.value)}
          />
        </Field>
        <Field label="Estado">
          <Select
            value={status}
            onChange={(event) => onStatus(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </Select>
        </Field>
        <div className="stack" style={{ justifyContent: 'flex-end' }}>
          <span className="tiny muted">
            {PROFESSIONAL_COLORS.length} colores disponibles para distinguir agendas.
          </span>
        </div>
      </div>
  );
}
