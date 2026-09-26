import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors, Req, Query, UseGuards } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { CloudflareService } from '../cloudflare/cloudflare.service';
import { Express } from 'express';
import 'multer';
import { calcCatLevelMeta } from '../gamification/gamification.constants';
import { getUserEntitlements } from '../membership/membership.constants';
import { GamificationIntegration } from '../gamification/gamification.integration';
import { isProfileComplete } from '../gamification/xp.config';
import { EventsService } from '../events/events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertOwnsPet } from '../common/ownership.util';

@Controller('pets')
export class PetsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudflare: CloudflareService,
    private readonly gamif: GamificationIntegration,
    private readonly events: EventsService,
  ) {}

  private parseStringArray(value: any): string[] | undefined {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean).map((item) => String(item));
        }
      } catch {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return [];
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: any, @Query('scope') scope?: string) {
    const authUser = req.user;

    // Seleção enxuta — só os campos que o status de saúde (verde/âmbar/vermelho)
    // da Home precisa, sem trazer o histórico inteiro de healthRecords.
    const healthRecordsStatusSelect = {
      select: {
        type: true,
        title: true,
        date: true,
        nextDueDate: true,
      },
      orderBy: { date: 'desc' as const },
    };

    if (authUser.role === 'ADMIN' && scope === 'admin') {
      return this.prisma.pet.findMany({
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              photoUrl: true,
              tutorTitle: true,
              plan: true,
              role: true,
              badges: true,
            },
          },
          healthRecords: healthRecordsStatusSelect,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.pet.findMany({
      where: authUser.id ? { ownerId: authUser.id } : { id: 'none' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            tutorTitle: true,
            plan: true,
            role: true,
            badges: true,
          },
        },
        healthRecords: healthRecordsStatusSelect,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

 @Get(':id')
 @UseGuards(JwtAuthGuard)
findOne(@Param('id') id: string) {
  return this.prisma.pet.findUnique({
    where: { id },
    include: {
      owner: true,
      healthRecords: { orderBy: { date: 'desc' } },
      diaryEntries:  { orderBy: { date: 'desc' } },
      protocolEnrollments: {
        select: {
          id: true,
          protocol: { select: { title: true } },
          logs: {
            where: {
              OR: [{ note: { not: null } }, { entries: { some: {} } }],
            },
            select: {
              id: true,
              dayNumber: true,
              note: true,
              completedAt: true,
              entries: { select: { id: true, data: true, createdAt: true } },
            },
          },
        },
      },
    },
  });
}

@Get('memorial/public')
async getPublicMemorialPets() {
  return this.prisma.pet.findMany({
    where: {
      OR: [
        { isMemorial: true },
        { isArchived: true },
        { deathDate: { not: null } },
      ],
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
    orderBy: {
      deathDate: 'desc',
    },
  });
}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('id') id: string) {
    await assertOwnsPet(this.prisma, id, req.user);
    return this.prisma.pet.delete({ where: { id } });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file',         maxCount: 1 },
    { name: 'gallery',      maxCount: 6 },
    { name: 'pedigree',     maxCount: 1 },  // frente
    { name: 'pedigreeBack', maxCount: 1 },  // verso — NOVO
  ]))
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFiles() files: {
      file?:         Express.Multer.File[],
      gallery?:      Express.Multer.File[],
      pedigree?:     Express.Multer.File[],
      pedigreeBack?: Express.Multer.File[],  // NOVO
    },
    @Body() body: any
  ) {
    await assertOwnsPet(this.prisma, id, req.user);
    const dataToUpdate: any = { ...body };

    // Booleanos
const booleanFields = [
  'isMemorial',
  'neutered',
  'isArchived',
  'showInHome',
  'streetAccess',
  'hasAwards',
  'isDateEstimated',
  'riskAreaAccess',
  'hasBehaviorIssues',
  'hasTraumaHistory',
];
    booleanFields.forEach(field => {
      if (dataToUpdate[field] === 'true')  dataToUpdate[field] = true;
      if (dataToUpdate[field] === 'false') dataToUpdate[field] = false;
    });

    // Helpers de sanitização
    const toNullInt  = (v: any) => (v === '' || v === 'null' || v == null) ? null : (parseInt(v, 10) || null);
    const toNullDate = (v: any) => {
      if (v === '' || v === 'null' || v == null) return null;
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T12:00:00.000Z`);
      return new Date(v);
    };
    const toNullStr  = (v: any) => (v === '' || v === 'null' || v == null) ? null : String(v);

    // Números — trata string vazia e "null" como null
    dataToUpdate.weight    = dataToUpdate.weight    != null ? (parseFloat(dataToUpdate.weight) || null) : undefined;
    dataToUpdate.ageYears  = toNullInt(dataToUpdate.ageYears);
    dataToUpdate.ageMonths = toNullInt(dataToUpdate.ageMonths);

    if (dataToUpdate.xpg !== undefined) {
      const safeXpg = Math.max(0, Number(dataToUpdate.xpg || 0));
      dataToUpdate.xpg = safeXpg;
      dataToUpdate.level = calcCatLevelMeta(safeXpg).rank;
    }

    // Datas — trata string vazia e "null" como null
    if ('birthDate' in dataToUpdate) dataToUpdate.birthDate = toNullDate(dataToUpdate.birthDate);
    if ('deathDate' in dataToUpdate) dataToUpdate.deathDate = toNullDate(dataToUpdate.deathDate);

    // Strings opcionais vazias → null
    ['microchip', 'nicknames', 'traumaHistory', 'healthSummary', 'deathCause', 'bio'].forEach(f => {
      if (f in dataToUpdate) dataToUpdate[f] = toNullStr(dataToUpdate[f]);
    });

    // Arrays
    if (typeof body.personality === 'string') {
      try { dataToUpdate.personality = JSON.parse(body.personality); } catch { dataToUpdate.personality = []; }
    }
    if (typeof body.foodType === 'string') {
      try { dataToUpdate.foodType = JSON.parse(body.foodType); } catch { dataToUpdate.foodType = []; }
    }


    if (typeof body.preExistingConditions === 'string') {
  try {
    dataToUpdate.preExistingConditions = JSON.parse(body.preExistingConditions);
  } catch {
    dataToUpdate.preExistingConditions = [];
  }
} else if (Array.isArray(body.preExistingConditions)) {
  dataToUpdate.preExistingConditions = body.preExistingConditions;
}

if (typeof body.coexistsWith === 'string') {
  try {
    dataToUpdate.coexistsWith = JSON.parse(body.coexistsWith);
  } catch {
    dataToUpdate.coexistsWith = [];
  }
} else if (Array.isArray(body.coexistsWith)) {
  dataToUpdate.coexistsWith = body.coexistsWith;
}

    const parsedBadges = this.parseStringArray(body.badges);
    if (parsedBadges !== undefined) {
      dataToUpdate.badges = parsedBadges;
    }

    // Upload foto principal
    if (files?.file?.[0]) {
      dataToUpdate.photoUrl = await this.cloudflare.uploadImage(files.file[0]);
    }

    // Upload pedigree FRENTE → pedigreeUrl
    if (files?.pedigree?.[0]) {
      dataToUpdate.pedigreeUrl = await this.cloudflare.uploadImage(files.pedigree[0]);
    }

    // Upload pedigree VERSO → pedigreeBackUrl (NOVO)
    if (files?.pedigreeBack?.[0]) {
      dataToUpdate.pedigreeBackUrl = await this.cloudflare.uploadImage(files.pedigreeBack[0]);
    }

    // Upload galeria
    if (files?.gallery && files.gallery.length > 0) {
      const newPhotos = await Promise.all(
        files.gallery.map(f => this.cloudflare.uploadImage(f))
      );
      const currentPet = await this.prisma.pet.findUnique({ where: { id } });
      const currentGallery = currentPet?.gallery || [];
      dataToUpdate.gallery = [...currentGallery, ...newPhotos];
    }

    delete dataToUpdate.file;
    delete dataToUpdate.pedigree;
    delete dataToUpdate.pedigreeBack;

    const updated = await this.prisma.pet.update({
      where: { id },
      data: dataToUpdate,
    });

    // Ficha do gato completa — XP médio, uma única vez por gato.
    if (!updated.profileCompletedAt && isProfileComplete(updated)) {
      const withTimestamp = await this.prisma.pet.update({
        where: { id },
        data: { profileCompletedAt: new Date() },
      });
      this.gamif.onProfileComplete(updated.ownerId, id).catch(() => {});
      return withTimestamp;
    }

    return updated;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'photo',        maxCount: 1 },
    { name: 'file',         maxCount: 1 },  // compatibilidade
    { name: 'pedigree',     maxCount: 1 },  // frente no cadastro
    { name: 'pedigreeBack', maxCount: 1 },  // verso no cadastro (futuro)
  ]))
  async create(
    @Req() req: any,
    @UploadedFiles() files: {
      photo?:        Express.Multer.File[],
      file?:         Express.Multer.File[],
      pedigree?:     Express.Multer.File[],
      pedigreeBack?: Express.Multer.File[],
    },
    @Body() body: any
  ) {
    const petData: any = { ...body };

    // So ADMIN pode cadastrar em nome de outro tutor (suporte); qualquer
    // outro usuario so pode criar gato pra si mesmo, nunca pro body.ownerId
    // que ele mandou — fecha o buraco de registrar gato na conta alheia.
    petData.ownerId = req.user.role === 'ADMIN' && body.ownerId ? body.ownerId : req.user.id;

    const owner = await this.prisma.user.findUnique({
      where: { id: String(petData.ownerId) },
      select: {
        id: true,
        plan: true,
        role: true,
        badges: true,
      },
    });

    if (!owner) {
      throw new BadRequestException('Tutor responsável não encontrado.');
    }

    const entitlements = getUserEntitlements(owner);
    const incomingIsMemorial =
      petData.isMemorial === true || petData.isMemorial === 'true';
    const incomingIsArchived =
      petData.isArchived === true || petData.isArchived === 'true';

    if (!entitlements.isUnlimitedCats && !incomingIsMemorial && !incomingIsArchived) {
      const activeCatsCount = await this.prisma.pet.count({
        where: {
          ownerId: owner.id,
          isMemorial: false,
          isArchived: false,
        },
      });

      if (activeCatsCount >= entitlements.maxActiveCats!) {
        throw new BadRequestException(
          `Seu plano permite até ${entitlements.maxActiveCats} gatos ativos. Coloque um gato no memorial/arquivo para continuar.`,
        );
      }
    }

    // Foto principal — aceita 'photo' ou 'file'
    const photoFile = files?.photo?.[0] || files?.file?.[0];
    if (photoFile) {
      petData.photoUrl = await this.cloudflare.uploadImage(photoFile);
    }

    // Pedigree frente no cadastro
    if (files?.pedigree?.[0]) {
      petData.pedigreeUrl = await this.cloudflare.uploadImage(files.pedigree[0]);
    }

    // Pedigree verso no cadastro
    if (files?.pedigreeBack?.[0]) {
      petData.pedigreeBackUrl = await this.cloudflare.uploadImage(files.pedigreeBack[0]);
    }

    // Booleanos
    const booleanFields = [
  'neutered',
  'isDateEstimated',
  'streetAccess',
  'riskAreaAccess',
  'hasAwards',
  'isMemorial',
  'isArchived',
  'showInHome',
  'hasBehaviorIssues',
  'hasTraumaHistory',
];

    booleanFields.forEach(field => {
      if (petData[field] === 'true')  petData[field] = true;
      if (petData[field] === 'false') petData[field] = false;
    });

    // Helpers (mesmo padrão do update)
    const _toNullInt  = (v: any) => (v === '' || v === 'null' || v == null) ? null : (parseInt(v, 10) || null);
    const _toNullDate = (v: any) => {
      if (v === '' || v === 'null' || v == null) return null;
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T12:00:00.000Z`);
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    // Números
    petData.weight    = (petData.weight && parseFloat(petData.weight) !== 0) ? parseFloat(petData.weight) : null;
    petData.ageYears  = _toNullInt(petData.ageYears);
    petData.ageMonths = _toNullInt(petData.ageMonths);
    if (petData.xpg !== undefined) {
      const safeXpg = Math.max(0, Number(petData.xpg || 0));
      petData.xpg = safeXpg;
      petData.level = calcCatLevelMeta(safeXpg).rank;
    }

    // Datas
    petData.birthDate = _toNullDate(petData.birthDate);
    petData.deathDate = _toNullDate(petData.deathDate);

    // Skills padrão
    petData.skillSocial    = body.skillSocial    || "80";
    petData.skillCuriosity = body.skillCuriosity || "90";
    petData.skillEnergy    = body.skillEnergy    || "75";

    // Arrays
    if (Array.isArray(body.personality)) {
      petData.personality = body.personality;
    } else if (typeof body.personality === 'string') {
      try { petData.personality = JSON.parse(body.personality); } catch { petData.personality = []; }
    } else {
      petData.personality = [];
    }

    if (Array.isArray(body.foodType)) {
      petData.foodType = body.foodType;
    } else if (typeof body.foodType === 'string') {
      try { petData.foodType = JSON.parse(body.foodType); } catch { petData.foodType = []; }
    } else {
      petData.foodType = [];
    }

    if (Array.isArray(body.preExistingConditions)) {
  petData.preExistingConditions = body.preExistingConditions;
} else if (typeof body.preExistingConditions === 'string') {
  try {
    petData.preExistingConditions = JSON.parse(body.preExistingConditions);
  } catch {
    petData.preExistingConditions = [];
  }
} else {
  petData.preExistingConditions = [];
}

if (Array.isArray(body.coexistsWith)) {
  petData.coexistsWith = body.coexistsWith;
} else if (typeof body.coexistsWith === 'string') {
  try {
    petData.coexistsWith = JSON.parse(body.coexistsWith);
  } catch {
    petData.coexistsWith = [];
  }
} else {
    petData.coexistsWith = [];
}

    const parsedBadges = this.parseStringArray(body.badges);
    if (parsedBadges !== undefined) {
      petData.badges = parsedBadges;
    }

    // Remove campos que não existem no schema
    const unknownFields = [
  'catType',
  'avatarPreview',
  'avatarFile',
  'file',
  'photo',
  'pedigree',
  'pedigreeBack',
];
unknownFields.forEach((f) => delete petData[f]);

    // Strings opcionais vazias → null
   const optionalStrings = [
  'nicknames',
  'microchip',
  'neuterIntention',
  'healthSummary',
  'foodBrand',
  'foodFreq',
  'activityLevel',
  'socialOtherPets',
  'behaviorIssues',
  'traumaHistory',
  'habitat',
  'housingType',
  'adoptionStory',
  'awardsDetail',
  'deathCause',
  'themeColor',
  'arrivalType',
  'arrivalNotes',
  'coatType',
  'feedFrequencyMode',
  'feedFrequencyNotes',
  'city',
  'breed',
  'bio',
];
optionalStrings.forEach((f) => {
  if (petData[f] === '') petData[f] = null;
});

    const created = await this.prisma.pet.create({ data: petData });

    this.prisma.pet
      .count({ where: { ownerId: created.ownerId, isMemorial: false, isArchived: false } })
      .then((catCount) => {
        this.events.track({ name: 'cat_created', userId: created.ownerId, props: { cat_count: catCount } });
      })
      .catch(() => {});

    // Cadastro já veio completo — ficha do gato completa, XP médio, uma única vez.
    if (isProfileComplete(created)) {
      const withTimestamp = await this.prisma.pet.update({
        where: { id: created.id },
        data: { profileCompletedAt: new Date() },
      });
      this.gamif.onProfileComplete(created.ownerId, created.id).catch(() => {});
      return withTimestamp;
    }

    return created;
  }
}
