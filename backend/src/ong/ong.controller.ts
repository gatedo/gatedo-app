import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OngService } from './ong.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class OngController {
  constructor(private readonly ong: OngService) {}

  private ensureAdmin(user: any) {
    if (user?.role !== 'ADMIN') throw new ForbiddenException('Acesso restrito ao administrador.');
  }

  private ensureOng(user: any) {
    if (user?.role !== 'ONG' && user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito a ONGs parceiras.');
    }
  }

  // ── Solicitação / consulta da própria conta ONG ────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('ong/apply')
  apply(@Req() req: any, @Body() body: any) {
    return this.ong.apply(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('ong/me')
  getMine(@Req() req: any) {
    return this.ong.getMine(req.user.id);
  }

  // ── Admin — aprovação de contas ONG ─────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('admin/ong/applications')
  adminList(@Req() req: any, @Query('status') status?: string) {
    this.ensureAdmin(req.user);
    return this.ong.adminList(status);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/ong/:id/approve')
  adminApprove(@Param('id') id: string, @Req() req: any) {
    this.ensureAdmin(req.user);
    return this.ong.adminApprove(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/ong/:id/reject')
  adminReject(@Param('id') id: string, @Body() body: { reason?: string }, @Req() req: any) {
    this.ensureAdmin(req.user);
    return this.ong.adminReject(id, req.user.id, body?.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/ong/transfer-stats')
  adminTransferStats(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.ong.adminTransferStats();
  }

  // ── Sugestões das ONGs ───────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('ong/suggestions')
  createSuggestion(@Body() body: { message: string }, @Req() req: any) {
    this.ensureOng(req.user);
    return this.ong.createSuggestion(req.user.id, body?.message);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/ong/suggestions')
  adminListSuggestions(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.ong.adminListSuggestions();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/ong/suggestions/:id/seen')
  adminMarkSuggestionSeen(@Param('id') id: string, @Req() req: any) {
    this.ensureAdmin(req.user);
    return this.ong.adminMarkSuggestionSeen(id);
  }

  // ── Painel multi-gato (ONG aprovada) ────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('ong/pets')
  listPets(@Req() req: any) {
    this.ensureOng(req.user);
    return this.ong.listPets(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('ong/pets/:id/adoption-status')
  setAdoptionStatus(@Param('id') id: string, @Body() body: { status: string }, @Req() req: any) {
    this.ensureOng(req.user);
    return this.ong.setAdoptionStatus(req.user.id, id, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ong/pets/bulk')
  bulkCreatePets(@Body() body: { pets: any[] }, @Req() req: any) {
    this.ensureOng(req.user);
    return this.ong.bulkCreatePets(req.user.id, body.pets);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ong/health-records/bulk')
  bulkHealthRecords(@Body() body: any, @Req() req: any) {
    this.ensureOng(req.user);
    return this.ong.bulkHealthRecords(req.user.id, body);
  }

  // ── Transferência de tutoria ─────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('ong/pets/:id/transfer-invites')
  createInvite(@Param('id') id: string, @Req() req: any) {
    this.ensureOng(req.user);
    return this.ong.createInvite(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('ong/transfer-invites')
  listInvites(@Req() req: any) {
    this.ensureOng(req.user);
    return this.ong.listInvites(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ong/transfer-invites/:id/cancel')
  cancelInvite(@Param('id') id: string, @Req() req: any) {
    this.ensureOng(req.user);
    return this.ong.cancelInvite(req.user.id, id);
  }

  // Público — o convidado precisa ver do que se trata antes de logar/cadastrar.
  @Get('transfer-invites/:token')
  previewInvite(@Param('token') token: string) {
    return this.ong.previewInvite(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('transfer-invites/:token/accept')
  acceptInvite(@Param('token') token: string, @Req() req: any) {
    return this.ong.acceptInvite(token, req.user.id);
  }
}
