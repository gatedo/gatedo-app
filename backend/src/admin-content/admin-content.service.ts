import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminContentService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

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

  // Slug único gerado a partir do título (ou de um slug sugerido) — sufixa
  // "-2", "-3"... se já existir, em vez de falhar com erro de unicidade.
  private async uniqueProtocolSlug(base: string) {
    const normalized = base
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'protocolo';

    let slug = normalized;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await this.prisma.protocol.findUnique({ where: { slug }, select: { id: true } })) {
      n += 1;
      slug = `${normalized}-${n}`;
    }
    return slug;
  }

  async createProtocol(data: { title: string; slug?: string; summary?: string }) {
    if (!data?.title?.trim()) throw new BadRequestException('Título é obrigatório.');
    const slug = await this.uniqueProtocolSlug(data.slug?.trim() || data.title);

    return this.prisma.protocol.create({
      data: {
        slug,
        title: data.title.trim(),
        summary: data.summary?.trim() || null,
        totalDays: 0,
        status: 'DRAFT',
        requiresFounder: false,
        spec: { titulo: data.title.trim(), dias: [] },
      },
    });
  }

  async updateProtocolSpec(slug: string, spec: any) {
    await this.getProtocol(slug);
    // "dias" dentro do spec é a fonte real dos dias do protocolo — mantém a
    // coluna totalDays em sincronia automaticamente a cada save, em vez de
    // depender de alguém lembrar de atualizar os dois separadamente.
    const totalDays = Array.isArray(spec?.dias) ? spec.dias.length : undefined;
    return this.prisma.protocol.update({
      where: { slug },
      data: { spec, ...(totalDays !== undefined ? { totalDays } : {}) },
    });
  }

  // Pega um rascunho curto (ex.: "tarefa" ou "por quê" de um dia) e devolve
  // uma versão desenvolvida — pra quem dita/escreve rápido no celular e
  // quer transformar isso num texto de verdade sem reescrever do zero.
  async expandContent(text: string) {
    if (!text?.trim()) throw new BadRequestException('Texto vazio.');

    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content:
            'Você ajuda a expandir rascunhos curtos de conteúdo de cuidado com gatos para o app Gatedo. ' +
            'Mantenha um tom prático, direto e acolhedor, em português do Brasil. Desenvolva o texto dado ' +
            'com mais contexto e orientação útil, sem inventar informação clínica específica que não foi ' +
            'dada, sem enrolar — no máximo 2 a 4 parágrafos curtos.',
        },
        { role: 'user', content: text.trim() },
      ],
    });

    return { text: res.choices[0]?.message?.content?.trim() || text };
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
