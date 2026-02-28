// src/pets/pets.module.ts
import { Module } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PrismaService } from '../prisma.service';
import { CloudflareService } from '../cloudflare.service';
import { NotificationModule } from '../notifications/notification.module'; // ← ADD

@Module({
  imports: [NotificationModule], // ← ADD: disponibiliza GamificationIntegration
  controllers: [PetsController],
  providers: [PetsService, PrismaService, CloudflareService],
})
export class PetsModule {}