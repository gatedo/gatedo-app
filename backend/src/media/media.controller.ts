import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudflareService } from '../cloudflare/cloudflare.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Express } from 'express';
import 'multer'; // <--- Corrige a tipagem

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly cloudflareService: CloudflareService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          // Regex atualizada para aceitar JPG, PNG e WEBP
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }), 
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // Chama 'uploadImage' para alinhar com o serviço
    return { url: await this.cloudflareService.uploadImage(file) };
  }
}