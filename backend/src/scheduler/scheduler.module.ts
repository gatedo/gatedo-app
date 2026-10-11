import { Module } from '@nestjs/common';
import { RemindersModule } from '../reminders/reminders.module';
import { NotificationModule } from '../notifications/notification.module';
import { SchedulerService } from './scheduler.service';
import { StoreAffiliateModule } from '../store/affiliate/store-affiliate.module';

@Module({
  imports: [RemindersModule, NotificationModule, StoreAffiliateModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
