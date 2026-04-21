import { Module } from '@nestjs/common';
import { NotificationController } from '../notifications/notification.controller';
import { NotificationService } from '../notifications/notification.service';
import { GamificationIntegration } from '../gamification/gamification.integration';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, GamificationIntegration, PrismaService],
  exports: [NotificationService, GamificationIntegration], // ambos disponíveis nos outros módulos
})
export class NotificationModule {}