import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SyncAlert, describeSyncAlert, evaluateSyncAlerts } from './affiliate-rules';
import { ShopeeAffiliateService } from './shopee-affiliate.service';

export type StoredSyncAlert = SyncAlert & { message: string; at: string };

// Rotina diária (7h, SchedulerService): atualiza preço e comissão dos produtos
// Shopee publicados e grava alertas no produto. Nunca despublica — quem decide
// é o admin. Em modo mock não toca em nada (não grava dado inventado em
// produto real).
@Injectable()
export class StoreSyncService {
  private readonly logger = new Logger(StoreSyncService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly shopee: ShopeeAffiliateService,
  ) {}

  async runDaily() {
    if (this.shopee.mock) return { skipped: 'API Shopee não configurada (modo mock).' };
    if (this.running) return { skipped: 'Sincronização já em andamento.' };
    this.running = true;
    try {
      return await this.syncPublishedShopee();
    } finally {
      this.running = false;
    }
  }

  private async syncPublishedShopee() {
    const products = await this.prisma.product.findMany({
      where: { status: 'published', externalId: { startsWith: 'shopee:' } },
      select: { id: true, name: true, externalId: true, price: true, commissionPct: true, commissionExtra: true, syncAlerts: true },
    });

    const summary = { checked: 0, updated: 0, alerts: 0, failed: 0, stoppedEarly: false };
    for (const product of products) {
      const itemId = product.externalId!.slice('shopee:'.length);
      let offer;
      try {
        offer = await this.shopee.getOffer(itemId);
      } catch (error) {
        summary.failed += 1;
        this.logger.warn(`Sync ${product.name}: ${(error as Error).message}`);
        // Limite da API: o resto fica pro dia seguinte.
        if (/Limite de .* chamadas/.test((error as Error).message)) {
          summary.stoppedEarly = true;
          break;
        }
        continue;
      }
      summary.checked += 1;

      const prev = { price: Number(product.price), commissionPct: product.commissionPct, commissionExtra: product.commissionExtra };
      const next = offer ? { price: offer.price, commissionPct: offer.commissionPct, commissionExtra: offer.commissionExtra } : null;
      const newAlerts = evaluateSyncAlerts(prev, next);
      summary.alerts += newAlerts.length;

      const now = new Date();
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          syncedAt: now,
          syncAlerts: mergeAlerts(product.syncAlerts, newAlerts, now) as any,
          ...(offer && {
            price: offer.price,
            priceCheckedAt: now,
            commissionPct: offer.commissionPct,
            commissionValue: offer.commissionValue,
            commissionExtra: offer.commissionExtra,
            rating: offer.rating,
            salesCount: offer.sales,
            shopOfficial: offer.officialShop,
          }),
        },
      });
      if (offer) summary.updated += 1;
    }
    this.logger.log(`Sync Shopee: ${JSON.stringify(summary)}`);
    return summary;
  }
}

/** Mantém um alerta por tipo (o mais recente) até o admin limpar. */
export function mergeAlerts(existing: unknown, incoming: SyncAlert[], now: Date): StoredSyncAlert[] {
  const current = Array.isArray(existing) ? (existing as StoredSyncAlert[]) : [];
  const fresh = incoming.map((alert) => ({ ...alert, message: describeSyncAlert(alert), at: now.toISOString() }));
  const types = new Set(fresh.map((a) => a.type));
  return [...current.filter((a) => !types.has(a.type)), ...fresh];
}
