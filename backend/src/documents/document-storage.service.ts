import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join } from 'path';
const sharp = require('sharp');

// Documentos do pet (exames, receitas, laudos) moravam em ./uploads no disco
// do servidor. No Render esse disco é efêmero: todo deploy/restart apaga os
// arquivos e o banco fica apontando pro nada. Agora vão pro R2.
//
// No banco o fileUrl fica como "r2:<key>" (nunca uma URL pública). Na saída
// da API ele vira um link pré-assinado com validade — documento de saúde não
// fica aberto na internet, igual era o /uploads assinado.
//
// Sem R2 configurado (dev local) cai pro disco, como antes.

const R2_PREFIX = 'r2:';
const LINK_TTL_SECONDS = 6 * 60 * 60;

// Tudo vira WebP: uma foto de celular de 3-5 MB cai pra ~150-300 KB (85-95%
// menor). 2000px no lado maior ainda deixa texto de exame/receita legível;
// as fotos de perfil usam 1080, que aqui já borraria letra miúda.
const IMAGE_MAX_SIDE = 2000;
const IMAGE_QUALITY = 75;
const COMPRESSIBLE_IMAGES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export type StoredFile = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
};

@Injectable()
export class DocumentStorageService {
  private readonly logger = new Logger(DocumentStorageService.name);
  private readonly bucket = process.env.R2_DOCUMENTS_BUCKET || process.env.R2_BUCKET_NAME || '';
  private readonly s3: S3Client | null;

  constructor() {
    const configured = Boolean(
      process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && this.bucket,
    );
    this.s3 = configured
      ? new S3Client({
          region: 'auto',
          endpoint: process.env.R2_ENDPOINT,
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
          },
        })
      : null;

    if (!this.s3) {
      this.logger.warn('R2 não configurado — documentos serão salvos em disco local (não use isso em produção).');
    }
  }

  async save(input: { buffer: Buffer; mimeType?: string; originalName?: string; petId: string }): Promise<StoredFile> {
    const optimized = await this.optimize(input.buffer, input.mimeType, input.originalName);
    const ext = optimized.ext;
    const fileName = `${randomUUID()}${ext}`;

    if (this.s3) {
      const key = `documents/${input.petId}/${fileName}`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: optimized.buffer,
          ContentType: optimized.mimeType,
          CacheControl: 'private, max-age=86400',
        }),
      );
      return { fileUrl: `${R2_PREFIX}${key}`, fileName, mimeType: optimized.mimeType, size: optimized.buffer.length };
    }

    const dir = join(process.cwd(), 'uploads', 'documents');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, fileName), optimized.buffer);
    return {
      fileUrl: `/uploads/documents/${fileName}`,
      fileName,
      mimeType: optimized.mimeType,
      size: optimized.buffer.length,
    };
  }

  // Links que o front usa. Arquivos legados em /uploads continuam saindo como
  // caminho e são assinados pelo SignUploadsInterceptor.
  async resolve(fileUrl: string, downloadName?: string) {
    if (!fileUrl?.startsWith(R2_PREFIX) || !this.s3) {
      return { url: fileUrl, downloadUrl: fileUrl, missing: this.isMissingLocal(fileUrl) };
    }

    const key = fileUrl.slice(R2_PREFIX.length);
    const url = await getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: LINK_TTL_SECONDS,
    });
    const downloadUrl = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${this.asciiName(downloadName, key)}"`,
      }),
      { expiresIn: LINK_TTL_SECONDS },
    );
    return { url, downloadUrl, missing: false };
  }

  async remove(fileUrl?: string | null) {
    if (!fileUrl) return;
    try {
      if (fileUrl.startsWith(R2_PREFIX)) {
        if (!this.s3) return;
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: fileUrl.slice(R2_PREFIX.length) }));
        return;
      }
      if (fileUrl.startsWith('/uploads/documents/')) {
        await unlink(join(process.cwd(), fileUrl.split('?')[0]));
      }
    } catch (err: any) {
      // Arquivo já sumido não pode impedir de apagar o registro.
      this.logger.warn(`Falha ao remover arquivo ${fileUrl}: ${err?.message || err}`);
    }
  }

  private isMissingLocal(fileUrl?: string) {
    if (!fileUrl?.startsWith('/uploads/')) return false;
    return !existsSync(join(process.cwd(), fileUrl.split('?')[0]));
  }

  private async optimize(buffer: Buffer, mimeType?: string, originalName?: string) {
    const mime = String(mimeType || '').toLowerCase();
    const fallbackExt = (extname(originalName || '') || this.extFromMime(mime)).toLowerCase();

    if (!COMPRESSIBLE_IMAGES.has(mime)) {
      return { buffer, mimeType: mime || 'application/octet-stream', ext: fallbackExt || '.bin' };
    }

    try {
      // rotate() aplica a orientação do EXIF; a saída não leva metadados
      // (some GPS da foto, modelo do celular etc).
      const out = await sharp(buffer)
        .rotate()
        .resize(IMAGE_MAX_SIDE, IMAGE_MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: IMAGE_QUALITY, effort: 5, smartSubsample: true })
        .toBuffer();

      // Imagem já bem comprimida às vezes fica maior: aí guarda a original.
      if (out.length >= buffer.length && mime !== 'image/heic' && mime !== 'image/heif') {
        return { buffer, mimeType: mime, ext: fallbackExt || this.extFromMime(mime) };
      }
      return { buffer: out, mimeType: 'image/webp', ext: '.webp' };
    } catch (err: any) {
      // HEIC sem suporte no sharp, imagem corrompida etc: guarda o original.
      this.logger.warn(`Não foi possível otimizar imagem (${mime}): ${err?.message || err}`);
      return { buffer, mimeType: mime, ext: fallbackExt || '.bin' };
    }
  }

  private extFromMime(mime: string) {
    if (mime.includes('pdf')) return '.pdf';
    if (mime.includes('png')) return '.png';
    if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
    if (mime.includes('webp')) return '.webp';
    if (mime.includes('heic')) return '.heic';
    if (mime.includes('heif')) return '.heif';
    if (mime.includes('json')) return '.json';
    return '';
  }

  private asciiName(name: string | undefined, key: string) {
    const ext = extname(key);
    const base = String(name || 'documento')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._ -]+/g, '')
      .trim()
      .slice(0, 80) || 'documento';
    return extname(base).toLowerCase() === ext.toLowerCase() ? base : `${base.replace(/\.[^.]+$/, '')}${ext}`;
  }
}
