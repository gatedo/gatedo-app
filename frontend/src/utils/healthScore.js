// utils/healthScore.js

export function getHealthStatusLabel(score) {
  if (score >= 85) return 'Em dia';
  if (score >= 65) return 'Atenção';
  return 'Pendente';
}

export function getHealthTone(score) {
  if (score >= 85) return 'green';
  if (score >= 65) return 'amber';
  return 'red';
}

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function daysSince(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export function calculateHealthScore(history = {}) {
  let score = 100;
  const alerts = [];

  const latestVaccine = history.vaccines?.[0] || null;
  const latestDeworming = history.deworming?.[0] || null;
  const latestParasite = history.parasite?.[0] || null;
  const latestConsultation = history.consultations?.[0] || null;
  const latestWeight = history.weightLogs?.[0] || null;
  const activeMedications = history.medications || [];

  if (!latestVaccine) {
    score -= 15;
    alerts.push({
      key: 'vaccine-missing',
      type: 'warning',
      title: 'Vacinação sem registro',
      description: 'Nenhum registro de vacinação foi encontrado.',
    });
  } else if (latestVaccine?.nextDueDate) {
    const dueInDays = daysUntil(latestVaccine.nextDueDate);
    if (dueInDays < 0) {
      score -= 15;
      alerts.push({
        key: 'vaccine-overdue',
        type: 'danger',
        title: 'Vacinação vencida',
        description: `A última vacina passou do prazo há ${Math.abs(dueInDays)} dia(s).`,
      });
    } else if (dueInDays <= 15) {
      score -= 8;
      alerts.push({
        key: 'vaccine-soon',
        type: 'warning',
        title: 'Vacinação próxima',
        description: `Há vacina próxima do vencimento em ${dueInDays} dia(s).`,
      });
    }
  }

  if (!latestDeworming) {
    score -= 12;
    alerts.push({
      key: 'deworming-missing',
      type: 'warning',
      title: 'Vermifugação sem registro',
      description: 'Nenhum registro de vermifugação foi encontrado.',
    });
  } else if (latestDeworming?.nextDueDate) {
    const dueInDays = daysUntil(latestDeworming.nextDueDate);
    if (dueInDays < 0) {
      score -= 12;
      alerts.push({
        key: 'deworming-overdue',
        type: 'danger',
        title: 'Vermifugação vencida',
        description: `A vermifugação está em atraso há ${Math.abs(dueInDays)} dia(s).`,
      });
    } else if (dueInDays <= 15) {
      score -= 6;
      alerts.push({
        key: 'deworming-soon',
        type: 'warning',
        title: 'Vermifugação próxima',
        description: `Há vermifugação próxima em ${dueInDays} dia(s).`,
      });
    }
  }

  if (!latestParasite) {
    score -= 8;
    alerts.push({
      key: 'parasite-missing',
      type: 'neutral',
      title: 'Proteção parasitária sem registro',
      description: 'Nenhum antiparasitário foi registrado.',
    });
  } else if (latestParasite?.nextDueDate) {
    const dueInDays = daysUntil(latestParasite.nextDueDate);
    if (dueInDays < 0) {
      score -= 8;
      alerts.push({
        key: 'parasite-overdue',
        type: 'warning',
        title: 'Proteção parasitária vencida',
        description: `O antiparasitário passou do prazo há ${Math.abs(dueInDays)} dia(s).`,
      });
    } else if (dueInDays <= 15) {
      score -= 4;
      alerts.push({
        key: 'parasite-soon',
        type: 'neutral',
        title: 'Proteção parasitária próxima',
        description: `O antiparasitário vence em ${dueInDays} dia(s).`,
      });
    }
  }

  if (!latestConsultation) {
    score -= 10;
    alerts.push({
      key: 'consultation-missing',
      type: 'neutral',
      title: 'Sem consultas registradas',
      description: 'Ainda não há histórico de consultas presenciais.',
    });
  } else {
    const consultAge = daysSince(latestConsultation.date);
    if (consultAge > 365) {
      score -= 12;
      alerts.push({
        key: 'consultation-old',
        type: 'warning',
        title: 'Consulta desatualizada',
        description: `A última consulta foi há ${consultAge} dia(s).`,
      });
    } else if (consultAge > 180) {
      score -= 6;
      alerts.push({
        key: 'consultation-attention',
        type: 'neutral',
        title: 'Acompanhar rotina',
        description: `A última consulta foi há ${consultAge} dia(s).`,
      });
    }
  }

  if (!latestWeight) {
    score -= 8;
    alerts.push({
      key: 'weight-missing',
      type: 'neutral',
      title: 'Peso sem acompanhamento',
      description: 'Ainda não há peso recente no histórico.',
    });
  } else {
    const weightAge = daysSince(latestWeight.date);
    if (weightAge > 120) {
      score -= 8;
      alerts.push({
        key: 'weight-old',
        type: 'neutral',
        title: 'Peso desatualizado',
        description: `O peso não é atualizado há ${weightAge} dia(s).`,
      });
    }
  }

  const overdueMeds = activeMedications.filter((item) => item?.nextDueDate && daysUntil(item.nextDueDate) < 0);
  if (overdueMeds.length > 0) {
    score -= Math.min(12, overdueMeds.length * 4);
    alerts.push({
      key: 'medications-overdue',
      type: 'danger',
      title: 'Tratamentos com atenção',
      description: `${overdueMeds.length} medicação(ões) com prazo ultrapassado.`,
    });
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status: getHealthStatusLabel(score),
    tone: getHealthTone(score),
    alerts,
    summary: {
      vaccinesCount: history.vaccines?.length || 0,
      dewormingCount: history.deworming?.length || 0,
      parasiteCount: history.parasite?.length || 0,
      consultationsCount: history.consultations?.length || 0,
      weightLogsCount: history.weightLogs?.length || 0,
      medicationsCount: history.medications?.length || 0,
      medicalEventsCount: history.medicalTimeline?.length || 0,
      pendingAlertsCount: alerts.length,
    },
  };
}