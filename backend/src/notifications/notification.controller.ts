import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  // ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────

  // GET /notifications?userId=xxx&limit=30
  @Get('notifications')
  async getAll(@Query('userId') userId: string, @Query('limit') limit?: string) {
    return this.notifService.getNotifications(userId, limit ? parseInt(limit) : 30);
  }

  // PATCH /notifications/:id/read
  @Patch('notifications/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notifService.markAsRead(id);
  }

  // PATCH /notifications/read-all
  @Patch('notifications/read-all')
  async markAllAsRead(@Body() body: { userId: string }) {
    return this.notifService.markAllAsRead(body.userId);
  }

  // DELETE /notifications/:id
  @Delete('notifications/:id')
  async delete(@Param('id') id: string) {
    return this.notifService.delete(id);
  }

  // POST /notifications/vaccine-check
  // Chamado pelo cron ou manualmente para gerar alertas de vacinas
  @Post('notifications/vaccine-check')
  async vaccineCheck() {
    return this.notifService.generateVaccineReminders();
  }

  // ─── GAMIFICAÇÃO ──────────────────────────────────────────────────────────

  // GET /gamification/points/:userId
  @Get('gamification/points/:userId')
  async getPoints(@Param('userId') userId: string) {
    return this.notifService.getPoints(userId);
  }

  // POST /gamification/points
  // Chamado internamente por outros services (igent, health, community)
  @Post('gamification/points')
  async addPoints(@Body() body: { userId: string; action: string; context?: any }) {
    return this.notifService.addPoints(body.userId, body.action as any, body.context);
  }

  // ─── IA PREDITIVA ─────────────────────────────────────────────────────────

  // POST /notifications/predictive-alert
  @Post('notifications/predictive-alert')
  async predictiveAlert(@Body() body: {
    userId: string;
    livePetId: string;
    livePetName: string;
    livePetBreed: string;
    riskCondition: string;
    deceasedPetNames: string[];
  }) {
    return this.notifService.sendPredictiveAlert(body);
  }
  // GET /gamification/stats/:userId
  @Get('gamification/stats/:userId')
  async getStats(@Param('userId') userId: string) {
    return this.notifService.getStats(userId);
  }

}