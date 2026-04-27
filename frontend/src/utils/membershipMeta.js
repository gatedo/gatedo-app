export const PLAN_KEYS = {
  FREE: 'FREE',
  FOUNDER_EARLY: 'FOUNDER_EARLY',
  TESTER_FRIENDLY: 'TESTER_FRIENDLY',
  TUTOR_PLUS: 'TUTOR_PLUS',
  TUTOR_MASTER: 'TUTOR_MASTER',
};

export const PLAN_TYPE_LABELS = {
  FOUNDER_EARLY_ANNUAL: 'Founder Early Anual',
  TESTER_FRIENDLY_VIP: 'Tester Friendly VIP',
  TUTOR_PLUS_SEMESTRAL: 'Tutor Plus Semestral',
  TUTOR_PLUS_ANNUAL: 'Tutor Plus Anual',
  TUTOR_MASTER_SEMESTRAL: 'Tutor Master Semestral',
  TUTOR_MASTER_ANNUAL: 'Tutor Master Anual',
  GATEDO_POINTS_PACK: 'Gatedo Points',
};

export const MEMBERSHIP_META = {
  [PLAN_KEYS.FREE]: {
    label: 'Free',
    badge: null,
    tone: 'gray',
    renewalDiscountPercent: 0,
    maxActiveCats: null,
    unlimitedCats: false,
  },
  [PLAN_KEYS.FOUNDER_EARLY]: {
    label: 'Founder Early',
    badge: 'Founder Early',
    tone: 'purple',
    renewalDiscountPercent: 25,
    maxActiveCats: null,
    unlimitedCats: true,
  },
  [PLAN_KEYS.TESTER_FRIENDLY]: {
    label: 'Tester Friendly',
    badge: 'Tester Friendly',
    tone: 'blue',
    renewalDiscountPercent: 0,
    maxActiveCats: null,
    unlimitedCats: true,
  },
  [PLAN_KEYS.TUTOR_PLUS]: {
    label: 'Tutor Plus',
    badge: 'Tutor Plus',
    tone: 'amber',
    renewalDiscountPercent: 0,
    maxActiveCats: 3,
    unlimitedCats: false,
  },
  [PLAN_KEYS.TUTOR_MASTER]: {
    label: 'Tutor Master',
    badge: 'Tutor Master',
    tone: 'emerald',
    renewalDiscountPercent: 0,
    maxActiveCats: null,
    unlimitedCats: true,
  },
};

export const FOUNDER_PHASES = [
  {
    phase: 1,
    label: 'Founder Early · Fase 1',
    price: 47,
    slots: 100,
    url: import.meta.env.VITE_KIWIFY_FOUNDER_PHASE_1_URL || 'https://pay.kiwify.com.br/VjePvmn',
  },
  {
    phase: 2,
    label: 'Founder Early · Fase 2',
    price: 67,
    slots: 100,
    url: import.meta.env.VITE_KIWIFY_FOUNDER_PHASE_2_URL || 'https://pay.kiwify.com.br/TlfQJm5',
  },
  {
    phase: 3,
    label: 'Founder Early · Fase 3',
    price: 97,
    slots: 200,
    url: import.meta.env.VITE_KIWIFY_FOUNDER_PHASE_3_URL || 'https://pay.kiwify.com.br/tcbqqVl',
  },
];

export const PLAN_OFFERS = [
  {
    key: 'TUTOR_PLUS_SEMESTRAL',
    plan: PLAN_KEYS.TUTOR_PLUS,
    label: 'Tutor Plus Semestral',
    price: 59.9,
    cycleLabel: '6 meses',
    pointsGranted: 100,
    catLimitLabel: 'Até 3 gatos ativos',
    url: import.meta.env.VITE_KIWIFY_TUTOR_PLUS_SEMESTRAL_URL || '',
  },
  {
    key: 'TUTOR_PLUS_ANNUAL',
    plan: PLAN_KEYS.TUTOR_PLUS,
    label: 'Tutor Plus Anual',
    price: 99.9,
    cycleLabel: '12 meses',
    pointsGranted: 300,
    catLimitLabel: 'Até 3 gatos ativos',
    url: import.meta.env.VITE_KIWIFY_TUTOR_PLUS_ANNUAL_URL || '',
  },
  {
    key: 'TUTOR_MASTER_SEMESTRAL',
    plan: PLAN_KEYS.TUTOR_MASTER,
    label: 'Tutor Master Semestral',
    price: 129.9,
    cycleLabel: '6 meses',
    pointsGranted: 100,
    catLimitLabel: 'Gatos ilimitados',
    url: import.meta.env.VITE_KIWIFY_TUTOR_MASTER_SEMESTRAL_URL || '',
  },
  {
    key: 'TUTOR_MASTER_ANNUAL',
    plan: PLAN_KEYS.TUTOR_MASTER,
    label: 'Tutor Master Anual',
    price: 199.9,
    cycleLabel: '12 meses',
    pointsGranted: 300,
    catLimitLabel: 'Gatos ilimitados',
    url: import.meta.env.VITE_KIWIFY_TUTOR_MASTER_ANNUAL_URL || '',
  },
];

export const POINTS_PACKS = [
  {
    key: 'POINTS_100',
    points: 100,
    price: 4.9,
    label: 'Starter',
    url: import.meta.env.VITE_KIWIFY_POINTS_100_URL || '',
  },
  {
    key: 'POINTS_500',
    points: 500,
    price: 19.9,
    label: 'Popular',
    url: import.meta.env.VITE_KIWIFY_POINTS_500_URL || '',
  },
  {
    key: 'POINTS_1500',
    points: 1500,
    price: 49.9,
    label: 'Pro',
    url: import.meta.env.VITE_KIWIFY_POINTS_1500_URL || '',
  },
];

const LEGACY_BADGE_MAP = {
  FOUNDER: PLAN_KEYS.FOUNDER_EARLY,
  FOUNDING_MEMBER: PLAN_KEYS.FOUNDER_EARLY,
  VIP: PLAN_KEYS.TESTER_FRIENDLY,
  PREMIUM: PLAN_KEYS.TESTER_FRIENDLY,
  TESTER_VIP: PLAN_KEYS.TESTER_FRIENDLY,
};

export function normalizeBadges(badges) {
  if (!Array.isArray(badges)) return [];
  return [...new Set(badges.filter(Boolean).map((badge) => LEGACY_BADGE_MAP[String(badge)] || String(badge)))];
}

export function normalizePlan(plan, badges = []) {
  const normalizedPlan = String(plan || '').toUpperCase();
  const normalizedBadges = normalizeBadges(badges);

  if (
    normalizedPlan === PLAN_KEYS.FOUNDER_EARLY ||
    normalizedPlan === 'FOUNDER' ||
    normalizedBadges.includes(PLAN_KEYS.FOUNDER_EARLY)
  ) {
    return PLAN_KEYS.FOUNDER_EARLY;
  }

  if (
    normalizedPlan === PLAN_KEYS.TESTER_FRIENDLY ||
    normalizedPlan === 'PREMIUM' ||
    normalizedBadges.includes(PLAN_KEYS.TESTER_FRIENDLY)
  ) {
    return PLAN_KEYS.TESTER_FRIENDLY;
  }

  if (
    normalizedPlan === PLAN_KEYS.TUTOR_MASTER ||
    normalizedBadges.includes(PLAN_KEYS.TUTOR_MASTER)
  ) {
    return PLAN_KEYS.TUTOR_MASTER;
  }

  if (
    normalizedPlan === PLAN_KEYS.TUTOR_PLUS ||
    normalizedBadges.includes(PLAN_KEYS.TUTOR_PLUS)
  ) {
    return PLAN_KEYS.TUTOR_PLUS;
  }

  return PLAN_KEYS.FREE;
}

export function getMembershipMeta(userOrPlan, maybeBadges = []) {
  const normalizedPlan =
    typeof userOrPlan === 'string'
      ? normalizePlan(userOrPlan, maybeBadges)
      : normalizePlan(userOrPlan?.plan, userOrPlan?.badges);

  return {
    plan: normalizedPlan,
    ...MEMBERSHIP_META[normalizedPlan],
  };
}

export function formatPlanType(planType) {
  return PLAN_TYPE_LABELS[planType] || planType || 'Sem plano recorrente';
}

export function formatDateBR(value, fallback = '—') {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString('pt-BR');
}

export function countActivePets(pets = []) {
  return pets.filter((pet) => !pet.isMemorial && !pet.isArchived).length;
}

export function getCatLifeBadge(cat) {
  let years = Number(cat?.ageYears || 0);
  let months = Number(cat?.ageMonths || 0);

  if (cat?.birthDate) {
    const match = String(cat.birthDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
    const birthDate = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(cat.birthDate);

    if (!Number.isNaN(birthDate.getTime())) {
      const now = new Date();
      months = (now.getFullYear() - birthDate.getFullYear()) * 12;
      months += now.getMonth() - birthDate.getMonth();
      if (now.getDate() < birthDate.getDate()) months -= 1;
      years = 0;
    }
  }

  const totalMonths = years * 12 + months;

  if (totalMonths <= 12) return 'BABY';
  if (totalMonths <= 36) return 'JUNIOR';
  if (totalMonths <= 96) return 'GROWN';
  return 'SENIOR';
}
