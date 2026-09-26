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
  AI_CREDIT_PACK,
  FOUNDER_PHASES,
  PLAN_KEYS,
  addMonths,
  getFounderTierByPhase,
  getFounderTierByPosition,
  resolveKiwifyOffer,
} from '../membership/membership.constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailService } from '../email/email.service';
import { EventsService } from '../events/events.service';

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

// Reembolso/chargeback corta o acesso ao Clube GATEDO na hora. Cancelamento
// (o assinante só não renova) fica de fora de propósito — nesse caso o
// acesso já cai sozinho quando "planExpires" vencer, sem precisar de
// nenhum tratamento aqui (mesma lógica de qualquer assinatura recorrente).
function isRefundOrderEvent(value: any) {
  const event = normalizeEventName(value);
  return [
    'order_refunded',
    'purchase_refunded',
    'refunded',
    'reembolsado',
    'compra_reembolsada',
    'pedido_reembolsado',
    'chargeback',
    'chargedback',
    'order_chargeback',
    'purchase_chargeback',
  ].includes(event);
}

// Cobrança de renovação falhou/atrasou — Kiwify mantém a assinatura em
// tentativa de cobrança por alguns dias antes de cancelar de vez.
function isLatePaymentEvent(value: any) {
  const event = normalizeEventName(value);
  return [
    'subscription_late',
    'subscription_past_due',
    'order_late',
    'payment_late',
    'pagamento_atrasado',
    'assinatura_atrasada',
    'atrasado',
    'late',
  ].includes(event);
}

// Assinante cancelou o auto-renew — Kiwify manda esse evento na hora do
// cancelamento, mas o acesso só cai quando o período já pago vencer
// (isso já acontece sozinho via planExpires — aqui só é bookkeeping).
function isCanceledEvent(value: any) {
  const event = normalizeEventName(value);
  return [
    'subscription_canceled',
    'subscription_cancelled',
    'assinatura_cancelada',
    'cancelada',
    'canceled',
    'cancelled',
  ].includes(event);
}

function isPacoteIaProduct(productId: string, offerName: string, productName: string) {
  const configuredId = String(process.env.KIWIFY_PACOTE_IA_ID || '').trim();
  if (configuredId && productId === configuredId) return true;
  const joined = `${offerName} ${productName}`.toLowerCase();
  return (joined.includes('pacote') && (joined.includes('pergunta') || joined.includes('ia') || joined.includes('igentvet') || joined.includes('igent')));
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
    private readonly events: EventsService,
  ) {}

  // ── Pacote avulso de perguntas (+30, 12 meses) ───────────────────────────
  private async handlePacotePurchase(email: string, orderId: string | null) {
    if (orderId) {
      const existing = await this.prisma.aiCreditPack.findFirst({ where: { externalId: orderId } });
      if (existing) {
        this.logger.warn(`Pacote de IA — pedido ${orderId} já processado.`);
        return { ok: true, duplicate: true };
      }
    }

    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    const expiresAt = addMonths(new Date(), AI_CREDIT_PACK.validityMonths);

    if (!user) {
      await this.prisma.pendingAiCreditPack.create({
        data: { email, credits: AI_CREDIT_PACK.credits, externalId: orderId },
      });
      this.logger.log(`Pacote de IA pendente para ${email} (conta ainda não existe).`);
      return { ok: true, pending: true };
    }

    await this.prisma.aiCreditPack.create({
      data: { userId: user.id, credits: AI_CREDIT_PACK.credits, externalId: orderId, expiresAt },
    });

    this.events.track({ name: 'pack_purchased', userId: user.id, props: { credits: AI_CREDIT_PACK.credits } }).catch(() => {});
    this.logger.log(`Pacote de IA (+${AI_CREDIT_PACK.credits} perguntas) liberado para ${email}`);
    return { ok: true, applied: true, userId: user.id, credits: AI_CREDIT_PACK.credits };
  }

  // ── Pagamento atrasado: 3 dias de carência, sem derrubar o Clube na hora ──
  private async handleLatePayment(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, plan: true, planExpires: true },
    });
    if (!user || user.plan !== PLAN_KEYS.CLUBE_GATEDO) {
      return { ok: true, ignored: true };
    }

    const graceUntil = addMonths(new Date(), 0);
    graceUntil.setDate(graceUntil.getDate() + 3);
    const currentExpires = user.planExpires ? new Date(user.planExpires) : null;
    const nextExpires = currentExpires && currentExpires.getTime() > graceUntil.getTime() ? currentExpires : graceUntil;

    await this.prisma.user.update({ where: { id: user.id }, data: { planExpires: nextExpires } });
    await this.prisma.subscription.updateMany({ where: { userId: user.id }, data: { status: 'PAST_DUE' } });

    this.events.track({ name: 'clube_payment_late', userId: user.id }).catch(() => {});
    this.logger.log(`Clube GATEDO em carência (3 dias) para ${email} — cai pra free em ${nextExpires.toISOString()} se não regularizar.`);
    return { ok: true, graceUntil: nextExpires };
  }

  // ── Cancelamento: só bookkeeping — o acesso cai sozinho quando planExpires vencer ──
  private async handleCancellation(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true, plan: true } });
    if (!user || user.plan !== PLAN_KEYS.CLUBE_GATEDO) {
      return { ok: true, ignored: true };
    }

    await this.prisma.subscription.updateMany({ where: { userId: user.id }, data: { autoRenew: false, status: 'CANCELED' } });
    this.events.track({ name: 'clube_canceled', userId: user.id }).catch(() => {});
    this.logger.log(`Assinatura Clube GATEDO cancelada (auto-renew) para ${email} — acesso segue até o fim do período pago.`);
    return { ok: true };
  }

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

    const customer = data.Customer ?? data.customer ?? data.Client ?? data.client ?? data.buyer ?? {};
    const order = data.Order ?? data.order ?? data.Sale ?? data.sale ?? data;
    const product = data.Product ?? data.product ?? data.Offer ?? data.offer ?? {};
    const productId = String(firstValue(product.product_id, product.id, product.productId, '')).trim();

    const email = String(firstValue(
      customer.email,
      customer.email_address,
      order.customer_email,
      order.email,
      data.customer_email,
      data.email,
    )).trim().toLowerCase();
    const orderId = String(firstValue(order.id, order.order_id, order.orderId, data.order_id, data.id)).trim() || null;
    const offerName = String(
      firstValue(order.offer_name, order.offerName, product.offer_name, product.offerName, order.product_name, ''),
    ).trim();
    const productName = String(firstValue(product.name, product.product_name, order.product_name, data.product_name, '')).trim();

    if (isRefundOrderEvent(detectedEvent)) {
      if (!email) {
        this.logger.log('Webhook de reembolso Kiwify ignorado — sem e-mail.');
        return { ok: true, ignored: true, event: detectedEvent || null };
      }

      if (isPacoteIaProduct(productId, offerName, productName) || orderId) {
        // Reembolso do pacote avulso — remove créditos ainda não usados
        // (não mexe no que já foi gasto, só zera o saldo restante).
        const pack = orderId ? await this.prisma.aiCreditPack.findFirst({ where: { externalId: orderId, status: 'ACTIVE' } }) : null;
        if (pack) {
          await this.prisma.aiCreditPack.update({ where: { id: pack.id }, data: { status: 'REFUNDED', creditsUsed: pack.credits } });
          this.events.track({ name: 'refund', userId: pack.userId, props: { kind: 'pack' } }).catch(() => {});
          this.logger.log(`Reembolso do pacote de IA processado — pedido ${orderId}`);
          return { ok: true, refunded: true, kind: 'pack' };
        }
      }

      const refundGrant = resolveKiwifyOffer({ offerName, productName, price: null, productId });

      if (refundGrant?.plan === PLAN_KEYS.CLUBE_GATEDO) {
        const refundUser = await this.prisma.user.findUnique({ where: { email }, select: { id: true, plan: true } });
        if (refundUser?.plan === PLAN_KEYS.CLUBE_GATEDO) {
          await this.prisma.user.update({ where: { id: refundUser.id }, data: { planExpires: new Date() } });
          await this.prisma.subscription.updateMany({ where: { userId: refundUser.id }, data: { status: 'REFUNDED' } });
          this.events.track({ name: 'refund', userId: refundUser.id, props: { kind: 'clube' } }).catch(() => {});
          this.logger.log(`Reembolso Clube GATEDO processado — acesso encerrado para ${email}`);
          return { ok: true, refunded: true, userId: refundUser.id };
        }
      }

      this.logger.log(`Webhook de reembolso Kiwify ignorado (nao mapeado ou usuario nao encontrado): ${email || 'sem-email'}`);
      return { ok: true, ignored: true, event: detectedEvent || null };
    }

    if (isLatePaymentEvent(detectedEvent)) {
      if (!email) return { ok: true, ignored: true, event: detectedEvent || null };
      return this.handleLatePayment(email);
    }

    if (isCanceledEvent(detectedEvent)) {
      if (!email) return { ok: true, ignored: true, event: detectedEvent || null };
      return this.handleCancellation(email);
    }

    if (!isApprovedOrderEvent(detectedEvent)) {
      this.logger.log(`Webhook Kiwify ignorado por evento/status: ${detectedEvent || 'sem-evento'}`);
      return { ok: true, ignored: true, event: detectedEvent || null };
    }

    if (!email) {
      this.logger.warn('Webhook Kiwify aprovado sem email do comprador.');
      return { ok: false, ignored: true, reason: 'missing_email' };
    }

    if (isPacoteIaProduct(productId, offerName, productName)) {
      return this.handlePacotePurchase(email, orderId);
    }

    const name = String(firstValue(
      customer.full_name,
      customer.name,
      order.customer_name,
      data.customer_name,
      data.name,
      'Tutor Gatedo',
    )).trim();
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

    const grant = resolveKiwifyOffer({
      offerName,
      productName,
      price,
      productId,
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
          select: { id: true, email: true, name: true, plan: true, planExpires: true },
        })
      : null;
    const wasAlreadyActiveClube =
      existingUser?.plan === PLAN_KEYS.CLUBE_GATEDO &&
      !!existingUser?.planExpires &&
      new Date(existingUser.planExpires).getTime() > Date.now();

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

      if (grant.plan === PLAN_KEYS.CLUBE_GATEDO) {
        // Atribuição por recurso é "melhor esforço": só existe se a Kiwify
        // ecoar o parâmetro de rastreio que a tela de paywall manda na URL
        // de checkout. Sem isso, ainda registra a conversão agregada.
        const offerKey = String(firstValue(
          order.tracking_parameters?.utm_content,
          order.trackingParameters?.utm_content,
          order.utm_content,
          data.utm_content,
          'UNKNOWN',
        ));
        await this.prisma.offerEvent.create({
          data: { userId: existingUser.id, surface: 'CLUBE_GATEDO', offerKey, action: 'CONVERT', metadata: { orderId, planType: grant.planType } },
        }).catch(() => {});

        this.events.track({
          name: wasAlreadyActiveClube ? 'clube_renewed' : 'clube_subscribed',
          userId: existingUser.id,
          props: { plan: grant.planType },
        }).catch(() => {});
      }

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
