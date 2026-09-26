import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsModule } from '../events/events.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// CloudflareService NÃO precisa ser declarado aqui
// O @Global() do CloudflareModule já o injeta automaticamente

@Module({
  imports: [
    EventsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    JwtAuthGuard,
  ],
  exports: [UsersService],
})
export class UsersModule {}
