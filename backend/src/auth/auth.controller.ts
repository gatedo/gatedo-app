import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  // Valida token de convite Fundador — chamado pelo Register.jsx antes do form
  @Get('validate-token')
  async validateToken(@Query('token') token: string) {
    return this.authService.validateFounderToken(token);
  }

  // Cria convite Fundador — usado pelo webhook Kiwify ou admin
  @Post('founder-invite')
  async createFounderInvite(@Body() body: { email: string; name?: string; phase?: number }) {
    return this.authService.createFounderInvite(body);
  }

  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}