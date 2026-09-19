import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProtocolSpecService } from './protocol-spec.service';

@Controller('content/protocol-spec')
export class ProtocolSpecController {
  constructor(private readonly service: ProtocolSpecService) {}

  @Get(':slug')
  getState(@Param('slug') slug: string, @Query('userId') userId?: string, @Query('petId') petId?: string) {
    return this.service.getProtocolAndState(slug, userId, petId);
  }

  @Post(':slug/start')
  start(@Param('slug') slug: string, @Body() body: { userId: string; petId: string }) {
    return this.service.start(slug, body.userId, body.petId);
  }

  @Post(':slug/triage')
  triage(
    @Param('slug') slug: string,
    @Body() body: { enrollmentId: string; emergenciaMarcados?: string[]; veterinarioOpcaoId?: string },
  ) {
    return this.service.submitTriage(slug, body);
  }

  @Post(':slug/checklist')
  checklist(
    @Param('slug') slug: string,
    @Body() body: { enrollmentId: string; dayNumber: number; itemId: string; checked: boolean },
  ) {
    return this.service.toggleChecklist(slug, body);
  }

  @Post(':slug/registro')
  registro(@Param('slug') slug: string, @Body() body: { enrollmentId: string; dayNumber: number; data: Record<string, any> }) {
    return this.service.submitRegistro(slug, body);
  }

  @Post(':slug/fixed-task/complete')
  completeFixedTask(@Body() body: { enrollmentId: string }) {
    return this.service.completeFixedTask(body.enrollmentId);
  }

  @Post(':slug/complete-day')
  completeDay(@Param('slug') slug: string, @Body() body: { enrollmentId: string; dayNumber: number }) {
    return this.service.completeDay(slug, body);
  }

  @Post(':slug/interrupt')
  interrupt(@Param('slug') slug: string, @Body() body: { enrollmentId: string }) {
    return this.service.interruptForEmergency(slug, body.enrollmentId);
  }

  @Post(':slug/advance')
  advance(@Body() body: { enrollmentId: string }) {
    return this.service.advance(body.enrollmentId);
  }

  @Get(':slug/closing')
  closing(@Param('slug') slug: string, @Query('enrollmentId') enrollmentId: string) {
    return this.service.getClosing(slug, enrollmentId);
  }
}
