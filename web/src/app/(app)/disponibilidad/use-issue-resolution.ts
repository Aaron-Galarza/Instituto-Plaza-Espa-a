import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { minutesToTime, timeToMinutes, type AssignmentIssueDetail, type Professional } from '@plaza/shared';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import type { ResolutionAction } from './availability-form';

export function useIssueResolution(professionals: Professional[]) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [resolving, setResolving] = useState<AssignmentIssueDetail | null>(null);
  const [resolveAction, setResolveAction] = useState<ResolutionAction>('reassign');
  const [replacementId, setReplacementId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [resolveReason, setResolveReason] = useState('');
  const [resolveError, setResolveError] = useState<string | null>(null);

  const resolveIssue = useMutation({
    mutationFn: (issue: AssignmentIssueDetail) => {
      const reason = resolveReason.trim();
      const body =
        resolveAction === 'reassign'
          ? { action: 'reassign' as const, professionalId: replacementId, reason }
          : resolveAction === 'reschedule'
            ? {
                action: 'reschedule' as const,
                newDate: rescheduleDate,
                startMinute: timeToMinutes(rescheduleStart),
                reason,
              }
            : resolveAction === 'cancel_date'
              ? { action: 'cancel_date' as const, reason }
              : { action: 'dismiss' as const, reason };
      return api<AssignmentIssueDetail>(`/availability/issues/${issue.id}/resolve`, {
        method: 'POST',
        body,
      });
    },
    onSuccess: (issue) => {
      notify(
        issue.status === 'dismissed'
          ? 'Afectación desestimada con su justificación.'
          : 'Afectación resuelta y agenda actualizada.',
      );
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
      void queryClient.invalidateQueries({ queryKey: ['availability-issues'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['pending-conflicts'] });
      void queryClient.invalidateQueries({ queryKey: ['group-occupancy'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeResolution();
    },
    onError: (error) => setResolveError(errorMessage(error)),
  });

  const openResolution = (issue: AssignmentIssueDetail) => {
    const available = professionals.filter(
      (professional) =>
        professional.status === 'active' && professional.id !== issue.professionalId,
    );
    setResolving(issue);
    setResolveAction(available.length > 0 ? 'reassign' : 'cancel_date');
    setReplacementId(available[0]?.id ?? '');
    setRescheduleDate(issue.date);
    setRescheduleStart(minutesToTime(issue.startMinute));
    setResolveReason('');
    setResolveError(null);
  };

  const closeResolution = () => {
    setResolving(null);
    setResolveError(null);
    setResolveReason('');
    setReplacementId('');
    setRescheduleDate('');
    setRescheduleStart('');
  };

  const replacementOptions = professionals.filter(
    (professional) =>
      professional.status === 'active' && professional.id !== resolving?.professionalId,
  );

  return { resolving, resolveAction, setResolveAction, replacementId, setReplacementId, rescheduleDate, setRescheduleDate, rescheduleStart, setRescheduleStart, resolveReason, setResolveReason, resolveError, setResolveError, resolveIssue, openResolution, closeResolution, replacementOptions };
}
