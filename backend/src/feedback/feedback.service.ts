import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

type AuthUser = { id: string; role?: string };

const CATEGORIES = ['FEATURE', 'BUG', 'DESIGN', 'MESSAGE', 'OTHER'];
const SOURCES = ['MUNDO_GATEDO', 'PROFILE'];
const STATUSES = ['NOVO', 'LIDO', 'RESPONDIDO', 'ARQUIVADO'];

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  private ensureAdmin(user: AuthUser) {
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  async create(user: AuthUser, data: { category?: string; source: string; text: string }) {
    if (!user?.id) throw new BadRequestException('Usuário não autenticado.');
    if (!data?.text?.trim()) throw new BadRequestException('Escreva sua mensagem.');
    if (!SOURCES.includes(data.source)) throw new BadRequestException('Origem inválida.');

    const category = CATEGORIES.includes(data.category as string) ? data.category! : 'OTHER';

    const message = await this.prisma.feedbackMessage.create({
      data: {
        userId: user.id,
        category,
        source: data.source,
        text: data.text.trim().slice(0, 2000),
      },
    });

    this.events.track({
      name: 'feedback_submitted',
      userId: user.id,
      props: { source: data.source, category },
    }).catch(() => {});

    return { id: message.id, createdAt: message.createdAt };
  }

  async listForAdmin(user: AuthUser, status?: string) {
    this.ensureAdmin(user);

    const messages = await this.prisma.feedbackMessage.findMany({
      where: status && STATUSES.includes(status) ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, plan: true, photoUrl: true } } },
    });

    return messages.map((m) => ({
      id: m.id,
      category: m.category,
      source: m.source,
      text: m.text,
      status: m.status,
      adminReply: m.adminReply,
      repliedAt: m.repliedAt,
      createdAt: m.createdAt,
      user: m.user,
    }));
  }

  async updateStatus(user: AuthUser, id: string, data: { status?: string; adminReply?: string }) {
    this.ensureAdmin(user);

    const existing = await this.prisma.feedbackMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Mensagem não encontrada.');

    const status = data.status && STATUSES.includes(data.status) ? data.status : existing.status;
    const hasNewReply = typeof data.adminReply === 'string' && data.adminReply.trim().length > 0;

    return this.prisma.feedbackMessage.update({
      where: { id },
      data: {
        status,
        adminReply: hasNewReply ? data.adminReply!.trim() : existing.adminReply,
        repliedAt: hasNewReply ? new Date() : existing.repliedAt,
      },
    });
  }
}
