import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStorageService } from './document-storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: DocumentStorageService,
  ) {}

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
    const stored = await this.storage.save({
      buffer: this.decodeBase64(data.base64),
      mimeType,
      originalName: data.filename,
      petId: data.petId,
    });

    return this.create({
      title: data.title,
      category: data.category,
      filename: stored.fileName,
      fileUrl: stored.fileUrl,
      mimeType: stored.mimeType,
      size: stored.size,
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

    return Promise.all(docs.map((doc) => this.normalize(doc)));
  }

  async findAllByPet(petId: string) {
    const docs = await this.prisma.document.findMany({
      where: { petId },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(docs.map((doc) => this.normalize(doc)));
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
    const doc = await this.prisma.document.delete({ where: { id } });
    await this.storage.remove(doc.fileUrl);
    for (const att of this.reportOf(doc)?.attachments || []) {
      await this.storage.remove(att?.fileUrl);
    }
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

  // fileUrl sai já como link utilizável (pré-assinado no R2); o valor do
  // banco ("r2:...") nunca vai pro front. Laudos IA novos não têm arquivo: o
  // conteúdo fica em metadata.report e o front monta HTML/PDF na hora.
  async normalize(document: any) {
    const report = this.reportOf(document);
    if (report) {
      const attachments = await Promise.all(
        (report.attachments || []).map(async (att: any) => ({
          label: att?.label,
          note: att?.note,
          url: att?.fileUrl ? (await this.storage.resolve(att.fileUrl)).url : null,
        })),
      );
      return {
        ...document,
        metadata: { ...document.metadata, report: { ...report, attachments } },
        fileUrl: null,
        url: null,
        publicUrl: null,
        downloadUrl: null,
        isReport: true,
        fileMissing: false,
      };
    }

    const { url, downloadUrl, missing } = await this.storage.resolve(document.fileUrl, document.title);
    return {
      ...document,
      fileUrl: url,
      url,
      publicUrl: url,
      downloadUrl,
      isReport: false,
      fileMissing: missing,
    };
  }

  private reportOf(document: any) {
    const meta = document?.metadata;
    return meta && typeof meta === 'object' && meta.report && typeof meta.report === 'object' ? meta.report : null;
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
