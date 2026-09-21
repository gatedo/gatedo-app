import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OfferDecisionService } from './offer-decision.service';
import { OfferEventsService, OfferEventAction } from './offer-events.service';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(
    private readonly decision: OfferDecisionService,
    private readonly events: OfferEventsService,
  ) {}

  // A única porta de entrada pra decidir oferta — nenhuma tela decide sozinha.
  @Get('decide')
  decide(
    @Req() req: any,
    @Query('surface') surface: string,
    @Query('petId') petId?: string,
    @Query('trigger') trigger?: string,
  ) {
    return this.decision.decide({ userId: req.user.id, surface, petId, trigger });
  }

  @Get('recommend-products')
  recommendProducts(@Req() req: any, @Query('petId') petId: string) {
    return this.decision.recommendProducts({ userId: req.user.id, petId });
  }

  @Post('event')
  logEvent(
    @Req() req: any,
    @Body() body: { petId?: string; surface: string; offerKey: string; action: OfferEventAction; metadata?: Record<string, any> },
  ) {
    return this.events.logEvent({ userId: req.user.id, ...body });
  }
}
