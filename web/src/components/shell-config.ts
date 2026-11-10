import { ActivityIcon, BuildingIcon, CalendarIcon, ClipboardIcon, DashboardIcon, FileIcon, LayersIcon, SettingsIcon, ShieldIcon, UserIcon, UsersIcon } from './icons';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  permission?: string;
  roles?: Array<'admin' | 'professional' | 'director'>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const GROUPS: NavGroup[] = [
  {
    label: 'Planificación',
    items: [
      { href: '/agenda', label: 'Agenda', icon: CalendarIcon, roles: ['admin', 'director'] },
      { href: '/mi-agenda', label: 'Mi agenda', icon: CalendarIcon, roles: ['professional'] },
      { href: '/dashboard', label: 'Tablero', icon: DashboardIcon, permission: 'dashboard:read' },
      {
        href: '/disponibilidad',
        label: 'Disponibilidad',
        icon: ActivityIcon,
        permission: 'availability:read',
      },
      {
        href: '/solicitudes',
        label: 'Solicitudes',
        icon: ClipboardIcon,
        permission: 'requests:read',
      },
    ],
  },
  {
    label: 'Personas',
    items: [
      { href: '/pacientes', label: 'Pacientes', icon: UsersIcon, permission: 'patients:read' },
      {
        href: '/profesionales',
        label: 'Profesionales',
        icon: UserIcon,
        permission: 'professionals:read',
      },
    ],
  },
  {
    label: 'Catálogos',
    items: [
      {
        href: '/obras-sociales',
        label: 'Obras sociales',
        icon: ShieldIcon,
        permission: 'insurers:read',
      },
      {
        href: '/prestaciones',
        label: 'Prestaciones',
        icon: ActivityIcon,
        permission: 'services:read',
      },
      { href: '/espacios', label: 'Espacios', icon: BuildingIcon, permission: 'spaces:read' },
      { href: '/grupos', label: 'Grupos', icon: LayersIcon, permission: 'groups:read' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { href: '/usuarios', label: 'Usuarios', icon: SettingsIcon, permission: 'users:manage' },
      { href: '/auditoria', label: 'Auditoría', icon: FileIcon, permission: 'audit:read' },
    ],
  },
];

export const PAGE_TITLES: Record<string, { title: string; context: string }> = {
  '/agenda': { title: 'Agenda', context: 'Planificación de jornadas y recurrencias' },
  '/mi-agenda': { title: 'Mi agenda', context: 'Tus jornadas y pacientes asignados' },
  '/dashboard': { title: 'Tablero', context: 'Lectura global de la actividad institucional' },
  '/pacientes': { title: 'Pacientes', context: 'Personas que reciben prestaciones' },
  '/profesionales': { title: 'Profesionales', context: 'Equipo de rehabilitación' },
  '/disponibilidad': {
    title: 'Disponibilidad',
    context: 'Horarios habituales, ausencias y afectaciones',
  },
  '/solicitudes': { title: 'Solicitudes', context: 'Cambios propuestos sobre la agenda' },
  '/obras-sociales': { title: 'Obras sociales', context: 'Coberturas y financiadores' },
  '/prestaciones': { title: 'Prestaciones', context: 'Servicios habilitados y modalidades' },
  '/espacios': { title: 'Espacios', context: 'Consultorios y capacidad simultánea' },
  '/grupos': { title: 'Grupos', context: 'Agrupaciones de pacientes y profesionales' },
  '/usuarios': { title: 'Usuarios', context: 'Accesos al sistema y roles' },
  '/auditoria': { title: 'Auditoría', context: 'Registro de operaciones' },
  '/perfil': { title: 'Mi perfil', context: 'Datos de acceso y seguridad' },
};
