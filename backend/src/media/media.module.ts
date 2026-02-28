import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { CloudflareService } from '../cloudflare.service'; // <--- Importe o serviço

@Module({
  controllers: [MediaController],
  providers: [CloudflareService], // <--- REGISTRE O SERVIÇO AQUI!
})
export class MediaModule {}