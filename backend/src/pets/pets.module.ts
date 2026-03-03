// src/pets/pets.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { PrismaService } from '../prisma.service';
import { CloudflareService } from '../cloudflare.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
  ],
  controllers: [PetsController],
  providers: [PetsService, PrismaService, CloudflareService],
})
export class PetsModule {}