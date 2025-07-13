import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ExecutionContext, Injectable } from '@nestjs/common';

interface GqlContextType {
  req?: Record<string, unknown>;
}

@Injectable()
export class RefreshGuard extends AuthGuard('jwt-refresh') {
  // This method is required by NestJS AuthGuard, even if not used directly
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContextType>();
    return gqlCtx?.req ?? null;
  }
}
