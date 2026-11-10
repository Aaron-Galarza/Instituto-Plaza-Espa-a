'use client';

import type { ScheduleRule } from '@plaza/shared';
import { Button } from '@/components/ui';
import { EditIcon, PlusIcon, TrashIcon } from '@/components/icons';
import type { PanelMode } from './occurrence-types';

export function OccurrenceActions({ canWrite, rule, onMode }: {
  canWrite: boolean; rule?: ScheduleRule; onMode: (mode: PanelMode) => void;
}) {
  return (
    <>
          {canWrite ? (
            <section>
              <h3 className="section-title">Acciones sobre la recurrencia</h3>
              <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                <Button size="sm" onClick={() => onMode('edit-date')} disabled={!rule}>
                  <EditIcon /> Modificar solo esta fecha
                </Button>
                {rule && rule.daysOfWeek.length > 1 ? (
                  <Button size="sm" onClick={() => onMode('edit-weekday')}>
                    Cambiar este día semanal desde ahora
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => onMode('edit-future')} disabled={!rule}>
                  <PlusIcon /> Cambiar toda la recurrencia desde ahora
                </Button>
                <Button size="sm" onClick={() => onMode('finish')} disabled={!rule}>
                  Finalizar
                </Button>
                <Button size="sm" onClick={() => onMode('cancel')} disabled={!rule}>
                  Cancelar serie
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMode('delete')}
                  disabled={!rule}
                >
                  <TrashIcon /> Eliminar
                </Button>
              </div>
              <p className="tiny muted" style={{ margin: '9px 0 0' }}>
                Una fecha se guarda como excepción. Los cambios semanales o de toda la recurrencia
                afectan las jornadas siguientes desde la fecha elegida.
              </p>
            </section>
          ) : null}
    </>
  );
}
