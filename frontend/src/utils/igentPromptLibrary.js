const FEMALE = 'FEMALE';

export const getCatPrep = (cat) => (cat?.gender === FEMALE ? 'da' : 'do');
export const getCatArticle = (cat) => (cat?.gender === FEMALE ? 'a' : 'o');
export const getCatPronoun = (cat) => (cat?.gender === FEMALE ? 'ela' : 'ele');
export const safeFirstName = (name = '') => (name || '').trim().split(/\s+/)[0] || '';

export function normalizeDocumentCategory(raw = '') {
  const value = String(raw || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
  if (!value) return 'OUTROS';
  if (['OFICIAL', 'PRONTUARIO', 'PRONTUARIOS', 'LAUDO', 'LAUDO_MEDICO', 'LAUDOS_MEDICOS', 'LAUDOS MEDICOS'].includes(value)) return 'LAUDOS_MEDICOS';
  if (['LAUDO_IA', 'LAUDOS_IA', 'LAUDOS IA'].includes(value)) return 'LAUDOS_IA';
  if (['EXAME', 'EXAMES'].includes(value)) return 'EXAMES';
  if (['RECEITA', 'RECEITAS'].includes(value)) return 'RECEITAS';
  return value;
}

const shortDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR');
};

const clip = (value = '', max = 140) => {
  const txt = String(value || '').replace(/\s+/g, ' ').trim();
  return txt.length > max ? `${txt.slice(0, max).trim()}…` : txt;
};

const listToHuman = (arr = []) => arr.filter(Boolean).join(', ');

export function summarizeDocumentsForContext(documents = []) {
  const grouped = {
    LAUDOS_MEDICOS: [],
    LAUDOS_IA: [],
    EXAMES: [],
    RECEITAS: [],
    OUTROS: [],
  };

  documents.forEach((doc) => {
    const key = normalizeDocumentCategory(doc?.normalizedCategory || doc?.category || doc?.folder || doc?.type);
    (grouped[key] || grouped.OUTROS).push(doc);
  });

  const mapDocs = (items = [], label = '') => items.slice(0, 4).map((doc) => ({
    id: doc?.id,
    title: doc?.title || doc?.name || doc?.filename || label,
    label,
    date: shortDate(doc?.createdAt || doc?.date),
    excerpt: clip(doc?.summary || doc?.notes || doc?.description || doc?.content || ''),
  }));

  const signals = [];
  if (grouped.LAUDOS_MEDICOS.length) signals.push(`${grouped.LAUDOS_MEDICOS.length} laudo(s) médico(s)`);
  if (grouped.LAUDOS_IA.length) signals.push(`${grouped.LAUDOS_IA.length} laudo(s) IA`);
  if (grouped.EXAMES.length) signals.push(`${grouped.EXAMES.length} exame(s)`);
  if (grouped.RECEITAS.length) signals.push(`${grouped.RECEITAS.length} receita(s)`);

  return {
    medicalReportsCount: grouped.LAUDOS_MEDICOS.length,
    aiReportsCount: grouped.LAUDOS_IA.length,
    examsCount: grouped.EXAMES.length,
    prescriptionsCount: grouped.RECEITAS.length,
    medicalReports: mapDocs(grouped.LAUDOS_MEDICOS, 'Laudo médico'),
    aiReports: mapDocs(grouped.LAUDOS_IA, 'Laudo IA'),
    exams: mapDocs(grouped.EXAMES, 'Exame'),
    prescriptions: mapDocs(grouped.RECEITAS, 'Receita'),
    signals,
  };
}

export function formatDocumentInsights(summary = {}) {
  const lines = [];
  if (summary.medicalReportsCount) lines.push(`${summary.medicalReportsCount} laudo(s) médico(s) no prontuário`);
  if (summary.aiReportsCount) lines.push(`${summary.aiReportsCount} laudo(s) IA anterior(es)`);
  if (summary.examsCount) lines.push(`${summary.examsCount} exame(s) anexado(s)`);
  if (summary.prescriptionsCount) lines.push(`${summary.prescriptionsCount} receita(s) registrada(s)`);
  return lines;
}

export function summarizeHistorySignals({ cat, symptom, ownerName, clinicalContext = {} }) {
  const parts = [];
  if (ownerName) parts.push(`${safeFirstName(ownerName)} acompanha bem ${getCatPrep(cat)} ${cat?.name || 'gato'}`);
  if (clinicalContext?.totalConsults) parts.push(`${clinicalContext.totalConsults} atendimento(s) anteriores`);
  if (clinicalContext?.ongoingTreatments?.length) parts.push(`tratamento em andamento: ${listToHuman(clinicalContext.ongoingTreatments.slice(0, 2))}`);
  if (clinicalContext?.medications?.length) parts.push(`medicação ativa: ${listToHuman(clinicalContext.medications.slice(0, 2))}`);
  if (clinicalContext?.allergies?.length) parts.push(`alergias registradas: ${listToHuman(clinicalContext.allergies.slice(0, 2))}`);
  if (clinicalContext?.chronicConditions?.length) parts.push(`condições crônicas: ${listToHuman(clinicalContext.chronicConditions.slice(0, 2))}`);
  if (clinicalContext?.documentSignals?.length) parts.push(`documentos relevantes: ${listToHuman(clinicalContext.documentSignals.slice(0, 3))}`);
  if (symptom?.label) parts.push(`foco atual em ${symptom.label.toLowerCase()}`);
  return parts;
}

export function ensureQuestionEnding(text, fallback) {
  const base = String(text || '').replace(/\s+/g, ' ').trim();
  if (!base) return fallback || '';
  if (/[?¿]$/.test(base)) return base;
  return `${base.replace(/[.!]+$/,'')}?`;
}

export function buildHumanizedGreetingIntro({ cat, ownerName, clinicalContext = {} }) {
  const owner = safeFirstName(ownerName);
  const chunks = [];
  chunks.push(owner ? `Oi, ${owner}!` : 'Oi!');
  chunks.push(`Vejo que você cuida bem ${getCatPrep(cat)} ${cat?.name || 'seu gato'}.`);
  if (clinicalContext?.totalConsults) chunks.push(`Eu revisei ${clinicalContext.totalConsults} registro${clinicalContext.totalConsults > 1 ? 's' : ''} anteriores antes de começar.`);
  if (clinicalContext?.lastConsultDate) chunks.push(`A última referência clínica que encontrei foi em ${clinicalContext.lastConsultDate}.`);
  return chunks.join(' ');
}

export function buildPredictiveFallbackQuestion({ cat, symptom, ownerName, clinicalContext = {} }) {
  const owner = safeFirstName(ownerName);
  const medSignal = clinicalContext?.medications?.length ? ` e considerando que ${getCatPronoun(cat)} já usa ${clinicalContext.medications[0]}` : '';
  const base = `${owner ? `${owner}, ` : ''}para eu refinar melhor a leitura sobre ${symptom?.label?.toLowerCase() || 'esse quadro'}${medSignal}, me diga: isso piorou de forma súbita, veio em ondas ou está estável desde que você percebeu?`;
  return ensureQuestionEnding(base);
}

export function buildPromptLibraryPayload({ cat, symptom, ownerName, clinicalContext = {} }) {
  return {
    voice: 'humanizada, acolhedora, objetiva e preditiva',
    hardRules: [
      'sempre considerar histórico clínico antes de responder',
      'diferenciar laudos médicos de laudos IA',
      'não soar alarmista sem sinal de urgência',
      'sempre terminar com uma pergunta útil',
    ],
    personaAnchors: {
      ownerName: safeFirstName(ownerName),
      catName: cat?.name || '',
      catGenderPrep: getCatPrep(cat),
      symptomLabel: symptom?.label || '',
    },
    context: {
      totalConsults: clinicalContext?.totalConsults || 0,
      lastConsultDate: clinicalContext?.lastConsultDate || null,
      treatments: clinicalContext?.ongoingTreatments || [],
      medications: clinicalContext?.medications || [],
      vaccines: clinicalContext?.vacuines || clinicalContext?.vaccines || [],
      allergies: clinicalContext?.allergies || [],
      chronicConditions: clinicalContext?.chronicConditions || [],
      documentsSummary: clinicalContext?.documentsSummary || null,
    },
  };
}

export function enhanceAiAnalysisText(text, { cat, ownerName, historySignals = [], docInsights = [] }) {
  const body = String(text || '').trim();
  const intro = `${safeFirstName(ownerName) ? `${safeFirstName(ownerName)}, ` : ''}vejo que você cuida bem ${getCatPrep(cat)} ${cat?.name || 'seu gato'}.`;
  const history = historySignals.length ? ` Pelo histórico, já considerei ${historySignals.slice(0, 3).join(' · ')}.` : '';
  const docs = docInsights.length ? ` Também cruzei ${docInsights.slice(0, 3).join(' · ')}.` : '';
  return [intro, history, docs, body].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export function enhanceBreedNoteText(text, { cat }) {
  const base = String(text || '').trim();
  if (!base) return '';
  return `Como ${cat?.name || 'esse gato'} é ${cat?.breed || 'felino'}, vale manter isso no radar: ${base}`;
}

export function humanizeChatReply(text, { cat, symptom, ownerName, clinicalContext = {} }) {
  const raw = String(text || '').trim();
  const owner = safeFirstName(ownerName);
  const prefix = `${owner ? `${owner}, ` : ''}seguindo o histórico ${getCatPrep(cat)} ${cat?.name || 'seu gato'}, `;
  const meds = clinicalContext?.medications?.length ? `e levando em conta a medicação ativa (${clinicalContext.medications.slice(0, 2).join(', ')}), ` : '';
  const rebuilt = `${prefix}${meds}${raw}`.replace(/\s+/g, ' ').trim();
  const contextualQuestion = symptom?.label
    ? `Você percebeu isso em ${symptom.label.toLowerCase()} só hoje ou já vinha dando sinais antes?`
    : `Você quer me contar quando isso começou para eu afinar a leitura?`;
  return ensureQuestionEnding(rebuilt, contextualQuestion);
}
