import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

function ensureUploadDir() {
  const dir = join(process.cwd(), 'uploads', 'documents');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function safeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async create(
    @Req() req: any,
    @Body()
    body: {
      petId: string;
      ownerId?: string;
      title: string;
      category: string;
      type?: string;
      fileUrl: string;
      fileName?: string;
      mimeType?: string;
      size?: number;
      isPrivate?: boolean;
      isVetShared?: boolean;
      isFavorite?: boolean;
      cloudProvider?: string | null;
      cloudPath?: string | null;
      cloudExportedAt?: string | null;
      metadata?: any;
    },
  ) {
    const authUserId = req.user?.id || req.user?.sub;

    if (!authUserId) throw new BadRequestException('Usuário não autenticado');
    if (!body?.petId) throw new BadRequestException('petId obrigatório');
    if (!body?.title?.trim()) throw new BadRequestException('title obrigatório');
    if (!body?.category?.trim()) throw new BadRequestException('category obrigatório');
    if (!body?.fileUrl?.trim()) throw new BadRequestException('fileUrl obrigatório');

    return this.documentsService.create({
      petId: body.petId,
      ownerId: authUserId,
      title: body.title.trim(),
      category: body.category.trim().toUpperCase(),
      type: body.type?.trim().toUpperCase() || 'OTHER',
      fileUrl: body.fileUrl.trim(),
      fileName: body.fileName?.trim(),
      mimeType: body.mimeType?.trim(),
      size: body.size ? Number(body.size) : undefined,
      isPrivate: body.isPrivate ?? true,
      isVetShared: body.isVetShared ?? false,
      isFavorite: body.isFavorite ?? false,
      cloudProvider: body.cloudProvider ?? null,
      cloudPath: body.cloudPath ?? null,
      cloudExportedAt: body.cloudExportedAt ? new Date(body.cloudExportedAt) : null,
      metadata: body.metadata ?? {},
    });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, ensureUploadDir());
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '');
          const base = safeName(file.originalname.replace(ext, '')) || 'documento';
          const finalName = `${Date.now()}-${Math.floor(Math.random() * 100000)}-${base}${ext}`;
          cb(null, finalName);
        },
      }),
      limits: {
        fileSize: 12 * 1024 * 1024,
      },
    }),
  )
  async upload(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      petId: string;
      title?: string;
      category: string;
      isPrivate?: string | boolean;
      isVetShared?: string | boolean;
      isFavorite?: string | boolean;
      metadata?: string;
    },
  ) {
    const authUserId = req.user?.id || req.user?.sub;

    if (!authUserId) throw new BadRequestException('Usuário não autenticado');
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (!body?.petId) throw new BadRequestException('petId obrigatório');
    if (!body?.category?.trim()) throw new BadRequestException('category obrigatório');

    const fileUrl = `/uploads/documents/${file.filename}`;

    return this.documentsService.create({
      petId: body.petId,
      ownerId: authUserId,
      title: body.title?.trim() || file.originalname,
      category: body.category.trim().toUpperCase(),
      type: file.mimetype || 'OTHER',
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      isPrivate: String(body.isPrivate) === 'false' ? false : true,
      isVetShared: String(body.isVetShared) === 'true',
      isFavorite: String(body.isFavorite) === 'true',
      metadata: body.metadata ? JSON.parse(body.metadata) : {},
    });
  }

  @Get()
  async findAll(
    @Query('petId') petId?: string,
    @Query('category') category?: string,
  ) {
    if (!petId) throw new BadRequestException('petId obrigatório');

    return this.documentsService.findAllByPet(
      petId,
      category ? category.toUpperCase() : undefined,
    );
  }

  @Get('folders/:petId')
  async getFolderSummary(@Param('petId') petId: string) {
    if (!petId) throw new BadRequestException('petId obrigatório');
    return this.documentsService.getFolderSummary(petId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      category?: string;
      type?: string;
      fileUrl?: string;
      fileName?: string;
      mimeType?: string;
      size?: number;
      isPrivate?: boolean;
      isVetShared?: boolean;
      isFavorite?: boolean;
      cloudProvider?: string | null;
      cloudPath?: string | null;
      cloudExportedAt?: string | null;
      metadata?: any;
    },
  ) {
    return this.documentsService.update(id, {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.category !== undefined ? { category: body.category.trim().toUpperCase() } : {}),
      ...(body.type !== undefined ? { type: body.type.trim().toUpperCase() } : {}),
      ...(body.fileUrl !== undefined ? { fileUrl: body.fileUrl.trim() } : {}),
      ...(body.fileName !== undefined ? { fileName: body.fileName.trim() } : {}),
      ...(body.mimeType !== undefined ? { mimeType: body.mimeType.trim() } : {}),
      ...(body.size !== undefined ? { size: Number(body.size) } : {}),
      ...(body.isPrivate !== undefined ? { isPrivate: body.isPrivate } : {}),
      ...(body.isVetShared !== undefined ? { isVetShared: body.isVetShared } : {}),
      ...(body.isFavorite !== undefined ? { isFavorite: body.isFavorite } : {}),
      ...(body.cloudProvider !== undefined ? { cloudProvider: body.cloudProvider } : {}),
      ...(body.cloudPath !== undefined ? { cloudPath: body.cloudPath } : {}),
      ...(body.cloudExportedAt !== undefined
        ? { cloudExportedAt: body.cloudExportedAt ? new Date(body.cloudExportedAt) : null }
        : {}),
      ...(body.metadata !== undefined ? { metadata: body.metadata } : {}),
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}