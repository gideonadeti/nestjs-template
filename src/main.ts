import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { clerkMiddleware } from '@clerk/express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';
  const frontendBaseUrl = configService.get<string>('FRONTEND_BASE_URL');

  app.enableCors({
    origin: frontendBaseUrl,
  });

  app.setGlobalPrefix('api/v1');
  app.use(clerkMiddleware());

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('NestJS Template')
      .setDescription('API documentation for NestJS Template')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const options = {
      operationIdFactory: (_controllerKey: string, methodKey: string) =>
        methodKey,
    };

    const documentFactory = () =>
      SwaggerModule.createDocument(app, config, options);

    SwaggerModule.setup('api/v1/documentation', app, documentFactory);
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
