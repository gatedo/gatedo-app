import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
      signOptions: { expiresIn: '30d' }, 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, EmailService],
  exports: [AuthService]
})
export class AuthModule {}