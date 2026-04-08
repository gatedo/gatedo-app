import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Controller('posts')
export class PostsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async createPost(@Body() body, @Req() req: any) {
    const { content, imageUrl, petId, type, source, visibility } = body;
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('Usuário não autenticado');
    }

    if (!petId) {
      throw new BadRequestException('petId obrigatório');
    }

    if (!content && !imageUrl) {
      throw new BadRequestException('Informe content ou imageUrl');
    }

    return this.prisma.post.create({
     data: {
  userId,
  petId,
  type: type || 'PHOTO',
  source: source || 'manual',
  visibility: visibility || 'PUBLIC',
  content: content || '',
  imageUrl: imageUrl || null,
  allowComments: true,
  allowShare: true,
},
      include: {
        user: true,
        pet: true,
      },
    });
  }

  @Get('pet/:petId')
  async getPostsByPet(@Param('petId') petId: string) {
    return this.prisma.post.findMany({
      where: { petId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        pet: true,
        comments: true,
      },
    });
  }

  @Get()
  async getAllPosts() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        pet: true,
        comments: true,
      },
      take: 50,
    });
  }
}