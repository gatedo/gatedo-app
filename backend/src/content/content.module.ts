import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ProtocolSpecController } from './protocol-spec.controller';
import { ProtocolSpecService } from './protocol-spec.service';
import { GamificationModule } from '../gamification/gamification.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [GamificationModule, JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [ContentController, ProtocolSpecController],
  providers: [ContentService, ProtocolSpecService, JwtAuthGuard],
  exports: [ContentService],
})
export class ContentModule {}
