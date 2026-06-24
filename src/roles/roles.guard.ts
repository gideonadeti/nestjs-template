import { getAuth } from '@clerk/express';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { UserRole } from '../generated/prisma/enums.js';
import { IS_PUBLIC_KEY } from 'src/public/public.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const { userId } = getAuth(request);

    if (!userId) return false;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    return requiredRoles.includes(user.role);
  }
}
