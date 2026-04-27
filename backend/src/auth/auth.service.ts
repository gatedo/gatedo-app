import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './auth.dto';
import { EmailService } from '../email/email.service';
import {
  MEMBERSHIP_BADGES,
  PLAN_KEYS,
  PLAN_TYPES,
  addMonths,
  getMembershipGrantFromPlanType,
  getPlanFromUser,
  normalizeBadges,
} from '../membership/membership.constants';

type InviteKind = 'founder' | 'vip' | 'purchase' | 'unknown';
type InviteStatus = 'valid' | 'used' | 'expired' | 'inactive' | 'not_found';

type InviteResolution = {
  valid: boolean;
  status: InviteStatus;
  kind: InviteKind;
  message: string;
  token?: string;
  inviteId?: string | null;
  email?: string | null;
  name?: string | null;
  phase?: number | null;
  plan?: string | null;
  planType?: string | null;
  pointsGranted?: number | null;
  discountPercent?: number | null;
  autoRenew?: boolean | null;
  purchaseDate?: Date | null;
  expiresAt?: Date | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private generateInviteToken(type: 'founder' | 'vip', phase = 1) {
    const prefix = type === 'founder' ? `FND${phase}` : 'VIP';
    return `${prefix}_${crypto.randomBytes(10).toString('hex').toUpperCase()}`;
  }

  private async ensureFounderInviteTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FounderInvite" (
        "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "token"      TEXT UNIQUE NOT NULL,
        "email"      TEXT,
        "name"       TEXT,
        "phase"      INTEGER DEFAULT 1,
        "source"     TEXT DEFAULT 'ADMIN',
        "orderId"    TEXT,
        "used"       BOOLEAN DEFAULT false,
        "usedAt"     TIMESTAMP,
        "expiresAt"  TIMESTAMP,
        "createdAt"  TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "FounderInvite"
      ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'ADMIN'
    `).catch(() => {});

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "FounderInvite"
      ADD COLUMN IF NOT EXISTS "orderId" TEXT
    `).catch(() => {});

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "FounderInvite"
      ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP
    `).catch(() => {});
  }

  private async ensureAdminInviteTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminInvite" (
        "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "token"        TEXT UNIQUE NOT NULL,
        "type"         TEXT NOT NULL DEFAULT 'VIP',
        "email"        TEXT,
        "name"         TEXT,
        "createdById"  TEXT,
        "isActive"     BOOLEAN DEFAULT true,
        "maxUses"      INTEGER DEFAULT 1,
        "usedCount"    INTEGER DEFAULT 0,
        "usedAt"       TIMESTAMP,
        "expiresAt"    TIMESTAMP,
        "createdAt"    TIMESTAMP DEFAULT NOW()
      )
    `);

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "AdminInvite"
      ADD COLUMN IF NOT EXISTS "planType" TEXT
    `).catch(() => {});
  }

  private async ensurePurchaseInviteTable() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PurchaseInvite" (
        "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "token"           TEXT UNIQUE NOT NULL,
        "email"           TEXT,
        "name"            TEXT,
        "plan"            TEXT NOT NULL,
        "planType"        TEXT NOT NULL,
        "badge"           TEXT,
        "pointsGranted"   INTEGER DEFAULT 0,
        "cycleMonths"     INTEGER DEFAULT 0,
        "discountPercent" INTEGER DEFAULT 0,
        "autoRenew"       BOOLEAN DEFAULT false,
        "source"          TEXT DEFAULT 'KIWIFY',
        "orderId"         TEXT,
        "purchaseDate"    TIMESTAMP DEFAULT NOW(),
        "expiresAt"       TIMESTAMP,
        "used"            BOOLEAN DEFAULT false,
        "usedAt"          TIMESTAMP,
        "createdAt"       TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  private async ensureInviteInfra() {
    await this.ensureFounderInviteTable();
    await this.ensureAdminInviteTable();
    await this.ensurePurchaseInviteTable();
  }

  private getFounderPhaseGrant(phase?: number | null) {
    return getMembershipGrantFromPlanType(PLAN_TYPES.FOUNDER_EARLY_ANNUAL, {
      phase: Number(phase || 1),
      source: 'FOUNDER_CAMPAIGN',
      offerLabel: `Founder Early · Fase ${Number(phase || 1)}`,
    });
  }

  private getVipGrant() {
    return getMembershipGrantFromPlanType(PLAN_TYPES.TESTER_FRIENDLY_VIP, {
      source: 'ADMIN_VIP',
      offerLabel: 'Tester Friendly VIP',
    });
  }

  private async syncWalletGrant(
    tx: any,
    userId: string,
    amount: number,
    reason: string,
    metadata: Record<string, any> = {},
  ) {
    const safeAmount = Math.max(0, Number(amount || 0));
    if (safeAmount <= 0) return;

    await tx.user.update({
      where: { id: userId },
      data: {
        gatedoPoints: {
          increment: safeAmount,
        },
      },
    });

    await tx.userCredits.upsert({
      where: { userId },
      create: {
        userId,
        balance: safeAmount,
        totalBought: safeAmount,
        totalUsed: 0,
      },
      update: {
        balance: { increment: safeAmount },
        totalBought: { increment: safeAmount },
      },
    });

    await tx.rewardEvent.create({
      data: {
        userId,
        action: reason,
        gptsDelta: safeAmount,
        metadata,
      },
    });
  }

  async createPurchaseInvite(data: {
    email?: string;
    name?: string;
    plan: string;
    planType: string;
    badge?: string | null;
    pointsGranted?: number;
    cycleMonths?: number;
    discountPercent?: number;
    autoRenew?: boolean;
    orderId?: string | null;
    source?: string;
    purchaseDate?: Date | null;
    expiresAt?: Date | null;
  }): Promise<{ token: string }> {
    await this.ensurePurchaseInviteTable();

    const token = this.generateInviteToken('vip');

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "PurchaseInvite"
        (id, token, email, name, plan, "planType", badge, "pointsGranted", "cycleMonths", "discountPercent", "autoRenew", source, "orderId", "purchaseDate", "expiresAt")
      VALUES
        (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `,
      token,
      data.email || null,
      data.name || null,
      data.plan,
      data.planType,
      data.badge || null,
      Number(data.pointsGranted || 0),
      Number(data.cycleMonths || 0),
      Number(data.discountPercent || 0),
      Boolean(data.autoRenew),
      data.source || 'KIWIFY',
      data.orderId || null,
      data.purchaseDate || new Date(),
      data.expiresAt || null,
    );

    return { token };
  }

  async applyMembershipGrantToUser(userId: string, grant: any) {
    if (!userId || !grant) return null;

    const purchaseDate = grant.purchaseDate ? new Date(grant.purchaseDate) : new Date();
    const cycleMonths = Number(grant.cycleMonths || 0);
    const pointsGranted = Math.max(0, Number(grant.pointsGranted || 0));
    const discountPercent = Math.max(0, Number(grant.discountPercent || 0));
    const autoRenew = Boolean(grant.autoRenew);

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        badges: true,
        planExpires: true,
        founderGrantedAt: true,
      },
    });

    if (!currentUser) {
      throw new BadRequestException('Usuário não encontrado para ativar plano.');
    }

    const mergedBadges = grant.badge
      ? [...new Set([...normalizeBadges(currentUser.badges), grant.badge])]
      : normalizeBadges(currentUser.badges);

    const expiresBase =
      currentUser.planExpires && new Date(currentUser.planExpires).getTime() > purchaseDate.getTime()
        ? new Date(currentUser.planExpires)
        : purchaseDate;

    const expiresAt =
      cycleMonths > 0
        ? addMonths(expiresBase, cycleMonths)
        : grant.expiresAt
          ? new Date(grant.expiresAt)
          : currentUser.planExpires || null;

    const shouldKeepCurrentPlan =
      cycleMonths <= 0 &&
      (!grant.plan || String(grant.plan).toUpperCase() === PLAN_KEYS.FREE);

    const nextPlan = shouldKeepCurrentPlan
      ? currentUser.plan || PLAN_KEYS.FREE
      : grant.plan || currentUser.plan || PLAN_KEYS.FREE;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          plan: nextPlan,
          badges: mergedBadges,
          planExpires: expiresAt,
          founderGrantedAt:
            nextPlan === PLAN_KEYS.FOUNDER_EARLY
              ? currentUser.founderGrantedAt || purchaseDate
              : currentUser.founderGrantedAt || null,
        } as any,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          plan: true,
          badges: true,
          planExpires: true,
          gatedoPoints: true,
          xpt: true,
          level: true,
          role: true,
          photoUrl: true,
          city: true,
          emailVerified: true,
        },
      });

      if (cycleMonths > 0) {
        await tx.subscription.upsert({
          where: { userId },
          create: {
            userId,
            provider: grant.provider || 'KIWIFY',
            externalId: grant.externalId || null,
            planType: grant.planType,
            status: 'ACTIVE',
            startedAt: purchaseDate,
            expiresAt,
            autoRenew,
          },
          update: {
            provider: grant.provider || 'KIWIFY',
            externalId: grant.externalId || undefined,
            planType: grant.planType,
            status: 'ACTIVE',
            startedAt: purchaseDate,
            expiresAt,
            autoRenew,
          },
        });
      }

      if (pointsGranted > 0) {
        await this.syncWalletGrant(tx, userId, pointsGranted, 'PLAN_POINTS_GRANTED', {
          plan: grant.plan,
          planType: grant.planType,
          discountPercent,
        });
      }

    });

    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });
  }

  async resolveInviteToken(token: string): Promise<InviteResolution> {
    await this.ensureInviteInfra();

    if (!token) {
      return {
        valid: false,
        status: 'not_found',
        kind: 'unknown',
        message: 'Token não fornecido.',
      };
    }

    const founderRows = await this.prisma
      .$queryRawUnsafe<any[]>(
        `
        SELECT
          id,
          token,
          email,
          name,
          phase,
          used,
          "usedAt",
          "expiresAt",
          source,
          "orderId"
        FROM "FounderInvite"
        WHERE token = $1
        LIMIT 1
      `,
        token,
      )
      .catch(() => [] as any[]);

    if (founderRows.length > 0) {
      const invite = founderRows[0];
      const founderGrant = this.getFounderPhaseGrant(invite.phase || 1);
      const expired =
        invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now();

      if (invite.used) {
        return {
          valid: false,
          status: 'used',
          kind: 'founder',
          token,
          inviteId: invite.id,
          email: invite.email || null,
          name: invite.name || null,
          phase: invite.phase || 1,
          plan: founderGrant?.plan || PLAN_KEYS.FOUNDER_EARLY,
          planType: founderGrant?.planType || PLAN_TYPES.FOUNDER_EARLY_ANNUAL,
          pointsGranted: founderGrant?.pointsGranted || 0,
          discountPercent: founderGrant?.renewalDiscountPercent || 0,
          autoRenew: founderGrant?.autoRenew || false,
          message: 'Este link de ativação já foi utilizado.',
        };
      }

      if (expired) {
        return {
          valid: false,
          status: 'expired',
          kind: 'founder',
          token,
          inviteId: invite.id,
          email: invite.email || null,
          name: invite.name || null,
          phase: invite.phase || 1,
          plan: founderGrant?.plan || PLAN_KEYS.FOUNDER_EARLY,
          planType: founderGrant?.planType || PLAN_TYPES.FOUNDER_EARLY_ANNUAL,
          pointsGranted: founderGrant?.pointsGranted || 0,
          discountPercent: founderGrant?.renewalDiscountPercent || 0,
          autoRenew: founderGrant?.autoRenew || false,
          message: 'Este link de ativação expirou. Solicite um novo link.',
        };
      }

      return {
        valid: true,
        status: 'valid',
        kind: 'founder',
        token,
        inviteId: invite.id,
        email: invite.email || null,
        name: invite.name || null,
        phase: invite.phase || 1,
        plan: founderGrant?.plan || PLAN_KEYS.FOUNDER_EARLY,
        planType: founderGrant?.planType || PLAN_TYPES.FOUNDER_EARLY_ANNUAL,
        pointsGranted: founderGrant?.pointsGranted || 0,
        discountPercent: founderGrant?.renewalDiscountPercent || 0,
        autoRenew: founderGrant?.autoRenew || false,
        message: 'Convite fundador válido.',
      };
    }

    const adminRows = await this.prisma
      .$queryRawUnsafe<any[]>(
        `
        SELECT
          id,
          token,
          type,
          email,
          name,
          "isActive",
          "maxUses",
          "usedCount",
          "usedAt",
          "expiresAt"
        FROM "AdminInvite"
        WHERE token = $1
        LIMIT 1
      `,
        token,
      )
      .catch(() => [] as any[]);

    if (adminRows.length > 0) {
      const invite = adminRows[0];
      const vipGrant = this.getVipGrant();
      const maxUses = Number(invite.maxUses ?? 1);
      const usedCount = Number(invite.usedCount ?? 0);
      const expired =
        invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now();
      const kind: InviteKind =
        String(invite.type || '').toUpperCase() === 'VIP' ? 'vip' : 'unknown';

      if (!invite.isActive) {
        return {
          valid: false,
          status: 'inactive',
          kind,
          token,
          inviteId: invite.id,
          email: invite.email || null,
          name: invite.name || null,
          plan: vipGrant?.plan || PLAN_KEYS.TESTER_FRIENDLY,
          planType: vipGrant?.planType || PLAN_TYPES.TESTER_FRIENDLY_VIP,
          pointsGranted: vipGrant?.pointsGranted || 0,
          discountPercent: vipGrant?.renewalDiscountPercent || 0,
          autoRenew: vipGrant?.autoRenew || false,
          message: 'Este convite foi desativado pelo administrador.',
        };
      }

      if (usedCount >= maxUses) {
        return {
          valid: false,
          status: 'used',
          kind,
          token,
          inviteId: invite.id,
          email: invite.email || null,
          name: invite.name || null,
          plan: vipGrant?.plan || PLAN_KEYS.TESTER_FRIENDLY,
          planType: vipGrant?.planType || PLAN_TYPES.TESTER_FRIENDLY_VIP,
          pointsGranted: vipGrant?.pointsGranted || 0,
          discountPercent: vipGrant?.renewalDiscountPercent || 0,
          autoRenew: vipGrant?.autoRenew || false,
          message: 'Este convite já atingiu o limite de uso.',
        };
      }

      if (expired) {
        return {
          valid: false,
          status: 'expired',
          kind,
          token,
          inviteId: invite.id,
          email: invite.email || null,
          name: invite.name || null,
          plan: vipGrant?.plan || PLAN_KEYS.TESTER_FRIENDLY,
          planType: vipGrant?.planType || PLAN_TYPES.TESTER_FRIENDLY_VIP,
          pointsGranted: vipGrant?.pointsGranted || 0,
          discountPercent: vipGrant?.renewalDiscountPercent || 0,
          autoRenew: vipGrant?.autoRenew || false,
          message: 'Este convite expirou. Solicite um novo link.',
        };
      }

      return {
        valid: true,
        status: 'valid',
        kind,
        token,
        inviteId: invite.id,
        email: invite.email || null,
        name: invite.name || null,
        plan: vipGrant?.plan || PLAN_KEYS.TESTER_FRIENDLY,
        planType: vipGrant?.planType || PLAN_TYPES.TESTER_FRIENDLY_VIP,
        pointsGranted: vipGrant?.pointsGranted || 0,
        discountPercent: vipGrant?.renewalDiscountPercent || 0,
        autoRenew: vipGrant?.autoRenew || false,
        message: 'Convite VIP válido.',
      };
    }

    const purchaseRows = await this.prisma
      .$queryRawUnsafe<any[]>(
        `
        SELECT
          id,
          token,
          email,
          name,
          plan,
          "planType",
          badge,
          "pointsGranted",
          "cycleMonths",
          "discountPercent",
          "autoRenew",
          "purchaseDate",
          "expiresAt",
          used
        FROM "PurchaseInvite"
        WHERE token = $1
        LIMIT 1
      `,
        token,
      )
      .catch(() => [] as any[]);

    if (purchaseRows.length > 0) {
      const invite = purchaseRows[0];
      const expired =
        invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now();

      if (invite.used) {
        return {
          valid: false,
          status: 'used',
          kind: 'purchase',
          token,
          inviteId: invite.id,
          email: invite.email || null,
          name: invite.name || null,
          plan: invite.plan || PLAN_KEYS.FREE,
          planType: invite.planType || null,
          pointsGranted: Number(invite.pointsGranted || 0),
          discountPercent: Number(invite.discountPercent || 0),
          autoRenew: Boolean(invite.autoRenew),
          purchaseDate: invite.purchaseDate || null,
          expiresAt: invite.expiresAt || null,
          message: 'Este link de compra jÃ¡ foi utilizado.',
        };
      }

      if (expired) {
        return {
          valid: false,
          status: 'expired',
          kind: 'purchase',
          token,
          inviteId: invite.id,
          email: invite.email || null,
          name: invite.name || null,
          plan: invite.plan || PLAN_KEYS.FREE,
          planType: invite.planType || null,
          pointsGranted: Number(invite.pointsGranted || 0),
          discountPercent: Number(invite.discountPercent || 0),
          autoRenew: Boolean(invite.autoRenew),
          purchaseDate: invite.purchaseDate || null,
          expiresAt: invite.expiresAt || null,
          message: 'Este link de compra expirou.',
        };
      }

      return {
        valid: true,
        status: 'valid',
        kind: 'purchase',
        token,
        inviteId: invite.id,
        email: invite.email || null,
        name: invite.name || null,
        plan: invite.plan || PLAN_KEYS.FREE,
        planType: invite.planType || null,
        pointsGranted: Number(invite.pointsGranted || 0),
        discountPercent: Number(invite.discountPercent || 0),
        autoRenew: Boolean(invite.autoRenew),
        purchaseDate: invite.purchaseDate || null,
        expiresAt: invite.expiresAt || null,
        message: 'Compra validada com sucesso.',
      };
    }

    return {
      valid: false,
      status: 'not_found',
      kind: 'unknown',
      token,
      message: 'Token inválido ou inexistente.',
    };
  }

  async validateInviteToken(token: string) {
    const resolved = await this.resolveInviteToken(token);

    if (!resolved.valid) {
      throw new BadRequestException(resolved.message);
    }

    return resolved;
  }

  async validateFounderToken(token: string) {
    return this.validateInviteToken(token);
  }

  async createFounderInvite(data: {
    email: string;
    name?: string;
    phase?: number;
    source?: 'ADMIN' | 'KIWIFY';
    orderId?: string | null;
    expiresInDays?: number;
  }): Promise<{ token: string }> {
    await this.ensureFounderInviteTable();

    const token = this.generateInviteToken('founder', data.phase || 1);
    const expiresAt = new Date(
      Date.now() + (data.expiresInDays ?? 365) * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "FounderInvite"
        (id, token, email, name, phase, source, "orderId", "expiresAt")
      VALUES
        (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)
    `,
      token,
      data.email || null,
      data.name || null,
      data.phase || 1,
      data.source || 'ADMIN',
      data.orderId || null,
      expiresAt,
    );

    return { token };
  }

  async createAdminInvite(data: {
    type: 'vip' | 'founder';
    email?: string;
    name?: string;
    phase?: number;
    expiresInDays?: number;
    createdById?: string;
  }): Promise<{ token: string; kind: 'vip' | 'founder' }> {
    await this.ensureInviteInfra();

    if (data.type === 'founder') {
      if (!data.email) {
        throw new BadRequestException(
          'Convite fundador manual exige e-mail vinculado.',
        );
      }

      const created = await this.createFounderInvite({
        email: data.email,
        name: data.name,
        phase: data.phase || 1,
        source: 'ADMIN',
        expiresInDays: data.expiresInDays ?? 365,
      });

      return { token: created.token, kind: 'founder' };
    }

    const token = this.generateInviteToken('vip');
    const expiresAt = new Date(
      Date.now() + (data.expiresInDays ?? 90) * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "AdminInvite"
        (id, token, type, email, name, "createdById", "isActive", "maxUses", "usedCount", "expiresAt")
      VALUES
        (gen_random_uuid()::text, $1, 'VIP', $2, $3, $4, true, 1, 0, $5)
    `,
      token,
      data.email || null,
      data.name || null,
      data.createdById || null,
      expiresAt,
    );

    return { token, kind: 'vip' };
  }

  private getGrantFromInvite(invite?: InviteResolution | null) {
    if (!invite?.valid) return null;

    if (invite.kind === 'founder') {
      return this.getFounderPhaseGrant(invite.phase || 1);
    }

    if (invite.kind === 'vip') {
      return this.getVipGrant();
    }

    if (invite.kind === 'purchase' && invite.planType) {
      const planGrant = getMembershipGrantFromPlanType(invite.planType, {
        purchaseDate: invite.purchaseDate || new Date(),
      });

      if (planGrant) {
        return {
          ...planGrant,
          purchaseDate: invite.purchaseDate || planGrant.purchaseDate || new Date(),
          expiresAt: invite.expiresAt || null,
          autoRenew: invite.autoRenew ?? planGrant.autoRenew ?? false,
        };
      }

      return {
        source: 'KIWIFY_POINTS' as const,
        plan: invite.plan || PLAN_KEYS.FREE,
        planType: invite.planType,
        badge: null,
        badgeLabel: null,
        cycleMonths: 0,
        pointsGranted: Number(invite.pointsGranted || 0),
        renewalDiscountPercent: Number(invite.discountPercent || 0),
        autoRenew: Boolean(invite.autoRenew),
        isUnlimitedCats: false,
        maxActiveCats: null,
        purchaseDate: invite.purchaseDate || new Date(),
        expiresAt: invite.expiresAt || null,
      };
    }

    return null;
  }

  private async markInviteAsUsed(invite?: InviteResolution | null) {
    if (!invite?.inviteId) return;

    if (invite.kind === 'founder') {
      await this.prisma
        .$executeRawUnsafe(
          `
          UPDATE "FounderInvite"
          SET used = true, "usedAt" = NOW()
          WHERE id = $1
        `,
          invite.inviteId,
        )
        .catch(() => {});

      return;
    }

    if (invite.kind === 'vip') {
      await this.prisma
        .$executeRawUnsafe(
          `
          UPDATE "AdminInvite"
          SET
            "usedCount" = COALESCE("usedCount", 0) + 1,
            "usedAt" = NOW(),
            "isActive" = CASE
              WHEN COALESCE("usedCount", 0) + 1 >= COALESCE("maxUses", 1)
              THEN false
              ELSE true
            END
          WHERE id = $1
        `,
          invite.inviteId,
        )
        .catch(() => {});

      return;
    }

    if (invite.kind === 'purchase') {
      await this.prisma
        .$executeRawUnsafe(
          `
          UPDATE "PurchaseInvite"
          SET used = true, "usedAt" = NOW()
          WHERE id = $1
        `,
          invite.inviteId,
        )
        .catch(() => {});
    }
  }

  async register(data: RegisterDto & { origin?: string; token?: string }) {
    const specialOrigin = String(data.origin || '').toLowerCase();

    if (
      (specialOrigin === 'vip' ||
        specialOrigin === 'founder' ||
        specialOrigin === 'purchase') &&
      !data.token
    ) {
      throw new BadRequestException('Link de convite incompleto.');
    }

    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    let invite: InviteResolution | null = null;

    if (data.token) {
      invite = await this.resolveInviteToken(data.token);

      if (!invite.valid) {
        throw new BadRequestException(invite.message);
      }

      if (
        invite.email &&
        invite.email.trim().toLowerCase() !== data.email.trim().toLowerCase()
      ) {
        throw new BadRequestException(
          'Este convite está vinculado a outro e-mail.',
        );
      }
    }

    const membershipGrant = this.getGrantFromInvite(invite);
    const userPlan = membershipGrant?.plan || PLAN_KEYS.FREE;
    const userBadges = membershipGrant?.badge ? [membershipGrant.badge] : [];

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const createdUser = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: 'USER',
        plan: userPlan as any,
        badges: userBadges,
      },
    });

    const activatedUser = membershipGrant
      ? await this.applyMembershipGrantToUser(createdUser.id, {
          ...membershipGrant,
          purchaseDate:
            invite?.purchaseDate || membershipGrant.purchaseDate || new Date(),
          expiresAt: invite?.expiresAt || null,
          autoRenew: invite?.autoRenew ?? membershipGrant.autoRenew ?? false,
        })
      : await this.prisma.user.findUnique({
          where: { id: createdUser.id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            photoUrl: true,
            plan: true,
            planExpires: true,
            role: true,
            badges: true,
            xpt: true,
            gatedoPoints: true,
            level: true,
            emailVerified: true,
            subscription: {
              select: {
                id: true,
                provider: true,
                planType: true,
                status: true,
                startedAt: true,
                expiresAt: true,
                autoRenew: true,
              },
            },
          },
        });

    await this.markInviteAsUsed(invite);

    const authToken = this.generateToken(activatedUser || createdUser);

    setImmediate(async () => {
      try {
        const verifyToken = crypto.randomBytes(32).toString('hex');

        await this.prisma.$executeRawUnsafe(
          `
          UPDATE "User"
          SET "emailVerifyToken" = $1
          WHERE id = $2
        `,
          verifyToken,
          createdUser.id,
        );

        await this.emailService.sendWelcome(
          createdUser.email,
          createdUser.name || 'Tutor',
          getPlanFromUser(activatedUser || createdUser),
        );

        await this.emailService.sendEmailVerification(
          createdUser.email,
          createdUser.name || 'Tutor',
          verifyToken,
        );

        this.logger.log(
          `Onboarding completo para ${createdUser.email} (${getPlanFromUser(activatedUser || createdUser)})`,
        );
      } catch (e: any) {
        this.logger.warn(`Falha no email de onboarding: ${e?.message}`);
      }
    });

    return authToken;
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        subscription: true,
      },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateToken(user);
  }

  async verifyEmail(token: string) {
    const users = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT id
      FROM "User"
      WHERE "emailVerifyToken" = $1
      LIMIT 1
    `,
      token,
    );

    if (!users || users.length === 0) {
      throw new BadRequestException('Token inválido.');
    }

    await this.prisma.$executeRawUnsafe(
      `
      UPDATE "User"
      SET "emailVerified" = true,
          "emailVerifyToken" = null
      WHERE id = $1
    `,
      users[0].id,
    );

    return { success: true, message: 'Email verificado!' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: true,
        message: 'Instruções enviadas se o e-mail existir.',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await this.prisma.$executeRawUnsafe(
      `
      UPDATE "User"
      SET "resetPasswordToken" = $1,
          "resetPasswordExpires" = $2
      WHERE id = $3
    `,
      token,
      expires,
      user.id,
    );

    await this.emailService.sendPasswordReset(
      user.email,
      user.name || 'Tutor',
      token,
    );

    return { success: true, message: 'Instruções enviadas.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const users = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT id
      FROM "User"
      WHERE "resetPasswordToken" = $1
        AND "resetPasswordExpires" > NOW()
      LIMIT 1
    `,
      token,
    );

    if (!users || users.length === 0) {
      throw new BadRequestException('Token expirado ou inválido.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.$executeRawUnsafe(
      `
      UPDATE "User"
      SET password = $1,
          "resetPasswordToken" = null,
          "resetPasswordExpires" = null
      WHERE id = $2
    `,
      hashed,
      users[0].id,
    );

    return { success: true, message: 'Senha redefinida!' };
  }

  private generateToken(user: any) {
    const normalizedPlan = getPlanFromUser(user);
    const normalizedBadges = normalizeBadges(user?.badges);

    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      plan: normalizedPlan,
      role: user.role || 'USER',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        city: user.city || null,
        photoUrl: user.photoUrl || null,
        plan: normalizedPlan,
        planExpires: user.planExpires || null,
        role: user.role || 'USER',
        badges: normalizedBadges,
        xpt: Number(user.xpt || 0),
        gatedoPoints: Number(user.gatedoPoints || 0),
        level: Number(user.level || 1),
        subscription: user.subscription
          ? {
              id: user.subscription.id,
              provider: user.subscription.provider,
              planType: user.subscription.planType,
              status: user.subscription.status,
              startedAt: user.subscription.startedAt,
              expiresAt: user.subscription.expiresAt,
              autoRenew: Boolean(user.subscription.autoRenew),
            }
          : null,
        emailVerified: user.emailVerified ?? false,
      },
    };
  }
}
