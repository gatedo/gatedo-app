export const PLAN_KEYS = {
  FREE: 'FREE',
  FOUNDER_EARLY: 'FOUNDER_EARLY',
  TESTER_FRIENDLY: 'TESTER_FRIENDLY',
  TUTOR_PLUS: 'TUTOR_PLUS',
  TUTOR_MASTER: 'TUTOR_MASTER',
} as const;

export const PLAN_TYPES = {
  FOUNDER_EARLY_ANNUAL: 'FOUNDER_EARLY_ANNUAL',
  TESTER_FRIENDLY_VIP: 'TESTER_FRIENDLY_VIP',
  TUTOR_PLUS_SEMESTRAL: 'TUTOR_PLUS_SEMESTRAL',
  TUTOR_PLUS_ANNUAL: 'TUTOR_PLUS_ANNUAL',
  TUTOR_MASTER_SEMESTRAL: 'TUTOR_MASTER_SEMESTRAL',
  TUTOR_MASTER_ANNUAL: 'TUTOR_MASTER_ANNUAL',
} as const;

export const MEMBERSHIP_BADGES = {
  FOUNDER_EARLY: 'FOUNDER_EARLY',
  TESTER_FRIENDLY: 'TESTER_FRIENDLY',
  TUTOR_PLUS: 'TUTOR_PLUS',
  TUTOR_MASTER: 'TUTOR_MASTER',
} as const;

export const LEGACY_BADGE_MAP: Record<string, string> = {
  FOUNDER: MEMBERSHIP_BADGES.FOUNDER_EARLY,
  FOUNDING_MEMBER: MEMBERSHIP_BADGES.FOUNDER_EARLY,
  VIP: MEMBERSHIP_BADGES.TESTER_FRIENDLY,
  PREMIUM: MEMBERSHIP_BADGES.TESTER_FRIENDLY,
  TESTER_VIP: MEMBERSHIP_BADGES.TESTER_FRIENDLY,
};

export const FOUNDER_PHASES = [
  { phase: 1, price: 47, maxSlots: 100, label: 'Founder Early · Fase 1' },
  { phase: 2, price: 67, maxSlots: 100, label: 'Founder Early · Fase 2' },
  { phase: 3, price: 97, maxSlots: 200, label: 'Founder Early · Fase 3' },
] as const;

export const POINTS_PACKS = [
  { points: 100, price: 4.9, label: 'Points Starter' },
  { points: 500, price: 19.9, label: 'Points Popular' },
  { points: 1500, price: 49.9, label: 'Points Pro' },
] as const;

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
      isUnlimitedCats: false,
      maxActiveCats: 3,
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
      isUnlimitedCats: false,
      maxActiveCats: 3,
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

  if (plan === PLAN_KEYS.FOUNDER_EARLY) {
    return {
      plan,
      label: 'Founder Early',
      renewalDiscountPercent: 25,
      isUnlimitedCats: true,
      maxActiveCats: null,
      badge: MEMBERSHIP_BADGES.FOUNDER_EARLY,
    };
  }

  if (plan === PLAN_KEYS.TESTER_FRIENDLY) {
    return {
      plan,
      label: 'Tester Friendly',
      renewalDiscountPercent: 0,
      isUnlimitedCats: true,
      maxActiveCats: null,
      badge: MEMBERSHIP_BADGES.TESTER_FRIENDLY,
    };
  }

  if (plan === PLAN_KEYS.TUTOR_MASTER) {
    return {
      plan,
      label: 'Tutor Master',
      renewalDiscountPercent: 0,
      isUnlimitedCats: true,
      maxActiveCats: null,
      badge: MEMBERSHIP_BADGES.TUTOR_MASTER,
    };
  }

  if (plan === PLAN_KEYS.TUTOR_PLUS) {
    return {
      plan,
      label: 'Tutor Plus',
      renewalDiscountPercent: 0,
      isUnlimitedCats: false,
      maxActiveCats: 3,
      badge: MEMBERSHIP_BADGES.TUTOR_PLUS,
    };
  }

  return {
    plan: PLAN_KEYS.FREE,
    label: 'Free',
    renewalDiscountPercent: 0,
    isUnlimitedCats: false,
    maxActiveCats: null,
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
        isUnlimitedCats: false,
        maxActiveCats: null,
        offerLabel: pack.label,
      };
    }
  }

  return null;
}
