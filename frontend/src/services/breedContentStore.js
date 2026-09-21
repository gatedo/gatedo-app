import { defaultBreedCatalog } from '../data/breeds';

export const BREED_CONTENT_STORAGE_KEY = 'gatedo_breed_content_v1';
export const BREEDS_UPDATED_EVENT = 'gatedo:breeds-updated';

const defaultById = new Map(defaultBreedCatalog.map((breed) => [breed.id, breed]));

export function createBreedSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `raca_${Date.now()}`;
}

function clampStat(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function normalizeBreed(input = {}, fallback = {}) {
  const merged = { ...fallback, ...input };
  const id = createBreedSlug(merged.id || merged.name);

  return {
    id,
    name: String(merged.name || fallback.name || 'Nova raca').trim(),
    type: ['curta', 'media', 'longa'].includes(merged.type) ? merged.type : fallback.type || 'curta',
    img: String(merged.img || merged.imageUrl || fallback.img || '').trim(),
    tagline: String(merged.tagline || fallback.tagline || '').trim(),
    desc: String(merged.desc || merged.content || fallback.desc || '').trim(),
    specs: {
      origin: String(merged.specs?.origin || merged.origin || fallback.specs?.origin || '').trim(),
      life: String(merged.specs?.life || merged.life || fallback.specs?.life || '').trim(),
      weight: String(merged.specs?.weight || merged.weight || fallback.specs?.weight || '').trim(),
    },
    stats: {
      energy: clampStat(merged.stats?.energy ?? merged.energy ?? fallback.stats?.energy ?? 50),
      affection: clampStat(merged.stats?.affection ?? merged.affection ?? fallback.stats?.affection ?? 50),
      shedding: clampStat(merged.stats?.shedding ?? merged.shedding ?? fallback.stats?.shedding ?? 50),
      intelligence: clampStat(merged.stats?.intelligence ?? merged.intelligence ?? fallback.stats?.intelligence ?? 50),
    },
    tags: normalizeTags(merged.tags || fallback.tags),
    order: Number(merged.order ?? fallback.order ?? 999),
    published: merged.published !== false,
    archived: merged.archived === true,
    updatedAt: merged.updatedAt || fallback.updatedAt || null,
  };
}

function readCustomBreeds() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(BREED_CONTENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler catalogo de racas:', error);
    return [];
  }
}

function writeCustomBreeds(breeds) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BREED_CONTENT_STORAGE_KEY, JSON.stringify(breeds));
  window.dispatchEvent(new Event(BREEDS_UPDATED_EVENT));
}

export function getAdminBreedCatalog() {
  const map = new Map(defaultBreedCatalog.map((breed) => [breed.id, normalizeBreed(breed)]));

  readCustomBreeds().forEach((breed) => {
    const id = createBreedSlug(breed.id || breed.name);
    map.set(id, normalizeBreed({ ...breed, id }, map.get(id)));
  });

  return Array.from(map.values()).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function getBreedCatalog() {
  return getAdminBreedCatalog().filter((breed) => breed.published && !breed.archived);
}

export function getBreedById(id) {
  const slug = createBreedSlug(id);
  return getBreedCatalog().find((breed) => breed.id === slug) || null;
}

export function saveBreedContent(input) {
  const fallback = defaultById.get(createBreedSlug(input.id || input.name)) || {};
  const nextBreed = normalizeBreed({ ...input, updatedAt: new Date().toISOString() }, fallback);
  const current = readCustomBreeds();
  const index = current.findIndex((breed) => createBreedSlug(breed.id || breed.name) === nextBreed.id);

  if (index >= 0) current[index] = nextBreed;
  else current.push(nextBreed);

  writeCustomBreeds(current);
  return nextBreed;
}

export function archiveBreedContent(id) {
  const slug = createBreedSlug(id);
  const current = readCustomBreeds();
  const index = current.findIndex((breed) => createBreedSlug(breed.id || breed.name) === slug);
  const fallback = defaultById.get(slug);

  if (index >= 0) current[index] = normalizeBreed({ ...current[index], archived: true, published: false }, fallback);
  else if (fallback) current.push(normalizeBreed({ ...fallback, archived: true, published: false }, fallback));

  writeCustomBreeds(current);
}

export function resetBreedContent(id) {
  const slug = createBreedSlug(id);
  const current = readCustomBreeds().filter((breed) => createBreedSlug(breed.id || breed.name) !== slug);
  writeCustomBreeds(current);
}
