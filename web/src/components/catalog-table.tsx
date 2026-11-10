'use client';

import type { ReactNode } from 'react';
import type { PaginatedResult } from '@plaza/shared';
import { Button, IconButton, Pagination, StatusBadge } from './ui';
import { EditIcon, TrashIcon } from './icons';

export interface CatalogColumn<T> {
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export function CatalogTable<T extends { id: string; name: string; status: 'active' | 'inactive' }>({
  data, columns, canWrite, onEdit, onToggle, onDelete, toggleBusy, onPage,
}: {
  data: PaginatedResult<T>;
  columns: CatalogColumn<T>[];
  canWrite: boolean;
  onEdit: (item: T) => void;
  onToggle: (item: T) => void;
  onDelete: (item: T) => void;
  toggleBusy: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => <th key={column.header}>{column.header}</th>)}
              <th>Estado</th>
              {canWrite ? <th aria-label="Acciones" /> : null}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id}>
                {columns.map((column) => (
                  <td key={column.header} className={column.className}>{column.render(item)}</td>
                ))}
                <td><StatusBadge status={item.status} /></td>
                {canWrite ? (
                  <td>
                    <div className="row gap-4" style={{ justifyContent: 'flex-end' }}>
                      <IconButton label={`Editar ${item.name}`} onClick={() => onEdit(item)}>
                        <EditIcon />
                      </IconButton>
                      <Button size="sm" variant="ghost" onClick={() => onToggle(item)} disabled={toggleBusy}>
                        {item.status === 'active' ? 'Desactivar' : 'Activar'}
                      </Button>
                      <IconButton label={`Eliminar ${item.name}`} onClick={() => onDelete(item)}>
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel-pad">
        <Pagination
          page={data.page} pageSize={data.pageSize} total={data.total}
          totalPages={data.totalPages} onPage={onPage}
        />
      </div>
    </>
  );
}
