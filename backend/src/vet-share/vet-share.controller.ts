import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { assertOwnsPet } from '../common/ownership.util';
import { VetShareService } from './vet-share.service';

@Controller('vet-share')
export class VetShareController {
  constructor(
    private readonly vetShare: VetShareService,
    private readonly prisma: PrismaService,
  ) {}

  // Público: é o que o veterinário abre pelo link/QR. O token é a credencial.
  @Get('public/:token')
  getPublic(@Param('token') token: string) {
    return this.vetShare.getPublic(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pet/:petId')
  async status(@Req() req: any, @Param('petId') petId: string) {
    await assertOwnsPet(this.prisma, petId, req.user);
    return this.vetShare.getStatus(petId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pet/:petId')
  async create(@Req() req: any, @Param('petId') petId: string, @Body() body: { days?: number }) {
    await assertOwnsPet(this.prisma, petId, req.user);
    return this.vetShare.create(petId, req.user.id, body?.days);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  revoke(@Req() req: any, @Param('id') id: string) {
    return this.vetShare.revoke(id, req.user);
  }
}
