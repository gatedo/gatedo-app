import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';

type AuthUser = {
  id: string;
  role?: string;
};

@Injectable()
export class NoticesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

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

    return notices.map((notice: any) => {
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
    });
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

    return this.prisma.notice.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type || 'INFO',
        isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        xpReward:
          data.xpReward !== undefined && data.xpReward !== null
            ? Number(data.xpReward)
            : 3,
        imageUrl: data.imageUrl?.trim() || null,
      },
    });
  }

  async updateNotice(user: AuthUser, id: string, data: any) {
    this.ensureAdmin(user);

    const existing = await this.prisma.notice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Comunicado não encontrado.');
    }

    return this.prisma.notice.update({
      where: { id },
      data: {
        title:
          data.title !== undefined ? String(data.title).trim() : existing.title,
        content:
          data.content !== undefined
            ? String(data.content).trim()
            : existing.content,
        type: data.type ?? existing.type,
        isActive:
          typeof data.isActive === 'boolean' ? data.isActive : existing.isActive,
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
      },
    });
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