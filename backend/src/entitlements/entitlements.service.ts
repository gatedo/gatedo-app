import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntitlementsService {
  private readonly logger = new Logger('EntitlementsService');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Libera um produto para o e-mail informado.
   * Se já existe conta com esse e-mail, grava direto no usuário.
   * Se não existe, fica pendente até o primeiro login/cadastro.
   */
  async grant(params: {
    email: string;
    productId: string;
    source?: string;
    externalId?: string | null;
  }) {
    const email = params.email.trim().toLowerCase();
    const source = params.source || 'KIWIFY';

    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (!user) {
      const pending = await this.prisma.pendingProductEntitlement.create({
        data: {
          email,
          productId: params.productId,
          source,
          externalId: params.externalId || null,
        },
      });
      this.logger.log(`Produto ${params.productId} pendente para ${email} (conta ainda não existe)`);
      return { pending: true, entitlement: pending };
    }

    const entitlement = await this.prisma.productEntitlement.upsert({
      where: { userId_productId: { userId: user.id, productId: params.productId } },
      update: { source, externalId: params.externalId || null, grantedAt: new Date() },
      create: {
        userId: user.id,
        productId: params.productId,
        source,
        externalId: params.externalId || null,
      },
    });
    this.logger.log(`Produto ${params.productId} liberado para ${email}`);
    return { pending: false, entitlement };
  }

  /** Remove o produto — usado em reembolso/chargeback. Casa por externalId (id do pedido). */
  async revokeByExternalId(externalId: string) {
    const removedGranted = await this.prisma.productEntitlement.deleteMany({ where: { externalId } });
    const removedPending = await this.prisma.pendingProductEntitlement.deleteMany({ where: { externalId } });
    this.logger.log(
      `Reembolso pedido ${externalId}: ${removedGranted.count} entitlement(s) e ${removedPending.count} pendência(s) removidos`,
    );
    return { removedGranted: removedGranted.count, removedPending: removedPending.count };
  }

  /** Aplica qualquer entitlement pendente para este e-mail — chamar após login/cadastro. */
  async promotePending(userId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const pendingList = await this.prisma.pendingProductEntitlement.findMany({
      where: { email: normalizedEmail },
    });

    if (pendingList.length === 0) return;

    for (const pending of pendingList) {
      await this.prisma.productEntitlement.upsert({
        where: { userId_productId: { userId, productId: pending.productId } },
        update: { source: pending.source, externalId: pending.externalId, grantedAt: new Date() },
        create: {
          userId,
          productId: pending.productId,
          source: pending.source,
          externalId: pending.externalId,
        },
      });
    }

    await this.prisma.pendingProductEntitlement.deleteMany({ where: { email: normalizedEmail } });
    this.logger.log(`${pendingList.length} entitlement(s) pendente(s) aplicados para ${normalizedEmail}`);
  }

  async listForUser(userId: string) {
    return this.prisma.productEntitlement.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
    });
  }

  /** Busca pra tela de admin: usuário (se existir) + concedidos + pendentes, por e-mail. */
  async adminSearch(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    const [granted, pending] = await Promise.all([
      user
        ? this.prisma.productEntitlement.findMany({ where: { userId: user.id }, orderBy: { grantedAt: 'desc' } })
        : Promise.resolve([]),
      this.prisma.pendingProductEntitlement.findMany({ where: { email: normalizedEmail }, orderBy: { createdAt: 'desc' } }),
    ]);

    return { user, granted, pending };
  }

  async grantManual(email: string, productId: string) {
    return this.grant({ email, productId, source: 'ADMIN' });
  }

  async revokeManual(userId: string, productId: string) {
    const existing = await this.prisma.productEntitlement.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!existing) throw new NotFoundException('Entitlement não encontrado.');

    await this.prisma.productEntitlement.delete({ where: { id: existing.id } });
    return { ok: true };
  }

  async revokePending(id: string) {
    await this.prisma.pendingProductEntitlement.delete({ where: { id } }).catch(() => {});
    return { ok: true };
  }
}
