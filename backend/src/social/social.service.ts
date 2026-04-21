import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostVisibility, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const XP_TO_PUBLISH = 100;
const COST_PUBLISH_NORMAL = 5;
const COST_PUBLISH_EXTERNAL = 10;
const COST_LIKE = 0;
const COST_SAVE = 0;

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user: any) {
    return (
      user?.role === Role.ADMIN ||
      user?.role === 'ADMIN' ||
      user?.role === 'TESTER_VIP'
    );
  }

  private normalizeFeedPost(post: any, currentUserId?: string) {
    return {
      ...post,
      likedByMe: Array.isArray(post.likedBy)
        ? post.likedBy.some((item: any) => item.userId === currentUserId)
        : false,
      savedByMe: Array.isArray(post.savedBy)
        ? post.savedBy.some((item: any) => item.userId === currentUserId)
        : false,
      likesCount:
        typeof post.likes === 'number' ? post.likes : post.likedBy?.length || 0,
      commentsCount:
        typeof post.commentsCount === 'number'
          ? post.commentsCount
          : post.comments?.length || 0,
      savesCount:
        typeof post.savesCount === 'number'
          ? post.savesCount
          : post.savedBy?.length || 0,
    };
  }

  private normalizeComment(comment: any, currentUserId?: string) {
    return {
      ...comment,
      isMine: comment?.userId === currentUserId,
      author: {
        id: comment?.user?.id,
        name: comment?.user?.name || 'Tutor',
        avatar: comment?.user?.photoUrl || '/placeholder-user.png',
      },
    };
  }

  private async getWalletState(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xpt: true,
        gatedoPoints: true,
        level: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      xp: user.xpt || 0,
      balance: user.gatedoPoints || 0,
      user,
    };
  }

  private publishCostBySource(source?: string | null) {
    if (source === 'external' || source === 'EXTERNAL_UPLOAD') {
      return COST_PUBLISH_EXTERNAL;
    }

    if (
      source === 'internal' ||
      source === 'studio' ||
      source === 'manual' ||
      source === 'health' ||
      source === 'INTERNAL_GALLERY' ||
      source === 'STUDIO_CREATION'
    ) {
      return COST_PUBLISH_NORMAL;
    }

    return 0;
  }

  async getPosts(currentUser: any, params: any = {}) {
    const visibility = params.visibility as PostVisibility | undefined;

    const posts = await this.prisma.post.findMany({
      where: {
        ...(visibility ? { visibility } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        pet: true,
        comments: true,
        ...(currentUser?.id
          ? { likedBy: { where: { userId: currentUser.id } } }
          : {}),
        ...(currentUser?.id
          ? { savedBy: { where: { userId: currentUser.id } } }
          : {}),
      },
      take: 100,
    });

    return posts.map((post) => this.normalizeFeedPost(post, currentUser?.id));
  }

  async getCommunityCats(currentUser: any, query: any = {}) {
    const q = String(query?.q || '').trim();
    const race = String(query?.race || '').trim();
    const city = String(query?.city || '').trim();
    const sex = String(query?.sex || '').trim();
    const sort = String(query?.sort || 'newest').trim();
    const onlyFollowing =
      String(query?.scope || '').trim().toLowerCase() === 'following';

    let followedPetIds: string[] = [];

    if (onlyFollowing && currentUser?.id) {
      try {
        const followed = await (this.prisma as any).petFollower.findMany({
          where: { userId: currentUser.id },
          select: { petId: true },
        });
        followedPetIds = followed.map((item: any) => item.petId);
      } catch {
        followedPetIds = [];
      }

      if (!followedPetIds.length) return [];
    }

const where: any = {
  isArchived: false,
  deathDate: null,
  isMemorial: false,

  ...(onlyFollowing ? { id: { in: followedPetIds } } : {}),

  ...(race
    ? { breed: { equals: race, mode: 'insensitive' } }
    : {}),

  ...(city
    ? { city: { equals: city, mode: 'insensitive' } }
    : {}),

  ...(sex
    ? { gender: { equals: sex as any } }
    : {}),

  ...(q
    ? {
        OR: [
          { id: { contains: q } },
          { name: { contains: q, mode: 'insensitive' } },
          { nicknames: { contains: q, mode: 'insensitive' } },
          { breed: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}),
};


    const orderBy =
      sort === 'name'
        ? { name: 'asc' as const }
        : sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : { createdAt: 'desc' as const };

    const petsRaw = await this.prisma.pet.findMany({
      where,
      orderBy,
      take: 200,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      } as any,
    });

    const pets = petsRaw as any[];

    const petIds = pets.map((pet) => pet.id);

    let rewardAgg = new Map<string, { xpg: number; xp: number }>();
    if (petIds.length) {
      try {
        const rewards = await this.prisma.rewardEvent.findMany({
          where: { petId: { in: petIds } },
          select: {
            petId: true,
            xpgDelta: true,
            xptDelta: true,
          },
        });

        rewardAgg = rewards.reduce((acc, item: any) => {
          const key = item.petId;
          const current = acc.get(key) || { xpg: 0, xp: 0 };
          current.xpg += Number(item?.xpgDelta || 0);
          current.xp += Number(item?.xptDelta || 0);
          acc.set(key, current);
          return acc;
        }, new Map<string, { xpg: number; xp: number }>());
      } catch {
        rewardAgg = new Map();
      }
    }

    let followersCountMap = new Map<string, number>();
    if (petIds.length) {
      try {
        const grouped = await (this.prisma as any).petFollower.groupBy({
          by: ['petId'],
          where: { petId: { in: petIds } },
          _count: { petId: true },
        });

        followersCountMap = grouped.reduce((acc: Map<string, number>, item: any) => {
          acc.set(item.petId, Number(item?._count?.petId || 0));
          return acc;
        }, new Map<string, number>());
      } catch {
        followersCountMap = new Map();
      }
    }

    let followedByMeSet = new Set<string>();
    if (currentUser?.id && petIds.length) {
      try {
        const followedByMe = await (this.prisma as any).petFollower.findMany({
          where: {
            userId: currentUser.id,
            petId: { in: petIds },
          },
          select: { petId: true },
        });

        followedByMeSet = new Set(
          followedByMe.map((item: any) => item.petId),
        );
      } catch {
        followedByMeSet = new Set();
      }
    }

    const postsCountMap = new Map<string, number>();
    if (petIds.length) {
      const postsGrouped = await this.prisma.post.groupBy({
        by: ['petId'],
        where: {
          petId: { in: petIds },
          visibility: PostVisibility.PUBLIC,
        },
        _count: { petId: true },
      });

      postsGrouped.forEach((item: any) => {
        postsCountMap.set(item.petId, Number(item?._count?.petId || 0));
      });
    }

    return pets.map((pet: any) => {
      const reward = rewardAgg.get(pet.id) || { xpg: 0, xp: 0 };

      return {
        id: pet.id,
        name: pet.name,
        nickname: pet.nicknames || null,
        breed: pet.breed || 'SRD',
        city: pet.city || null,
        sex: pet.gender || null,
        ageYears: pet.ageYears || null,
        ageMonths: pet.ageMonths || null,
        birthDate: pet.birthDate || null,
        photoUrl: pet.photoUrl || null,
        createdAt: pet.createdAt,
        owner: {
          id: pet.owner?.id || null,
          name: pet.owner?.name || 'Tutor',
          photoUrl: pet.owner?.photoUrl || null,
        },
        tutorName: pet.owner?.name || 'Tutor',
        tutorAvatar: pet.owner?.photoUrl || null,
        xpg: reward.xpg,
        xp: reward.xp,
        followersCount: followersCountMap.get(pet.id) || 0,
        postsCount: postsCountMap.get(pet.id) || 0,
        followedByMe: followedByMeSet.has(pet.id),
      };
    });
  }

  async getPetPosts(currentUser: any, petId: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        petId,
        visibility: PostVisibility.PUBLIC,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        pet: true,
        comments: true,
        ...(currentUser?.id
          ? { likedBy: { where: { userId: currentUser.id } } }
          : {}),
        ...(currentUser?.id
          ? { savedBy: { where: { userId: currentUser.id } } }
          : {}),
      },
    });

    return posts.map((post) => this.normalizeFeedPost(post, currentUser?.id));
  }

  async getPostComments(currentUser: any, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        allowComments: true,
      },
    });

    if (!post) throw new NotFoundException('Post não encontrado');

    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
      },
      take: 100,
    });

    return {
      ok: true,
      allowComments: post.allowComments,
      comments: comments.map((comment) =>
        this.normalizeComment(comment, currentUser?.id),
      ),
    };
  }

  async addComment(currentUser: any, postId: string, body: any) {
    if (!currentUser?.id) throw new ForbiddenException('Usuário não autenticado');

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
        pet: true,
      },
    });

    if (!post) throw new NotFoundException('Post não encontrado');
    if (!post.allowComments) {
      throw new BadRequestException('Comentários desativados neste post');
    }

    const content = String(body?.content || '').trim();
    if (!content) throw new BadRequestException('Digite um comentário');
    if (content.length > 500) {
      throw new BadRequestException('Comentário muito longo');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          postId,
          userId: currentUser.id,
          content,
        },
        include: {
          user: true,
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: {
          commentsCount: { increment: 1 },
        },
      });

      await tx.rewardEvent.create({
        data: {
          userId: currentUser.id,
          petId: post.petId,
          action: 'COMMUNITY_COMMENT',
          xptDelta: 2,
          xpgDelta: 1,
          gptsDelta: 0,
          metadata: {
            postId,
          },
        },
      });

      return comment;
    });

    return {
      ok: true,
      comment: this.normalizeComment(result, currentUser.id),
      commentsCount: (post.commentsCount || 0) + 1,
    };
  }

  async getPetProfile(currentUser: any, petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: {
        owner: true,
        followers: true,
      } as any,
    });

    if (!pet) throw new NotFoundException('Pet não encontrado');

    const posts = await this.getPetPosts(currentUser, petId);

    return {
      ...pet,
      socialStats: {
        followers: (pet as any).followers?.length || 0,
        posts: posts.length,
      },
      posts,
    };
  }

  async getPetAssets(currentUser: any, petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: { owner: true } as any,
    });

    if (!pet) throw new NotFoundException('Pet não encontrado');

    if (!this.isAdmin(currentUser) && (pet as any).ownerId !== currentUser?.id) {
      throw new ForbiddenException('Você não pode acessar os assets deste gato');
    }

    const gallery = ((pet as any).gallery || []).slice(0, 9).map((url: string, index: number) => ({
      id: `gallery_${index}`,
      imageUrl: url,
      videoUrl: null,
      label: `Galeria ${index + 1}`,
      type: 'internal',
      petId: (pet as any).id,
    }));

    const studio = await this.prisma.studioCreation.findMany({
      where: {
        userId: currentUser.id,
        OR: [{ petId }, { petId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    });

    return {
      gallery,
      studio: studio.map((item) => ({
        id: item.id,
        imageUrl:
          item.outputImageUrl || item.previewUrl || item.originalPhotoUrl || null,
        videoUrl: item.outputVideoUrl || null,
        label: item.moduleLabel || item.moduleKey || item.type,
        type: 'studio',
        petId: item.petId,
        studioCreationId: item.id,
        createdAt: item.createdAt,
        status: item.status,
      })),
    };
  }

  async createPost(currentUser: any, body: any) {
    if (!currentUser?.id) throw new ForbiddenException('Usuário não autenticado');

    const pet = await this.prisma.pet.findUnique({
      where: { id: body.petId },
    });

if (body.source === 'STUDIO_CREATION' && !body.studioCreationId) {
  throw new BadRequestException(
    'studioCreationId obrigatório para posts do Studio'
  );
}

    if (!pet) throw new NotFoundException('Pet não encontrado');

    if (!this.isAdmin(currentUser) && (pet as any).ownerId !== currentUser.id) {
      throw new ForbiddenException(
        'Você só pode publicar com um gato do seu perfil',
      );
    }

    const content = String(body.content || '').trim();
    const source = body.source || (body.studioCreationId ? 'studio' : 'manual');

    let imageUrl = body.imageUrl || null;
    let videoUrl = body.videoUrl || null;
    let resolvedStudioCreationId = body.studioCreationId || null;

    if (
      (source === 'studio' || source === 'STUDIO_CREATION') &&
      resolvedStudioCreationId
    ) {
      const creation = await this.prisma.studioCreation.findUnique({
        where: { id: resolvedStudioCreationId },
      });

      if (!creation) {
        throw new BadRequestException('Criação do Studio não encontrada');
      }

      if (!this.isAdmin(currentUser) && creation.userId !== currentUser.id) {
        throw new ForbiddenException(
          'Esta criação do Studio não pertence ao usuário atual',
        );
      }

      imageUrl =
        imageUrl ||
        creation.outputImageUrl ||
        creation.previewUrl ||
        creation.originalPhotoUrl ||
        null;

      videoUrl = videoUrl || creation.outputVideoUrl || null;
    }

    if (!content && !imageUrl && !videoUrl) {
      throw new BadRequestException(
        'A publicação precisa ter texto, imagem ou vídeo',
      );
    }

    const cost = this.publishCostBySource(source);
    const isAdmin = this.isAdmin(currentUser);
    const wallet = await this.getWalletState(currentUser.id);

    if (!isAdmin && wallet.xp < XP_TO_PUBLISH) {
      throw new BadRequestException(
        `Você precisa de pelo menos ${XP_TO_PUBLISH} XP para publicar`,
      );
    }

    if (!isAdmin && wallet.balance < cost) {
      throw new BadRequestException(
        `Saldo insuficiente para publicar. Necessário: ${cost} points.`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (!isAdmin && cost > 0) {
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            gatedoPoints: {
              decrement: cost,
            },
          },
        });
      }

      const post = await tx.post.create({
        data: {
          userId: currentUser.id,
          petId: body.petId,
          type: body.type || (videoUrl ? 'VIDEO' : 'PHOTO'),
          source,
          visibility: body.visibility || PostVisibility.PUBLIC,
          content,
          imageUrl,
          allowComments: body.allowComments ?? true,
          allowShare: body.allowShare ?? true,
          studioCreationId: resolvedStudioCreationId,
        },
        include: {
          user: true,
          pet: true,
          comments: true,
          ...(currentUser?.id
            ? { likedBy: { where: { userId: currentUser.id } } }
            : {}),
          ...(currentUser?.id
            ? { savedBy: { where: { userId: currentUser.id } } }
            : {}),
        },
      });

      await tx.rewardEvent.create({
        data: {
          userId: currentUser.id,
          petId: body.petId,
          action: 'COMMUNITY_POST',
          xptDelta: 6,
          xpgDelta: 3,
          gptsDelta: 0,
          metadata: {
            postId: post.id,
            source,
            petId: body.petId,
            studioCreationId: resolvedStudioCreationId,
            videoUrl: videoUrl || null,
          },
        },
      });

      if (!isAdmin && cost > 0) {
        await tx.balanceAdjustmentLog.create({
          data: {
            userId: currentUser.id,
            actorId: currentUser.id,
            walletDelta: -cost,
            xpDelta: 0,
            reason: `Publicação social (${source})`,
          },
        });
      }

      if (resolvedStudioCreationId) {
        await tx.studioCreation.update({
          where: { id: resolvedStudioCreationId },
          data: {
            publishedAt: new Date(),
            status: 'PUBLISHED',
          },
        });
      }

      return post;
    });

    return {
      ok: true,
      bypass: isAdmin,
      chargedPoints: isAdmin ? 0 : cost,
      post: this.normalizeFeedPost(result, currentUser.id),
    };
  }

  private async assertWalletForReaction(currentUser: any, cost: number) {
    if (this.isAdmin(currentUser) || cost <= 0) return;

    const wallet = await this.getWalletState(currentUser.id);
    if (wallet.balance < cost) {
      throw new BadRequestException(
        `Saldo insuficiente. Necessário: ${cost} points.`,
      );
    }
  }

  async likePost(currentUser: any, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post não encontrado');

    const existing = await this.prisma.postLike.findFirst({
      where: { postId, userId: currentUser.id },
    });

    if (existing) return { ok: true, likesCount: (post as any).likes };

    await this.assertWalletForReaction(currentUser, COST_LIKE);

    const isAdmin = this.isAdmin(currentUser);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postLike.create({
        data: { postId, userId: currentUser.id },
      });

      const postUpdated = await tx.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
      });

      await tx.rewardEvent.create({
        data: {
          userId: currentUser.id,
          petId: (post as any).petId,
          action: 'COMMUNITY_LIKE',
          xptDelta: 0,
          xpgDelta: 1,
          gptsDelta: 0,
          metadata: { postId },
        },
      });

      if (!isAdmin && COST_LIKE > 0) {
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            gatedoPoints: {
              decrement: COST_LIKE,
            },
          },
        });

        await tx.balanceAdjustmentLog.create({
          data: {
            userId: currentUser.id,
            actorId: currentUser.id,
            walletDelta: -COST_LIKE,
            xpDelta: 0,
            reason: 'Curtir post social',
          },
        });
      }

      return postUpdated;
    });

    return { ok: true, likesCount: (updated as any).likes };
  }

  async unlikePost(currentUser: any, postId: string) {
    const existing = await this.prisma.postLike.findFirst({
      where: { postId, userId: currentUser.id },
    });

    if (!existing) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      return { ok: true, likesCount: (post as any)?.likes || 0 };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postLike.delete({ where: { id: existing.id } });

      return tx.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } },
      });
    });

    return { ok: true, likesCount: Math.max(0, (updated as any).likes) };
  }

  async savePost(currentUser: any, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');

    const existing = await this.prisma.postSave.findFirst({
      where: { postId, userId: currentUser.id },
    });

    if (existing) return { ok: true, savesCount: (post as any).savesCount };

    await this.assertWalletForReaction(currentUser, COST_SAVE);

    const isAdmin = this.isAdmin(currentUser);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postSave.create({
        data: { postId, userId: currentUser.id },
      });

      const postUpdated = await tx.post.update({
        where: { id: postId },
        data: { savesCount: { increment: 1 } },
      });

      await tx.rewardEvent.create({
        data: {
          userId: currentUser.id,
          petId: (post as any).petId,
          action: 'COMMUNITY_SAVE',
          xptDelta: 0,
          xpgDelta: 1,
          gptsDelta: 0,
          metadata: { postId },
        },
      });

      if (!isAdmin && COST_SAVE > 0) {
        await tx.user.update({
          where: { id: currentUser.id },
          data: {
            gatedoPoints: {
              decrement: COST_SAVE,
            },
          },
        });

        await tx.balanceAdjustmentLog.create({
          data: {
            userId: currentUser.id,
            actorId: currentUser.id,
            walletDelta: -COST_SAVE,
            xpDelta: 0,
            reason: 'Salvar post social',
          },
        });
      }

      return postUpdated;
    });

    return { ok: true, savesCount: (updated as any).savesCount };
  }

  async unsavePost(currentUser: any, postId: string) {
    const existing = await this.prisma.postSave.findFirst({
      where: { postId, userId: currentUser.id },
    });

    if (!existing) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      return { ok: true, savesCount: (post as any)?.savesCount || 0 };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postSave.delete({ where: { id: existing.id } });

      return tx.post.update({
        where: { id: postId },
        data: { savesCount: { decrement: 1 } },
      });
    });

    return { ok: true, savesCount: Math.max(0, (updated as any).savesCount) };
  }

  async searchUsers(currentUser: any, query: string) {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('Apenas ADMIN');
    }

    const q = (query || '').trim();
    if (!q) return [];

    return this.prisma.user.findMany({
      where: {
        OR: [
          { id: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        photoUrl: true,
        role: true,
        xpt: true,
        gatedoPoints: true,
        level: true,
        createdAt: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  async adjustBalance(currentUser: any, body: any) {
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('Apenas ADMIN');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          body.userId ? { id: body.userId } : undefined,
          body.email ? { email: body.email } : undefined,
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
        email: true,
        name: true,
        xpt: true,
        gatedoPoints: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const xpDelta = Number(body.xpDelta || 0);
    const walletDelta = Number(body.walletDelta ?? body.pointsDelta ?? 0);

    if (!xpDelta && !walletDelta) {
      throw new BadRequestException('Informe ao menos xpDelta ou walletDelta');
    }

    const nextXp = (user.xpt || 0) + xpDelta;
    const nextWallet = (user.gatedoPoints || 0) + walletDelta;

    if (nextXp < 0) {
      throw new BadRequestException('O ajuste deixaria XP negativo');
    }

    if (nextWallet < 0) {
      throw new BadRequestException('O ajuste deixaria saldo negativo');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          ...(xpDelta !== 0
            ? {
                xpt: {
                  increment: xpDelta,
                },
              }
            : {}),
          ...(walletDelta !== 0
            ? {
                gatedoPoints: {
                  increment: walletDelta,
                },
              }
            : {}),
        },
      });

      await tx.balanceAdjustmentLog.create({
        data: {
          userId: user.id,
          actorId: currentUser.id,
          walletDelta,
          xpDelta,
          reason: body.reason || 'Ajuste manual ADMIN',
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          photoUrl: true,
          role: true,
          xpt: true,
          gatedoPoints: true,
          level: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return { ok: true, user: updated };
  }
}