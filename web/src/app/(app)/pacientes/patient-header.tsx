'use client';

import { Button, PageHeader } from '@/components/ui';
import { PlusIcon } from '@/components/icons';

export function PatientHeader({ canWrite, onNew }: { canWrite: boolean; onNew: () => void }) {
  return (
      <PageHeader
        eyebrow="Personas"
        title="Pacientes"
        lede="Personas que reciben prestaciones en el instituto. Los datos clínicos no forman parte de este sistema."
        actions={
          canWrite ? (
            <Button
              variant="primary"
              onClick={onNew}
            >
              <PlusIcon /> Nuevo paciente
            </Button>
          ) : null
        }
      />
  );
}
