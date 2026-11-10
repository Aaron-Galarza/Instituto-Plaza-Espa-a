import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  changePasswordSchema,
  loginSchema,
  setupSchema,
  type AuthResponse,
  type ChangePasswordInput,
  type LoginInput,
  type SessionUser,
  type SetupInput,
} from '@plaza/shared';
import { AuthService } from './auth.service';
import { Public, CurrentUser, SessionToken } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';
import { AppError } from '../common/errors';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get('setup-status')
  async setupStatus(): Promise<{ needsSetup: boolean }> {
    return { needsSetup: await this.auth.needsSetup() };
  }

  @Public()
  @Post('setup')
  async setup(
    @Body(zod(setupSchema)) input: SetupInput,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const result = await this.auth.setup(input, request.ip);
    this.setSessionCookie(reply, result.token);
    return { user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(zod(loginSchema)) input: LoginInput,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponse> {
    const result = await this.auth.login(input, request.ip);
    this.setSessionCookie(reply, result.token);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @CurrentUser() user: SessionUser,
    @SessionToken() token: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ ok: true }> {
    await this.auth.logout(user, token);
    reply.clearCookie(this.auth.cookieSettings().name, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: SessionUser): AuthResponse {
    return { user };
  }

  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() user: SessionUser,
    @Body(zod(changePasswordSchema)) input: ChangePasswordInput,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ requiresLogin: true }> {
    if (!user) throw AppError.unauthorized();
    await this.auth.changePassword(user, input);
    const settings = this.auth.cookieSettings();
    reply.clearCookie(settings.name, { path: '/' });
    return { requiresLogin: true };
  }

  private setSessionCookie(reply: FastifyReply, token: string): void {
    const settings = this.auth.cookieSettings();
    reply.setCookie(settings.name, token, {
      path: settings.path,
      httpOnly: settings.httpOnly,
      secure: settings.secure,
      sameSite: settings.sameSite,
      maxAge: settings.maxAge,
    });
  }
}
