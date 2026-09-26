import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post()
  async create(@Req() req: any, @Body() body: { category?: string; source: string; text: string }) {
    return this.feedback.create(req.user, body);
  }

  @Get('admin')
  async listForAdmin(@Req() req: any, @Query('status') status?: string) {
    return this.feedback.listForAdmin(req.user, status);
  }

  @Patch('admin/:id')
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status?: string; adminReply?: string }) {
    return this.feedback.updateStatus(req.user, id, body);
  }
}
