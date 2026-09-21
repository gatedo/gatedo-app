import { defaultWildFelines } from '../data/wildFelines';
import { createBreedSlug } from './breedContentStore';

export const WILD_FELINE_STORAGE_KEY = 'gatedo_wild_felines_v1';
export const WILD_FELINES_UPDATED_EVENT = 'gatedo:wild-felines-updated';

const defaultById = new Map(defaultWildFelines.map((item) => [item.id, item]));

function listFromValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function normalizeWildFeline(input = {}, fallback = {}) {
  const merged = { ...fallback, ...input };
  const id = createBreedSlug(merged.id || merged.name);

  return {
    id,
    name: String(merged.name || fallback.name || 'Novo felino').trim(),
    scientificName: String(merged.scientificName || fallback.scientificName || '').trim(),
    region: String(merged.region || fallback.region || '').trim(),
    countries: String(merged.countries || fallback.countries || '').trim(),
    habitat: String(merged.habitat || fallback.habitat || '').trim(),
    status: String(merged.status || fallback.status || 'DD').trim(),
    population: String(merged.population || fallback.population || '').trim(),
    trend: String(merged.trend || fallback.trend || '').trim(),
    weight: String(merged.weight || fallback.weight || '').trim(),
    length: String(merged.length || fallback.length || '').trim(),
    diet: String(merged.diet || fallback.diet || '').trim(),
    threats: String(merged.threats || fallback.threats || '').trim(),
    conservation: String(merged.conservation || fallback.conservation || '').trim(),
    desc: String(merged.desc || fallback.desc || '').trim(),
    facts: listFromValue(merged.facts || fallback.facts),
    img: String(merged.img || fallback.img || '').trim(),
    order: Number(merged.order ?? fallback.order ?? 999),
    published: merged.published !== false,
    archived: merged.archived === true,
    updatedAt: merged.updatedAt || fallback.updatedAt || null,
  };
}

function readCustomItems() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WILD_FELINE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler felinos selvagens:', error);
    return [];
  }
}

function writeCustomItems(items) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WILD_FELINE_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(WILD_FELINES_UPDATED_EVENT));
}

export function getAdminWildFelines() {
  const map = new Map(defaultWildFelines.map((item) => [item.id, normalizeWildFeline(item)]));
  readCustomItems().forEach((item) => {
    const id = createBreedSlug(item.id || item.name);
    map.set(id, normalizeWildFeline({ ...item, id }, map.get(id)));
  });
  return Array.from(map.values()).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function getWildFelines() {
  return getAdminWildFelines().filter((item) => item.published && !item.archived);
}

export function getWildFelineById(id) {
  const slug = createBreedSlug(id);
  return getWildFelines().find((item) => item.id === slug) || null;
}

export function saveWildFeline(input) {
  const fallback = defaultById.get(createBreedSlug(input.id || input.name)) || {};
  const nextItem = normalizeWildFeline({ ...input, updatedAt: new Date().toISOString() }, fallback);
  const current = readCustomItems();
  const index = current.findIndex((item) => createBreedSlug(item.id || item.name) === nextItem.id);
  if (index >= 0) current[index] = nextItem;
  else current.push(nextItem);
  writeCustomItems(current);
  return nextItem;
}

export function archiveWildFeline(id) {
  const slug = createBreedSlug(id);
  const current = readCustomItems();
  const index = current.findIndex((item) => createBreedSlug(item.id || item.name) === slug);
  const fallback = defaultById.get(slug);
  if (index >= 0) current[index] = normalizeWildFeline({ ...current[index], archived: true, published: false }, fallback);
  else if (fallback) current.push(normalizeWildFeline({ ...fallback, archived: true, published: false }, fallback));
  writeCustomItems(current);
}

export function resetWildFeline(id) {
  const slug = createBreedSlug(id);
  writeCustomItems(readCustomItems().filter((item) => createBreedSlug(item.id || item.name) !== slug));
}
