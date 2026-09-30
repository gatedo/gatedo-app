import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Leitura aberta; escrever/apagar só pelo painel admin (antes era aberto a
// qualquer um, sem login).
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  private assertAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN.');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() data: any) {
    this.assertAdmin(req);
    return this.articlesService.create(data);
  }

  @Get()
  findAll() { return this.articlesService.findAll(); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    this.assertAdmin(req);
    return this.articlesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Req() req: any, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.articlesService.remove(id);
  }
}
