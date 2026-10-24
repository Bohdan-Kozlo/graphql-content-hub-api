import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

interface GqlContextType {
  req?: Record<string, unknown>;
}

@Injectable()
export class OptionalAccessGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const gqlContext = GqlExecutionContext.create(context);
    const contextValue = gqlContext.getContext<GqlContextType>();
    return contextValue?.req ?? null;
  }

  handleRequest<TUser>(error: unknown, user: TUser | false | null): TUser | null {
    if (error) {
      throw error instanceof Error ? error : new Error('Unable to authenticate request');
    }

    return user || null;
  }
}
