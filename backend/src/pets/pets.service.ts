// src/pets/pets.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// ─── Helpers de sanitização ───────────────────────────────────────────────────
// Converte string vazia / "null" / undefined → null (para campos Int? e DateTime?)
function toNullableInt(v: any): number | null {
  if (v === null || v === undefined || v === '' || v === 'null') return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function toNullableDate(v: any): Date | null {
  if (v === null || v === undefined || v === '' || v === 'null') return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(`${v}T12:00:00.000Z`);
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function toNullableString(v: any): string | null {
  if (v === null || v === undefined || v === '' || v === 'null') return null;
  return String(v);
}

function toBoolean(v: any): boolean {
  if (typeof v === 'boolean') return v;
  return v === 'true' || v === true;
}

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  // ── Criar Pet ────────────────────────────────────────────────────────────────
  async create(data: Prisma.PetCreateInput) {
    return this.prisma.pet.create({ data });
  }

  // ── Listar Todos ─────────────────────────────────────────────────────────────
  async findAll() {
    return this.prisma.pet.findMany({
      include: { owner: true },
      // Retorna todos os pets do tutor, incluindo os em memorial
    });
  }

  // ── Buscar Um ────────────────────────────────────────────────────────────────
  async findOne(id: string) {
    return this.prisma.pet.findUnique({
      where: { id },
      include: {
        owner: true,
        healthRecords: true,
        diaryEntries: true,
      },
    });
  }

  // ── Atualizar — sanitiza todos os campos antes de passar ao Prisma ───────────
  async update(id: string, raw: Record<string, any>) {
    // Campos de texto simples — passam direto (nunca chegam ao Prisma como tipo errado)
    const data: Prisma.PetUpdateInput = {};

    if (raw.name          !== undefined) data.name          = String(raw.name);
    if (raw.nicknames     !== undefined) data.nicknames     = toNullableString(raw.nicknames);
    if (raw.breed         !== undefined) data.breed         = toNullableString(raw.breed);
    if (raw.city          !== undefined) data.city          = toNullableString(raw.city);
    if (raw.microchip     !== undefined) data.microchip     = toNullableString(raw.microchip);
    if (raw.gender        !== undefined) data.gender        = raw.gender as any;
    if (raw.traumaHistory !== undefined) data.traumaHistory = toNullableString(raw.traumaHistory);
    if (raw.healthSummary !== undefined) data.healthSummary = toNullableString(raw.healthSummary);
    if (raw.themeColor    !== undefined) data.themeColor    = toNullableString(raw.themeColor);
    if (raw.bio           !== undefined) data.bio           = toNullableString(raw.bio);
    if (raw.deathCause    !== undefined) data.deathCause    = toNullableString(raw.deathCause);
    

    // Booleanos — FormData envia como string "true"/"false"
    if (raw.isMemorial      !== undefined) data.isMemorial      = toBoolean(raw.isMemorial);
    if (raw.isArchived      !== undefined) data.isArchived      = toBoolean(raw.isArchived);
    if (raw.isDateEstimated !== undefined) data.isDateEstimated = toBoolean(raw.isDateEstimated);
    if (raw.neutered        !== undefined) data.neutered        = toBoolean(raw.neutered);
    if (raw.streetAccess      !== undefined) data.streetAccess      = toBoolean(raw.streetAccess);
    if (raw.riskAreaAccess    !== undefined) data.riskAreaAccess    = toBoolean(raw.riskAreaAccess);
    if (raw.hasAwards         !== undefined) data.hasAwards         = toBoolean(raw.hasAwards);
    if (raw.hasBehaviorIssues !== undefined) data.hasBehaviorIssues = toBoolean(raw.hasBehaviorIssues);
    if (raw.hasTraumaHistory  !== undefined) data.hasTraumaHistory  = toBoolean(raw.hasTraumaHistory);
    
    

    // Inteiros — string vazia → null
    if (raw.ageYears  !== undefined) data.ageYears  = toNullableInt(raw.ageYears);
    if (raw.ageMonths !== undefined) data.ageMonths = toNullableInt(raw.ageMonths);

    // Datas — string vazia / "null" → null
    if (raw.birthDate !== undefined) data.birthDate = toNullableDate(raw.birthDate);
    if (raw.deathDate !== undefined) data.deathDate = toNullableDate(raw.deathDate);

    if (raw.arrivalType        !== undefined) data.arrivalType        = toNullableString(raw.arrivalType);
    if (raw.arrivalNotes       !== undefined) data.arrivalNotes       = toNullableString(raw.arrivalNotes);
    if (raw.coatType           !== undefined) data.coatType           = toNullableString(raw.coatType);
    if (raw.feedFrequencyMode  !== undefined) data.feedFrequencyMode  = toNullableString(raw.feedFrequencyMode);
    if (raw.feedFrequencyNotes !== undefined) data.feedFrequencyNotes = toNullableString(raw.feedFrequencyNotes);
    if (raw.foodBrand          !== undefined) data.foodBrand          = toNullableString(raw.foodBrand);
    if (raw.activityLevel      !== undefined) data.activityLevel      = toNullableString(raw.activityLevel);
    if (raw.socialOtherPets    !== undefined) data.socialOtherPets    = toNullableString(raw.socialOtherPets);
    if (raw.behaviorIssues     !== undefined) data.behaviorIssues     = toNullableString(raw.behaviorIssues);
    if (raw.neuterIntention    !== undefined) data.neuterIntention    = toNullableString(raw.neuterIntention);
    if (raw.habitat            !== undefined) data.habitat            = toNullableString(raw.habitat);
    if (raw.housingType        !== undefined) data.housingType        = toNullableString(raw.housingType);
    if (raw.adoptionStory      !== undefined) data.adoptionStory      = toNullableString(raw.adoptionStory);
    if (raw.awardsDetail       !== undefined) data.awardsDetail       = toNullableString(raw.awardsDetail);

    // Arrays (gallery, personality, etc.) — se vier como JSON string
    if (raw.gallery !== undefined) {
      data.gallery = typeof raw.gallery === 'string'
        ? JSON.parse(raw.gallery)
        : raw.gallery;
    }
    if (raw.personality !== undefined) {
  data.personality =
    typeof raw.personality === 'string' ? JSON.parse(raw.personality) : raw.personality;
}

if (raw.foodType !== undefined) {
  data.foodType =
    typeof raw.foodType === 'string' ? JSON.parse(raw.foodType) : raw.foodType;
}

if (raw.preExistingConditions !== undefined) {
  data.preExistingConditions =
    typeof raw.preExistingConditions === 'string'
      ? JSON.parse(raw.preExistingConditions)
      : raw.preExistingConditions;
}

if (raw.coexistsWith !== undefined) {
  data.coexistsWith =
    typeof raw.coexistsWith === 'string'
      ? JSON.parse(raw.coexistsWith)
      : raw.coexistsWith;
}

    return this.prisma.pet.update({
      where: { id },
      data,
    });
  }

  // ── Deletar ──────────────────────────────────────────────────────────────────
  async remove(id: string) {
    return this.prisma.pet.delete({ where: { id } });
  }
}
