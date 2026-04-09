import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/invite')
@UseGuards(JwtAuthGuard)
export class AdminInviteController {
  constructor(private readonly authService: AuthService) {}

  @Post('generate')
  async generate(
    @Req() req: any,
    @Body()
    body: {
      type: 'vip' | 'founder';
      email?: string;
      name?: string;
      phase?: number;
      expiresInDays?: number;
    },
  ) {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }

    const created = await this.authService.createAdminInvite({
      type: body.type || 'vip',
      email: body.email,
      name: body.name,
      phase: body.phase,
      expiresInDays: body.expiresInDays,
      createdById: req.user?.id,
    });

    return created;
  }
}