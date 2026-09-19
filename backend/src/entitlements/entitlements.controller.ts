import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { EntitlementsService } from './entitlements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

function verifyKiwifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) return true;
  const expected = crypto.createHmac('sha1', secret).update(payload).digest('hex');
  return expected === signature;
}

function firstValue(...values: any[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function normalizeEventName(value: any) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s.-]+/g, '_');
}

const APPROVED_EVENTS = [
  'order_approved',
  'order_paid',
  'order_payment_approved',
  'purchase_approved',
  'purchase_paid',
  'compra_aprovada',
  'pedido_aprovado',
  'approved',
  'paid',
];

const REFUND_EVENTS = [
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
  'canceled',
  'cancelled',
  'cancelado',
];

@Controller('entitlements')
export class EntitlementsController {
  private readonly logger = new Logger('EntitlementsWebhook');

  constructor(private readonly entitlements: EntitlementsService) {}

  private ensureAdmin(user: any) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  // ── Webhook Kiwify — libera ou remove produto por e-mail ────────────────
  @Post('kiwify/webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-kiwify-event') event: string,
    @Headers('x-kiwify-signature') signature: string,
  ) {
    const secret = process.env.KIWIFY_TOKEN ?? '';
    const raw = JSON.stringify(body);

    if (secret && signature && !verifyKiwifySignature(raw, signature, secret)) {
      this.logger.warn('Assinatura Kiwify inválida — webhook rejeitado.');
      throw new UnauthorizedException();
    }
    if (secret && !signature && process.env.KIWIFY_REQUIRE_SIGNATURE === 'true') {
      this.logger.warn('Assinatura Kiwify ausente — webhook rejeitado.');
      throw new UnauthorizedException();
    }

    const data = body?.data ?? body?.payload ?? body ?? {};
    const detectedEvent = normalizeEventName(
      firstValue(event, body?.event, body?.webhook_event_type, body?.event_type, data?.status, data?.order?.status),
    );

    const customer = data.Customer ?? data.customer ?? data.Client ?? data.client ?? {};
    const order = data.Order ?? data.order ?? data;
    const product = data.Product ?? data.product ?? {};

    const email = String(
      firstValue(customer.email, customer.email_address, order.customer_email, data.email),
    ).trim().toLowerCase();
    const orderId = String(firstValue(order.id, order.order_id, order.orderId, data.order_id, data.id)).trim() || null;
    const productId = String(
      firstValue(product.product_id, product.id, product.name, order.product_name, 'produto-desconhecido'),
    ).trim();

    if (REFUND_EVENTS.includes(detectedEvent)) {
      if (!orderId) {
        this.logger.warn('Webhook de reembolso sem id de pedido — ignorado.');
        return { ok: true, ignored: true };
      }
      const result = await this.entitlements.revokeByExternalId(orderId);
      return { ok: true, refunded: true, ...result };
    }

    if (!APPROVED_EVENTS.includes(detectedEvent)) {
      this.logger.log(`Webhook de entitlement ignorado — evento: ${detectedEvent || 'desconhecido'}`);
      return { ok: true, ignored: true, event: detectedEvent || null };
    }

    if (!email) {
      this.logger.warn('Webhook de compra aprovada sem e-mail — ignorado.');
      return { ok: false, ignored: true, reason: 'missing_email' };
    }

    const result = await this.entitlements.grant({ email, productId, source: 'KIWIFY', externalId: orderId });
    return { ok: true, ...result };
  }

  // ── Admin: buscar / conceder / remover manualmente ───────────────────────
  @Get('admin/search')
  @UseGuards(JwtAuthGuard)
  async adminSearch(@Req() req: any, @Query('email') email: string) {
    this.ensureAdmin(req.user);
    if (!email) return { user: null, granted: [], pending: [] };
    return this.entitlements.adminSearch(email);
  }

  @Post('admin/grant')
  @UseGuards(JwtAuthGuard)
  async adminGrant(@Req() req: any, @Body() body: { email: string; productId: string }) {
    this.ensureAdmin(req.user);
    return this.entitlements.grantManual(body.email, body.productId);
  }

  @Post('admin/revoke')
  @UseGuards(JwtAuthGuard)
  async adminRevoke(@Req() req: any, @Body() body: { userId: string; productId: string }) {
    this.ensureAdmin(req.user);
    return this.entitlements.revokeManual(body.userId, body.productId);
  }

  @Post('admin/revoke-pending')
  @UseGuards(JwtAuthGuard)
  async adminRevokePending(@Req() req: any, @Body() body: { id: string }) {
    this.ensureAdmin(req.user);
    return this.entitlements.revokePending(body.id);
  }
}
