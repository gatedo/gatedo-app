import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';
const sharp = require('sharp');

@Injectable()
export class CloudflareService {
  private s3Client: S3Client;
  private bucketName = process.env.R2_BUCKET_NAME || 'gatedo-assets';
  private publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      if (!file?.buffer) {
        throw new InternalServerErrorException('Arquivo inválido para upload.');
      }

      const optimizedBuffer = await sharp(file.buffer)
  .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 80 })
  .toBuffer();

      const fileName = `${uuidv4()}.webp`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: optimizedBuffer,
          ContentType: 'image/webp',
        }),
      );

      if (!this.publicUrl) {
        throw new InternalServerErrorException('R2_PUBLIC_URL não configurada.');
      }

      return `${this.publicUrl}/${fileName}`;
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      throw new InternalServerErrorException('Falha ao processar imagem');
    }
  }
}