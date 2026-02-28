import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.article.create({ data });
  }

  async findAll() {
    return this.prisma.article.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, data: any) {
    return this.prisma.article.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    return this.prisma.article.delete({ where: { id } });
  }
}