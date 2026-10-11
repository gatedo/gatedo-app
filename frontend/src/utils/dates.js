// Datas "sem hora" (consulta, vacina, reconsulta...) eram enviadas como
// `new Date('2026-10-01')` = meia-noite UTC. No Brasil isso é 21h do dia
// anterior, então tudo aparecia um dia antes (consulta de 01/10 virava 30/09).
//
// Agora: a data é guardada ao meio-dia UTC (cai no mesmo dia em qualquer fuso
// das Américas/Europa) e, na leitura, registros antigos gravados à meia-noite
// UTC exata são tratados como "data pura".

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_MIDNIGHT = /^(\d{4})-(\d{2})-(\d{2})T00:00:00(?:\.000)?Z$/;

/** Hoje no fuso do aparelho, no formato do <input type="date">. */
export function todayInputValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' do input → ISO ao meio-dia UTC (ou null). */
export function dateOnlyToApi(value) {
  if (!value) return null;
  const m = String(value).match(DATE_ONLY);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T12:00:00.000Z`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Converte o que vier da API/input em Date "certo" pra exibir. */
export function toDisplayDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value);
  const m = raw.match(DATE_ONLY) || raw.match(UTC_MIDNIGHT);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatRecordDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }, fallback = '—') {
  const d = toDisplayDate(value);
  return d ? d.toLocaleDateString('pt-BR', options) : fallback;
}
