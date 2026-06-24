import { Request } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from 'src/prisma/prisma.service';
import { IS_PUBLIC_KEY } from 'src/public/public.decorator';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const { userId } = getAuth(request);

    if (!userId) return false;

    await this.ensureUserExists(userId);

    return true;
  }

  private async ensureUserExists(clerkId: string) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { id: clerkId },
      select: { id: true },
    });

    if (existingUser) return;

    const clerkUser = await clerkClient.users.getUser(clerkId);
    const name = clerkUser.fullName ?? clerkUser.username ?? 'Anonymous';
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      throw new Error(`Clerk user ${clerkId} is missing an email address`);
    }

    await this.prismaService.user.create({
      data: {
        id: clerkId,
        name,
        email,
      },
    });
  }
}
