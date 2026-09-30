import { Logger, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

const logger = new Logger('KiwifySignature');

// Webhooks da Kiwify liberam plano do Clube e protocolo pago. Antes a
// assinatura só era conferida SE viesse no header — sem header, qualquer um
// mandava um "order_approved" com o próprio e-mail e ganhava acesso.
//
// A Kiwify manda a assinatura como query string (`?signature=`), HMAC-SHA1 do
// corpo JSON com o token do webhook. Aceitamos também o header antigo.
//
// Válvula de emergência: KIWIFY_ALLOW_UNSIGNED=true volta a aceitar webhook
// sem assinatura válida (com aviso no log). Usar só enquanto se confere o
// KIWIFY_TOKEN — e desligar depois.
export function assertKiwifySignature(body: unknown, headerSignature?: string, querySignature?: string) {
  // Cada webhook na Kiwify tem o próprio token (Clube e protocolos são
  // webhooks diferentes) — KIWIFY_TOKEN aceita vários, separados por vírgula.
  const secrets = String(process.env.KIWIFY_TOKEN || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const allowUnsigned = process.env.KIWIFY_ALLOW_UNSIGNED === 'true';
  const signature = String(querySignature || headerSignature || '').trim();
  const payload = JSON.stringify(body);

  const valid =
    !!signature &&
    secrets.some((secret) => {
      const a = Buffer.from(crypto.createHmac('sha1', secret).update(payload).digest('hex'));
      const b = Buffer.from(signature);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
  if (valid) return;

  const reason = !secrets.length ? 'KIWIFY_TOKEN não configurado' : !signature ? 'assinatura ausente' : 'assinatura inválida';
  if (allowUnsigned) {
    logger.warn(`Webhook Kiwify aceito SEM verificação (${reason}) porque KIWIFY_ALLOW_UNSIGNED=true.`);
    return;
  }
  logger.warn(`Webhook Kiwify rejeitado: ${reason}.`);
  throw new UnauthorizedException();
}
