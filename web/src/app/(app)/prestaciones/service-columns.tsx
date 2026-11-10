import { MODALITY_LABELS, type Service } from '@plaza/shared';
import { Badge } from '@/components/ui';
import type { CatalogColumn } from '@/components/catalog-table';

export const serviceColumns: CatalogColumn<Service>[] = [
  { header: 'Prestación', render: (service) => <div className="stack" style={{ gap: 1 }}>
    <span className="row-title">{service.name}</span>
    {service.description ? <span className="tiny muted">{service.description}</span> : null}
  </div> },
  { header: 'Modalidades', render: (service) => <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
    {service.allowedModalities.map((modality) => <Badge key={modality} tone="mist">
      {MODALITY_LABELS[modality]}
    </Badge>)}
  </div> },
  { header: 'Duración sugerida', className: 'tabular', render: (service) =>
    service.suggestedDurationMinutes ? `${service.suggestedDurationMinutes} min` : '—' },
];
