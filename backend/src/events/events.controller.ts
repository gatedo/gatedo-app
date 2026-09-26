import { Body, Controller, ForbiddenException, Get, Headers, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Nomes aceitos vindos do front — mantém a tabela limpa mesmo se um cliente
// antigo/malicioso mandar outra coisa. Eventos "críticos" (cadastro, compra)
// não estão aqui de propósito: esses só são gravados pelo servidor.
const ALLOWED_CLIENT_EVENTS = new Set([
  'lp_view',
  'lp_cta_click',
  'signup_started',
  'tour_started',
  'tour_step',
  'tour_completed',
  'tour_skipped',
  'badge_shared',
  'app_open',
  'protocol_viewed',
  'protocol_checkout_click',
  'store_click',
  'whatsapp_group_click',
  'pix_support_click',
  'reminder_opened',
  'clube_viewed',
  'clube_checkout_click',
  'pack_checkout_click',
  'almanaque_deflect_resolved',
]);

@Controller('events')
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly jwt: JwtService,
  ) {}

  // Autenticação opcional: usuário logado manda userId junto (mais preciso
  // pro funil), visitante manda só o anon_id. Nunca derruba a chamada por
  // token ausente/expirado — telemetria não pode travar a tela.
  private async resolveUserId(authHeader?: string): Promise<string | null> {
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
      const payload = await this.jwt.verifyAsync(authHeader.slice(7), { secret: process.env.JWT_SECRET });
      return payload?.id || payload?.sub || null;
    } catch {
      return null;
    }
  }

  @Post()
  async ingest(
    @Body() body: {
      name: string;
      props?: Record<string, any>;
      anonId?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      referrer?: string;
    },
    @Headers('authorization') authHeader?: string,
  ) {
    if (!body?.name || !ALLOWED_CLIENT_EVENTS.has(body.name)) {
      return { ok: false, ignored: true };
    }

    const userId = await this.resolveUserId(authHeader);

    await this.events.track({
      name: body.name,
      userId,
      anonId: body.anonId,
      props: body.props,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      utmContent: body.utmContent,
      referrer: body.referrer,
    });

    return { ok: true };
  }

  private ensureAdmin(user: any) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  private parseSince(days?: string) {
    if (!days) return undefined;
    const n = Number(days);
    if (!n || n <= 0) return undefined;
    return new Date(Date.now() - n * 86400000);
  }

  @Get('funnel')
  @UseGuards(JwtAuthGuard)
  async funnel(@Req() req: any, @Query('days') days?: string, @Query('utmSource') utmSource?: string, @Query('utmCampaign') utmCampaign?: string) {
    this.ensureAdmin(req.user);
    return this.events.activationFunnel({ since: this.parseSince(days), utmSource, utmCampaign });
  }

  @Get('retention')
  @UseGuards(JwtAuthGuard)
  async retention(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.events.retention();
  }

  @Get('monetization')
  @UseGuards(JwtAuthGuard)
  async monetization(@Req() req: any, @Query('days') days?: string) {
    this.ensureAdmin(req.user);
    return this.events.monetization(this.parseSince(days));
  }

  @Get('sources')
  @UseGuards(JwtAuthGuard)
  async sources(@Req() req: any, @Query('days') days?: string) {
    this.ensureAdmin(req.user);
    return this.events.sourceTable(this.parseSince(days));
  }
}
