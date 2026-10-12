import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { parseMlbCode } from './affiliate-rules';

// Mercado Livre (semiautomático): busca título, preço, fotos e nota de um
// anúncio pela API oficial. Os links de afiliado continuam manuais (botão
// Compartilhar do ML).
//
// A API pública fechou: /items e /sites/MLB/search respondem 403 sem token.
// Precisa de um app em developers.mercadolivre.com.br (ML_CLIENT_ID e
// ML_CLIENT_SECRET) e de conectar a conta pelo botão "Conectar Mercado Livre"
// no admin, que faz o OAuth com PKCE e volta em ML_REDIRECT_URI.
// O ML troca o refresh token a cada renovação e invalida o anterior, então o
// atual fica salvo em AppSettings. ML_REFRESH_TOKEN (opcional) só serve de
// semente se você gerar um à mão.

const API = 'https://api.mercadolibre.com';
const AUTH_URL = 'https://auth.mercadolivre.com.br/authorization';
const REFRESH_SETTING_KEY = 'ml_oauth_refresh_token';
const STATE_SETTING_KEY = 'ml_oauth_pending_state';
const STATE_TTL_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 12_000;

export const ML_REDIRECT_URI =
  process.env.ML_REDIRECT_URI || 'https://api.gatedo.com/api/store-affiliate/ml/callback';

export type MlLookup = {
  configured: boolean;
  id: string;
  externalId: string;
  name?: string;
  price?: number;
  images?: string[];
  rating?: number | null;
  permalink?: string | null;
};

const base64url = (buf: Buffer) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

@Injectable()
export class MercadoLivreService {
  private readonly logger = new Logger(MercadoLivreService.name);
  private accessToken: { value: string; expiresAt: number } | null = null;
  private refreshing: Promise<string> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** App do ML cadastrado no backend (client id e secret). */
  get credentialsConfigured() {
    return Boolean(process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET);
  }

  /** Conta conectada: tem refresh token salvo (pelo botão) ou na variável. */
  async isConnected() {
    if (!this.credentialsConfigured) return false;
    if (process.env.ML_REFRESH_TOKEN) return true;
    const stored = await this.prisma.appSettings.findUnique({ where: { key: REFRESH_SETTING_KEY } }).catch(() => null);
    return Boolean(stored?.value);
  }

  // ── Conectar a conta (OAuth authorization code + PKCE) ─────────────────────
  /** URL para o admin abrir; o state e o verifier valem 10 min e uma vez só. */
  async authorizationUrl() {
    if (!this.credentialsConfigured) {
      throw new BadRequestException('Defina ML_CLIENT_ID e ML_CLIENT_SECRET no backend antes de conectar.');
    }
    const state = base64url(crypto.randomBytes(24));
    const verifier = base64url(crypto.randomBytes(48));
    const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
    const value = JSON.stringify({ state, verifier, expiresAt: Date.now() + STATE_TTL_MS });
    await this.prisma.appSettings.upsert({
      where: { key: STATE_SETTING_KEY },
      update: { value },
      create: { key: STATE_SETTING_KEY, value },
    });
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.ML_CLIENT_ID as string,
      redirect_uri: ML_REDIRECT_URI,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    return `${AUTH_URL}?${params.toString()}`;
  }

  /** Callback do ML: confere o state, troca o code pelo token e salva o refresh. */
  async handleCallback(code: string, state: string) {
    const pending = await this.prisma.appSettings.findUnique({ where: { key: STATE_SETTING_KEY } }).catch(() => null);
    // Uso único: apaga antes de qualquer outra coisa.
    await this.prisma.appSettings.delete({ where: { key: STATE_SETTING_KEY } }).catch(() => null);
    let saved: { state: string; verifier: string; expiresAt: number } | null = null;
    try { saved = pending?.value ? JSON.parse(pending.value) : null; } catch { saved = null; }
    if (!saved || !state || saved.state !== state || saved.expiresAt < Date.now()) {
      throw new BadRequestException('Conexão expirada ou inválida. Clique em "Conectar Mercado Livre" de novo.');
    }
    if (!code) throw new BadRequestException('O Mercado Livre não devolveu o código de autorização.');

    const json = await this.tokenRequest({
      grant_type: 'authorization_code',
      client_id: process.env.ML_CLIENT_ID as string,
      client_secret: process.env.ML_CLIENT_SECRET as string,
      code,
      redirect_uri: ML_REDIRECT_URI,
      code_verifier: saved.verifier,
    });
    if (!json.refresh_token) {
      throw new BadRequestException('O ML não devolveu refresh token. Confira se o app tem o escopo offline_access.');
    }
    await this.saveRefreshToken(json.refresh_token);
    this.accessToken = { value: json.access_token, expiresAt: Date.now() + Number(json.expires_in || 21_600) * 1000 };
    return { ok: true, userId: json.user_id ?? null };
  }

  // ── Leitura do anúncio ─────────────────────────────────────────────────────
  /** Lê o anúncio/produto de catálogo. Sem conta conectada, só devolve o código MLB. */
  async lookup(input: string): Promise<MlLookup> {
    const parsed = parseMlbCode(input);
    if (!parsed) {
      throw new BadRequestException(
        /meli\.la/i.test(input)
          ? 'Link curto meli.la não traz o código. Abra o anúncio e cole o link da página ou o código MLB.'
          : 'Não achei um código MLB nesse texto.',
      );
    }
    const base = { id: parsed.id, externalId: `ml:${parsed.id}` };
    if (!(await this.isConnected())) return { configured: false, ...base };

    if (parsed.kind === 'product') {
      const product = await this.get<any>(`/products/${parsed.id}`);
      const winner = product.buy_box_winner;
      return {
        configured: true,
        ...base,
        name: product.name,
        price: Number(winner?.price) || undefined,
        images: (product.pictures || []).map((p: any) => p.url).filter(Boolean).slice(0, 6),
        rating: null,
        permalink: product.permalink ?? null,
      };
    }

    const item = await this.get<any>(`/items/${parsed.id}`);
    const rating = await this.get<any>(`/reviews/item/${parsed.id}`)
      .then((r) => (Number(r?.rating_average) || null))
      .catch(() => null);
    return {
      configured: true,
      ...base,
      name: item.title,
      price: Number(item.price) || undefined,
      images: (item.pictures || []).map((p: any) => p.secure_url || p.url).filter(Boolean).slice(0, 6),
      rating,
      permalink: item.permalink ?? null,
    };
  }

  private async get<T>(path: string, retried = false): Promise<T> {
    const token = await this.token();
    const response = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 401 && !retried) {
      this.accessToken = null;
      return this.get<T>(path, true);
    }
    if (response.status === 404) throw new NotFoundException('Anúncio não encontrado no Mercado Livre.');
    if (!response.ok) throw new BadRequestException(`API do Mercado Livre respondeu ${response.status}.`);
    return response.json() as Promise<T>;
  }

  private async token(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) return this.accessToken.value;
    // Uma renovação por vez: duas em paralelo queimariam o refresh token.
    this.refreshing ??= this.refresh().finally(() => { this.refreshing = null; });
    return this.refreshing;
  }

  // Tenta o refresh token salvo; se falhar (ex.: você gerou um novo e trocou a
  // variável), tenta o da variável de ambiente.
  private async refresh(): Promise<string> {
    const stored = await this.prisma.appSettings.findUnique({ where: { key: REFRESH_SETTING_KEY } });
    const envToken = process.env.ML_REFRESH_TOKEN || '';
    if (stored?.value && stored.value !== envToken) {
      try {
        return await this.refreshWith(stored.value);
      } catch {
        if (!envToken) throw new BadRequestException('Conexão com o Mercado Livre expirou. Clique em "Conectar Mercado Livre" de novo.');
        this.logger.warn('Refresh token salvo do Mercado Livre falhou; tentando o de ML_REFRESH_TOKEN.');
      }
    }
    if (!envToken) throw new BadRequestException('Mercado Livre não conectado. Clique em "Conectar Mercado Livre".');
    return this.refreshWith(envToken);
  }

  private async refreshWith(refreshToken: string): Promise<string> {
    const json = await this.tokenRequest({
      grant_type: 'refresh_token',
      client_id: process.env.ML_CLIENT_ID as string,
      client_secret: process.env.ML_CLIENT_SECRET as string,
      refresh_token: refreshToken,
    });
    if (json.refresh_token && json.refresh_token !== refreshToken) await this.saveRefreshToken(json.refresh_token);
    this.accessToken = { value: json.access_token, expiresAt: Date.now() + Number(json.expires_in || 21_600) * 1000 };
    return json.access_token;
  }

  private async tokenRequest(body: Record<string, string>) {
    const response = await fetch(`${API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json: any = await response.json().catch(() => null);
    if (!response.ok || !json?.access_token) {
      this.logger.error(`OAuth do Mercado Livre (${body.grant_type}) falhou: ${response.status} ${json?.error || ''} ${json?.message || ''}`);
      throw new BadRequestException(`Mercado Livre recusou a autenticação${json?.message ? `: ${json.message}` : '.'}`);
    }
    return json;
  }

  private saveRefreshToken(value: string) {
    return this.prisma.appSettings.upsert({
      where: { key: REFRESH_SETTING_KEY },
      update: { value },
      create: { key: REFRESH_SETTING_KEY, value },
    });
  }
}
