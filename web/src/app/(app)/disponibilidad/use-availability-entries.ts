import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProfessionalAvailability } from '@plaza/shared';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { countLabel, toCreateInput, toUpdateInput, type AvailabilityFormValues, type AvailabilitySaveResponse } from './availability-form';

export function useAvailabilityEntries(onSaved: () => void, onDeleted: () => void) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const save = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: AvailabilityFormValues }) =>
      id
        ? api<AvailabilitySaveResponse>(`/availability/${id}`, {
            method: 'PATCH',
            body: toUpdateInput(values),
          })
        : api<AvailabilitySaveResponse>('/availability', {
            method: 'POST',
            body: toCreateInput(values),
          }),
    onSuccess: (result, variables) => {
      const affected = result.issues.length;
      notify(
        variables.id
          ? 'Registro de disponibilidad actualizado.'
          : result.entry.kind === 'absence'
            ? `Ausencia registrada. ${countLabel(affected, 'afectación generada', 'afectaciones generadas')}.`
            : 'Registro de disponibilidad creado.',
      );
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
      void queryClient.invalidateQueries({ queryKey: ['availability-issues'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['pending-conflicts'] });
      void queryClient.invalidateQueries({ queryKey: ['group-occupancy'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onSaved();
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const setEntryStatus = useMutation({
    mutationFn: (entry: ProfessionalAvailability) =>
      api<AvailabilitySaveResponse>(`/availability/${entry.id}/status`, {
        method: 'POST',
        body: { status: entry.status === 'active' ? 'inactive' : 'active' },
      }),
    onSuccess: (result) => {
      notify(`Registro ${result.entry.status === 'active' ? 'activado' : 'desactivado'}.`);
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
      void queryClient.invalidateQueries({ queryKey: ['availability-issues'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['pending-conflicts'] });
      void queryClient.invalidateQueries({ queryKey: ['group-occupancy'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  const remove = useMutation({
    mutationFn: (entry: ProfessionalAvailability) =>
      api(`/availability/${entry.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      notify('Registro eliminado.');
      void queryClient.invalidateQueries({ queryKey: ['availability'] });
      void queryClient.invalidateQueries({ queryKey: ['availability-issues'] });
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      void queryClient.invalidateQueries({ queryKey: ['pending-conflicts'] });
      void queryClient.invalidateQueries({ queryKey: ['group-occupancy'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onDeleted();
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });

  return { save, setEntryStatus, remove };
}
