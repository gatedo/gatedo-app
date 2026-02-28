import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Reforço da injeção do WebSocket
    neonConfig.webSocketConstructor = ws;
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
 const adapter = new PrismaNeon(pool as any);
super({ adapter: adapter as any } as any);
  }

  async onModuleInit() {
    await this.$connect();
  }
}