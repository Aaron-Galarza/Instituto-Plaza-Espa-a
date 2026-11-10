import { useQuery } from '@tanstack/react-query';
import { type ChangeRequest, type PaginatedResult, type ScheduleRuleDetail } from '@plaza/shared';
import { api, queryString } from '@/lib/api';
import type { StatusTab } from './request-controls';

interface Options {
  page: number;
  status: StatusTab;
  type: string;
  mineOnly: boolean;
  selectedId: string | null;
  canRead: boolean;
  canScheduleRead: boolean;
}

export function useRequestData({ page, status, type, mineOnly, selectedId, canRead, canScheduleRead }: Options) {
  const requests = useQuery<PaginatedResult<ChangeRequest>>({
    queryKey: ['change-requests', page, status, type, mineOnly],
    queryFn: () =>
      api<PaginatedResult<ChangeRequest>>(
        `/change-requests${queryString({
          page,
          pageSize: 25,
          status: status === 'all' ? undefined : status,
          type,
          mine: mineOnly ? true : undefined,
        })}`,
      ),
    enabled: canRead,
  });

  const pendingCount = useQuery<PaginatedResult<ChangeRequest>>({
    queryKey: ['change-requests-pending-count'],
    queryFn: () =>
      api<PaginatedResult<ChangeRequest>>('/change-requests?status=pending&page=1&pageSize=1'),
    enabled: canRead,
  });

  const selectedSummary = requests.data?.items.find((request) => request.id === selectedId) ?? null;

  const detail = useQuery<ChangeRequest>({
    queryKey: ['change-request', selectedId],
    queryFn: () => api<ChangeRequest>(`/change-requests/${selectedId}`),
    enabled: Boolean(selectedId),
  });

  const current = detail.data ?? selectedSummary;

  const rule = useQuery<ScheduleRuleDetail>({
    queryKey: ['schedule-rule', current?.resourceId],
    queryFn: () => api<ScheduleRuleDetail>(`/schedule/rules/${current?.resourceId}`),
    enabled: Boolean(current?.resourceId) && canScheduleRead,
    retry: false,
  });

  return { requests, pendingCount, selectedSummary, detail, current, rule };
}
