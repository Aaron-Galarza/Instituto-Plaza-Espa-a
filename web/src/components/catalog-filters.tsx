'use client';

import { Field, Input, Select } from './ui';

export function CatalogFilters({ label, placeholder, search, status, onSearch, onStatus }: {
  label: string;
  placeholder: string;
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
}) {
  return (
    <div className="filters" role="group" aria-label={`Filtros de ${label}`}>
      <Field label="Buscar">
        <Input type="search" value={search} placeholder={placeholder}
          onChange={(event) => onSearch(event.target.value)} />
      </Field>
      <Field label="Estado">
        <Select value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </Select>
      </Field>
    </div>
  );
}
