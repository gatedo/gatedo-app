import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Headers,
  HttpCode,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

const FASE_VAGAS: Record<number, number> = {
  1: 50,
  2: 100,
  3: 200,
};

const PRECO_FASE: Record<number, number> = {
  47: 1,
  97: 2,
  127: 3,
  197: 3,
};

function gerarToken(fase: number): string {
  return `FND${fase}_` + crypto.randomBytes(10).toString('hex').toUpperCase();
}

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

async function enviarEmailAtivacao(
  email: string,
  name: string,
  fase: number,
  token: string,
  baseUrl: string,
) {
  const link = `${baseUrl}/register?token=${token}&type=founder`;

  Logger.log(
    `[EMAIL] Para: ${email} | Nome: ${name} | Fase: ${fase} | Link: ${link}`,
    'KiwifyWebhook',
  );
}

@Controller()
export class KiwifyController {
  private readonly logger = new Logger('KiwifyController');

  constructor(private readonly prisma: PrismaService) {}

  private async ensureFounderInviteTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FounderInvite" (
        "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "token"      TEXT UNIQUE NOT NULL,
        "email"      TEXT,
        "name"       TEXT,
        "phase"      INTEGER DEFAULT 1,
        "source"     TEXT DEFAULT 'KIWIFY',
        "orderId"    TEXT,
        "used"       BOOLEAN DEFAULT false,
        "usedAt"     TIMESTAMP,
        "expiresAt"  TIMESTAMP,
        "createdAt"  TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "FounderInvite"
      ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'KIWIFY'
    `).catch(() => {});

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "FounderInvite"
      ADD COLUMN IF NOT EXISTS "orderId" TEXT
    `).catch(() => {});

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "FounderInvite"
      ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP
    `).catch(() => {});
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
    rows.forEach((r) => {
      map[r.key] = r.value;
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
      this.logger.warn('Assinatura inválida');
      throw new UnauthorizedException();
    }

    if (event !== 'order_approved') {
      return { ok: true };
    }

    await this.ensureFounderInviteTable();

    const customer = body.Customer ?? body.customer ?? {};
    const order = body.Order ?? body.order ?? {};
    const product = body.Product ?? body.product ?? {};

    const email = String(customer.email ?? '').trim().toLowerCase();
    const name = String(
      customer.full_name ?? customer.name ?? 'Fundador',
    ).trim();

    const priceRaw = order.amount_total ?? product.price ?? 0;
    const parsedPrice = parseFloat(String(priceRaw));
    const price =
      parsedPrice > 1000 ? Math.round(parsedPrice / 100) : Math.round(parsedPrice);

    const orderId = String(order.id ?? body.id ?? '').trim() || null;
    const offerName = String(product.offer_name ?? '').toLowerCase();

    let fase =
      offerName.includes('fase 01') || offerName.includes('fase 1')
        ? 1
        : offerName.includes('fase 02') || offerName.includes('fase 2')
          ? 2
          : offerName.includes('fase 03') || offerName.includes('fase 3')
            ? 3
            : PRECO_FASE[price] ?? 1;

    fase = Number(fase);

    this.logger.log(
      `Compra confirmada: ${email} | fase ${fase} | order ${orderId}`,
    );

    const existingInvite = await this.prisma
      .$queryRawUnsafe<any[]>(
        `
        SELECT id, token
        FROM "FounderInvite"
        WHERE email = $1
          AND "orderId" = $2
        LIMIT 1
      `,
        email,
        orderId,
      )
      .catch(() => [] as any[]);

    if (existingInvite.length > 0) {
      this.logger.warn('Pedido já processado anteriormente');
      return { ok: true, token: existingInvite[0].token, fase };
    }

    const config = await this.lerConfig();
    const novasVendas: Record<number, number> = {
      ...(config.vendas || {}),
    };

    novasVendas[fase] = Number(novasVendas[fase] ?? 0) + 1;

    await this.salvarSetting('vendas', JSON.stringify(novasVendas));

    const totalVagas = Number(FASE_VAGAS[fase] ?? 999);

    if (novasVendas[fase] >= totalVagas) {
      const proximaFase = fase < 3 ? fase + 1 : null;

      if (proximaFase) {
        await this.salvarSetting('faseAtiva', String(proximaFase));
        this.logger.log(`Fase ${fase} encerrada automaticamente`);
      } else {
        await this.salvarSetting('encerrado', 'true');
      }
    }

    const token = gerarToken(fase);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "FounderInvite"
        (id, token, email, name, phase, source, "orderId", "expiresAt")
      VALUES
        (gen_random_uuid()::text, $1, $2, $3, $4, 'KIWIFY', $5, $6)
    `,
      token,
      email,
      name,
      fase,
      orderId,
      expiresAt,
    );

    const baseUrl = process.env.APP_URL ?? 'https://app.gatedo.com';

    await enviarEmailAtivacao(email, name, fase, token, baseUrl);

    this.logger.log(`FounderInvite criado: ${email}`);

    return {
      ok: true,
      fase,
      token,
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