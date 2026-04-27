const TUTOR_LEVELS = [
  { rank: 1, min: 0, max: 49, name: 'Gateiro Iniciante', emoji: '🐾' },
  { rank: 2, min: 50, max: 119, name: 'Gateiro Curioso', emoji: '🐱' },
  { rank: 3, min: 120, max: 219, name: 'Gateiro Atento', emoji: '🐈' },
  { rank: 4, min: 220, max: 349, name: 'Tutor de Rotina', emoji: '📘' },
  { rank: 5, min: 350, max: 519, name: 'Tutor Preventivo', emoji: '🛡️' },
  { rank: 6, min: 520, max: 749, name: 'Tutor Cuidadoso', emoji: '🧡' },
  { rank: 7, min: 750, max: 1049, name: 'Guardiao Domestico', emoji: '🏠' },
  { rank: 8, min: 1050, max: 1449, name: 'Guardiao Ativo', emoji: '⚡' },
  { rank: 9, min: 1450, max: 1999, name: 'Guardiao Preventivo', emoji: '🧭' },
  { rank: 10, min: 2000, max: 2699, name: 'Mentor Felino', emoji: '🎓' },
  { rank: 11, min: 2700, max: 3549, name: 'Mentor de Rotina', emoji: '📊' },
  { rank: 12, min: 3550, max: 4549, name: 'Mentor do Bem-Estar', emoji: '🌿' },
  { rank: 13, min: 4550, max: 5699, name: 'Estrategista Felino', emoji: '🤖' },
  { rank: 14, min: 5700, max: 6999, name: 'Estrategista de Cuidado', emoji: '🧪' },
  { rank: 15, min: 7000, max: 8499, name: 'Curador do Gatedo', emoji: '🏛️' },
  { rank: 16, min: 8500, max: 10199, name: 'Curador Preventivo', emoji: '🔮' },
  { rank: 17, min: 10200, max: 12099, name: 'Protetor de Elite', emoji: '✨' },
  { rank: 18, min: 12100, max: 14199, name: 'Guardiao Supremo', emoji: '👑' },
  { rank: 19, min: 14200, max: 16499, name: 'Lenda do Gatedo', emoji: '🌟' },
  { rank: 20, min: 16500, max: Infinity, name: 'Arquiteto da Jornada', emoji: '🐾👑' },
];

const CAT_LEVELS = [
  { rank: 1, min: 0, max: 19, name: 'Filhote de Jornada', emoji: '🐾' },
  { rank: 2, min: 20, max: 59, name: 'Patinha Curiosa', emoji: '🐱' },
  { rank: 3, min: 60, max: 119, name: 'Ronrom Inicial', emoji: '😺' },
  { rank: 4, min: 120, max: 199, name: 'Explorador Domestico', emoji: '🏠' },
  { rank: 5, min: 200, max: 319, name: 'Guardiao da Casa', emoji: '🛡️' },
  { rank: 6, min: 320, max: 479, name: 'Miado Atento', emoji: '👀' },
  { rank: 7, min: 480, max: 699, name: 'Vigilante Felino', emoji: '🐈' },
  { rank: 8, min: 700, max: 999, name: 'Companheiro Evolutivo', emoji: '💫' },
  { rank: 9, min: 1000, max: 1399, name: 'Alma da Casa', emoji: '🏡' },
  { rank: 10, min: 1400, max: 1899, name: 'Gato de Rotina', emoji: '📘' },
  { rank: 11, min: 1900, max: 2499, name: 'Guardiao de Sofa', emoji: '🛋️' },
  { rank: 12, min: 2500, max: 3199, name: 'Veterano Felino', emoji: '🎖️' },
  { rank: 13, min: 3200, max: 3999, name: 'Olhar Experiente', emoji: '👁️' },
  { rank: 14, min: 4000, max: 4899, name: 'Mestre do Ronrom', emoji: '🎼' },
  { rank: 15, min: 4900, max: 5899, name: 'Guardiao Nobre', emoji: '👑' },
  { rank: 16, min: 5900, max: 6999, name: 'Oraculo do Lar', emoji: '🔮' },
  { rank: 17, min: 7000, max: 8199, name: 'Lenda Felina', emoji: '🌟' },
  { rank: 18, min: 8200, max: 9499, name: 'Espirito da Casa', emoji: '✨' },
  { rank: 19, min: 9500, max: 10999, name: 'Soberano do Gatedo', emoji: '🐾👑' },
  { rank: 20, min: 11000, max: Infinity, name: 'Mito Felino', emoji: '💎' },
];

const LIFE_STAGE_STYLES = {
  BABY: { label: 'BABY', className: 'bg-pink-50 text-pink-600 border-pink-200' },
  JUNIOR: { label: 'JUNIOR', className: 'bg-sky-50 text-sky-600 border-sky-200' },
  GROWN: { label: 'GROWN', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  SENIOR: { label: 'SENIOR', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  UNKNOWN: { label: 'SEM IDADE', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export function getTutorLevelMeta(xpt = 0) {
  return TUTOR_LEVELS.find((level) => xpt >= level.min && xpt <= level.max) || TUTOR_LEVELS[0];
}

export function getCatLevelMeta(xpg = 0) {
  return CAT_LEVELS.find((level) => xpg >= level.min && xpg <= level.max) || CAT_LEVELS[0];
}

export function formatShortId(id = '') {
  if (!id) return '---';
  return `${String(id).slice(0, 8)}...`;
}

export function formatDate(value) {
  if (!value) return 'Sem data';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return date.toLocaleDateString('pt-BR');
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

export function getInitials(name = '') {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'GT';
  return parts.map((part) => part[0]?.toUpperCase?.() || '').join('');
}

export function getPetAgeInMonths(pet = {}) {
  const years = Number(pet?.ageYears);
  const months = Number(pet?.ageMonths);

  if (Number.isFinite(years) || Number.isFinite(months)) {
    return Math.max(0, (Number.isFinite(years) ? years : 0) * 12 + (Number.isFinite(months) ? months : 0));
  }

  if (pet?.birthDate) {
    const birthDate = new Date(pet.birthDate);
    if (!Number.isNaN(birthDate.getTime())) {
      const now = new Date();
      let totalMonths = (now.getFullYear() - birthDate.getFullYear()) * 12;
      totalMonths += now.getMonth() - birthDate.getMonth();
      if (now.getDate() < birthDate.getDate()) totalMonths -= 1;
      return Math.max(0, totalMonths);
    }
  }

  return null;
}

export function getPetAgeLabel(pet = {}) {
  const totalMonths = getPetAgeInMonths(pet);
  if (totalMonths === null) return 'Sem idade';

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years <= 0) {
    return `${months} mes${months === 1 ? '' : 'es'}`;
  }

  if (months <= 0) {
    return `${years} ano${years === 1 ? '' : 's'}`;
  }

  return `${years}a ${months}m`;
}

export function getCatLifeStage(pet = {}) {
  const totalMonths = getPetAgeInMonths(pet);

  if (totalMonths === null) {
    return LIFE_STAGE_STYLES.UNKNOWN;
  }

  if (totalMonths < 12) return LIFE_STAGE_STYLES.BABY;
  if (totalMonths < 24) return LIFE_STAGE_STYLES.JUNIOR;
  if (totalMonths < 84) return LIFE_STAGE_STYLES.GROWN;
  return LIFE_STAGE_STYLES.SENIOR;
}
