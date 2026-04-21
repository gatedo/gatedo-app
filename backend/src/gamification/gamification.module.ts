import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';
import { AuthModule } from '../auth/auth.module';

import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { GamificationIntegration } from './gamification.integration';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    AuthModule,
  ],
  controllers: [
    GamificationController,
  ],
  providers: [
    GamificationService,
    GamificationIntegration,
  ],
  exports: [
    GamificationService,
    GamificationIntegration,
  ],
})
export class GamificationModule {}