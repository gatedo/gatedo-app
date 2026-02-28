import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client'; // Importamos para o check de saúde
import ws from 'ws';

async function bootstrap() {
  // Configuração global para o Neon Database
  neonConfig.webSocketConstructor = ws;

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: '*', 
    credentials: true,
  });

  // --- ROTA DE MONITORAMENTO (HEALTH CHECK) ---
  // Criamos aqui para ser uma rota rápida e direta sem passar por Guards complexos
  const prisma = new PrismaClient();
  const httpAdapter = app.getHttpAdapter();

  httpAdapter.get('/api/health', async (req, res) => {
    try {
      // Tenta uma query simples no banco Neon
      await prisma.$queryRaw`SELECT 1`;
      
      res.status(200).json({ 
        status: 'online', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Se o banco falhar mas a API estiver viva (evita erro 503 total)
      res.status(200).json({ 
        status: 'online', 
        database: 'disconnected',
        error: 'Falha na conexão com o Banco Neon' 
      });
    }
  });
  // --------------------------------------------

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend rodando em: http://localhost:${port}/api`);
}
bootstrap();