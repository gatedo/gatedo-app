import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, StudioType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StudioAiService } from './studio-ai.service';

type StudioModuleKey = 'tutor-cat' | 'portrait' | 'sticker';

interface GenerateStudioInput {
  userId: string;
  role?: Role | string;
  module?: string;
  moduleKey?: string;
  prompt?: string;
  petId?: string | null;
  originalPhotoUrl?: string | null;
  tutorPhotoUrl?: string | null;
  sourceImageUrls?: string[];
  preset?: string | null;
  metadata?: Record<string, any>;
}

@Injectable()
export class StudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studioAiService: StudioAiService,
  ) {}

  private readonly moduleConfig = {
    'tutor-cat': {
      key: 'tutor-cat' as StudioModuleKey,
      studioType: 'TUTOR_CAT' as StudioType,
      title: 'Tutor + Gato',
      costPoints: 10,
      xptReward: 25,
      xpgReward: 12,
    },
    portrait: {
      key: 'portrait' as StudioModuleKey,
      studioType: 'PORTRAIT' as StudioType,
      title: 'Portrait',
      costPoints: 8,
      xptReward: 4,
      xpgReward: 2,
    },
    sticker: {
      key: 'sticker' as StudioModuleKey,
      studioType: 'STICKER' as StudioType,
      title: 'Sticker',
      costPoints: 3,
      xptReward: 2,
      xpgReward: 1,
    },
  };

  private normalizeModule(input?: string | null): StudioModuleKey {
    const raw = String(input || '').trim().toLowerCase();

    const aliases: Record<string, StudioModuleKey> = {
      'tutor-cat': 'tutor-cat',
      tutor_cat: 'tutor-cat',
      tutorcat: 'tutor-cat',
      portrait: 'portrait',
      sticker: 'sticker',
    };

    const normalized = aliases[raw];
    if (!normalized) {
      throw new BadRequestException(`Módulo inválido: ${input}`);
    }

    return normalized;
  }

  private isPrivilegedRole(role?: Role | string) {
    return role === 'ADMIN' || role === 'TESTER_VIP';
  }

  private async ensurePetOwnership(userId: string, petId?: string | null) {
    if (!petId) return null;

    const pet = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
        breed: true,
        ownerId: true,
        xpg: true,
        photoUrl: true,
      },
    });

    if (!pet) {
      throw new ForbiddenException('Pet não encontrado ou não pertence ao usuário.');
    }

    return pet;
  }

  private async consumePoints(
    tx: Prisma.TransactionClient,
    params: {
      userId: string;
      role?: Role | string;
      amount: number;
      petId?: string | null;
      action: string;
      metadata?: any;
    },
  ) {
    const privileged = this.isPrivilegedRole(params.role);

    if (privileged || params.amount <= 0) {
      return {
        pointsSpent: 0,
        bypassedCost: privileged,
      };
    }

    const user = await tx.user.findUnique({
      where: { id: params.userId },
      select: { gatedoPoints: true },
    });

    const current = user?.gatedoPoints ?? 0;

    if (current < params.amount) {
      throw new ForbiddenException(
        `Saldo insuficiente. Necessário: ${params.amount}, disponível: ${current}.`,
      );
    }

    await tx.user.update({
      where: { id: params.userId },
      data: {
        gatedoPoints: {
          decrement: params.amount,
        },
      },
    });

    await tx.rewardEvent.create({
      data: {
        userId: params.userId,
        petId: params.petId ?? null,
        action: params.action,
        gptsDelta: -params.amount,
        xptDelta: 0,
        xpgDelta: 0,
        metadata: params.metadata ?? {},
      },
    });

    return {
      pointsSpent: params.amount,
      bypassedCost: false,
    };
  }

  private async applyRewards(
    tx: Prisma.TransactionClient,
    params: {
      userId: string;
      petId?: string | null;
      xpt: number;
      xpg: number;
      action: string;
      metadata?: any;
    },
  ) {
    if (params.xpt > 0) {
      await tx.user.update({
        where: { id: params.userId },
        data: {
          xpt: {
            increment: params.xpt,
          },
        },
      });
    }

    if (params.petId && params.xpg > 0) {
      await tx.pet.update({
        where: { id: params.petId },
        data: {
          xpg: {
            increment: params.xpg,
          },
        },
      });
    }

    await tx.rewardEvent.create({
      data: {
        userId: params.userId,
        petId: params.petId ?? null,
        action: params.action,
        gptsDelta: 0,
        xptDelta: params.xpt,
        xpgDelta: params.petId ? params.xpg : 0,
        metadata: params.metadata ?? {},
      },
    });

    return {
      xptGranted: params.xpt,
      xpgGranted: params.petId ? params.xpg : 0,
    };
  }

  private buildModulePrompt(params: {
    moduleKey: StudioModuleKey;
    petName?: string | null;
    breed?: string | null;
    preset?: string | null;
    userPrompt?: string | null;
  }) {
    const petName = params.petName || 'gato';
    const breed = params.breed || 'sem raça definida';
    const preset = params.preset || 'padrão';
    const userPrompt = (params.userPrompt || '').trim();

    if (params.moduleKey === 'tutor-cat') {
      return `
Crie uma imagem premium do tutor com seu gato.
Use a foto do gato e a foto do tutor como referência de identidade visual.
Mantenha fidelidade facial e características principais dos dois sujeitos.
O gato se chama ${petName}.
Raça/aparência: ${breed}.
Estilo/preset: ${preset}.
Clima: emocional, bonito, bem iluminado, composição cinematográfica.
Evitar membros extras, rostos duplicados, distorções, texto, moldura e marca d'água.
${userPrompt ? `Direção extra do usuário: ${userPrompt}` : ''}
`.trim();
    }

    if (params.moduleKey === 'portrait') {
      return `
Crie um portrait premium do gato.
Use a foto do gato como referência visual principal.
O gato se chama ${petName}.
Raça/aparência: ${breed}.
Estilo/preset: ${preset}.
Retrato elegante, bem iluminado, detalhes nítidos da pelagem, fundo harmonioso.
Evitar olhos duplicados, orelhas duplicadas, distorções, texto, moldura e marca d'água.
${userPrompt ? `Direção extra do usuário: ${userPrompt}` : ''}
`.trim();
    }

    return `
Crie um sticker estilizado do gato.
Use a foto do gato como referência visual principal.
O gato se chama ${petName}.
Raça/aparência: ${breed}.
Sticker limpo, contorno bonito, leitura fácil, visual fofo e expressivo.
Evitar duplicações, distorções, texto, fundo poluído e marca d'água.
${userPrompt ? `Direção extra do usuário: ${userPrompt}` : ''}
`.trim();
  }

  async generate(input: GenerateStudioInput) {
    const moduleKey = this.normalizeModule(input.moduleKey || input.module);
    const config = this.moduleConfig[moduleKey];
    const pet = await this.ensurePetOwnership(input.userId, input.petId);

    if (moduleKey === 'tutor-cat') {
      if (!input.originalPhotoUrl) {
        throw new BadRequestException('originalPhotoUrl é obrigatório para Tutor + Gato.');
      }
      if (!input.tutorPhotoUrl) {
        throw new BadRequestException('tutorPhotoUrl é obrigatório para Tutor + Gato.');
      }
    }

    const sourceImages = [
      ...(input.sourceImageUrls || []),
      ...(input.originalPhotoUrl ? [input.originalPhotoUrl] : []),
      ...(input.tutorPhotoUrl ? [input.tutorPhotoUrl] : []),
    ].filter(Boolean);

    const rawPrompt = this.buildModulePrompt({
      moduleKey,
      petName: pet?.name,
      breed: pet?.breed,
      preset: input.preset,
      userPrompt: input.prompt,
    });

    const expandedPrompt = await this.studioAiService.expandPrompt(rawPrompt);

    let generatedImageUrl: string | null = null;
    let aiMeta: Record<string, any> = {};

    if (moduleKey === 'tutor-cat') {
      const aiResult = await this.studioAiService.generateTutorCatImage({
        prompt: expandedPrompt,
        originalPhotoUrl: input.originalPhotoUrl!,
        tutorPhotoUrl: input.tutorPhotoUrl!,
      });

      generatedImageUrl = aiResult.resultUrl;
      aiMeta = {
        provider: aiResult.provider,
        model: aiResult.model ?? null,
        mimeType: aiResult.mimeType ?? null,
      };
    } else {
      const fallbackOriginal =
        input.originalPhotoUrl || sourceImages[0] || pet?.photoUrl || null;

      if (!fallbackOriginal) {
        throw new BadRequestException('Nenhuma imagem base encontrada para este módulo.');
      }

      const aiResult = await this.studioAiService.generate({
        moduleKey,
        prompt: expandedPrompt,
        originalPhotoUrl: fallbackOriginal,
        tutorPhotoUrl:
          moduleKey === 'portrait' ? undefined : input.tutorPhotoUrl || undefined,
      });

      generatedImageUrl = aiResult.previewUrl;
      aiMeta = {
        provider: aiResult.provider,
        model: aiResult.model ?? null,
        mimeType: aiResult.mimeType ?? null,
      };
    }

    if (!generatedImageUrl) {
      throw new BadRequestException('A IA não retornou imagem.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const creation = await tx.studioCreation.create({
        data: {
          userId: input.userId,
          petId: pet?.id ?? null,
          type: config.studioType,
          moduleKey,
          moduleLabel: config.title,
          prompt: expandedPrompt,
          originalPhotoUrl: input.originalPhotoUrl ?? sourceImages[0] ?? null,
          sourceImageUrls: sourceImages,
          outputImageUrl: generatedImageUrl,
          previewUrl: generatedImageUrl,
          status: 'COMPLETED',
          metadata: {
            ...(input.metadata || {}),
            ...aiMeta,
            moduleKey,
            preset: input.preset ?? null,
            tutorPhotoUrl: input.tutorPhotoUrl ?? null,
            generatedBy: 'studio',
          },
        },
      });

      const spending = await this.consumePoints(tx, {
        userId: input.userId,
        role: input.role,
        amount: config.costPoints,
        petId: pet?.id ?? null,
        action: 'STUDIO_GENERATION_COST',
        metadata: {
          moduleKey,
          studioCreationId: creation.id,
        },
      });

      const rewards = await this.applyRewards(tx, {
        userId: input.userId,
        petId: pet?.id ?? null,
        xpt: config.xptReward,
        xpg: config.xpgReward,
        action: 'STUDIO_GENERATION_REWARD',
        metadata: {
          moduleKey,
          studioCreationId: creation.id,
        },
      });

      const userWallet = await tx.user.findUnique({
        where: { id: input.userId },
        select: {
          gatedoPoints: true,
          xpt: true,
          level: true,
        },
      });

      const petWallet = pet?.id
        ? await tx.pet.findUnique({
            where: { id: pet.id },
            select: {
              xpg: true,
            },
          })
        : null;

      return {
        creation,
        spending,
        rewards,
        userWallet,
        petWallet,
      };
    });

    return {
      ok: true,
      creation: {
        id: result.creation.id,
        resultUrl: result.creation.outputImageUrl,
        outputImageUrl: result.creation.outputImageUrl,
        previewUrl: result.creation.previewUrl,
        prompt: result.creation.prompt,
        status: result.creation.status,
      },
      reward: {
        gptsDelta: -result.spending.pointsSpent,
        xptDelta: result.rewards.xptGranted,
        xpgDelta: result.rewards.xpgGranted,
      },
      wallet: {
        gatedoPoints: result.userWallet?.gatedoPoints ?? 0,
        xpt: result.userWallet?.xpt ?? 0,
        xpg: result.petWallet?.xpg ?? null,
      },
      frontend: {
        id: result.creation.id,
        studioCreationId: result.creation.id,
        module: result.creation.moduleKey,
        title: result.creation.moduleLabel,
        previewUrl: result.creation.previewUrl,
        assetUrl: result.creation.outputImageUrl,
        prompt: result.creation.prompt,
        petId: result.creation.petId,
        status: result.creation.status,
        canPublish: true,
        createdAt: result.creation.createdAt.toISOString(),
      },
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.studioCreation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      },
    });
  }

  async findOneById(userId: string, creationId: string) {
    const creation = await this.prisma.studioCreation.findFirst({
      where: {
        id: creationId,
        userId,
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!creation) {
      throw new NotFoundException('StudioCreation não encontrada.');
    }

    return creation;
  }

  async attachCreationToPetGallery(params: {
    userId: string;
    studioCreationId: string;
    petId: string;
  }) {
    const pet = await this.ensurePetOwnership(params.userId, params.petId);

    const creation = await this.prisma.studioCreation.findFirst({
      where: {
        id: params.studioCreationId,
        userId: params.userId,
      },
    });

    if (!creation) {
      throw new NotFoundException('Criação do Studio não encontrada.');
    }

    const updated = await this.prisma.studioCreation.update({
      where: { id: creation.id },
      data: {
        petId: pet?.id ?? null,
        addedToPetGalleryAt: new Date(),
      },
    });

    return { ok: true, creation: updated };
  }

  async markPublished(params: {
    userId: string;
    studioCreationId: string;
    socialPostId: string;
  }) {
    const creation = await this.prisma.studioCreation.findFirst({
      where: {
        id: params.studioCreationId,
        userId: params.userId,
      },
    });

    if (!creation) {
      throw new NotFoundException('Criação do Studio não encontrada.');
    }

    const updated = await this.prisma.studioCreation.update({
      where: { id: creation.id },
      data: {
        publishedAt: new Date(),
        status: 'PUBLISHED',
      },
    });

    return { ok: true, creation: updated };
  }
}