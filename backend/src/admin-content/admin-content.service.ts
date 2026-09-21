import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminContentService {
  constructor(private prisma: PrismaService) {}

  // ── Guias (Almanaque) ───────────────────────────────────────────────────
  listGuides() {
    return this.prisma.guideEntry.findMany({
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getGuide(slug: string) {
    const entry = await this.prisma.guideEntry.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!entry) throw new NotFoundException('Verbete não encontrado.');
    return entry;
  }

  createGuide(data: any) {
    return this.prisma.guideEntry.create({
      data: {
        slug: data.slug,
        title: data.title,
        theme: data.theme || data.title,
        categoryId: data.categoryId || null,
        excerpt: data.excerpt || null,
        body: data.body || '',
        blocks: Array.isArray(data.blocks) ? data.blocks : undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
        urgency: data.urgency || null,
        vejaTambem: Array.isArray(data.vejaTambem) ? data.vejaTambem : [],
        perguntaIgentvet: data.perguntaIgentvet || null,
        status: data.status || 'DRAFT',
      },
    });
  }

  async updateGuide(slug: string, data: any) {
    await this.getGuide(slug);
    return this.prisma.guideEntry.update({
      where: { slug },
      data: {
        title: data.title,
        theme: data.theme,
        categoryId: data.categoryId ?? undefined,
        excerpt: data.excerpt,
        body: data.body,
        blocks: Array.isArray(data.blocks) ? data.blocks : data.blocks === null ? null : undefined,
        tags: Array.isArray(data.tags) ? data.tags : undefined,
        urgency: data.urgency,
        vejaTambem: Array.isArray(data.vejaTambem) ? data.vejaTambem : undefined,
        perguntaIgentvet: data.perguntaIgentvet,
        status: data.status,
      },
    });
  }

  listGuideCategories() {
    return this.prisma.guideCategory.findMany({ orderBy: { nome: 'asc' } });
  }

  // ── Protocolos ───────────────────────────────────────────────────────────
  listProtocols() {
    return this.prisma.protocol.findMany({
      select: {
        id: true, slug: true, title: true, summary: true, totalDays: true,
        status: true, requiresFounder: true, entitlementProductId: true, updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getProtocol(slug: string) {
    const protocol = await this.prisma.protocol.findUnique({ where: { slug } });
    if (!protocol) throw new NotFoundException('Protocolo não encontrado.');
    return protocol;
  }

  async updateProtocolSpec(slug: string, spec: any) {
    await this.getProtocol(slug);
    return this.prisma.protocol.update({
      where: { slug },
      data: { spec },
    });
  }

  // Campos de venda/acesso que não vivem dentro do spec (colunas do
  // Protocol): status de publicação, exigência de plano founder e o
  // productId que o webhook da Kiwify precisa bater pra liberar sozinho.
  async updateProtocolAccess(slug: string, data: any) {
    await this.getProtocol(slug);
    return this.prisma.protocol.update({
      where: { slug },
      data: {
        summary: data.summary,
        status: data.status,
        requiresFounder: typeof data.requiresFounder === 'boolean' ? data.requiresFounder : undefined,
        entitlementProductId: data.entitlementProductId === '' ? null : data.entitlementProductId,
      },
    });
  }
}
