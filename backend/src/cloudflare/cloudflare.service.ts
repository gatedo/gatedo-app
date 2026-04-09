import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';
import * as sharp from 'sharp';

@Injectable()
export class CloudflareService {
  private s3Client: S3Client;

  constructor() {
    if (!process.env.R2_BUCKET_NAME)
      throw new Error('Missing env: R2_BUCKET_NAME');

    if (!process.env.R2_ENDPOINT)
      throw new Error('Missing env: R2_ENDPOINT');

    if (!process.env.R2_ACCESS_KEY_ID)
      throw new Error('Missing env: R2_ACCESS_KEY_ID');

    if (!process.env.R2_SECRET_ACCESS_KEY)
      throw new Error('Missing env: R2_SECRET_ACCESS_KEY');

    if (!process.env.R2_PUBLIC_URL)
      throw new Error('Missing env: R2_PUBLIC_URL');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const fileName = `${uuidv4()}.webp`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName,
          Body: optimizedBuffer,
          ContentType: 'image/webp',
        }),
      );

      return `${process.env.R2_PUBLIC_URL}/${fileName}`;
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw new InternalServerErrorException(
        'Falha ao processar upload da imagem',
      );
    }
  }
}