// utils/healthHistoryAdapter.js

const isValidDate = (value) => {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

const sortDesc = (arr) =>
  [...arr].sort((a, b) => new Date(b.date) - new Date(a.date));

const normalizeLegacyHealthRecords = (healthRecords = []) => {
  const list = Array.isArray(healthRecords) ? healthRecords : [];

  const vaccines = list
    .filter((item) => item?.type === 'VACCINE')
    .map((item) => ({
      id: item.id,
      name: item.title || item.name || item.label || 'Vacina',
      title: item.title || item.name || item.label || 'Vacina',
      date: item.date || item.appliedAt || item.createdAt,
      nextDueDate: item.nextDueDate || item.expiresAt || null,
      status: item.status || null,
      veterinarian: item.veterinarian || null,
      notes: item.notes || '',
      raw: item,
    }))
    .filter((item) => isValidDate(item.date));

  const deworming = list
    .filter((item) => item?.type === 'VERMIFUGE')
    .map((item) => ({
      id: item.id,
      name: item.title || item.name || item.label || 'Vermifugação',
      title: item.title || item.name || item.label || 'Vermifugação',
      date: item.date || item.appliedAt || item.createdAt,
      nextDueDate: item.nextDueDate || null,
      status: item.status || null,
      veterinarian: item.veterinarian || null,
      notes: item.notes || '',
      raw: item,
    }))
    .filter((item) => isValidDate(item.date));

  const parasite = list
    .filter((item) => item?.type === 'PARASITE')
    .map((item) => ({
      id: item.id,
      name: item.title || item.name || item.label || 'Antiparasitário',
      title: item.title || item.name || item.label || 'Antiparasitário',
      date: item.date || item.appliedAt || item.createdAt,
      nextDueDate: item.nextDueDate || null,
      status: item.status || null,
      veterinarian: item.veterinarian || null,
      notes: item.notes || '',
      raw: item,
    }))
    .filter((item) => isValidDate(item.date));

  const consultations = list
    .filter((item) => item?.type === 'CONSULTATION')
    .map((item) => ({
      id: item.id,
      clinic: item.clinic || item.location || '',
      professional: item.professional || item.veterinarian || item.vet || '',
      reason: item.reason || item.title || 'Consulta',
      title: item.title || item.reason || 'Consulta',
      date: item.date || item.createdAt,
      notes: item.notes || '',
      prescription: item.prescription || '',
      raw: item,
    }))
    .filter((item) => isValidDate(item.date));

  const medications = list
    .filter((item) => item?.type === 'MEDICATION')
    .map((item) => ({
      id: item.id,
      title: item.title || item.name || item.label || 'Medicação',
      date: item.date || item.createdAt,
      nextDueDate: item.nextDueDate || null,
      notes: item.notes || '',
      raw: item,
    }))
    .filter((item) => isValidDate(item.date));

  return {
    vaccines: sortDesc(vaccines),
    deworming: sortDesc(deworming),
    parasite: sortDesc(parasite),
    consultations: sortDesc(consultations),
    medications: sortDesc(medications),
  };
};

export function normalizeHealthHistory(pet = {}) {
  const diaryEntries = Array.isArray(pet?.diaryEntries) ? pet.diaryEntries : [];
  const medicalEvents = Array.isArray(pet?.medicalEvents) ? pet.medicalEvents : [];
  const weightLogs = Array.isArray(pet?.weightLogs) ? pet.weightLogs : [];
  const vaccines = Array.isArray(pet?.vaccines) ? pet.vaccines : [];
  const deworming = Array.isArray(pet?.deworming) ? pet.deworming : [];
  const consultations = Array.isArray(pet?.consultations) ? pet.consultations : [];
  const legacy = normalizeLegacyHealthRecords(pet?.healthRecords || []);

  const diaryMedicalEvents = diaryEntries
    .filter((entry) => {
      const category = String(entry?.category || entry?.type || '').toLowerCase();
      const tags = Array.isArray(entry?.tags) ? entry.tags.map((t) => String(t).toLowerCase()) : [];
      return (
        category.includes('saúde') ||
        category.includes('saude') ||
        category.includes('vet') ||
        category.includes('consulta') ||
        category.includes('vacina') ||
        category.includes('verm') ||
        category.includes('parasit') ||
        tags.some((tag) =>
          ['saúde', 'saude', 'vet', 'consulta', 'vacina', 'vermifugação', 'vermifugacao', 'parasita', 'parasitário', 'parasitario'].includes(tag)
        )
      );
    })
    .map((entry) => ({
      id: entry.id,
      source: 'diary',
      type: entry.type || entry.category || 'registro',
      title: entry.title || entry.label || 'Registro de saúde',
      notes: entry.content || entry.description || '',
      date: entry.date || entry.createdAt || entry.updatedAt,
      raw: entry,
    }))
    .filter((item) => isValidDate(item.date));

  const normalizedMedicalEvents = medicalEvents
    .map((item) => ({
      id: item.id,
      source: 'medical',
      type: item.type || item.category || 'evento',
      title: item.title || item.label || 'Evento médico',
      notes: item.notes || item.description || '',
      date: item.date || item.createdAt || item.updatedAt,
      raw: item,
    }))
    .filter((item) => isValidDate(item.date));

  const normalizedVaccines = vaccines
    .map((item) => ({
      id: item.id,
      name: item.name || item.label || 'Vacina',
      title: item.name || item.label || 'Vacina',
      date: item.date || item.appliedAt || item.createdAt,
      nextDueDate: item.nextDueDate || item.expiresAt || null,
      status: item.status || null,
      raw: item,
    }))
    .filter((item) => isValidDate(item.date));

  const normalizedDeworming = deworming
    .map((item) => ({
      id: item.id,
      name: item.name || item.label || 'Vermifugação',
      title: item.name || item.label || 'Vermifugação',
      date: item.date || item.appliedAt || item.createdAt,
      nextDueDate: item.nextDueDate || null,
      status: item.status || null,
      raw: item,
    }))
    .filter((item) => isValidDate(item.date));

  const normalizedConsultations = consultations
    .map((item) => ({
      id: item.id,
      clinic: item.clinic || item.location || '',
      professional: item.professional || item.vet || '',
      reason: item.reason || item.title || 'Consulta',
      title: item.reason || item.title || 'Consulta',
      date: item.date || item.createdAt,
      raw: item,
    }))
    .filter((item) => isValidDate(item.date));

  const normalizedWeights = weightLogs
    .map((item) => ({
      id: item.id,
      value: Number(item.value || item.weight || 0),
      unit: item.unit || 'kg',
      date: item.date || item.createdAt,
      raw: item,
    }))
    .filter((item) => item.value > 0 && isValidDate(item.date));

  const latestWeightFromPet =
    Number(pet?.weight || 0) > 0
      ? [
          {
            id: 'pet-weight',
            value: Number(pet.weight),
            unit: 'kg',
            date: pet?.updatedAt || pet?.createdAt || new Date().toISOString(),
            raw: { source: 'pet.weight' },
          },
        ]
      : [];

  const mergedWeights = sortDesc([...normalizedWeights, ...latestWeightFromPet]);

  return {
    vaccines: sortDesc([...normalizedVaccines, ...legacy.vaccines]),
    deworming: sortDesc([...normalizedDeworming, ...legacy.deworming]),
    parasite: sortDesc([...legacy.parasite]),
    consultations: sortDesc([...normalizedConsultations, ...legacy.consultations]),
    medications: sortDesc([...legacy.medications]),
    weightLogs: mergedWeights,
    medicalTimeline: sortDesc([...normalizedMedicalEvents, ...diaryMedicalEvents]),
  };
}