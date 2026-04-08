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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async validateFounderToken(token: string) {
    if (!token) {
      throw new BadRequestException('Token não fornecido.');
    }

    const rows = await this.prisma
      .$queryRawUnsafe<any[]>(
        `SELECT id, email, name, phase, used
         FROM "FounderInvite"
         WHERE token = $1
         LIMIT 1`,
        token,
      )
      .catch(() => [] as any[]);

    if (!rows || rows.length === 0) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const invite = rows[0];

    if (invite.used) {
      throw new BadRequestException('Este link de ativação já foi utilizado.');
    }

    return {
      valid: true,
      email: invite.email || null,
      name: invite.name || null,
      phase: invite.phase || 1,
    };
  }

  async createFounderInvite(data: {
    email: string;
    name?: string;
    phase?: number;
  }): Promise<{ token: string }> {
    await this.prisma
      .$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "FounderInvite" (
          "id"        TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "token"     TEXT        UNIQUE NOT NULL,
          "email"     TEXT,
          "name"      TEXT,
          "phase"     INTEGER     DEFAULT 1,
          "used"      BOOLEAN     DEFAULT false,
          "usedAt"    TIMESTAMP,
          "createdAt" TIMESTAMP   DEFAULT NOW()
        )
      `)
      .catch(() => {});

    const token = crypto.randomBytes(32).toString('hex');

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "FounderInvite" (id, token, email, name, phase)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
       ON CONFLICT (token) DO NOTHING`,
      token,
      data.email,
      data.name || null,
      data.phase || 1,
    );

    return { token };
  }

  async register(data: RegisterDto & { origin?: string; token?: string }) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    let inviteId: string | null = null;

    if (data.token) {
      const rows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `SELECT id, used
           FROM "FounderInvite"
           WHERE token = $1
           LIMIT 1`,
          data.token,
        )
        .catch(() => [] as any[]);

      if (!rows || rows.length === 0 || rows[0].used) {
        throw new BadRequestException(
          'Token de ativação inválido ou já utilizado.',
        );
      }

      inviteId = rows[0].id;
    }

    let userPlan = 'FREE';
    let userBadges: string[] = [];

    if (inviteId) {
      userPlan = 'FOUNDER';
      userBadges = ['FOUNDER'];
    } else if (data.origin === 'vip') {
      userPlan = 'PREMIUM';
      userBadges = ['VIP'];
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

    let initialXP = 0;
    let initialCredits = 0;

    if (inviteId) {
      const inviteRows = await this.prisma
        .$queryRawUnsafe<any[]>(
          `SELECT phase
           FROM "FounderInvite"
           WHERE id = $1
           LIMIT 1`,
          inviteId,
        )
        .catch(() => []);

      const founderPhase = inviteRows?.[0]?.phase ?? 3;

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
    } else if (data.origin === 'vip') {
      initialXP = 50;
      initialCredits = 50;
    }

    if (initialXP > 0) {
      await this.prisma
        .$executeRawUnsafe(
          `UPDATE "User"
           SET xp = $1
           WHERE id = $2`,
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

    if (inviteId) {
      await this.prisma
        .$executeRawUnsafe(
          `UPDATE "FounderInvite"
           SET used = true, "usedAt" = NOW()
           WHERE id = $1`,
          inviteId,
        )
        .catch(() => {});
    }

    const authToken = this.generateToken(user);

    setImmediate(async () => {
      try {
        const verifyToken = crypto.randomBytes(32).toString('hex');

        await this.prisma.$executeRawUnsafe(
          `UPDATE "User"
           SET "emailVerifyToken" = $1
           WHERE id = $2`,
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

        this.logger.log(`Onboarding completo para ${user.email} (${userPlan})`);
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
      `SELECT id
       FROM "User"
       WHERE "emailVerifyToken" = $1
       LIMIT 1`,
      token,
    );

    if (!users || users.length === 0) {
      throw new BadRequestException('Token inválido.');
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE "User"
       SET "emailVerified" = true,
           "emailVerifyToken" = null
       WHERE id = $1`,
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
      `UPDATE "User"
       SET "resetPasswordToken" = $1,
           "resetPasswordExpires" = $2
       WHERE id = $3`,
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
      `SELECT id
       FROM "User"
       WHERE "resetPasswordToken" = $1
         AND "resetPasswordExpires" > NOW()
       LIMIT 1`,
      token,
    );

    if (!users || users.length === 0) {
      throw new BadRequestException('Token expirado ou inválido.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.$executeRawUnsafe(
      `UPDATE "User"
       SET password = $1,
           "resetPasswordToken" = null,
           "resetPasswordExpires" = null
       WHERE id = $2`,
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