import { Body, Controller, ForbiddenException, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AdminKnowledgeService } from './admin-knowledge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Leitura: qualquer tutor logado (o iGentVet do app carrega o almanaque).
// Escrita/reset: só admin. Antes não tinha guard nenhum — qualquer um na
// internet podia reescrever o texto que entra no prompt do iGentVet.
@Controller('admin/igent-almanac')
@UseGuards(JwtAuthGuard)
export class AdminKnowledgeController {
  constructor(private readonly service: AdminKnowledgeService) {}

  private assertAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN.');
  }

  @Get()
  list(@Query('scope') scope?: string) {
    return this.service.list(scope);
  }

  @Get('relevant')
  relevant(
    @Query('symptom') symptom?: string,
    @Query('breed') breed?: string,
    @Query('limit') limit?: string,
    @Query('scope') scope?: string,
    @Query('visualFindings') visualFindings?: string,
  ) {
    return this.service.relevant({ symptom, breed, limit: Number(limit) || 5, scope, visualFindings });
  }

  @Put()
  save(@Req() req: any, @Body() body: { sections?: any[]; actor?: string; scope?: string }) {
    this.assertAdmin(req);
    return this.service.saveAll(body.sections || [], body.actor, body.scope);
  }

  @Post('reset')
  reset(@Req() req: any, @Body() body: { actor?: string; scope?: string }) {
    this.assertAdmin(req);
    return this.service.reset(body?.actor, body?.scope);
  }
}
