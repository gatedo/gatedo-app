import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma.service'; 
import { CloudflareService } from '../cloudflare.service'; 
import { JwtService } from '@nestjs/jwt';
import { Express } from 'express'; 
import 'multer'; 

@Controller('pets')
export class PetsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudflare: CloudflareService,
    private readonly jwtService: JwtService,
  ) {}

  // Extrai userId do Bearer token — retorna null se não houver token
  private getUserId(req: any): string | null {
    try {
      const auth = req.headers?.authorization || '';
      if (!auth.startsWith('Bearer ')) return null;
      const token = auth.split(' ')[1];
      const payload: any = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
      });
      return payload.sub || null;
    } catch { return null; }
  }

  @Get()
  async findAll(@Req() req: any) {
    const ownerId = this.getUserId(req);
    // Filtra por dono — cada usuário vê apenas seus próprios gatos
    return this.prisma.pet.findMany({
      where: ownerId ? { ownerId, isArchived: false } : { id: 'none' },
      include: { owner: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.pet.findUnique({ 
      where: { id },
      include: { documents: true, healthRecords: true } 
    });
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