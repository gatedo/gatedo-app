import {
  Controller, Post, Patch, Get, Delete,
  Body, Param, Headers, UnauthorizedException,
  HttpCode, Logger, BadRequestException, Query, Res, Req,
  UseGuards, CanActivate, ExecutionContext, Injectable, ForbiddenException, HttpException, HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ProspectsService } from './prospects.service';
import { OPTIN_SOURCES, OptinSource } from './wa-consent';

const META_WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'gatedo_meta_verify_2026';

// Antes este controller era aberto: qualquer um listava leads e disparava
// mensagens pelo número do Gatedo. Agora só ADMIN logado.
@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const user = context.switchToHttp().getRequest().user;
    if (user?.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN.');
    return true;
  }
}

// Limite simples por IP para o opt-in público (gatedo.com/bio).
const optinHits = new Map<string, number[]>();
function assertOptinRate(ip: string) {
  const now = Date.now();
  const recent = (optinHits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= 10) {
    throw new HttpException({ error: 'Muitas tentativas. Tente mais tarde.' }, HttpStatus.TOO_MANY_REQUESTS);
  }
  recent.push(now);
  optinHits.set(ip, recent);
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
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class ProspectsController {
  constructor(private readonly svc: ProspectsService) {}

  @Get('templates')
  listTemplates() {
    return this.svc.listTemplates();
  }

  @Post('templates')
  createTemplate(@Body() body: any) {
    return this.svc.createTemplate(body);
  }

  @Post('templates/bulk')
  replaceTemplatesPost(@Body() body: any) {
    return this.svc.replaceTemplates(Array.isArray(body) ? body : body?.templates);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.svc.deleteTemplate(id);
  }

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

  @Post('wa-disconnect')
  disconnectWa() {
    return this.svc.disconnectGateway();
  }

  @Post('wa-clear-queue')
  clearWaQueue() {
    return this.svc.clearGatewayQueue();
  }

  @Post('merge-duplicates')
  mergeDuplicates() {
    return this.svc.mergeDuplicateProspects();
  }

  // Disparo pelo admin: sempre "campaign" (exige opt-in no número principal).
  @Post('send')
  send(@Body() body: any) {
    if (!body?.phone || !body?.text) {
      throw new BadRequestException('phone e text obrigatorios');
    }
    return this.svc.sendOne({ ...body, purpose: 'campaign' });
  }

  @Post('send-batch')
  sendBatch(@Body() body: any) {
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (!messages.length) {
      throw new BadRequestException('messages obrigatorio');
    }
    return this.svc.sendBatch(messages.map((m: any) => ({ ...m, purpose: 'campaign' })), body?.senderId);
  }

  @Get('metrics')
  metrics() {
    return this.svc.metrics();
  }

  @Get('senders')
  senders() {
    return this.svc.listSenders();
  }

  @Post('senders')
  saveSenders(@Body() body: any) {
    return this.svc.saveSenders(Array.isArray(body?.senders) ? body.senders : []);
  }

  @Get('imported/export')
  exportImported() {
    return this.svc.exportImported();
  }

  // Exclusão em massa da lista importada: exige confirmar digitando EXCLUIR.
  @Delete('imported')
  deleteImported(@Query('confirm') confirm: string) {
    if (confirm !== 'EXCLUIR') throw new BadRequestException('Confirme com ?confirm=EXCLUIR');
    return this.svc.deleteImported();
  }

  @Post(':id/handoff/clear')
  clearHandoff(@Param('id') id: string) {
    return this.svc.clearHandoff(id);
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

  private async senderFor(secret: string) {
    const sender = await this.svc.senderForSecret(secret);
    if (!sender) throw new UnauthorizedException();
    return sender;
  }

  @Get('meta/whatsapp')
  verifyMetaWhatsapp(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: any,
  ) {
    if (mode === 'subscribe' && token === META_WEBHOOK_VERIFY_TOKEN) {
      this.logger.log('Meta WhatsApp webhook verificado');
      return res.status(200).send(challenge);
    }

    this.logger.warn({ mode, tokenOk: token === META_WEBHOOK_VERIFY_TOKEN }, 'Meta WhatsApp webhook recusado');
    return res.sendStatus(403);
  }

  @Post('meta/whatsapp')
  @HttpCode(200)
  async metaWhatsapp(@Body() body: any) {
    await this.svc.handleMetaWebhook(body).catch((err) => {
      this.logger.warn({ err: err?.message }, 'Meta WhatsApp webhook falhou');
    });
    return { ok: true };
  }

  @Post('wa/message-sent')
  @HttpCode(200)
  async messageSent(
    @Headers('x-gateway-secret') s: string,
    @Body() b: { phone: string; prospectId: string; scriptId?: string; messageId: string; timestamp: number; text?: string; imageUrl?: string },
  ) {
    await this.senderFor(s);
    await this.svc.markMessageSent(b);
    return { ok: true };
  }

  @Post('wa/message-received')
  @HttpCode(200)
  async messageReceived(
    @Headers('x-gateway-secret') s: string,
    @Body() b: {
      phone: string;
      message: string;
      timestamp: number;
      messageId: string;
      remoteJid?: string;
      participantJid?: string;
      quotedMessageId?: string | null;
      quotedParticipant?: string | null;
    },
  ) {
    const sender = await this.senderFor(s);
    await this.svc.saveIncomingMessage(b, sender.id);
    const botResult = await this.svc.handleAutoReply(b, sender.id).catch((err) => {
      this.logger.warn({ err: err?.message, phone: b.phone }, 'WA bot nao respondeu');
      return { ok: false, error: err?.message };
    });
    this.logger.log({ phone: b.phone, botResult }, 'WA inbound processado');
    return { ok: true };
  }

  @Post('wa/delivery-update')
  @HttpCode(200)
  async deliveryUpdate(@Headers('x-gateway-secret') s: string, @Body() b: any) {
    await this.senderFor(s);
    await this.svc.saveDeliveryReceipt(b);
    return { ok: true };
  }

  @Post('wa/connected')
  @HttpCode(200)
  async connected(@Headers('x-gateway-secret') s: string) {
    await this.senderFor(s);
    this.logger.log('WA Gateway conectado');
    return { ok: true };
  }

  @Post('wa/disconnected')
  @HttpCode(200)
  async disconnected(@Headers('x-gateway-secret') s: string, @Body() b: any) {
    await this.senderFor(s);
    this.logger.warn({ code: b.code }, 'WA Gateway desconectado');
    return { ok: true };
  }

  @Post('wa/qr-updated')
  @HttpCode(200)
  async qrUpdated(@Headers('x-gateway-secret') s: string) {
    await this.senderFor(s);
    return { ok: true };
  }
}

// ─── Público: opt-in e cliques do bot ───────────────────────────────────────
@Controller('wa')
export class WaPublicController {
  constructor(
    private readonly svc: ProspectsService,
    private readonly prisma: PrismaService,
  ) {}

  // gatedo.com/bio: "Quero receber achados e avisos do Gatedo no WhatsApp".
  @Post('optin')
  @HttpCode(200)
  optin(@Req() req: any, @Body() body: any) {
    assertOptinRate(String(req.ip || req.headers?.['x-forwarded-for'] || 'unknown'));
    if (body?.consent !== true) throw new BadRequestException('Marque a caixa de consentimento.');
    const source = OPTIN_SOURCES.includes(body?.source) ? (body.source as OptinSource) : 'bio';
    return this.svc.registerOptin({ phone: String(body?.phone || ''), name: body?.name ? String(body.name).slice(0, 80) : null, source });
  }

  // App logado: usa o telefone do perfil (ou o informado na hora).
  @Post('optin/me')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async optinMe(@Req() req: any, @Body() body: any) {
    if (body?.consent !== true) throw new BadRequestException('Marque a caixa de consentimento.');
    const user = await this.prisma.user.findUnique({ where: { id: req.user?.id }, select: { name: true, phone: true } });
    const phone = String(body?.phone || user?.phone || '');
    if (!phone) throw new BadRequestException('Informe seu WhatsApp.');
    return this.svc.registerOptin({ phone, name: user?.name || null, source: 'app' });
  }

  // Links das opções 1 e 2 do bot: conta o clique e redireciona.
  @Get('go/:target')
  async go(@Param('target') target: string, @Query('p') prospectId: string, @Res() res: any) {
    const destination = await this.svc.trackClick(target === 'grupo' ? 'grupo' : 'app', prospectId);
    return res.redirect(302, destination);
  }
}
