import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    petId: string;
    ownerId: string;
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
    cloudExportedAt?: Date | null;
    metadata?: any;
  }) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: data.petId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!pet) {
      throw new NotFoundException('Gato não encontrado');
    }

    if (pet.ownerId !== data.ownerId) {
      throw new NotFoundException('O gato não pertence ao usuário informado');
    }

    return this.prisma.document.create({
      data: {
        petId: data.petId,
        ownerId: data.ownerId,
        title: data.title,
        category: data.category,
        type: data.type ?? 'OTHER',
        fileUrl: data.fileUrl,
        fileName: data.fileName ?? null,
        mimeType: data.mimeType ?? null,
        size: data.size ?? null,
        isPrivate: data.isPrivate ?? true,
        isVetShared: data.isVetShared ?? false,
        isFavorite: data.isFavorite ?? false,
        cloudProvider: data.cloudProvider ?? null,
        cloudPath: data.cloudPath ?? null,
        cloudExportedAt: data.cloudExportedAt ?? null,
        metadata: data.metadata ?? {},
      },
      include: {
        pet: {
          select: { id: true, name: true, photoUrl: true },
        },
      },
    });
  }

  async findAllByPet(petId: string, category?: string) {
    return this.prisma.document.findMany({
      where: {
        petId,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        pet: {
          select: { id: true, name: true, photoUrl: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        pet: {
          select: { id: true, name: true, photoUrl: true },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException('Documento não encontrado');
    }

    return doc;
  }

  async update(
    id: string,
    data: {
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
      cloudExportedAt?: Date | null;
      metadata?: any;
    },
  ) {
    const existing = await this.prisma.document.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Documento não encontrado');
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.fileUrl !== undefined ? { fileUrl: data.fileUrl } : {}),
        ...(data.fileName !== undefined ? { fileName: data.fileName } : {}),
        ...(data.mimeType !== undefined ? { mimeType: data.mimeType } : {}),
        ...(data.size !== undefined ? { size: data.size } : {}),
        ...(data.isPrivate !== undefined ? { isPrivate: data.isPrivate } : {}),
        ...(data.isVetShared !== undefined ? { isVetShared: data.isVetShared } : {}),
        ...(data.isFavorite !== undefined ? { isFavorite: data.isFavorite } : {}),
        ...(data.cloudProvider !== undefined ? { cloudProvider: data.cloudProvider } : {}),
        ...(data.cloudPath !== undefined ? { cloudPath: data.cloudPath } : {}),
        ...(data.cloudExportedAt !== undefined ? { cloudExportedAt: data.cloudExportedAt } : {}),
        ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
      },
      include: {
        pet: {
          select: { id: true, name: true, photoUrl: true },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.document.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Documento não encontrado');
    }

    await this.prisma.document.delete({
      where: { id },
    });

    return { success: true, id };
  }

  async getFolderSummary(petId: string) {
    const docs = await this.prisma.document.findMany({
      where: { petId },
      select: {
        id: true,
        category: true,
        createdAt: true,
        size: true,
        isFavorite: true,
        isVetShared: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const folders = [
      { id: 'RECEITA', label: 'Receitas' },
      { id: 'EXAME', label: 'Exames' },
      { id: 'LAUDO', label: 'Laudos' },
      { id: 'PEDIGREE', label: 'Pedigree' },
      { id: 'VACINACAO', label: 'Vacinação' },
      { id: 'OFICIAL', label: 'Oficiais' },
      { id: 'OUTROS', label: 'Outros' },
    ];

    return folders.map((folder) => {
      const items = docs.filter((d) => d.category === folder.id);
      return {
        id: folder.id,
        label: folder.label,
        count: items.length,
        favorites: items.filter((d) => d.isFavorite).length,
        vetShared: items.filter((d) => d.isVetShared).length,
        totalSize: items.reduce((acc, item) => acc + (item.size ?? 0), 0),
        lastCreatedAt: items[0]?.createdAt ?? null,
      };
    });
  }
}