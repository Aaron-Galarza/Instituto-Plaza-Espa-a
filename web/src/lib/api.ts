export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get fieldErrors(): Array<{ path: string; message: string }> {
    if (!Array.isArray(this.details)) return [];
    return this.details
      .filter(
        (item): item is { path?: unknown; message?: unknown } =>
          typeof item === 'object' && item !== null,
      )
      .map((item) => ({ path: String(item.path ?? ''), message: String(item.message ?? '') }))
      .filter((item) => item.message.length > 0);
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

const BASE = '/api/v1';

export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(`${BASE}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const error = (
      payload as { error?: { code?: string; message?: string; details?: unknown } } | null
    )?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ??
        (response.status >= 500
          ? `El servidor no respondió correctamente (${response.status}). Reintentá en unos segundos.`
          : `La solicitud falló (${response.status}).`),
      error?.details,
    );
  }

  return payload as T;
}

export function queryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.fieldErrors;
    if (details.length > 0) {
      return `${error.message} ${details.map((item) => item.message).join(' · ')}`;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.isUnauthorized;
}
