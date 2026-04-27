// src/config/catThemes.js

export const CAT_THEMES = [
  { id: 'violet',   label: 'Violeta',   fromHex: '#8b4aff', toHex: '#5b329c', back: '#EDE9FE', accent: '#DFFF40' },
  { id: 'rose',     label: 'Rosa',      fromHex: '#fa9fc5', toHex: '#C94B7B', back: '#FFF0F5', accent: '#FFD6E7' },
  { id: 'mint',     label: 'Menta',     fromHex: '#2ECC71', toHex: '#1A9E55', back: '#F0FFF4', accent: '#ADFFCE' },
  { id: 'ocean',    label: 'Oceano',    fromHex: '#60cdff', toHex: '#007dc0', back: '#F0F9FF', accent: '#BAE6FD' },
  { id: 'sunset',   label: 'Sunset',    fromHex: '#ff9d56', toHex: '#ff5d1c', back: '#FFF7ED', accent: '#FED7AA' },
  { id: 'galaxy',   label: 'Galáxia',   fromHex: '#312E81', toHex: '#1E1B4B', back: '#EDE9FE', accent: '#C4B5FD' },
  { id: 'cherry',   label: 'Cereja',    fromHex: '#E11D48', toHex: '#9F1239', back: '#FFF1F2', accent: '#FECDD3' },
  { id: 'forest',   label: 'Floresta',  fromHex: '#166534', toHex: '#14532D', back: '#F0FDF4', accent: '#BBF7D0' },
  { id: 'gold',     label: 'Dourado',   fromHex: '#D97706', toHex: '#92400E', back: '#FFFBEB', accent: '#FDE68A' },
  { id: 'slate',    label: 'Chumbo',    fromHex: '#475569', toHex: '#1E293B', back: '#F8FAFC', accent: '#CBD5E1' },
  { id: 'coral',    label: 'Coral',     fromHex: '#FF6B6B', toHex: '#CC3333', back: '#FFF5F5', accent: '#FFD0D0' },
  { id: 'arctic',   label: 'Ártico',    fromHex: '#A8EDEA', toHex: '#4EC5C1', back: '#F0FFFE', accent: '#FFFFFF' },
  { id: 'neon',     label: 'Neon',      fromHex: '#39FF14', toHex: '#00B300', back: '#F0FFF0', accent: '#CCFF99' },
  { id: 'bronze',   label: 'Bronze',    fromHex: '#ca8b62', toHex: '#88532d', back: '#FDF6EC', accent: '#F5DEB3' },
  { id: 'lavender', label: 'Lavanda',   fromHex: '#caa1ff', toHex: '#9874fc', back: '#F5F0FF', accent: '#E9D5FF' },
  { id: 'teal',     label: 'Teal',      fromHex: '#14B8A6', toHex: '#0F766E', back: '#F0FDFA', accent: '#99F6E4' },
  { id: 'crimson',  label: 'Carmesim',  fromHex: '#DC143C', toHex: '#8B0000', back: '#FFF0F0', accent: '#FFB3C1' },
  { id: 'night',    label: 'Noturno',   fromHex: '#1a1a2e', toHex: '#0d0d1a', back: '#F0F0F8', accent: '#818CF8' },
];

export function getDefaultCatTheme() {
  return CAT_THEMES[0];
}

export function resolveCatTheme(themeColor) {
  if (!themeColor) return getDefaultCatTheme();

  const byId = CAT_THEMES.find(t => t.id === themeColor);
  if (byId) return byId;

  if (typeof themeColor === 'string' && themeColor.startsWith('#')) {
    return {
      ...getDefaultCatTheme(),
      id: 'legacy-hex',
      fromHex: themeColor,
      toHex: themeColor,
    };
  }

  return getDefaultCatTheme();
}

export function resolveCatThemeHex(themeColor) {
  return resolveCatTheme(themeColor).fromHex;
}

export function toTailwindFrontGradient(themeColor) {
  const theme = resolveCatTheme(themeColor);
  return {
    background: `linear-gradient(135deg, ${theme.fromHex}, ${theme.toHex})`,
  };
}