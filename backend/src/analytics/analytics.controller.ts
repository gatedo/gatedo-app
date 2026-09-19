import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  private ensureAdmin(user: any) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  @Get('signups')
  signups(@Req() req: any, @Query('days') days?: string) {
    this.ensureAdmin(req.user);
    return this.analytics.signupsByDayAndSource(days ? Number(days) : undefined);
  }

  @Get('activation')
  activation(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.analytics.activation();
  }

  @Get('retention')
  retention(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.analytics.retention();
  }

  @Get('records')
  records(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.analytics.recordsByUserAndType();
  }

  @Get('igent-usage')
  igentUsage(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.analytics.igentUsageByUser();
  }

  @Get('protocol-conversion')
  protocolConversion(@Req() req: any) {
    this.ensureAdmin(req.user);
    return this.analytics.protocolConversion();
  }
}
