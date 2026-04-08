import { Module } from '@nestjs/common';
import { TreatmentController } from './treatment.controller';
import { TreatmentService } from './treatment.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [TreatmentController],
  providers: [TreatmentService, PrismaService],
  exports: [TreatmentService],
})
export class TreatmentModule {}