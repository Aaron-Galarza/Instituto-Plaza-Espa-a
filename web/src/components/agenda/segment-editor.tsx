'use client';
import { MODALITY_LABELS, type Modality } from '@plaza/shared';
import { Field, IconButton, Input, Select } from '@/components/ui';
import { TrashIcon } from '@/components/icons';
import type { DraftSegment, JourneyDraft, JourneyReference } from './journey-draft';
import { SegmentProfessionals } from './segment-professionals';

export function SegmentEditor({
  index,
  segment,
  draft,
  reference,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  segment: DraftSegment;
  draft: JourneyDraft;
  reference: JourneyReference;
  canRemove: boolean;
  onChange: (changes: Partial<DraftSegment>) => void;
  onRemove: () => void;
}) {
  const service = reference.services.find((item) => item.id === segment.serviceId);
  const allowedModalities: Modality[] = service?.allowedModalities.length
    ? service.allowedModalities
    : ['individual'];
  const groupOptions = reference.groups.filter(
    (group) =>
      group.status === 'active' &&
      group.serviceId === segment.serviceId &&
      group.modality === segment.modality,
  );
  const currentGroup = reference.groups.find((group) => group.id === segment.groupId);
  const serviceOptions = reference.services.filter(
    (item) => item.status === 'active' || item.id === segment.serviceId,
  );
  const spaceOptions = reference.spaces.filter(
    (item) => item.status === 'active' || item.id === segment.spaceId,
  );

  return (
    <div className="segment">
      <div className="segment-head">
        <strong>Tramo {index + 1}</strong>
        {canRemove ? (
          <IconButton label={`Quitar tramo ${index + 1}`} onClick={onRemove} type="button">
            <TrashIcon />
          </IconButton>
        ) : null}
      </div>
      <div className="form-grid">
        <Field label="Prestación *">
          <Select
            value={segment.serviceId}
            onChange={(event) => {
              const nextService = reference.services.find((item) => item.id === event.target.value);
              const nextModality = nextService?.allowedModalities.includes(segment.modality)
                ? segment.modality
                : (nextService?.allowedModalities[0] ?? 'individual');
              const nextGroup = reference.groups.find((group) => group.id === segment.groupId);
              onChange({
                serviceId: event.target.value,
                modality: nextModality,
                groupId: nextGroup?.serviceId === event.target.value ? segment.groupId : '',
                spaceId:
                  nextGroup?.serviceId === event.target.value
                    ? (nextGroup.spaceId ?? '')
                    : segment.spaceId,
              });
            }}
          >
            <option value="">Seleccionar prestación…</option>
            {serviceOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.status === 'inactive' ? ' (inactiva)' : ''}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Modalidad *">
          <Select
            value={segment.modality}
            onChange={(event) => {
              const modality = event.target.value as Modality;
              const group = reference.groups.find((item) => item.id === segment.groupId);
              onChange({
                modality,
                groupId: group?.modality === modality ? segment.groupId : '',
              });
            }}
          >
            {allowedModalities.map((modality) => (
              <option key={modality} value={modality}>
                {MODALITY_LABELS[modality]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Desde *">
          <Input
            type="time"
            value={segment.startTime}
            onChange={(event) => onChange({ startTime: event.target.value })}
            aria-label={`Hora de inicio del tramo ${index + 1}`}
          />
        </Field>
        <Field label="Hasta *">
          <Input
            type="time"
            value={segment.endTime}
            onChange={(event) => onChange({ endTime: event.target.value })}
            aria-label={`Hora de fin del tramo ${index + 1}`}
          />
        </Field>

        <Field
          label="Grupo"
          hint={
            groupOptions.length === 0
              ? 'No hay grupos activos para esta prestación y modalidad.'
              : undefined
          }
        >
          <Select
            value={segment.groupId}
            onChange={(event) => {
              const group = reference.groups.find((item) => item.id === event.target.value);
              if (!group) {
                onChange({ groupId: '' });
                return;
              }
              onChange({
                groupId: group.id,
                serviceId: group.serviceId,
                modality: group.modality,
                spaceId: group.spaceId ?? '',
                professionalIds: group.professionalIds,
              });
            }}
            disabled={groupOptions.length === 0 && !currentGroup}
          >
            <option value="">Sin grupo</option>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} · capacidad {group.capacity}
              </option>
            ))}
            {currentGroup && !groupOptions.some((group) => group.id === currentGroup.id) ? (
              <option value={currentGroup.id}>{currentGroup.name} (actual)</option>
            ) : null}
          </Select>
        </Field>

        <Field label="Espacio">
          <Select
            value={segment.spaceId}
            onChange={(event) => onChange({ spaceId: event.target.value })}
          >
            <option value="">Sin espacio asignado</option>
            {spaceOptions.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name} · capacidad {space.capacity}
                {space.status === 'inactive' ? ' (inactivo)' : ''}
              </option>
            ))}
          </Select>
        </Field>

        <SegmentProfessionals
          index={index}
          segment={segment}
          currentGroup={currentGroup}
          reference={reference}
          onChange={onChange}
        />
      </div>
      {draft.segments.length > 1 ? (
        <p className="tiny muted" style={{ margin: '8px 0 0' }}>
          Los tramos del mismo paciente no pueden superponerse entre sí.
        </p>
      ) : null}
    </div>
  );
}
