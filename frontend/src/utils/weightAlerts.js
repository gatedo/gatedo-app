// utils/weightAlerts.js
// Extração de série de peso e leitura de padrão (regras fixas, sem IA) —
// compartilhado entre a Linha do tempo e a Home ("O que precisa de você hoje").

const WEIGHT_CHECKIN_RE = /check-in de peso[:\s]*([\d.,]+)\s*kg/i;

export function extractWeightSeries(healthRecords = []) {
  return (healthRecords || [])
    .filter((r) => r?.type === 'EXAM' && WEIGHT_CHECKIN_RE.test(r.title || ''))
    .map((r) => {
      const match = r.title.match(WEIGHT_CHECKIN_RE);
      const weight = parseFloat(String(match?.[1] || '').replace(',', '.'));
      return { id: r.id, date: new Date(r.date), weight };
    })
    .filter((p) => Number.isFinite(p.weight) && p.weight > 0)
    .sort((a, b) => a.date - b.date);
}

function formatMonthLabel(d) {
  return d.toLocaleDateString('pt-BR', { month: 'long' });
}

// ─── Regras fixas de leitura de padrão (sem IA) ─────────────────────────────
export function computeWeightAlerts(series) {
  if (series.length < 2) return [];

  const latest = series[series.length - 1];
  const alerts = [];

  const baselineWithin = (days) => {
    const cutoff = new Date(latest.date.getTime() - days * 86400000);
    const candidates = series.filter((p) => p.date >= cutoff && p.date < latest.date);
    return candidates[0] || null;
  };

  const pctChange = (base) => ((latest.weight - base.weight) / base.weight) * 100;

  const b90 = baselineWithin(90);
  const b180 = baselineWithin(180);

  let dropped = false;
  if (b90) {
    const pct = pctChange(b90);
    if (pct <= -5) {
      alerts.push({
        type: 'drop',
        rule: 'Queda de 5% ou mais em 90 dias',
        message: `O peso caiu ${Math.abs(pct).toFixed(0)}% desde ${formatMonthLabel(b90.date)}.`,
      });
      dropped = true;
    }
  }
  if (!dropped && b180) {
    const pct = pctChange(b180);
    if (pct <= -8) {
      alerts.push({
        type: 'drop',
        rule: 'Queda de 8% ou mais em 180 dias',
        message: `O peso caiu ${Math.abs(pct).toFixed(0)}% desde ${formatMonthLabel(b180.date)}.`,
      });
    }
  }
  if (b180) {
    const pct = pctChange(b180);
    if (pct >= 15) {
      alerts.push({
        type: 'rise',
        rule: 'Alta de 15% ou mais em 180 dias',
        message: `O peso subiu ${pct.toFixed(0)}% desde ${formatMonthLabel(b180.date)}.`,
      });
    }
  }

  return alerts;
}

export function daysSinceLastWeight(healthRecords = []) {
  const series = extractWeightSeries(healthRecords);
  if (series.length === 0) return null;
  const last = series[series.length - 1];
  return Math.floor((Date.now() - last.date.getTime()) / 86400000);
}
