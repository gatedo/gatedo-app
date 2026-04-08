import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('categories')
export class CategoriesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  @Post()
  async create(@Body() dto: { name: string }) {
    // name não tem @unique no schema — usa findFirst + create
    const existing = await this.prisma.category.findFirst({ where: { name: dto.name } });
    if (existing) return existing;
    return this.prisma.category.create({ data: { name: dto.name } });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: { name: string }) {
    return this.prisma.category.update({ where: { id }, data: { name: dto.name } });
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}