import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

@Injectable()
export class MediaService {
  private s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  async presign(input: { mimeType: string; sizeBytes: number }) {
    const { mimeType, sizeBytes } = input;

    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException('Tipo de arquivo não permitido.');
    }
    if (!sizeBytes || sizeBytes > MAX_SIZE) {
      throw new BadRequestException('Arquivo muito grande.');
    }

    const mediaId = randomUUID();
    const ext =
      mimeType === 'image/jpeg' ? 'jpg' :
      mimeType === 'image/png'  ? 'png' : 'webp';

    const storageKey = `uploads/${new Date().toISOString().slice(0,10)}/${mediaId}.${ext}`;

    const cmd = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: storageKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3, cmd, { expiresIn: 60 }); // 60s

    return {
      mediaId,
      storageKey,
      uploadUrl,
      expiresIn: 60,
    };
  }

  async confirm(mediaId: string) {
    // MVP: por enquanto só confirma.
    // Depois: salvar no DB (MediaAsset) com storageKey e owner.
    if (!mediaId) throw new BadRequestException('mediaId obrigatório');
    return { ok: true, mediaId };
  }
}
