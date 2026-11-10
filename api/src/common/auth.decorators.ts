import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { Permission } from '@plaza/shared';
import type { SessionUser } from '@plaza/shared';

export const IS_PUBLIC_KEY = 'plaza:isPublic';
export const PERMISSIONS_KEY = 'plaza:permissions';

export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const RequirePermissions = (
  ...permissions: Permission[]
): MethodDecorator & ClassDecorator => SetMetadata(PERMISSIONS_KEY, permissions);

export interface AuthenticatedRequest extends FastifyRequest {
  user: SessionUser;
  sessionToken: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);

export const SessionToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.sessionToken;
  },
);
