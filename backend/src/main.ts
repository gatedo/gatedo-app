import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * PREFIXO GLOBAL API
   */
  app.setGlobalPrefix('api');

  /**
   * CORS
   */
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://app.gatedo.com',
      'https://gatedo.com',
      'https://api.gatedo.com',
    ],
    credentials: true,
  });

  /**
   * VALIDATION PIPE GLOBAL
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  /**
   * SERVIR ARQUIVOS ESTÁTICOS (UPLOADS)
   *
   * ISSO RESOLVE O PROBLEMA DO PDF 404
   */
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads')),
  );

  /**
   * START SERVER
   */
  await app.listen(3001);

  console.log(
    `🚀 Backend rodando em: http://localhost:3001`,
  );
}

bootstrap();