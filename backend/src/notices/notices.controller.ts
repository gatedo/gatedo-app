import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NoticesService } from '../notices/notices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('active')
  async getActive(@Req() req: any) {
    return this.noticesService.getActiveNotices(req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/read')
  async confirmRead(@Param('id') id: string, @Req() req: any) {
    return this.noticesService.confirmRead(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  async getAdminNotices(@Req() req: any) {
    return this.noticesService.getAdminNotices(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createNotice(@Body() body: any, @Req() req: any) {
    return this.noticesService.createNotice(req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateNotice(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.noticesService.updateNotice(req.user, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteNotice(@Param('id') id: string, @Req() req: any) {
    return this.noticesService.deleteNotice(req.user, id);
  }
}