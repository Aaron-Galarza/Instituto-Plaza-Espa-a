export const DETAIL_HELP: Record<string, string> = {
  semana: 'Muestra siete días, de lunes a domingo.',
  mes: 'Muestra todas las fechas del mes.',
  hoy: 'Te lleva a la fecha de hoy.',
  'semana actual': 'Elige desde el lunes hasta el domingo de esta semana para ver sus números.',
  'mes anterior': 'Mueve el tablero al mes anterior.',
  'mes actual': 'Elige el primer y último día de este mes para ver sus números.',
  'mes siguiente': 'Mueve el tablero al mes siguiente.',
  'período anterior': 'Muestra el día, semana o mes anterior, según la vista elegida.',
  'período siguiente': 'Muestra el día, semana o mes siguiente, según la vista elegida.',
  'ir a una fecha': 'Elegí un día concreto para abrirlo en la agenda.',
  'nueva jornada':
    'Agrega una atención a la agenda: paciente, día, hora, prestación, profesional y espacio.',
  'agregar tramo':
    'Agrega otra parte de atención dentro de la misma jornada. Cada parte puede tener su propia prestación y horario.',
  'tramos de atención':
    'Son las partes de una jornada. Cada una tiene un tipo de atención, una hora y profesionales.',
  'notas de la fecha': 'Esta aclaración vale solo para la fecha que estás cambiando.',
  recurrencia: 'Es un horario que se repite cada semana. Sus fechas aparecen solas en la agenda.',
  'modificar solo esta fecha':
    'Cambia esta jornada una sola vez. El horario de las otras semanas sigue igual.',
  'cambiar este día semanal desde ahora':
    'Cambia este día de la semana en las semanas futuras. Los otros días de la serie siguen igual.',
  'cambiar toda la recurrencia desde ahora':
    'Cambia todas las jornadas futuras de esta serie, desde la fecha que elijas.',
  finalizar: 'Hace que este horario repetido deje de crear jornadas después de una fecha.',
  'finalizar recurrencia':
    'Elegí la última fecha de atención. Después de ese día, esta serie ya no crea jornadas.',
  'última fecha con atención': 'Es el último día en que esta serie puede crear una jornada.',
  'cancelar serie':
    'Cancela las jornadas futuras de este horario repetido. Las fechas pasadas quedan guardadas.',
  'cancelar recurrencia':
    'Cancela todas las jornadas futuras de esta serie. Las fechas pasadas quedan registradas.',
  'cancelar solicitud': 'Retira este pedido pendiente. No modifica la agenda.',
  'mover bloque grupal':
    'Mueve juntos a todos los pacientes de esta atención grupal, para que sigan compartiendo día y horario.',
  'agrupar por': 'Cambia el orden de la agenda. No modifica ningún turno.',
  'incluir canceladas': 'Muestra también las jornadas que fueron canceladas.',
  'pendientes próximos 84 días':
    'Problemas importantes que el sistema encuentra al mirar la agenda de los próximos 84 días.',
  'conflictos del período':
    'Problemas entre jornadas del rango visible, como dos turnos al mismo tiempo o un cupo lleno.',
  'ocupación de grupos':
    'Muestra cuántos pacientes usan cada grupo en esta fecha y cuántos lugares tiene.',
  'lectura de la agenda':
    'Explica cómo se forman las jornadas que ves a partir de horarios repetidos y sus cambios.',
  programada: 'Esta jornada está prevista y todavía no fue modificada ni cancelada.',
  modificada: 'Esta jornada cambió respecto del horario que se repite normalmente.',
  'por resolver': 'Hay un problema en esta jornada y alguien tiene que decidir cómo solucionarlo.',
  cancelada: 'Esta jornada ya no se realizará en esa fecha.',
  advertencia: 'Algo merece atención, pero no impide guardar la jornada.',
  bloqueante: 'Este problema impide hacer el cambio hasta que se corrija.',
  'excepciones de la serie':
    'Son fechas concretas en las que el horario habitual fue cambiado o cancelado.',
  'acciones sobre la recurrencia':
    'Cambian el horario que se repite cada semana. Elegí bien desde cuándo debe aplicarse.',
  'esta fecha': 'Cambia solo esta jornada. Las demás fechas de la serie siguen igual.',
  'este día desde ahora': 'Cambia este mismo día de la semana desde ahora en adelante.',
  'toda la serie desde ahora': 'Cambia todas las fechas futuras de esta serie.',
  verificar: 'Revisa si lo que elegiste choca con horarios, espacios o cupos antes de guardarlo.',
  validar: 'Revisa si hay problemas antes de guardar.',
  'solicitar cambio':
    'Envía un pedido para cambiar una jornada. La agenda cambia cuando se aprueba.',
  aprobar: 'Acepta este pedido y aplica el cambio en la agenda si no hay conflictos.',
  rechazar: 'No aplica el cambio pedido y marca la solicitud como rechazada.',
  'ajustar propuesta': 'Permite corregir un pedido pendiente antes de aprobarlo.',
  resolver: 'Elige cómo arreglar una jornada afectada por una ausencia.',
  reasignar: 'Pone a otro profesional en la jornada afectada.',
  reprogramar: 'Mueve la jornada a otra fecha y hora.',
  desestimar: 'Marca esta afectación como revisada sin cambiar la jornada.',
  'cancelar fecha': 'Cancela solo esta jornada de esta fecha.',
  'página anterior': 'Muestra los registros de la página anterior.',
  'página siguiente': 'Muestra los registros de la página siguiente.',
  'pacientes únicos':
    'Cuenta personas distintas atendidas en las fechas elegidas. Una persona con varias jornadas cuenta una sola vez.',
  'jornadas activas': 'Cuenta las jornadas programadas en las fechas elegidas.',
  'tramos de prestación':
    'Cuenta cada parte de atención de una jornada. Una jornada puede tener varios tramos.',
  'profesionales con agenda':
    'Cuenta los profesionales que tienen al menos una jornada en estas fechas.',
  'minutos de paciente': 'Suma el tiempo de atención planificado para los pacientes.',
  'minutos profesionales':
    'Suma el tiempo ocupado de los profesionales sin contar dos veces un grupo atendido a la vez.',
  'disponibilidad cargada':
    'Suma las horas en que los profesionales figuran disponibles en estas fechas.',
  'máx. pacientes simultáneos': 'Es la mayor cantidad de pacientes programados al mismo tiempo.',
  'conflictos pendientes': 'Cuenta los problemas de agenda que todavía necesitan solución.',
  'solicitudes pendientes': 'Cuenta pedidos de cambio que todavía esperan una decisión.',
  'pacientes con más de una prestación':
    'Cuenta pacientes que tienen distintos tipos de atención en estas fechas.',
  'tramos sin profesional':
    'Cuenta partes de jornadas que todavía no tienen una persona asignada para atender.',
  'afectaciones por resolver':
    'Cuenta jornadas que chocan con ausencias y todavía necesitan una decisión.',
  'jornadas canceladas': 'Cuenta las jornadas que fueron canceladas en estas fechas.',
  'cambios de agenda': 'Cuenta modificaciones hechas a jornadas planificadas.',
  'jornadas por día': 'Cada barra muestra cuántas jornadas hay en un día del período.',
  'distribución por prestación':
    'Muestra cómo se reparten las jornadas entre los distintos tipos de atención.',
  'conflictos y afectaciones':
    'Reúne los problemas de agenda y las jornadas afectadas por ausencias.',
  eventos:
    'Cada fila muestra un cambio hecho en el sistema, con la fecha y la persona responsable.',
  'tipo de cambio':
    'Elegí qué clase de pedido querés ver: cancelar, cambiar horario, cambiar profesional o cambiar espacio.',
  'sólo mis solicitudes': 'Muestra únicamente los pedidos que creaste vos.',
  'limpiar filtros': 'Vuelve a mostrar los pedidos pendientes de todos los tipos.',
  pendientes: 'Muestra pedidos que todavía esperan una decisión.',
  todas: 'Muestra los pedidos de todos los estados.',
  aprobadas: 'Muestra pedidos aceptados que ya se aplicaron a la agenda.',
  rechazadas: 'Muestra pedidos que no se aplicaron a la agenda.',
  canceladas: 'Muestra pedidos que su autor retiró antes de resolverse.',
  propuesta: 'Acá ves el cambio exacto que se pidió para esta jornada.',
  resolución: 'Acá ves quién decidió sobre el pedido y qué nota dejó.',
  solicitante: 'Es la persona que pidió este cambio.',
  'fecha propuesta': 'Es la fecha de la jornada que se quiere cambiar.',
  creada: 'Es el momento en que se envió el pedido.',
  'ficha administrativa':
    'Muestra los datos básicos del paciente usados para organizar su atención.',
  'semana del paciente': 'Muestra las jornadas que tiene este paciente durante esta semana.',
  'historial administrativo del paciente':
    'Muestra cambios de organización hechos para este paciente.',
};
