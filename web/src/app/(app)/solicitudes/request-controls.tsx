import { CHANGE_REQUEST_TYPE_LABELS, type ChangeRequestStatus, type ChangeRequestType } from '@plaza/shared';
import { Button, Field, PageHeader, Select } from '@/components/ui';
import { ClipboardIcon } from '@/components/icons';

export type StatusTab = ChangeRequestStatus | 'all';

const STATUS_TABS: Array<{ value: StatusTab; label: string }> = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'all', label: 'Todas' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'cancelled', label: 'Canceladas' },
];
const TYPE_OPTIONS = Object.entries(CHANGE_REQUEST_TYPE_LABELS) as Array<[ChangeRequestType, string]>;

interface Props {
  status: StatusTab;
  type: string;
  mineOnly: boolean;
  canResolve: boolean;
  isProfessional: boolean;
  pendingCount: number;
  onStatus: (value: StatusTab) => void;
  onType: (value: string) => void;
  onMineOnly: (value: boolean) => void;
  onReset: () => void;
}

export function RequestControls(props: Props) {
  return (
    <>
      <PageHeader eyebrow="Planificación" title="Solicitudes" lede="Pedidos de cambio sobre una fecha concreta de la agenda. La aprobación se valida contra conflictos, cupos y disponibilidad antes de modificar la planificación." />
      <div className="notice" style={{ marginBottom: 18 }}>
        <div className="row gap-8" style={{ alignItems: 'flex-start' }}>
          <ClipboardIcon style={{ width: 16, height: 16, flex: 'none', marginTop: 2 }} />
          <span>
            {props.isProfessional ? 'Sólo se muestran las solicitudes que creaste. ' : ''}
            Cada solicitud aplica a una fecha concreta. Si la propuesta ya no puede validarse al aprobarla, permanece pendiente sin modificar la agenda para que Administración pueda ajustar la propuesta o rechazarla expresamente.
          </span>
        </div>
      </div>
      <div className="filters" role="group" aria-label="Filtros de solicitudes">
        <Field label="Tipo de cambio">
          <Select value={props.type} onChange={(event) => props.onType(event.target.value)}>
            <option value="">Todos los tipos</option>
            {TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </Field>
        {props.canResolve ? (
          <div className="stack" style={{ justifyContent: 'flex-end', paddingBottom: 4 }}>
            <label className="check">
              <input type="checkbox" checked={props.mineOnly} onChange={(event) => props.onMineOnly(event.target.checked)} />
              Sólo mis solicitudes
            </label>
          </div>
        ) : null}
        <div className="stack" style={{ justifyContent: 'flex-end', paddingBottom: 3 }}>
          <Button size="sm" onClick={props.onReset}>Limpiar filtros</Button>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Estado de solicitudes">
        {STATUS_TABS.map((option) => (
          <button key={option.value} type="button" role="tab" className="tab" data-active={props.status === option.value} aria-selected={props.status === option.value} onClick={() => props.onStatus(option.value)}>
            {option.label}
            {option.value === 'pending' ? <span className="tab-count tabular" data-alert={props.pendingCount > 0}>{props.pendingCount}</span> : null}
          </button>
        ))}
      </div>
    </>
  );
}
