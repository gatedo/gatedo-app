import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ProtocolSpecService } from './protocol-spec.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertOwnsEnrollment } from '../common/ownership.util';

// Tudo exige login; o usuário vem do token (nunca de ?userId=/body) e toda
// rota que recebe enrollmentId confere se a inscrição é de quem chamou.
// Antes era aberto: dava pra ver protocolo pago passando o id de quem
// comprou e mexer na inscrição de qualquer tutor.
@Controller('content/protocol-spec')
@UseGuards(JwtAuthGuard)
export class ProtocolSpecController {
  constructor(
    private readonly service: ProtocolSpecService,
    private readonly prisma: PrismaService,
  ) {}

  private own(req: any, enrollmentId: string) {
    return assertOwnsEnrollment(this.prisma, enrollmentId, req.user);
  }

  @Get(':slug')
  getState(@Req() req: any, @Param('slug') slug: string, @Query('petId') petId?: string) {
    return this.service.getProtocolAndState(slug, req.user.id, petId);
  }

  @Post(':slug/start')
  start(@Req() req: any, @Param('slug') slug: string, @Body() body: { petId: string }) {
    return this.service.start(slug, req.user.id, body.petId);
  }

  @Post(':slug/triage')
  async triage(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body() body: { enrollmentId: string; emergenciaMarcados?: string[]; veterinarioOpcaoId?: string },
  ) {
    await this.own(req, body.enrollmentId);
    return this.service.submitTriage(slug, body);
  }

  @Post(':slug/checklist')
  async checklist(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body() body: { enrollmentId: string; dayNumber: number; itemId: string; checked: boolean },
  ) {
    await this.own(req, body.enrollmentId);
    return this.service.toggleChecklist(slug, body);
  }

  @Post(':slug/registro')
  async registro(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body() body: { enrollmentId: string; dayNumber: number; data: Record<string, any> },
  ) {
    await this.own(req, body.enrollmentId);
    return this.service.submitRegistro(slug, body);
  }

  @Post(':slug/day-answer')
  async dayAnswer(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body() body: { enrollmentId: string; dayNumber: number; fieldId: string; value: any },
  ) {
    await this.own(req, body.enrollmentId);
    return this.service.submitDayAnswer(body);
  }

  @Post(':slug/registro-avulso')
  async registroAvulso(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body() body: { enrollmentId: string; onde: string; como: string },
  ) {
    await this.own(req, body.enrollmentId);
    return this.service.submitRegistroAvulso(slug, body);
  }

  @Post(':slug/presentation-seen')
  async presentationSeen(@Req() req: any, @Body() body: { enrollmentId: string }) {
    await this.own(req, body.enrollmentId);
    return this.service.markPresentationSeen(body.enrollmentId);
  }

  @Get(':slug/comparativo')
  async comparativo(@Req() req: any, @Query('enrollmentId') enrollmentId: string) {
    await this.own(req, enrollmentId);
    return this.service.getComparativoPreview(enrollmentId);
  }

  @Post(':slug/fixed-task/complete')
  async completeFixedTask(@Req() req: any, @Body() body: { enrollmentId: string }) {
    await this.own(req, body.enrollmentId);
    return this.service.completeFixedTask(body.enrollmentId);
  }

  @Post(':slug/complete-day')
  async completeDay(
    @Req() req: any,
    @Param('slug') slug: string,
    @Body() body: { enrollmentId: string; dayNumber: number },
  ) {
    await this.own(req, body.enrollmentId);
    return this.service.completeDay(slug, body);
  }

  @Post(':slug/interrupt')
  async interrupt(@Req() req: any, @Param('slug') slug: string, @Body() body: { enrollmentId: string }) {
    await this.own(req, body.enrollmentId);
    return this.service.interruptForEmergency(slug, body.enrollmentId);
  }

  @Post(':slug/reconsider')
  async reconsider(@Req() req: any, @Body() body: { enrollmentId: string }) {
    await this.own(req, body.enrollmentId);
    return this.service.reconsiderEmergency(body.enrollmentId);
  }

  @Post(':slug/advance')
  async advance(@Req() req: any, @Body() body: { enrollmentId: string }) {
    await this.own(req, body.enrollmentId);
    return this.service.advance(body.enrollmentId);
  }

  @Get(':slug/closing')
  async closing(@Req() req: any, @Param('slug') slug: string, @Query('enrollmentId') enrollmentId: string) {
    await this.own(req, enrollmentId);
    return this.service.getClosing(slug, enrollmentId);
  }
}
