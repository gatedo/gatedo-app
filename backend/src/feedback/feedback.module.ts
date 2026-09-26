import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
    EventsModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService, JwtAuthGuard],
})
export class FeedbackModule {}
