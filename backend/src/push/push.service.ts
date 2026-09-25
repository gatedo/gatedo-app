import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private configured = false;

  constructor(private readonly prisma: PrismaService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (publicKey && privateKey) {
      webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contato@gatedo.com', publicKey, privateKey);
      this.configured = true;
    } else {
      this.logger.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY ausentes — push desativado.');
    }
  }

  getPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  async subscribe(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return null;
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      create: { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  async hasSubscription(userId: string) {
    const count = await this.prisma.pushSubscription.count({ where: { userId } });
    return count > 0;
  }

  private async sendToSubscription(sub: { id: string; endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as any,
        JSON.stringify(payload),
      );
      return true;
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        this.logger.warn(`Falha ao enviar push (${sub.endpoint.slice(0, 40)}...): ${err?.message}`);
      }
      return false;
    }
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<{ sent: number }> {
    if (!this.configured) return { sent: 0 };
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    let sent = 0;
    for (const sub of subs) {
      if (await this.sendToSubscription(sub, payload)) sent++;
    }
    return { sent };
  }

  // Alerta sonoro no aparelho pra todo mundo com push ativado — usado pelos
  // comunicados oficiais (Notice) que marcam sendPush.
  async broadcastToAll(payload: PushPayload): Promise<{ sent: number; total: number }> {
    if (!this.configured) return { sent: 0, total: 0 };
    const subs = await this.prisma.pushSubscription.findMany();
    let sent = 0;
    for (const sub of subs) {
      if (await this.sendToSubscription(sub, payload)) sent++;
    }
    return { sent, total: subs.length };
  }
}
