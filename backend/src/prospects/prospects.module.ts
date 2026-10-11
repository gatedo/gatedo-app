import { Module } from '@nestjs/common';
import { AdminRoleGuard, ProspectsController, WaPublicController, WebhooksController } from './prospects.controller';
import { MetaAdsController } from './meta-ads.controller';
import { InstagramOutreachController } from './instagram-outreach.controller';
import { InstagramWebhookController } from './instagram-webhook.controller';
import { ProspectsService } from './prospects.service';
import { MetaAdsService } from './meta-ads.service';
import { InstagramOutreachService } from './instagram-outreach.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
 
@Module({
  imports: [PrismaModule, AuthModule, EmailModule],
  controllers: [
    ProspectsController,
    WebhooksController,
    WaPublicController,
    MetaAdsController,
    InstagramOutreachController,
    InstagramWebhookController,
  ],
  providers: [ProspectsService, MetaAdsService, InstagramOutreachService, AdminRoleGuard],
})
export class ProspectsModule {}
