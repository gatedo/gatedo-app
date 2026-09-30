import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import * as crypto from 'crypto';
import { Observable, map } from 'rxjs';

// /uploads guarda exames em PDF e fotos do iGentVet. Antes era servido por
// express.static sem checagem nenhuma — e os nomes são timestamp + 5 dígitos,
// fáceis de adivinhar. Agora só abre com link assinado e com validade.
//
// Quem assina: o SignUploadsInterceptor, na SAÍDA de qualquer resposta da
// API. Como essas respostas só chegam a quem já passou pela checagem de dono
// da rota (documentos, iGentVet…), assinar ali é o mesmo que dizer "esse
// usuário pode abrir esse arquivo agora".

const UPLOADS_PREFIX = '/uploads/';
const TTL_SECONDS = 6 * 60 * 60; // 6h — cobre uma aba aberta a tarde toda

function secret() {
  // Mesmo segredo do JWT: já é obrigatório pro backend subir (ver main.ts).
  return process.env.JWT_SECRET || '';
}

function signature(pathname: string, exp: number) {
  return crypto.createHmac('sha256', secret()).update(`${pathname}:${exp}`).digest('base64url');
}

export function signUploadPath(url: string): string {
  const pathname = url.split('?')[0];
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return `${pathname}?e=${exp}&s=${signature(pathname, exp)}`;
}

// Middleware montado em /uploads antes do express.static.
export function verifySignedUpload(req: Request, res: Response, next: NextFunction) {
  const pathname = `/uploads${req.path}`;
  const exp = Number(req.query.e);
  const given = String(req.query.s || '');

  if (!exp || !given || exp < Math.floor(Date.now() / 1000)) {
    res.status(403).send('Link expirado ou inválido.');
    return;
  }
  const expected = signature(pathname, exp);
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(403).send('Link expirado ou inválido.');
    return;
  }
  next();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function signDeep<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value === 'string') {
    return (value.startsWith(UPLOADS_PREFIX) ? signUploadPath(value) : value) as T;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) return value;
    seen.add(value);
    for (let i = 0; i < value.length; i++) value[i] = signDeep(value[i], seen);
    return value;
  }
  if (!isPlainObject(value)) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) obj[key] = signDeep(obj[key], seen);
  return value;
}

@Injectable()
export class SignUploadsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => signDeep(data)));
  }
}
