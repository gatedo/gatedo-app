export const RewardMatrix = {
  FOUNDER_UNLOCK: {
    gpts: 300,
    xpt: 100,
    xpg: 0,
    badge: "FOUNDING_MEMBER",
  },

  FOUNDER_MONTHLY_BONUS: {
    gpts: 10,
    xpt: 0,
    xpg: 0,
  },

  DAILY_LOGIN: {
    gpts: 1,
    xpt: 2,
    xpg: 0,
  },

  TUTOR_PROFILE_COMPLETE: {
    gpts: 0,
    xpt: 12,
    xpg: 0,
    badge: "TUTOR_VERIFICADO",
  },

  CAT_REGISTERED: {
    gpts: 0,
    xpt: 8,
    xpg: 20,
    badge: "PRIMEIRO_COMPANHEIRO",
  },

  CAT_PROFILE_COMPLETE: {
    gpts: 0,
    xpt: 10,
    xpg: 15,
    badge: "PERFIL_COMPLETO",
  },

  IGENT_CONSULT: {
    gpts: -20,
    xpt: 10,
    xpg: 8,
  },

  VACCINE_REGISTERED: {
    gpts: 0,
    xpt: 4,
    xpg: 12,
    badge: "VACINA_EM_DIA_PROGRESS",
  },

  MEDICATION_REGISTERED: {
    gpts: 0,
    xpt: 5,
    xpg: 10,
  },

  TREATMENT_REGISTERED: {
    gpts: 0,
    xpt: 6,
    xpg: 12,
  },

  WEIGHT_LOG: {
    gpts: 0,
    xpt: 2,
    xpg: 6,
  },

  WEIGHT_STREAK_3: {
    gpts: 0,
    xpt: 2,
    xpg: 10,
    badge: "PESO_MONITORADO",
  },

  STUDIO_IMAGE: {
    gpts: -15,
    xpt: 12,
    xpg: 6,
    badge: "PRIMEIRA_ARTE_PROGRESS",
  },

  STUDIO_VIDEO: {
    gpts: -30,
    xpt: 25,
    xpg: 12,
    badge: "CRIADOR_VIDEO_PROGRESS",
  },

  COMMUNITY_POST: {
    gpts: 0,
    xpt: 6,
    xpg: 6,
    badge: "PRIMEIRO_POST_PROGRESS",
  },

  COMMUNITY_POST_POPULAR: {
    gpts: 0,
    xpt: 5,
    xpg: 3,
    badge: "POST_POPULAR",
  },

  VET_CONTACT_ADDED: {
    gpts: 0,
    xpt: 4,
    xpg: 0,
    badge: "TUTOR_CONECTADO_PROGRESS",
  },

  VET_INDICATION_SENT: {
    gpts: 0,
    xpt: 3,
    xpg: 0,
  },
} as const;

export type RewardAction = keyof typeof RewardMatrix;