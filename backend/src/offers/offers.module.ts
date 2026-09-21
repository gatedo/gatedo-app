import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OffersController } from './offers.controller';
import { OfferDecisionService } from './offer-decision.service';
import { OfferEventsService } from './offer-events.service';
import { IgentCreditsService } from '../igent/igent-credits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
  ],
  controllers: [OffersController],
  providers: [OfferDecisionService, OfferEventsService, IgentCreditsService, JwtAuthGuard],
  exports: [OfferDecisionService, OfferEventsService],
})
export class OffersModule {}
