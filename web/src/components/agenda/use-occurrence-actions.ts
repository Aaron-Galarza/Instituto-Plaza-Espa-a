import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ScheduleOccurrence } from '@plaza/shared';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import type { PanelMode } from './occurrence-types';

export function useOccurrenceActions(occurrence: ScheduleOccurrence | null, onClose: () => void, setMode: (mode: PanelMode) => void) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['schedule'] });
    void queryClient.invalidateQueries({ queryKey: ['pending-conflicts'] });
    void queryClient.invalidateQueries({ queryKey: ['rules'] });
    void queryClient.invalidateQueries({ queryKey: ['rule'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['change-requests'] });
    void queryClient.invalidateQueries({ queryKey: ['group-occupancy'] });
  };

  const finish = useMutation({
    mutationFn: (values: { lastDate: string; reason: string }) =>
      api(`/schedule/rules/${occurrence!.ruleId}/finish`, { method: 'POST', body: values }),
    onSuccess: () => {
      notify('Recurrencia finalizada.');
      invalidate();
      setMode(null);
      onClose();
    },
  });

  const cancel = useMutation({
    mutationFn: (values: { reason: string }) =>
      api(`/schedule/rules/${occurrence!.ruleId}/cancel`, { method: 'POST', body: values }),
    onSuccess: () => {
      notify('Recurrencia cancelada.');
      invalidate();
      setMode(null);
      onClose();
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/schedule/rules/${occurrence!.ruleId}`, { method: 'DELETE' }),
    onSuccess: () => {
      notify('Jornada eliminada.');
      invalidate();
      setMode(null);
      onClose();
    },
  });

  return { invalidate, finish, cancel, remove };
}
