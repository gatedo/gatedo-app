import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MercadoLivreService } from './mercadolivre.service';
import { ShopeeAffiliateService } from './shopee-affiliate.service';
import { MercadoLivreCallbackController, StoreAffiliateController } from './store-affiliate.controller';
import { StoreSyncService } from './store-sync.service';

// PrismaModule é global; AuthModule traz o JwtAuthGuard.
@Module({
  imports: [AuthModule],
  controllers: [StoreAffiliateController, MercadoLivreCallbackController],
  providers: [ShopeeAffiliateService, MercadoLivreService, StoreSyncService],
  exports: [StoreSyncService],
})
export class StoreAffiliateModule {}
