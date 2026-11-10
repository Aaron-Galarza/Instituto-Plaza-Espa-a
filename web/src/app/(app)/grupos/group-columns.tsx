import { MODALITY_LABELS, type CareGroup, type Service, type Space, type Professional } from '@plaza/shared';
import { Badge } from '@/components/ui';
import type { CatalogColumn } from '@/components/catalog-table';

type Reference = { services: Service[]; spaces: Space[]; professionals: Professional[] } | undefined;

export function groupColumns(reference: Reference): CatalogColumn<CareGroup>[] {
  const serviceName = (id: string) => reference?.services.find((item) => item.id === id)?.name ?? '—';
  const spaceName = (id: string | null | undefined) => id ? reference?.spaces.find((item) => item.id === id)?.name ?? '—' : '—';
  const professionalNames = (ids: string[]) => ids.map((id) => {
    const item = reference?.professionals.find((professional) => professional.id === id);
    return item ? `${item.firstName} ${item.lastName}` : null;
  }).filter((name): name is string => Boolean(name));
  return [
    { header: 'Grupo', className: 'row-title', render: (group) => group.name },
    { header: 'Prestación', render: (group) => serviceName(group.serviceId) },
    { header: 'Modalidad', render: (group) => <Badge tone="mist">{MODALITY_LABELS[group.modality]}</Badge> },
    { header: 'Profesionales', render: (group) => <div className="stack" style={{ gap: 1 }}>
      {professionalNames(group.professionalIds).map((name) => <span className="tiny" key={name}>{name}</span>)}
    </div> },
    { header: 'Espacio', render: (group) => spaceName(group.spaceId) },
    { header: 'Cupo', className: 'tabular', render: (group) => group.capacity },
  ];
}
