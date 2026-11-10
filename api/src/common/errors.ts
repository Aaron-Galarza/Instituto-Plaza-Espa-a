export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'STALE_WRITE'
  | 'REFERENCE_CONFLICT'
  | 'RATE_LIMITED'
  | 'CONFIGURATION_REQUIRED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static validation(message = 'Datos inválidos', details?: unknown) {
    return new AppError('VALIDATION_ERROR', 422, message, details);
  }
  static unauthorized(message = 'Necesitás iniciar sesión') {
    return new AppError('UNAUTHENTICATED', 401, message);
  }
  static forbidden(message = 'No tenés permisos para esta operación') {
    return new AppError('FORBIDDEN', 403, message);
  }
  static notFound(entity: string) {
    return new AppError('NOT_FOUND', 404, `${entity} no encontrado`);
  }
  static conflict(message: string, details?: unknown) {
    return new AppError('CONFLICT', 409, message, details);
  }
  static reference(message: string, details?: unknown) {
    return new AppError('REFERENCE_CONFLICT', 409, message, details);
  }
  static staleWrite(
    message = 'El registro fue modificado por otra operación. Recargá y volvé a intentar.',
  ) {
    return new AppError('STALE_WRITE', 409, message);
  }
  static rateLimited(message = 'Demasiados intentos. Esperá unos minutos.') {
    return new AppError('RATE_LIMITED', 429, message);
  }
}
