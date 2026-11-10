import { useMemo } from 'react';
import { MODALITY_LABELS, type ChangeRequest, type ScheduleRuleDetail } from '@plaza/shared';
import { timeRange } from '@/lib/format';
import { useReferenceData } from '@/lib/queries';
import type { ProposalSegmentView } from './request-proposal';

type Reference = ReturnType<typeof useReferenceData>['data'];

export function useRequestProposal(current: ChangeRequest | null, rule: ScheduleRuleDetail | undefined, reference: Reference) {
  const serviceName = (id: string) =>
    reference?.services.find((service) => service.id === id)?.name ?? 'Prestación';
  const spaceName = (id: string | null | undefined) =>
    id ? (reference?.spaces.find((space) => space.id === id)?.name ?? 'Espacio') : null;
  const groupName = (id: string | null | undefined) =>
    id ? (reference?.groups.find((group) => group.id === id)?.name ?? 'Grupo') : null;
  const professionalName = (id: string) => {
    const professional = reference?.professionals.find((item) => item.id === id);
    return professional ? `${professional.firstName} ${professional.lastName}` : 'Profesional';
  };
  const professionalNames = (ids: string[]) =>
    ids.length > 0 ? ids.map(professionalName).join(' · ') : 'Sin profesional';

  const proposalSegments = useMemo((): ProposalSegmentView[] => {
    if (!current) return [];
    const proposal = current.proposal;
    if (proposal.type === 'modify_date') {
      return proposal.segments.map((segment, index) => ({
        key: segment.id ?? `segment-${index}`,
        serviceName: serviceName(segment.serviceId),
        professionals: professionalNames(segment.professionalIds),
        spaceName: spaceName(segment.spaceId),
        groupName: groupName(segment.groupId),
        time: timeRange(segment.startMinute, segment.endMinute),
        modality:
          MODALITY_LABELS[segment.modality as keyof typeof MODALITY_LABELS] ?? segment.modality,
      }));
    }
    if (proposal.type === 'reassign_professional' || proposal.type === 'change_space') {
      const segment = rule?.rule.segments.find((item) => item.id === proposal.segmentId);
      if (!segment) return [];
      return [
        {
          key: segment.id,
          serviceName: serviceName(segment.serviceId),
          professionals:
            proposal.type === 'reassign_professional'
              ? `Actualmente ${professionalNames(segment.professionalIds)} · propuesto ${professionalName(proposal.professionalId)}`
              : professionalNames(segment.professionalIds),
          spaceName:
            proposal.type === 'change_space'
              ? proposal.spaceId
                ? spaceName(proposal.spaceId)
                : 'Sin espacio'
              : spaceName(segment.spaceId),
          groupName: groupName(segment.groupId),
          time: timeRange(segment.startMinute, segment.endMinute),
          modality:
            MODALITY_LABELS[segment.modality as keyof typeof MODALITY_LABELS] ?? segment.modality,
        },
      ];
    }
    return [];
  }, [current, rule, reference]);

  return { proposalSegments, professionalName, spaceName };
}
