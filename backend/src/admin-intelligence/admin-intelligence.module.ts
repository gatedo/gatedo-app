import { Module } from '@nestjs/common';
import { AdminIntelligenceController } from './admin-intelligence.controller';
import { AdminIntelligenceService } from './admin-intelligence.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminIntelligenceController],
  providers: [AdminIntelligenceService],
})
export class AdminIntelligenceModule {}
