import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { assertOwnsPet } from '../common/ownership.util';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertOwnsDocument(id: string, user: { id: string; role?: string }) {
    if (user.role === 'ADMIN') return;
    const doc = await this.documentsService.findOne(id);
    if (!doc || doc.ownerId !== user.id) throw new ForbiddenException('Sem acesso a este documento.');
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e5);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }
    if (!body?.petId) {
      throw new BadRequestException('petId é obrigatório.');
    }
    if (!body?.title) {
      throw new BadRequestException('title é obrigatório.');
    }
    if (!body?.category) {
      throw new BadRequestException('category é obrigatório.');
    }

    await assertOwnsPet(this.prisma, body.petId, req.user);
    const fileUrl = `/uploads/documents/${file.filename}`;
    const ownerId = req.user.id;

    let metadata: any = null;
    if (body?.metadata) {
      try {
        metadata = typeof body.metadata === 'string' ? JSON.parse(body.metadata) : body.metadata;
      } catch {
        metadata = null;
      }
    }

    return this.documentsService.create({
      title: body.title,
      category: body.category,
      filename: file.filename,
      fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      petId: body.petId,
      ownerId,
      metadata,
      isPrivate: String(body?.isPrivate ?? 'true') === 'true',
      isVetShared: String(body?.isVetShared ?? 'false') === 'true',
      isFavorite: String(body?.isFavorite ?? 'false') === 'true',
    });
  }


  @Post('ingest-base64')
  async ingestBase64(@Body() body: any, @Req() req: any) {
    if (!body?.petId) {
      throw new BadRequestException('petId é obrigatório.');
    }
    if (!body?.title) {
      throw new BadRequestException('title é obrigatório.');
    }
    if (!body?.category) {
      throw new BadRequestException('category é obrigatório.');
    }
    if (!body?.base64) {
      throw new BadRequestException('base64 é obrigatório.');
    }

    await assertOwnsPet(this.prisma, body.petId, req.user);
    const ownerId = req.user.id;

    let metadata: any = null;
    if (body?.metadata) {
      try {
        metadata = typeof body.metadata === 'string' ? JSON.parse(body.metadata) : body.metadata;
      } catch {
        metadata = null;
      }
    }

    return this.documentsService.createGeneratedFromBase64({
      title: body.title,
      category: body.category,
      petId: body.petId,
      ownerId,
      filename: body.filename,
      mimeType: body.mimeType,
      base64: body.base64,
      metadata,
      isPrivate: String(body?.isPrivate ?? 'true') === 'true',
      isVetShared: String(body?.isVetShared ?? 'false') === 'true',
      isFavorite: String(body?.isFavorite ?? 'false') === 'true',
    });
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('petId') petId?: string,
    @Query('category') category?: string,
  ) {
    if (petId) {
      await assertOwnsPet(this.prisma, petId, req.user);
    } else if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('petId é obrigatório.');
    }
    return this.documentsService.findAll({ petId, category });
  }

  @Get('pet/:petId')
  async findAllByPet(@Req() req: any, @Param('petId') petId: string) {
    await assertOwnsPet(this.prisma, petId, req.user);
    return this.documentsService.findAllByPet(petId);
  }

  @Get('summary/:petId')
  async getFolderSummary(@Req() req: any, @Param('petId') petId: string) {
    await assertOwnsPet(this.prisma, petId, req.user);
    return this.documentsService.getFolderSummary(petId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsDocument(id, req.user);
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    await this.assertOwnsDocument(id, req.user);
    return this.documentsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.assertOwnsDocument(id, req.user);
    return this.documentsService.remove(id);
  }
}
