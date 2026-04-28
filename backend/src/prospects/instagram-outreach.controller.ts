import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { InstagramOutreachService } from './instagram-outreach.service';

@Controller('prospects/instagram')
export class InstagramOutreachController {
  constructor(private readonly instagram: InstagramOutreachService) {}

  @Get('config')
  getConfig() {
    return this.instagram.getConfig();
  }

  @Get('health')
  getHealth() {
    return this.instagram.getHealth();
  }

  @Get('summary')
  getSummary() {
    return this.instagram.getSummary();
  }

  @Get('leads')
  listLeads(@Query() query: any) {
    return this.instagram.listLeads(query);
  }

  @Post('leads')
  upsertLead(@Body() body: any) {
    return this.instagram.upsertLead(body);
  }

  @Patch('leads/:id')
  updateLead(@Param('id') id: string, @Body() body: any) {
    return this.instagram.updateLead(id, body);
  }

  @Post('interactions')
  addInteraction(@Body() body: any) {
    return this.instagram.addInteraction(body);
  }

  @Get('templates')
  listTemplates() {
    return this.instagram.listTemplates();
  }

  @Post('templates')
  saveTemplate(@Body() body: any) {
    return this.instagram.saveTemplate(body);
  }

  @Post('preview')
  previewMessage(@Body() body: any) {
    return this.instagram.previewMessage(String(body.leadId), String(body.templateId));
  }

  @Post('send')
  sendMessage(@Body() body: any) {
    return this.instagram.sendMessage(body);
  }
}
