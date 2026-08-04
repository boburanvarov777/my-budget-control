import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';

/** Request shape after JwtStrategy.validate() has attached the user. */
interface AuthenticatedRequest {
  user: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
