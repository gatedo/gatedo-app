import {
  Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { AdminContentService } from './admin-content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/content')
@UseGuards(JwtAuthGuard)
export class AdminContentController {
  constructor(private readonly service: AdminContentService) {}

  private ensureAdmin(user: any) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  // ── Guias (Almanaque) ───────────────────────────────────────────────────
  @Get('guides')
  listGuides(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.service.listGuides();
  }

  @Get('guide-categories')
  listGuideCategories(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.service.listGuideCategories();
  }

  @Get('guides/:slug')
  getGuide(@Param('slug') slug: string, @Req() req: any) {
    this.ensureAdmin(req.user);
    return this.service.getGuide(slug);
  }

  @Post('guides')
  createGuide(@Body() body: any, @Req() req: any) {
    this.ensureAdmin(req.user);
    return this.service.createGuide(body);
  }

  @Patch('guides/:slug')
  updateGuide(@Param('slug') slug: string, @Body() body: any, @Req() req: any) {
    this.ensureAdmin(req.user);
    return this.service.updateGuide(slug, body);
  }

  // ── Protocolos ───────────────────────────────────────────────────────────
  @Get('protocols')
  listProtocols(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.service.listProtocols();
  }

  @Get('protocols/:slug')
  getProtocol(@Param('slug') slug: string, @Req() req: any) {
    this.ensureAdmin(req.user);
    return this.service.getProtocol(slug);
  }

  @Patch('protocols/:slug/spec')
  updateProtocolSpec(@Param('slug') slug: string, @Body() body: { spec: any }, @Req() req: any) {
    this.ensureAdmin(req.user);
    return this.service.updateProtocolSpec(slug, body.spec);
  }

  @Patch('protocols/:slug/access')
  updateProtocolAccess(@Param('slug') slug: string, @Body() body: any, @Req() req: any) {
    this.ensureAdmin(req.user);
    return this.service.updateProtocolAccess(slug, body);
  }
}
