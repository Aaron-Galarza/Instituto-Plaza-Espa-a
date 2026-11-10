import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  userQuerySchema,
  userStatusSchemaUpdate,
  idSchema,
  type CreateUserInput,
  type PaginatedResult,
  type ResetPasswordInput,
  type SessionUser,
  type UpdateUserInput,
  type User,
  type UserQuery,
  type UserStatusUpdate,
} from '@plaza/shared';
import { UsersService } from './users.service';
import { CurrentUser, RequirePermissions } from '../common/auth.decorators';
import { zod } from '../common/zod.pipe';

@Controller('users')
@RequirePermissions('users:manage')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query(zod(userQuerySchema)) query: UserQuery): Promise<PaginatedResult<User>> {
    return this.users.list(query);
  }

  @Post()
  create(
    @CurrentUser() actor: SessionUser,
    @Body(zod(createUserSchema)) input: CreateUserInput,
  ): Promise<User> {
    return this.users.create(actor, input);
  }

  @Get(':id')
  get(@Param('id', zod(idSchema)) id: string): Promise<User> {
    return this.users.get(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(updateUserSchema)) input: UpdateUserInput,
  ): Promise<User> {
    return this.users.update(actor, id, input);
  }

  @Post(':id/status')
  setStatus(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(userStatusSchemaUpdate)) input: UserStatusUpdate,
  ): Promise<User> {
    return this.users.setStatus(actor, id, input);
  }

  @Post(':id/reset-password')
  resetPassword(
    @CurrentUser() actor: SessionUser,
    @Param('id', zod(idSchema)) id: string,
    @Body(zod(resetPasswordSchema)) input: ResetPasswordInput,
  ): Promise<{ ok: true }> {
    return this.users.resetPassword(actor, id, input);
  }
}
