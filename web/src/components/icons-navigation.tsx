import { Base, type Props } from './icon-base';

export const CalendarIcon = (props: Props) => (
  <Base {...props}>
    <rect x="3" y="5" width="18" height="16" rx="1.5" />
    <path d="M8 3v4M16 3v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2" />
  </Base>
);

export const DashboardIcon = (props: Props) => (
  <Base {...props}>
    <path d="M4 20V10h6v10M14 20V4h6v16M4 20h16" />
  </Base>
);

export const UsersIcon = (props: Props) => (
  <Base {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.2 2.7-5.3 6-5.3s6 2.1 6 5.3M16 5.2a3 3 0 0 1 0 5.6M17.5 14.8c2.1.6 3.5 2.3 3.5 4.7" />
  </Base>
);

export const UserIcon = (props: Props) => (
  <Base {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20c0-3.7 3.4-6 7.5-6s7.5 2.3 7.5 6" />
  </Base>
);

export const ActivityIcon = (props: Props) => (
  <Base {...props}>
    <path d="M3 12h4l2.4-6 4.2 12L16 12h5" />
  </Base>
);

export const ClockIcon = (props: Props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const ClipboardIcon = (props: Props) => (
  <Base {...props}>
    <rect x="5" y="4" width="14" height="17" rx="1.5" />
    <path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4" />
  </Base>
);

export const ShieldIcon = (props: Props) => (
  <Base {...props}>
    <path d="M12 3 4.5 6v6c0 4.4 3.1 7.7 7.5 9 4.4-1.3 7.5-4.6 7.5-9V6L12 3Z" />
    <path d="m8.8 12 2.1 2.1 4.3-4.4" />
  </Base>
);

export const SettingsIcon = (props: Props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
  </Base>
);

export const PlusIcon = (props: Props) => (
  <Base {...props}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const ChevronLeftIcon = (props: Props) => (
  <Base {...props}>
    <path d="m14.5 5-7 7 7 7" />
  </Base>
);

export const ChevronRightIcon = (props: Props) => (
  <Base {...props}>
    <path d="m9.5 5 7 7-7 7" />
  </Base>
);

export const ChevronDownIcon = (props: Props) => (
  <Base {...props}>
    <path d="m5 9.5 7 7 7-7" />
  </Base>
);

export const XIcon = (props: Props) => (
  <Base {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);

export const SearchIcon = (props: Props) => (
  <Base {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Base>
);

export const FilterIcon = (props: Props) => (
  <Base {...props}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Base>
);

export const MenuIcon = (props: Props) => (
  <Base {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);
