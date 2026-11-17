import { describe, expect, it } from 'vitest';
import { validateRuleShape, type Professional, type Service } from '@plaza/shared';
import {
  draftToRuleInput,
  expandJourneyBounds,
  type JourneyDraft,
} from '../../web/src/components/agenda/journey-draft';
import { professionalOffersService } from '../../web/src/components/agenda/professional-service';

const draft: JourneyDraft = {
  patientId: 'patient-1',
  daysOfWeek: [1],
  effectiveFrom: '2026-11-16',
  effectiveTo: '2027-01-31',
  startTime: '09:00',
  endTime: '10:00',
  notes: '',
  segments: [
    { serviceId: 'kine', professionalIds: ['pro-1'], groupId: '', spaceId: '',
      startTime: '09:00', endTime: '10:00', modality: 'individual' },
    { serviceId: 'to', professionalIds: ['pro-2'], groupId: 'group-1', spaceId: '',
      startTime: '10:00', endTime: '10:45', modality: 'group' },
  ],
};

describe('formulario de jornadas', () => {
  it('amplía la jornada cuando un segundo tramo termina más tarde', () => {
    const previous = draftToRuleInput(draft);
    expect(validateRuleShape(previous)[0]?.message).toContain('10:00–10:45');
    expect(validateRuleShape(previous)[0]?.message).toContain('09:00–10:00');

    const expanded = expandJourneyBounds(draft, draft.segments);
    expect(expanded.endTime).toBe('10:45');
    expect(validateRuleShape(draftToRuleInput(expanded))).toEqual([]);
  });

  it('reconoce solo profesionales con la prestación elegida', () => {
    const service = { name: 'Kinesiologia' } as Service;
    const kin = { specialties: ['Kinesiología'] } as Professional;
    const occupational = { specialties: ['Terapia Ocupacional'] } as Professional;
    expect(professionalOffersService(kin, service)).toBe(true);
    expect(professionalOffersService(occupational, service)).toBe(false);
  });
});
