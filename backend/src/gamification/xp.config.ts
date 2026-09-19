/**
 * Fonte única dos valores de XP (XPT do tutor e XPG do gato).
 * Mude os números aqui — nenhum outro arquivo deve ter valor de XP hardcoded.
 *
 * Princípio: premia dado clínico real, não uso do app.
 * - ALTO:  pesagem, consulta com data, cirurgia registrada.
 * - MEDIO: vacina, vermífugo, antipulgas, medicação, exame, ficha do gato completa (1x).
 * - BAIXO: entrada de diário — sustenta o streak, mas não é dado clínico.
 * - ZERO:  qualquer ação sem dado novo (abrir tela, navegar, curtir, Studio, iGentVet).
 */

export type XpReward = { tutorXp: number; catXp: number };

export const XP_TIERS = {
  ALTO: { tutorXp: 20, catXp: 15 } as XpReward,
  MEDIO: { tutorXp: 10, catXp: 8 } as XpReward,
  BAIXO: { tutorXp: 3, catXp: 3 } as XpReward,
  ZERO: { tutorXp: 0, catXp: 0 } as XpReward,
};

/**
 * Mapa por tipo de HealthRecord (backend/prisma/schema.prisma → enum HealthType).
 * "EXAM" cobre exames genéricos — check-ins de peso (title "Check-in de Peso: Xkg",
 * criados via FAB/Linha do tempo) são tratados à parte como WEIGHT_LOG, mais valioso.
 */
export const HEALTH_RECORD_XP_TIER: Record<string, keyof typeof XP_TIERS> = {
  CONSULTATION: 'ALTO',
  IACONSULT: 'ALTO',
  SURGERY: 'ALTO',
  VACCINE: 'MEDIO',
  VERMIFUGE: 'MEDIO',
  PARASITE: 'MEDIO',
  MEDICATION: 'MEDIO',
  MEDICINE: 'MEDIO',
  EXAM: 'MEDIO',
};

const WEIGHT_CHECKIN_TITLE_RE = /check-in de peso/i;

export const XP_ACTIONS = {
  WEIGHT_LOG: XP_TIERS.ALTO,
  PROFILE_COMPLETE: XP_TIERS.MEDIO,
  DIARY_ENTRY: XP_TIERS.BAIXO,
  IGENT_CONSULT: XP_TIERS.ZERO,
  STUDIO_CREATION: XP_TIERS.ZERO,
  // Só a conclusão de cada dia de protocolo pontua — triagem e a tela de
  // emergência (interrompido_emergencia) nunca chamam esta ação.
  PROTOCOL_DAY_COMPLETE: XP_TIERS.BAIXO,
};

export function getHealthRecordXp(type: string, title?: string | null): XpReward {
  if (type === 'EXAM' && WEIGHT_CHECKIN_TITLE_RE.test(title || '')) {
    return XP_ACTIONS.WEIGHT_LOG;
  }
  const tier = HEALTH_RECORD_XP_TIER[type];
  return tier ? XP_TIERS[tier] : XP_TIERS.ZERO;
}

/**
 * Campos considerados essenciais para a "ficha do gato" contar como completa.
 * Ajuste esta lista se o critério de completude mudar.
 */
export const PROFILE_COMPLETE_FIELDS = ['breed', 'gender', 'weight', 'photoUrl'] as const;

export function isProfileComplete(pet: {
  breed?: string | null;
  gender?: string | null;
  birthDate?: Date | string | null;
  ageYears?: number | null;
  weight?: number | null;
  photoUrl?: string | null;
}): boolean {
  const hasAge = !!pet.birthDate || (pet.ageYears != null && pet.ageYears >= 0);
  return !!(
    pet.breed &&
    pet.gender &&
    pet.gender !== 'UNKNOWN' &&
    hasAge &&
    pet.weight &&
    pet.photoUrl
  );
}
