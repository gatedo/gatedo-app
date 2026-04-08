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
  Req,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

const FASE_VAGAS = { 1: 50, 2: 100, 3: 200 };

const PRECO_FASE: Record<number, number> = {
  47: 1,
  97: 2,
  127: 3,
};

function gerarToken(): string {
  return 'FND_' + crypto.randomBytes(12).toString('hex').toUpperCase();
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
  const link = `${baseUrl}/register?token=${token}&type=founder&phase=${fase}&name=${encodeURIComponent(
    name,
  )}`;

  Logger.log(`[EMAIL] Para: ${email} | Link: ${link}`, 'KiwifyWebhook');
}

@Controller()
export class KiwifyController {
  private readonly logger = new Logger('KiwifyController');

  constructor(private readonly prisma: PrismaService) {}

  private async lerConfig() {
    const rows = await this.prisma.appSettings.findMany({
      where: { key: { in: ['faseAtiva', 'encerrado', 'vendas'] } },
    });

    const map: Record<string, string> = {};

    rows.forEach((r) => (map[r.key] = r.value));

    return {
      faseAtiva: parseInt(map.faseAtiva ?? '1'),
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
    @Req() req: any,
  ) {
    const secret = process.env.KIWIFY_TOKEN ?? '';
    const raw = JSON.stringify(body);

    if (secret && !verificarAssinaturaKiwify(raw, signature, secret)) {
      this.logger.warn('Assinatura inválida');
      throw new UnauthorizedException();
    }

    this.logger.log(`Webhook recebido: ${event}`);

    if (event !== 'order_approved') {
      return { ok: true };
    }

    const customer = body.Customer ?? body.customer ?? {};
    const order = body.Order ?? body.order ?? {};
    const product = body.Product ?? body.product ?? {};

    const email = customer.email ?? '';
    const name =
      customer.full_name ??
      customer.name ??
      'Fundador';

    const priceRaw =
      order.amount_total ??
      product.price ??
      0;

    const price = Math.round(parseFloat(priceRaw) / 100);

    const orderId =
      order.id ??
      body.id ??
      null;

    const offerName = (
      product.offer_name ??
      ''
    ).toLowerCase();

    let fase =
      offerName.includes('fase 01') ||
      offerName.includes('fase 1')
        ? 1
        : offerName.includes('fase 02') ||
          offerName.includes('fase 2')
        ? 2
        : offerName.includes('fase 03') ||
          offerName.includes('fase 3')
        ? 3
        : PRECO_FASE[price] ?? 1;

    this.logger.log(
      `Compra confirmada: ${email} | fase ${fase}`,
    );

    const existingInvite =
      await this.prisma.founderInvite.findFirst({
        where: {
          email,
          orderId,
        },
      });

    if (existingInvite) {
      this.logger.warn(
        'Pedido já processado anteriormente',
      );
      return { ok: true };
    }

    const config = await this.lerConfig();

    const novasVendas = {
      ...config.vendas,
    };

    novasVendas[fase] =
      (novasVendas[fase] ?? 0) + 1;

    await this.salvarSetting(
      'vendas',
      JSON.stringify(novasVendas),
    );

    const totalVagas =
      FASE_VAGAS[fase] ?? 999;

    if (novasVendas[fase] >= totalVagas) {
      const proximaFase =
        fase < 3 ? fase + 1 : null;

      if (proximaFase) {
        await this.salvarSetting(
          'faseAtiva',
          String(proximaFase),
        );

        this.logger.log(
          `Fase ${fase} encerrada automaticamente`,
        );
      } else {
        await this.salvarSetting(
          'encerrado',
          'true',
        );
      }
    }

    const token = gerarToken();

    await this.prisma.founderInvite.create({
      data: {
        token,
        email,
        name,
        phase: fase,
        orderId,
      },
    });

    const baseUrl =
      process.env.APP_URL ??
      'https://app.gatedo.com';

    await enviarEmailAtivacao(
      email,
      name,
      fase,
      token,
      baseUrl,
    );

    this.logger.log(
      `FounderInvite criado: ${email}`,
    );

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
    if (body.faseAtiva !== undefined)
      await this.salvarSetting(
        'faseAtiva',
        String(body.faseAtiva),
      );

    if (body.encerrado !== undefined)
      await this.salvarSetting(
        'encerrado',
        String(body.encerrado),
      );

    if (body.vendas !== undefined)
      await this.salvarSetting(
        'vendas',
        JSON.stringify(body.vendas),
      );

    return this.lerConfig();
  }
}