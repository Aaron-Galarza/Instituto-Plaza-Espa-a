/**
 * Colores identificativos de profesionales. Deliberadamente distintos de la
 * paleta institucional (azul #1F5297, gris azulado #3B4B58, etc.).
 */
export const PROFESSIONAL_COLORS = [
  '#0F766E',
  '#B45309',
  '#7E22CE',
  '#BE123C',
  '#047857',
  '#A16207',
  '#0E7490',
  '#9333EA',
  '#C2410C',
  '#4D7C0F',
  '#9D174D',
  '#1D4ED8',
] as const;

export const DEFAULT_PROFESSIONAL_COLOR = PROFESSIONAL_COLORS[0];

export const INSTITUTION = {
  name: 'Instituto de Rehabilitación Plaza España',
  shortName: 'Plaza España',
  city: 'Resistencia, Chaco',
  timezone: 'America/Argentina/Cordoba',
} as const;
