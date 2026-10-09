// ─── kits.controller.ts ──────────────────────────────────────────────────────
// Localização: backend/src/controllers/kits.controller.ts
//
// GET    /kits          → lista todos os kits ativos
// POST   /kits          → cria kit (ADMIN)
// PATCH  /kits/:id      → edita kit (ADMIN)
// DELETE /kits/:id      → remove kit (ADMIN)

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('kits')
export class KitsController {
  constructor(private readonly prisma: PrismaService) {}

  // Escrita era aberta a qualquer um, sem login.
  private assertAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN.');
  }

  @Get()
  async findAll(@Query('all') all?: string) {
    return this.prisma.kit.findMany({
      where: all === 'true' ? undefined : { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() dto: any) {
    this.assertAdmin(req);
    return this.prisma.kit.create({
      data: {
        title:      dto.title,
        subtitle:   dto.subtitle   || '',
        iconName:   dto.iconName   || 'Gift',
        gradient:   dto.gradient   || 'from-yellow-400 to-orange-500',
        productIds: dto.productIds || [],
        active:     dto.active     ?? true,
      },
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    this.assertAdmin(req);
    return this.prisma.kit.update({
      where: { id },
      data: {
        ...(dto.title      !== undefined && { title:      dto.title }),
        ...(dto.subtitle   !== undefined && { subtitle:   dto.subtitle }),
        ...(dto.iconName   !== undefined && { iconName:   dto.iconName }),
        ...(dto.gradient   !== undefined && { gradient:   dto.gradient }),
        ...(dto.productIds !== undefined && { productIds: dto.productIds }),
        ...(dto.active     !== undefined && { active:     dto.active }),
      },
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.prisma.kit.delete({ where: { id } });
  }
}
