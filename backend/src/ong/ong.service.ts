import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ADOPTION_STATUSES = ['DISPONIVEL', 'EM_PROCESSO', 'ADOTADO'];

@Injectable()
export class OngService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Solicitação de conta ONG ───────────────────────────────────────────

  async apply(userId: string, body: { name?: string; cnpjOuResponsavel?: string; city?: string; instagram?: string }) {
    if (!body?.name || !body?.cnpjOuResponsavel) {
      throw new BadRequestException('Nome e CNPJ/responsável são obrigatórios.');
    }
    const existing = await this.prisma.ongProfile.findUnique({ where: { userId } });
    if (existing?.status === 'APPROVED') {
      throw new BadRequestException('Esta conta já é uma ONG parceira aprovada.');
    }
    if (existing) {
      // Resubmissão após rejeição — reabre a pendência com os dados novos.
      return this.prisma.ongProfile.update({
        where: { userId },
        data: {
          name: body.name,
          cnpjOuResponsavel: body.cnpjOuResponsavel,
          city: body.city || null,
          instagram: body.instagram || null,
          status: 'PENDING',
          requestedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
          rejectionReason: null,
        },
      });
    }
    return this.prisma.ongProfile.create({
      data: {
        userId,
        name: body.name,
        cnpjOuResponsavel: body.cnpjOuResponsavel,
        city: body.city || null,
        instagram: body.instagram || null,
      },
    });
  }

  async getMine(userId: string) {
    return this.prisma.ongProfile.findUnique({ where: { userId } });
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  async adminList(status?: string) {
    return this.prisma.ongProfile.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { id: true, name: true, email: true, photoUrl: true, createdAt: true } } },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async adminApprove(id: string, adminUserId: string) {
    const profile = await this.prisma.ongProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Solicitação não encontrada.');

    await this.prisma.$transaction([
      this.prisma.ongProfile.update({
        where: { id },
        data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: adminUserId, rejectionReason: null },
      }),
      this.prisma.user.update({ where: { id: profile.userId }, data: { role: 'ONG' } }),
    ]);
    return this.getMine(profile.userId);
  }

  async adminReject(id: string, adminUserId: string, reason?: string) {
    const profile = await this.prisma.ongProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Solicitação não encontrada.');
    return this.prisma.ongProfile.update({
      where: { id },
      data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: adminUserId, rejectionReason: reason || null },
    });
  }

  // Convites gerados/aceitos + retenção — derivado, sem tabela de log própria.
  async adminTransferStats() {
    const [generated, accepted] = await Promise.all([
      this.prisma.petTransferInvite.count(),
      this.prisma.petTransferInvite.count({ where: { status: 'ACCEPTED' } }),
    ]);

    const acceptedInvites = await this.prisma.petTransferInvite.findMany({
      where: { status: 'ACCEPTED' },
      select: { acceptedByUserId: true },
    });
    const userIds = [...new Set(acceptedInvites.map((i) => i.acceptedByUserId).filter(Boolean))] as string[];
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { lastLoginAt: true } })
      : [];
    const now = Date.now();
    const ativosUltimos7Dias = users.filter(
      (u) => u.lastLoginAt && now - new Date(u.lastLoginAt).getTime() < 7 * 86400000,
    ).length;

    return {
      convitesGerados: generated,
      convitesAceitos: accepted,
      adotantesUnicos: userIds.length,
      retencao7dias: userIds.length ? ativosUltimos7Dias / userIds.length : null,
    };
  }

  // ─── Sugestões das ONGs ──────────────────────────────────────────────────

  async createSuggestion(userId: string, message?: string) {
    if (!message?.trim()) throw new BadRequestException('Escreva a sugestão antes de enviar.');
    return this.prisma.ongSuggestion.create({ data: { userId, message: message.trim() } });
  }

  async adminListSuggestions() {
    return this.prisma.ongSuggestion.findMany({
      include: { user: { select: { name: true, email: true, ongProfile: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminMarkSuggestionSeen(id: string) {
    const suggestion = await this.prisma.ongSuggestion.findUnique({ where: { id } });
    if (!suggestion) throw new NotFoundException('Sugestão não encontrada.');
    return this.prisma.ongSuggestion.update({ where: { id }, data: { status: 'SEEN' } });
  }

  // ─── Painel multi-gato ───────────────────────────────────────────────────

  private async ensureOngOwnsPet(ongUserId: string, petId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet || pet.ownerId !== ongUserId) throw new NotFoundException('Gato não encontrado.');
    return pet;
  }

  async listPets(ongUserId: string) {
    const pets = await this.prisma.pet.findMany({
      where: { ownerId: ongUserId, isArchived: false, isMemorial: false },
      include: { healthRecords: { select: { type: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return pets.map((pet) => {
      const hr = pet.healthRecords;
      const hasType = (t: string) => hr.some((r) => r.type === t);
      const fivFelv = hr.find((r) => /fiv|felv/i.test(r.title || ''));
      return {
        id: pet.id,
        name: pet.name,
        photoUrl: pet.photoUrl,
        ageYears: pet.ageYears,
        ageMonths: pet.ageMonths,
        adoptionStatus: pet.adoptionStatus || 'DISPONIVEL',
        healthSummary: {
          vacinado: hasType('VACCINE'),
          vermifugado: hasType('VERMIFUGE'),
          castrado: pet.neutered,
          testeFivFelv: fivFelv ? fivFelv.title : null,
        },
      };
    });
  }

  async setAdoptionStatus(ongUserId: string, petId: string, status: string) {
    if (!ADOPTION_STATUSES.includes(status)) throw new BadRequestException('Status inválido.');
    await this.ensureOngOwnsPet(ongUserId, petId);
    return this.prisma.pet.update({ where: { id: petId }, data: { adoptionStatus: status } });
  }

  async bulkCreatePets(
    ongUserId: string,
    pets: Array<{ name: string; breed?: string; gender?: string; ageYears?: number; ageMonths?: number; photoUrl?: string }>,
  ) {
    if (!Array.isArray(pets) || pets.length === 0) throw new BadRequestException('Envie ao menos um gato.');
    const created = await this.prisma.$transaction(
      pets.map((p) =>
        this.prisma.pet.create({
          data: {
            ownerId: ongUserId,
            name: p.name,
            breed: p.breed || null,
            gender: (p.gender as any) || 'UNKNOWN',
            ageYears: p.ageYears ?? null,
            ageMonths: p.ageMonths ?? null,
            photoUrl: p.photoUrl || null,
            adoptionStatus: 'DISPONIVEL',
          },
        }),
      ),
    );
    return { created: created.length, pets: created };
  }

  async bulkHealthRecords(
    ongUserId: string,
    body: { petIds: string[]; type: string; title: string; date?: string; nextDueDate?: string },
  ) {
    if (!Array.isArray(body.petIds) || body.petIds.length === 0) {
      throw new BadRequestException('Selecione ao menos um gato.');
    }
    const pets = await this.prisma.pet.findMany({
      where: { id: { in: body.petIds }, ownerId: ongUserId },
      select: { id: true },
    });
    if (pets.length !== body.petIds.length) throw new ForbiddenException('Um ou mais gatos não pertencem a esta ONG.');

    const date = body.date ? new Date(body.date) : new Date();
    const created = await this.prisma.$transaction(
      pets.map((p) =>
        this.prisma.healthRecord.create({
          data: {
            petId: p.id,
            type: body.type as any,
            title: body.title,
            date,
            nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
          },
        }),
      ),
    );
    return { created: created.length };
  }

  // ─── Transferência de tutoria ────────────────────────────────────────────

  async createInvite(ongUserId: string, petId: string) {
    await this.ensureOngOwnsPet(ongUserId, petId);
    // Só um convite pendente por gato por vez — evita QR codes velhos ainda válidos.
    await this.prisma.petTransferInvite.updateMany({
      where: { petId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    const token = crypto.randomBytes(20).toString('hex');
    return this.prisma.petTransferInvite.create({
      data: { petId, ongUserId, token, expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
    });
  }

  async listInvites(ongUserId: string) {
    return this.prisma.petTransferInvite.findMany({
      where: { ongUserId },
      include: { pet: { select: { name: true, photoUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvite(ongUserId: string, id: string) {
    const invite = await this.prisma.petTransferInvite.findUnique({ where: { id } });
    if (!invite || invite.ongUserId !== ongUserId) throw new NotFoundException('Convite não encontrado.');
    if (invite.status !== 'PENDING') throw new BadRequestException('Este convite não está mais pendente.');
    return this.prisma.petTransferInvite.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  private async resolveInvite(token: string) {
    const invite = await this.prisma.petTransferInvite.findUnique({
      where: { token },
      include: { pet: true, ongUser: { include: { ongProfile: true } } },
    });
    if (!invite) throw new NotFoundException('Convite não encontrado.');
    if (invite.status === 'PENDING' && invite.expiresAt.getTime() < Date.now()) {
      await this.prisma.petTransferInvite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
      invite.status = 'EXPIRED';
    }
    return invite;
  }

  // Prévia pública — sem autenticação, sem dado sensível (nada do tutor anterior).
  async previewInvite(token: string) {
    const invite = await this.resolveInvite(token);
    return {
      status: invite.status,
      petId: invite.pet.id,
      petName: invite.pet.name,
      petPhoto: invite.pet.photoUrl,
      petBreed: invite.pet.breed,
      ongName: invite.ongUser.ongProfile?.name || invite.ongUser.name,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(token: string, acceptingUserId: string) {
    const invite = await this.resolveInvite(token);
    if (invite.status !== 'PENDING') {
      throw new BadRequestException(invite.status === 'EXPIRED' ? 'Este convite expirou.' : 'Este convite não está mais disponível.');
    }
    if (invite.ongUserId === acceptingUserId) {
      throw new BadRequestException('Você não pode aceitar seu próprio convite.');
    }

    const pet = invite.pet;
    const ongName = invite.ongUser.ongProfile?.name || invite.ongUser.name || 'ONG parceira';

    // O que NUNCA transfere fica congelado aqui, pra ONG manter memória sem
    // manter acesso ao gato — depois disso, ongInternalNotes é zerado no Pet.
    const snapshot = {
      ongInternalNotes: pet.ongInternalNotes || null,
      transferredAt: new Date().toISOString(),
      petName: pet.name,
    };

    await this.prisma.$transaction([
      this.prisma.pet.update({
        where: { id: pet.id },
        data: { ownerId: acceptingUserId, adoptionStatus: 'ADOTADO', ongInternalNotes: null },
      }),
      // Ficha, carteira, preventivos, pesagens e histórico já são petId-scoped
      // (HealthRecord/DiaryEntry/PetAchievement etc.) — seguem o gato sozinhos.
      // Só precisam de update explícito os que também carregam userId/ownerId.
      this.prisma.protocolEnrollment.updateMany({ where: { petId: pet.id }, data: { userId: acceptingUserId } }),
      this.prisma.document.updateMany({ where: { petId: pet.id }, data: { ownerId: acceptingUserId } }),
      this.prisma.healthRecord.create({
        data: { petId: pet.id, type: 'ADOPTION', title: `Adotado via ${ongName}`, date: new Date() },
      }),
      this.prisma.petTransferInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedByUserId: acceptingUserId, ongSnapshot: snapshot },
      }),
    ]);

    return this.prisma.pet.findUnique({ where: { id: pet.id } });
  }
}
