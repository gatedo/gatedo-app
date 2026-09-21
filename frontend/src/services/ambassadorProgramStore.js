const STORAGE_KEY = 'gatedo_ambassador_program_v1';
const ATTRIBUTION_KEY = 'gatedo_ambassador_attribution_v1';
export const AMBASSADOR_UPDATED_EVENT = 'gatedo:ambassador-program-updated';

const seedAmbassadors = [
  {
    token: 'EMBAIXADORA-CAROL',
    name: 'Carol Mendes',
    handle: '@carol.comgato',
    city: 'Sao Paulo - SP',
    audience: 5200,
    tier: 'genese',
    status: 'active',
    color: '#8B4AFF',
    initials: 'CM',
    avatarUrl: '',
    affiliateCode: 'CAROLGATEDO',
    commissionPercent: 20,
    storefrontTitle: 'Vitrine da Carol',
    storefrontIntro: 'Uma curadoria afetiva para tutores que querem cuidar melhor dos seus gatos, sem cair em achismo.',
    headline: 'Carol, queremos construir a nova cultura gateira com voce.',
    videoUrl: '',
    customMessage:
      'Voce tem uma comunidade que confia no que voce recomenda. O Gatedo quer transformar essa confianca em um canal recorrente: divulgacao do app agora, carteira de indicacoes desde o primeiro link e, na proxima etapa, uma vitrine sua dentro da Store.',
    highlights: ['Comunidade de alta confianca', 'Conteudo autentico', 'Audiencia gateira engajada'],
  },
  {
    token: 'CURADORA-BELA',
    name: 'Isabela Nunes',
    handle: '@isabela.felina',
    city: 'Belo Horizonte - MG',
    audience: 31500,
    tier: 'curadora',
    status: 'active',
    color: '#FF8C42',
    initials: 'IN',
    avatarUrl: '',
    affiliateCode: 'BELAGATEDO',
    commissionPercent: 20,
    storefrontTitle: 'Achadinhos da Bela',
    storefrontIntro: 'Produtos que fazem sentido na rotina real de gatos, com curadoria e contexto.',
    headline: 'Isabela, sua curadoria pode virar uma vitrine viva no Gatedo.',
    videoUrl: '',
    customMessage:
      'A sua audiencia ja compra a partir da sua recomendacao. A diferenca aqui e que a recomendacao deixa de morrer no story: ela passa a morar em uma vitrine dedicada, conectada ao app e ao seu link de afiliada.',
    highlights: ['Alta conversao em recomendacoes', 'Audiencia com poder de compra', 'Perfil ideal para vitrine curada'],
  },
];

export function normalizeAmbassadorToken(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '');
}

export function makeAmbassadorToken(name = 'EMBAIXADOR') {
  const base = normalizeAmbassadorToken(name)
    .replace(/^(EMBAIXADORA|EMBAIXADOR|CURADORA|PARCEIRA)-?/, '')
    .slice(0, 18) || 'GATEDO';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GATEDO-${base}-${suffix}`;
}

function cleanAmbassador(item) {
  const token = normalizeAmbassadorToken(item?.token);
  return {
    token,
    name: String(item?.name || '').trim() || 'Convidada Gatedo',
    handle: String(item?.handle || '').trim(),
    city: String(item?.city || '').trim() || 'Brasil',
    audience: Number(item?.audience || 0),
    tier: item?.tier || 'genese',
    status: item?.status || 'active',
    color: item?.color || '#8B4AFF',
    initials: String(item?.initials || '')
      .trim()
      .toUpperCase()
      .slice(0, 3) || 'GT',
    avatarUrl: String(item?.avatarUrl || '').trim(),
    affiliateCode: normalizeAmbassadorToken(item?.affiliateCode || token).replace(/-/g, ''),
    commissionPercent: Number(item?.commissionPercent ?? 20),
    storefrontTitle: String(item?.storefrontTitle || '').trim() || 'Vitrine Gatedo',
    storefrontIntro: String(item?.storefrontIntro || '').trim() || 'Curadoria de produtos e ofertas para tutores de gatos.',
    headline: String(item?.headline || '').trim() || 'Um convite exclusivo para construir o Gatedo com a gente.',
    videoUrl: String(item?.videoUrl || '').trim(),
    customMessage: String(item?.customMessage || '').trim() || '',
    highlights: Array.isArray(item?.highlights)
      ? item.highlights.map((h) => String(h).trim()).filter(Boolean).slice(0, 6)
      : [],
    createdAt: item?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function readStoredAmbassadors() {
  if (typeof window === 'undefined') return seedAmbassadors;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) return parsed.map(cleanAmbassador);
  } catch {}
  return seedAmbassadors.map(cleanAmbassador);
}

function writeStoredAmbassadors(items) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(cleanAmbassador)));
  window.dispatchEvent(new CustomEvent(AMBASSADOR_UPDATED_EVENT));
}

export function getAmbassadors() {
  return readStoredAmbassadors();
}

export function getAmbassadorByToken(token) {
  const normalized = normalizeAmbassadorToken(token);
  return getAmbassadors().find((item) => item.token === normalized && item.status !== 'inactive') || null;
}

export function saveAmbassador(data) {
  const next = cleanAmbassador(data);
  const list = getAmbassadors();
  const exists = list.some((item) => item.token === next.token);
  const updated = exists ? list.map((item) => (item.token === next.token ? { ...item, ...next } : item)) : [next, ...list];
  writeStoredAmbassadors(updated);
  return next;
}

export function deleteAmbassador(token) {
  writeStoredAmbassadors(getAmbassadors().filter((item) => item.token !== normalizeAmbassadorToken(token)));
}

export function setAmbassadorAttribution(profile) {
  if (typeof window === 'undefined' || !profile?.token) return;
  const payload = {
    token: profile.token,
    name: profile.name,
    handle: profile.handle,
    affiliateCode: profile.affiliateCode,
    storefrontTitle: profile.storefrontTitle,
    storefrontIntro: profile.storefrontIntro,
    color: profile.color,
    avatarUrl: profile.avatarUrl,
    savedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(payload));
}

export function getAmbassadorAttribution() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function buildAmbassadorLinks(token, origin = '') {
  const safeToken = normalizeAmbassadorToken(token);
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return {
    portal: `${base}/embaixadoras/${safeToken}`,
    store: `${base}/store?amb=${safeToken}`,
    register: `${base}/register?amb=${safeToken}`,
  };
}
