import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma.service'; 
import { CloudflareService } from '../cloudflare.service'; 
import { Express } from 'express'; 
import 'multer'; 

@Controller('pets')
export class PetsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudflare: CloudflareService,
  ) {}

  @Get()
  async findAll() {
    return this.prisma.pet.findMany({
      include: { owner: true }
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.pet.findUnique({ 
      where: { id },
      include: { documents: true, healthRecords: true } 
    });
  }

  /**
   * GET /pets/:id/social-profile
   * Agrega todos os dados para o CatSocialProfile numa unica chamada.
   */
  @Get(':id/social-profile')
  async getSocialProfile(@Param('id') id: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true, name: true, photoUrl: true, xp: true, badges: true,
            studioCreations: { select: { id: true } },
          },
        },
        healthRecords: {
          orderBy: { date: 'desc' }, take: 6,
          select: { id: true, type: true, title: true, date: true, veterinarian: true, clinic: true },
        },
        igentSessions: {
          orderBy: { date: 'desc' }, take: 3,
          select: { id: true, symptomLabel: true, date: true, severity: true, resolvedAt: true },
        },
      },
    });

    if (!pet) return null;

    const HEALTH_ICON: Record<string, string> = {
      VACCINE: '💉', VERMIFUGE: '💊', PARASITE: '🛡️', MEDICATION: '💊',
      MEDICINE: '💊', EXAM: '🔬', SURGERY: '🏥', CONSULTATION: '🩺', IACONSULT: '🧠',
    };
    const HEALTH_COLOR: Record<string, string> = {
      VACCINE: '#10B981', VERMIFUGE: '#F59E0B', PARASITE: '#F97316', MEDICATION: '#60A5FA',
      MEDICINE: '#60A5FA', EXAM: '#8B5CF6', SURGERY: '#0EA5E9', CONSULTATION: '#34D399', IACONSULT: '#6158ca',
    };

    const healthTimeline = [
      ...pet.healthRecords.map(r => ({
        date: r.date, event: r.title, type: r.type.toLowerCase(),
        icon: HEALTH_ICON[r.type] ?? '📋', color: HEALTH_COLOR[r.type] ?? '#9CA3AF',
        detail: [r.veterinarian, r.clinic].filter(Boolean).join(' · '),
      })),
      ...pet.igentSessions.map(s => ({
        date: s.date, event: `iGentVet: ${s.symptomLabel}`, type: 'igent',
        icon: '🧠', color: '#6158ca',
        detail: s.resolvedAt ? 'Resolvido' : 'Em acompanhamento',
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      }));

    return {
      id: pet.id,
      slug: pet.name.toLowerCase().replace(/\s+/g, '-'),
      name: pet.name,
      breed: pet.breed,
      themeColor: pet.themeColor,
      photo: pet.photoUrl,
      gallery: pet.gallery ?? [],
      gender: pet.gender,
      neutered: pet.neutered,
      bio: pet.bio,
      personality: pet.personality ?? [],
      birthDate: pet.birthDate,
      tutor: {
        name: pet.owner.name,
        firstName: pet.owner.name?.split(' ')[0] ?? 'Tutor',
        avatar: pet.owner.photoUrl,
        xp: pet.owner.xp,
        badges: pet.owner.badges,
      },
      stats: {
        followers: 0,
        posts: 0,
        healthDays: pet.healthRecords.length,
        consultCount: pet.igentSessions.length,
        studioCreations: pet.owner.studioCreations.length,
      },
      healthTimeline,
      achievements: pet.owner.badges,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.pet.delete({ where: { id } });
  }

  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'gallery', maxCount: 6 },
    { name: 'pedigree', maxCount: 1 },
  ]))
  async update(
    @Param('id') id: string, 
    @UploadedFiles() files: { 
      file?: Express.Multer.File[], 
      gallery?: Express.Multer.File[],
      pedigree?: Express.Multer.File[] 
    }, 
    @Body() body: any
  ) {
    const dataToUpdate: any = { ...body };

    // Conversão de Booleanos
    const booleanFields = ['isMemorial', 'neutered', 'isArchived', 'showInHome', 'streetAccess', 'hasAwards', 'isDateEstimated', 'riskAreaAccess'];
    booleanFields.forEach(field => {
      if (dataToUpdate[field] === 'true') dataToUpdate[field] = true;
      if (dataToUpdate[field] === 'false') dataToUpdate[field] = false;
    });

    // Conversão de Números Vitais
    if (dataToUpdate.weight) dataToUpdate.weight = parseFloat(dataToUpdate.weight);
    if (dataToUpdate.ageYears) dataToUpdate.ageYears = parseInt(dataToUpdate.ageYears);
    if (dataToUpdate.ageMonths) dataToUpdate.ageMonths = parseInt(dataToUpdate.ageMonths);

    // Tratamento de Arrays
    if (typeof body.personality === 'string') {
      try { dataToUpdate.personality = JSON.parse(body.personality); } catch(e) { dataToUpdate.personality = []; }
    }
    if (typeof body.foodType === 'string') {
      try { dataToUpdate.foodType = JSON.parse(body.foodType); } catch(e) { dataToUpdate.foodType = []; }
    }

    // Uploads
    if (files?.file?.[0]) {
      dataToUpdate.photoUrl = await this.cloudflare.uploadImage(files.file[0]);
    }
    if (files?.pedigree?.[0]) {
      dataToUpdate.pedigreeUrl = await this.cloudflare.uploadImage(files.pedigree[0]);
    }
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

    return this.prisma.pet.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async create(
    @UploadedFiles() files: { file?: Express.Multer.File[] }, 
    @Body() body: any
  ) {
    let photoUrl = null;
    if (files?.file?.[0]) {
      photoUrl = await this.cloudflare.uploadImage(files.file[0]);
    }

    const petData: any = { ...body, photoUrl };

    // ── Booleanos (mesma lista do update) ──────────────────────────────────
    const booleanFields = [
      'neutered', 'isDateEstimated', 'streetAccess',
      'riskAreaAccess', 'hasAwards', 'isMemorial', 'isArchived', 'showInHome',
    ];
    booleanFields.forEach(field => {
      if (petData[field] === 'true')  petData[field] = true;
      if (petData[field] === 'false') petData[field] = false;
    });

    // ── Números ────────────────────────────────────────────────────────────
    // weight: '0' ou '' vira null; valor real vira Float
    petData.weight    = (petData.weight && parseFloat(petData.weight) !== 0) ? parseFloat(petData.weight) : null;
    petData.ageYears  = petData.ageYears  ? parseInt(petData.ageYears)  : null;
    petData.ageMonths = petData.ageMonths ? parseInt(petData.ageMonths) : null;

    // ── Data de Nascimento: string 'YYYY-MM-DD' → DateTime ISO ────────────
    if (petData.birthDate && petData.birthDate !== '') {
      petData.birthDate = new Date(petData.birthDate + 'T00:00:00.000Z');
    } else {
      petData.birthDate = null;
    }

    // ── Skills (padrão String) ─────────────────────────────────────────────
    petData.skillSocial    = body.skillSocial    || "80";
    petData.skillCuriosity = body.skillCuriosity || "90";
    petData.skillEnergy    = body.skillEnergy    || "75";

    // ── Arrays: suporta tanto item-por-item (FormData) quanto JSON.parse ──
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

    // ── Remover campos que NÃO existem no schema (vindos do FormData/UI) ──
    const unknownFields = ['catType', 'avatarPreview', 'avatarFile', 'file'];
    unknownFields.forEach(f => delete petData[f]);

    // ── Converter strings vazias em null para campos opcionais ─────────────
    const optionalStrings = [
      'nicknames', 'microchip', 'neuterIntention', 'healthSummary',
      'foodBrand', 'foodFreq', 'activityLevel', 'socialOtherPets',
      'behaviorIssues', 'traumaHistory', 'habitat', 'housingType',
      'adoptionStory', 'awardsDetail', 'deathCause','themeColor',
    ];
    optionalStrings.forEach(f => {
      if (petData[f] === '') petData[f] = null;
    });

    return this.prisma.pet.create({ data: petData });
  }
}