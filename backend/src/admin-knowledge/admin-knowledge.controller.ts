import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { AdminKnowledgeService } from './admin-knowledge.service';

@Controller('admin/igent-almanac')
export class AdminKnowledgeController {
  constructor(private readonly service: AdminKnowledgeService) {}

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
  save(@Body() body: { sections?: any[]; actor?: string; scope?: string }) {
    return this.service.saveAll(body.sections || [], body.actor, body.scope);
  }

  @Post('reset')
  reset(@Body() body: { actor?: string; scope?: string }) {
    return this.service.reset(body?.actor, body?.scope);
  }
}
