import { Controller, Post, Get, Body, Query, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { IgentCreditsService } from '../igent/igent-credits.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly entitlements: EntitlementsService,
    private readonly igentCredits: IgentCreditsService,
  ) {}

  // Compra feita por e-mail sem conta (Kiwify) só vira acesso quando o dono
  // PROVA que o e-mail é dele (emailVerified). Antes bastava se cadastrar —
  // ou trocar o e-mail do perfil — com o e-mail de quem comprou.
  private promotePurchases(user: { id?: string; email?: string; emailVerified?: boolean } | undefined) {
    if (!user?.id || !user?.email || !user.emailVerified) return;
    this.entitlements.promotePending(user.id, user.email).catch(() => {});
    this.igentCredits.promotePendingAiCreditPacks(user.id, user.email).catch(() => {});
  }

  @Post('register')
  async register(@Body() body: any) {
    const result = await this.authService.register(body);
    this.promotePurchases(result?.user);
    return result;
  }

  @Post('login')
  async login(@Body() body: any) {
    const result = await this.authService.login(body);
    this.promotePurchases(result?.user);
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

  // Só admin — antes era aberto: qualquer um gerava convite de Fundador.
  @Post('founder-invite')
  @UseGuards(JwtAuthGuard)
  async createFounderInvite(
    @Req() req: any,
    @Body() body: { email: string; name?: string; phase?: number },
  ) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN.');
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
    const owner = await this.authService.findUserByVerifyToken(token);
    const result = await this.authService.verifyEmail(token);
    // E-mail acabou de ser provado — agora sim aplica compras pendentes dele.
    if (owner) this.promotePurchases({ ...owner, emailVerified: true });
    return result;
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