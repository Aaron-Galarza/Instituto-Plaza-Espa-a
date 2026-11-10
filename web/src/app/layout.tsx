import type { Metadata } from 'next';
import './styles/paleta.css';
import './globals.css';
import './styles/0101-layout-01.css';
import './styles/0101-layout-02.css';
import './styles/0285-typography-01.css';
import './styles/0337-controls-01.css';
import './styles/0337-controls-02.css';
import './styles/0511-surfaces-01.css';
import './styles/0511-surfaces-02.css';
import './styles/0660-overlays-01.css';
import './styles/0785-agenda-01.css';
import './styles/0785-agenda-02.css';
import './styles/0785-agenda-03.css';
import './styles/0785-agenda-04.css';
import './styles/0785-agenda-05.css';
import './styles/1453-dashboard-01.css';
import './styles/1552-auth-01.css';
import './styles/1687-misc-01.css';
import './styles/1687-misc-02.css';
import './styles/1875-availability-01.css';
import './styles/1875-availability-02.css';
import './styles/2055-responsive-01.css';
import './styles/2055-responsive-02.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Instituto de Rehabilitación Plaza España',
    template: '%s · Plaza España',
  },
  description:
    'Sistema interno de gestión y planificación de rehabilitación del Instituto Plaza España, Resistencia, Chaco.',
  applicationName: 'Plaza España',
  icons: {
    icon: '/brand/isotipo.png',
    apple: '/brand/isotipo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;650;700&family=Work+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
