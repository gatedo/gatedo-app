import { Module } from '@nestjs/common';
import { ProspectsController, WebhooksController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { PrismaModule } from '../prisma/prisma.module';
 
@Module({
  imports: [PrismaModule],
  controllers: [ProspectsController, WebhooksController],
  providers: [ProspectsService],
})
export class ProspectsModule {}