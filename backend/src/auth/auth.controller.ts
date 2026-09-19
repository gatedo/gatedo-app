import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly entitlements: EntitlementsService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    const result = await this.authService.register(body);
    if (result?.user?.id && result?.user?.email) {
      this.entitlements.promotePending(result.user.id, result.user.email).catch(() => {});
    }
    return result;
  }

  @Post('login')
  async login(@Body() body: any) {
    const result = await this.authService.login(body);
    if (result?.user?.id && result?.user?.email) {
      this.entitlements.promotePending(result.user.id, result.user.email).catch(() => {});
    }
    return result;
  }

  @Get('resolve-invite')
  async resolveInvite(@Query('token') token: string) {
    return this.authService.resolveInviteToken(token);
  }

  @Get('validate-token')
  async validateToken(@Query('token') token: string) {
    return this.authService.validateInviteToken(token);
  }

  @Post('founder-invite')
  async createFounderInvite(
    @Body() body: { email: string; name?: string; phase?: number },
  ) {
    return this.authService.createFounderInvite({
      email: body.email,
      name: body.name,
      phase: body.phase,
      source: 'ADMIN',
      expiresInDays: 365,
    });
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
  async resetPassword(
    @Body() body: { token: string; newPassword: string },
  ) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}