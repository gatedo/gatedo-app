import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TreatmentController } from './treatment.controller';
import { TreatmentService } from './treatment.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notifications/notification.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    NotificationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
  ],
  controllers: [TreatmentController],
  providers: [TreatmentService, PrismaService, JwtAuthGuard],
  exports: [TreatmentService],
})
export class TreatmentModule {}