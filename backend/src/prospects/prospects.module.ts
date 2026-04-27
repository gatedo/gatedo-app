import { Module } from '@nestjs/common';
import { ProspectsController, WebhooksController } from './prospects.controller';
import { MetaAdsController } from './meta-ads.controller';
import { ProspectsService } from './prospects.service';
import { MetaAdsService } from './meta-ads.service';
import { PrismaModule } from '../prisma/prisma.module';
 
@Module({
  imports: [PrismaModule],
  controllers: [ProspectsController, WebhooksController, MetaAdsController],
  providers: [ProspectsService, MetaAdsService],
})
export class ProspectsModule {}
