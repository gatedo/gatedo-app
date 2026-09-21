import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MediaController } from './media.controller';
import { CloudflareService } from '../cloudflare/cloudflare.service'; // <--- Importe o serviço
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_GATEDO',
    }),
  ],
  controllers: [MediaController],
  providers: [CloudflareService, JwtAuthGuard], // <--- REGISTRE O SERVIÇO AQUI!
})
export class MediaModule {}