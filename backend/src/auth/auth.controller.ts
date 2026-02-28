/**
 * auth.controller.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Coloque em: src/auth/auth.controller.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Controller, Post, Get, Body, Query, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  register(@Body() dto: RegisterDto & { origin?: string }) {
    return this.authService.register(dto);
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /auth/verify-email?token=xxx  (link do email)
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // POST /auth/forgot-password  { email }
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  // POST /auth/reset-password  { token, password }
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }
}