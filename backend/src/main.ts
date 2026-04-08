import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://app.gatedo.com',
      'https://gatedo.com',
      'https://api.gatedo.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const prisma = app.get(PrismaService);
  const httpAdapter = app.getHttpAdapter();

  httpAdapter.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        status: 'online',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (_error) {
      res.status(200).json({
        status: 'online',
        database: 'disconnected',
        error: 'Falha na conexão com o Banco Neon',
        timestamp: new Date().toISOString(),
      });
    }
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);

  console.log(`🚀 Backend rodando em: http://localhost:${port}/api`);
}

bootstrap();
