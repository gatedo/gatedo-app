import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { PushService } from '../push/push.service';

type AuthUser = {
  id: string;
  role?: string;
};

@Injectable()
export class NoticesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
    private readonly push: PushService,
  ) {}

  private async broadcastPush(notice: { id: string; title: string; content: string }) {
    const body = notice.content.length > 120 ? `${notice.content.slice(0, 117)}...` : notice.content;
    await this.push.broadcastToAll({ title: notice.title, body, url: '/home' });
    await this.prisma.notice.update({ where: { id: notice.id }, data: { pushSentAt: new Date() } });
  }

  private ensureAdmin(user: AuthUser) {
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  async getActiveNotices(userId?: string) {
    const now = new Date();

    const notices = await this.prisma.notice.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      include: userId
        ? {
            reads: {
              where: { userId },
              select: {
                id: true,
                readAt: true,
                xpGranted: true,
              },
            },
          }
        : undefined,
    });

    return notices
      .map((notice: any) => {
        const read =
          Array.isArray(notice.reads) && notice.reads.length > 0
            ? notice.reads[0]
            : null;

        return {
          id: notice.id,
          title: notice.title,
          content: notice.content,
          type: notice.type,
          isActive: notice.isActive,
          expiresAt: notice.expiresAt,
          createdAt: notice.createdAt,
          updatedAt: notice.updatedAt,
          xpReward: notice.xpReward ?? 3,
          imageUrl: notice.imageUrl ?? null,
          hasRead: !!read,
          readAt: read?.readAt ?? null,
          xpGranted: read?.xpGranted ?? false,
        };
      })
      .filter((notice) => !notice.hasRead);
  }

  async getAdminNotices(user: AuthUser) {
    this.ensureAdmin(user);

    const notices = await this.prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            reads: true,
          },
        },
      },
    });

    return notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      isActive: notice.isActive,
      expiresAt: notice.expiresAt,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
      xpReward: notice.xpReward ?? 3,
      imageUrl: notice.imageUrl ?? null,
      sendPush: notice.sendPush,
      pushSentAt: notice.pushSentAt,
      totalReads: notice._count.reads,
    }));
  }

  async getNoticeById(id: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reads: true,
          },
        },
      },
    });

    if (!notice) {
      throw new NotFoundException('Comunicado não encontrado.');
    }

    return {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      isActive: notice.isActive,
      expiresAt: notice.expiresAt,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
      xpReward: notice.xpReward ?? 3,
      imageUrl: notice.imageUrl ?? null,
      totalReads: notice._count.reads,
    };
  }

  async createNotice(user: AuthUser, data: any) {
    this.ensureAdmin(user);

    if (!data?.title?.trim()) {
      throw new BadRequestException('Título é obrigatório.');
    }

    if (!data?.content?.trim()) {
      throw new BadRequestException('Conteúdo é obrigatório.');
    }

    const isActive = typeof data.isActive === 'boolean' ? data.isActive : true;
    const sendPush = typeof data.sendPush === 'boolean' ? data.sendPush : true;

    const notice = await this.prisma.notice.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type || 'INFO',
        isActive,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        xpReward:
          data.xpReward !== undefined && data.xpReward !== null
            ? Number(data.xpReward)
            : 3,
        imageUrl: data.imageUrl?.trim() || null,
        sendPush,
      },
    });

    if (isActive && sendPush) {
      this.broadcastPush(notice).catch(() => {});
    }

    return notice;
  }

  async updateNotice(user: AuthUser, id: string, data: any) {
    this.ensureAdmin(user);

    const existing = await this.prisma.notice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Comunicado não encontrado.');
    }

    const isActive = typeof data.isActive === 'boolean' ? data.isActive : existing.isActive;
    const sendPush = typeof data.sendPush === 'boolean' ? data.sendPush : existing.sendPush;

    const updated = await this.prisma.notice.update({
      where: { id },
      data: {
        title:
          data.title !== undefined ? String(data.title).trim() : existing.title,
        content:
          data.content !== undefined
            ? String(data.content).trim()
            : existing.content,
        type: data.type ?? existing.type,
        isActive,
        expiresAt:
          data.expiresAt === null
            ? null
            : data.expiresAt
              ? new Date(data.expiresAt)
              : existing.expiresAt,
        xpReward:
          data.xpReward !== undefined && data.xpReward !== null
            ? Number(data.xpReward)
            : existing.xpReward,
        imageUrl:
          data.imageUrl !== undefined
            ? data.imageUrl?.trim() || null
            : existing.imageUrl,
        sendPush,
      },
    });

    // Só dispara na transição pra ativo — nunca reenvia por causa de uma
    // edição de texto num comunicado que já foi publicado.
    if (isActive && sendPush && !existing.pushSentAt) {
      this.broadcastPush(updated).catch(() => {});
    }

    return updated;
  }

  async deleteNotice(user: AuthUser, id: string) {
    this.ensureAdmin(user);

    const existing = await this.prisma.notice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Comunicado não encontrado.');
    }

    await this.prisma.notice.delete({
      where: { id },
    });

    return { success: true };
  }

  async confirmRead(noticeId: string, user: AuthUser) {
    if (!user?.id) {
      throw new BadRequestException('Usuário não autenticado.');
    }

    const notice = await this.prisma.notice.findUnique({
      where: { id: noticeId },
    });

    if (!notice) {
      throw new NotFoundException('Comunicado não encontrado.');
    }

    if (!notice.isActive) {
      throw new BadRequestException('Comunicado inativo.');
    }

    if (notice.expiresAt && new Date(notice.expiresAt) <= new Date()) {
      throw new BadRequestException('Comunicado expirado.');
    }

    const existingRead = await this.prisma.noticeRead.findUnique({
      where: {
        userId_noticeId: {
          userId: user.id,
          noticeId,
        },
      },
    });

    if (existingRead) {
      return {
        success: true,
        alreadyRead: true,
        xpAwardedNow: false,
        xpReward: notice.xpReward ?? 3,
        readAt: existingRead.readAt,
      };
    }

    const createdRead = await this.prisma.noticeRead.create({
      data: {
        userId: user.id,
        noticeId,
        xpGranted: false,
        xpGrantedAt: null,
      },
    });

    const xpReward = Number(notice.xpReward ?? 3);
    let xpAwardedNow = false;

    if (xpReward > 0) {
      await this.gamificationService.addXp({
        userId: user.id,
        amount: xpReward,
        reason: `Leitura do comunicado: ${notice.title}`,
      });

      await this.prisma.noticeRead.update({
        where: { id: createdRead.id },
        data: {
          xpGranted: true,
          xpGrantedAt: new Date(),
        },
      });

      xpAwardedNow = true;
    }

    return {
      success: true,
      alreadyRead: false,
      xpAwardedNow,
      xpReward,
      readAt: createdRead.readAt,
    };
  }
}