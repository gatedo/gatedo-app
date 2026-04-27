import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { IgentController } from './igent.controller';
import { IgentService } from './igent.service';

@Module({
  imports: [AiModule],
  controllers: [IgentController],
  providers: [IgentService],
  exports: [IgentService],
})
export class IGentModule {}