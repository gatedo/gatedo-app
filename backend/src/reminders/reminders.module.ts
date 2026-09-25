import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PushModule } from '../push/push.module';
import { EmailModule } from '../email/email.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
    PushModule,
    EmailModule,
    EventsModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, JwtAuthGuard],
  exports: [RemindersService],
})
export class RemindersModule {}
