// ─── kits.controller.ts ──────────────────────────────────────────────────────
// Localização: backend/src/controllers/kits.controller.ts
//
// GET    /kits          → lista todos os kits ativos
// POST   /kits          → cria kit
// PATCH  /kits/:id      → edita kit
// DELETE /kits/:id      → remove kit

import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('kits')
export class KitsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('all') all?: string) {
    return this.prisma.kit.findMany({
      where: all === 'true' ? undefined : { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  async create(@Body() dto: any) {
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
  async update(@Param('id') id: string, @Body() dto: any) {
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
  async remove(@Param('id') id: string) {
    return this.prisma.kit.delete({ where: { id } });
  }
}

