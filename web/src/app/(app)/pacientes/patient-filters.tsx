'use client';

import type { Insurer } from '@plaza/shared';
import { Field, Input, Select } from '@/components/ui';

export function PatientFilters({ search, status, insurerId, insurers, onSearch, onStatus, onInsurer }: {
  search: string; status: string; insurerId: string; insurers: Insurer[];
  onSearch: (value: string) => void; onStatus: (value: string) => void; onInsurer: (value: string) => void;
}) {
  return (
      <div className="filters" role="group" aria-label="Filtros de pacientes">
        <Field label="Buscar">
          <Input
            type="search"
            value={search}
            placeholder="Nombre, apellido o documento"
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
        <Field label="Obra social">
          <Select
            value={insurerId}
            onChange={(event) => onInsurer(event.target.value)}
          >
            <option value="">Todas</option>
            {(insurers).map((insurer) => (
              <option key={insurer.id} value={insurer.id}>
                {insurer.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
  );
}
