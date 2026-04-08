import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFiles, UseInterceptors, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service'; 
import { CloudflareService } from '../cloudflare/cloudflare.service'; 
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
    return this.prisma.pet.findMany({
      where: ownerId ? { ownerId } : { id: 'none' },
      include: { owner: true },
      orderBy: { createdAt: 'asc' },
    });
  }

 @Get(':id')
findOne(@Param('id') id: string) {
  return this.prisma.pet.findUnique({
    where: { id },
    include: {
      owner: true,
      healthRecords: { orderBy: { date: 'desc' } },
      diaryEntries:  { orderBy: { date: 'desc' } },
    },
  });
}

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.pet.delete({ where: { id } });
  }

  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file',         maxCount: 1 },
    { name: 'gallery',      maxCount: 6 },
    { name: 'pedigree',     maxCount: 1 },  // frente
    { name: 'pedigreeBack', maxCount: 1 },  // verso — NOVO
  ]))
  async update(
    @Param('id') id: string, 
    @UploadedFiles() files: { 
      file?:         Express.Multer.File[],
      gallery?:      Express.Multer.File[],
      pedigree?:     Express.Multer.File[],
      pedigreeBack?: Express.Multer.File[],  // NOVO
    }, 
    @Body() body: any
  ) {
    const dataToUpdate: any = { ...body };

    // Booleanos
    const booleanFields = ['isMemorial', 'neutered', 'isArchived', 'showInHome', 'streetAccess', 'hasAwards', 'isDateEstimated', 'riskAreaAccess'];
    booleanFields.forEach(field => {
      if (dataToUpdate[field] === 'true')  dataToUpdate[field] = true;
      if (dataToUpdate[field] === 'false') dataToUpdate[field] = false;
    });

    // Helpers de sanitização
    const toNullInt  = (v: any) => (v === '' || v === 'null' || v == null) ? null : (parseInt(v, 10) || null);
    const toNullDate = (v: any) => (v === '' || v === 'null' || v == null) ? null : new Date(v);
    const toNullStr  = (v: any) => (v === '' || v === 'null' || v == null) ? null : String(v);

    // Números — trata string vazia e "null" como null
    dataToUpdate.weight    = dataToUpdate.weight    != null ? (parseFloat(dataToUpdate.weight) || null) : undefined;
    dataToUpdate.ageYears  = toNullInt(dataToUpdate.ageYears);
    dataToUpdate.ageMonths = toNullInt(dataToUpdate.ageMonths);

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

    return this.prisma.pet.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'photo',        maxCount: 1 },
    { name: 'file',         maxCount: 1 },  // compatibilidade
    { name: 'pedigree',     maxCount: 1 },  // frente no cadastro
    { name: 'pedigreeBack', maxCount: 1 },  // verso no cadastro (futuro)
  ]))
  async create(
    @UploadedFiles() files: {
      photo?:        Express.Multer.File[],
      file?:         Express.Multer.File[],
      pedigree?:     Express.Multer.File[],
      pedigreeBack?: Express.Multer.File[],
    }, 
    @Body() body: any
  ) {
    const petData: any = { ...body };

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
      'neutered', 'isDateEstimated', 'streetAccess',
      'riskAreaAccess', 'hasAwards', 'isMemorial', 'isArchived', 'showInHome',
    ];
    booleanFields.forEach(field => {
      if (petData[field] === 'true')  petData[field] = true;
      if (petData[field] === 'false') petData[field] = false;
    });

    // Helpers (mesmo padrão do update)
    const _toNullInt  = (v: any) => (v === '' || v === 'null' || v == null) ? null : (parseInt(v, 10) || null);
    const _toNullDate = (v: any) => {
      if (v === '' || v === 'null' || v == null) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    // Números
    petData.weight    = (petData.weight && parseFloat(petData.weight) !== 0) ? parseFloat(petData.weight) : null;
    petData.ageYears  = _toNullInt(petData.ageYears);
    petData.ageMonths = _toNullInt(petData.ageMonths);

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

    // Remove campos que não existem no schema
    const unknownFields = ['catType', 'avatarPreview', 'avatarFile', 'file', 'photo', 'pedigree', 'pedigreeBack'];
    unknownFields.forEach(f => delete petData[f]);

    // Strings opcionais vazias → null
    const optionalStrings = [
      'nicknames', 'microchip', 'neuterIntention', 'healthSummary',
      'foodBrand', 'foodFreq', 'activityLevel', 'socialOtherPets',
      'behaviorIssues', 'traumaHistory', 'habitat', 'housingType',
      'adoptionStory', 'awardsDetail', 'deathCause', 'themeColor',
    ];
    optionalStrings.forEach(f => {
      if (petData[f] === '') petData[f] = null;
    });

    return this.prisma.pet.create({ data: petData });
  }
}