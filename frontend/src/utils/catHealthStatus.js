// utils/catHealthStatus.js
// Classificação de 3 estados (em dia / atenção / urgente) a partir do mesmo
// score do Painel Preditivo — usado no ponto de status da Home e no
// semáforo geral da aba Saúde.

import { normalizeHealthHistory } from './healthHistoryAdapter';
import { calculateHealthScore } from './healthScore';

export function getCatHealthStatus(cat) {
  const { score } = calculateHealthScore(normalizeHealthHistory(cat));
  if (score >= 75) return { score, tone: '#10B981', label: 'Em dia' };
  if (score >= 45) return { score, tone: '#F59E0B', label: 'Atenção' };
  return { score, tone: '#EF4444', label: 'Urgente' };
}
