import { Module, Global } from '@nestjs/common';
import { CloudflareService } from './cloudflare.service';

@Global() // Disponível em todos os módulos sem precisar importar
@Module({
  providers: [CloudflareService],
  exports: [CloudflareService],
})
export class CloudflareModule {}
