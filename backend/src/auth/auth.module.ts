import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminInviteController } from './admin-invite.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { EventsModule } from '../events/events.module';
import { IgentCreditsService } from '../igent/igent-credits.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    PassportModule,
    EntitlementsModule,
    EventsModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '365d' },
      }),
    }),
  ],
  controllers: [AuthController, AdminInviteController],
  providers: [AuthService, JwtAuthGuard, IgentCreditsService],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
