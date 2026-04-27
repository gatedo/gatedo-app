import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CloudflareService } from '../cloudflare/cloudflare.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Express } from 'express';
import 'multer';
import { calcTutorLevelMeta } from '../gamification/gamification.constants';
import {
  getMembershipRulesForUser,
  getPlanFromUser,
  getRenewalDiscountPercent,
  normalizeBadges,
} from '../membership/membership.constants';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudflare: CloudflareService,
    private readonly prisma: PrismaService,
  ) {}

  private parseOptionalDate(value: any): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '' || value === 'null') return null;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private parseBadges(value: any): string[] | undefined {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) return value.filter(Boolean).map((badge) => String(badge));

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean).map((badge) => String(badge));
        }
      } catch {
        return value
          .split(',')
          .map((badge) => badge.trim())
          .filter(Boolean);
      }
    }

    return [];
  }

  @Get('stats')
  async getStats() {
    return this.usersService.getDashboardStats();
  }

  @Post()
  create(@Body() createUserDto: Prisma.UserCreateInput) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Endpoint usado pelo Store.jsx para buscar pontos
 @Get(':id/points')
async getPoints(@Param('id') id: string) {
  const wallet = await this.prisma.userCredits.findUnique({
    where: { userId: id },
  });

  return {
    points: wallet?.balance ?? 0,
    totalBought: wallet?.totalBought ?? 0,
    totalUsed: wallet?.totalUsed ?? 0,
  };
}

  @Get(':id/profile')
  async getProfile(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        photoUrl: true,
        email: true,
        plan: true,
        planExpires: true,
        badges: true,
        gatedoPoints: true,
        xpt: true,
        level: true,
        createdAt: true,
        tutorPoints: {
          select: {
            points: true,
            totalEarned: true,
          },
        },
        credits: {
          select: {
            balance: true,
            totalBought: true,
            totalUsed: true,
          },
        },
        subscription: {
          select: {
            id: true,
            provider: true,
            planType: true,
            status: true,
            startedAt: true,
            expiresAt: true,
            autoRenew: true,
            updatedAt: true,
          },
        },
        pets: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
            isMemorial: true,
            isArchived: true,
            ageYears: true,
            ageMonths: true,
            level: true,
            xpg: true,
            badges: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { pets: true },
        },
      },
    });

    if (!user) return null;

    const normalizedPlan = getPlanFromUser(user);
    const normalizedBadges = normalizeBadges(user.badges);
    const membership = getMembershipRulesForUser({
      ...user,
      plan: normalizedPlan,
      badges: normalizedBadges,
    });

    const activePets = user.pets.filter((pet) => !pet.isMemorial && !pet.isArchived);
    const memorialPets = user.pets.filter((pet) => pet.isMemorial);

    return {
      ...user,
      plan: normalizedPlan,
      badges: normalizedBadges,
      activePetsCount: activePets.length,
      memorialPetsCount: memorialPets.length,
      membership: {
        ...membership,
        renewalDiscountPercent: getRenewalDiscountPercent({
          ...user,
          plan: normalizedPlan,
          badges: normalizedBadges,
        }),
      },
    };
  }

  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const dataToUpdate: any = {};
    const subscriptionUpdate: any = {};
    let shouldUpdateSubscription = false;

    if (body.name  !== undefined) dataToUpdate.name  = body.name  || null;
    if (body.city  !== undefined) dataToUpdate.city  = body.city  || null;
    if (body.phone !== undefined) dataToUpdate.phone = body.phone || null;
    if (body.email !== undefined && String(body.email).trim()) dataToUpdate.email = String(body.email).trim().toLowerCase();
    if (body.status !== undefined && String(body.status).trim()) dataToUpdate.status = String(body.status).trim();
    if (body.plan !== undefined && String(body.plan).trim()) dataToUpdate.plan = String(body.plan).trim();
    if (body.role !== undefined && String(body.role).trim()) dataToUpdate.role = String(body.role).trim();

    const parsedBadges = this.parseBadges(body.badges);
    if (parsedBadges !== undefined) {
      dataToUpdate.badges = parsedBadges;
    }

    const parsedXpt = body.xpt ?? body.xp;
    if (parsedXpt !== undefined) {
      const safeXpt = Math.max(0, Number(parsedXpt || 0));
      dataToUpdate.xpt = safeXpt;
      dataToUpdate.level = calcTutorLevelMeta(safeXpt).rank;
    }

    const parsedGpts = body.gpts ?? body.gatedoPoints;
    if (parsedGpts !== undefined) {
      dataToUpdate.gatedoPoints = Math.max(0, Number(parsedGpts || 0));
    }

    const parsedPlanExpires = this.parseOptionalDate(body.planExpires ?? body.subscriptionExpiresAt);
    if (parsedPlanExpires !== undefined) {
      dataToUpdate.planExpires = parsedPlanExpires;
      subscriptionUpdate.expiresAt = parsedPlanExpires;
      shouldUpdateSubscription = true;
    }

    if (body.subscriptionStatus !== undefined && String(body.subscriptionStatus).trim()) {
      subscriptionUpdate.status = String(body.subscriptionStatus).trim();
      shouldUpdateSubscription = true;
    }

    if (body.subscriptionPlanType !== undefined && String(body.subscriptionPlanType).trim()) {
      subscriptionUpdate.planType = String(body.subscriptionPlanType).trim();
      shouldUpdateSubscription = true;
    } else if (body.plan !== undefined && String(body.plan).trim()) {
      subscriptionUpdate.planType = String(body.plan).trim();
      shouldUpdateSubscription = true;
    }

    if (body.subscriptionProvider !== undefined && String(body.subscriptionProvider).trim()) {
      subscriptionUpdate.provider = String(body.subscriptionProvider).trim();
      shouldUpdateSubscription = true;
    }

    if (body.subscriptionAutoRenew !== undefined) {
      const rawAutoRenew = body.subscriptionAutoRenew;
      subscriptionUpdate.autoRenew =
        rawAutoRenew === true ||
        rawAutoRenew === 'true' ||
        rawAutoRenew === 1 ||
        rawAutoRenew === '1';
      shouldUpdateSubscription = true;
    }

    if (files?.file?.[0]) {
      dataToUpdate.photoUrl = await this.cloudflare.uploadImage(files.file[0]);
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });
    } else if (!shouldUpdateSubscription) {
      throw new BadRequestException('Nenhum dado enviado para atualizar.');
    }

    if (shouldUpdateSubscription) {
      await this.prisma.subscription.upsert({
        where: { userId: id },
        update: subscriptionUpdate,
        create: {
          userId: id,
          provider: subscriptionUpdate.provider || 'MANUAL',
          planType: subscriptionUpdate.planType || dataToUpdate.plan || 'FREE',
          status: subscriptionUpdate.status || 'ACTIVE',
          expiresAt: subscriptionUpdate.expiresAt ?? null,
          autoRenew: Boolean(subscriptionUpdate.autoRenew),
        },
      });
    }

    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        city: true,
        photoUrl: true,
        email: true,
        phone: true,
        plan: true,
        planExpires: true,
        badges: true,
        status: true,
        xpt: true,
        gatedoPoints: true,
        level: true,
        subscription: {
          select: {
            id: true,
            provider: true,
            planType: true,
            status: true,
            startedAt: true,
            expiresAt: true,
            autoRenew: true,
            updatedAt: true,
          },
        },
        tutorPoints: {
          select: {
            points: true,
            totalEarned: true,
          },
        },
        credits: {
          select: {
            balance: true,
            totalBought: true,
            totalUsed: true,
          },
        },
      },
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
