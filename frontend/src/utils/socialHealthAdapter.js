function formatDateLabel(dateInput) {
  if (!dateInput) return 'Recente';

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Recente';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function daysBetween(from, to) {
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

function getImmunizationItems(healthData, pet) {
  const raw =
    healthData?.immunizations ||
    healthData?.vaccines ||
    pet?.immunizations ||
    pet?.vaccines ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    const nextDueDate = item?.nextDueDate || item?.dueDate || null;
    const appliedAt = item?.appliedAt || item?.date || item?.createdAt || null;
    const name = item?.name || item?.title || 'Vacina';

    const diff = nextDueDate ? daysBetween(new Date(), nextDueDate) : null;

    let color = '#10B981';
    let icon = '💉';
    let event = `${name} aplicada`;

    if (diff !== null && diff < 0) {
      color = '#EF4444';
      icon = '⚠️';
      event = `${name} vencida`;
    } else if (diff !== null && diff <= 30) {
      color = '#F59E0B';
      icon = '🛡️';
      event = `${name} próxima do reforço`;
    }

    return {
      type: 'vaccine',
      icon,
      color,
      event,
      date: formatDateLabel(nextDueDate || appliedAt),
      rawDate: nextDueDate || appliedAt,
    };
  });
}

function getConsultationItems(healthData, pet) {
  const raw =
    healthData?.records ||
    healthData?.healthRecords ||
    pet?.healthRecords ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => {
      const type = String(item?.type || '').toUpperCase();
      return (
        type.includes('CONSULT') ||
        type.includes('CHECK') ||
        type.includes('EXAM') ||
        item?.title ||
        item?.description
      );
    })
    .slice(0, 5)
    .map((item) => ({
      type: 'consultation',
      icon: '🩺',
      color: '#0EA5E9',
      event: item?.title || item?.description || 'Consulta registrada',
      date: formatDateLabel(item?.date || item?.createdAt),
      rawDate: item?.date || item?.createdAt,
    }));
}

export function buildSocialHealthTimeline(healthData, pet = {}) {
  const immunizationItems = getImmunizationItems(healthData, pet);
  const consultationItems = getConsultationItems(healthData, pet);

  const merged = [...immunizationItems, ...consultationItems]
    .sort((a, b) => {
      const da = a?.rawDate ? new Date(a.rawDate).getTime() : 0;
      const db = b?.rawDate ? new Date(b.rawDate).getTime() : 0;
      return db - da;
    })
    .slice(0, 6);

  if (merged.length > 0) return merged;

  return [
    {
      type: 'status',
      icon: '🐾',
      color: '#8B4AFF',
      event: 'Perfil de saúde em construção',
      date: 'Sem eventos públicos ainda',
      rawDate: null,
    },
  ];
}

export function buildSocialHealthSummary(healthData, pet = {}) {
  const immunizations =
    healthData?.immunizations ||
    healthData?.vaccines ||
    pet?.immunizations ||
    pet?.vaccines ||
    [];

  const consultCount =
    (Array.isArray(healthData?.records) ? healthData.records.length : 0) ||
    (Array.isArray(healthData?.healthRecords) ? healthData.healthRecords.length : 0) ||
    pet?.consultCount ||
    0;

  let score =
    healthData?.healthScore ||
    healthData?.score ||
    pet?.healthScore ||
    98;

  if (typeof score !== 'number') score = 98;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let overdue = 0;
  let upcoming = 0;

  if (Array.isArray(immunizations)) {
    for (const item of immunizations) {
      const nextDueDate = item?.nextDueDate || item?.dueDate;
      const diff = nextDueDate ? daysBetween(new Date(), nextDueDate) : null;

      if (diff !== null && diff < 0) overdue += 1;
      else if (diff !== null && diff <= 30) upcoming += 1;
    }
  }

  let statusLabel = 'Saudável';
  let summaryText = `${pet?.name || 'Seu gato'} está com acompanhamento em bom estado.`;
  let emoji = '😸';

  if (overdue > 0) {
    statusLabel = 'Atenção';
    summaryText = `${pet?.name || 'Seu gato'} possui ${overdue} item(ns) de saúde vencido(s) que merecem revisão.`;
    emoji = '😿';
    score = Math.max(45, score - 18);
  } else if (upcoming > 0) {
    statusLabel = 'Em acompanhamento';
    summaryText = `${pet?.name || 'Seu gato'} tem ${upcoming} item(ns) próximo(s) do reforço ou acompanhamento.`;
    emoji = '😺';
    score = Math.max(70, score - 6);
  } else if ((Array.isArray(immunizations) && immunizations.length > 0) || consultCount > 0) {
    statusLabel = 'Em dia';
    summaryText = `${pet?.name || 'Seu gato'} está com rotina preventiva organizada no GATEDO.`;
    emoji = '😸';
  }

  return {
    score,
    statusLabel,
    summaryText,
    emoji,
    consultCount,
    overdue,
    upcoming,
  };
}