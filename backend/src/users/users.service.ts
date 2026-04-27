import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt'; // <--- Importante para criptografar a senha
import { getPlanFromUser, normalizeBadges } from '../membership/membership.constants';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // --- ESTATÍSTICAS ---
  async getDashboardStats() {
    const totalUsers = await this.prisma.user.count();
    const today = new Date();
    today.setHours(0,0,0,0);
    const newUsersToday = await this.prisma.user.count({ where: { createdAt: { gte: today } } });
    const totalPets = await this.prisma.pet.count();
    return { totalUsers, newUsersToday, totalPets, activeUsers: totalUsers };
  }

  // --- CRUD ---

  // CRIAR USUÁRIO (Agora com Hash de Senha)
  async create(data: Prisma.UserCreateInput) {
    // Se vier senha, criptografa antes de salvar
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.user.create({ data });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        role: true,
        status: true,
        createdAt: true,
        photoUrl: true,
        plan: true,
        planExpires: true,
        badges: true,
        xpt: true,
        gatedoPoints: true,
        level: true,
        pets: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
        subscription: {
          select: {
            id: true,
            provider: true,
            planType: true,
            status: true,
            startedAt: true,
            expiresAt: true,
            autoRenew: true,
            updatedAt: true,
          },
        },
      },
    });

    return users.map((user) => ({
      ...user,
      plan: getPlanFromUser(user),
      badges: normalizeBadges(user.badges),
    }));
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { pets: true } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: any) {
    // Se o Admin estiver alterando a senha, precisamos criptografar de novo
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    } else {
        delete data.password; // Se não mandou senha, remove o campo pra não salvar vazio
    }
    delete data.id;
    delete data.pets;

    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string) {
    const deletePets = this.prisma.pet.deleteMany({ where: { ownerId: id } });
    const deleteUser = this.prisma.user.delete({ where: { id } });
    return this.prisma.$transaction([deletePets, deleteUser]);
  }
}
