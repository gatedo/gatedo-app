import { Module } from '@nestjs/common';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AuthModule } from '../auth/auth.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    PrismaModule,
    GamificationModule,
    AuthModule,
    PushModule,
  ],
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}