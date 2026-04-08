import {
  Controller, Get, Post, Delete,
  Body, Param, Headers,
  BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('my')
  async myCoupons(@Headers('x-user-id') userId: string) {
    if (!userId) return [];
    const now = new Date();
    return this.prisma.coupon.findMany({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        NOT: { redemptions: { some: { userId } } },
        AND: [{ OR: [{ targetUserId: null }, { targetUserId: userId }] }],
      },
    });
  }

  @Post()
  async create(@Body() dto: any) {
    const code = dto.code?.trim().toUpperCase();
    if (!code) throw new BadRequestException('Código é obrigatório.');
    const exists = await this.prisma.coupon.findUnique({ where: { code } });
    if (exists) throw new BadRequestException('Código já existe.');
    return this.prisma.coupon.create({
      data: {
        code,
        description:  dto.description  || '',
        discountType: dto.discountType  || 'POINTS',
        value:        Number(dto.value) || 10,
        maxUses:      Number(dto.maxUses) || 1,
        expiresAt:    dto.expiresAt ? new Date(dto.expiresAt) : null,
        targetUserId: dto.targetUserId  || null,
      },
    });
  }

  @Post('redeem')
  async redeem(@Body() dto: any, @Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('Usuário não identificado.');
    const code = dto.code?.trim().toUpperCase();
    if (!code) throw new BadRequestException('Informe o código do cupom.');

    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: { redemptions: { where: { userId } } },
    });

    if (!coupon)                                       throw new NotFoundException('Cupom não encontrado.');
    if (!coupon.active)                                throw new BadRequestException('Cupom inativo.');
    if (coupon.usedCount >= coupon.maxUses)            throw new BadRequestException('Cupom esgotado.');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Cupom expirado.');
    if (coupon.targetUserId && coupon.targetUserId !== userId) throw new BadRequestException('Este cupom não pertence a você.');
    if (coupon.redemptions.length > 0)                throw new BadRequestException('Você já resgatou este cupom.');

    let pointsEarned = 0;
    await this.prisma.$transaction(async (tx) => {
      await tx.couponRedemption.create({ data: { couponId: coupon.id, userId } });
      await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      if (coupon.discountType === 'POINTS') {
        pointsEarned = coupon.value;
        await tx.tutorPoints.upsert({
          where:  { userId },
          create: { userId, points: pointsEarned, totalEarned: pointsEarned },
          update: { points: { increment: pointsEarned }, totalEarned: { increment: pointsEarned } },
        });
      }
    });

    return { message: 'Cupom resgatado com sucesso!', pointsEarned };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.coupon.update({ where: { id }, data: { active: false } });
  }
}