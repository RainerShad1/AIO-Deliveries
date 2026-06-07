import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Forma de req.user, inyectada por jwt.strategy.validate().
// businessId es null para CLIENTE y SUPER_ADMIN; tiene valor para ADMIN.
export interface AuthUser {
  userId: string;
  role: 'CLIENTE' | 'ADMIN' | 'SUPER_ADMIN';
  businessId: string | null;
}

// Uso: metodo(@CurrentUser() user: AuthUser) { ... }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
