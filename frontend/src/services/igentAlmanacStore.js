import rawAlmanac from '../data/almanaqueFelinoCompleto.md?raw';
import api from './api';

const STORAGE_KEY = 'gatedo_igent_almanac_sections_v1';
const VISUAL_STORAGE_KEY = 'gatedo_igent_visual_atlas_sections_v1';
export const IGENT_ALMANAC_SCOPE = 'IGENT_FELINE_ALMANAC';
export const IGENT_VISUAL_ATLAS_SCOPE = 'IGENT_VISUAL_ATLAS';

const visualAtlasSeed = [
  {
    id: 'visual-olho-opacidade-secrecao',
    slug: 'visual-olho-opacidade-secrecao',
    title: 'Olhos: opacidade, secrecao e alteracao de cornea',
    tags: 'visual, olho, cornea, opacidade, secrecao, ulcera, herpesvirus, persa',
    active: true,
    status: 'PUBLISHED',
    referenceImages: [],
    excerpt: 'Padroes visuais para olho opaco, secrecao, dor ocular, alteracao de cornea e red flags oftalmologicas.',
    content: 'Achados: opacidade de cornea, olho azulado/esbranquicado, secrecao transparente/amarela/esverdeada, olho semicerrado, edema, vermelhidao, terceira palpebra ou assimetria. Diferenciais possiveis: conjuntivite, ceratite, ulcera de cornea, sequestro corneal, trauma, uveite/glaucoma se houver dor/pupila alterada. Red flags: olho fechado, dor, opacidade, secrecao purulenta, trauma, sangue ou perda visual. Perguntas: tempo, um ou dois olhos, cor da secrecao, esfrega o rosto, historico de herpes, apetite e caixinha.',
  },
  {
    id: 'visual-pele-alergia-coceira',
    slug: 'visual-pele-alergia-coceira',
    title: 'Pele: alergia, vermelhidao, lambedura e coceira',
    tags: 'visual, pele, alergia, dermatite, coceira, lambedura, vermelhidao, pulga',
    active: true,
    status: 'PUBLISHED',
    referenceImages: [],
    excerpt: 'Padroes visuais para dermatites, alergias, lambedura, prurido, descamacao e lesoes superficiais.',
    content: 'Achados: vermelhidao, crostas, descamacao, falhas de pelo, umidade por lambedura, sujidade de pulga, lesao localizada ou simetrica. Diferenciais: alergia a pulgas, alergia alimentar/ambiental, dermatofitose, acne felina, dermatite por contato, automutilacao por prurido. Red flags: pus, mau cheiro, dor intensa, febre, apatia, lesao proxima aos olhos ou crescimento rapido. Perguntas: coça/lambe, mudou racao/areia/produtos, pulgas, outros animais ou pessoas com lesoes, local e evolucao.',
  },
  {
    id: 'visual-alopecia-falha-pelo',
    slug: 'visual-alopecia-falha-pelo',
    title: 'Pelo: alopecia, falhas e queda localizada',
    tags: 'visual, pelo, alopecia, falha, queda, lambedura, fungo, estresse',
    active: true,
    status: 'PUBLISHED',
    referenceImages: [],
    excerpt: 'Padroes para falhas de pelo, alopecia circular, pelo quebrado, lambedura e possiveis fungos.',
    content: 'Achados: falha circular, borda descamativa, pele normal sem inflamacao, pelo quebrado, distribuicao em barriga/flancos ou area localizada. Diferenciais: dermatofitose, alopecia por lambedura, alergia, ectoparasitas, dor local, estresse ambiental. Red flags: lesao circular contagiosa em casa, ferida aberta, pus, dor, perda de peso ou progressao rapida. Perguntas: lambe a area, coça, tem descamacao, pessoas/animais com manchas, mudou rotina, dor ao tocar.',
  },
  {
    id: 'visual-ferida-crosta-pus',
    slug: 'visual-ferida-crosta-pus',
    title: 'Feridas: crostas, pus, abscesso e trauma',
    tags: 'visual, ferida, crosta, pus, abscesso, trauma, mordida, sangramento',
    active: true,
    status: 'PUBLISHED',
    referenceImages: [],
    excerpt: 'Padroes para feridas, crostas, pus, mordidas, abscessos, trauma e sinais de urgencia.',
    content: 'Achados: corte, crosta, secrecao, pus, inchaco, abscesso, mordida, sangramento, bordas inflamadas, necrose. Diferenciais: trauma, briga, abscesso, corpo estranho, infeccao secundaria. Red flags: pus, mau cheiro, necrose, ferida profunda, sangramento ativo, dor forte, febre, apatia, proximo a olho/boca/genital, nao come. Perguntas: saiu para rua, brigou, lambe/morde, secrecao com cor/cheiro, quando comecou, vacinas.',
  },
  {
    id: 'visual-boca-gengiva-dente',
    slug: 'visual-boca-gengiva-dente',
    title: 'Boca: gengiva, dentes, salivacao e lesoes orais',
    tags: 'visual, boca, gengiva, dente, salivacao, ulcera, estomatite',
    active: true,
    status: 'PUBLISHED',
    referenceImages: [],
    excerpt: 'Padroes visuais para gengiva inflamada, dente, ulcera, salivacao e dor oral.',
    content: 'Achados: gengiva vermelha, tartaro, dente fraturado, ulcera, massa, sangramento, saliva espessa, assimetria facial. Diferenciais: gengivite, periodontite, estomatite felina, ulcera oral, trauma, lesao reabsortiva. Red flags: nao consegue comer, salivacao intensa, sangramento, dor, massa, apatia. Perguntas: deixa cair comida, baba, esfrega a boca, perda de peso, halito, vacinas/retroviroses.',
  },
  {
    id: 'visual-ouvido-cera-inflamacao',
    slug: 'visual-ouvido-cera-inflamacao',
    title: 'Ouvidos: cera escura, vermelhidao e prurido',
    tags: 'visual, ouvido, orelha, cera, otite, acaro, coceira',
    active: true,
    status: 'PUBLISHED',
    referenceImages: [],
    excerpt: 'Padroes para ouvido com cera, vermelhidao, coceira, acaros, otite e dor.',
    content: 'Achados: cera escura/amarela, vermelhidao do conduto, crostas na borda, feridas por arranhadura, odor, cabeca inclinada. Diferenciais: acaros, otite externa, alergia, corpo estranho, trauma. Red flags: dor intensa, cabeca inclinada, perda de equilibrio, pus, mau cheiro, sangramento, apatia. Perguntas: sacode a cabeca, coça, odor, um ouvido ou dois, outros gatos com coceira.',
  },
];

function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseMarkdownSections(markdown = '') {
  const lines = String(markdown || '').split(/\r?\n/);
  const sections = [];
  let current = null;

  lines.forEach((line) => {
    const match = /^(#{1,4})\s+(.+)$/.exec(line);
    if (match) {
      if (current?.content?.trim()) sections.push(current);
      const level = match[1].length;
      const title = cleanText(match[2].replace(/[#*_`]/g, ''));
      current = {
        id: title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        title,
        level,
        tags: title.toLowerCase(),
        active: true,
        content: '',
      };
      return;
    }
    if (current) current.content += `${line}\n`;
  });

  if (current?.content?.trim()) sections.push(current);

  return sections
    .filter((section) => section.level <= 3 && section.content.trim().length > 80)
    .map((section) => ({
      ...section,
      excerpt: cleanText(section.content).slice(0, 420),
    }));
}

const seedSections = parseMarkdownSections(rawAlmanac);
const scopedSeeds = {
  [IGENT_ALMANAC_SCOPE]: seedSections,
  [IGENT_VISUAL_ATLAS_SCOPE]: visualAtlasSeed,
};
const scopedStorage = {
  [IGENT_ALMANAC_SCOPE]: STORAGE_KEY,
  [IGENT_VISUAL_ATLAS_SCOPE]: VISUAL_STORAGE_KEY,
};
const scopedCache = {};

function normalizeScope(scope = IGENT_ALMANAC_SCOPE) {
  return scope === IGENT_VISUAL_ATLAS_SCOPE ? IGENT_VISUAL_ATLAS_SCOPE : IGENT_ALMANAC_SCOPE;
}

function mapRemoteSection(section) {
  const metadata = section.metadata && typeof section.metadata === 'object' ? section.metadata : {};
  return {
    id: section.slug || section.id,
    dbId: section.id,
    slug: section.slug,
    title: section.title,
    level: section.level || 2,
    tags: Array.isArray(section.tags) ? section.tags.join(', ') : section.tags || '',
    active: section.active,
    status: section.status || 'PUBLISHED',
    version: section.version || 1,
    reviewedBy: section.reviewedBy,
    reviewedAt: section.reviewedAt,
    publishedAt: section.publishedAt,
    metadata,
    referenceImages: Array.isArray(metadata.referenceImages) ? metadata.referenceImages : [],
    content: section.content,
    excerpt: section.excerpt || cleanText(section.content).slice(0, 420),
  };
}

export function getIgentAlmanacSections(scope = IGENT_ALMANAC_SCOPE) {
  const targetScope = normalizeScope(scope);
  if (Array.isArray(scopedCache[targetScope]) && scopedCache[targetScope].length) return scopedCache[targetScope];
  try {
    const saved = JSON.parse(localStorage.getItem(scopedStorage[targetScope]) || 'null');
    if (Array.isArray(saved) && saved.length) {
      scopedCache[targetScope] = saved;
      return saved;
    }
  } catch {}
  scopedCache[targetScope] = scopedSeeds[targetScope];
  return scopedSeeds[targetScope];
}

export function saveIgentAlmanacSections(sections = [], scope = IGENT_ALMANAC_SCOPE) {
  const targetScope = normalizeScope(scope);
  scopedCache[targetScope] = sections;
  localStorage.setItem(scopedStorage[targetScope], JSON.stringify(sections));
  return sections;
}

export function resetIgentAlmanacSections(scope = IGENT_ALMANAC_SCOPE) {
  const targetScope = normalizeScope(scope);
  localStorage.removeItem(scopedStorage[targetScope]);
  scopedCache[targetScope] = scopedSeeds[targetScope];
  return scopedSeeds[targetScope];
}

export async function fetchIgentAlmanacSections(scope = IGENT_ALMANAC_SCOPE) {
  const targetScope = normalizeScope(scope);
  const { data } = await api.get('/admin/igent-almanac', { params: { scope: targetScope } });
  const sections = Array.isArray(data) ? data.map(mapRemoteSection) : [];
  if (sections.length) saveIgentAlmanacSections(sections, targetScope);
  return sections.length ? sections : getIgentAlmanacSections(targetScope);
}

export async function persistIgentAlmanacSections(sections = [], actor = 'admin', scope = IGENT_ALMANAC_SCOPE) {
  const targetScope = normalizeScope(scope);
  const payload = sections.map((section) => ({
    slug: section.slug || section.id,
    title: section.title,
    content: section.content,
    excerpt: section.excerpt,
    tags: Array.isArray(section.tags)
      ? section.tags
      : String(section.tags || '').split(/[,;\s]+/).filter(Boolean),
    active: section.active !== false,
    status: section.status || 'PUBLISHED',
    metadata: {
      ...(section.metadata && typeof section.metadata === 'object' ? section.metadata : {}),
      referenceImages: Array.isArray(section.referenceImages) ? section.referenceImages : [],
    },
    referenceImages: Array.isArray(section.referenceImages) ? section.referenceImages : [],
  }));
  const { data } = await api.put('/admin/igent-almanac', { sections: payload, actor, scope: targetScope });
  saveIgentAlmanacSections(Array.isArray(data) ? data.map(mapRemoteSection) : sections, targetScope);
  return getIgentAlmanacSections(targetScope);
}

export async function resetIgentAlmanacOnServer(actor = 'admin', scope = IGENT_ALMANAC_SCOPE) {
  const targetScope = normalizeScope(scope);
  const { data } = await api.post('/admin/igent-almanac/reset', { actor, scope: targetScope });
  const sections = Array.isArray(data) ? data.map(mapRemoteSection) : resetIgentAlmanacSections(targetScope);
  saveIgentAlmanacSections(sections, targetScope);
  return sections;
}

export async function syncIgentAlmanacFromApi(scope = IGENT_ALMANAC_SCOPE) {
  try {
    return await fetchIgentAlmanacSections(scope);
  } catch {
    return getIgentAlmanacSections(scope);
  }
}

export function buildIgentAlmanacContext({ symptom = '', breed = '', visualFindings = '', limit = 5, scope = IGENT_ALMANAC_SCOPE } = {}) {
  const targetScope = normalizeScope(scope);
  const needle = `${symptom} ${breed} ${visualFindings}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const keywords = needle
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length >= 4);

  const scored = getIgentAlmanacSections(targetScope)
    .filter((section) => section.active !== false)
    .map((section) => {
      const haystack = `${section.title} ${section.tags || ''} ${section.content}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const score = keywords.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0);
      const boosted =
        /red flag|urgencia|tox|doenca|raca|olho|pele|urin|digest|respirat|comport/i.test(haystack)
          ? score + 0.4
          : score;
      return { section, score: boosted };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ section }) => ({
    title: section.title,
    tags: section.tags,
    excerpt: cleanText(section.content).slice(0, 900),
    referenceImages: Array.isArray(section.referenceImages) ? section.referenceImages.slice(0, 4) : [],
  }));
}

export const IGENT_ALMANAC_SEED_COUNT = seedSections.length;
export const IGENT_VISUAL_ATLAS_SEED_COUNT = visualAtlasSeed.length;
