import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AuthedUser = { id: string; role?: string | null };

// Guard prova "tem token valido"; isso aqui prova "e dono do recurso" —
// usado em toda rota que recebe petId/userId vindo do cliente, pra fechar
// o buraco de um usuario logado mexer no gato/dado de outro (IDOR).
export async function assertOwnsPet(prisma: PrismaService, petId: string, user: AuthedUser) {
  if (user.role === 'ADMIN') return;
  const pet = await prisma.pet.findUnique({ where: { id: petId }, select: { ownerId: true } });
  if (!pet || pet.ownerId !== user.id) {
    throw new ForbiddenException('Sem acesso a este gato.');
  }
}

// Inscrição de protocolo (ProtocolEnrollment) — mesma lógica do assertOwnsPet.
export async function assertOwnsEnrollment(prisma: PrismaService, enrollmentId: string, user: AuthedUser) {
  if (user.role === 'ADMIN') return;
  const enr = enrollmentId
    ? await prisma.protocolEnrollment.findUnique({ where: { id: enrollmentId }, select: { userId: true } })
    : null;
  if (!enr || enr.userId !== user.id) {
    throw new ForbiddenException('Sem acesso a esta inscrição.');
  }
}

export function assertIsSelfOrAdmin(targetUserId: string, user: AuthedUser) {
  if (user.role === 'ADMIN') return;
  if (user.id !== targetUserId) {
    throw new ForbiddenException('Sem acesso a este usuário.');
  }
}
