// src/pets/pets.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  // Criar Pet
  async create(data: Prisma.PetCreateInput) {
    return this.prisma.pet.create({
      data,
    });
  }

  // Listar Todos
  async findAll() {
    return this.prisma.pet.findMany({
      include: { owner: true }, // Traz os dados do dono junto
    });
  }

  // Buscar Um (CORRIGIDO PARA TRAZER O OWNER)
  async findOne(id: string) {
    return this.prisma.pet.findUnique({
      where: { id },
      include: { 
        owner: true, // ESSENCIAL: Agora traz o nome do Diego
        healthRecords: true, 
        diaryEntries: true 
      },
    });
  }

  // Atualizar (Preparado para city, microchip, traumaHistory, etc)
  async update(id: string, data: Prisma.PetUpdateInput) {
    return this.prisma.pet.update({
      where: { id },
      data,
    });
  }

  // Deletar
  async remove(id: string) {
    return this.prisma.pet.delete({
      where: { id },
    });
  }
}