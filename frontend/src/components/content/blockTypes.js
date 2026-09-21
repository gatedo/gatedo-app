// Contrato compartilhado dos blocos de conteúdo rico (Almanaque + Protocolo).
// Usado tanto pelo BlockRenderer (leitura) quanto pelo editor admin (escrita) —
// mudar um tipo aqui exige olhar os dois lados.

export const BLOCK_TYPES = {
  TEXT: 'TEXT',
  SECTION: 'SECTION',
  IMAGE: 'IMAGE',
  CHECKLIST: 'CHECKLIST',
  CALLOUT: 'CALLOUT',
  OFFER_SLOT: 'OFFER_SLOT',
};

// Superfícies de oferta que um bloco de conteúdo pode pedir. Nunca HEALTH —
// a regra dura "nenhuma oferta na aba Saúde" vale aqui também, e o backend
// (OfferDecisionService) já recusa HEALTH de qualquer forma; isso só evita
// que o editor ofereça a opção.
export const OFFER_SLOT_SURFACES = [
  { value: 'PAIN_ALMANAC', label: 'Contexto do verbete (ex.: Protocolo relacionado)' },
  { value: 'POST_SUCCESS', label: 'Pós-sucesso (ex.: depois de um passo concluído)' },
];

export const CALLOUT_TONES = [
  { id: 'tip',     label: 'Dica',       color: '#0EA5E9' },
  { id: 'warning', label: 'Atenção',    color: '#F59E0B' },
  { id: 'vet',     label: 'Dica do vet',color: '#8B4AFF' },
];

export const SECTION_COLOR_PRESETS = [
  '#8B4AFF', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#334155',
];

export function makeBlock(type) {
  const id = `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  switch (type) {
    case BLOCK_TYPES.TEXT:
      return { id, type, markdown: '' };
    case BLOCK_TYPES.SECTION:
      return { id, type, heading: '', color: SECTION_COLOR_PRESETS[0], body: '' };
    case BLOCK_TYPES.IMAGE:
      return { id, type, url: '', caption: '' };
    case BLOCK_TYPES.CHECKLIST:
      return { id, type, title: '', items: [''] };
    case BLOCK_TYPES.CALLOUT:
      return { id, type, tone: 'tip', text: '' };
    case BLOCK_TYPES.OFFER_SLOT:
      return { id, type, surface: 'PAIN_ALMANAC' };
    default:
      return { id, type: BLOCK_TYPES.TEXT, markdown: '' };
  }
}

export function isBlocksArray(value) {
  return Array.isArray(value) && value.length > 0;
}
