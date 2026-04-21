import {
  Controller, Post, Patch, Get, Delete,
  Body, Param, Headers, UnauthorizedException,
  HttpCode, Logger,
} from '@nestjs/common';
import { ProspectsService } from './prospects.service';

const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'change-me-in-render-env';

function assertSecret(s: string) {
  if (s !== GATEWAY_SECRET) throw new UnauthorizedException();
}

// ─── Prospects CRUD + envio ───────────────────────────────────────────────────
@Controller('prospects')
export class ProspectsController {
  private readonly logger = new Logger(ProspectsController.name);
  constructor(private readonly svc: ProspectsService) {}

  @Get()
  list() { return this.svc.list(); }

  @Post()
  upsert(@Body() body: any) { return this.svc.upsert(body); }

  @Post('send')
  sendOne(@Body() body: { phone: string; text: string; imageUrl?: string; prospectId: string; scriptId?: string }) {
    return this.svc.sendOne(body);
  }

  @Post('send-batch')
  sendBatch(@Body() body: { messages: any[] }) {
    return this.svc.sendBatch(body.messages);
  }

  @Get('wa-status')
  waStatus() { return this.svc.getGatewayStatus(); }

  @Get('wa-qr')
  waQr() { return this.svc.getQR(); }

  @Post('wa-reconnect')
  waReconnect() { return this.svc.reconnect(); }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateStatus(id, body.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}

// ─── Webhooks vindos do WA Gateway ───────────────────────────────────────────
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
    await this.svc.updateStatusByPhone(b.phone, 'replied', { lastReply: b.message, repliedAt: new Date(b.timestamp * 1000) });
    await this.svc.saveIncomingMessage(b);
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