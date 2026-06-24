import { Injectable, Logger } from '@nestjs/common';
import { clerkClient } from '@clerk/express';
import { verifyWebhook } from '@clerk/express/webhooks';
import { Request, Response } from 'express';

import { PrismaService } from 'src/prisma/prisma.service';

const supportedClerkEvents = {
  userCreated: 'user.created',
  userUpdated: 'user.updated',
  userDeleted: 'user.deleted',
} as const;

@Injectable()
export class WebhooksService {
  private logger = new Logger(WebhooksService.name);

  constructor(private readonly prismaService: PrismaService) {}

  private async handleUserCreated(userClerkId: string) {
    const clerkUser = await clerkClient.users.getUser(userClerkId);

    const name = clerkUser.fullName!;
    const email = clerkUser.emailAddresses[0].emailAddress;

    await this.prismaService.user.upsert({
      where: { id: userClerkId },
      update: { name, email },
      create: {
        id: userClerkId,
        name,
        email,
      },
    });

    this.logger.log(`User with id "${userClerkId}" has been created`);
  }

  private async handleUserUpdated(userClerkId: string) {
    const clerkUser = await clerkClient.users.getUser(userClerkId);
    const name = clerkUser.fullName!;
    const email = clerkUser.emailAddresses[0].emailAddress;

    await this.prismaService.user.update({
      where: { id: userClerkId },
      data: { name, email },
    });

    this.logger.log(`User with id "${userClerkId}" has been updated`);
  }

  private async handleUserDeleted(userClerkId: string) {
    await this.prismaService.user.delete({
      where: { id: userClerkId },
    });

    this.logger.log(`User with id "${userClerkId}" has been deleted`);
  }

  async handleClerkWebhook(req: Request, res: Response) {
    try {
      const event = await verifyWebhook(req);
      const userClerkId = event.data?.id;

      if (!userClerkId) {
        this.logger.warn('Missing user id in event data');

        return res.sendStatus(400);
      }

      this.logger.log(
        `Received Clerk event of type "${event.type}" for user with id "${userClerkId}"`,
      );

      if (event.type === supportedClerkEvents.userCreated) {
        await this.handleUserCreated(userClerkId);
      } else if (
        event.type === supportedClerkEvents.userUpdated ||
        event.type === supportedClerkEvents.userDeleted
      ) {
        const user = await this.prismaService.user.findUnique({
          where: { id: userClerkId },
        });

        if (!user) {
          this.logger.warn(
            `User with id "${userClerkId}" not found. Skipping ${event.type} event.`,
          );

          return res.sendStatus(204);
        }

        if (event.type === supportedClerkEvents.userUpdated) {
          await this.handleUserUpdated(userClerkId);
        } else {
          await this.handleUserDeleted(userClerkId);
        }
      }
      return res.sendStatus(204);
    } catch (error) {
      this.logger.error((error as Error).message, (error as Error).stack);

      return res.sendStatus(400);
    }
  }
}
