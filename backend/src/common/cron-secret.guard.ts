import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';

// Rotas chamadas por cron externo (disparo de push/e-mail em massa). Antes
// eram abertas: qualquer um na internet podia disparar notificação pra todos
// os tutores quantas vezes quisesse.
//
// O cron manda o segredo no header `x-cron-secret` (ou `?secret=` pra
// serviços de cron que não deixam configurar header).
//
// Transição: enquanto CRON_SECRET não estiver definido no ambiente, a rota
// continua aberta (com aviso no log) pra não derrubar os lembretes que já
// rodam. Assim que a variável existir, só passa quem mandar o segredo.
@Injectable()
export class CronSecretGuard implements CanActivate {
  private static warned = false;
  private readonly logger = new Logger(CronSecretGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
      if (!CronSecretGuard.warned) {
        this.logger.warn('CRON_SECRET não definido — rotas de cron estão abertas. Defina a variável e configure o header x-cron-secret no cron.');
        CronSecretGuard.warned = true;
      }
      return true;
    }
    const req = context.switchToHttp().getRequest();
    const given = req.headers?.['x-cron-secret'] || req.query?.secret;
    if (given !== expected) throw new ForbiddenException('Segredo do cron inválido.');
    return true;
  }
}
