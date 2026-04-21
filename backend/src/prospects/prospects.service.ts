import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios, { AxiosError } from 'axios';

const GATEWAY_URL     = process.env.GATEWAY_URL    || 'http://localhost:3002';
const GATEWAY_SECRET  = process.env.GATEWAY_SECRET || 'change-me-in-render-env';
const GATEWAY_TIMEOUT = 12000;

@Injectable()
export class ProspectsService {
  private readonly logger = new Logger(ProspectsService.name);
  constructor(private readonly prisma: PrismaService) {}

  private headers() {
    return { 'x-gateway-secret': GATEWAY_SECRET };
  }

  // ── Chamadas ao Gateway com erro robusto ───────────────────────────────────
  private async gGet(path: string) {
    try {
      const r = await axios.get(`${GATEWAY_URL}${path}`, { headers: this.headers(), timeout: GATEWAY_TIMEOUT });
      return r.data;
    } catch (err) {
      const e = err as AxiosError<any>;
      this.logger.warn({ path, err: e.message, code: e.code }, 'Gateway GET falhou');
      if (['ECONNREFUSED','ECONNRESET','ERR_NETWORK','ENOTFOUND'].includes(e.code || '')) {
        throw new HttpException({ error: 'Gateway offline', code: 'GATEWAY_OFFLINE' }, HttpStatus.SERVICE_UNAVAILABLE);
      }
      if (e.code === 'ECONNABORTED') {
        throw new HttpException({ error: 'Gateway timeout', code: 'GATEWAY_TIMEOUT' }, HttpStatus.GATEWAY_TIMEOUT);
      }
      throw new HttpException({ error: e.message }, HttpStatus.BAD_GATEWAY);
    }
  }

  private async gPost(path: string, data: any) {
    try {
      const r = await axios.post(`${GATEWAY_URL}${path}`, data, { headers: this.headers(), timeout: GATEWAY_TIMEOUT });
      return r.data;
    } catch (err) {
      const e = err as AxiosError<any>;
      this.logger.warn({ path, err: e.message, code: e.code }, 'Gateway POST falhou');
      if (['ECONNREFUSED','ECONNRESET','ERR_NETWORK','ENOTFOUND'].includes(e.code || '')) {
        throw new HttpException({ error: 'Gateway offline', code: 'GATEWAY_OFFLINE' }, HttpStatus.SERVICE_UNAVAILABLE);
      }
      if (e.response?.status === 503) {
        throw new HttpException({ error: 'WA desconectado — escaneie o QR', code: 'WA_DISCONNECTED' }, HttpStatus.SERVICE_UNAVAILABLE);
      }
      throw new HttpException({ error: (e.response?.data as any)?.error || e.message }, HttpStatus.BAD_GATEWAY);
    }
  }

  // ── Envio ─────────────────────────────────────────────────────────────────
  async sendOne(data: { phone: string; text: string; imageUrl?: string; prospectId: string; scriptId?: string }) {
    return this.gPost('/send', data);
  }

  async sendBatch(messages: Array<{ phone: string; text: string; imageUrl?: string; prospectId: string; scriptId?: string }>) {
    return this.gPost('/send-batch', { messages });
  }

  // ── Status — NUNCA retorna 500, sempre retorna JSON seguro ────────────────
  async getGatewayStatus() {
    try {
      return await this.gGet('/status');
    } catch {
      return { connected: false, hasQR: false, queueSize: 0, offline: true };
    }
  }

  async getQR() {
    try {
      return await this.gGet('/qr');
    } catch (e: any) {
      return { connected: false, qr: null, error: e?.response?.error || 'Gateway offline' };
    }
  }

  async reconnect() {
    try { return await this.gPost('/reconnect', {}); }
    catch { return { ok: false }; }
  }

  // ── CRUD Prospects ────────────────────────────────────────────────────────
  async list() {
    return this.prisma.prospect.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async upsert(data: any) {
    const { id, ...rest } = data;
    if (!id) return this.prisma.prospect.create({ data: rest });
    return this.prisma.prospect.upsert({
      where:  { id },
      update: { ...rest, updatedAt: new Date() },
      create: { id, ...rest },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.prospect.update({
      where: { id },
      data:  { status, column: status, updatedAt: new Date() },
    }).catch(() => ({ ok: true }));
  }

  async remove(id: string) {
    return this.prisma.prospect.delete({ where: { id } }).catch(() => ({ ok: true }));
  }

  async updateStatusByPhone(phone: string, status: string, extra: Record<string, any> = {}) {
    const n = phone.replace(/[^\d]/g, '').slice(-10);
    return this.prisma.prospect.updateMany({
      where: { phone: { contains: n } },
      data:  { status, column: status, ...extra, updatedAt: new Date() },
    });
  }

  async saveIncomingMessage(data: { phone: string; message: string; timestamp: number; messageId: string }) {
    const n = data.phone.replace(/[^\d]/g, '').slice(-10);
    const p = await this.prisma.prospect.findFirst({ where: { phone: { contains: n } } });
    if (!p) return;
    return this.prisma.prospectMessage.create({
      data: {
        prospectId:  p.id,
        direction:   'incoming',
        body:        data.message,
        waMessageId: data.messageId,
        sentAt:      new Date(data.timestamp * 1000),
      },
    });
  }

  async saveDeliveryReceipt(data: any) {
    this.logger.debug({ data }, 'delivery receipt');
  }
}