'use client';

import type { Professional } from '@plaza/shared';
import { ConfirmDialog } from '@/components/ui';

export function ProfessionalDeleteDialog({ professional, busy, onCancel, onConfirm }: {
  professional: Professional | null; busy: boolean; onCancel: () => void; onConfirm: (item: Professional) => void;
}) {
  return (
      <ConfirmDialog
        open={Boolean(professional)}
        title="Eliminar profesional"
        description={
          professional
            ? `Se intentará eliminar a ${professional.firstName} ${professional.lastName}. Si tiene jornadas, disponibilidad o grupos asociados, el sistema lo impedirá.`
            : ''
        }
        confirmLabel="Eliminar"
        busy={busy}
        onCancel={onCancel}
        onConfirm={() => {
          if (professional) onConfirm(professional);
        }}
      />
  );
}
