import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('NestJS Template')
    .setDescription('API documentation for NestJS Template')
    .setVersion('1.0.0')
    .build();

  const options = {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  };

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, options);

  SwaggerModule.setup('api/v1/documentation', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
