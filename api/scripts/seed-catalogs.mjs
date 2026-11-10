export async function seedCatalogs(post, password) {
const users = {};
users.director = await post('/users', {
  name: 'Carlos Medina (demo)', email: 'direccion.demo@plaza.example', password, role: 'director',
});

const insurers = {};
for (const [key, data] of Object.entries({
  provincial: { name: 'Cobertura Provincial (demo)', code: 'CP-DEMO', description: 'Convenio provincial ficticio.' },
  mutual: { name: 'Mutual del Norte (demo)', code: 'MN-DEMO', description: 'Mutual ficticia para comparar coberturas.' },
  private: { name: 'Plan Salud Río (demo)', code: 'PSR-DEMO', description: 'Plan privado ficticio.' },
  archived: { name: 'Convenio Anterior (demo)', code: 'CA-DEMO', description: 'Ejemplo de catálogo inactivo.', status: 'inactive' },
})) insurers[key] = await post('/insurers', data);

const services = {};
for (const [key, data] of Object.entries({
  kine: { name: 'Kinesiología (demo)', allowedModalities: ['individual', 'shared'], suggestedDurationMinutes: 60, description: 'Trabajo motor individual o compartido.' },
  fono: { name: 'Fonoaudiología (demo)', allowedModalities: ['individual'], suggestedDurationMinutes: 60 },
  to: { name: 'Terapia ocupacional (demo)', allowedModalities: ['individual', 'group'], suggestedDurationMinutes: 60 },
  psycho: { name: 'Psicología (demo)', allowedModalities: ['individual', 'group'], suggestedDurationMinutes: 60 },
  communication: { name: 'Taller de comunicación (demo)', allowedModalities: ['group'], suggestedDurationMinutes: 60 },
  cognitive: { name: 'Estimulación cognitiva (demo)', allowedModalities: ['group', 'shared'], suggestedDurationMinutes: 60 },
  interdisciplinary: { name: 'Evaluación interdisciplinaria (demo)', allowedModalities: ['individual', 'group', 'shared'], suggestedDurationMinutes: 45 },
})) services[key] = await post('/services', data);

const spaces = {};
for (const [key, data] of Object.entries({
  consult1: { name: 'Consultorio 1 (demo)', capacity: 1, description: 'Atención individual.' },
  consult2: { name: 'Consultorio 2 (demo)', capacity: 1, description: 'Atención individual.' },
  assessment: { name: 'Sala de evaluación (demo)', capacity: 2, description: 'Trabajo compartido pequeño.' },
  workshop: { name: 'Sala Taller (demo)', capacity: 5, description: 'Actividades grupales.' },
  gym: { name: 'Gimnasio terapéutico (demo)', capacity: 6, description: 'Actividad motora compartida.' },
})) spaces[key] = await post('/spaces', data);

const pros = {};
for (const [key, data] of Object.entries({
  ana: { firstName: 'Ana', lastName: 'Ríos', specialties: ['Kinesiología'], color: '#1F5297', email: 'ana.demo@plaza.example' },
  bruno: { firstName: 'Bruno', lastName: 'Paz', specialties: ['Fonoaudiología', 'Comunicación'], color: '#3B4B58', email: 'bruno.demo@plaza.example' },
  carla: { firstName: 'Carla', lastName: 'Vera', specialties: ['Terapia ocupacional'], color: '#697B8C', email: 'carla.demo@plaza.example' },
  diego: { firstName: 'Diego', lastName: 'Sosa', specialties: ['Psicología'], color: '#60765D', email: 'diego.demo@plaza.example' },
  elena: { firstName: 'Elena', lastName: 'Mora', specialties: ['Kinesiología', 'Estimulación cognitiva'], color: '#91735C', email: 'elena.demo@plaza.example' },
  inactive: { firstName: 'Nora', lastName: 'Díaz', specialties: ['Psicología'], color: '#777777', status: 'inactive' },
})) pros[key] = await post('/professionals', data);

for (const key of ['ana', 'bruno', 'carla', 'diego']) {
  users[key] = await post('/users', {
    name: `${pros[key].firstName} ${pros[key].lastName} (demo)`, email: pros[key].email,
    password, role: 'professional', professionalId: pros[key].id,
  });
}

  return { insurers, services, spaces, pros };
}
