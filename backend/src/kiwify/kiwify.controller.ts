import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import {
  FOUNDER_PHASES,
  addMonths,
  resolveKiwifyOffer,
} from '../membership/membership.constants';

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
  ) {}

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
    const order = body.Order ?? body.order ?? {};
    const subscription = body.Subscription ?? body.subscription ?? {};

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
      };
    }

    const nextPhase = FOUNDER_PHASES.find((item) => item.phase > phase)?.phase ?? null;

    if (nextPhase) {
      await this.salvarSetting('faseAtiva', String(nextPhase));
      return {
        faseAtiva: nextPhase,
        encerrado: false,
        vendas,
      };
    }

    await this.salvarSetting('encerrado', 'true');

    return {
      faseAtiva: phase,
      encerrado: true,
      vendas,
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
    const raw = JSON.stringify(body);

    if (secret && !verificarAssinaturaKiwify(raw, signature, secret)) {
      this.logger.warn('Assinatura invalida');
      throw new UnauthorizedException();
    }

    if (event !== 'order_approved') {
      return { ok: true };
    }

    const customer = body.Customer ?? body.customer ?? {};
    const order = body.Order ?? body.order ?? {};
    const product = body.Product ?? body.product ?? {};

    const email = String(customer.email ?? '').trim().toLowerCase();
    const name = String(customer.full_name ?? customer.name ?? 'Tutor Gatedo').trim();
    const orderId = String(order.id ?? body.id ?? '').trim() || null;
    const offerName = String(
      order.offer_name ?? product.offer_name ?? order.product_name ?? '',
    ).trim();
    const productName = String(product.name ?? body.product_name ?? '').trim();
    const price = normalizePrice(order.amount_total ?? product.price ?? body.amount_total);
    const purchaseDate =
      parseOptionalDate(order.approved_at ?? order.created_at ?? body.created_at) ||
      new Date();
    const autoRenew = this.parseAutoRenew(body);

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
      await this.advanceFounderCampaign(founderPhase);

      const founderInvite = await this.authService.createFounderInvite({
        email,
        name,
        phase: founderPhase,
        source: 'KIWIFY',
        orderId,
        expiresInDays: 365,
      });

      if (existingUser?.id) {
        await this.authService.applyMembershipGrantToUser(existingUser.id, baseGrant);
        await this.markFounderInviteUsedByToken(founderInvite.token);

        return {
          ok: true,
          applied: true,
          type: 'founder',
          userId: existingUser.id,
          phase: founderPhase,
          token: founderInvite.token,
        };
      }

      await enviarEmailAtivacao(
        email,
        name,
        founderInvite.token,
        'founder',
        process.env.APP_URL ?? 'https://app.gatedo.com',
      );

      return {
        ok: true,
        type: 'founder',
        phase: founderPhase,
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

    await enviarEmailAtivacao(
      email,
      name,
      purchaseInvite.token,
      'purchase',
      process.env.APP_URL ?? 'https://app.gatedo.com',
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
  async getConfig() {
    return this.lerConfig();
  }

  @Patch('admin/fases/config')
  async updateConfig(
    @Body()
    body: {
      faseAtiva?: number;
      encerrado?: boolean;
      vendas?: Record<number, number>;
    },
  ) {
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
}
