import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  // ── Guia ──────────────────────────────────────────────────────────────
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
  @Get('protocols')
  listProtocols(@Query('userId') userId?: string) {
    return this.content.listProtocols(userId);
  }

  @Get('protocols/enrollments/mine')
  listMyEnrollments(@Query('userId') userId: string, @Query('petId') petId?: string) {
    return this.content.listMyEnrollments(userId, petId);
  }

  @Get('protocols/enrollments/:id')
  getEnrollment(@Param('id') id: string) {
    return this.content.getEnrollment(id);
  }

  @Post('protocols/enrollments/:id/complete-day')
  completeDay(
    @Param('id') id: string,
    @Body() body: { note?: string; severityScore?: number; resolved?: boolean },
  ) {
    return this.content.completeDay(id, body);
  }

  @Post('protocols/enrollments/:id/advance')
  advanceDay(@Param('id') id: string) {
    return this.content.advanceDay(id);
  }

  @Get('protocols/:slug')
  getProtocol(@Param('slug') slug: string, @Query('userId') userId?: string) {
    return this.content.getProtocol(slug, userId);
  }

  @Post('protocols/:slug/enroll')
  enroll(@Param('slug') slug: string, @Body() body: { userId: string; petId: string }) {
    return this.content.enroll(slug, body.userId, body.petId);
  }
}
