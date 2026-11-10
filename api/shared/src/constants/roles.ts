export type Role = 'admin' | 'professional' | 'director';

export const ROLES: readonly Role[] = ['admin', 'professional', 'director'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administración',
  professional: 'Profesional',
  director: 'Dirección',
};

export const PERMISSIONS = [
  'dashboard:read',
  'audit:read',
  'users:manage',
  'patients:read',
  'patients:write',
  'professionals:read',
  'professionals:write',
  'insurers:read',
  'insurers:write',
  'services:read',
  'services:write',
  'spaces:read',
  'spaces:write',
  'groups:read',
  'groups:write',
  'availability:read',
  'availability:write',
  'schedule:read',
  'schedule:write',
  'schedule:cancel',
  'requests:submit',
  'requests:read',
  'requests:resolve',
  'agenda:own',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    'audit:read',
    'users:manage',
    'patients:read',
    'patients:write',
    'professionals:read',
    'professionals:write',
    'insurers:read',
    'insurers:write',
    'services:read',
    'services:write',
    'spaces:read',
    'spaces:write',
    'groups:read',
    'groups:write',
    'availability:read',
    'availability:write',
    'schedule:read',
    'schedule:write',
    'schedule:cancel',
    'requests:read',
    'requests:resolve',
  ],
  director: [
    'dashboard:read',
    'audit:read',
    'users:manage',
    'patients:read',
    'patients:write',
    'professionals:read',
    'professionals:write',
    'insurers:read',
    'insurers:write',
    'services:read',
    'services:write',
    'spaces:read',
    'spaces:write',
    'groups:read',
    'groups:write',
    'availability:read',
    'availability:write',
    'schedule:read',
    'schedule:write',
    'schedule:cancel',
    'requests:read',
    'requests:resolve',
  ],
  professional: [
    'agenda:own',
    'patients:read',
    'professionals:read',
    'insurers:read',
    'services:read',
    'spaces:read',
    'groups:read',
    'availability:read',
    'schedule:read',
    'requests:submit',
    'requests:read',
  ],
};

export const HOME_BY_ROLE: Record<Role, string> = {
  admin: '/agenda',
  director: '/dashboard',
  professional: '/mi-agenda',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Gestión operativa completa, agendas y resolución de solicitudes.',
  director: 'Permisos operativos completos, dashboard global y auditoría.',
  professional: 'Agenda propia, pacientes asignados y solicitudes de cambio.',
};
