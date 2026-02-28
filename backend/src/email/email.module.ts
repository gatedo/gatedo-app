/**
 * email.module.ts
 * Coloque em: src/email/email.module.ts
 */
import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

@Global() // disponível em todos os módulos sem precisar importar
@Module({
  providers: [EmailService],
  exports:   [EmailService],
})
export class EmailModule {}