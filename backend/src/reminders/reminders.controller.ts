import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get('upcoming')
  @UseGuards(JwtAuthGuard)
  async upcoming(@Req() req: any) {
    return this.reminders.upcomingForOwner(req.user.id);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  async complete(@Req() req: any, @Param('id') id: string) {
    await this.reminders.complete(id, req.user.id);
    return { ok: true };
  }

  @Patch(':id/postpone')
  @UseGuards(JwtAuthGuard)
  async postpone(@Req() req: any, @Param('id') id: string, @Body() body: { days: number }) {
    const days = Number(body?.days) === 7 ? 7 : 3;
    const updated = await this.reminders.postpone(id, req.user.id, days);
    return { ok: !!updated, reminder: updated };
  }

  // ── Chamado pelo cron externo (mesmo padrão de vaccine-check/protocol-check) ──
  @Post('run-daily-push')
  async runDailyPush() {
    return this.reminders.runDailyPush();
  }

  @Post('run-weekly-email')
  async runWeeklyEmail() {
    return this.reminders.runWeeklyEmail();
  }
}
