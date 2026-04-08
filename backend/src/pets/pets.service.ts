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

    // Inteiros — string vazia → null
    if (raw.ageYears  !== undefined) data.ageYears  = toNullableInt(raw.ageYears);
    if (raw.ageMonths !== undefined) data.ageMonths = toNullableInt(raw.ageMonths);

    // Datas — string vazia / "null" → null
    if (raw.birthDate !== undefined) data.birthDate = toNullableDate(raw.birthDate);
    if (raw.deathDate !== undefined) data.deathDate = toNullableDate(raw.deathDate);

    // Arrays (gallery, personality, etc.) — se vier como JSON string
    if (raw.gallery !== undefined) {
      data.gallery = typeof raw.gallery === 'string'
        ? JSON.parse(raw.gallery)
        : raw.gallery;
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