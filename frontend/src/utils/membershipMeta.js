import { getCatLifeStage, LIFE_STAGE_META } from './catAge';

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
    unlimitedCats: true,
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
    maxActiveCats: null,
    unlimitedCats: true,
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
    slots: 50,
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
    slots: 150,
    url: import.meta.env.VITE_KIWIFY_FOUNDER_PHASE_3_URL || 'https://pay.kiwify.com.br/tcbqqVl',
  },
];

const LEGACY_BADGE_MAP = {
  FOUNDER: PLAN_KEYS.FOUNDER_EARLY,
  FOUNDING_MEMBER: PLAN_KEYS.FOUNDER_EARLY,
  VIP: PLAN_KEYS.TESTER_FRIENDLY,
  PREMIUM: PLAN_KEYS.TESTER_FRIENDLY,
  TESTER_VIP: PLAN_KEYS.TESTER_FRIENDLY,
  GENESIS: 'TUTOR_GENESIS',
  TUTOR_GENESE: 'TUTOR_GENESIS',
  TUTOR_GÊNESE: 'TUTOR_GENESIS',
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

/**
 * Fonte única de decisão de acesso no frontend — espelha
 * `getUserEntitlements` do backend. "free" (padrão) e "founder" (quem já
 * pagou) têm hoje o mesmo acesso; "pro" é reservado para o futuro e nenhum
 * fluxo atual atribui esse tier. Nenhuma tela deve checar `user.plan`
 * diretamente para decidir o que mostrar/permitir — use esta função.
 */
export function getUserEntitlements(userOrPlan, maybeBadges = []) {
  const normalizedPlan =
    typeof userOrPlan === 'string'
      ? normalizePlan(userOrPlan, maybeBadges)
      : normalizePlan(userOrPlan?.plan, userOrPlan?.badges);

  return {
    tier: normalizedPlan === PLAN_KEYS.FREE ? 'free' : 'founder',
    isUnlimitedCats: true,
    maxActiveCats: null,
  };
}

export const TUTOR_BADGE_META = {
  TUTOR_SUPREME: {
    key: 'TUTOR_SUPREME',
    label: 'Tutor Supreme',
    petLabel: 'SUPREME',
    pillBg: '#181120',
    pillText: '#ebfc66',
    title: 'Criador Supremo do Gatedo',
    emoji: '👑',
    tone: 'supreme',
    bg: 'bg-[#111111]',
    text: 'text-[#ebfc66]',
    ring: 'ring-[#ebfc66]',
    color: '#111111',
    gradient: 'linear-gradient(135deg, #33303a 0%, #493d63 55%, #999b8f 160%)',
    asset: '/assets/badges/TUTOR_SUPREME.png',
    launchBadge: false,
  },
  TUTOR_GENESIS: {
    key: 'TUTOR_GENESIS',
    petLabel: 'GÊNESE',
    pillBg: '#008ce9',
    pillText: '#ebfc66',
    label: 'Tutor Gênese',
    title: 'Você está entre os 50 primeiros tutores',
    emoji: '✦',
    tone: 'genesis',
    bg: 'bg-[#06b6d4]',
    text: 'text-[#ebfc66]',
    ring: 'ring-[#ebfc66]',
    color: '#009cda',
    gradient: 'linear-gradient(135deg, #2175e2 0%, #1fa0db 52%, #71cbff 100%)',
    asset: '/assets/badges/badge-genese.webp',
    launchBadge: true,
    launchSlots: 50,
  },
  TUTOR_RAIZ: {
    key: 'TUTOR_RAIZ',
    label: 'Tutor Raiz',
    petLabel: 'RAIZ',
    pillBg: '#15803d',
    pillText: '#ebfc66',
    title: 'Você faz parte da base fundadora',
    emoji: '◆',
    tone: 'raiz',
    bg: 'bg-[#15803d]',
    text: 'text-[#ebfc66]',
    ring: 'ring-emerald-200',
    color: '#15803d',
    gradient: 'linear-gradient(135deg, #088c81 0%, #20bfae 55%, #67d68f 100%)',
    asset: '/assets/badges/badge-raiz.webp',
    launchBadge: true,
    launchSlots: 100,
  },
  TUTOR_CERNE: {
    key: 'TUTOR_CERNE',
    label: 'Tutor Cerne',
    petLabel: 'CERNE',
    pillBg: '#f97316',
    pillText: '#ebfc66',
    title: 'Você entrou no núcleo fundador',
    emoji: '●',
    tone: 'cerne',
    bg: 'bg-[#f97316]',
    text: 'text-[#ebfc66]',
    ring: 'ring-orange-200',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #da6131 0%, #da6c2d 42%, #f28a4b 112%)',
    asset: '/assets/badges/badge-cerne.webp',
    launchBadge: true,
    launchSlots: 150,
  },
  TUTOR_PRIME: {
    key: 'TUTOR_PRIME',
    label: 'Tutor Prime',
    petLabel: 'PRIME',
    pillBg: '#8B4AFF',
    pillText: '#ebfc66',
    title: 'Você garantiu uma vaga fundadora Prime',
    emoji: '★',
    tone: 'prime',
    bg: 'bg-[#8B4AFF]',
    text: 'text-[#ebfc66]',
    ring: 'ring-violet-200',
    color: '#8B4AFF',
    gradient: 'linear-gradient(135deg, #312e81 0%, #8B4AFF 75%, #ffffff 150%)',
    asset: '/assets/badges/TUTOR_PRIME.png',
    launchBadge: false,
  },
  TUTOR_VIP: {
    key: 'TUTOR_VIP',
    label: 'Tutor VIP',
    petLabel: 'VIP',
    pillBg: '#ff4463',
    pillText: '#ebfc66',
    title: 'Você recebeu um convite VIP',
    emoji: '⭐',
    tone: 'vip',
    bg: 'bg-[#ff4458]',
    text: 'text-[#ebfc66]',
    ring: 'ring-sky-200',
    color: '#ff4458',
    gradient: 'linear-gradient(135deg, #701d47 0%, #ff4463 72%, #fc669f 160%)',
    asset: '/assets/badges/TUTOR_VIP.png',
    launchBadge: false,
  },
};

const TUTOR_TITLE_LABELS = {
  TUTOR: 'Tutor',
  TUTORA: 'Tutora',
  PESSOA_TUTORA: 'Pessoa tutora',
};

function normalizeTutorTitle(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'FEMALE' || normalized === 'MULHER') return 'TUTORA';
  if (normalized === 'NEUTRAL' || normalized === 'OUTRO' || normalized === 'PESSOA') return 'PESSOA_TUTORA';
  if (normalized === 'TUTORA' || normalized === 'PESSOA_TUTORA') return normalized;
  return 'TUTOR';
}

export function getTutorTitleLabel(user = {}) {
  return TUTOR_TITLE_LABELS[normalizeTutorTitle(user?.tutorTitle || user?.treatmentPronoun || user?.genderIdentity)] || 'Tutor';
}

export function formatTutorBadgeLabel(badge, user = {}) {
  if (!badge?.label) return '';
  const suffix = String(badge.label).replace(/^Tutor\s+/i, '');
  return `${getTutorTitleLabel(user)} ${suffix}`.trim();
}

export function getPrimaryTutorBadge(user = {}) {
  const badges = normalizeBadges(user?.badges || []);
  const role = String(user?.role || '').toUpperCase();
  const plan = normalizePlan(user?.plan, badges);

  if (role === 'ADMIN') {
    const badge = TUTOR_BADGE_META.TUTOR_SUPREME;
    return { ...badge, label: formatTutorBadgeLabel(badge, user) };
  }

  const priority = [
    'TUTOR_SUPREME',
    'TUTOR_GENESIS',
    'TUTOR_RAIZ',
    'TUTOR_CERNE',
    'TUTOR_PRIME',
    'TUTOR_VIP',
    'TUTOR_MASTER',
    'TUTOR_PLUS',
    'TESTER_FRIENDLY',
    'FOUNDER_EARLY',
  ];

  const found = priority.find((badge) => badges.includes(badge));
  if (found && TUTOR_BADGE_META[found]) {
    const badge = TUTOR_BADGE_META[found];
    return { ...badge, label: formatTutorBadgeLabel(badge, user) };
  }

  if (plan === PLAN_KEYS.FOUNDER_EARLY || badges.includes(PLAN_KEYS.FOUNDER_EARLY)) {
    const badge = TUTOR_BADGE_META.TUTOR_GENESIS;
    return { ...badge, label: formatTutorBadgeLabel(badge, user) };
  }

  if (plan === PLAN_KEYS.TESTER_FRIENDLY || badges.includes(PLAN_KEYS.TESTER_FRIENDLY)) {
    const badge = TUTOR_BADGE_META.TUTOR_VIP;
    return { ...badge, label: formatTutorBadgeLabel(badge, user) };
  }

  return null;
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
  const stage = getCatLifeStage(cat);
  return stage ? LIFE_STAGE_META[stage]?.label || stage : 'N/I';
}
