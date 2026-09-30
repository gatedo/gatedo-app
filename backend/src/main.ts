import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { StripSecretsInterceptor } from './common/strip-secrets.interceptor';
import { SignUploadsInterceptor, verifySignedUpload } from './common/signed-uploads';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Vários módulos têm um segredo fixo de reserva no JwtModule.register —
  // sem JWT_SECRET no ambiente, tokens poderiam ser forjados com ele.
  // Checado depois do create: a essa altura o .env já foi carregado.
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não definido — o backend não sobe sem ele.');
  }

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

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
      'http://localhost:5174',
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
   * NUNCA devolver senha/tokens do usuário, em rota nenhuma
   */
  /**
   * + assina todo caminho /uploads/... que sai numa resposta (link com validade)
   */
  app.useGlobalInterceptors(new StripSecretsInterceptor(), new SignUploadsInterceptor());

  /**
   * SERVIR ARQUIVOS ESTÁTICOS (UPLOADS) — só com link assinado
   * (exames e fotos de saúde; ver common/signed-uploads.ts)
   */
  app.use(
    '/uploads',
    verifySignedUpload,
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
