import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('health')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      // Tenta uma operação ultra simples no banco
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}