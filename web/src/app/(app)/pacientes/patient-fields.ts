import { TRANSPORT_MODE_LABELS, type Patient, type Insurer } from '@plaza/shared';
import type { EntityField } from '@/components/entity-form';

export function patientDefaults(editing: Patient | null) {
  return editing ? {
    firstName: editing.firstName, lastName: editing.lastName, document: editing.document ?? '',
    birthDate: editing.birthDate ?? '', phone: editing.phone ?? '', email: editing.email ?? '',
    insurerId: editing.insurerId ?? '', affiliateNumber: editing.affiliateNumber ?? '',
    transportMode: editing.transportMode, adminNotes: editing.adminNotes ?? '', status: editing.status,
  } : {
    firstName: '', lastName: '', document: '', birthDate: '', phone: '', email: '',
    insurerId: '', affiliateNumber: '', transportMode: 'none', adminNotes: '', status: 'active',
  };
}

export function patientFields(insurers: Insurer[], editing: Patient | null): EntityField[] {
  const fields: EntityField[] = [
    { name: 'firstName', label: 'Nombre', required: true, placeholder: 'Nombre de pila' },
    { name: 'lastName', label: 'Apellido', required: true, placeholder: 'Apellido' },
    { name: 'document', label: 'Documento', placeholder: 'DNI / LC / LE' },
    { name: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
    { name: 'phone', label: 'Teléfono', type: 'tel', placeholder: '+54 362 …' },
    {
      name: 'email',
      label: 'Correo electrónico',
      type: 'email',
      placeholder: 'paciente@correo.com',
    },
    {
      name: 'insurerId',
      label: 'Obra social',
      type: 'select',
      placeholder: 'Sin obra social',
      options: (insurers)
        .filter((insurer) => insurer.status === 'active' || insurer.id === editing?.insurerId)
        .map((insurer) => ({ value: insurer.id, label: insurer.name })),
    },
    { name: 'affiliateNumber', label: 'N.º de afiliado' },
    {
      name: 'transportMode',
      label: 'Traslado',
      type: 'select',
      options: Object.entries(TRANSPORT_MODE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
      ],
    },
    {
      name: 'adminNotes',
      label: 'Notas administrativas',
      type: 'textarea',
      placeholder: 'Información operativa, accesibilidad, contacto alternativo…',
    },
  ];
  return fields;
}
