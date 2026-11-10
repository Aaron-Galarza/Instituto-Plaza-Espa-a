export async function seedGroups(post, services, pros, spaces, start, finish) {
const groups = {};
for (const [key, data] of Object.entries({
  autonomy: { name: 'Autonomía de los lunes (demo)', serviceId: services.to.id, modality: 'group', capacity: 4, professionalIds: [pros.carla.id], spaceId: spaces.workshop.id, notes: 'Cupo de cuatro pacientes.' },
  motor: { name: 'Entrenamiento motor compartido (demo)', serviceId: services.kine.id, modality: 'shared', capacity: 3, professionalIds: [pros.ana.id], spaceId: spaces.gym.id, notes: 'Varios pacientes en simultáneo.' },
  language: { name: 'Comunicación de los viernes (demo)', serviceId: services.communication.id, modality: 'group', capacity: 5, professionalIds: [pros.bruno.id], spaceId: spaces.workshop.id },
  cognition: { name: 'Cognición en dupla (demo)', serviceId: services.cognitive.id, modality: 'shared', capacity: 2, professionalIds: [pros.diego.id, pros.elena.id], spaceId: spaces.assessment.id, notes: 'Dos profesionales en el mismo tramo.' },
})) groups[key] = await post('/care-groups', data);

// Horarios para todos los profesionales activos, de lunes a viernes.
for (const [key, professional] of Object.entries(pros)) {
  if (key === 'inactive') continue;
  for (const dayOfWeek of [1, 2, 3, 4, 5]) {
    await post('/availability', {
      professionalId: professional.id, kind: 'regular', dayOfWeek,
      startMinute: 480, endMinute: 1020, effectiveFrom: start, effectiveTo: finish,
      notes: 'Horario habitual de demostración.',
    });
  }
}

  return groups;
}
