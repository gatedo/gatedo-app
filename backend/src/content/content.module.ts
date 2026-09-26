import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ProtocolSpecController } from './protocol-spec.controller';
import { ProtocolSpecService } from './protocol-spec.service';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [ContentController, ProtocolSpecController],
  providers: [ContentService, ProtocolSpecService],
  exports: [ContentService],
})
export class ContentModule {}
