import { Module } from '@nestjs/common';
import { ProspectsController, WebhooksController } from './prospects.controller';
import { MetaAdsController } from './meta-ads.controller';
import { InstagramOutreachController } from './instagram-outreach.controller';
import { ProspectsService } from './prospects.service';
import { MetaAdsService } from './meta-ads.service';
import { InstagramOutreachService } from './instagram-outreach.service';
import { PrismaModule } from '../prisma/prisma.module';
 
@Module({
  imports: [PrismaModule],
  controllers: [ProspectsController, WebhooksController, MetaAdsController, InstagramOutreachController],
  providers: [ProspectsService, MetaAdsService, InstagramOutreachService],
})
export class ProspectsModule {}
