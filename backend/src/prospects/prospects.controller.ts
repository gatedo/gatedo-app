import {
  Controller, Post, Patch, Get, Delete,
  Body, Param, Headers, UnauthorizedException,
  HttpCode, Logger, BadRequestException,
} from '@nestjs/common';
import { ProspectsService } from './prospects.service';

const GATEWAY_SECRET = process.env.GATEWAY_SECRET || process.env.WA_GATEWAY_SECRET || 'change-me-in-render-env';

function assertSecret(s: string) {
  if (s !== GATEWAY_SECRET) throw new UnauthorizedException();
}

function toWebhookDate(value: any) {
  const raw =
    typeof value === 'object' && value !== null
      ? Number(value.low ?? value.value ?? value.seconds ?? value.toString?.())
      : Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return new Date();
  return new Date(raw > 10_000_000_000 ? raw : raw * 1000);
}

@Controller('prospects')
export class ProspectsController {
  constructor(private readonly svc: ProspectsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Post()
  upsert(@Body() body: any) {
    return this.svc.upsert(body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: any) {
    const status = body?.status || body?.column;
    if (!status) throw new BadRequestException('status obrigatorio');
    return this.svc.updateStatus(id, String(status));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Get('wa-status')
  getWaStatus() {
    return this.svc.getGatewayStatus();
  }

  @Get('wa-qr')
  getWaQr() {
    return this.svc.getQR();
  }

  @Post('wa-reconnect')
  reconnectWa() {
    return this.svc.reconnect();
  }

  @Post('send')
  send(@Body() body: any) {
    if (!body?.phone || !body?.text) {
      throw new BadRequestException('phone e text obrigatorios');
    }
    return this.svc.sendOne(body);
  }

  @Post('send-batch')
  sendBatch(@Body() body: any) {
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (!messages.length) {
      throw new BadRequestException('messages obrigatorio');
    }
    return this.svc.sendBatch(messages);
  }

  @Get('wa-bot')
  getWaBot() {
    return this.svc.getBotSettings();
  }

  @Post('wa-bot')
  updateWaBot(@Body() body: any) {
    return this.svc.updateBotSettings(body);
  }
}

// ─── Webhooks ───────────────────────────────────────────────────────────────
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  constructor(private readonly svc: ProspectsService) {}

  @Post('wa/message-sent')
  @HttpCode(200)
  async messageSent(
    @Headers('x-gateway-secret') s: string,
    @Body() b: { phone: string; prospectId: string; scriptId?: string; messageId: string; timestamp: number },
  ) {
    assertSecret(s);
    await this.svc.updateStatusByPhone(b.phone, 'sent', { lastMessageId: b.messageId, sentAt: new Date(b.timestamp) });
    return { ok: true };
  }

  @Post('wa/message-received')
  @HttpCode(200)
  async messageReceived(
    @Headers('x-gateway-secret') s: string,
    @Body() b: { phone: string; message: string; timestamp: number; messageId: string },
  ) {
    assertSecret(s);
    const receivedAt = toWebhookDate(b.timestamp);
    await this.svc.updateStatusByPhone(b.phone, 'replied', { lastReply: b.message, repliedAt: receivedAt });
    await this.svc.saveIncomingMessage(b);
    const botResult = await this.svc.handleAutoReply(b).catch((err) => {
      this.logger.warn({ err: err?.message, phone: b.phone }, 'WA bot nao respondeu');
      return { ok: false, error: err?.message };
    });
    this.logger.log({ phone: b.phone, botResult }, 'WA inbound processado');
    return { ok: true };
  }

  @Post('wa/delivery-update')
  @HttpCode(200)
  async deliveryUpdate(@Headers('x-gateway-secret') s: string, @Body() b: any) {
    assertSecret(s);
    await this.svc.saveDeliveryReceipt(b);
    return { ok: true };
  }

  @Post('wa/connected')
  @HttpCode(200)
  async connected(@Headers('x-gateway-secret') s: string) {
    assertSecret(s);
    this.logger.log('WA Gateway conectado');
    return { ok: true };
  }

  @Post('wa/disconnected')
  @HttpCode(200)
  async disconnected(@Headers('x-gateway-secret') s: string, @Body() b: any) {
    assertSecret(s);
    this.logger.warn({ code: b.code }, 'WA Gateway desconectado');
    return { ok: true };
  }

  @Post('wa/qr-updated')
  @HttpCode(200)
  async qrUpdated(@Headers('x-gateway-secret') s: string) {
    assertSecret(s);
    return { ok: true };
  }
}
