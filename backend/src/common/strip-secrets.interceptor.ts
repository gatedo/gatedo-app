import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

// Rede de segurança global: nenhum desses campos sai da API, em nenhuma rota,
// não importa o `include` que o Prisma fez. Existe porque vários endpoints
// faziam `user: true` / `owner: true` e mandavam o hash da senha e os tokens
// de reset/verificação de e-mail do tutor pra qualquer usuário logado.
// Isso NÃO substitui o `select` correto em cada rota — é o cinto, não o airbag.
const SECRET_KEYS = new Set(['password', 'resetPasswordToken', 'emailVerifyToken']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function stripSecrets<T>(value: T, seen = new WeakSet<object>()): T {
  if (Array.isArray(value)) {
    if (seen.has(value)) return value;
    seen.add(value);
    for (let i = 0; i < value.length; i++) value[i] = stripSecrets(value[i], seen);
    return value;
  }
  if (!isPlainObject(value)) return value; // Date, Buffer, StreamableFile etc. passam intactos
  if (seen.has(value)) return value;
  seen.add(value);
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (SECRET_KEYS.has(key)) {
      delete obj[key];
    } else {
      obj[key] = stripSecrets(obj[key], seen);
    }
  }
  return value;
}

@Injectable()
export class StripSecretsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => stripSecrets(data)));
  }
}
