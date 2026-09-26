import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertIsSelfOrAdmin } from '../common/ownership.util';

@Controller()
export class NotificationController {
  constructor(
    private readonly notifService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertOwnsNotification(id: string, user: { id: string; role?: string }) {
    if (user.role === 'ADMIN') return;
    const notif = await this.prisma.notification.findUnique({ where: { id }, select: { userId: true } });
    if (!notif || notif.userId !== user.id) throw new ForbiddenException('Sem acesso a esta notificação.');
  }

  // ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────

  // GET /notifications?userId=xxx&limit=30
  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getAll(@Req() req: any, @Query('userId') userId: string, @Query('limit') limit?: string) {
    assertIsSelfOrAdmin(userId, req.user);
    return this.notifService.getNotifications(userId, limit ? parseInt(limit) : 30);
  }

  // PATCH /notifications/:id/read
  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsNotification(id, req.user);
    return this.notifService.markAsRead(id);
  }

  // PATCH /notifications/read-all
  @Patch('notifications/read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Req() req: any, @Body() body: { userId: string }) {
    assertIsSelfOrAdmin(body.userId, req.user);
    return this.notifService.markAllAsRead(body.userId);
  }

  // DELETE /notifications/:id
  @Delete('notifications/:id')
  @UseGuards(JwtAuthGuard)
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsNotification(id, req.user);
    return this.notifService.delete(id);
  }

  // POST /notifications/vaccine-check
  // Chamado pelo cron ou manualmente para gerar alertas de vacinas — SEM
  // guard de proposito: comentario confirma que e cron-only, sem chamador
  // no frontend, e nao manda token de usuario nenhum.
  @Post('notifications/vaccine-check')
  async vaccineCheck() {
    return this.notifService.generateVaccineReminders();
  }

  // POST /notifications/protocol-check
  // Chamado pelo cron (1x de manhã) — mesma razão do vaccine-check acima,
  // fica sem guard.
  @Post('notifications/protocol-check')
  async protocolCheck() {
    return this.notifService.generateProtocolReminders();
  }

  // ─── GAMIFICAÇÃO ──────────────────────────────────────────────────────────

  // GET /gamification/points/:userId
  @Get('gamification/points/:userId')
  @UseGuards(JwtAuthGuard)
  async getPoints(@Req() req: any, @Param('userId') userId: string) {
    assertIsSelfOrAdmin(userId, req.user);
    return this.notifService.getPoints(userId);
  }

  // POST /gamification/points
  // Chamado internamente por outros services (igent, health, community)
  @Post('gamification/points')
  @UseGuards(JwtAuthGuard)
  async addPoints(@Req() req: any, @Body() body: { userId: string; action: string; context?: any }) {
    assertIsSelfOrAdmin(body.userId, req.user);
    return this.notifService.addPoints(body.userId, body.action as any, body.context);
  }

  // ─── IA PREDITIVA ─────────────────────────────────────────────────────────

  // POST /notifications/predictive-alert
  @Post('notifications/predictive-alert')
  @UseGuards(JwtAuthGuard)
  async predictiveAlert(@Req() req: any, @Body() body: {
    userId: string;
    livePetId: string;
    livePetName: string;
    livePetBreed: string;
    riskCondition: string;
    deceasedPetNames: string[];
  }) {
    assertIsSelfOrAdmin(body.userId, req.user);
    return this.notifService.sendPredictiveAlert(body);
  }
  // GET /gamification/stats/:userId
  @Get('gamification/stats/:userId')
  @UseGuards(JwtAuthGuard)
  async getStats(@Req() req: any, @Param('userId') userId: string) {
    assertIsSelfOrAdmin(userId, req.user);
    return this.notifService.getStats(userId);
  }

}
