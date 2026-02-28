import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CloudflareService } from '../cloudflare.service';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { Express } from 'express';
import 'multer';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudflare: CloudflareService,
    private readonly prisma: PrismaService,
  ) {}

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

  // Retorna o perfil do usuário com contagem de pets
  @Get(':id/profile')
  async getProfile(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        city: true,
        photoUrl: true,
        email: true,
        plan: true,
        level: true,
        xp: true,
        badges: true,
        createdAt: true,
        _count: {
          select: { pets: true },
        },
      },
    });
    return user;
  }

  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const dataToUpdate: any = {};

    // Campos permitidos para atualização
    if (body.name  !== undefined) dataToUpdate.name  = body.name  || null;
    if (body.city  !== undefined) dataToUpdate.city  = body.city  || null;
    if (body.phone !== undefined) dataToUpdate.phone = body.phone || null;

    // Upload da foto de perfil
    if (files?.file?.[0]) {
      dataToUpdate.photoUrl = await this.cloudflare.uploadImage(files.file[0]);
    }

    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        city: true,
        photoUrl: true,
        email: true,
        plan: true,
        level: true,
        xp: true,
        badges: true,
      },
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
