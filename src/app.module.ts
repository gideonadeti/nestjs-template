import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkAuthGuard } from './clerk-auth/clerk-auth.guard';
import { LoggingMiddleware } from './logging/logging.middleware';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minute
        limit: 100, // 100 requests per minute for general endpoints
        getTracker: (req: { user: { id: string } }) => req.user?.id, // The clerkMiddleware attaches the user object to the request object
      },
    ]),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, ClerkAuthGuard],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*path');
  }
}
