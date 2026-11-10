'use client';

import { Button, PageHeader } from '@/components/ui';
import { PlusIcon } from '@/components/icons';

export function ProfessionalHeader({ canWrite, onNew }: { canWrite: boolean; onNew: () => void }) {
  return (
      <PageHeader
        eyebrow="Personas"
        title="Profesionales"
        lede="Equipo de rehabilitación, especialidades y disponibilidad. El color asignado ordena la lectura de la agenda."
        actions={
          canWrite ? (
            <Button
              variant="primary"
              onClick={onNew}
            >
              <PlusIcon /> Nuevo profesional
            </Button>
          ) : null
        }
      />
  );
}
