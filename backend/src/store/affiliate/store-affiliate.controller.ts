import {
  BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, NotFoundException,
  Post, Query, Req, Res, UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { LEGACY_CATEGORY, MEDICINE_MESSAGE, canonicalCategoryName, isBlockedCategory, isHiddenCategory, normalizeImages, sameName } from '../product-rules';
import {
  AffiliateOffer, DEFAULT_OFFER_FILTERS, OfferFilters, SHORT_NAME_MAX, filterOffers, isMedicineProduct, shopeeSubIds, slugify,
  sortByCommissionValue, suggestShortName, uniqueSlug,
} from './affiliate-rules';
import { ML_REDIRECT_URI, MercadoLivreService } from './mercadolivre.service';
import { ShopeeAffiliateService } from './shopee-affiliate.service';
import { StoreSyncService } from './store-sync.service';

const MAX_IMAGES = 6;

// Admin "Loja & Afiliados" → aba "Buscar ofertas". Tudo nasce RASCUNHO:
// nenhuma rota aqui publica produto.
@Controller('store-affiliate')
@UseGuards(JwtAuthGuard)
export class StoreAffiliateController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopee: ShopeeAffiliateService,
    private readonly ml: MercadoLivreService,
    private readonly sync: StoreSyncService,
  ) {}

  private assertAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN.');
  }

  @Get('status')
  async status(@Req() req: any) {
    this.assertAdmin(req);
    return {
      shopee: { configured: this.shopee.configured, mock: this.shopee.mock },
      mercadoLivre: {
        configured: this.ml.credentialsConfigured,
        connected: await this.ml.isConnected(),
        redirectUri: ML_REDIRECT_URI,
      },
      defaultFilters: DEFAULT_OFFER_FILTERS,
    };
  }

  // ── Shopee: busca ─────────────────────────────────────────────────────────
  @Post('shopee/search')
  async search(@Req() req: any, @Body() body: { keyword?: string; page?: number; filters?: Partial<OfferFilters> }) {
    this.assertAdmin(req);
    const keyword = String(body?.keyword ?? '').trim();
    if (keyword.length < 2) throw new BadRequestException('Digite ao menos 2 letras para buscar.');
    const filters = { ...DEFAULT_OFFER_FILTERS, ...cleanFilters(body?.filters) };

    const offers = await this.shopee.searchOffers(keyword, Number(body?.page) || 1);
    return this.searchResponse('shopee', offers, filters, this.shopee.mock);
  }

  // ── Mercado Livre: busca (com o token da conta conectada) ─────────────────
  @Post('ml/search')
  async mlSearch(@Req() req: any, @Body() body: { keyword?: string; filters?: Partial<OfferFilters> }) {
    this.assertAdmin(req);
    const keyword = String(body?.keyword ?? '').trim();
    if (keyword.length < 2) throw new BadRequestException('Digite ao menos 2 letras para buscar.');
    const filters = { ...DEFAULT_OFFER_FILTERS, ...cleanFilters(body?.filters) };
    const offers = await this.ml.search(keyword);
    return this.searchResponse('ml', offers, filters, false);
  }

  // ── Mercado Livre: cadastrar como rascunho (links continuam manuais) ──────
  @Post('ml/register')
  async mlRegister(@Req() req: any, @Body() body: { itemId?: string; name?: string; categoryName?: string; mlKind?: string }) {
    this.assertAdmin(req);
    const itemId = String(body?.itemId ?? '').trim().toUpperCase();
    if (!/^MLB\d+$/.test(itemId)) throw new BadRequestException('Código MLB inválido.');
    const externalId = `ml:${itemId}`;
    await this.assertNotRegistered(externalId);

    // Produto de catálogo é lido por /products (o lookup reconhece /p/MLB…).
    const item = await this.ml.lookup(body?.mlKind === 'product' ? `/p/${itemId}` : itemId);
    if (!item.configured) throw new BadRequestException('Mercado Livre não conectado.');
    if (item.name && isMedicineProduct(item.name)) throw new BadRequestException(MEDICINE_MESSAGE);
    const name = String(body?.name ?? '').trim() || suggestShortName(item.name || itemId);
    if (name.length > SHORT_NAME_MAX) throw new BadRequestException(`Nome curto com mais de ${SHORT_NAME_MAX} caracteres.`);
    const category = await this.resolveCategory(body?.categoryName);
    const slug = await this.freeSlug(name);

    return this.createDraft({
      name,
      description: '',
      price: item.price ?? 0,
      priceCheckedAt: item.price ? new Date() : null,
      platform: 'Mercado Livre',
      categoryId: category.id,
      status: 'draft',
      subid: slug,
      rating: item.rating ?? null,
      images: normalizeImages(item.images || []).valid.slice(0, MAX_IMAGES),
      externalId,
      tags: [],
    });
  }

  private async searchResponse(source: 'shopee' | 'ml', offers: AffiliateOffer[], filters: OfferFilters, mock: boolean) {
    const visible = sortByCommissionValue(filterOffers(offers, filters));
    const registered = await this.prisma.product.findMany({
      where: { externalId: { in: visible.map((o) => o.externalId) } },
      select: { id: true, externalId: true, status: true },
    });
    const byExternalId = new Map(registered.map((p) => [p.externalId, p]));
    return {
      source,
      mock,
      filters,
      total: offers.length,
      hidden: offers.length - visible.length,
      offers: visible.map((o) => ({
        ...o,
        suggestedName: suggestShortName(o.name),
        registeredProduct: byExternalId.get(o.externalId) ?? null,
      })),
    };
  }

  private async freeSlug(name: string) {
    const taken = new Set(
      (await this.prisma.product.findMany({ where: { subid: { not: null } }, select: { subid: true } }))
        .map((p) => p.subid as string),
    );
    return uniqueSlug(slugify(name), taken);
  }

  private async createDraft(data: any) {
    try {
      return await this.prisma.product.create({ data, include: { category: true } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Esse produto já está cadastrado.');
      }
      throw error;
    }
  }

  // ── Shopee: cadastrar como rascunho ───────────────────────────────────────
  @Post('shopee/register')
  async register(@Req() req: any, @Body() body: { itemId?: string; name?: string; categoryName?: string }) {
    this.assertAdmin(req);
    const itemId = String(body?.itemId ?? '').trim();
    if (!itemId) throw new BadRequestException('itemId obrigatório.');
    const externalId = `shopee:${itemId}`;
    await this.assertNotRegistered(externalId);

    const offer = await this.shopee.getOffer(itemId);
    if (!offer) throw new NotFoundException('Oferta não encontrada na Shopee. Refaça a busca.');
    if (isMedicineProduct(offer.name)) throw new BadRequestException(MEDICINE_MESSAGE);
    if (!offer.productLink) throw new BadRequestException('A Shopee não devolveu o link do produto.');

    const name = String(body?.name ?? '').trim() || suggestShortName(offer.name);
    if (name.length > SHORT_NAME_MAX) throw new BadRequestException(`Nome curto com mais de ${SHORT_NAME_MAX} caracteres.`);
    const category = await this.resolveCategory(body?.categoryName);

    const slug = await this.freeSlug(name);
    const subIds = shopeeSubIds(slug);
    const linkApp = await this.shopee.shortLink(offer.productLink, subIds.app);
    const linkGroup = await this.shopee.shortLink(offer.productLink, subIds.grp);

    return this.createDraft({
          name,
          description: this.shopee.mock ? 'Cadastrado em modo mock (API Shopee não configurada). Pode apagar.' : '',
          price: offer.price,
          priceCheckedAt: new Date(),
          platform: 'Shopee',
          categoryId: category.id,
          status: 'draft',
          linkApp,
          externalLink: linkApp,
          linkGroup,
          subid: slug,
          commissionPct: offer.commissionPct,
          commissionValue: offer.commissionValue,
          commissionExtra: offer.commissionExtra,
          rating: offer.rating,
          salesCount: offer.sales,
          shopOfficial: offer.officialShop,
          images: normalizeImages(offer.images).valid.slice(0, MAX_IMAGES),
          externalId,
          tags: this.shopee.mock ? ['mock'] : [],
    });
  }

  // ── Mercado Livre: preencher rascunho ─────────────────────────────────────
  @Post('ml/lookup')
  async mlLookup(@Req() req: any, @Body() body: { input?: string }) {
    this.assertAdmin(req);
    const result = await this.ml.lookup(String(body?.input ?? ''));
    await this.assertNotRegistered(result.externalId);
    return {
      ...result,
      suggestedName: result.name ? suggestShortName(result.name) : undefined,
      medicine: result.name ? isMedicineProduct(result.name) : false,
    };
  }

  // Botão "Conectar Mercado Livre": devolve a URL de autorização do ML.
  @Get('ml/connect')
  async mlConnect(@Req() req: any) {
    this.assertAdmin(req);
    return { url: await this.ml.authorizationUrl() };
  }

  // ── Rotina diária: disparo manual ─────────────────────────────────────────
  @Post('sync/run')
  async runSync(@Req() req: any) {
    this.assertAdmin(req);
    return this.sync.runDaily();
  }

  private async assertNotRegistered(externalId: string) {
    const existing = await this.prisma.product.findUnique({ where: { externalId }, select: { id: true, name: true } });
    if (existing) throw new ConflictException(`Já cadastrado como "${existing.name}".`);
  }

  // Mesmas regras do cadastro manual: categoria existente, sem Medicamento e
  // sem Saúde (legado).
  private async resolveCategory(name?: string) {
    const wanted = canonicalCategoryName(name);
    if (!wanted) throw new BadRequestException('Escolha a categoria.');
    if (isBlockedCategory(wanted)) throw new BadRequestException(MEDICINE_MESSAGE);
    const category = (await this.prisma.category.findMany()).find((c) => sameName(c.name, wanted));
    if (!category) throw new BadRequestException(`Categoria "${wanted}" não existe.`);
    if (isHiddenCategory(category.name) || sameName(category.name, LEGACY_CATEGORY)) {
      throw new BadRequestException(`Categoria "${category.name}" não aceita produto novo.`);
    }
    return category;
  }
}

function cleanFilters(raw: Partial<OfferFilters> | undefined): Partial<OfferFilters> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Partial<OfferFilters> = {};
  if (Number.isFinite(Number(raw.minRating))) out.minRating = Math.max(0, Math.min(5, Number(raw.minRating)));
  if (Number.isFinite(Number(raw.minSales))) out.minSales = Math.max(0, Number(raw.minSales));
  if (typeof raw.hideDog === 'boolean') out.hideDog = raw.hideDog;
  if (typeof raw.hideMedicine === 'boolean') out.hideMedicine = raw.hideMedicine;
  return out;
}

// Callback do OAuth do Mercado Livre (URI de redirect cadastrada no app do ML:
// https://api.gatedo.com/api/store-affiliate/ml/callback). Público — quem
// protege é o state de uso único gerado pelo admin. Volta para o admin da Loja.
const ADMIN_STORE_URL = `${(process.env.ADMIN_APP_URL || 'https://app.gatedo.com').replace(/\/+$/, '')}/admin/store`;

@Controller('store-affiliate/ml')
export class MercadoLivreCallbackController {
  constructor(private readonly ml: MercadoLivreService) {}

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Query('error') error: string, @Res() res: any) {
    if (error) return res.redirect(302, `${ADMIN_STORE_URL}?ml=erro&msg=${encodeURIComponent(`Autorização negada (${error}).`)}`);
    try {
      await this.ml.handleCallback(code, state);
      return res.redirect(302, `${ADMIN_STORE_URL}?ml=ok`);
    } catch (err: any) {
      const msg = err?.response?.message || err?.message || 'Falha ao conectar.';
      return res.redirect(302, `${ADMIN_STORE_URL}?ml=erro&msg=${encodeURIComponent(String(msg))}`);
    }
  }
}
