import { GqlExecutionContext } from '@nestjs/graphql';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface GqlContextType {
  req?: {
    user?: {
      userId?: string;
    };
  };
}

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const gqlContext = GqlExecutionContext.create(context);
  const ctx = gqlContext.getContext<GqlContextType>();
  return ctx?.req?.user?.userId ?? null;
});
