import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { GamificationIntegration } from './gamification.integration';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, GamificationIntegration, PrismaService],
  exports: [NotificationService, GamificationIntegration], // ambos disponíveis nos outros módulos
})
export class NotificationModule {}