export const TUTOR_LEVELS = [
  { rank: 1, min: 0, max: 49, label: 'Gateiro Iniciante', emoji: '🐾' },
  { rank: 2, min: 50, max: 119, label: 'Gateiro Curioso', emoji: '🐱' },
  { rank: 3, min: 120, max: 219, label: 'Gateiro Atento', emoji: '🐈' },
  { rank: 4, min: 220, max: 349, label: 'Tutor de Rotina', emoji: '📘' },
  { rank: 5, min: 350, max: 519, label: 'Tutor Preventivo', emoji: '🛡️' },
  { rank: 6, min: 520, max: 749, label: 'Tutor Cuidadoso', emoji: '🧡' },
  { rank: 7, min: 750, max: 1049, label: 'Guardião Doméstico', emoji: '🏠' },
  { rank: 8, min: 1050, max: 1449, label: 'Guardião Ativo', emoji: '⚡' },
  { rank: 9, min: 1450, max: 1999, label: 'Guardião Preventivo', emoji: '🧭' },
  { rank: 10, min: 2000, max: 2699, label: 'Mentor Felino', emoji: '🎓' },
  { rank: 11, min: 2700, max: 3549, label: 'Mentor de Rotina', emoji: '📊' },
  { rank: 12, min: 3550, max: 4549, label: 'Mentor do Bem-Estar', emoji: '🌿' },
  { rank: 13, min: 4550, max: 5699, label: 'Estrategista Felino', emoji: '♟️' },
  { rank: 14, min: 5700, max: 6999, label: 'Estrategista de Cuidado', emoji: '🧠' },
  { rank: 15, min: 7000, max: 8499, label: 'Curador do Gatedo', emoji: '🏛️' },
  { rank: 16, min: 8500, max: 10199, label: 'Curador Preventivo', emoji: '🔮' },
  { rank: 17, min: 10200, max: 12099, label: 'Protetor de Elite', emoji: '✨' },
  { rank: 18, min: 12100, max: 14199, label: 'Guardião Supremo', emoji: '👑' },
  { rank: 19, min: 14200, max: 16499, label: 'Lenda do Gatedo', emoji: '🌟' },
  { rank: 20, min: 16500, max: 999999999, label: 'Arquiteto da Jornada', emoji: '🐾👑' },
];

export const CAT_LEVELS = [
  { rank: 1, min: 0, max: 19, label: 'Filhote de Jornada', emoji: '🐾' },
  { rank: 2, min: 20, max: 59, label: 'Patinha Curiosa', emoji: '🐱' },
  { rank: 3, min: 60, max: 119, label: 'Ronrom Inicial', emoji: '😺' },
  { rank: 4, min: 120, max: 199, label: 'Explorador Doméstico', emoji: '🏠' },
  { rank: 5, min: 200, max: 319, label: 'Guardião da Casa', emoji: '🛡️' },
  { rank: 6, min: 320, max: 479, label: 'Miado Atento', emoji: '👀' },
  { rank: 7, min: 480, max: 699, label: 'Vigilante Felino', emoji: '🐈' },
  { rank: 8, min: 700, max: 999, label: 'Companheiro Evolutivo', emoji: '💫' },
  { rank: 9, min: 1000, max: 1399, label: 'Alma da Casa', emoji: '🏡' },
  { rank: 10, min: 1400, max: 1899, label: 'Gato de Rotina', emoji: '📘' },
  { rank: 11, min: 1900, max: 2499, label: 'Guardião de Sofá', emoji: '🛋️' },
  { rank: 12, min: 2500, max: 3199, label: 'Veterano Felino', emoji: '🎖️' },
  { rank: 13, min: 3200, max: 3999, label: 'Olhar Experiente', emoji: '👁️' },
  { rank: 14, min: 4000, max: 4899, label: 'Mestre do Ronrom', emoji: '🎼' },
  { rank: 15, min: 4900, max: 5899, label: 'Guardião Nobre', emoji: '👑' },
  { rank: 16, min: 5900, max: 6999, label: 'Oráculo do Lar', emoji: '🔮' },
  { rank: 17, min: 7000, max: 8199, label: 'Lenda Felina', emoji: '🌟' },
  { rank: 18, min: 8200, max: 9499, label: 'Espírito da Casa', emoji: '✨' },
  { rank: 19, min: 9500, max: 10999, label: 'Soberano do Gatedo', emoji: '🐾👑' },
  { rank: 20, min: 11000, max: 999999999, label: 'Mito Felino', emoji: '💎' },
];

export const SPECIAL_TIERS = {
  FOUNDER: {
    matchPlans: ['FOUNDER'],
    matchBadges: ['FOUNDER', 'FOUNDING_MEMBER'],
    unlockAction: 'FOUNDER_UNLOCK',
    xpt: 100,
    gpts: 300,
    badgeGranted: 'FOUNDING_MEMBER',
    source: 'founder-tier-unlock',
  },
  TESTER_VIP: {
    matchPlans: ['TESTER_VIP'],
    matchBadges: ['TESTER_VIP'],
    unlockAction: 'TESTER_VIP_UNLOCK',
    xpt: 50,
    gpts: 150,
    badgeGranted: 'TESTER_VIP',
    source: 'tester-vip-tier-unlock',
  },
} as const;

export function calcTutorLevelMeta(xpt: number) {
  return TUTOR_LEVELS.find((l) => xpt >= l.min && xpt <= l.max) ?? TUTOR_LEVELS[0];
}

export function calcCatLevelMeta(xpg: number) {
  return CAT_LEVELS.find((l) => xpg >= l.min && xpg <= l.max) ?? CAT_LEVELS[0];
}