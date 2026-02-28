import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service'; 
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './auth.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
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

    // Lógica de Lançamento: Define plano e badges baseado na origem
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

    // USANDO 'as any' PARA IGNORAR ERROS DE CACHE DO PRISMA CLIENT
    const user = await (this.prisma.user as any).create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: 'USER',
        plan: userPlan,
        badges: userBadges,
        xp: initialXP,
        emailVerified: false,
      },
    });

    const token = this.generateToken(user);

    // Gera token de verificação de email
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: { emailVerifyToken: verifyToken },
    });

    // Dispara emails em background — não bloqueia a resposta
    this.emailService.sendWelcome(user.email, user.name || 'Tutor', userPlan);
    this.emailService.sendEmailVerification(user.email, user.name || 'Tutor', verifyToken);

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

  // Verificação por token (link do email)
  async verifyEmail(token: string) {
    const user = await (this.prisma.user as any).findUnique({
      where: { emailVerifyToken: token },
    });
    if (!user) throw new BadRequestException('Token de verificação inválido ou já utilizado.');

    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        xp: { increment: 50 },
      },
    });

    return { success: true, message: 'Email verificado com sucesso! +50 XP' };
  }

  // Solicitar redefinição de senha
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Resposta genérica — não revela se o email existe
    if (!user) return { success: true, message: 'Se este email estiver cadastrado, você receberá as instruções.' };

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora

    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expires },
    });

    await this.emailService.sendPasswordReset(user.email, user.name || 'Tutor', token);
    return { success: true, message: 'Se este email estiver cadastrado, você receberá as instruções.' };
  }

  // Redefinir senha com token
  async resetPassword(token: string, newPassword: string) {
    const user = await (this.prisma.user as any).findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Token inválido ou expirado. Solicite um novo link.');

    const hashed = await bcrypt.hash(newPassword, 10);

    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { success: true, message: 'Senha redefinida com sucesso!' };
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
        emailVerified: user.emailVerified || false,
      }
    };
  }
}