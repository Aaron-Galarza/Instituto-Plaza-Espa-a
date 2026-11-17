'use client';

import type { ScheduleOccurrence } from '@plaza/shared';
import { Button } from '@/components/ui';
import { timeRange } from '@/lib/format';
import { useGroupBlockParticipants } from './use-group-block-participants';

function GroupBlockAction({ occurrence, segment, onGroupBlock }: {
  occurrence: ScheduleOccurrence;
  segment: ScheduleOccurrence['segments'][number];
  onGroupBlock: (segmentId: string) => void;
}) {
  const { participants, matching } = useGroupBlockParticipants(occurrence, segment);
  if (participants.isLoading || participants.isError) return null;
  if (matching.length === 0) return null;
  if (matching.length === 1) {
    return <p className="tiny muted" style={{ margin: '9px 0 0' }}>
      Este bloque tiene un solo paciente. Para cambiarlo, usá «Modificar solo esta fecha».
    </p>;
  }
  return <Button size="sm" onClick={() => onGroupBlock(segment.id)}>
    Cambiar tramo grupal de esta fecha · {matching.length} pacientes
  </Button>;
}

export function OccurrenceSegments({ occurrence, canWrite, onGroupBlock }: {
  occurrence: ScheduleOccurrence; canWrite: boolean; onGroupBlock: (segmentId: string) => void;
}) {
  return (
          <section>
            <h3 className="section-title">Tramos de atención</h3>
            <div className="stack gap-8">
              {occurrence.segments.map((segment) => (
                <div className="segment" key={segment.id}>
                  <div className="segment-head">
                    <strong>{segment.serviceName}</strong>
                    <span className="tiny muted tabular">
                      {timeRange(segment.startMinute, segment.endMinute)}
                    </span>
                  </div>
                  <div className="tiny muted">
                    {segment.modality === 'individual'
                      ? 'Individual'
                      : segment.modality === 'group'
                        ? 'Grupal'
                        : 'Compartida'}
                    {segment.groupName ? ` · ${segment.groupName}` : ''}
                    {segment.spaceName ? ` · ${segment.spaceName}` : ''}
                  </div>
                  <div className="row gap-8" style={{ flexWrap: 'wrap', marginTop: 7 }}>
                    {segment.professionals.length > 0 ? (
                      segment.professionals.map((professional) => (
                        <span className="badge" key={professional.id}>
                          <span
                            className="dot"
                            style={{ color: professional.color }}
                            aria-hidden="true"
                          />
                          <a href={`/profesionales?professionalId=${professional.id}`}>
                            {professional.name}
                          </a>
                        </span>
                      ))
                    ) : (
                      <span className="tiny muted">Sin profesional asignado</span>
                    )}
                  </div>
                  {segment.notes ? (
                    <p className="tiny muted" style={{ margin: '7px 0 0' }}>
                      {segment.notes}
                    </p>
                  ) : null}
                  {canWrite && segment.groupId ? (
                    <GroupBlockAction occurrence={occurrence} segment={segment}
                      onGroupBlock={onGroupBlock} />
                  ) : null}
                </div>
              ))}
            </div>
          </section>

  );
}
