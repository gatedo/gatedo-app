import { ForbiddenException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';

const DEFAULT_DAYS = 7;
const MAX_DAYS = 30;

// "Pasta do Vet": o tutor marca documentos (isVetShared) e gera um link
// temporário que abre sem login. Só existe um link ativo por pet — gerar um
// novo revoga o anterior, assim um link vazado é fácil de matar.
@Injectable()
export class VetShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  private activeWhere(petId: string) {
    return { petId, revokedAt: null, expiresAt: { gt: new Date() } };
  }

  async getStatus(petId: string) {
    const [link, sharedCount] = await Promise.all([
      this.prisma.vetShareLink.findFirst({ where: this.activeWhere(petId), orderBy: { createdAt: 'desc' } }),
      this.prisma.document.count({ where: { petId, isVetShared: true } }),
    ]);
    return { link: link ? this.publicLink(link) : null, sharedCount };
  }

  async create(petId: string, ownerId: string, days?: number) {
    const validDays = Math.min(MAX_DAYS, Math.max(1, Math.round(Number(days) || DEFAULT_DAYS)));
    await this.prisma.vetShareLink.updateMany({ where: this.activeWhere(petId), data: { revokedAt: new Date() } });
    const link = await this.prisma.vetShareLink.create({
      data: {
        petId,
        ownerId,
        token: randomBytes(18).toString('base64url'),
        expiresAt: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
      },
    });
    return { link: this.publicLink(link) };
  }

  async revoke(id: string, user: { id: string; role?: string }) {
    const link = await this.prisma.vetShareLink.findUnique({ where: { id } });
    if (!link) throw new NotFoundException('Link não encontrado.');
    if (link.ownerId !== user.id && user.role !== 'ADMIN') throw new ForbiddenException('Sem acesso a este link.');
    await this.prisma.vetShareLink.update({ where: { id }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  async getPublic(token: string) {
    const link = await this.prisma.vetShareLink.findUnique({
      where: { token: String(token || '') },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            breed: true,
            gender: true,
            birthDate: true,
            ageYears: true,
            ageMonths: true,
            weight: true,
            neutered: true,
            photoUrl: true,
          },
        },
        owner: { select: { name: true } },
      },
    });
    if (!link) throw new NotFoundException('Link inválido.');
    if (link.revokedAt || link.expiresAt <= new Date()) {
      throw new GoneException('Este link expirou ou foi revogado pelo tutor.');
    }

    await this.prisma.vetShareLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    });

    const docs = await this.prisma.document.findMany({
      where: { petId: link.petId, isVetShared: true },
      orderBy: { createdAt: 'desc' },
    });
    const normalized = await Promise.all(docs.map((d) => this.documents.normalize(d)));

    return {
      expiresAt: link.expiresAt,
      pet: link.pet,
      tutorFirstName: String(link.owner?.name || '').trim().split(/\s+/)[0] || null,
      // Só o necessário pro vet — nada de ownerId, flags internas etc.
      documents: normalized.map((d: any) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        type: d.type,
        mimeType: d.mimeType,
        size: d.size,
        createdAt: d.createdAt,
        fileUrl: d.fileUrl,
        downloadUrl: d.downloadUrl,
        fileMissing: d.fileMissing,
        isReport: d.isReport,
        report: d.isReport ? this.forVet(d.metadata?.report) : null,
      })),
    };
  }

  // No link do vet o tutor aparece só pelo primeiro nome, inclusive no laudo.
  private forVet(report: any) {
    if (!report) return null;
    const first = String(report.owner?.name || '').trim().split(/\s+/)[0] || null;
    return { ...report, owner: first ? { name: first } : null };
  }

  private publicLink(link: { id: string; token: string; expiresAt: Date; createdAt: Date; viewCount: number; lastViewedAt: Date | null }) {
    return {
      id: link.id,
      token: link.token,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      viewCount: link.viewCount,
      lastViewedAt: link.lastViewedAt,
    };
  }
}
