export async function seedPatients(post, addDays, insurers) {
const patients = {};
const patientRows = [
  ['lucia', 'Lucía', 'Gómez', 'provincial', 'own', 'Usa la entrada accesible.'],
  ['mateo', 'Mateo', 'Benítez', 'mutual', 'institutional', 'Coordinar traslado institucional.'],
  ['valentina', 'Valentina', 'Acosta', 'private', 'none', 'Contacto administrativo: familiar responsable.'],
  ['sofia', 'Sofía', 'Romero', 'provincial', 'ambulance', 'Requiere espacio de ascenso para ambulancia.'],
  ['tomas', 'Tomás', 'Aguirre', 'mutual', 'own', 'Prefiere turnos de media mañana.'],
  ['emilia', 'Emilia', 'Ruiz', null, 'none', 'Sin cobertura cargada.'],
  ['joaquin', 'Joaquín', 'Torres', 'private', 'own', 'Dos prestaciones en una jornada.'],
  ['martina', 'Martina', 'Ferreyra', 'provincial', 'institutional', 'Asiste al taller de comunicación.'],
  ['benjamin', 'Benjamín', 'López', 'mutual', 'own', 'Asiste al mismo grupo que Martina.'],
  ['gabriel', 'Gabriel', 'Silva', 'private', 'none', 'Actividad cognitiva compartida.'],
  ['clara', 'Clara', 'Rojas', null, 'own', 'Actividad cognitiva compartida.'],
  ['inactive', 'Noelia', 'Farias', 'archived', 'none', 'Ficha histórica de ejemplo.'],
];
for (const [index, [key, firstName, lastName, insurer, transportMode, adminNotes]] of patientRows.entries()) {
  patients[key] = await post('/patients', {
    firstName, lastName, document: String(90000001 + index),
    birthDate: addDays('2000-01-01', index * 295),
    email: `paciente${index + 1}@example.com`, phone: `+54 362 400 ${String(index + 1).padStart(4, '0')}`,
    insurerId: insurer ? insurers[insurer].id : undefined,
    affiliateNumber: insurer ? `DEMO-${1000 + index}` : undefined,
    transportMode, adminNotes, status: key === 'inactive' ? 'inactive' : 'active',
  });
}

  return { patients, patientCount: patientRows.length };
}
