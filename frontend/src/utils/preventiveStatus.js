// utils/preventiveStatus.js
// Mesma régua de status usada na aba Imunização do perfil do gato
// (vencido / vence em Xd / em dia), extraída pra ser reaproveitada
// pela aba Saúde global.

export function daysUntil(date) {
  if (!date) return null;
  try {
    const now = new Date();
    const target = new Date(date);
    const diff = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
    return Math.round(diff / 86400000);
  } catch {
    return null;
  }
}

export function getPreventiveStatus(days) {
  if (days === null) {
    return { label: 'Sem próxima data', color: '#6B7280', bg: '#F9FAFB', border: '#F3F4F6' };
  }
  if (days < 0) {
    return { label: `Vencido há ${Math.abs(days)}d`, color: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' };
  }
  if (days === 0) {
    return { label: 'Vence hoje', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
  }
  if (days <= 30) {
    return { label: `Vence em ${days}d`, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
  }
  return { label: `Em dia · ${days}d`, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' };
}
