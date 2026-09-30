// Sinais de saúde do diário — gravados em DiaryEntry.occurrences (String[]),
// então adicionar/remover um sinal aqui não exige migração. A mesma lista
// existe no frontend em src/constants/diarySignals.js — manter as duas em
// sincronia (chaves iguais).
//
// `protocolHint`: casa com slug/título de um Protocol publicado. É assim que
// um sinal vira oferta de protocolo e que um "Aconteceu de novo" de um
// protocolo volta a contar como sinal — sem slug fixo no código.
export type DiarySignal = {
  key: string;
  label: string;
  protocolHint?: RegExp;
  // Sinal que, sozinho, já pede veterinário — nunca vira oferta de venda.
  alarm?: boolean;
  // Quantas vezes em 14 dias antes de oferecer protocolo. Xixi fora é 1 (já é
  // o problema); bola de pelo isolada é normal, então só a partir de 3.
  offerThreshold?: number;
};

export const DIARY_SIGNALS: DiarySignal[] = [
  { key: 'URINARY_ACCIDENT', label: 'Xixi fora da caixa', protocolHint: /xixi|urin/i, offerThreshold: 1 },
  { key: 'LITTER_STRAIN', label: 'Esforço na caixa / pouco xixi', alarm: true },
  { key: 'VOMIT', label: 'Vômito', protocolHint: /v[oô]mit|digest/i, offerThreshold: 2 },
  { key: 'HAIRBALL', label: 'Bola de pelo', protocolHint: /bola[- ]de[- ]pelo|tricobez/i, offerThreshold: 3 },
  { key: 'STOOL_CHANGE', label: 'Cocô alterado', protocolHint: /diarr|intestin|digest/i, offerThreshold: 2 },
  { key: 'LOW_APPETITE', label: 'Comeu pouco', protocolHint: /apetite|inapet/i, offerThreshold: 2 },
  { key: 'DRINKING_MORE', label: 'Bebendo mais água' },
  { key: 'LETHARGY', label: 'Apático / parado' },
  { key: 'ITCHING', label: 'Coceira / lambedura', protocolHint: /cocei|pele|dermat|prurid/i, offerThreshold: 2 },
  { key: 'SNEEZING', label: 'Espirros / nariz', protocolHint: /respira|espirr|rinit/i, offerThreshold: 2 },
  { key: 'HIDING', label: 'Escondido / estressado', protocolHint: /estress|ansied|comportament/i, offerThreshold: 3 },
];

export const SIGNAL_BY_KEY = new Map(DIARY_SIGNALS.map((s) => [s.key, s]));

export function signalForProtocol(protocol: { slug?: string | null; title?: string | null }): DiarySignal | null {
  const hay = `${protocol.slug || ''} ${protocol.title || ''}`;
  return DIARY_SIGNALS.find((s) => s.protocolHint?.test(hay)) || null;
}

export type SignalCount = { key: string; label: string; count: number; lastAt: Date; alarm: boolean };

// Conta ocorrências por sinal. `extra` recebe eventos que não moram no
// DiaryEntry (ex.: "Aconteceu de novo" dos protocolos) já traduzidos pra chave.
export function summarizeSignals(
  entries: { date: Date; occurrences: string[] }[],
  extra: { key: string; date: Date }[] = [],
): SignalCount[] {
  const acc = new Map<string, SignalCount>();
  const add = (key: string, date: Date) => {
    const sig = SIGNAL_BY_KEY.get(key);
    if (!sig) return;
    const cur = acc.get(key);
    if (cur) {
      cur.count += 1;
      if (date > cur.lastAt) cur.lastAt = date;
    } else {
      acc.set(key, { key, label: sig.label, count: 1, lastAt: date, alarm: !!sig.alarm });
    }
  };
  for (const e of entries) for (const k of e.occurrences || []) add(k, new Date(e.date));
  for (const x of extra) add(x.key, new Date(x.date));
  return [...acc.values()].sort((a, b) => b.count - a.count || b.lastAt.getTime() - a.lastAt.getTime());
}

// Linha única pro prompt do iGentVet — vazia quando não há nada a dizer.
export function formatSignalsForPrompt(summary: SignalCount[], days: number, checkinCount: number): string | null {
  if (checkinCount === 0 && summary.length === 0) return null;
  if (summary.length === 0) {
    return `  - ${checkinCount} check-in(s) nos ultimos ${days} dias, sem nenhum sinal alterado marcado pelo tutor`;
  }
  return summary
    .map((s) => `  - ${s.label}: ${s.count}x (ultimo em ${s.lastAt.toLocaleDateString('pt-BR')})${s.alarm ? ' [SINAL DE ALARME]' : ''}`)
    .join('\n');
}
