import { DETAIL_HELP } from './help-text-details';

/** Short, plain-language explanations shown throughout the application. */
export const PAGE_HELP = {
  '/agenda':
    'Acá ves quién viene, a qué hora, con qué profesional y en qué espacio. También podés organizar jornadas nuevas.',
  '/mi-agenda': 'Acá ves tus propios turnos de trabajo y los pacientes que vas a atender.',
  '/dashboard':
    'Acá se juntan los números de la agenda para ver cómo está funcionando el instituto.',
  '/disponibilidad':
    'Acá anotás cuándo puede trabajar cada profesional y cuándo no puede venir. Las ausencias pueden afectar la agenda.',
  '/solicitudes':
    'Acá aparecen los pedidos para cambiar una jornada. Una persona autorizada puede aprobarlos o rechazarlos.',
  '/pacientes':
    'Acá guardás los datos de las personas que reciben atención. Después las podés agregar a la agenda.',
  '/profesionales':
    'Acá guardás los datos de quienes atienden a los pacientes. Sus horarios se usan en la agenda.',
  '/obras-sociales':
    'Acá guardás las coberturas de los pacientes para saber a cuál pertenece cada uno.',
  '/prestaciones':
    'Acá definís qué tipo de atención ofrece el instituto. Luego la elegís en cada jornada.',
  '/espacios':
    'Acá anotás los consultorios y lugares de atención, y cuántas personas pueden usarlos a la vez.',
  '/grupos':
    'Acá armás conjuntos de pacientes para atenderlos juntos, con una prestación y un límite de lugares.',
  '/usuarios':
    'Acá creás cuentas para entrar al sistema y decidís qué puede hacer cada persona según su rol.',
  '/auditoria': 'Acá podés ver qué cambios se hicieron, quién los hizo y cuándo.',
  '/perfil': 'Acá ves tu cuenta y podés cambiar tus datos de acceso.',
  '/login': 'Escribí tu correo y contraseña para entrar al sistema.',
  '/setup':
    'Acá se crea la primera cuenta de administración, solo cuando el sistema todavía no tiene usuarios.',
} as const satisfies Record<string, string>;

export const HELP: Record<string, string> = {
  agenda: PAGE_HELP['/agenda'],
  'mi agenda': PAGE_HELP['/mi-agenda'],
  tablero: PAGE_HELP['/dashboard'],
  disponibilidad: PAGE_HELP['/disponibilidad'],
  solicitudes: PAGE_HELP['/solicitudes'],
  pacientes: PAGE_HELP['/pacientes'],
  profesionales: PAGE_HELP['/profesionales'],
  'obras sociales': PAGE_HELP['/obras-sociales'],
  prestaciones: PAGE_HELP['/prestaciones'],
  espacios: PAGE_HELP['/espacios'],
  grupos: PAGE_HELP['/grupos'],
  usuarios: PAGE_HELP['/usuarios'],
  auditoría: PAGE_HELP['/auditoria'],
  'mi perfil': PAGE_HELP['/perfil'],
  'cerrar sesión':
    'Salís de tu cuenta. Para volver a entrar, vas a escribir tu correo y contraseña.',
  'abrir menú': 'Muestra las secciones del sistema.',
  'cerrar menú': 'Esconde el menú de secciones.',
  cerrar: 'Cierra esta ventana. Los cambios que todavía no guardaste se pierden.',
  ingresar: 'Revisa tu correo y contraseña y, si son correctos, te lleva a tu pantalla de trabajo.',
  'mostrar contraseña':
    'Deja ver la clave que escribiste para comprobar que esté bien. Volvé a tocarlo para ocultarla.',
  'ocultar contraseña': 'Vuelve a tapar la clave para que nadie cerca pueda leerla.',
  cancelar: 'Cierra este formulario sin guardar lo que cambiaste.',
  volver: 'Regresa a la pantalla anterior sin confirmar esta acción.',
  guardar: 'Guarda los datos que escribiste para que aparezcan en el sistema.',
  'guardar cambios': 'Guarda las modificaciones de este registro.',
  crear: 'Agrega un registro nuevo con los datos que completaste.',
  'crear administración':
    'Crea la primera cuenta que podrá organizar el sistema y dar acceso a otras personas.',
  editar: 'Abre los datos de este registro para que los puedas cambiar.',
  eliminar: 'Borra este registro. El sistema te pedirá confirmación antes de hacerlo.',
  'ver detalle': 'Abre toda la información de este elemento.',
  ver: 'Abre los detalles de este elemento.',
  reintentar: 'Vuelve a pedir la información si antes hubo un error.',
  limpiar: 'Borra lo que elegiste en los filtros para volver a ver la lista completa.',
  buscar: 'Escribí una palabra para encontrar solo los resultados que coincidan.',
  estado: 'Elegí si querés ver o guardar elementos activos, inactivos o de otro estado.',
  activo: 'Este elemento está disponible para usarlo en el sistema.',
  inactivo: 'Este elemento queda guardado, pero no se usa para crear jornadas nuevas.',
  pendiente: 'Todavía falta que alguien revise o decida sobre este elemento.',
  aprobada: 'Este pedido fue aceptado y el cambio se aplicó a la agenda.',
  rechazada: 'Este pedido no fue aceptado; la agenda no cambió por él.',
  resuelta: 'Esta afectación ya tiene una decisión registrada.',
  desestimada: 'Se revisó esta afectación y se cerró sin cambiar la jornada.',
  rol: 'El rol indica qué partes del sistema puede usar esta cuenta.',
  profesional: 'La persona que atiende al paciente. La agenda revisa su disponibilidad.',
  prestación: 'El tipo de atención que recibe el paciente, por ejemplo una terapia.',
  espacio:
    'El lugar donde ocurre la atención. Su capacidad limita cuántas personas pueden estar al mismo tiempo.',
  grupo: 'Pacientes que comparten una atención. El grupo tiene un cupo máximo.',
  paciente: 'La persona que recibe la atención y aparece en la agenda.',
  'obra social': 'La cobertura asociada al paciente. Es un dato administrativo.',
  tipo: 'Elegí la clase de elemento que querés ver o guardar.',
  nombre: 'Escribí el nombre con el que vas a reconocer este elemento.',
  apellido: 'Escribí el apellido de esta persona.',
  'nombre y apellido': 'Escribí cómo se llama esta persona para reconocerla en el sistema.',
  'correo electrónico':
    'Escribí una dirección de correo válida. En una cuenta de usuario se usa para iniciar sesión.',
  contraseña: 'Escribí la clave de la cuenta. No se muestra mientras la escribís.',
  'contraseña inicial': 'Es la primera clave que esta persona usará para entrar.',
  'nueva contraseña': 'Esta clave reemplazará la anterior cuando guardes.',
  documento: 'Escribí el número de documento para identificar al paciente.',
  'fecha de nacimiento': 'Elegí el día en que nació el paciente.',
  teléfono: 'Escribí un número de contacto para esta persona.',
  'n.º de afiliado': 'Escribí el número que la obra social le dio al paciente.',
  traslado: 'Marcá esto si el paciente necesita un traslado.',
  'notas administrativas':
    'Anotá información útil para organizar la atención. No es una historia clínica.',
  notas: 'Escribí una aclaración breve que ayude a organizar este registro.',
  descripción: 'Contá en pocas palabras qué es este elemento.',
  'código interno': 'Es una abreviatura para reconocer rápidamente esta obra social.',
  especialidades: 'Elegí las áreas en las que trabaja este profesional.',
  'color en la agenda': 'Elegí el color con el que se verá este profesional en la agenda.',
  'usuario vinculado':
    'Une a este profesional con su cuenta de acceso para que vea su propia agenda.',
  'profesional vinculado': 'Une esta cuenta con el profesional que representa.',
  'nombre del grupo': 'Poné un nombre fácil de reconocer para este grupo de atención.',
  modalidad: 'Indica si la atención es individual, grupal o compartida.',
  'modalidades habilitadas':
    'Elegí de qué formas se puede dar esta prestación: a una persona o a varias juntas.',
  'capacidad del grupo':
    'Es la cantidad máxima de pacientes que pueden participar al mismo tiempo.',
  'capacidad simultánea':
    'Es la cantidad máxima de personas que pueden usar este espacio a la vez.',
  'profesionales del grupo': 'Elegí las personas autorizadas para atender a este grupo.',
  'espacio habitual': 'Es el lugar que normalmente usa el grupo. Se puede cambiar en una jornada.',
  'duración sugerida (minutos)':
    'Es una ayuda para calcular cuánto suele durar esta prestación. Podés ajustar la duración en la agenda.',
  'tipo de registro':
    'Elegí si es un horario habitual, una ausencia o un bloqueo de disponibilidad.',
  'día de la semana': 'Elegí el día que se repite en un horario habitual.',
  'hora desde': 'Es la hora en que empieza este horario.',
  'hora hasta': 'Es la hora en que termina este horario.',
  'vigencia desde': 'Es el primer día en que vale este horario, ausencia o bloqueo.',
  'vigencia hasta': 'Es el último día en que vale este horario, ausencia o bloqueo.',
  'estado de afectación':
    'Filtra los problemas de agenda causados por ausencias: pendientes, resueltos o descartados.',
  'horarios habituales':
    'Muestran los días y horas en que un profesional puede atender normalmente.',
  'ausencias y bloqueos':
    'Muestran los días en que un profesional no puede atender, aunque tenga un horario habitual.',
  'afectaciones de agenda':
    'Son jornadas que chocan con una ausencia o bloqueo. Hay que decidir qué hacer con cada una.',
  acción: 'Elegí qué querés hacer con esta afectación.',
  'profesional de reemplazo':
    'Elegí otra persona que pueda atender esa jornada. El sistema revisará si está disponible.',
  'nueva fecha':
    'Elegí otro día para esta jornada. El sistema comprobará si el cambio se puede hacer.',
  'nuevo inicio de jornada': 'Elegí a qué hora empezará la jornada en la fecha nueva.',
  motivo: 'Contá por qué se pide o se hace este cambio.',
  desde: 'Es el primer día que se incluye en lo que estás mirando.',
  hasta: 'Es el último día que se incluye en lo que estás mirando.',
  día: 'Muestra una sola fecha de la agenda.',
  ...DETAIL_HELP,
};

export function normalizeHelpKey(value: string): string {
  return value
    .toLocaleLowerCase('es-AR')
    .replace(/\s*\*\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}
