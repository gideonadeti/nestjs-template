import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter, errorFormat: 'pretty' });
  }

  private logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();

    this.logger.log('Prisma client connected to the database successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();

    this.logger.log(
      'Prisma client disconnected from the database successfully',
    );
  }
}
