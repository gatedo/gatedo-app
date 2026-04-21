import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { IgentService } from './igent.service';

@Module({
  imports: [AiModule],
  providers: [IgentService],
  exports: [IgentService],
})
export class IGentModule {}