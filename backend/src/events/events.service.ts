import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TrackParams {
  name: string;
  userId?: string | null;
  anonId?: string | null;
  props?: Record<string, any> | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  referrer?: string | null;
}

const REMINDER_NOTIF_TYPES = ['MED_REMINDER', 'VACCINE_DUE', 'VACCINE_OVERDUE', 'PROTOCOL_DAY'];

function cohortWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  return start.toISOString().slice(0, 10);
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // Ponto único de escrita — server-side (chamado direto) ou via POST /events
  // (visitante/usuário no front). Nunca lança: quem chama não deve travar por
  // causa de telemetria.
  async track(params: TrackParams) {
    try {
      await this.prisma.event.create({
        data: {
          name: params.name,
          userId: params.userId || null,
          anonId: params.anonId || null,
          props: params.props ?? undefined,
          utmSource: params.utmSource || null,
          utmMedium: params.utmMedium || null,
          utmCampaign: params.utmCampaign || null,
          utmContent: params.utmContent || null,
          referrer: params.referrer || null,
        },
      });
    } catch {
      // telemetria não pode derrubar a feature que a chamou
    }
  }

  static isReminderNotifType(type: string) {
    return REMINDER_NOTIF_TYPES.includes(type);
  }

  // ── /admin/funil ───────────────────────────────────────────────────────

  private async countDistinctActors(name: string, since?: Date, utmSource?: string, utmCampaign?: string) {
    const rows = await this.prisma.event.findMany({
      where: {
        name,
        ...(since ? { createdAt: { gte: since } } : {}),
        ...(utmSource ? { utmSource } : {}),
        ...(utmCampaign ? { utmCampaign } : {}),
      },
      select: { userId: true, anonId: true },
    });
    const actors = new Set(rows.map((r) => r.userId || r.anonId).filter(Boolean));
    return actors.size;
  }

  async activationFunnel(params: { since?: Date; utmSource?: string; utmCampaign?: string } = {}) {
    const { since, utmSource, utmCampaign } = params;
    const steps = [
      { key: 'lp_view', label: 'Visitantes na LP' },
      { key: 'signup_completed', label: 'Cadastro' },
      { key: 'cat_created', label: 'Gato cadastrado' },
      { key: 'weight_logged', label: 'Primeira pesagem' },
      { key: 'badge_earned', label: 'Selo ganho' },
      { key: 'badge_shared', label: 'Selo compartilhado' },
    ];

    const counts = await Promise.all(
      steps.map((s) => this.countDistinctActors(s.key, since, utmSource, utmCampaign)),
    );

    const first = counts[0] || 0;
    return steps.map((s, i) => ({
      key: s.key,
      label: s.label,
      count: counts[i],
      percentOfFirst: first ? Math.round((counts[i] / first) * 1000) / 10 : null,
      percentOfPrevious: i === 0 ? 100 : counts[i - 1] ? Math.round((counts[i] / counts[i - 1]) * 1000) / 10 : null,
    }));
  }

  // Retenção D1/D7/D30 — igual critério de analytics.service.ts#retention
  // (retido = login registrado N+ dias após o cadastro), mas por coorte
  // semanal calculada aqui pra ficar junto do resto do funil.
  async retention() {
    const users = await this.prisma.user.findMany({ select: { createdAt: true, lastLoginAt: true } });
    const now = Date.now();

    const cohorts = new Map<
      string,
      { total: number; e1: number; r1: number; e7: number; r7: number; e30: number; r30: number }
    >();

    for (const u of users) {
      const key = cohortWeekStart(u.createdAt);
      if (!cohorts.has(key)) cohorts.set(key, { total: 0, e1: 0, r1: 0, e7: 0, r7: 0, e30: 0, r30: 0 });
      const c = cohorts.get(key)!;
      c.total += 1;

      const ageDays = (now - u.createdAt.getTime()) / 86400000;
      const lastLoginDays = u.lastLoginAt ? (u.lastLoginAt.getTime() - u.createdAt.getTime()) / 86400000 : null;

      if (ageDays >= 1) { c.e1 += 1; if (lastLoginDays !== null && lastLoginDays >= 1) c.r1 += 1; }
      if (ageDays >= 7) { c.e7 += 1; if (lastLoginDays !== null && lastLoginDays >= 7) c.r7 += 1; }
      if (ageDays >= 30) { c.e30 += 1; if (lastLoginDays !== null && lastLoginDays >= 30) c.r30 += 1; }
    }

    return Array.from(cohorts.entries())
      .map(([week, c]) => ({
        cohortWeekStart: week,
        totalUsers: c.total,
        d1: c.e1 ? Math.round((c.r1 / c.e1) * 1000) / 10 : null,
        d1Eligible: c.e1,
        d7: c.e7 ? Math.round((c.r7 / c.e7) * 1000) / 10 : null,
        d7Eligible: c.e7,
        d30: c.e30 ? Math.round((c.r30 / c.e30) * 1000) / 10 : null,
        d30Eligible: c.e30,
      }))
      .sort((a, b) => a.cohortWeekStart.localeCompare(b.cohortWeekStart));
  }

  async monetization(since?: Date) {
    const where = since ? { createdAt: { gte: since } } : {};

    const [protocolViewed, checkoutClicks, purchases, pixClicks, storeClicks] = await Promise.all([
      this.prisma.event.count({ where: { ...where, name: 'protocol_viewed' } }),
      this.prisma.event.count({ where: { ...where, name: 'protocol_checkout_click' } }),
      this.prisma.event.count({ where: { ...where, name: 'protocol_purchased' } }),
      this.prisma.event.count({ where: { ...where, name: 'pix_support_click' } }),
      this.prisma.event.findMany({ where: { ...where, name: 'store_click' }, select: { props: true } }),
    ]);

    const byBlock = new Map<string, number>();
    for (const row of storeClicks) {
      const block = (row.props as any)?.block || 'desconhecido';
      byBlock.set(block, (byBlock.get(block) || 0) + 1);
    }

    return {
      protocolViewed,
      checkoutClicks,
      purchases,
      checkoutToPurchasePercent: checkoutClicks ? Math.round((purchases / checkoutClicks) * 1000) / 10 : null,
      pixClicks,
      storeClicksByBlock: Array.from(byBlock.entries())
        .map(([block, count]) => ({ block, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async sourceTable(since?: Date) {
    const where = since ? { createdAt: { gte: since } } : {};

    const [signups, activations] = await Promise.all([
      this.prisma.event.findMany({ where: { ...where, name: 'signup_completed' }, select: { utmSource: true, utmCampaign: true } }),
      this.prisma.event.findMany({ where: { ...where, name: 'weight_logged' }, select: { utmSource: true, utmCampaign: true } }),
    ]);

    const key = (r: { utmSource: string | null; utmCampaign: string | null }) =>
      `${r.utmSource || 'organic'}::${r.utmCampaign || '—'}`;

    const map = new Map<string, { source: string; campaign: string; signups: number; activated: number }>();
    for (const r of signups) {
      const k = key(r);
      if (!map.has(k)) map.set(k, { source: r.utmSource || 'organic', campaign: r.utmCampaign || '—', signups: 0, activated: 0 });
      map.get(k)!.signups += 1;
    }
    for (const r of activations) {
      const k = key(r);
      if (!map.has(k)) map.set(k, { source: r.utmSource || 'organic', campaign: r.utmCampaign || '—', signups: 0, activated: 0 });
      map.get(k)!.activated += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.signups - a.signups);
  }
}
