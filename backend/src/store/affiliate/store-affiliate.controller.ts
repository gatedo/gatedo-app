import {
  BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, NotFoundException,
  Post, Req, UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { LEGACY_CATEGORY, MEDICINE_MESSAGE, isBlockedCategory, isHiddenCategory, normalizeImages, sameName } from '../product-rules';
import {
  DEFAULT_OFFER_FILTERS, OfferFilters, SHORT_NAME_MAX, filterOffers, isMedicineProduct, shopeeSubIds, slugify,
  sortByCommissionValue, suggestShortName, uniqueSlug,
} from './affiliate-rules';
import { MercadoLivreService } from './mercadolivre.service';
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
  status(@Req() req: any) {
    this.assertAdmin(req);
    return {
      shopee: { configured: this.shopee.configured, mock: this.shopee.mock },
      mercadoLivre: { configured: this.ml.configured },
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
    const visible = sortByCommissionValue(filterOffers(offers, filters));
    const registered = await this.prisma.product.findMany({
      where: { externalId: { in: visible.map((o) => o.externalId) } },
      select: { id: true, externalId: true, status: true },
    });
    const byExternalId = new Map(registered.map((p) => [p.externalId, p]));

    return {
      mock: this.shopee.mock,
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

    const taken = new Set(
      (await this.prisma.product.findMany({ where: { subid: { not: null } }, select: { subid: true } }))
        .map((p) => p.subid as string),
    );
    const slug = uniqueSlug(slugify(name), taken);
    const subIds = shopeeSubIds(slug);
    const linkApp = await this.shopee.shortLink(offer.productLink, subIds.app);
    const linkGroup = await this.shopee.shortLink(offer.productLink, subIds.grp);

    try {
      return await this.prisma.product.create({
        data: {
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
        },
        include: { category: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Esse produto já está cadastrado.');
      }
      throw error;
    }
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
    const wanted = String(name ?? '').trim();
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
