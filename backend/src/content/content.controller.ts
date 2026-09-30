import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertOwnsEnrollment } from '../common/ownership.util';

@Controller('content')
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Guia ──────────────────────────────────────────────────────────────
  // Conteúdo editorial — aberto.
  @Get('guides/themes')
  listGuideThemes() {
    return this.content.listGuideThemes();
  }

  @Get('guide-categories')
  listGuideCategories() {
    return this.content.listGuideCategories();
  }

  @Get('guides')
  listGuideEntries(
    @Query('categoryId') categoryId?: string,
    @Query('theme') theme?: string,
    @Query('q') q?: string,
  ) {
    return this.content.listGuideEntries({ categoryId, theme, q });
  }

  @Get('guides/:slug')
  getGuideEntry(@Param('slug') slug: string) {
    return this.content.getGuideEntry(slug);
  }

  // ── Protocolo ─────────────────────────────────────────────────────────
  // Só logado, e o usuário é SEMPRE o do token. Antes vinha de ?userId= ou do
  // body: dava pra ler protocolo pago passando o id de quem comprou, ou
  // concluir/avançar a inscrição de outro tutor.
  @Get('protocols')
  @UseGuards(JwtAuthGuard)
  listProtocols(@Req() req: any) {
    return this.content.listProtocols(req.user.id);
  }

  @Get('protocols/enrollments/mine')
  @UseGuards(JwtAuthGuard)
  listMyEnrollments(@Req() req: any, @Query('petId') petId?: string) {
    return this.content.listMyEnrollments(req.user.id, petId);
  }

  @Get('protocols/enrollments/:id')
  @UseGuards(JwtAuthGuard)
  async getEnrollment(@Req() req: any, @Param('id') id: string) {
    await assertOwnsEnrollment(this.prisma, id, req.user);
    return this.content.getEnrollment(id);
  }

  @Post('protocols/enrollments/:id/complete-day')
  @UseGuards(JwtAuthGuard)
  async completeDay(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { note?: string; severityScore?: number; resolved?: boolean },
  ) {
    await assertOwnsEnrollment(this.prisma, id, req.user);
    return this.content.completeDay(id, body);
  }

  @Post('protocols/enrollments/:id/advance')
  @UseGuards(JwtAuthGuard)
  async advanceDay(@Req() req: any, @Param('id') id: string) {
    await assertOwnsEnrollment(this.prisma, id, req.user);
    return this.content.advanceDay(id);
  }

  @Get('protocols/:slug')
  @UseGuards(JwtAuthGuard)
  getProtocol(@Req() req: any, @Param('slug') slug: string) {
    return this.content.getProtocol(slug, req.user.id);
  }

  @Post('protocols/:slug/enroll')
  @UseGuards(JwtAuthGuard)
  enroll(@Req() req: any, @Param('slug') slug: string, @Body() body: { petId: string }) {
    return this.content.enroll(slug, req.user.id, body.petId);
  }
}
