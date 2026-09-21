import {
  Body,
  Controller,
  Get,
  ForbiddenException,
  Headers,
  HttpCode,
  Logger,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import {
  FOUNDER_PHASES,
  addMonths,
  getFounderTierByPhase,
  getFounderTierByPosition,
  resolveKiwifyOffer,
} from '../membership/membership.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailService } from '../email/email.service';

function verificarAssinaturaKiwify(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret) return true;

  const expected = crypto
    .createHmac('sha1', secret)
    .update(payload)
    .digest('hex');

  return expected === signature;
}

function firstValue(...values: any[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}

function normalizeEventName(value: any) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s.-]+/g, '_');
}

function isApprovedOrderEvent(value: any) {
  const event = normalizeEventName(value);
  return [
    'order_approved',
    'order_paid',
    'order_payment_approved',
    'purchase_approved',
    'purchase_paid',
    'compra_aprovada',
    'pedido_aprovado',
    'approved',
    'paid',
  ].includes(event);
}

function normalizePrice(input: any) {
  const raw = Number(input || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw > 1000 ? Number((raw / 100).toFixed(2)) : Number(raw.toFixed(2));
}

function parseOptionalDate(input: any) {
  if (!input) return null;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseBooleanCandidates(...values: any[]) {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y', 'sim', 'active', 'activated'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'n', 'nao', 'não', 'inactive', 'canceled'].includes(normalized)) {
        return false;
      }
    }
  }

  return false;
}

async function enviarEmailAtivacao(
  email: string,
  name: string,
  token: string,
  type: 'founder' | 'purchase',
  baseUrl: string,
) {
  const link = `${baseUrl}/register?token=${token}&type=${type}`;

  Logger.log(
    `[EMAIL] Para: ${email} | Nome: ${name} | Tipo: ${type} | Link: ${link}`,
    'KiwifyWebhook',
  );
}

@Controller()
export class KiwifyController {
  private readonly logger = new Logger('KiwifyController');

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  private ensureAdmin(user: any) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  private async lerConfig(): Promise<{
    faseAtiva: number;
    encerrado: boolean;
    vendas: Record<number, number>;
  }> {
    const rows = await this.prisma.appSettings.findMany({
      where: { key: { in: ['faseAtiva', 'encerrado', 'vendas'] } },
    });

    const map: Record<string, string> = {};
    rows.forEach((row) => {
      map[row.key] = row.value;
    });

    return {
      faseAtiva: parseInt(map.faseAtiva ?? '1', 10),
      encerrado: map.encerrado === 'true',
      vendas: JSON.parse(
        map.vendas ?? '{"1":0,"2":0,"3":0}',
      ) as Record<number, number>,
    };
  }

  private async salvarSetting(key: string, value: string) {
    await this.prisma.appSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  private async orderAlreadyProcessed(email: string, orderId: string | null) {
    if (!email || !orderId) return null;

    const founderRows = await this.prisma
      .$queryRawUnsafe<any[]>(
        `
        SELECT token
        FROM "FounderInvite"
        WHERE email = $1
          AND "orderId" = $2
        LIMIT 1
      `,
        email,
        orderId,
      )
      .catch(() => [] as any[]);

    if (founderRows.length > 0) {
      return { token: founderRows[0].token, type: 'founder' as const };
    }

    const purchaseRows = await this.prisma
      .$queryRawUnsafe<any[]>(
        `
        SELECT token
        FROM "PurchaseInvite"
        WHERE email = $1
          AND "orderId" = $2
        LIMIT 1
      `,
        email,
        orderId,
      )
      .catch(() => [] as any[]);

    if (purchaseRows.length > 0) {
      return { token: purchaseRows[0].token, type: 'purchase' as const };
    }

    return null;
  }

  private async markFounderInviteUsedByToken(token: string) {
    await this.prisma
      .$executeRawUnsafe(
        `
        UPDATE "FounderInvite"
        SET used = true, "usedAt" = NOW()
        WHERE token = $1
      `,
        token,
      )
      .catch(() => {});
  }

  private async markPurchaseInviteUsedByToken(token: string) {
    await this.prisma
      .$executeRawUnsafe(
        `
        UPDATE "PurchaseInvite"
        SET used = true, "usedAt" = NOW()
        WHERE token = $1
      `,
        token,
      )
      .catch(() => {});
  }

  private parseAutoRenew(body: any) {
    const data = body.data ?? body.payload ?? body;
    const order = data.Order ?? data.order ?? {};
    const subscription = data.Subscription ?? data.subscription ?? {};

    return parseBooleanCandidates(
      order.auto_renew,
      order.autorenew,
      order.is_recurring,
      order.recurring,
      order.subscription_active,
      subscription.auto_renew,
      subscription.active,
      subscription.status,
    );
  }

  private async advanceFounderCampaign(phase: number) {
    const config = await this.lerConfig();
    const vendas = {
      ...(config.vendas || {}),
    } as Record<number, number>;

    vendas[phase] = Number(vendas[phase] ?? 0) + 1;
    await this.salvarSetting('vendas', JSON.stringify(vendas));

    const phaseMeta = FOUNDER_PHASES.find((item) => item.phase === phase);
    const totalVagas = Number(phaseMeta?.maxSlots ?? 0);

    if (!totalVagas || vendas[phase] < totalVagas) {
      return {
      faseAtiva: config.faseAtiva,
      encerrado: config.encerrado,
      vendas,
      totalSold: Object.values(vendas).reduce((acc, value) => acc + Number(value || 0), 0),
    };
    }

    const nextPhase = FOUNDER_PHASES.find((item) => item.phase > phase)?.phase ?? null;

    if (nextPhase) {
      await this.salvarSetting('faseAtiva', String(nextPhase));
      return {
        faseAtiva: nextPhase,
        encerrado: false,
        vendas,
        totalSold: Object.values(vendas).reduce((acc, value) => acc + Number(value || 0), 0),
      };
    }

    await this.salvarSetting('encerrado', 'true');

    return {
      faseAtiva: phase,
      encerrado: true,
      vendas,
      totalSold: Object.values(vendas).reduce((acc, value) => acc + Number(value || 0), 0),
    };
  }

  @Post('kiwify/webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-kiwify-event') event: string,
    @Headers('x-kiwify-signature') signature: string,
  ) {
    const secret = process.env.KIWIFY_TOKEN ?? '';
    const requireSignature = process.env.KIWIFY_REQUIRE_SIGNATURE === 'true';
    const raw = JSON.stringify(body);

    if (secret && signature && !verificarAssinaturaKiwify(raw, signature, secret)) {
      this.logger.warn('Assinatura invalida');
      throw new UnauthorizedException();
    }

    if (secret && !signature && requireSignature) {
      this.logger.warn('Assinatura ausente');
      throw new UnauthorizedException();
    }

    if (secret && !signature && !requireSignature) {
      this.logger.warn('Webhook sem assinatura Kiwify; aceito porque KIWIFY_REQUIRE_SIGNATURE nao esta ativo.');
    }

    const data = body.data ?? body.payload ?? body;
    const detectedEvent = firstValue(
      event,
      body.event,
      body.webhook_event_type,
      body.webhookEventType,
      body.event_type,
      body.type,
      data.event,
      data.webhook_event_type,
      data.event_type,
      data.status,
      data.Order?.status,
      data.order?.status,
    );

    if (!isApprovedOrderEvent(detectedEvent)) {
      this.logger.log(`Webhook Kiwify ignorado por evento/status: ${detectedEvent || 'sem-evento'}`);
      return { ok: true, ignored: true, event: detectedEvent || null };
    }

    const customer = data.Customer ?? data.customer ?? data.Client ?? data.client ?? data.buyer ?? {};
    const order = data.Order ?? data.order ?? data.Sale ?? data.sale ?? data;
    const product = data.Product ?? data.product ?? data.Offer ?? data.offer ?? {};

    const email = String(firstValue(
      customer.email,
      customer.email_address,
      order.customer_email,
      order.email,
      data.customer_email,
      data.email,
    )).trim().toLowerCase();
    const name = String(firstValue(
      customer.full_name,
      customer.name,
      order.customer_name,
      data.customer_name,
      data.name,
      'Tutor Gatedo',
    )).trim();
    const orderId = String(firstValue(order.id, order.order_id, order.orderId, data.order_id, data.id)).trim() || null;
    const offerName = String(
      firstValue(order.offer_name, order.offerName, product.offer_name, product.offerName, order.product_name, ''),
    ).trim();
    const productName = String(firstValue(product.name, product.product_name, order.product_name, data.product_name, '')).trim();
    const price = normalizePrice(firstValue(
      order.amount_total,
      order.amount,
      order.total,
      order.total_amount,
      product.price,
      data.amount_total,
      data.total,
      data.price,
    ));
    const purchaseDate =
      parseOptionalDate(firstValue(order.approved_at, order.paid_at, order.created_at, data.created_at, data.approved_at)) ||
      new Date();
    const autoRenew = this.parseAutoRenew(body);

    this.logger.log(
      `Webhook Kiwify aprovado recebido: ${email || 'sem-email'} | pedido ${orderId || 'sem-id'} | ${offerName || productName || 'sem-oferta'} | R$ ${price}`,
    );

    if (!email) {
      this.logger.warn('Webhook Kiwify aprovado sem email do comprador.');
      return { ok: false, ignored: true, reason: 'missing_email' };
    }

    const grant = resolveKiwifyOffer({
      offerName,
      productName,
      price,
    });

    if (!grant) {
      this.logger.warn(
        `Webhook Kiwify ignorado sem mapeamento: ${email || 'sem-email'} | ${offerName || productName || 'sem-oferta'} | ${price}`,
      );
      return { ok: true, ignored: true };
    }

    const alreadyProcessed = await this.orderAlreadyProcessed(email, orderId);
    if (alreadyProcessed) {
      this.logger.warn(`Pedido ${orderId} ja processado anteriormente`);
      return {
        ok: true,
        duplicate: true,
        token: alreadyProcessed.token,
        type: alreadyProcessed.type,
      };
    }

    const existingUser = email
      ? await this.prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true },
        })
      : null;

    const expiresAt =
      Number(grant.cycleMonths || 0) > 0
        ? addMonths(purchaseDate, Number(grant.cycleMonths || 0))
        : null;
    const baseGrant = {
      ...grant,
      purchaseDate,
      expiresAt,
      autoRenew,
      provider: 'KIWIFY',
      externalId: orderId,
    };
    const founderPhase = Number((grant as any)?.phase || 0);

    if (founderPhase > 0) {
      const campaignState = await this.advanceFounderCampaign(founderPhase);
      const founderTier = getFounderTierByPosition(campaignState.totalSold || 1);
      const founderGrant = {
        ...baseGrant,
        badge: founderTier.badge,
        badgeLabel: founderTier.label,
      };

      const founderInvite = await this.authService.createFounderInvite({
        email,
        name,
        phase: founderPhase,
        badge: founderTier.badge,
        badgeLabel: founderTier.label,
        source: 'KIWIFY',
        orderId,
        expiresInDays: 365,
      });

      if (existingUser?.id) {
        await this.authService.applyMembershipGrantToUser(existingUser.id, founderGrant);
        await this.markFounderInviteUsedByToken(founderInvite.token);

        return {
          ok: true,
          applied: true,
          type: 'founder',
          userId: existingUser.id,
          phase: founderPhase,
          badge: founderTier.badge,
          badgeLabel: founderTier.label,
          token: founderInvite.token,
        };
      }

      await this.emailService.sendActivationInvite(
        email,
        name,
        founderInvite.token,
        'founder',
        founderTier.label,
      );

      return {
        ok: true,
        type: 'founder',
        phase: founderPhase,
        badge: founderTier.badge,
        badgeLabel: founderTier.label,
        token: founderInvite.token,
      };
    }

    const purchaseInvite = await this.authService.createPurchaseInvite({
      email,
      name,
      plan: grant.plan,
      planType: grant.planType,
      badge: grant.badge || null,
      pointsGranted: grant.pointsGranted || 0,
      cycleMonths: grant.cycleMonths || 0,
      discountPercent: grant.renewalDiscountPercent || 0,
      autoRenew,
      orderId,
      source: 'KIWIFY',
      purchaseDate,
      expiresAt,
    });

    if (existingUser?.id) {
      await this.authService.applyMembershipGrantToUser(existingUser.id, baseGrant);
      await this.markPurchaseInviteUsedByToken(purchaseInvite.token);

      return {
        ok: true,
        applied: true,
        type: 'purchase',
        userId: existingUser.id,
        token: purchaseInvite.token,
        plan: grant.plan,
        planType: grant.planType,
        pointsGranted: grant.pointsGranted || 0,
      };
    }

    await this.emailService.sendActivationInvite(
      email,
      name,
      purchaseInvite.token,
      'purchase',
      grant.badgeLabel || grant.offerLabel || grant.planType,
    );

    return {
      ok: true,
      type: 'purchase',
      token: purchaseInvite.token,
      plan: grant.plan,
      planType: grant.planType,
      pointsGranted: grant.pointsGranted || 0,
    };
  }

  @Get('admin/fases/config')
  @UseGuards(JwtAuthGuard)
  async getConfig(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.lerConfig();
  }

  @Patch('admin/fases/config')
  @UseGuards(JwtAuthGuard)
  async updateConfig(
    @Req() req: any,
    @Body()
    body: {
      faseAtiva?: number;
      encerrado?: boolean;
      vendas?: Record<number, number>;
    },
  ) {
    this.ensureAdmin(req.user);

    if (body.faseAtiva !== undefined) {
      await this.salvarSetting('faseAtiva', String(body.faseAtiva));
    }

    if (body.encerrado !== undefined) {
      await this.salvarSetting('encerrado', String(body.encerrado));
    }

    if (body.vendas !== undefined) {
      await this.salvarSetting('vendas', JSON.stringify(body.vendas));
    }

    return this.lerConfig();
  }

  @Post('admin/kiwify/manual-activation')
  @UseGuards(JwtAuthGuard)
  async manualActivation(
    @Req() req: any,
    @Body()
    body: {
      email: string;
      name?: string;
      type?: 'founder' | 'purchase';
      phase?: number;
      orderId?: string;
      planType?: string;
    },
  ) {
    this.ensureAdmin(req.user);

    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      throw new ForbiddenException('Informe o email da compra.');
    }

    const type = body.type || 'founder';
    const name = String(body.name || 'Tutor Gatedo').trim();
    const orderId = body.orderId ? String(body.orderId) : `manual_${Date.now()}`;

    if (type === 'founder') {
      const phase = Number(body.phase || 1);
      const tier = getFounderTierByPhase(phase);
      const invite = await this.authService.createFounderInvite({
        email,
        name,
        phase,
        badge: tier.badge,
        badgeLabel: tier.label,
        source: 'KIWIFY',
        orderId,
        expiresInDays: 365,
      });

      await this.emailService.sendActivationInvite(email, name, invite.token, 'founder', tier.label);

      return {
        ok: true,
        type: 'founder',
        token: invite.token,
        activationUrl: `${process.env.FRONTEND_URL || process.env.APP_URL || 'https://app.gatedo.com'}/register?token=${invite.token}&type=founder`,
      };
    }

    const grant = resolveKiwifyOffer({
      offerName: body.planType || 'Tutor Plus Anual',
      productName: body.planType || 'Tutor Plus Anual',
      price: null,
    });

    if (!grant) {
      throw new ForbiddenException('Plano manual nao reconhecido.');
    }

    const purchaseDate = new Date();
    const invite = await this.authService.createPurchaseInvite({
      email,
      name,
      plan: grant.plan,
      planType: grant.planType,
      badge: grant.badge || null,
      pointsGranted: grant.pointsGranted || 0,
      cycleMonths: grant.cycleMonths || 0,
      discountPercent: grant.renewalDiscountPercent || 0,
      autoRenew: false,
      orderId,
      source: 'KIWIFY',
      purchaseDate,
      expiresAt:
        Number(grant.cycleMonths || 0) > 0
          ? addMonths(purchaseDate, Number(grant.cycleMonths || 0))
          : null,
    });

    await this.emailService.sendActivationInvite(
      email,
      name,
      invite.token,
      'purchase',
      grant.badgeLabel || grant.offerLabel || grant.planType,
    );

    return {
      ok: true,
      type: 'purchase',
      token: invite.token,
      activationUrl: `${process.env.FRONTEND_URL || process.env.APP_URL || 'https://app.gatedo.com'}/register?token=${invite.token}&type=purchase`,
    };
  }
}
