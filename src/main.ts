import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';

  app.setGlobalPrefix('api/v1');

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
