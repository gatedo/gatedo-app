import { Body, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // Público — o bloco de apoio e o card do WhatsApp precisam ler sem login.
  @Get('settings/public')
  getPublic() {
    return this.settings.getPublic();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/settings')
  adminSet(@Body() body: { key: string; value: string }, @Req() req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Acesso restrito ao administrador.');
    return this.settings.adminSet(body.key, body.value);
  }
}
