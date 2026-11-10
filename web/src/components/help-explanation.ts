import { HELP, PAGE_HELP, normalizeHelpKey } from '@/lib/help-text';

export const TARGETS = [
  '[data-help]',
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'label',
  '.metric',
  '.summary-item',
  '.chart-bar',
  '.legend span',
  '.badge',
  '.panel-head h2',
  '.section-title',
  '.form-section h3',
  '.table th',
  '.table td',
  '.detail-row dt',
  '.segment-head strong',
  '.nav-group-label',
  '.topbar-title',
  '.page-head h1',
].join(', ');

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function fieldLabel(element: HTMLElement): string {
  const check = element.closest<HTMLLabelElement>('label.check');
  if (check) return clean(check.textContent ?? '');
  const field = element.closest<HTMLElement>('.field');
  if (field) return clean(field.querySelector('label')?.textContent ?? '');
  return '';
}

export function explanation(element: HTMLElement): string | null {
  const explicit = element.dataset.help;
  if (explicit) return explicit;

  const path = window.location.pathname;
  const isInput = element.matches('input, select, textarea');
  const label = isInput ? fieldLabel(element) || element.getAttribute('aria-label') || element.getAttribute('placeholder') || '' : '';
  const metricLabel = element.matches('.metric, .summary-item')
    ? element.querySelector('span')?.textContent ?? ''
    : '';
  const title = element.getAttribute('title') ?? '';
  const name = clean(
    label || metricLabel || element.getAttribute('aria-label') ||
      (element.matches('button, a, label, h1, h2, h3, th, .badge, .legend span') ? element.textContent ?? '' : '') ||
      title,
  );
  const key = normalizeHelpKey(name);

  if (isInput && element.getAttribute('type') === 'time' && (key === 'desde' || key === 'hasta')) {
    return key === 'desde' ? 'Elegí a qué hora empieza esta atención.' : 'Elegí a qué hora termina esta atención.';
  }

  if (element.matches('.chart-bar') && title) {
    return `${title}. Esta barra resume lo que hay planificado en ese día.`;
  }
  if (element.matches('.page-head h1')) return (PAGE_HELP as Record<string, string>)[path] ?? HELP[key] ?? null;
  if (element.matches('.topbar-title')) return (PAGE_HELP as Record<string, string>)[path] ?? null;
  if (HELP[key]) return HELP[key];

  if (element.matches('.nav-group-label')) return `Estas son las secciones de ${name.toLocaleLowerCase('es-AR')}. Elegí una para abrirla.`;
  if (element.matches('.segment-head strong')) return 'Esta es una parte de atención dentro de la misma jornada. Tiene su propio horario y prestación.';
  if (element.matches('.detail-row dt')) return `Este dato de la ficha se llama «${name}». A su lado aparece el valor guardado.`;

  if (element.matches('.table th')) {
    return `Esta columna muestra ${name.toLocaleLowerCase('es-AR')} de cada registro de la lista.`;
  }
  if (element.matches('.table td')) {
    const heading = element.closest('table')?.querySelectorAll('thead th');
    const index = Array.from(element.parentElement?.children ?? []).indexOf(element);
    const column = clean(heading?.[index]?.textContent ?? '');
    if (column && normalizeHelpKey(column) !== 'acciones') {
      return `Este es el dato de ${column.toLocaleLowerCase('es-AR')} para esta fila.`;
    }
    return 'Acá están las acciones que podés hacer con este registro.';
  }
  if (element.matches('.badge')) {
    return name ? `Esta etiqueta muestra el estado o característica: ${name}.` : null;
  }
  if (element.matches('input, select, textarea')) {
    if (element.getAttribute('type') === 'checkbox') {
      return `Marcá esta casilla para incluir «${label || name}». Desmarcala para quitarlo.`;
    }
    if (element.getAttribute('type') === 'date') return `Elegí la fecha de «${label || name}».`;
    if (element.getAttribute('type') === 'time') return `Elegí la hora de «${label || name}».`;
    if (element.matches('select')) return `Elegí una opción para «${label || name}». Esto se usará al filtrar o guardar.`;
    if (element.getAttribute('type') === 'search') return 'Escribí acá para buscar y acortar la lista que ves.';
    return `Escribí acá «${label || name || 'este dato'}». Se usará al guardar o buscar.`;
  }
  if (element.matches('label')) {
    if (key) return `Esta opción se llama «${name}». Marcala para incluirla o desmarcala para quitarla.`;
    return null;
  }
  if (element.matches('button, a')) {
    if (element.classList.contains('week-event') || element.classList.contains('month-chip') || element.classList.contains('day-event')) {
      return 'Abrí esta jornada para ver al paciente, el horario, la prestación y los cambios posibles.';
    }
    if (element.classList.contains('conflict-item')) {
      return 'Abrí el día de este problema para encontrar la jornada y revisarla.';
    }
    if (key.startsWith('ver el día ')) return 'Abre ese día de la agenda para ver sus jornadas con más detalle.';
    if (key.startsWith('quitar tramo ')) return 'Quita esta parte de atención de la jornada que estás armando.';
    if (key.startsWith('nuevo ') || key.startsWith('nueva ') || key.startsWith('agregar ')) {
      return `Abre un formulario para agregar ${name.replace(/^(nuevo|nueva|agregar)\s+/i, '').toLocaleLowerCase('es-AR')}.`;
    }
    if (key.startsWith('editar ') || key.startsWith('modificar ')) return 'Abre este elemento para cambiar sus datos.';
    if (key.startsWith('eliminar ') || key.startsWith('borrar ')) return 'Pide confirmación para borrar este elemento.';
    if (key.startsWith('ver ') || key.startsWith('mostrar ')) return 'Abre la información de este elemento.';
    if (key.startsWith('filtrar ') || key.startsWith('todas ') || key.startsWith('todos ')) return `Muestra solo lo que corresponde a «${name}». No cambia los datos guardados.`;
    if (element.matches('a')) return `Te lleva a «${name}». Allí podés ver los datos de esa sección.`;
    return name ? `Usá «${name}» para hacer esa acción en esta pantalla.` : null;
  }
  if (element.matches('h2, h3')) return name ? `Acá se muestra la parte de «${name}».` : null;
  if (element.matches('.legend span')) return name ? `Esta marca de la agenda significa: ${name}.` : null;
  return null;
}
