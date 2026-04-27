import { Injectable, NotFoundException } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPetOwner(petId: string) {
    return this.prisma.pet.findUnique({
      where: { id: petId },
      select: { ownerId: true },
    });
  }

  async create(data: {
    title: string;
    category: string;
    filename: string;
    fileUrl: string;
    mimeType?: string;
    size?: number;
    petId: string;
    ownerId: string;
    metadata?: any;
    isPrivate?: boolean;
    isVetShared?: boolean;
    isFavorite?: boolean;
  }) {
    const document = await this.prisma.document.create({
      data: {
        title: data.title,
        category: data.category,
        type: this.resolveType(data.mimeType),
        fileUrl: data.fileUrl,
        fileName: data.filename,
        mimeType: data.mimeType,
        size: data.size,
        petId: data.petId,
        ownerId: data.ownerId,
        metadata: data.metadata ?? undefined,
        isPrivate: data.isPrivate ?? true,
        isVetShared: data.isVetShared ?? false,
        isFavorite: data.isFavorite ?? false,
      },
    });

    return this.normalize(document);
  }


  async createGeneratedFromBase64(data: {
    title: string;
    category: string;
    petId: string;
    ownerId?: string;
    filename?: string;
    mimeType?: string;
    base64: string;
    metadata?: any;
    isPrivate?: boolean;
    isVetShared?: boolean;
    isFavorite?: boolean;
  }) {
    let ownerId = data.ownerId || null;
    if (!ownerId) {
      const pet = await this.getPetOwner(data.petId);
      ownerId = pet?.ownerId || null;
    }
    if (!ownerId) {
      throw new NotFoundException('ownerId não encontrado para o pet informado.');
    }

    const mimeType = data.mimeType || this.inferMimeFromBase64(data.base64) || 'application/pdf';
    const buffer = this.decodeBase64(data.base64);
    const safeExt = this.resolveExtension(data.filename, mimeType);
    const safeName = this.sanitizeFilename(
      data.filename || `${Date.now()}-${Math.round(Math.random() * 1e5)}${safeExt}`,
      safeExt,
    );

    const targetDir = join(process.cwd(), 'uploads', 'documents');
    await mkdir(targetDir, { recursive: true });

    const fullPath = join(targetDir, safeName);
    await writeFile(fullPath, buffer);

    return this.create({
      title: data.title,
      category: data.category,
      filename: safeName,
      fileUrl: `/uploads/documents/${safeName}`,
      mimeType,
      size: buffer.length,
      petId: data.petId,
      ownerId,
      metadata: data.metadata ?? undefined,
      isPrivate: data.isPrivate ?? true,
      isVetShared: data.isVetShared ?? false,
      isFavorite: data.isFavorite ?? false,
    });
  }

  async findAll(filters?: { petId?: string; category?: string }) {
    const where: any = {};
    if (filters?.petId) where.petId = filters.petId;
    if (filters?.category) where.category = filters.category;

    const docs = await this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((doc) => this.normalize(doc));
  }

  async findAllByPet(petId: string) {
    const docs = await this.prisma.document.findMany({
      where: { petId },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((doc) => this.normalize(doc));
  }

  async getFolderSummary(petId: string) {
    const docs = await this.prisma.document.findMany({
      where: { petId },
      select: { category: true },
    });

    const summary: Record<string, number> = {};
    docs.forEach((doc) => {
      summary[doc.category] = (summary[doc.category] || 0) + 1;
    });

    return summary;
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Documento não encontrado');
    }
    return this.normalize(doc);
  }

  async update(id: string, data: any) {
    const doc = await this.prisma.document.update({
      where: { id },
      data: {
        ...(data?.title !== undefined ? { title: data.title } : {}),
        ...(data?.category !== undefined ? { category: data.category } : {}),
        ...(data?.metadata !== undefined ? { metadata: data.metadata } : {}),
        ...(data?.isPrivate !== undefined ? { isPrivate: data.isPrivate } : {}),
        ...(data?.isVetShared !== undefined ? { isVetShared: data.isVetShared } : {}),
        ...(data?.isFavorite !== undefined ? { isFavorite: data.isFavorite } : {}),
        ...(data?.cloudProvider !== undefined ? { cloudProvider: data.cloudProvider } : {}),
        ...(data?.cloudPath !== undefined ? { cloudPath: data.cloudPath } : {}),
        ...(data?.cloudExportedAt !== undefined ? { cloudExportedAt: data.cloudExportedAt } : {}),
      },
    });

    return this.normalize(doc);
  }

  async remove(id: string) {
    await this.prisma.document.delete({ where: { id } });
    return { message: 'Documento removido com sucesso' };
  }


  private decodeBase64(input: string) {
    const raw = (input || '').includes(',') ? (input || '').split(',').pop() || '' : input || '';
    return Buffer.from(raw, 'base64');
  }

  private inferMimeFromBase64(input?: string) {
    const head = (input || '').slice(0, 64);
    const match = head.match(/^data:([^;]+);base64,/i);
    return match?.[1] || null;
  }

  private resolveExtension(filename?: string, mime?: string) {
    const current = filename ? extname(filename) : '';
    if (current) return current.toLowerCase();
    if (!mime) return '.bin';
    const lower = mime.toLowerCase();
    if (lower.includes('pdf')) return '.pdf';
    if (lower.includes('png')) return '.png';
    if (lower.includes('jpeg') || lower.includes('jpg')) return '.jpg';
    if (lower.includes('webp')) return '.webp';
    if (lower.includes('json')) return '.json';
    return '.bin';
  }

  private sanitizeFilename(filename: string, fallbackExt = '.bin') {
    const clean = (filename || 'arquivo')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!extname(clean)) return `${clean || 'arquivo'}${fallbackExt}`;
    return clean;
  }

  private normalize(document: any) {
    return {
      ...document,
      url: document.fileUrl,
      publicUrl: document.fileUrl,
      downloadUrl: document.fileUrl,
    };
  }

  private resolveType(mime?: string) {
    if (!mime) return 'OTHER';
    const lower = mime.toLowerCase();
    if (lower.includes('pdf')) return 'PDF';
    if (lower.includes('image')) return 'IMAGE';
    if (lower.includes('word') || lower.includes('officedocument') || lower.includes('msword') || lower.includes('doc')) return 'DOC';
    return 'OTHER';
  }
}
