import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from '../notifications/notification.controller';
import { NotificationService } from '../notifications/notification.service';
import { GamificationIntegration } from '../gamification/gamification.integration';
import { PrismaService } from '../prisma/prisma.service';
import { EventsModule } from '../events/events.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    EventsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, GamificationIntegration, PrismaService, JwtAuthGuard],
  exports: [NotificationService, GamificationIntegration], // ambos disponíveis nos outros módulos
})
export class NotificationModule {}