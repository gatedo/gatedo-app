export const PLAN_KEYS = {
  FREE: 'FREE',
  FOUNDER_EARLY: 'FOUNDER_EARLY',
  TESTER_FRIENDLY: 'TESTER_FRIENDLY',
  TUTOR_PLUS: 'TUTOR_PLUS',
  TUTOR_MASTER: 'TUTOR_MASTER',
  CLUBE_GATEDO: 'CLUBE_GATEDO',
} as const;

export const PLAN_TYPES = {
  FOUNDER_EARLY_ANNUAL: 'FOUNDER_EARLY_ANNUAL',
  TESTER_FRIENDLY_VIP: 'TESTER_FRIENDLY_VIP',
  TUTOR_PLUS_SEMESTRAL: 'TUTOR_PLUS_SEMESTRAL',
  TUTOR_PLUS_ANNUAL: 'TUTOR_PLUS_ANNUAL',
  TUTOR_MASTER_SEMESTRAL: 'TUTOR_MASTER_SEMESTRAL',
  TUTOR_MASTER_ANNUAL: 'TUTOR_MASTER_ANNUAL',
  CLUBE_GATEDO_MENSAL: 'CLUBE_GATEDO_MENSAL',
  CLUBE_GATEDO_ANUAL: 'CLUBE_GATEDO_ANUAL',
} as const;

export const MEMBERSHIP_BADGES = {
  FOUNDER_EARLY: 'FOUNDER_EARLY',
  TESTER_FRIENDLY: 'TESTER_FRIENDLY',
  TUTOR_PLUS: 'TUTOR_PLUS',
  TUTOR_MASTER: 'TUTOR_MASTER',
  TUTOR_SUPREME: 'TUTOR_SUPREME',
  TUTOR_GENESIS: 'TUTOR_GENESIS',
  TUTOR_RAIZ: 'TUTOR_RAIZ',
  TUTOR_CERNE: 'TUTOR_CERNE',
  TUTOR_PRIME: 'TUTOR_PRIME',
  TUTOR_VIP: 'TUTOR_VIP',
  CLUBE_GATEDO: 'CLUBE_GATEDO',
} as const;

export const LEGACY_BADGE_MAP: Record<string, string> = {
  FOUNDER: MEMBERSHIP_BADGES.FOUNDER_EARLY,
  FOUNDING_MEMBER: MEMBERSHIP_BADGES.FOUNDER_EARLY,
  VIP: MEMBERSHIP_BADGES.TESTER_FRIENDLY,
  PREMIUM: MEMBERSHIP_BADGES.TESTER_FRIENDLY,
  TESTER_VIP: MEMBERSHIP_BADGES.TESTER_FRIENDLY,
  GENESIS: MEMBERSHIP_BADGES.TUTOR_GENESIS,
  TUTOR_GENESE: MEMBERSHIP_BADGES.TUTOR_GENESIS,
  TUTOR_GÊNESE: MEMBERSHIP_BADGES.TUTOR_GENESIS,
};

export const FOUNDER_PHASES = [
  { phase: 1, price: 47, maxSlots: 50, label: 'Tutor Genese - Fase 1' },
  { phase: 2, price: 67, maxSlots: 100, label: 'Tutor Raiz - Fase 2' },
  { phase: 3, price: 97, maxSlots: 150, label: 'Tutor Cerne - Fase 3' },
] as const;

export const POINTS_PACKS = [
  { points: 50, price: 9.9, label: 'Points Starter' },
  { points: 100, price: 17.9, label: 'Points Essencial' },
  { points: 500, price: 59.9, label: 'Points Popular' },
  { points: 1000, price: 99.9, label: 'Points Pro' },
] as const;

export const FOUNDER_TIER_RULES = [
  { badge: MEMBERSHIP_BADGES.TUTOR_GENESIS, label: 'Tutor Gênese', min: 1, max: 50 },
  { badge: MEMBERSHIP_BADGES.TUTOR_RAIZ, label: 'Tutor Raiz', min: 51, max: 150 },
  { badge: MEMBERSHIP_BADGES.TUTOR_CERNE, label: 'Tutor Cerne', min: 151, max: 300 },
  { badge: MEMBERSHIP_BADGES.TUTOR_PRIME, label: 'Tutor Prime', min: 301, max: Infinity },
] as const;

export function getFounderTierByPosition(position: number) {
  const safePosition = Math.max(1, Number(position || 1));
  return (
    FOUNDER_TIER_RULES.find((tier) => safePosition >= tier.min && safePosition <= tier.max) ||
    FOUNDER_TIER_RULES[FOUNDER_TIER_RULES.length - 1]
  );
}

export function getFounderTierByPhase(phase: number) {
  const safePhase = Math.max(1, Number(phase || 1));

  if (safePhase === 2) {
    return { badge: MEMBERSHIP_BADGES.TUTOR_RAIZ, label: 'Tutor Raiz' };
  }

  if (safePhase === 3) {
    return { badge: MEMBERSHIP_BADGES.TUTOR_CERNE, label: 'Tutor Cerne' };
  }

  if (safePhase > 3) {
    return { badge: MEMBERSHIP_BADGES.TUTOR_PRIME, label: 'Tutor Prime' };
  }

  return { badge: MEMBERSHIP_BADGES.TUTOR_GENESIS, label: 'Tutor Genese' };
}

export type MembershipPlanKey = (typeof PLAN_KEYS)[keyof typeof PLAN_KEYS];
export type MembershipPlanType = (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES];

export type MembershipGrant = {
  source: 'FOUNDER_CAMPAIGN' | 'ADMIN_VIP' | 'KIWIFY_PLAN' | 'KIWIFY_POINTS' | 'LEGACY';
  plan: MembershipPlanKey;
  planType: string;
  badge?: string | null;
  badgeLabel?: string;
  cycleMonths?: number;
  pointsGranted?: number;
  renewalDiscountPercent?: number;
  autoRenew?: boolean;
  isUnlimitedCats?: boolean;
  maxActiveCats?: number | null;
  offerLabel?: string;
  phase?: number | null;
  externalId?: string | null;
  purchaseDate?: Date | null;
};

export function normalizeBadges(input: any): string[] {
  const raw = Array.isArray(input) ? input : [];
  const normalized = raw
    .filter(Boolean)
    .map((badge) => LEGACY_BADGE_MAP[String(badge)] || String(badge));

  return [...new Set(normalized)];
}

export function addMonths(date: Date, months = 0) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function getCycleMonths(planType?: string | null) {
  const value = String(planType || '').toUpperCase();
  if (value.includes('ANUAL')) return 12;
  if (value.includes('SEMESTRAL')) return 6;
  return 0;
}

export function getPlanPointsGrant(planType?: string | null) {
  const cycle = getCycleMonths(planType);
  if (cycle >= 12) return 300;
  if (cycle >= 6) return 100;
  return 0;
}

export function getMembershipGrantFromPlanType(
  planType?: string | null,
  overrides: Partial<MembershipGrant> = {},
): MembershipGrant | null {
  const type = String(planType || '').toUpperCase();

  if (type === PLAN_TYPES.FOUNDER_EARLY_ANNUAL) {
    return {
      source: 'FOUNDER_CAMPAIGN',
      plan: PLAN_KEYS.FOUNDER_EARLY,
      planType: PLAN_TYPES.FOUNDER_EARLY_ANNUAL,
      badge: MEMBERSHIP_BADGES.FOUNDER_EARLY,
      badgeLabel: 'Founder Early',
      cycleMonths: 12,
      pointsGranted: 300,
      renewalDiscountPercent: 25,
      autoRenew: false,
      isUnlimitedCats: true,
      maxActiveCats: null,
      ...overrides,
    };
  }

  if (type === PLAN_TYPES.TESTER_FRIENDLY_VIP) {
    return {
      source: 'ADMIN_VIP',
      plan: PLAN_KEYS.TESTER_FRIENDLY,
      planType: PLAN_TYPES.TESTER_FRIENDLY_VIP,
      badge: MEMBERSHIP_BADGES.TESTER_FRIENDLY,
      badgeLabel: 'Tester Friendly',
      cycleMonths: 12,
      pointsGranted: 300,
      renewalDiscountPercent: 0,
      autoRenew: false,
      isUnlimitedCats: true,
      maxActiveCats: null,
      ...overrides,
    };
  }

  if (type === PLAN_TYPES.TUTOR_PLUS_ANNUAL) {
    return {
      source: 'KIWIFY_PLAN',
      plan: PLAN_KEYS.TUTOR_PLUS,
      planType: PLAN_TYPES.TUTOR_PLUS_ANNUAL,
      badge: MEMBERSHIP_BADGES.TUTOR_PLUS,
      badgeLabel: 'Tutor Plus',
      cycleMonths: 12,
      pointsGranted: 300,
      renewalDiscountPercent: 0,
      autoRenew: false,
      isUnlimitedCats: true,
      maxActiveCats: null,
      ...overrides,
    };
  }

  if (type === PLAN_TYPES.TUTOR_PLUS_SEMESTRAL) {
    return {
      source: 'KIWIFY_PLAN',
      plan: PLAN_KEYS.TUTOR_PLUS,
      planType: PLAN_TYPES.TUTOR_PLUS_SEMESTRAL,
      badge: MEMBERSHIP_BADGES.TUTOR_PLUS,
      badgeLabel: 'Tutor Plus',
      cycleMonths: 6,
      pointsGranted: 100,
      renewalDiscountPercent: 0,
      autoRenew: false,
      isUnlimitedCats: true,
      maxActiveCats: null,
      ...overrides,
    };
  }

  if (type === PLAN_TYPES.TUTOR_MASTER_ANNUAL) {
    return {
      source: 'KIWIFY_PLAN',
      plan: PLAN_KEYS.TUTOR_MASTER,
      planType: PLAN_TYPES.TUTOR_MASTER_ANNUAL,
      badge: MEMBERSHIP_BADGES.TUTOR_MASTER,
      badgeLabel: 'Tutor Master',
      cycleMonths: 12,
      pointsGranted: 300,
      renewalDiscountPercent: 0,
      autoRenew: false,
      isUnlimitedCats: true,
      maxActiveCats: null,
      ...overrides,
    };
  }

  if (type === PLAN_TYPES.TUTOR_MASTER_SEMESTRAL) {
    return {
      source: 'KIWIFY_PLAN',
      plan: PLAN_KEYS.TUTOR_MASTER,
      planType: PLAN_TYPES.TUTOR_MASTER_SEMESTRAL,
      badge: MEMBERSHIP_BADGES.TUTOR_MASTER,
      badgeLabel: 'Tutor Master',
      cycleMonths: 6,
      pointsGranted: 100,
      renewalDiscountPercent: 0,
      autoRenew: false,
      isUnlimitedCats: true,
      maxActiveCats: null,
      ...overrides,
    };
  }

  if (type === PLAN_TYPES.CLUBE_GATEDO_MENSAL) {
    return {
      source: 'KIWIFY_PLAN',
      plan: PLAN_KEYS.CLUBE_GATEDO,
      planType: PLAN_TYPES.CLUBE_GATEDO_MENSAL,
      badge: MEMBERSHIP_BADGES.CLUBE_GATEDO,
      badgeLabel: 'Clube GATEDO',
      cycleMonths: 1,
      pointsGranted: 0,
      renewalDiscountPercent: 0,
      autoRenew: false,
      isUnlimitedCats: true,
      maxActiveCats: null,
      ...overrides,
    };
  }

  if (type === PLAN_TYPES.CLUBE_GATEDO_ANUAL) {
    return {
      source: 'KIWIFY_PLAN',
      plan: PLAN_KEYS.CLUBE_GATEDO,
      planType: PLAN_TYPES.CLUBE_GATEDO_ANUAL,
      badge: MEMBERSHIP_BADGES.CLUBE_GATEDO,
      badgeLabel: 'Clube GATEDO',
      cycleMonths: 12,
      pointsGranted: 0,
      renewalDiscountPercent: 0,
      autoRenew: false,
      isUnlimitedCats: true,
      maxActiveCats: null,
      ...overrides,
    };
  }

  return null;
}

export function getPlanFromUser(user: any): MembershipPlanKey {
  const plan = String(user?.plan || '').toUpperCase();
  const badges = normalizeBadges(user?.badges);

  if (plan === PLAN_KEYS.FOUNDER_EARLY || badges.includes(MEMBERSHIP_BADGES.FOUNDER_EARLY)) {
    return PLAN_KEYS.FOUNDER_EARLY;
  }

  if (plan === PLAN_KEYS.TESTER_FRIENDLY || badges.includes(MEMBERSHIP_BADGES.TESTER_FRIENDLY) || plan === 'PREMIUM') {
    return PLAN_KEYS.TESTER_FRIENDLY;
  }

  if (plan === PLAN_KEYS.CLUBE_GATEDO || badges.includes(MEMBERSHIP_BADGES.CLUBE_GATEDO)) {
    return PLAN_KEYS.CLUBE_GATEDO;
  }

  if (plan === PLAN_KEYS.TUTOR_MASTER || badges.includes(MEMBERSHIP_BADGES.TUTOR_MASTER)) {
    return PLAN_KEYS.TUTOR_MASTER;
  }

  if (plan === PLAN_KEYS.TUTOR_PLUS || badges.includes(MEMBERSHIP_BADGES.TUTOR_PLUS)) {
    return PLAN_KEYS.TUTOR_PLUS;
  }

  if (plan === 'FOUNDER') {
    return PLAN_KEYS.FOUNDER_EARLY;
  }

  return PLAN_KEYS.FREE;
}

export function getMembershipRulesForUser(user: any) {
  const plan = getPlanFromUser(user);
  // isUnlimitedCats/maxActiveCats vêm sempre de getUserEntitlements — esta
  // função só decide o rótulo/selo/desconto de exibição para cada plano.
  const { isUnlimitedCats, maxActiveCats } = getUserEntitlements(user);

  if (plan === PLAN_KEYS.FOUNDER_EARLY) {
    return {
      plan,
      label: 'Founder Early',
      renewalDiscountPercent: 25,
      isUnlimitedCats,
      maxActiveCats,
      badge: MEMBERSHIP_BADGES.FOUNDER_EARLY,
    };
  }

  if (plan === PLAN_KEYS.TESTER_FRIENDLY) {
    return {
      plan,
      label: 'Tester Friendly',
      renewalDiscountPercent: 0,
      isUnlimitedCats,
      maxActiveCats,
      badge: MEMBERSHIP_BADGES.TESTER_FRIENDLY,
    };
  }

  if (plan === PLAN_KEYS.CLUBE_GATEDO) {
    return {
      plan,
      label: 'Clube GATEDO',
      renewalDiscountPercent: 0,
      isUnlimitedCats,
      maxActiveCats,
      badge: MEMBERSHIP_BADGES.CLUBE_GATEDO,
    };
  }

  if (plan === PLAN_KEYS.TUTOR_MASTER) {
    return {
      plan,
      label: 'Tutor Master',
      renewalDiscountPercent: 0,
      isUnlimitedCats,
      maxActiveCats,
      badge: MEMBERSHIP_BADGES.TUTOR_MASTER,
    };
  }

  if (plan === PLAN_KEYS.TUTOR_PLUS) {
    return {
      plan,
      label: 'Tutor Plus',
      renewalDiscountPercent: 0,
      isUnlimitedCats,
      maxActiveCats,
      badge: MEMBERSHIP_BADGES.TUTOR_PLUS,
    };
  }

  return {
    plan: PLAN_KEYS.FREE,
    label: 'Free',
    renewalDiscountPercent: 0,
    isUnlimitedCats,
    maxActiveCats,
    badge: null,
  };
}

export function canBypassPlanCosts(user: any) {
  const role = String(user?.role || '').toUpperCase();
  const plan = getPlanFromUser(user);
  const badges = normalizeBadges(user?.badges);

  return (
    role === 'ADMIN' ||
    role === 'TESTER_VIP' ||
    plan === PLAN_KEYS.TESTER_FRIENDLY ||
    badges.includes(MEMBERSHIP_BADGES.TESTER_FRIENDLY)
  );
}

export function getActiveCatsLimit(user: any) {
  const rules = getMembershipRulesForUser(user);
  return rules.isUnlimitedCats ? Infinity : rules.maxActiveCats ?? Infinity;
}

export function getRenewalDiscountPercent(user: any) {
  return getMembershipRulesForUser(user).renewalDiscountPercent ?? 0;
}

/**
 * Fonte única da decisão de acesso do app. Qualquer tela/endpoint que
 * precise saber "o que esse usuário pode fazer" consulta esta função —
 * nunca `user.plan` ou `user.badges` diretamente.
 *
 * - "free": padrão, sem compra. Acesso completo ao que está no ar hoje.
 * - "founder": quem já pagou (qualquer plano pago existente). Mantém selo,
 *   pontos e tudo que já tinha — hoje não ganha nenhum privilégio extra
 *   de acesso porque o free também é ilimitado.
 * - "pro": Clube GATEDO (assinatura mensal/anual paga) OU fundador (que
 *   ganha o Clube vitalício de brinde — ver hasClubeAccess).
 */
export type EntitlementsTier = 'free' | 'founder' | 'pro';

export type UserEntitlements = {
  tier: EntitlementsTier;
  hasClube: boolean;
  isUnlimitedCats: boolean;
  maxActiveCats: number | null;
  igentMonthlyQuestions: number | null;
  canAccessProtocols: boolean;
  canReadExamFiles: boolean;
};

// Fundador (qualquer fase — Gênese/Raiz/Cerne/Prime) ganha o Clube GATEDO
// vitalício automaticamente, como camada acima do selo de fundador.
export function isFounderTierUser(user: any): boolean {
  return getPlanFromUser(user) === PLAN_KEYS.FOUNDER_EARLY;
}

// Assinatura ativa do Clube GATEDO: plano CLUBE_GATEDO com planExpires ainda
// no futuro. Cancelamento não derruba na hora — só não renova, e o acesso
// cai sozinho quando o ciclo já pago vence. Reembolso zera planExpires na
// hora (ver tratamento de evento de reembolso no webhook da Kiwify).
export function hasClubeAccess(user: any): boolean {
  if (canBypassPlanCosts(user)) return true;
  if (isFounderTierUser(user)) return true;

  if (getPlanFromUser(user) !== PLAN_KEYS.CLUBE_GATEDO) return false;
  if (!user?.planExpires) return false;

  return new Date(user.planExpires).getTime() > Date.now();
}

export function getEntitlementsTier(user: any): EntitlementsTier {
  if (hasClubeAccess(user)) return 'pro';
  return getPlanFromUser(user) === PLAN_KEYS.FREE ? 'free' : 'founder';
}

/**
 * Teto mensal de perguntas ao iGentVet por tier. `null` = sem limite.
 * Parâmetro de configuração — mude aqui para ajustar o teto de qualquer
 * tier sem tocar em controller, service ou tela nenhuma.
 */
export const IGENT_MONTHLY_QUESTION_LIMITS: Record<EntitlementsTier, number | null> = {
  free: 10,
  founder: 60,
  pro: 200,
};

export function getUserEntitlements(user: any): UserEntitlements {
  const tier = getEntitlementsTier(user);
  // ADMIN/TESTER_VIP (canBypassPlanCosts) nunca deve esbarrar em trava de
  // plano ao testar o app — mesma convenção já usada em gamification.service.
  const staffOverride = canBypassPlanCosts(user);
  return {
    tier,
    hasClube: tier === 'pro',
    isUnlimitedCats: true,
    maxActiveCats: null,
    igentMonthlyQuestions: staffOverride ? null : IGENT_MONTHLY_QUESTION_LIMITS[tier],
    // Protocolos (conteúdo estruturado multi-dia) exigem founder ou pro.
    // Guias (almanaque) continuam livres para todo mundo, sem checar isso.
    canAccessProtocols: staffOverride || tier !== 'free',
    // Leitura de exame/laudo (PDF ou foto) pelo iGentVet — exclusivo Clube.
    canReadExamFiles: staffOverride || tier === 'pro',
  };
}

export function resolveKiwifyOffer(input: {
  offerName?: string | null;
  productName?: string | null;
  price?: number | null;
}) {
  const joined = `${input.offerName || ''} ${input.productName || ''}`.toLowerCase();
  const price = Number(input.price || 0);

  const founderByPrice = FOUNDER_PHASES.find((item) => item.price === price);
  const plusPack = POINTS_PACKS.find((item) => Math.round(item.price * 100) === Math.round(price * 100));

  if (
    joined.includes('founder') ||
    joined.includes('fundador') ||
    joined.includes('early bird') ||
    founderByPrice
  ) {
    const phase =
      joined.includes('fase 1') || joined.includes('fase 01')
        ? 1
        : joined.includes('fase 2') || joined.includes('fase 02')
          ? 2
          : joined.includes('fase 3') || joined.includes('fase 03')
            ? 3
            : founderByPrice?.phase || 1;

    return getMembershipGrantFromPlanType(PLAN_TYPES.FOUNDER_EARLY_ANNUAL, {
      phase,
      offerLabel: `Founder Early · Fase ${phase}`,
      source: 'FOUNDER_CAMPAIGN',
    });
  }

  if (joined.includes('clube gatedo') || joined.includes('clube do gatedo') || (joined.includes('clube') && joined.includes('gatedo'))) {
    const isMonthly = joined.includes('mensal');
    return getMembershipGrantFromPlanType(
      isMonthly ? PLAN_TYPES.CLUBE_GATEDO_MENSAL : PLAN_TYPES.CLUBE_GATEDO_ANUAL,
      { offerLabel: isMonthly ? 'Clube GATEDO Mensal' : 'Clube GATEDO Anual' },
    );
  }

  if (joined.includes('tutor plus')) {
    return getMembershipGrantFromPlanType(
      joined.includes('semestral') ? PLAN_TYPES.TUTOR_PLUS_SEMESTRAL : PLAN_TYPES.TUTOR_PLUS_ANNUAL,
      { offerLabel: joined.includes('semestral') ? 'Tutor Plus Semestral' : 'Tutor Plus Anual' },
    );
  }

  if (joined.includes('tutor master')) {
    return getMembershipGrantFromPlanType(
      joined.includes('semestral') ? PLAN_TYPES.TUTOR_MASTER_SEMESTRAL : PLAN_TYPES.TUTOR_MASTER_ANNUAL,
      { offerLabel: joined.includes('semestral') ? 'Tutor Master Semestral' : 'Tutor Master Anual' },
    );
  }

  if (joined.includes('tester') || joined.includes('vip tester') || joined.includes('tester friendly')) {
    return getMembershipGrantFromPlanType(PLAN_TYPES.TESTER_FRIENDLY_VIP, {
      offerLabel: 'Tester Friendly VIP',
    });
  }

  if (joined.includes('points') || joined.includes('gatedo point') || joined.includes('gpts') || joined.includes('creditos')) {
    const pack =
      POINTS_PACKS.find((item) => joined.includes(String(item.points))) ||
      plusPack;

    if (pack) {
      return {
        source: 'KIWIFY_POINTS' as const,
        plan: PLAN_KEYS.FREE,
        planType: 'GATEDO_POINTS_PACK',
        badge: null,
        badgeLabel: null as any,
        cycleMonths: 0,
        pointsGranted: pack.points,
        renewalDiscountPercent: 0,
        autoRenew: false,
        isUnlimitedCats: true,
        maxActiveCats: null,
        offerLabel: pack.label,
      };
    }
  }

  return null;
}
