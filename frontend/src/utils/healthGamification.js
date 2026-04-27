import api from '../services/api';

/**
 * Award resiliente para ações de saúde.
 * Tenta mais de um endpoint sem quebrar a UI.
 * Se nenhum existir ainda no backend, falha silenciosamente.
 */
export async function awardHealthXP({
  userId,
  petId,
  action,
  amount = 5,
  meta = {},
}) {
  if (!userId) return false;

  const payload = {
    userId,
    petId,
    action,
    amount,
    category: 'health',
    source: 'gatedo-health-layer',
    meta,
  };

  const attempts = [
    () => api.post('/gamification/events', payload),
    () => api.post('/gamification/award', payload),
    () => api.post('/gamification/xp', payload),
  ];

  for (const attempt of attempts) {
    try {
      await attempt();
      window.dispatchEvent(
        new CustomEvent('gatedo-gamification-refresh', {
          detail: { userId, petId, action, amount },
        })
      );
      return true;
    } catch (_) {}
  }

  return false;
}