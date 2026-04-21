import { Module } from '@nestjs/common';
import { StudioService } from './studio.service';
import { StudioController } from './studio.controller';
import { StudioAiService } from './studio-ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AiModule, AuthModule],
  controllers: [StudioController],
  providers: [PrismaService, StudioService, StudioAiService],
  exports: [StudioService],
})
export class StudioModule {}