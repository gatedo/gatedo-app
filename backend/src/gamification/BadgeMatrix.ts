import { RarityScale } from "./RarityScale";

export const BadgeMatrix = {
  FOUNDING_MEMBER: {
    code: "FOUNDING_MEMBER",
    title: "Fundador GATEDO",
    ownerType: "TUTOR",
    rarity: RarityScale.LIMITED,
    category: "FOUNDADOR",
  },

  TUTOR_VERIFICADO: {
    code: "TUTOR_VERIFICADO",
    title: "Tutor Verificado",
    ownerType: "TUTOR",
    rarity: RarityScale.COMMON,
    category: "PERFIL",
  },

  PRIMEIRO_COMPANHEIRO: {
    code: "PRIMEIRO_COMPANHEIRO",
    title: "Primeiro Companheiro",
    ownerType: "TUTOR",
    rarity: RarityScale.COMMON,
    category: "JORNADA",
  },

  PERFIL_COMPLETO: {
    code: "PERFIL_COMPLETO",
    title: "Perfil Completo",
    ownerType: "PET",
    rarity: RarityScale.COMMON,
    category: "PERFIL",
  },

  VACINA_EM_DIA: {
    code: "VACINA_EM_DIA",
    title: "Vacina em Dia",
    ownerType: "PET",
    rarity: RarityScale.RARE,
    category: "SAUDE",
  },

  PESO_MONITORADO: {
    code: "PESO_MONITORADO",
    title: "Peso Monitorado",
    ownerType: "PET",
    rarity: RarityScale.RARE,
    category: "SAUDE",
  },

  PROTOCOLO_COMPLETO: {
    code: "PROTOCOLO_COMPLETO",
    title: "Protocolo Completo",
    ownerType: "PET",
    rarity: RarityScale.EPIC,
    category: "SAUDE",
  },

  PRIMEIRA_ARTE: {
    code: "PRIMEIRA_ARTE",
    title: "Primeira Arte",
    ownerType: "TUTOR",
    rarity: RarityScale.COMMON,
    category: "STUDIO",
  },

  CRIADOR_VIDEO: {
    code: "CRIADOR_VIDEO",
    title: "Criador de Vídeo",
    ownerType: "TUTOR",
    rarity: RarityScale.EPIC,
    category: "STUDIO",
  },

  PRIMEIRO_POST: {
    code: "PRIMEIRO_POST",
    title: "Primeiro Post",
    ownerType: "TUTOR",
    rarity: RarityScale.COMMON,
    category: "COMUNIDADE",
  },

  POST_POPULAR: {
    code: "POST_POPULAR",
    title: "Post Popular",
    ownerType: "TUTOR",
    rarity: RarityScale.EPIC,
    category: "COMUNIDADE",
  },

  TUTOR_CONECTADO: {
    code: "TUTOR_CONECTADO",
    title: "Tutor Conectado",
    ownerType: "TUTOR",
    rarity: RarityScale.RARE,
    category: "REDE_DE_CUIDADO",
  },

  LENDA_FELINA: {
    code: "LENDA_FELINA",
    title: "Lenda Felina",
    ownerType: "PET",
    rarity: RarityScale.LEGENDARY,
    category: "JORNADA",
  },
} as const;

export type BadgeCode = keyof typeof BadgeMatrix;