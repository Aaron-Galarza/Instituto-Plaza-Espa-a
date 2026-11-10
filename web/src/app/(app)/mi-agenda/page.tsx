import { AgendaView } from '@/components/agenda/agenda-view';

export const metadata = { title: 'Mi agenda' };

export default function MyAgendaPage() {
  return <AgendaView scope="own" />;
}
