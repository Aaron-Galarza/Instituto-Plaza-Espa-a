'use client';
import { type CareGroup, type Professional } from '@plaza/shared';
import { Field } from '@/components/ui';
import type { DraftSegment, JourneyReference } from './journey-draft';

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

  return (
    <Field
      label="Profesionales *"
      className="span-2"
      hint={
        currentGroup
          ? 'El grupo define sus profesionales.'
          : 'Podés asignar más de un profesional al mismo tramo.'
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
          {reference.professionals
            .filter(
              (professional) =>
                professional.status === 'active' ||
                segment.professionalIds.includes(professional.id),
            )
            .map((professional) => (
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
              </label>
            ))}
        </div>
      )}
    </Field>
  );
}
