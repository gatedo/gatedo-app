import { Module } from '@nestjs/common';
import { RemindersModule } from '../reminders/reminders.module';
import { NotificationModule } from '../notifications/notification.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [RemindersModule, NotificationModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
