import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostVisibility, Role } from '@prisma/client';

const XP_TO_PUBLISH = 100;
const COST_PUBLISH_NORMAL = 5;
const COST_PUBLISH_EXTERNAL = 10;
const COST_LIKE = 1;
const COST_SAVE = 1;

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user: any) {
    return user?.role === Role.ADMIN || user?.role === 'ADMIN';
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
      likesCount: typeof post.likes === 'number' ? post.likes : post.likedBy?.length || 0,
      commentsCount:
        typeof post.commentsCount === 'number' ? post.commentsCount : post.comments?.length || 0,
      savesCount:
        typeof post.savesCount === 'number' ? post.savesCount : post.savedBy?.length || 0,
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
    const [tutorPoints, credits] = await Promise.all([
      this.prisma.tutorPoints.findUnique({ where: { userId } }),
      this.prisma.userCredits.findUnique({ where: { userId } }),
    ]);

    return {
      xp: tutorPoints?.totalEarned || tutorPoints?.points || 0,
      tutorPoints,
      credits,
      balance: credits?.balance || 0,
    };
  }

  private publishCostBySource(source?: string | null) {
    if (source === 'external' || source === 'EXTERNAL_UPLOAD') return COST_PUBLISH_EXTERNAL;
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
        ...(currentUser?.id ? { likedBy: { where: { userId: currentUser.id } } } : {}),
        ...(currentUser?.id ? { savedBy: { where: { userId: currentUser.id } } } : {}),
      },
      take: 100,
    });

    return posts.map((post) => this.normalizeFeedPost(post, currentUser?.id));
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
        ...(currentUser?.id ? { likedBy: { where: { userId: currentUser.id } } } : {}),
        ...(currentUser?.id ? { savedBy: { where: { userId: currentUser.id } } } : {}),
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
      comments: comments.map((comment) => this.normalizeComment(comment, currentUser?.id)),
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
    if (!post.allowComments) throw new BadRequestException('Comentários desativados neste post');

    const content = String(body?.content || '').trim();
    if (!content) throw new BadRequestException('Digite um comentário');
    if (content.length > 500) throw new BadRequestException('Comentário muito longo');

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
      },
    });

    if (!pet) throw new NotFoundException('Pet não encontrado');

    const posts = await this.getPetPosts(currentUser, petId);

    return {
      ...pet,
      socialStats: {
        followers: pet.followers?.length || 0,
        posts: posts.length,
      },
      posts,
    };
  }

  async getPetAssets(currentUser: any, petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: { owner: true },
    });

    if (!pet) throw new NotFoundException('Pet não encontrado');

    if (!this.isAdmin(currentUser) && pet.ownerId !== currentUser?.id) {
      throw new ForbiddenException('Você não pode acessar os assets deste gato');
    }

    const gallery = (pet.gallery || []).slice(0, 9).map((url, index) => ({
      id: `gallery_${index}`,
      imageUrl: url,
      label: `Galeria ${index + 1}`,
      type: 'internal',
      petId: pet.id,
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
        imageUrl: item.resultUrl,
        label: item.type,
        type: 'studio',
        petId: item.petId,
        studioCreationId: item.id,
      })),
    };
  }

  async createPost(currentUser: any, body: any) {
    if (!currentUser?.id) throw new ForbiddenException('Usuário não autenticado');

    const pet = await this.prisma.pet.findUnique({ where: { id: body.petId } });
    if (!pet) throw new NotFoundException('Pet não encontrado');

    if (!this.isAdmin(currentUser) && pet.ownerId !== currentUser.id) {
      throw new ForbiddenException('Você só pode publicar com um gato do seu perfil');
    }

    const content = (body.content || '').trim();
    const imageUrl = body.imageUrl || null;
    if (!content && !imageUrl) {
      throw new BadRequestException('A publicação precisa ter texto ou imagem');
    }

    const source = body.source || 'manual';
    const cost = this.publishCostBySource(source);
    const isAdmin = this.isAdmin(currentUser);
    const wallet = await this.getWalletState(currentUser.id);

    if (!isAdmin && wallet.xp < XP_TO_PUBLISH) {
      throw new BadRequestException(`Você precisa de pelo menos ${XP_TO_PUBLISH} XP para publicar`);
    }

    if (!isAdmin && wallet.balance < cost) {
      throw new BadRequestException(`Saldo insuficiente para publicar. Necessário: ${cost} points.`);
    }

    if (
      (source === 'studio' || source === 'STUDIO_CREATION') &&
      body.studioCreationId
    ) {
      const creation = await this.prisma.studioCreation.findUnique({
        where: { id: body.studioCreationId },
      });
      if (!creation) throw new BadRequestException('Criação do Studio não encontrada');
      if (!isAdmin && creation.userId !== currentUser.id) {
        throw new ForbiddenException('Esta criação do Studio não pertence ao usuário atual');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (!isAdmin && cost > 0) {
        await tx.userCredits.upsert({
          where: { userId: currentUser.id },
          update: {
            balance: { decrement: cost },
            totalUsed: { increment: cost },
          },
          create: {
            userId: currentUser.id,
            balance: 0,
            totalBought: 0,
            totalUsed: cost,
          },
        });
      }

      const post = await tx.post.create({
        data: {
          userId: currentUser.id,
          petId: body.petId,
          type: body.type || 'PHOTO',
          source,
          visibility: body.visibility || PostVisibility.PUBLIC,
          content,
          imageUrl,
          allowComments: body.allowComments ?? true,
          allowShare: body.allowShare ?? true,
          studioCreationId: body.studioCreationId || null,
        },
        include: {
          user: true,
          pet: true,
          comments: true,
          ...(currentUser?.id ? { likedBy: { where: { userId: currentUser.id } } } : {}),
          ...(currentUser?.id ? { savedBy: { where: { userId: currentUser.id } } } : {}),
        },
      });

      if (!isAdmin && (cost > 0 || source === 'studio' || source === 'STUDIO_CREATION')) {
        await tx.balanceAdjustmentLog.create({
          data: {
            userId: currentUser.id,
            actorId: currentUser.id,
            walletDelta: cost ? -cost : 0,
            xpDelta: 0,
            reason: `Publicação social (${source})`,
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
      throw new BadRequestException(`Saldo insuficiente. Necessário: ${cost} points.`);
    }
  }

  async likePost(currentUser: any, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');

    const existing = await this.prisma.postLike.findFirst({ where: { postId, userId: currentUser.id } });
    if (existing) return { ok: true, likesCount: post.likes };

    await this.assertWalletForReaction(currentUser, COST_LIKE);

    const isAdmin = this.isAdmin(currentUser);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postLike.create({ data: { postId, userId: currentUser.id } });
      const postUpdated = await tx.post.update({
        where: { id: postId },
        data: { likes: { increment: 1 } },
      });

      if (!isAdmin) {
        await tx.userCredits.upsert({
          where: { userId: currentUser.id },
          update: {
            balance: { decrement: COST_LIKE },
            totalUsed: { increment: COST_LIKE },
          },
          create: { userId: currentUser.id, balance: 0, totalBought: 0, totalUsed: COST_LIKE },
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

    return { ok: true, likesCount: updated.likes };
  }

  async unlikePost(currentUser: any, postId: string) {
    const existing = await this.prisma.postLike.findFirst({ where: { postId, userId: currentUser.id } });
    if (!existing) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      return { ok: true, likesCount: post?.likes || 0 };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postLike.delete({ where: { id: existing.id } });
      return tx.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } },
      });
    });

    return { ok: true, likesCount: Math.max(0, updated.likes) };
  }

  async savePost(currentUser: any, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');

    const existing = await this.prisma.postSave.findFirst({ where: { postId, userId: currentUser.id } });
    if (existing) return { ok: true, savesCount: post.savesCount };

    await this.assertWalletForReaction(currentUser, COST_SAVE);

    const isAdmin = this.isAdmin(currentUser);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postSave.create({ data: { postId, userId: currentUser.id } });
      const postUpdated = await tx.post.update({
        where: { id: postId },
        data: { savesCount: { increment: 1 } },
      });

      if (!isAdmin) {
        await tx.userCredits.upsert({
          where: { userId: currentUser.id },
          update: {
            balance: { decrement: COST_SAVE },
            totalUsed: { increment: COST_SAVE },
          },
          create: { userId: currentUser.id, balance: 0, totalBought: 0, totalUsed: COST_SAVE },
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

    return { ok: true, savesCount: updated.savesCount };
  }

  async unsavePost(currentUser: any, postId: string) {
    const existing = await this.prisma.postSave.findFirst({ where: { postId, userId: currentUser.id } });
    if (!existing) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      return { ok: true, savesCount: post?.savesCount || 0 };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.postSave.delete({ where: { id: existing.id } });
      return tx.post.update({
        where: { id: postId },
        data: { savesCount: { decrement: 1 } },
      });
    });

    return { ok: true, savesCount: Math.max(0, updated.savesCount) };
  }

  async searchUsers(currentUser: any, query: string) {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('Apenas ADMIN');

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
      include: {
        tutorPoints: true,
        credits: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  async adjustBalance(currentUser: any, body: any) {
    if (!this.isAdmin(currentUser)) throw new ForbiddenException('Apenas ADMIN');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          body.userId ? { id: body.userId } : undefined,
          body.email ? { email: body.email } : undefined,
        ].filter(Boolean) as any,
      },
      include: {
        tutorPoints: true,
        credits: true,
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const xpDelta = Number(body.xpDelta || 0);
    const walletDelta = Number(body.walletDelta ?? body.pointsDelta ?? 0);
    if (!xpDelta && !walletDelta) {
      throw new BadRequestException('Informe ao menos xpDelta ou walletDelta');
    }

    const nextXp = (user.tutorPoints?.points || 0) + xpDelta;
    const nextWallet = (user.credits?.balance || 0) + walletDelta;

    if (nextXp < 0) throw new BadRequestException('O ajuste deixaria XP negativo');
    if (nextWallet < 0) throw new BadRequestException('O ajuste deixaria saldo negativo');

    const updated = await this.prisma.$transaction(async (tx) => {
      if (xpDelta !== 0) {
        await tx.tutorPoints.upsert({
          where: { userId: user.id },
          update: {
            points: { increment: xpDelta },
            totalEarned: xpDelta > 0 ? { increment: xpDelta } : undefined,
            lastActionAt: new Date(),
          },
          create: {
            userId: user.id,
            points: Math.max(0, xpDelta),
            totalEarned: Math.max(0, xpDelta),
            lastActionAt: new Date(),
          },
        });
      }

      if (walletDelta !== 0) {
        await tx.userCredits.upsert({
          where: { userId: user.id },
          update: {
            balance: { increment: walletDelta },
            totalBought: walletDelta > 0 ? { increment: walletDelta } : undefined,
            totalUsed: walletDelta < 0 ? { increment: Math.abs(walletDelta) } : undefined,
          },
          create: {
            userId: user.id,
            balance: Math.max(0, walletDelta),
            totalBought: Math.max(0, walletDelta),
            totalUsed: walletDelta < 0 ? Math.abs(walletDelta) : 0,
          },
        });
      }

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
        include: { tutorPoints: true, credits: true },
      });
    });

    return { ok: true, user: updated };
  }
}