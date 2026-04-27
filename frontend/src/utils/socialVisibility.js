export const SOCIAL_VISIBILITY = {
  PRIVATE: 'PRIVATE',
  FOLLOWERS: 'FOLLOWERS',
  PUBLIC: 'PUBLIC',
};

export function normalizeVisibility(value) {
  if (!value) return SOCIAL_VISIBILITY.PUBLIC;
  const upper = String(value).toUpperCase();
  if (upper.includes('FOLLOW')) return SOCIAL_VISIBILITY.FOLLOWERS;
  if (upper.includes('PRIVATE')) return SOCIAL_VISIBILITY.PRIVATE;
  return SOCIAL_VISIBILITY.PUBLIC;
}

export function visibilityLabel(value) {
  const normalized = normalizeVisibility(value);
  if (normalized === SOCIAL_VISIBILITY.PRIVATE) return 'Privado';
  if (normalized === SOCIAL_VISIBILITY.FOLLOWERS) return 'Seguidores';
  return 'Público';
}

export function visibilityDescription(value) {
  const normalized = normalizeVisibility(value);
  if (normalized === SOCIAL_VISIBILITY.PRIVATE) return 'Visível apenas para você';
  if (normalized === SOCIAL_VISIBILITY.FOLLOWERS) return 'Visível apenas para seguidores';
  return 'Visível para toda a comunidade';
}
