import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ChangeRequest } from '@plaza/shared';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';

export type ResolutionMode = 'approve' | 'reject';

interface Options {
  onResolved: () => void;
  onResolveError: (error: unknown) => void;
  onCancelled: () => void;
}

export function useRequestActions({ onResolved, onResolveError, onCancelled }: Options) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const invalidateAfterResolution = () => {
    void queryClient.invalidateQueries({ queryKey: ['change-requests'] });
    void queryClient.invalidateQueries({ queryKey: ['change-requests-pending-count'] });
    void queryClient.invalidateQueries({ queryKey: ['schedule'] });
    void queryClient.invalidateQueries({ queryKey: ['pending-conflicts'] });
    void queryClient.invalidateQueries({ queryKey: ['group-occupancy'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['availability'] });
    void queryClient.invalidateQueries({ queryKey: ['availability-issues'] });
  };

  const resolve = useMutation({
    mutationFn: ({
      request,
      mode,
      note,
    }: {
      request: ChangeRequest;
      mode: ResolutionMode;
      note: string;
    }) =>
      api<ChangeRequest>(`/change-requests/${request.id}/${mode}`, {
        method: 'POST',
        body: { note, expectedVersion: request.version },
      }),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(['change-request', updated.id], updated);
      invalidateAfterResolution();
      if (variables.mode === 'approve') {
        notify('Solicitud aprobada y agenda actualizada.');
      } else {
        notify('Solicitud rechazada.');
      }
      onResolved();
    },
    onError: (error) => {
      onResolveError(error);
    },
  });

  const cancel = useMutation({
    mutationFn: (request: ChangeRequest) =>
      api<ChangeRequest>(`/change-requests/${request.id}/cancel`, {
        method: 'POST',
        body: { note: 'Cancelada desde el panel de solicitudes.' },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['change-request', updated.id], updated);
      invalidateAfterResolution();
      notify('Solicitud cancelada.');
      onCancelled();
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  return { resolve, cancel, invalidateAfterResolution, queryClient, notify };
}
