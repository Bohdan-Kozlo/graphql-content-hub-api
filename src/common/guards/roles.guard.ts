import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Role } from 'prisma/generated';
import { ROLES_KEY } from '../decorators/reles.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

interface GqlContextType {
  req?: {
    user?: {
      roles?: Role[];
    };
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!requiredRoles) {
      return true;
    }
    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContextType>();
    const userRoles = gqlCtx?.req?.user?.roles ?? [];
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
