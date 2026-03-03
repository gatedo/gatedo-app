import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service'; 
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './auth.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(data: RegisterDto & { origin?: string }) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    let userPlan = 'FREE';
    let userBadges = [];
    let initialXP = 0;

    if (data.origin === 'founder') {
      userPlan = 'FOUNDER';
      userBadges = ['FOUNDER'];
      initialXP = 100;
    } else if (data.origin === 'vip') {
      userPlan = 'PREMIUM';
      userBadges = ['VIP'];
      initialXP = 50;
    }

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: 'USER',
        plan: userPlan,
        badges: userBadges,
        xp: initialXP,
      },
    });

    const token = this.generateToken(user);

    setImmediate(async () => {
      try {
        const verifyToken = crypto.randomBytes(32).toString('hex');
        
        // SQL Puro para evitar erro de validação do Prisma no Windows
        await this.prisma.$executeRawUnsafe(
          `UPDATE "User" SET "emailVerifyToken" = $1 WHERE id = $2`,
          verifyToken, user.id
        );

        await this.emailService.sendWelcome(user.email, user.name || 'Tutor', userPlan);
        await this.emailService.sendEmailVerification(user.email, user.name || 'Tutor', verifyToken);
        
        this.logger.log(`Fluxo de onboarding completo para ${user.email}`);
      } catch (e) {
        this.logger.warn(`Falha no processo de e-mail: ${e.message}`);
      }
    });

    return token;
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
    // Busca via SQL para não depender do modelo do Prisma Client
    const users: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM "User" WHERE "emailVerifyToken" = $1 LIMIT 1`,
      token
    );

    if (!users || users.length === 0) throw new BadRequestException('Token inválido.');

    await this.prisma.$executeRawUnsafe(
      `UPDATE "User" SET "emailVerified" = true, "emailVerifyToken" = null, xp = xp + 50 WHERE id = $1`,
      users[0].id
    );

    return { success: true, message: 'Email verificado!' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true, message: 'Instruções enviadas se o e-mail existir.' };

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); 

    // ATENÇÃO: SQL PURO QUE ATROPELA O ERRO DO PRISMA
    // Aqui não importa se o Prisma acha que a coluna existe ou não, o SQL manda direto no banco
    await this.prisma.$executeRawUnsafe(
      `UPDATE "User" SET "resetPasswordToken" = $1, "resetPasswordExpires" = $2 WHERE id = $3`,
      token, expires, user.id
    );

    await this.emailService.sendPasswordReset(user.email, user.name || 'Tutor', token);
    
    return { success: true, message: 'Instruções enviadas.' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Busca via SQL Puro
    const users: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM "User" WHERE "resetPasswordToken" = $1 AND "resetPasswordExpires" > NOW() LIMIT 1`,
      token
    );

    if (!users || users.length === 0) throw new BadRequestException('Token expirado ou inválido.');

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.$executeRawUnsafe(
      `UPDATE "User" SET password = $1, "resetPasswordToken" = null, "resetPasswordExpires" = null WHERE id = $2`,
      hashed, users[0].id
    );

    return { success: true, message: 'Senha redefinida!' };
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, plan: user.plan };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        badges: user.badges,
        xp: user.xp || 0,
        emailVerified: user.emailVerified ?? false,
      }
    };
  }
}