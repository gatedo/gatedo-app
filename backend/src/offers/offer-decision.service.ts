import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IgentCreditsService } from '../igent/igent-credits.service';

const PROTOCOL_XIXI_SLUG = 'xixi-fora-da-caixa';
const URINARY_OCCURRENCE_KEY = 'URINARY_ACCIDENT';

// Mesma régua fixa de leitura de padrão usada na Linha do tempo/Saúde do
// frontend (utils/weightAlerts.js) — portada aqui pro backend ser dono de
// verdade do sinal "existe alerta de saúde ativo", sem confiar no cliente.
const WEIGHT_CHECKIN_RE = /check-in de peso[:\s]*([\d.,]+)\s*kg/i;

type HealthRecordLite = { id: string; type: string; title: string | null; date: Date; nextDueDate?: Date | null };

function extractWeightSeries(records: HealthRecordLite[]) {
  return records
    .filter((r) => r.type === 'EXAM' && WEIGHT_CHECKIN_RE.test(r.title || ''))
    .map((r) => {
      const match = (r.title || '').match(WEIGHT_CHECKIN_RE);
      const weight = parseFloat(String(match?.[1] || '').replace(',', '.'));
      return { date: new Date(r.date), weight };
    })
    .filter((p) => Number.isFinite(p.weight) && p.weight > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function hasWeightPatternAlert(series: { date: Date; weight: number }[]): boolean {
  if (series.length < 2) return false;
  const latest = series[series.length - 1];

  const baselineWithin = (days: number) => {
    const cutoff = new Date(latest.date.getTime() - days * 86400000);
    return series.find((p) => p.date >= cutoff && p.date.getTime() < latest.date.getTime()) || null;
  };
  const pctChange = (base: { weight: number }) => ((latest.weight - base.weight) / base.weight) * 100;

  const b90 = baselineWithin(90);
  if (b90 && pctChange(b90) <= -5) return true;

  const b180 = baselineWithin(180);
  if (b180) {
    const pct = pctChange(b180);
    if (pct <= -8 || pct >= 15) return true;
  }
  return false;
}

function computeAgeMonths(pet: { birthDate?: Date | null; ageYears?: number | null; ageMonths?: number | null }): number | null {
  if (pet.birthDate) {
    const now = new Date();
    return (now.getFullYear() - pet.birthDate.getFullYear()) * 12 + (now.getMonth() - pet.birthDate.getMonth());
  }
  if (pet.ageYears != null || pet.ageMonths != null) return (pet.ageYears || 0) * 12 + (pet.ageMonths || 0);
  return null;
}

export type OfferPayload = {
  offerKey: string;
  type: 'PROTOCOL' | 'PRODUCT' | 'GUIDE' | 'CONTINUE_PROTOCOL' | 'GPTS';
  title: string;
  description: string;
  ctaLabel: string;
  ctaPath: string;
  reason?: string | null;
};

export type HealthAlertPayload = { catId: string; catName: string; message: string };

export type DecideResult = { offer: OfferPayload | null; alert?: HealthAlertPayload | null };

// ─── Verbetes-ponte pra oferta (definidos junto com o import do almanaque) ──
const FALLBACK_GUIDE_SLUGS = ['caixa-fora', 'saude-peso', 'saude-sede', 'saude-esconde-dor'];

@Injectable()
export class OfferDecisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly igentCredits: IgentCreditsService,
  ) {}

  // ─── Sinais brutos, recalculados aqui — nunca confia no que o cliente manda ──

  async hasActiveHealthAlert(userId: string): Promise<HealthAlertPayload | null> {
    const pets = await this.prisma.pet.findMany({
      where: { ownerId: userId, isMemorial: false, isArchived: false },
      select: {
        id: true,
        name: true,
        healthRecords: { select: { id: true, type: true, title: true, date: true, nextDueDate: true } },
      },
    });

    const now = Date.now();
    for (const pet of pets) {
      const overdue = pet.healthRecords.find(
        (r) => ['VACCINE', 'VERMIFUGE', 'PARASITE'].includes(r.type) && r.nextDueDate && new Date(r.nextDueDate).getTime() < now,
      );
      if (overdue) {
        return { catId: pet.id, catName: pet.name, message: `${overdue.title || 'Preventivo'} vencido` };
      }

      const series = extractWeightSeries(pet.healthRecords);
      if (hasWeightPatternAlert(series)) {
        return { catId: pet.id, catName: pet.name, message: 'Padrão de peso fora do esperado' };
      }
    }
    return null;
  }

  async getAvailableProtocolDay(userId: string) {
    const enrollments = await this.prisma.protocolEnrollment.findMany({
      where: { userId, status: 'EM_ANDAMENTO' },
      include: {
        protocol: { select: { title: true, slug: true } },
        logs: { select: { dayNumber: true, unlockedAt: true, completedAt: true } },
      },
    });

    const now = Date.now();
    for (const enr of enrollments) {
      const log = enr.logs.find((l) => l.dayNumber === enr.currentDay);
      if (log && !log.completedAt && new Date(log.unlockedAt).getTime() <= now) {
        return { slug: enr.protocol.slug, title: enr.protocol.title, dayNumber: enr.currentDay };
      }
    }
    return null;
  }

  async hasProtocolXixiEntitlement(userId: string): Promise<boolean> {
    const protocol = await this.prisma.protocol.findUnique({
      where: { slug: PROTOCOL_XIXI_SLUG },
      select: { entitlementProductId: true },
    });
    if (!protocol?.entitlementProductId) return false;

    const found = await this.prisma.productEntitlement.findUnique({
      where: { userId_productId: { userId, productId: protocol.entitlementProductId } },
    });
    return !!found;
  }

  async hasRecentUrinaryOccurrence(userId: string, days = 14): Promise<boolean> {
    const cutoff = new Date(Date.now() - days * 86400000);
    const count = await this.prisma.diaryEntry.count({
      where: {
        pet: { ownerId: userId },
        date: { gte: cutoff },
        occurrences: { has: URINARY_OCCURRENCE_KEY },
      },
    });
    return count > 0;
  }

  async youngestCatUnder12Months(userId: string) {
    const pets = await this.prisma.pet.findMany({
      where: { ownerId: userId, isMemorial: false, isArchived: false },
      select: { id: true, name: true, birthDate: true, ageYears: true, ageMonths: true },
    });
    for (const pet of pets) {
      const months = computeAgeMonths(pet);
      if (months != null && months < 12) return pet;
    }
    return null;
  }

  async igentCreditsLow(userId: string): Promise<boolean> {
    const status = await this.igentCredits.getStatus(userId);
    if (status.limit == null || status.remaining == null) return false;
    return status.remaining < 2;
  }

  async pickFallbackGuideEntry() {
    const dayIndex = Math.floor(Date.now() / 86400000) % FALLBACK_GUIDE_SLUGS.length;
    const slug = FALLBACK_GUIDE_SLUGS[dayIndex];
    return this.prisma.guideEntry.findUnique({
      where: { slug },
      select: { slug: true, title: true, excerpt: true },
    });
  }

  async isVaccineWalletComplete(petId: string): Promise<boolean> {
    const records = await this.prisma.healthRecord.findMany({
      where: { petId, type: 'VACCINE' },
      select: { title: true, nextDueDate: true },
    });
    const now = Date.now();
    const hasOverdue = records.some((r) => r.nextDueDate && new Date(r.nextDueDate).getTime() < now);
    if (hasOverdue) return false;

    const hasRabies = records.some((r) => /antirr[aá]bic/i.test(r.title || ''));
    const hasPolyvalent = records.some((r) => /(polivalente|\bv[345]\b)/i.test(r.title || ''));
    return hasRabies && hasPolyvalent;
  }

  private buildProtocolOffer(): OfferPayload {
    return {
      offerKey: 'protocol-xixi',
      type: 'PROTOCOL',
      title: 'Protocolo Xixi Fora da Caixa',
      description: 'Um passo a passo guiado, dia a dia, pra investigar e resolver.',
      ctaLabel: 'Conhecer o protocolo',
      ctaPath: `/protocolos/${PROTOCOL_XIXI_SLUG}`,
    };
  }

  // ─── Cascata única — usada pelo slot da home e pelos cards pós-sucesso ──────
  // `skipContinueProtocol`: a home já tem a seção "O que precisa de você
  // hoje" cobrindo "continuar protocolo em andamento" com o gato certo
  // pré-selecionado (matrícula já sabe qual gato é). Sem isso o slot único
  // ("Pra você") ficava redundante, mostrando o mesmo card duas vezes na
  // mesma tela. Pós-sucesso não tem essa seção, então lá a cascata segue
  // considerando continuar protocolo normalmente.
  async decideGeneralOffer(userId: string, opts: { skipContinueProtocol?: boolean } = {}): Promise<DecideResult> {
    const alert = await this.hasActiveHealthAlert(userId);
    if (alert) return { offer: null, alert };

    if (!opts.skipContinueProtocol) {
      const protocolDay = await this.getAvailableProtocolDay(userId);
      if (protocolDay) {
        return {
          offer: {
            offerKey: 'continue-protocol',
            type: 'CONTINUE_PROTOCOL',
            title: `Dia ${protocolDay.dayNumber} disponível`,
            description: `Continue o ${protocolDay.title} — o dia de hoje já está liberado.`,
            ctaLabel: 'Continuar protocolo',
            ctaPath: `/protocolos/${protocolDay.slug}`,
          },
          alert: null,
        };
      }
    }

    const hasEntitlement = await this.hasProtocolXixiEntitlement(userId);
    if (!hasEntitlement) {
      const hasUrinary = await this.hasRecentUrinaryOccurrence(userId);
      if (hasUrinary) return { offer: this.buildProtocolOffer(), alert: null };
    }

    const youngCat = await this.youngestCatUnder12Months(userId);
    if (youngCat) {
      return {
        offer: {
          offerKey: 'kit-primeiro-gato',
          type: 'PRODUCT',
          title: 'Kit Primeiro Gato',
          description: `Tudo que ${youngCat.name} precisa nessa fase.`,
          ctaLabel: 'Ver kit',
          ctaPath: '/store?kit=primeiro-gato',
        },
        alert: null,
      };
    }

    const creditsLow = await this.igentCreditsLow(userId);
    if (creditsLow) {
      return {
        offer: {
          offerKey: 'gpts-package',
          type: 'GPTS',
          title: 'Créditos de iGentVet acabando',
          description: 'Garanta mais perguntas pro resto do mês.',
          ctaLabel: 'Ver pacotes',
          ctaPath: '/store?category=gpts',
        },
        alert: null,
      };
    }

    const guide = await this.pickFallbackGuideEntry();
    if (guide) {
      return {
        offer: {
          offerKey: `guide-${guide.slug}`,
          type: 'GUIDE',
          title: guide.title,
          description: guide.excerpt || '',
          ctaLabel: 'Ler no Guia',
          ctaPath: `/guia/${guide.slug}`,
        },
        alert: null,
      };
    }

    return { offer: null, alert: null };
  }

  // ─── Contexto de dor — sempre o mesmo protocolo, sem cascata ────────────────
  async decideProtocolPainOffer(userId: string): Promise<DecideResult> {
    const hasEntitlement = await this.hasProtocolXixiEntitlement(userId);
    if (hasEntitlement) return { offer: null, alert: null };
    return { offer: this.buildProtocolOffer(), alert: null };
  }

  // ─── Entrada única — a única função que decide oferta em todo o app ────────
  async decide(params: { userId: string; surface: string; petId?: string; trigger?: string }): Promise<DecideResult> {
    const { userId, surface, petId, trigger } = params;

    // Regra dura: nunca nenhuma oferta na aba Saúde, em nenhuma circunstância.
    if (surface === 'HEALTH') return { offer: null, alert: null };

    switch (surface) {
      case 'HOME_SLOT':
        return this.decideGeneralOffer(userId, { skipContinueProtocol: true });

      case 'POST_SUCCESS': {
        if (trigger === 'vaccine') {
          if (!petId) return { offer: null, alert: null };
          const complete = await this.isVaccineWalletComplete(petId);
          if (!complete) return { offer: null, alert: null };
        }
        return this.decideGeneralOffer(userId);
      }

      case 'PAIN_DIARY':
      case 'PAIN_IGENT':
      case 'PAIN_ALMANAC':
        return this.decideProtocolPainOffer(userId);

      default:
        return { offer: null, alert: null };
    }
  }

  // ─── Loja — modo lista, não "uma oferta" (natureza de vitrine) ─────────────
  async recommendProducts(params: { userId: string; petId: string }) {
    const pet = await this.prisma.pet.findFirst({
      where: { id: params.petId, ownerId: params.userId },
      select: {
        id: true,
        name: true,
        breed: true,
        coatType: true,
        birthDate: true,
        ageYears: true,
        ageMonths: true,
        healthRecords: { select: { type: true, title: true } },
      },
    });
    if (!pet) return [];

    const wantedTags: string[] = [];
    const reasons: Record<string, string> = {};

    const hasUrinaryHistory = pet.healthRecords.some((r) => /urin|cistite|caixa/i.test(r.title || ''));
    if (hasUrinaryHistory) {
      wantedTags.push('urinary');
      reasons.urinary = `Porque ${pet.name} tem histórico urinário registrado.`;
    }

    const months = computeAgeMonths(pet);
    if (months != null && months < 12) {
      wantedTags.push('kitten');
      reasons.kitten = `Porque ${pet.name} ainda é filhote.`;
    }
    if (months != null && months >= 84) {
      wantedTags.push('senior');
      reasons.senior = `Porque ${pet.name} já é sênior.`;
    }

    const coat = String(pet.coatType || '').toLowerCase();
    const breed = String(pet.breed || '').toLowerCase();
    if (coat.includes('long') || coat.includes('longo') || /persa|maine/.test(breed)) {
      wantedTags.push('longhair');
      reasons.longhair = `Porque ${pet.name} tem pelo longo.`;
    }

    if (wantedTags.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { tags: { hasSome: wantedTags } },
      take: 12,
    });

    return products.map((p) => {
      const matchedTag = wantedTags.find((t) => p.tags.includes(t));
      return { ...p, reason: matchedTag ? reasons[matchedTag] : null };
    });
  }
}
