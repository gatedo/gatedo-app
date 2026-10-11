// Identidade visual das categorias do Almanaque. O admin pode enviar um
// banner (coverUrl); sem banner, cada categoria tem um degradê e um emoji
// próprios — assim a biblioteca nunca fica "cinza" esperando imagem.

const VISUALS = {
  alimentacao: { emoji: '🍽️', from: '#FFB86B', to: '#FF7A59', ink: '#7A2E0E' },
  caixa: { emoji: '🧺', from: '#7DD3FC', to: '#3B82F6', ink: '#0B3A75' },
  ambiente: { emoji: '🏡', from: '#86EFAC', to: '#10B981', ink: '#064E3B' },
  comportamento: { emoji: '🐾', from: '#C4B5FD', to: '#8B4AFF', ink: '#3B1A80' },
  emergencia: { emoji: '🚨', from: '#FCA5A5', to: '#EF4444', ink: '#7F1D1D' },
  filhote: { emoji: '🌱', from: '#FDE68A', to: '#F59E0B', ink: '#78350F' },
  saude: { emoji: '🩺', from: '#F9A8D4', to: '#EC4899', ink: '#831843' },
  preventivo: { emoji: '💉', from: '#5EEAD4', to: '#14B8A6', ink: '#134E4A' },
};

const FALLBACK = { emoji: '📖', from: '#C4B5FD', to: '#6D3BEB', ink: '#2D2657' };

export function guideVisual(categoryId) {
  return VISUALS[categoryId] || FALLBACK;
}

export function guideGradient(categoryId, angle = 135) {
  const v = guideVisual(categoryId);
  return `linear-gradient(${angle}deg, ${v.from} 0%, ${v.to} 100%)`;
}

/** Banner que vale para um verbete: o dele, senão o da categoria. */
export function entryCover(entry) {
  return entry?.coverUrl || entry?.category?.coverUrl || null;
}

/** Minutos de leitura (≈200 palavras/min), mínimo 1. */
export function readingMinutes(entry) {
  const fromBlocks = Array.isArray(entry?.blocks)
    ? entry.blocks.map((b) => [b.markdown, b.body, b.text, b.heading, ...(b.items || [])].filter(Boolean).join(' ')).join(' ')
    : '';
  const text = `${entry?.body || ''} ${fromBlocks}`;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
