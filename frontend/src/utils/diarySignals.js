// Sinais de saúde do diário — espelho de backend/src/diary/diary-signals.ts.
// As chaves precisam ser idênticas: o backend descarta qualquer chave que
// não conheça ao salvar.
//
// alarm: sozinho já pede veterinário — mostra aviso vermelho na hora.
// tip:   orientação curta que aparece quando o sinal é marcado.
export const DIARY_SIGNALS = [
  { key: 'URINARY_ACCIDENT', label: 'Xixi fora da caixa', emoji: '🚽' },
  {
    key: 'LITTER_STRAIN',
    label: 'Esforço na caixa / pouco xixi',
    emoji: '🚨',
    alarm: true,
    tip: 'Forçar na caixa e sair pouco ou nenhum xixi pode ser obstrução urinária. É emergência, principalmente em machos: procure um veterinário hoje.',
  },
  { key: 'VOMIT', label: 'Vômito', emoji: '🤮', tip: 'Se vomitar mais de uma vez no dia ou parar de comer, procure o veterinário.' },
  { key: 'HAIRBALL', label: 'Bola de pelo', emoji: '🧶' },
  { key: 'STOOL_CHANGE', label: 'Cocô alterado', emoji: '💩', tip: 'Diarreia com sangue ou por mais de 2 dias pede veterinário.' },
  { key: 'LOW_APPETITE', label: 'Comeu pouco', emoji: '🍽️', tip: 'Gato mais de 24h sem comer precisa de veterinário: jejum longo é perigoso pra eles.' },
  { key: 'DRINKING_MORE', label: 'Bebendo mais água', emoji: '💧', tip: 'Sede aumentando por vários dias pode indicar rim, diabetes ou tireoide. Vale comentar com o veterinário.' },
  { key: 'LETHARGY', label: 'Apático / parado', emoji: '😿', tip: 'Se vier junto com falta de apetite ou vômito, procure o veterinário.' },
  { key: 'ITCHING', label: 'Coceira / lambedura', emoji: '🐾' },
  { key: 'SNEEZING', label: 'Espirros / nariz', emoji: '🤧' },
  { key: 'HIDING', label: 'Escondido / estressado', emoji: '🙈' },
];

export const SIGNAL_BY_KEY = Object.fromEntries(DIARY_SIGNALS.map((s) => [s.key, s]));
