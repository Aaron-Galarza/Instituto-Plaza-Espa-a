import { useQuery } from '@tanstack/react-query';
import type { ScheduleOccurrence, ScheduleResponse } from '@plaza/shared';
import { api } from '@/lib/api';

export function useGroupBlockParticipants(
  occurrence: ScheduleOccurrence,
  segment: ScheduleOccurrence['segments'][number],
) {
  const participants = useQuery<ScheduleResponse>({
    queryKey: ['group-block', occurrence.date, segment.groupId],
    queryFn: () =>
      api<ScheduleResponse>(
        `/schedule?from=${occurrence.date}&to=${occurrence.date}&groupId=${segment.groupId}`,
      ),
    enabled: Boolean(segment.groupId),
  });
  const matching = participants.data?.occurrences.filter((item) =>
    item.segments.some(
      (part) =>
        part.groupId === segment.groupId &&
        part.startMinute === segment.startMinute &&
        part.endMinute === segment.endMinute,
    ),
  ) ?? [];
  return { participants, matching };
}
