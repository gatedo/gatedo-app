import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Req, NotFoundException, HttpCode, BadRequestException, 
  UnauthorizedException, UseGuards
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Caminho baseado no seu print
import { calcTutorLevelMeta } from '../gamification/gamification.constants';

const STORE_SHARE_XPT_REWARD = 2;
 
@Controller('products')
export class ProductsController {
  constructor(private prisma: PrismaService) {}
 
  // ── GET /products ─────────────────────────────────────────────────────────
  @Get()
  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
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
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }
 
  // ── Resolve categoria por nome (cria se não existir) ─────────────────────
  private async resolveCategoryId(name: string): Promise<string> {
    let cat = await this.prisma.category.findFirst({ where: { name } });
    if (!cat) {
      cat = await this.prisma.category.create({ data: { name } });
    }
    return cat.id;
  }
 
  // ── POST /products ────────────────────────────────────────────────────────
  @Post()
  async create(@Body() dto: any) {
    const categoryId = await this.resolveCategoryId(dto.categoryName || dto.categoryId || 'Geral');
    return this.prisma.product.create({
      data: {
        name:         dto.name,
        description:  dto.description  || '',
        price:        dto.price,
        platform:     dto.platform     || null,
        externalLink: dto.externalLink || null,
        images:       dto.images       || [],
        videoReview:  dto.videoReview  || null,
        badge:        dto.badge        || null,
        categoryId,
      },
      include: { category: true },
    });
  }
 
  // ── PATCH /products/:id ───────────────────────────────────────────────────
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const categoryId = await this.resolveCategoryId(dto.categoryName || dto.categoryId || 'Geral');
    return this.prisma.product.update({
      where: { id },
      data: {
        name:         dto.name,
        description:  dto.description,
        price:        dto.price,
        platform:     dto.platform,
        externalLink: dto.externalLink,
        images:       dto.images,
        videoReview:  dto.videoReview ?? null,
        badge:        dto.badge       ?? null,
        categoryId,
      },
      include: { category: true },
    });
  }
 
  // ── DELETE /products/:id ──────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
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
