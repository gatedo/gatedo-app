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

type InviteKind = 'founder' | 'vip' | 'unknown';
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
  }

  private async ensureInviteInfra() {
    await this.ensureFounderInviteTable();
    await this.ensureAdminInviteTable();
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
          plan: 'FOUNDER',
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
          plan: 'FOUNDER',
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
        plan: 'FOUNDER',
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
          plan: 'PREMIUM',
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
          plan: 'PREMIUM',
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
          plan: 'PREMIUM',
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
        plan: 'PREMIUM',
        message: 'Convite VIP válido.',
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

  async register(data: RegisterDto & { origin?: string; token?: string }) {
    const specialOrigin = String(data.origin || '').toLowerCase();

    if ((specialOrigin === 'vip' || specialOrigin === 'founder') && !data.token) {
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

    let userPlan = 'FREE';
    let userBadges: string[] = [];
    let initialXP = 0;
    let initialCredits = 0;

    if (invite?.kind === 'founder') {
      userPlan = 'FOUNDER';
      userBadges = ['FOUNDER'];

      const founderPhase = Number(invite.phase || 3);

      if (founderPhase === 1) {
        initialXP = 300;
        initialCredits = 300;
      } else if (founderPhase === 2) {
        initialXP = 200;
        initialCredits = 180;
      } else {
        initialXP = 100;
        initialCredits = 100;
      }
    } else if (invite?.kind === 'vip') {
      userPlan = 'PREMIUM';
      userBadges = ['VIP'];
      initialXP = 50;
      initialCredits = 50;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
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

    if (initialXP > 0) {
      await this.prisma
        .$executeRawUnsafe(
          `
          UPDATE "User"
          SET xp = $1
          WHERE id = $2
        `,
          initialXP,
          user.id,
        )
        .catch(() => {});
    }

    if (initialXP > 0) {
      await this.prisma.tutorPoints
        .upsert({
          where: { userId: user.id },
          update: {
            points: initialXP,
            totalEarned: initialXP,
            lastActionAt: new Date(),
          },
          create: {
            userId: user.id,
            points: initialXP,
            totalEarned: initialXP,
            lastActionAt: new Date(),
          },
        })
        .catch(() => {});
    }

    if (initialCredits > 0) {
      await this.prisma.userCredits
        .upsert({
          where: { userId: user.id },
          update: {
            balance: { increment: initialCredits },
            totalBought: { increment: initialCredits },
          },
          create: {
            userId: user.id,
            balance: initialCredits,
            totalBought: initialCredits,
            totalUsed: 0,
          },
        })
        .catch(() => {});
    }

    if (invite?.kind === 'founder' && invite.inviteId) {
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
    }

    if (invite?.kind === 'vip' && invite.inviteId) {
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
    }

    const authToken = this.generateToken(user);

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
          user.id,
        );

        await this.emailService.sendWelcome(
          user.email,
          user.name || 'Tutor',
          userPlan,
        );

        await this.emailService.sendEmailVerification(
          user.email,
          user.name || 'Tutor',
          verifyToken,
        );

        this.logger.log(
          `Onboarding completo para ${user.email} (${userPlan})`,
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
    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role || 'USER',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role || 'USER',
        badges: user.badges,
        xp: user.xp || 0,
        emailVerified: user.emailVerified ?? false,
      },
    };
  }
}