import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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

    const fileUrl = `/uploads/documents/${file.filename}`;

    let ownerId = req?.user?.id || body?.ownerId || body?.userId || null;
    if (!ownerId && body?.petId) {
      const pet = await this.documentsService.getPetOwner(body.petId);
      ownerId = pet?.ownerId || null;
    }
    if (!ownerId) {
      throw new BadRequestException('ownerId não resolvido para o upload do documento.');
    }

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

    let ownerId = req?.user?.id || body?.ownerId || body?.userId || null;
    if (!ownerId && body?.petId) {
      const pet = await this.documentsService.getPetOwner(body.petId);
      ownerId = pet?.ownerId || null;
    }
    if (!ownerId) {
      throw new BadRequestException('ownerId não resolvido para o documento gerado.');
    }

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
    @Query('petId') petId?: string,
    @Query('category') category?: string,
  ) {
    return this.documentsService.findAll({ petId, category });
  }

  @Get('pet/:petId')
  async findAllByPet(@Param('petId') petId: string) {
    return this.documentsService.findAllByPet(petId);
  }

  @Get('summary/:petId')
  async getFolderSummary(@Param('petId') petId: string) {
    return this.documentsService.getFolderSummary(petId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.documentsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
