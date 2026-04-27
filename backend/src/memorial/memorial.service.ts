import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AuthUser = {
  id: string;
  role?: string;
};

function toDateOnlySafe(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00.000Z`);
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

@Injectable()
export class MemorialService {
  constructor(private readonly prisma: PrismaService) {}

  private getBirthYearFromPet(pet: any): string | null {
    if (pet?.birthDate) {
      const d = new Date(pet.birthDate);
      if (!isNaN(d.getTime())) return String(d.getFullYear());
    }

    if (pet?.ageYears !== null && pet?.ageYears !== undefined) {
      const currentYear = new Date().getFullYear();
      const estimated = currentYear - Number(pet.ageYears);
      if (!isNaN(estimated)) return String(estimated);
    }

    return null;
  }

  private getDeathYearFromPet(pet: any): string | null {
    if (pet?.deathDate) {
      const d = new Date(pet.deathDate);
      if (!isNaN(d.getTime())) return String(d.getFullYear());
    }

    return null;
  }

  async listTributes() {
    const [tributes, memorialPetsWithoutTribute] = await Promise.all([
      this.prisma.memorialTribute.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
          pet: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.pet.findMany({
        where: {
          OR: [
            { isMemorial: true },
            { isArchived: true },
            { deathDate: { not: null } },
          ],
          memorial: null,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const tributeItems = tributes
      .filter((tribute) => tribute.pet)
      .map((tribute) => ({
        id: tribute.id,
        userId: tribute.userId,
        petId: tribute.petId,
        name: tribute.name || tribute.pet?.name || 'Gatinho',
        title: tribute.title,
        isPublic: tribute.isPublic,
        birthYear: tribute.birthYear || this.getBirthYearFromPet(tribute.pet),
        deathYear: tribute.deathYear || this.getDeathYearFromPet(tribute.pet),
        message: tribute.message || '',
        photoUrl:
          tribute.photoUrl ||
          tribute.pet?.photoUrl ||
          '/assets/App_gatedo_logo1.webp',
        candleCount: tribute.candleCount ?? 0,
        createdAt: tribute.createdAt,
        user: tribute.user,
        pet: tribute.pet
          ? {
              id: tribute.pet.id,
              ownerId: tribute.pet.ownerId,
              name: tribute.pet.name,
              photoUrl: tribute.pet.photoUrl,
              gallery: tribute.pet.gallery || [],
              birthDate: tribute.pet.birthDate,
              deathDate: tribute.pet.deathDate,
              ageYears: tribute.pet.ageYears,
              ageMonths: tribute.pet.ageMonths,
              breed: tribute.pet.breed,
              bio: tribute.pet.bio,
              deathCause: tribute.pet.deathCause,
              isMemorial: tribute.pet.isMemorial,
              isArchived: tribute.pet.isArchived,
              owner: tribute.pet.owner,
            }
          : null,
        hasTribute: true,
      }));

    const fallbackItems = memorialPetsWithoutTribute.map((pet) => ({
      id: `fallback_${pet.id}`,
      userId: pet.ownerId,
      petId: pet.id,
      name: pet.name || 'Gatinho',
      title: null,
      isPublic: true,
      birthYear: this.getBirthYearFromPet(pet),
      deathYear: this.getDeathYearFromPet(pet),
      message: '',
      photoUrl: pet.photoUrl || '/assets/App_gatedo_logo1.webp',
      candleCount: 0,
      createdAt: pet.updatedAt,
      user: pet.owner,
      pet: {
        id: pet.id,
        ownerId: pet.ownerId,
        name: pet.name,
        photoUrl: pet.photoUrl,
        gallery: pet.gallery || [],
        birthDate: pet.birthDate,
        deathDate: pet.deathDate,
        ageYears: pet.ageYears,
        ageMonths: pet.ageMonths,
        breed: pet.breed,
        bio: pet.bio,
        deathCause: pet.deathCause,
        isMemorial: pet.isMemorial,
        isArchived: pet.isArchived,
        owner: pet.owner,
      },
      hasTribute: false,
    }));

    return [...tributeItems, ...fallbackItems].sort((a, b) => {
      const da = new Date(a.pet?.deathDate || a.createdAt || 0).getTime();
      const db = new Date(b.pet?.deathDate || b.createdAt || 0).getTime();
      return db - da;
    });
  }

  async getTributeByPetId(petId: string) {
    const tribute = await this.prisma.memorialTribute.findUnique({
      where: { petId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                photoUrl: true,
              },
            },
            healthRecords: {
              orderBy: { date: 'desc' },
              take: 10,
            },
            diaryEntries: {
              orderBy: { date: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!tribute || !tribute.pet) {
      throw new NotFoundException('Legado memorial não encontrado.');
    }

    return {
      id: tribute.id,
      userId: tribute.userId,
      petId: tribute.petId,
      name: tribute.name || tribute.pet.name || 'Gatinho',
      title: tribute.title,
      isPublic: tribute.isPublic,
      birthYear: tribute.birthYear || this.getBirthYearFromPet(tribute.pet),
      deathYear: tribute.deathYear || this.getDeathYearFromPet(tribute.pet),
      message: tribute.message || '',
      photoUrl:
        tribute.photoUrl ||
        tribute.pet.photoUrl ||
        '/assets/App_gatedo_logo1.webp',
      candleCount: tribute.candleCount ?? 0,
      createdAt: tribute.createdAt,
      user: tribute.user,
      pet: {
        id: tribute.pet.id,
        ownerId: tribute.pet.ownerId,
        name: tribute.pet.name,
        photoUrl: tribute.pet.photoUrl,
        gallery: tribute.pet.gallery || [],
        birthDate: tribute.pet.birthDate,
        deathDate: tribute.pet.deathDate,
        ageYears: tribute.pet.ageYears,
        ageMonths: tribute.pet.ageMonths,
        breed: tribute.pet.breed,
        bio: tribute.pet.bio,
        deathCause: tribute.pet.deathCause,
        isMemorial: tribute.pet.isMemorial,
        isArchived: tribute.pet.isArchived,
        owner: tribute.pet.owner,
      },
    };
  }

  async upsertTribute(user: AuthUser, petId: string, body: any) {
    if (!user?.id) {
      throw new BadRequestException('Usuário não autenticado.');
    }

    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: {
        owner: true,
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet não encontrado.');
    }

    const isOwner = pet.ownerId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Você não pode criar homenagem para este pet.');
    }

    const tributeName =
      String(body?.name || pet.name || '').trim() || 'Gatinho';

    const tributeMessage = String(body?.message || '').trim();

    if (!tributeMessage) {
      throw new BadRequestException('A mensagem da homenagem é obrigatória.');
    }

    const tributePhotoUrl =
      String(body?.photoUrl || '').trim() || pet.photoUrl || null;

    const birthYear =
      body?.birthYear !== undefined &&
      body?.birthYear !== null &&
      String(body.birthYear).trim() !== ''
        ? String(body.birthYear).trim()
        : this.getBirthYearFromPet(pet);

    const deathYear =
      body?.deathYear !== undefined &&
      body?.deathYear !== null &&
      String(body.deathYear).trim() !== ''
        ? String(body.deathYear).trim()
        : this.getDeathYearFromPet(pet);

    const tributeTitle =
      body?.title !== undefined &&
      body?.title !== null &&
      String(body.title).trim() !== ''
        ? String(body.title).trim()
        : null;

    const isPublic =
      body?.isPublic === undefined || body?.isPublic === null
        ? true
        : body.isPublic === true || body.isPublic === 'true';

    await this.prisma.pet.update({
      where: { id: petId },
      data: {
        isMemorial: true,
        isArchived: true,
        deathDate:
          body?.deathDate !== undefined
            ? body.deathDate
              ? toDateOnlySafe(body.deathDate)
              : null
            : pet.deathDate,
      },
    });

    const tribute = await this.prisma.memorialTribute.upsert({
      where: { petId },
      update: {
        name: tributeName,
        title: tributeTitle,
        message: tributeMessage,
        photoUrl: tributePhotoUrl,
        birthYear,
        deathYear,
        isPublic,
      },
      create: {
        userId: pet.ownerId,
        petId,
        name: tributeName,
        title: tributeTitle,
        message: tributeMessage,
        photoUrl: tributePhotoUrl,
        birthYear,
        deathYear,
        isPublic,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      tribute: {
        id: tribute.id,
        userId: tribute.userId,
        petId: tribute.petId,
        name: tribute.name,
        title: tribute.title,
        isPublic: tribute.isPublic,
        birthYear: tribute.birthYear,
        deathYear: tribute.deathYear,
        message: tribute.message,
        photoUrl: tribute.photoUrl,
        candleCount: tribute.candleCount,
        createdAt: tribute.createdAt,
        user: tribute.user,
        pet: tribute.pet,
      },
    };
  }
}
