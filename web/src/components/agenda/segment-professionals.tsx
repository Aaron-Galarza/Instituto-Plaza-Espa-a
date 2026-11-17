'use client';
import { type CareGroup, type Professional } from '@plaza/shared';
import { Field } from '@/components/ui';
import type { DraftSegment, JourneyReference } from './journey-draft';
import { professionalOffersService } from './professional-service';

export function SegmentProfessionals({
  index,
  segment,
  currentGroup,
  reference,
  onChange,
}: {
  index: number;
  segment: DraftSegment;
  currentGroup: CareGroup | undefined;
  reference: JourneyReference;
  onChange: (changes: Partial<DraftSegment>) => void;
}) {
  const groupProfessionals = currentGroup
    ? currentGroup.professionalIds
        .map((id) => reference.professionals.find((professional) => professional.id === id))
        .filter((professional): professional is Professional => Boolean(professional))
    : [];
  const service = reference.services.find((item) => item.id === segment.serviceId);
  const matchesService = (professional: Professional) => professionalOffersService(professional, service);
  const options = reference.professionals.filter((professional) =>
    (professional.status === 'active' && matchesService(professional)) ||
    segment.professionalIds.includes(professional.id));

  return (
    <Field
      label="Profesionales *"
      className="span-2"
      hint={
        currentGroup
          ? 'El grupo define sus profesionales.'
          : 'Solo aparecen profesionales que tienen asignada esta prestación. Podés elegir más de uno.'
      }
    >
      {currentGroup ? (
        <div className="person-options" style={{ maxHeight: 'none' }}>
          {groupProfessionals.length > 0 ? (
            groupProfessionals.map((professional) => (
              <span className="check" key={professional.id}>
                <span className="dot" style={{ color: professional.color }} aria-hidden="true" />
                {professional.firstName} {professional.lastName}
              </span>
            ))
          ) : (
            <span className="field-hint">El grupo no tiene profesionales activos.</span>
          )}
        </div>
      ) : (
        <div
          className="person-options"
          role="group"
          aria-label={`Profesionales del tramo ${index + 1}`}
        >
          {options.length === 0 ? (
            <span className="field-hint">No hay profesionales con esta prestación. Asignala primero en Profesionales.</span>
          ) : options.map((professional) => (
              <label className="check" key={professional.id}>
                <input
                  type="checkbox"
                  checked={segment.professionalIds.includes(professional.id)}
                  onChange={(event) =>
                    onChange({
                      professionalIds: event.target.checked
                        ? [...segment.professionalIds, professional.id]
                        : segment.professionalIds.filter((id) => id !== professional.id),
                    })
                  }
                />
                <span className="dot" style={{ color: professional.color }} aria-hidden="true" />
                {professional.firstName} {professional.lastName}
                {!matchesService(professional) ? ' (asignación anterior; revisar)' : ''}
              </label>
            ))}
        </div>
      )}
    </Field>
  );
}
