'use client';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { IconButton } from './ui-controls';

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="spread" style={{ padding: '10px 2px 0' }}>
      <span className="tiny muted tabular">
        {from}–{to} de {total}
      </span>
      <div className="row gap-4">
        <IconButton label="Página anterior" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeftIcon />
        </IconButton>
        <span
          className="tiny muted tabular"
          style={{ alignSelf: 'center', minWidth: 52, textAlign: 'center' }}
        >
          {page} / {totalPages}
        </span>
        <IconButton
          label="Página siguiente"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRightIcon />
        </IconButton>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal & drawer
// ---------------------------------------------------------------------------
