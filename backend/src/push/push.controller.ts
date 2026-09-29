import { Body, Controller, Delete, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('vapid-public-key')
  getPublicKey() {
    return { publicKey: this.push.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Req() req: any, @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    await this.push.subscribe(req.user.id, body);
    return { ok: true };
  }

  @Delete('subscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@Body() body: { endpoint: string }) {
    if (body?.endpoint) await this.push.unsubscribe(body.endpoint);
    return { ok: true };
  }

  // Botão "Enviar notificação de teste pra mim" no painel admin — manda só
  // pro próprio admin logado, sem afetar os inscritos de verdade.
  @Post('test')
  @UseGuards(JwtAuthGuard)
  async sendTest(@Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Acesso restrito ao administrador.');
    const result = await this.push.sendToUser(req.user.id, {
      title: 'Teste de notificação 🐱',
      body: 'Se você recebeu isso, o push do Gatedo está funcionando certinho.',
      url: '/settings',
    });
    return result;
  }
}
