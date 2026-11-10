export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

export function matchesSearch(haystack: string, search: string | undefined): boolean {
  if (!search) return true;
  return normalizeForSearch(haystack).includes(normalizeForSearch(search));
}

export function personName(person: { firstName: string; lastName: string }): string {
  return `${person.lastName}, ${person.firstName}`;
}

export function personDisplayName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`;
}

export function nullIfEmpty(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function uniq<T>(items: T[]): T[] {
  return [...new Set(items)];
}
