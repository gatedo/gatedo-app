import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminIntelligenceService } from './admin-intelligence.service';

@Controller('admin/intelligence')
@UseGuards(JwtAuthGuard)
export class AdminIntelligenceController {
  constructor(private readonly service: AdminIntelligenceService) {}

  @Get('ventures')
  listVentures(@Req() req: any) {
    return this.service.listVentures(req.user);
  }

  @Post('ventures/bulk')
  upsertVentures(@Req() req: any, @Body() body: any) {
    return this.service.upsertVentures(req.user, Array.isArray(body) ? body : body?.items);
  }

  @Patch('ventures/:id')
  updateVenture(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.updateVenture(req.user, id, body);
  }

  @Get('campaigns')
  listCampaigns(@Req() req: any) {
    return this.service.listCampaigns(req.user);
  }

  @Get('ops/metrics')
  getOpsMetrics(@Req() req: any) {
    return this.service.getOpsMetrics(req.user);
  }

  @Post('campaigns/bulk')
  upsertCampaigns(@Req() req: any, @Body() body: any) {
    return this.service.upsertCampaigns(req.user, Array.isArray(body) ? body : body?.items);
  }

  @Patch('campaigns/:id')
  updateCampaign(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.updateCampaign(req.user, id, body);
  }
}
