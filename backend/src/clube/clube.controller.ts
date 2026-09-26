import { Body, Controller, ForbiddenException, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventsService } from '../events/events.service';

@Controller('clube')
export class ClubeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  @Post('waitlist')
  @UseGuards(JwtAuthGuard)
  async joinWaitlist(@Req() req: any, @Body() body: { plan?: string }) {
    const email = String(req.user?.email || '').trim().toLowerCase();
    if (!email) return { ok: false };

    await this.prisma.clubeWaitlistEntry.create({
      data: { userId: req.user.id, email, plan: body?.plan || null },
    });

    this.events.track({ name: 'waitlist_joined', userId: req.user.id, props: { plan: body?.plan || null } }).catch(() => {});
    return { ok: true };
  }

  private ensureAdmin(user: any) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  @Get('admin/funnel')
  @UseGuards(JwtAuthGuard)
  async adminFunnel(@Req() req: any, @Query('days') days?: string) {
    this.ensureAdmin(req.user);

    const since = days ? new Date(Date.now() - Number(days) * 86400000) : undefined;
    const eventWhere = (name: string) => ({ name, ...(since ? { createdAt: { gte: since } } : {}) });

    const [viewed, checkoutClicks, subscribed, packClicks, packPurchased, waitlist, activeSubs, canceledThisMonth] = await Promise.all([
      this.prisma.event.findMany({ where: eventWhere('clube_viewed'), select: { userId: true, anonId: true, props: true } }),
      this.prisma.event.findMany({ where: eventWhere('clube_checkout_click'), select: { userId: true, props: true } }),
      this.prisma.event.findMany({ where: eventWhere('clube_subscribed'), select: { userId: true, props: true } }),
      this.prisma.event.count({ where: eventWhere('pack_checkout_click') }),
      this.prisma.event.count({ where: eventWhere('pack_purchased') }),
      this.prisma.clubeWaitlistEntry.count(since ? { where: { createdAt: { gte: since } } } : undefined),
      this.prisma.user.count({ where: { plan: 'CLUBE_GATEDO', planExpires: { gt: new Date() } } }),
      this.prisma.event.count({
        where: { name: 'clube_canceled', createdAt: { gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)) } },
      }),
    ]);

    const countDistinct = (rows: { userId?: string | null; anonId?: string | null }[]) =>
      new Set(rows.map((r) => r.userId || r.anonId).filter(Boolean)).size;

    const byOrigin = (rows: { props: any }[]) => {
      const map = new Map<string, number>();
      for (const r of rows) {
        const origin = (r.props as any)?.origem || (r.props as any)?.origin || 'desconhecida';
        map.set(origin, (map.get(origin) || 0) + 1);
      }
      return Array.from(map.entries()).map(([origem, count]) => ({ origem, count })).sort((a, b) => b.count - a.count);
    };

    const byPlan = (rows: { props: any }[]) => {
      const map = new Map<string, number>();
      for (const r of rows) {
        const plan = (r.props as any)?.plan || 'desconhecido';
        map.set(plan, (map.get(plan) || 0) + 1);
      }
      return Array.from(map.entries()).map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count);
    };

    return {
      viewed: countDistinct(viewed),
      checkoutClicks: checkoutClicks.length,
      subscribed: subscribed.length,
      viewedToCheckoutPercent: viewed.length ? Math.round((checkoutClicks.length / countDistinct(viewed)) * 1000) / 10 : null,
      checkoutToSubscribedPercent: checkoutClicks.length ? Math.round((subscribed.length / checkoutClicks.length) * 1000) / 10 : null,
      byOrigin: byOrigin(viewed),
      byPlan: byPlan(subscribed),
      packClicks,
      packPurchased,
      waitlist,
      activeSubs,
      canceledThisMonth,
    };
  }
}
