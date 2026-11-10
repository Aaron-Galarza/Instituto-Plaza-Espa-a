'use client';

import { resetPasswordSchema, type ResetPasswordInput, type User } from '@plaza/shared';
import { EntityFormModal } from '@/components/entity-form';

export function UserResetModal({ user, onClose, onSubmit, busy, error }: {
  user: User | null; onClose: () => void; onSubmit: (id: string, values: ResetPasswordInput) => void;
  busy: boolean; error?: string;
}) {
  return (
      <EntityFormModal
        key={user ? `reset-${user.id}` : 'reset'}
        open={Boolean(user)}
        onClose={onClose}
        title="Restablecer contraseña"
        description={user ? `Nueva clave para ${user.name} (${user.email}).` : ''}
        schema={resetPasswordSchema}
        defaultValues={{ password: '' }}
        fields={[
          {
            name: 'password',
            label: 'Nueva contraseña',
            type: 'password',
            required: true,
            hint: 'Mínimo 10 caracteres, con letras y números.',
          },
        ]}
        submitLabel="Restablecer"
        onSubmit={(values) => {
          if (user) onSubmit(user.id, values as ResetPasswordInput);
        }}
        busy={busy}
        error={error}
        size="small"
      />
  );
}
