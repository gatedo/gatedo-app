import { defaultSrdProfiles } from '../data/srdProfiles';
import { createBreedSlug } from './breedContentStore';

export const SRD_CONTENT_STORAGE_KEY = 'gatedo_srd_content_v1';
export const SRD_UPDATED_EVENT = 'gatedo:srd-updated';

const defaultById = new Map(defaultSrdProfiles.map((profile) => [profile.id, profile]));

function normalizeTraits(traits) {
  if (Array.isArray(traits)) return traits.map((trait) => String(trait).trim()).filter(Boolean);
  return String(traits || '')
    .split(',')
    .map((trait) => trait.trim())
    .filter(Boolean);
}

export function normalizeSrdProfile(input = {}, fallback = {}) {
  const merged = { ...fallback, ...input };
  const id = createBreedSlug(merged.id || merged.name);

  return {
    id,
    name: String(merged.name || fallback.name || 'Novo SRD').trim(),
    coat: ['curta', 'media', 'longa', 'mista'].includes(merged.coat) ? merged.coat : fallback.coat || 'curta',
    pattern: String(merged.pattern || fallback.pattern || '').trim(),
    colorClass: String(merged.colorClass || fallback.colorClass || 'bg-gray-700 text-white').trim(),
    desc: String(merged.desc || fallback.desc || '').trim(),
    traits: normalizeTraits(merged.traits || fallback.traits),
    care: String(merged.care || fallback.care || '').trim(),
    img: String(merged.img || fallback.img || '').trim(),
    order: Number(merged.order ?? fallback.order ?? 999),
    published: merged.published !== false,
    archived: merged.archived === true,
    updatedAt: merged.updatedAt || fallback.updatedAt || null,
  };
}

function readCustomProfiles() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(SRD_CONTENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler perfis SRD:', error);
    return [];
  }
}

function writeCustomProfiles(profiles) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SRD_CONTENT_STORAGE_KEY, JSON.stringify(profiles));
  window.dispatchEvent(new Event(SRD_UPDATED_EVENT));
}

export function getAdminSrdProfiles() {
  const map = new Map(defaultSrdProfiles.map((profile) => [profile.id, normalizeSrdProfile(profile)]));

  readCustomProfiles().forEach((profile) => {
    const id = createBreedSlug(profile.id || profile.name);
    map.set(id, normalizeSrdProfile({ ...profile, id }, map.get(id)));
  });

  return Array.from(map.values()).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function getSrdProfiles() {
  return getAdminSrdProfiles().filter((profile) => profile.published && !profile.archived);
}

export function getSrdProfileById(id) {
  const slug = createBreedSlug(id);
  return getSrdProfiles().find((profile) => profile.id === slug) || null;
}

export function saveSrdProfile(input) {
  const fallback = defaultById.get(createBreedSlug(input.id || input.name)) || {};
  const nextProfile = normalizeSrdProfile({ ...input, updatedAt: new Date().toISOString() }, fallback);
  const current = readCustomProfiles();
  const index = current.findIndex((profile) => createBreedSlug(profile.id || profile.name) === nextProfile.id);

  if (index >= 0) current[index] = nextProfile;
  else current.push(nextProfile);

  writeCustomProfiles(current);
  return nextProfile;
}

export function archiveSrdProfile(id) {
  const slug = createBreedSlug(id);
  const current = readCustomProfiles();
  const index = current.findIndex((profile) => createBreedSlug(profile.id || profile.name) === slug);
  const fallback = defaultById.get(slug);

  if (index >= 0) current[index] = normalizeSrdProfile({ ...current[index], archived: true, published: false }, fallback);
  else if (fallback) current.push(normalizeSrdProfile({ ...fallback, archived: true, published: false }, fallback));

  writeCustomProfiles(current);
}

export function resetSrdProfile(id) {
  const slug = createBreedSlug(id);
  writeCustomProfiles(readCustomProfiles().filter((profile) => createBreedSlug(profile.id || profile.name) !== slug));
}
