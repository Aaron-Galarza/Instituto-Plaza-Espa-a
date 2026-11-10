'use client';

import { Field, Input, Select } from '@/components/ui';

export function UserFilters({ search, role, status, roleOptions, onSearch, onRole, onStatus }: {
  search: string; role: string; status: string; roleOptions: { value: string; label: string }[];
  onSearch: (value: string) => void; onRole: (value: string) => void; onStatus: (value: string) => void;
}) {
  return (
      <div className="filters" role="group" aria-label="Filtros de usuarios">
        <Field label="Buscar">
          <Input
            type="search"
            value={search}
            placeholder="Nombre o correo"
            onChange={(event) => onSearch(event.target.value)}
          />
        </Field>
        <Field label="Rol">
          <Select
            value={role}
            onChange={(event) => onRole(event.target.value)}
          >
            <option value="">Todos</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
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
      </div>
  );
}
