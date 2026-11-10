import { WEEKDAY_SHORT_LABELS, TRANSPORT_MODE_LABELS, type ScheduleOccurrence, type ScheduleRule, type Patient, type Insurer } from '@plaza/shared';
import { StatusBadge } from '@/components/ui';
import { AlertIcon } from '@/components/icons';
import { dateLabel, timeRange } from '@/lib/format';

export function OccurrenceOverview({ occurrence, rule, patient, insurer }: {
  occurrence: ScheduleOccurrence; rule?: ScheduleRule; patient?: Patient; insurer?: Insurer;
}) {
  return (
    <>
          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            <StatusBadge status={occurrence.status} />
            {occurrence.conflictCount > 0 ? (
              <span className="badge" data-tone="ink">
                <AlertIcon /> {occurrence.conflictCount} conflicto
                {occurrence.conflictCount === 1 ? '' : 's'}
              </span>
            ) : null}
            {occurrence.exceptionReason ? (
              <span className="badge" data-tone="mist">
                {occurrence.exceptionReason}
              </span>
            ) : null}
          </div>

          <dl className="detail-list">
            <div className="detail-row">
              <dt>Paciente</dt>
              <dd>{occurrence.patientName}</dd>
            </div>
            <div className="detail-row">
              <dt>Fecha</dt>
              <dd>{dateLabel(occurrence.date)}</dd>
            </div>
            <div className="detail-row">
              <dt>Horario</dt>
              <dd className="tabular">{timeRange(occurrence.startMinute, occurrence.endMinute)}</dd>
            </div>
            <div className="detail-row">
              <dt>Recurrencia</dt>
              <dd>
                {rule ? (
                  <>
                    Versión {rule.version} ·{' '}
                    {rule.daysOfWeek.map((day) => WEEKDAY_SHORT_LABELS[day]).join(' · ')}
                    <span className="tiny muted" style={{ display: 'block' }}>
                      Desde {dateLabel(rule.effectiveFrom)}
                      {rule.effectiveTo
                        ? ` hasta ${dateLabel(rule.effectiveTo)}`
                        : ' · sin fecha de fin'}
                    </span>
                  </>
                ) : (
                  <span className="muted">Cargando recurrencia…</span>
                )}
              </dd>
            </div>
          </dl>

          <section>
            <h3 className="section-title">Ficha administrativa</h3>
            <dl className="detail-list">
              <div className="detail-row">
                <dt>Documento</dt>
                <dd>{patient?.document || '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>Obra social</dt>
                <dd>{insurer?.name || 'Sin cobertura cargada'}</dd>
              </div>
              <div className="detail-row">
                <dt>Traslado</dt>
                <dd>{patient ? TRANSPORT_MODE_LABELS[patient.transportMode] : '—'}</dd>
              </div>
              <div className="detail-row">
                <dt>Contacto</dt>
                <dd>{patient?.phone || '—'}</dd>
              </div>
            </dl>
            <a
              className="btn btn-secondary btn-sm"
              href={`/pacientes?patientId=${occurrence.patientId}`}
            >
              Ver paciente
            </a>
          </section>

    </>
  );
}
