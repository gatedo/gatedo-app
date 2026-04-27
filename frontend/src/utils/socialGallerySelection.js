const STORAGE_PREFIX = 'gatedo_social_gallery_';

function normalizeUrls(urls) {
  if (!Array.isArray(urls)) return [];

  return [...new Set(
    urls
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean)
  )];
}

function storageKey(petId) {
  return `${STORAGE_PREFIX}${petId}`;
}

export function readSocialGallerySelection(petId) {
  if (!petId || typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(storageKey(petId));
    return normalizeUrls(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export function saveSocialGallerySelection(petId, urls) {
  const next = normalizeUrls(urls);

  if (!petId || typeof window === 'undefined') return next;

  try {
    window.localStorage.setItem(storageKey(petId), JSON.stringify(next));
  } catch {
    // leitura local apenas; se falhar, seguimos sem persistência
  }

  return next;
}

export function pruneSocialGallerySelection(petId, availableUrls = []) {
  const allowed = new Set(normalizeUrls(availableUrls));
  const next = readSocialGallerySelection(petId).filter((url) => allowed.has(url));
  return saveSocialGallerySelection(petId, next);
}

export function toggleSocialGallerySelection(petId, url) {
  if (!url) return readSocialGallerySelection(petId);

  const current = readSocialGallerySelection(petId);
  const next = current.includes(url)
    ? current.filter((item) => item !== url)
    : [...current, url];

  return saveSocialGallerySelection(petId, next);
}
