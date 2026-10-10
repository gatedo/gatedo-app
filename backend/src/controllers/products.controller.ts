import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  Req, NotFoundException, HttpCode, BadRequestException,
  UnauthorizedException, UseGuards, ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Caminho baseado no seu print
import { calcTutorLevelMeta } from '../gamification/gamification.constants';
import { XP_ACTIONS } from '../gamification/xp.config';
import {
  GANCHO_MAX, LEGACY_CATEGORY, MEDICINE_MESSAGE, PRODUCT_ROLES, PRODUCT_STATUSES,
  PUBLIC_PRODUCT_WHERE, STORE_CATEGORIES, isBlockedCategory, isValidAffiliateLink,
  normalizeBadge, normalizeImages, normalizeImportItem, publishBlockers, sameName,
} from '../store/product-rules';

// Compartilhar oferta da Loja: 2 XPT, uma vez por produto (o share reaproveita
// o token por tutor+produto e o confirm é idempotente). Valor em
// backend/src/gamification/xp.config.ts.
const STORE_SHARE_XPT_REWARD = XP_ACTIONS.STORE_SHARE.tutorXp;

@Controller('products')
export class ProductsController {
  constructor(private prisma: PrismaService) {}

  // Criar/editar/apagar produto é do painel admin. Antes era aberto a
  // qualquer um, sem login.
  private assertAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN.');
  }
 
  // ── GET /products ─────────────────────────────────────────────────────────
  // Loja do app: só publicados. O admin usa GET /products/admin.
  @Get()
  async findAll() {
    return this.prisma.product.findMany({
      where: PUBLIC_PRODUCT_WHERE,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── GET /products/admin ───────────────────────────────────────────────────
  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async findAllAdmin(@Req() req: any) {
    this.assertAdmin(req);
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── GET /products/admin/categories ────────────────────────────────────────
  // "options" = o que o formulário oferece (sem Saúde e sem Medicamento).
  @Get('admin/categories')
  @UseGuards(JwtAuthGuard)
  async categories(@Req() req: any) {
    this.assertAdmin(req);
    const all = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    return {
      all,
      options: STORE_CATEGORIES.filter((n) => all.some((c) => sameName(c.name, n))),
    };
  }

  // ── POST /products/import/preview  e  POST /products/import ──────────────
  @Post('import/preview')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async importPreview(@Req() req: any, @Body() body: any) {
    this.assertAdmin(req);
    const { items, summary } = await this.buildImportPreview(body);
    return { summary, items: items.map((i) => (i.ok ? { ...i, data: undefined } : i)) };
  }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  async importProducts(@Req() req: any, @Body() body: any) {
    this.assertAdmin(req);
    const preview = await this.buildImportPreview(body);
    const ok = preview.items.filter((i): i is Extract<typeof i, { ok: true }> => i.ok);
    // Numa transação e sem criar categoria: o import antigo disparava tudo em
    // paralelo e criava uma categoria duplicada por produto.
    await this.prisma.$transaction(ok.map((i) => this.prisma.product.create({ data: i.data as any })));
    return { ...preview.summary, created: ok.length };
  }

  private async buildImportPreview(body: any) {
    const list = Array.isArray(body) ? body : body?.items;
    if (!Array.isArray(list)) throw new BadRequestException('Formato inválido — esperado array de produtos.');
    const categories = await this.prisma.category.findMany();
    const now = new Date();
    const items = list.map((raw, i) => normalizeImportItem(raw, i, categories, now));
    return {
      items,
      summary: {
        total: items.length,
        ok: items.filter((i) => i.ok).length,
        drafts: items.filter((i) => i.ok && i.status === 'draft').length,
        published: items.filter((i) => i.ok && i.status === 'published').length,
        failed: items.filter((i) => !i.ok).length,
      },
    };
  }

  // ── GET /products/gatedo ─────────────────────────────────────────────────
  // Bloco "Do GATEDO" da Loja — protocolos + produtos digitais próprios,
  // cada um com "owned" pra tela trocar o botão de comprar por "Você tem".
  @Get('gatedo')
  async gatedoProducts(@Query('userId') userId?: string) {
    const [protocols, products] = await Promise.all([
      this.prisma.protocol.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, slug: true, title: true, summary: true, totalDays: true, spec: true, entitlementProductId: true },
      }),
      this.prisma.product.findMany({ where: { platform: 'Gatedo', ...PUBLIC_PRODUCT_WHERE } }),
    ]);

    const entitlementIds = [
      ...protocols.map((p) => p.entitlementProductId),
      ...products.map((p) => (p as any).entitlementProductId),
    ].filter(Boolean) as string[];

    const owned = userId && entitlementIds.length
      ? await this.prisma.productEntitlement.findMany({
          where: { userId, productId: { in: entitlementIds } },
          select: { productId: true },
        })
      : [];
    const ownedSet = new Set(owned.map((o) => o.productId));

    const protocolItems = protocols.map((p) => {
      const spec: any = p.spec || {};
      return {
        kind: 'PROTOCOL',
        id: p.id,
        title: spec.titulo_curto || p.title,
        summary: spec.subtitulo || p.summary || null,
        promessa: spec.promessa || null,
        duracaoDias: p.totalDays,
        precoCentavos: spec.preco_centavos ?? null,
        owned: p.entitlementProductId ? ownedSet.has(p.entitlementProductId) : false,
        ctaPath: `/protocolos/${p.slug}`,
        image: null,
      };
    });

    const productItems = products.map((pr: any) => ({
      kind: 'PRODUCT',
      id: pr.id,
      title: pr.name,
      summary: pr.description,
      promessa: null,
      duracaoDias: null,
      precoCentavos: Math.round(Number(pr.price) * 100),
      owned: pr.entitlementProductId ? ownedSet.has(pr.entitlementProductId) : false,
      image: Array.isArray(pr.images) ? pr.images[0] || null : null,
      ctaPath: pr.externalLink || null,
    }));

    return [...protocolItems, ...productItems];
  }
 
  // ── GET /products/share-stats ─────────────────────────────────────────────
  @Get('share-stats')
  async shareStats() {
    try {
      const shares = await (this.prisma as any).productShare.groupBy({
        by: ['productId'],
        _count: { id: true },
        _sum:   { clicks: true },
      });
      const result: Record<string, { shares: number; clicks: number }> = {};
      shares.forEach((s: any) => {
        result[s.productId] = {
          shares: s._count.id,
          clicks: s._sum.clicks ?? 0,
        };
      });
      return result;
    } catch {
      return {}; 
    }
  }
 
  // ── GET /products/:id ─────────────────────────────────────────────────────
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, ...PUBLIC_PRODUCT_WHERE },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  // ── Categoria: só as que existem (não cria mais por nome). Medicamento é
  // recusado; Saúde só fica pra quem já está nela, até recategorizar.
  private async resolveCategory(dto: any, currentCategoryId?: string) {
    const name = String(dto.categoryName ?? '').trim();
    if (isBlockedCategory(name)) throw new BadRequestException(MEDICINE_MESSAGE);
    if (!dto.categoryId && !name) {
      const current = currentCategoryId
        ? await this.prisma.category.findUnique({ where: { id: currentCategoryId } })
        : null;
      if (!current) throw new BadRequestException('Categoria obrigatória.');
      return current;
    }
    const all = await this.prisma.category.findMany();
    const cat = (dto.categoryId && all.find((c) => c.id === dto.categoryId)) || all.find((c) => sameName(c.name, name));
    if (!cat) throw new BadRequestException(`Categoria "${name || dto.categoryId}" não existe.`);
    if (isBlockedCategory(cat.name)) throw new BadRequestException(MEDICINE_MESSAGE);
    if (sameName(cat.name, LEGACY_CATEGORY) && cat.id !== currentCategoryId) {
      throw new BadRequestException('Categoria "Saúde" não aceita produto novo.');
    }
    return cat;
  }

  // DTO do formulário → campos do Prisma, validando. Só inclui o que veio
  // (PATCH parcial: o toggle "Mostrar na Home" manda só {featured} e antes
  // jogava o produto na categoria "Geral").
  private productFields(dto: any) {
    const data: Record<string, any> = {};
    const has = (k: string) => dto[k] !== undefined;
    const text = (v: any) => (v === null || v === undefined ? null : String(v).trim() || null);

    if (has('name')) {
      if (!String(dto.name).trim()) throw new BadRequestException('Nome obrigatório.');
      data.name = String(dto.name).trim();
    }
    if (has('description')) data.description = String(dto.description ?? '');
    if (has('price')) {
      const price = Number(String(dto.price).replace(',', '.'));
      if (!Number.isFinite(price) || price < 0) throw new BadRequestException('Preço inválido.');
      data.price = price;
    }
    if (has('platform')) data.platform = text(dto.platform);
    // externalLink é o campo antigo = linkApp; os dois ficam iguais.
    const linkApp = has('linkApp') ? dto.linkApp : has('externalLink') ? dto.externalLink : undefined;
    if (linkApp !== undefined) {
      const link = text(linkApp);
      if (link && !isValidAffiliateLink(link)) throw new BadRequestException('Link do app precisa começar com https://');
      data.linkApp = link;
      data.externalLink = link;
    }
    if (has('linkGroup')) {
      const link = text(dto.linkGroup);
      if (link && !isValidAffiliateLink(link)) throw new BadRequestException('Link do grupo precisa começar com https://');
      data.linkGroup = link;
    }
    if (has('images')) {
      const { valid, invalid } = normalizeImages(dto.images);
      if (invalid.length) throw new BadRequestException(`Imagem inválida: ${invalid.join(' ')}`);
      data.images = valid;
    }
    if (has('videoReview')) data.videoReview = text(dto.videoReview);
    if (has('badge')) {
      const badge = normalizeBadge(dto.badge);
      if (dto.badge && !badge) throw new BadRequestException(`Badge "${dto.badge}" não está na lista.`);
      data.badge = badge;
    }
    if (has('tags')) data.tags = Array.isArray(dto.tags) ? dto.tags : [];
    if (has('featured')) data.featured = !!dto.featured;
    if (has('subid')) data.subid = text(dto.subid)?.slice(0, 60) ?? null;
    if (has('role')) {
      if (dto.role && !PRODUCT_ROLES.includes(dto.role)) throw new BadRequestException('Papel inválido.');
      data.role = dto.role || null;
    }
    if (has('commissionPct')) {
      const v = dto.commissionPct === '' || dto.commissionPct === null ? null : Number(dto.commissionPct);
      if (v !== null && (!Number.isFinite(v) || v < 0 || v > 100)) throw new BadRequestException('Comissão inválida.');
      data.commissionPct = v;
    }
    if (has('gancho')) {
      const g = text(dto.gancho);
      if (g && g.length > GANCHO_MAX) throw new BadRequestException(`Gancho com mais de ${GANCHO_MAX} caracteres.`);
      data.gancho = g;
    }
    if (has('status')) {
      if (!(PRODUCT_STATUSES as readonly string[]).includes(dto.status)) throw new BadRequestException('Status inválido.');
      data.status = dto.status;
    }
    return data;
  }

  private assertPublishable(merged: any, categoryName: string) {
    if (merged.status !== 'published') return;
    const errors = publishBlockers({ linkApp: merged.linkApp, price: Number(merged.price), images: merged.images, categoryName });
    if (errors.length) throw new BadRequestException(errors.join(' '));
  }

  // ── POST /products ────────────────────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() dto: any) {
    this.assertAdmin(req);
    const category = await this.resolveCategory(dto);
    const data = this.productFields({ status: 'draft', ...dto });
    if (!data.name) throw new BadRequestException('Nome obrigatório.');
    this.assertPublishable(data, category.name);
    return this.prisma.product.create({
      data: {
        description: '',
        price: 0,
        ...(data as any),
        priceCheckedAt: Number(data.price) > 0 ? new Date() : null,
        categoryId: category.id,
      },
      include: { category: true },
    });
  }

  // ── PATCH /products/:id ───────────────────────────────────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    this.assertAdmin(req);
    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Produto não encontrado');

    const category = await this.resolveCategory(dto, current.categoryId);
    const data = this.productFields(dto);
    // Preço editado, ou "conferi o preço agora" → carimba a data.
    if ((data.price !== undefined && Number(data.price) !== Number(current.price)) || dto.priceChecked === true) {
      data.priceCheckedAt = new Date();
    }
    this.assertPublishable({ ...current, ...data }, category.name);

    return this.prisma.product.update({
      where: { id },
      data: { ...data, categoryId: category.id },
      include: { category: true },
    });
  }
 
  // ── DELETE /products/:id ──────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    this.assertAdmin(req);
    await this.prisma.product.delete({ where: { id } });
  }
 
  // ────────────────────────────────────────────────────────────────────────────
  // POST /products/share
  // BLOQUEADO: Só acessa se o JWT for válido
  // ────────────────────────────────────────────────────────────────────────────
  @Post('share')
  @UseGuards(JwtAuthGuard) // Protege contra userId undefined
  async createShare(@Body() dto: { productId: string }, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
 
    // Validação extra para garantir que o banco não receba lixo
    if (!userId) {
      throw new UnauthorizedException('Usuário não identificado.');
    }

    if (!dto.productId) {
      throw new BadRequestException('ID do produto é obrigatório.');
    }
 
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');
 
    const existing = await (this.prisma as any).productShare.findFirst({
      where: { userId, productId: dto.productId },
      orderBy: { createdAt: 'desc' },
    });
    
    if (existing) {
      return { shareToken: existing.token, message: 'Token existente reutilizado' };
    }
 
    const share = await (this.prisma as any).productShare.create({
      data: { userId, productId: dto.productId },
    });
 
    return {
      shareToken: share.token,
    };
  }

  @Post('share/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmShare(@Body() dto: { shareToken: string }, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Usuário não identificado.');
    }

    if (!dto.shareToken) {
      throw new BadRequestException('Token de compartilhamento é obrigatório.');
    }

    const share = await (this.prisma as any).productShare.findUnique({
      where: { token: dto.shareToken },
      select: {
        token: true,
        userId: true,
        productId: true,
      },
    });

    if (!share) {
      throw new NotFoundException('Compartilhamento não encontrado.');
    }

    if (share.userId !== userId) {
      throw new UnauthorizedException('Este compartilhamento não pertence a você.');
    }

    const reason = `STORE_SHARE:${dto.shareToken}`;

    return this.prisma.$transaction(async (tx) => {
      const existingReward = await tx.balanceAdjustmentLog.findFirst({
        where: { userId, reason },
      });

      if (existingReward) {
        const existingUser = await tx.user.findUnique({
          where: { id: userId },
          select: { xpt: true, gatedoPoints: true },
        });

        return {
          ok: true,
          alreadyRewarded: true,
          xptEarned: 0,
          xptTotal: existingUser?.xpt ?? 0,
          gptsTotal: existingUser?.gatedoPoints ?? 0,
        };
      }

      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { xpt: true, gatedoPoints: true },
      });

      if (!currentUser) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      const nextXpt = (currentUser.xpt ?? 0) + STORE_SHARE_XPT_REWARD;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xpt: nextXpt,
          level: calcTutorLevelMeta(nextXpt).rank,
        },
        select: {
          xpt: true,
          gatedoPoints: true,
        },
      });

      await tx.balanceAdjustmentLog.create({
        data: {
          userId,
          actorId: userId,
          walletDelta: 0,
          xpDelta: STORE_SHARE_XPT_REWARD,
          reason,
        },
      });

      await tx.rewardEvent.create({
        data: {
          userId,
          action: 'STORE_SHARE_CONFIRMED',
          gptsDelta: 0,
          xptDelta: STORE_SHARE_XPT_REWARD,
          metadata: {
            shareToken: dto.shareToken,
            productId: share.productId,
          },
        },
      });

      return {
        ok: true,
        alreadyRewarded: false,
        xptEarned: STORE_SHARE_XPT_REWARD,
        xptTotal: updatedUser.xpt ?? 0,
        gptsTotal: updatedUser.gatedoPoints ?? 0,
      };
    });
  }
 
  // ────────────────────────────────────────────────────────────────────────────
  // POST /products/track-click
  // ────────────────────────────────────────────────────────────────────────────
  @Post('track-click')
  @HttpCode(200)
  async trackClick(@Body() dto: { shareToken: string }) {
    if (!dto.shareToken) return { ok: false };
 
    const share = await (this.prisma as any).productShare.findUnique({
      where: { token: dto.shareToken },
    });
    if (!share) return { ok: false };
 
    await (this.prisma as any).productShare.update({
      where: { token: dto.shareToken },
      data:  { clicks: { increment: 1 } },
    });
 
    const totalClicks = share.clicks + 1;
    let pointsAwarded = false;
    
    // Proteção para garantir que o userId do share original existe no banco
    if (totalClicks <= 10 && share.userId) {
      await this.prisma.tutorPoints.upsert({
        where:  { userId: share.userId },
        update: { points: { increment: 5 }, totalEarned: { increment: 5 }, lastActionAt: new Date() },
        create: { userId: share.userId, points: 5, totalEarned: 5 },
      });
      pointsAwarded = true;
    }
 
    return { ok: true, pointsAwarded };
  }
}
