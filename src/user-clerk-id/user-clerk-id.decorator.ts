import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { getAuth } from '@clerk/express';

export const UserClerkId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const { userId } = getAuth(request);

    return userId;
  },
);
