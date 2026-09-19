import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { IgentController } from './igent.controller';
import { IgentService } from './igent.service';
import { IgentCreditsService } from './igent-credits.service';

@Module({
  imports: [AiModule],
  controllers: [IgentController],
  providers: [IgentService, IgentCreditsService],
  exports: [IgentService, IgentCreditsService],
})
export class IGentModule {}