'use client';

import type { Insurer, PaginatedResult } from '@plaza/shared';
import { CatalogTable, type CatalogColumn } from '@/components/catalog-table';

const columns: CatalogColumn<Insurer>[] = [
  { header: 'Nombre', className: 'row-title', render: (item) => item.name },
  { header: 'Código', render: (item) => item.code ?? '—' },
  { header: 'Descripción', className: 'muted', render: (item) => item.description ?? '—' },
];

export function InsurersTable({ data, canWrite, onEdit, onToggle, onDelete, toggleBusy, onPage }: {
  data: PaginatedResult<Insurer>; canWrite: boolean; onEdit: (item: Insurer) => void;
  onToggle: (item: Insurer) => void; onDelete: (item: Insurer) => void;
  toggleBusy: boolean; onPage: (page: number) => void;
}) {
  return <CatalogTable data={data} columns={columns} canWrite={canWrite}
    onEdit={onEdit} onToggle={onToggle} onDelete={onDelete}
    toggleBusy={toggleBusy} onPage={onPage} />;
}
