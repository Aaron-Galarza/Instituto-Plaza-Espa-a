import { CanActivate, ExecutionContext, Inject, Injectable, type Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import type { SessionUser } from '@plaza/shared';
import { AuthService } from '../auth/auth.service';
import { APP_CONFIG } from '../config/tokens';
import type { AppConfig } from '../config/env';
import { AppError } from './errors';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY, type AuthenticatedRequest } from './auth.decorators';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function cookieReader(request: FastifyRequest): Record<string, string | undefined> {
  return (
    (request as FastifyRequest & { cookies?: Record<string, string | undefined> }).cookies ?? {}
  );
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass() as Type,
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!SAFE_METHODS.has(request.method)) {
      const origin = request.headers.origin;
      if (origin && !this.config.webOrigins.includes(origin)) {
        throw AppError.forbidden('Origen de la solicitud no autorizado.');
      }
    }

    if (isPublic) return true;

    const token = cookieReader(request)[this.config.cookie.name];
    const resolved = await this.auth.resolveSession(token);
    if (!resolved) throw AppError.unauthorized();

    request.user = resolved.user;
    request.sessionToken = token ?? '';
    return true;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass() as Type,
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass() as Type,
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: SessionUser | undefined = request.user;
    if (!user) throw AppError.unauthorized();

    const missing = required.filter((permission) => !user.permissions.includes(permission));
    if (missing.length > 0) {
      throw AppError.forbidden(`No tenés permisos para esta operación (${missing.join(', ')}).`);
    }
    return true;
  }
}
