import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type OfferEventAction = 'IMPRESSION' | 'CLICK' | 'DISMISS' | 'CONVERT';

@Injectable()
export class OfferEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: {
    userId: string;
    petId?: string | null;
    surface: string;
    offerKey: string;
    action: OfferEventAction;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.offerEvent.create({
      data: {
        userId: params.userId,
        petId: params.petId || null,
        surface: params.surface,
        offerKey: params.offerKey,
        action: params.action,
        metadata: params.metadata || undefined,
      },
    });
  }
}
