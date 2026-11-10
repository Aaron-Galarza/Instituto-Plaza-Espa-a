import { seedGroups } from './seed-groups.mjs';
import { seedPatients } from './seed-patients.mjs';
import { seedCatalogs } from './seed-catalogs.mjs';

/**
 * Carga una base de demostración vacía mediante la API pública del sistema.
 * Uso en PowerShell: $env:DEMO_PASSWORD='...'; $env:SEED_BASE_URL='http://localhost:4200/api/v1'; node scripts/seed-demo.mjs
 * Nunca se ejecuta automáticamente al iniciar la aplicación.
 */
const base = process.env.SEED_BASE_URL;
const password = process.env.DEMO_PASSWORD;
if (!base || !password || password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  throw new Error('Definí SEED_BASE_URL y DEMO_PASSWORD (10 caracteres, letras y números).');
}

const cookies = new Map();
let actor = 'admin';
async function request(method, path, body) {
  const headers = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (cookies.has(actor)) headers.cookie = cookies.get(actor);
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookies.set(actor, setCookie.split(';')[0]);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(result)}`);
  }
  return result;
}
const post = (path, body) => request('POST', path, body);
const get = (path) => request('GET', path);

const DAY = 86400000;
const addDays = (date, count) => new Date(Date.parse(`${date}T12:00:00Z`) + count * DAY).toISOString().slice(0, 10);
const localToday = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Cordoba', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const isoWeekday = (date) => ((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
const monday = addDays(localToday, 1 - isoWeekday(localToday));
const start = addDays(monday, -14);
const finish = addDays(monday, 70);
const next = (weekday, weeks = 1) => addDays(monday, weekday - 1 + weeks * 7);

const status = await get('/auth/setup-status');
if (!status.needsSetup) throw new Error('La base destino contiene usuarios; se requiere una base vacía.');
await post('/auth/setup', {
  name: 'Mariana López (demo)', email: 'admin.demo@plaza.example', password,
});

const { insurers, services, spaces, pros } = await seedCatalogs(post, password);

const { patients, patientCount } = await seedPatients(post, addDays, insurers);

const groups = await seedGroups(post, services, pros, spaces, start, finish);

const segment = (service, modality, from, to, professionals, space, group) => ({
  serviceId: services[service].id, modality, startMinute: from, endMinute: to,
  professionalIds: professionals.map((key) => pros[key].id),
  spaceId: space ? spaces[space].id : null, groupId: group ? groups[group].id : null,
});
const rules = {};
async function rule(key, patient, daysOfWeek, segments, notes = '') {
  const created = await post('/schedule/rules', {
    patientId: patients[patient].id, daysOfWeek, effectiveFrom: start, effectiveTo: finish,
    startMinute: Math.min(...segments.map((part) => part.startMinute)),
    endMinute: Math.max(...segments.map((part) => part.endMinute)),
    segments, notes,
  });
  rules[key] = created.rule;
}
await rule('lucia', 'lucia', [1, 3], [
  segment('kine', 'individual', 510, 570, ['ana'], 'consult1'),
  segment('to', 'group', 570, 630, ['carla'], 'workshop', 'autonomy'),
], 'Jornada con dos prestaciones consecutivas.');
await rule('mateo', 'mateo', [1, 3], [segment('to', 'group', 570, 630, ['carla'], 'workshop', 'autonomy')]);
await rule('valentina', 'valentina', [1, 3], [segment('to', 'group', 570, 630, ['carla'], 'workshop', 'autonomy')]);
await rule('sofia', 'sofia', [2, 4], [
  segment('fono', 'individual', 510, 570, ['bruno'], 'consult2'),
  segment('psycho', 'individual', 570, 630, ['diego'], 'consult1'),
]);
await rule('tomas', 'tomas', [2, 4], [segment('kine', 'shared', 600, 660, ['ana'], 'gym', 'motor')]);
await rule('emilia', 'emilia', [2, 4], [segment('kine', 'shared', 600, 660, ['ana'], 'gym', 'motor')]);
await rule('joaquin', 'joaquin', [5], [
  segment('kine', 'individual', 510, 570, ['ana'], 'consult1'),
  segment('to', 'individual', 570, 630, ['carla'], 'consult1'),
]);
await rule('martina', 'martina', [5], [segment('communication', 'group', 600, 660, ['bruno'], 'workshop', 'language')]);
await rule('benjamin', 'benjamin', [5], [segment('communication', 'group', 600, 660, ['bruno'], 'workshop', 'language')]);
await rule('gabriel', 'gabriel', [3], [segment('cognitive', 'shared', 660, 720, ['diego', 'elena'], 'assessment', 'cognition')]);
await rule('clara', 'clara', [3], [segment('cognitive', 'shared', 660, 720, ['diego', 'elena'], 'assessment', 'cognition')]);

// Excepción de fecha: Joaquín empieza media hora antes sólo el viernes próximo.
await post(`/schedule/rules/${rules.joaquin.id}/change`, {
  scope: 'date', date: next(5), expectedVersion: rules.joaquin.version,
  changes: {
    startMinute: 480, endMinute: 600,
    segments: [
      segment('kine', 'individual', 480, 540, ['ana'], 'consult1'),
      segment('to', 'individual', 540, 600, ['carla'], 'consult1'),
    ],
    notes: 'Sólo esta fecha comienza a las 08:00.',
  },
});
// Una cancelación puntual visible al activar «Incluir canceladas».
await post('/schedule/exceptions', {
  scheduleRuleId: rules.martina.id, date: next(5, 2), type: 'cancelled',
  reason: 'Fecha cancelada para mostrar una excepción de agenda.',
});

// Una ausencia futura produce afectaciones sin vaciar la agenda habitual.
await post('/availability', {
  professionalId: pros.ana.id, kind: 'absence', dayOfWeek: null,
  startMinute: 600, endMinute: 660, effectiveFrom: next(2), effectiveTo: next(2),
  notes: 'Ausencia de demostración: revisar las jornadas compartidas.',
});
await post('/availability', {
  professionalId: pros.bruno.id, kind: 'block', dayOfWeek: null,
  startMinute: 780, endMinute: 840, effectiveFrom: next(4), effectiveTo: next(4),
  notes: 'Bloqueo sin jornada afectada.',
});

async function as(key) {
  actor = key;
  if (!cookies.has(key)) await post('/auth/login', { email: pros[key].email, password });
}
const createdRequests = [];
await as('bruno');
createdRequests.push(await post('/change-requests', {
  type: 'change_space', scheduleRuleId: rules.sofia.id, date: next(2),
  segmentId: rules.sofia.segments[0].id, spaceId: spaces.assessment.id,
  reason: 'Propuesta de usar la sala de evaluación para esta fecha.',
}));
await as('carla');
createdRequests.push(await post('/change-requests', {
  type: 'cancel_date', scheduleRuleId: rules.mateo.id, date: next(3),
  reason: 'Ejemplo de cancelación puntual pendiente de coordinación.',
}));
await as('diego');
createdRequests.push(await post('/change-requests', {
  type: 'modify_date', scheduleRuleId: rules.sofia.id, date: next(4),
  startMinute: 660, endMinute: 780,
  segments: [
    segment('fono', 'individual', 660, 720, ['bruno'], 'consult2'),
    segment('psycho', 'individual', 720, 780, ['diego'], 'consult1'),
  ],
  reason: 'Se propone trasladar ambos tramos al mediodía.',
}));
await as('ana');
createdRequests.push(await post('/change-requests', {
  type: 'reassign_professional', scheduleRuleId: rules.lucia.id, date: next(1),
  segmentId: rules.lucia.segments[0].id, professionalId: pros.elena.id,
  reason: 'Cobertura propuesta para la atención individual de Lucía.',
}));

// Historial de los otros estados, sin alterar las solicitudes pendientes anteriores.
const approved = await post('/change-requests', {
  type: 'change_space', scheduleRuleId: rules.joaquin.id, date: next(5, 3),
  segmentId: rules.joaquin.segments[0].id, spaceId: spaces.consult2.id,
  reason: 'Mostrar una solicitud aprobada en el historial.',
});
await as('bruno');
const rejected = await post('/change-requests', {
  type: 'cancel_date', scheduleRuleId: rules.martina.id, date: next(5, 3),
  reason: 'Mostrar una solicitud rechazada en el historial.',
});
await post(`/change-requests/${rejected.id}/cancel`, { note: 'La profesional anuló el pedido.' });
actor = 'admin';
await post(`/change-requests/${approved.id}/approve`, {
  note: 'Aprobado como ejemplo de cambio de espacio.', expectedVersion: approved.version,
});
const manualReject = await as('carla').then(() => post('/change-requests', {
  type: 'cancel_date', scheduleRuleId: rules.valentina.id, date: next(1, 2),
  reason: 'Mostrar un rechazo administrativo en el historial.',
}));
actor = 'admin';
await post(`/change-requests/${manualReject.id}/reject`, {
  note: 'La jornada se mantiene según lo programado.', expectedVersion: manualReject.version,
});

const agenda = await get(`/schedule?from=${monday}&to=${addDays(monday, 6)}`);
const issues = await get('/availability/issues?status=pending');
const requests = await get('/change-requests?status=pending');
console.log(JSON.stringify({
  week: [monday, addDays(monday, 6)],
  users: 6, patients: patientCount, professionals: Object.keys(pros).length,
  insurers: Object.keys(insurers).length, services: Object.keys(services).length,
  spaces: Object.keys(spaces).length, groups: Object.keys(groups).length,
  rules: Object.keys(rules).length,
  agendaOccurrences: agenda.items?.length ?? agenda.occurrences?.length ?? (Array.isArray(agenda) ? agenda.length : null),
  pendingIssues: issues.items?.length ?? (Array.isArray(issues) ? issues.length : null),
  pendingRequests: requests.items?.length ?? (Array.isArray(requests) ? requests.length : null),
}, null, 2));
