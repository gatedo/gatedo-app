import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseMlbCode } from './affiliate-rules';

// Mercado Livre (semiautomático): busca título, preço, fotos e nota de um
// anúncio pela API oficial. Os links de afiliado continuam manuais (botão
// Compartilhar do ML).
//
// A API pública fechou: /items e /sites/MLB/search respondem 403 sem token.
// Precisa de um app em developers.mercadolivre.com.br e OAuth:
//   ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REFRESH_TOKEN (o primeiro).
// O ML troca o refresh token a cada renovação e invalida o anterior, então o
// atual fica salvo em AppSettings (a variável só serve de semente).

const API = 'https://api.mercadolibre.com';
const REFRESH_SETTING_KEY = 'ml_oauth_refresh_token';
const TIMEOUT_MS = 12_000;

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

@Injectable()
export class MercadoLivreService {
  private readonly logger = new Logger(MercadoLivreService.name);
  private accessToken: { value: string; expiresAt: number } | null = null;
  private refreshing: Promise<string> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  get configured() {
    return Boolean(process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET && process.env.ML_REFRESH_TOKEN);
  }

  /** Lê o anúncio/produto de catálogo. Sem OAuth, só devolve o código MLB. */
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
    if (!this.configured) return { configured: false, ...base };

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
    const envToken = process.env.ML_REFRESH_TOKEN as string;
    if (stored?.value && stored.value !== envToken) {
      try {
        return await this.refreshWith(stored.value);
      } catch {
        this.logger.warn('Refresh token salvo do Mercado Livre falhou; tentando o de ML_REFRESH_TOKEN.');
      }
    }
    return this.refreshWith(envToken);
  }

  private async refreshWith(refreshToken: string): Promise<string> {
    const response = await fetch(`${API}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ML_CLIENT_ID as string,
        client_secret: process.env.ML_CLIENT_SECRET as string,
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json: any = await response.json().catch(() => null);
    if (!response.ok || !json?.access_token) {
      this.logger.error(`OAuth do Mercado Livre falhou: ${response.status} ${json?.message || ''}`);
      throw new BadRequestException('Não consegui autenticar no Mercado Livre. Gere um novo ML_REFRESH_TOKEN.');
    }
    if (json.refresh_token && json.refresh_token !== refreshToken) {
      await this.prisma.appSettings.upsert({
        where: { key: REFRESH_SETTING_KEY },
        update: { value: json.refresh_token },
        create: { key: REFRESH_SETTING_KEY, value: json.refresh_token },
      });
    }
    this.accessToken = { value: json.access_token, expiresAt: Date.now() + Number(json.expires_in || 21_600) * 1000 };
    return json.access_token;
  }
}
