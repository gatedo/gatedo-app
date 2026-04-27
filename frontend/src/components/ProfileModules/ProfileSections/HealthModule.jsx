import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Stethoscope,
  Brain,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Pill,
  Building2,
  UserRound,
  FileText,
  Phone,
  MapPin,
  Plus,
  HeartHandshake,
  Sparkles,
  Syringe,
  ShieldPlus,
  Bug,
  CalendarClock,
  ClipboardList,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import TreatmentTracker from './Treatmenttracker';

const C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  accent: '#DFFF40',
};

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

const daysSince = (d) => {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return '1 dia atrás';
  if (days < 30) return `${days} dias atrás`;
  if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
  return `${Math.floor(days / 365)} ano(s) atrás`;
};

const TRUSTED_KEY = (petId) => `gatedo_trusted_providers_${petId}`;

const readTrustedProviders = (petId) => {
  if (!petId) return { vets: [], clinics: [] };
  try {
    const raw = localStorage.getItem(TRUSTED_KEY(petId));
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      vets: Array.isArray(parsed?.vets) ? parsed.vets : [],
      clinics: Array.isArray(parsed?.clinics) ? parsed.clinics : [],
    };
  } catch {
    return { vets: [], clinics: [] };
  }
};

const saveTrustedProviders = (petId, payload) => {
  if (!petId) return;
  localStorage.setItem(TRUSTED_KEY(petId), JSON.stringify(payload));
};

const HEALTH_RECORD_META = {
  VACCINE: {
    label: 'Vacina',
    icon: Syringe,
    toneBg: '#FDF2F8',
    toneText: '#DB2777',
  },
  VERMIFUGE: {
    label: 'Vermífugo',
    icon: ShieldPlus,
    toneBg: '#EFF6FF',
    toneText: '#2563EB',
  },
  PARASITE: {
    label: 'Antiparasitário',
    icon: Bug,
    toneBg: '#FAF5FF',
    toneText: '#9333EA',
  },
  MEDICATION: {
    label: 'Medicação',
    icon: Pill,
    toneBg: '#FFFBEB',
    toneText: '#D97706',
  },
  CONSULTATION: {
    label: 'Consulta',
    icon: Stethoscope,
    toneBg: '#EEF2FF',
    toneText: '#4F46E5',
  },
};

function normalizeRecordType(type) {
  if (!type) return '';
  return String(type).toUpperCase();
}

function getHealthRecordMeta(type) {
  return HEALTH_RECORD_META[normalizeRecordType(type)] || {
    label: 'Registro clínico',
    icon: ClipboardList,
    toneBg: '#F9FAFB',
    toneText: '#4B5563',
  };
}

function StatChip({ label, value, tone = 'default' }) {
  const palette =
    tone === 'alert'
      ? { bg: '#FEF2F2', fg: '#DC2626' }
      : tone === 'good'
        ? { bg: '#F0FDF4', fg: '#16A34A' }
        : { bg: '#F4F3FF', fg: C.purple };

  return (
    <div className="rounded-[20px] px-4 py-3 border border-gray-100 bg-white shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-black" style={{ color: palette.fg }}>{value}</p>
    </div>
  );
}

function IgentRecord({ record, catName, catGender }) {
  const [expanded, setExpanded] = useState(false);
  const recs = record.recommendations || [];
  const isUrgent = record.isUrgent;

  const symptomMatch = record.notes?.match(/Sintoma:\s*([^.]+)/);
  const symptomLabel = symptomMatch?.[1]?.trim() || 'Consulta IA';

  const neuteredLabel = record?.clinicalSnapshot?.neutered
    ? `✂ Castrad${String(catGender).toUpperCase() === 'FEMALE' ? 'a' : 'o'}`
    : '🔓 Inteiro';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] overflow-hidden border"
      style={{
        border: `1.5px solid ${isUrgent ? '#FECACA' : `${C.purple}25`}`,
        background: isUrgent ? '#FFF5F5' : `${C.purple}06`,
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isUrgent ? '#FEE2E2' : `${C.purple}15` }}
        >
          <Brain size={16} style={{ color: isUrgent ? '#DC2626' : C.purple }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${C.purple}15`, color: C.purple }}
            >
              iGentVet IA
            </span>

            {record._fromSession && (
              <span
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: '#DFFF4020',
                  color: '#5A7000',
                  border: '1px solid #DFFF4055',
                }}
              >
                Prontuário rico
              </span>
            )}

            {isUrgent && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                🔴 Urgente
              </span>
            )}
          </div>

          <p className="font-black text-gray-800 text-sm leading-tight mt-0.5 truncate">
            {symptomLabel}
          </p>

          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
            {fmtDate(record.date)} · {daysSince(record.date)}
          </p>
        </div>

        <div className="flex-shrink-0 text-gray-300">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {record.notes && (
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    Análise da IA
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {record.notes.replace(/\[iGentVet\]\s*Sintoma:[^.]+\.\s*/, '')}
                  </p>
                </div>
              )}

              {recs.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                    Recomendações
                  </p>
                  <ul className="space-y-1">
                    {recs.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="font-black mt-0.5 flex-shrink-0" style={{ color: C.purple }}>
                          •
                        </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {record._fromSession && record.ownerResponse && (
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider mb-1">
                    Resposta do tutor
                  </p>
                  <p className="text-xs text-indigo-700 italic">"{record.ownerResponse}"</p>
                </div>
              )}

              {record._fromSession && record.clinicalSnapshot && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                    Snapshot clínico
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    {record.clinicalSnapshot.weight && (
                      <span className="text-[9px] bg-white border border-gray-200 rounded-full px-2 py-0.5 font-bold text-gray-600">
                        ⚖ {record.clinicalSnapshot.weight}kg
                      </span>
                    )}

                    {record.clinicalSnapshot.ageYears && (
                      <span className="text-[9px] bg-white border border-gray-200 rounded-full px-2 py-0.5 font-bold text-gray-600">
                        🎂 {record.clinicalSnapshot.ageYears}a
                      </span>
                    )}

                    {record.clinicalSnapshot.neutered !== undefined && (
                      <span className="text-[9px] bg-white border border-gray-200 rounded-full px-2 py-0.5 font-bold text-gray-600">
                        {neuteredLabel}
                      </span>
                    )}

                    {catName && (
                      <span className="text-[9px] bg-white border border-gray-200 rounded-full px-2 py-0.5 font-bold text-gray-600">
                        🐾 {catName}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {isUrgent ? (
                  <AlertCircle size={12} className="text-red-400" />
                ) : (
                  <CheckCircle size={12} className="text-green-500" />
                )}

                <span
                  className="text-[10px] font-black"
                  style={{ color: isUrgent ? '#DC2626' : '#16A34A' }}
                >
                  {isUrgent ? 'Recomendada consulta presencial' : 'Monitoramento domiciliar'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VetRecord({ record }) {
  const [expanded, setExpanded] = useState(false);
  const meta = getHealthRecordMeta(record?.type);
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] overflow-hidden bg-white border border-gray-100 shadow-sm"
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: meta.toneBg }}
        >
          <Icon size={16} style={{ color: meta.toneText }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: meta.toneBg, color: meta.toneText }}
            >
              {meta.label}
            </span>
            {record?.prescription && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
                Receita
              </span>
            )}
            {record?.ongoing && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                Contínuo
              </span>
            )}
            {record?.appointmentMode === 'specialist' && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                Especialista
              </span>
            )}
          </div>

          <p className="font-black text-gray-800 text-sm leading-tight truncate mt-0.5">
            {record.title || meta.label}
          </p>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
            {fmtDate(record.date)} · {record.veterinarian || record.clinicName || 'Clínica geral'}
          </p>
        </div>

        <div className="flex-shrink-0 text-gray-300">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {(record.reason || record.specialty) && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    Contexto da consulta
                  </p>
                  {record.reason ? (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-black text-gray-700">Motivo:</span> {record.reason}
                    </p>
                  ) : null}
                  {record.specialty ? (
                    <p className="text-xs text-gray-600 leading-relaxed mt-1">
                      <span className="font-black text-gray-700">Especialidade:</span> {record.specialty}
                    </p>
                  ) : null}
                </div>
              )}

              {record.notes && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    Anotações
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">{record.notes}</p>
                </div>
              )}

              {(record.clinicName || record.clinicPhone || record.clinicAddress) && (
                <div className="bg-[#FCFCFF] rounded-xl p-3 border border-[#8B4AFF10]">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">
                    Atendimento
                  </p>
                  {record.clinicName ? (
                    <p className="text-xs font-black text-gray-700">{record.clinicName}</p>
                  ) : null}
                  {record.clinicPhone ? (
                    <p className="text-[10px] font-bold text-gray-500 mt-1">{record.clinicPhone}</p>
                  ) : null}
                  {record.clinicAddress ? (
                    <p className="text-[10px] font-bold text-gray-500 mt-1">{record.clinicAddress}</p>
                  ) : null}
                </div>
              )}

              {(record.nextDueDate || record.recommendedRecheck || record.recheckDate) && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider mb-1">
                    Próximo cuidado
                  </p>
                  {record.recommendedRecheck && record.recheckDate ? (
                    <p className="text-xs font-bold text-amber-700">
                      Reconsulta recomendada em {fmtDate(record.recheckDate)}
                    </p>
                  ) : record.nextDueDate ? (
                    <p className="text-xs font-bold text-amber-700">
                      {fmtDate(record.nextDueDate)}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function IgentInsightCard({ cat, igentSessions }) {
  const totalSessions = igentSessions.length;
  const urgentCount = igentSessions.filter((r) => r.isUrgent).length;
  const lastSession = igentSessions[0];

  const symptomFreq = {};
  igentSessions.forEach((r) => {
    const m = r.notes?.match(/Sintoma:\s*([^.]+)/);
    if (m) {
      const s = m[1].trim();
      symptomFreq[s] = (symptomFreq[s] || 0) + 1;
    }
  });

  const topSymptom = Object.entries(symptomFreq).sort((a, b) => b[1] - a[1])[0];

  const insightText =
    totalSessions === 0
      ? `Ainda não há consultas iGentVet para ${cat.name}. Inicie uma análise para começar a construir o histórico preditivo.`
      : topSymptom && topSymptom[1] > 1
        ? `${cat.name} já teve ${totalSessions} análises. A área de "${topSymptom[0]}" apareceu ${topSymptom[1]} vezes — vale atenção especial nessa região.${urgentCount > 0 ? ` ${urgentCount} consulta(s) indicaram urgência.` : ''}`
        : `${cat.name} tem ${totalSessions} análise${totalSessions > 1 ? 's' : ''} registrada${totalSessions > 1 ? 's' : ''} pelo iGentVet. Continue registrando para ativar os padrões preditivos.`;

  return (
    <div
      className="rounded-[28px] p-5 text-white shadow-lg relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
    >
      <div className="absolute -right-6 -bottom-6 opacity-[0.07]">
        <Brain size={110} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: C.accent }}
          >
            <Zap size={12} className="text-[#2D2657]" />
          </div>
          <h3 className="text-[9px] font-black uppercase tracking-widest text-white/80">
            iGentVet · Insight Preditivo
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-white/90 italic mb-4">
          "{insightText}"
        </p>

        {totalSessions > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-2xl px-3 py-2 text-center">
              <p className="text-lg font-black" style={{ color: C.accent }}>{totalSessions}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-white/60">Análises</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-2 text-center">
              <p className="text-lg font-black text-red-300">{urgentCount}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-white/60">Urgentes</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-2 text-center">
              <p className="text-[10px] font-black" style={{ color: C.accent }}>
                {lastSession ? daysSince(lastSession.date) : '—'}
              </p>
              <p className="text-[8px] font-black uppercase tracking-wider text-white/60">Última</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthSummaryCard({ records = [], treatments = [], documents = [], igentRecords = [] }) {
  const consultations = records.filter((r) => normalizeRecordType(r?.type) === 'CONSULTATION');
  const activeTreatments = treatments.filter((t) => t?.active !== false && t?.status !== 'completed' && !t?.completed);
  const prescriptions = documents.filter((doc) => String(doc?.category || '').toUpperCase() === 'RECEITA');
  const lastVisit = [...consultations].sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))[0];
  const nextAlert = activeTreatments
    .flatMap((item) => (Array.isArray(item?.doses) ? item.doses : []))
    .filter((dose) => !dose?.takenAt && !dose?.skipped)
    .sort((a, b) => new Date(a?.scheduledAt || 0) - new Date(b?.scheduledAt || 0))[0];

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Painel Clínico
        </h3>
        <span
          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: `${C.purple}10`, color: C.purple }}
        >
          Saúde conectada
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatChip label="Consultas" value={consultations.length} />
        <StatChip label="Tratamentos" value={activeTreatments.length} tone={activeTreatments.length ? 'good' : 'default'} />
        <StatChip label="Receitas" value={prescriptions.length} />
        <StatChip label="Análises IA" value={igentRecords.length} tone={igentRecords.some((item) => item?.isUrgent) ? 'alert' : 'default'} />
      </div>

      <div className="grid grid-cols-1 gap-3 mt-3">
        <div className="rounded-[20px] border border-gray-100 p-4 bg-[#FCFCFF]">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Último atendimento</p>
          <p className="text-sm font-black text-gray-800">
            {lastVisit?.title || 'Ainda não há consulta presencial registrada'}
          </p>
          <p className="text-[11px] font-bold text-gray-500 mt-1">
            {lastVisit ? `${lastVisit.veterinarian || lastVisit.clinicName || 'Sem profissional'} · ${fmtDate(lastVisit.date)}` : 'Use o formulário de saúde para registrar a primeira consulta.'}
          </p>
        </div>

        <div className="rounded-[20px] border border-gray-100 p-4 bg-[#FCFCFF]">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Próximo alerta terapêutico</p>
          <p className="text-sm font-black text-gray-800">
            {nextAlert ? fmtDate(nextAlert.scheduledAt) : 'Nenhuma dose futura programada'}
          </p>
          <p className="text-[11px] font-bold text-gray-500 mt-1">
            {nextAlert ? `Dose prevista para ${new Date(nextAlert.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Quando um tratamento for programado, os alertas aparecem aqui.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProvidersSection({ petId, records = [], treatments = [] }) {
  const [trusted, setTrusted] = useState(() => readTrustedProviders(petId));
  const [form, setForm] = useState({ vetName: '', clinicName: '', phone: '', address: '', notes: '' });

  useEffect(() => {
    setTrusted(readTrustedProviders(petId));
  }, [petId]);

  const inferred = useMemo(() => {
    const vetsMap = new Map();
    const clinicsMap = new Map();

    [...records, ...treatments].forEach((record) => {
      const vetName = typeof record?.veterinarian === 'string' ? record.veterinarian.trim() : '';
      const clinicName = typeof record?.clinicName === 'string' ? record.clinicName.trim() : '';

      if (vetName) {
        const key = vetName.toLowerCase();
        vetsMap.set(key, {
          id: key,
          name: vetName,
          clinicName: clinicName || vetsMap.get(key)?.clinicName || '',
          clinicPhone: record?.clinicPhone || vetsMap.get(key)?.clinicPhone || '',
          clinicAddress: record?.clinicAddress || vetsMap.get(key)?.clinicAddress || '',
          source: 'history',
          catFriendlyEligible: true,
        });
      }

      if (clinicName) {
        const key = clinicName.toLowerCase();
        clinicsMap.set(key, {
          id: key,
          name: clinicName,
          phone: record?.clinicPhone || clinicsMap.get(key)?.phone || '',
          address: record?.clinicAddress || clinicsMap.get(key)?.address || '',
          source: 'history',
          catFriendlyEligible: true,
        });
      }
    });

    return {
      vets: [...vetsMap.values()],
      clinics: [...clinicsMap.values()],
    };
  }, [records, treatments]);

  const merged = useMemo(() => {
    const mergeUnique = (primary, secondary, key) => {
      const map = new Map();
      [...primary, ...secondary].forEach((item) => {
        const value = item?.[key]?.trim?.()?.toLowerCase?.() || item?.[key];
        if (!value) return;
        if (!map.has(value)) map.set(value, item);
        else map.set(value, { ...map.get(value), ...item });
      });
      return [...map.values()];
    };

    return {
      vets: mergeUnique(trusted.vets, inferred.vets, 'name'),
      clinics: mergeUnique(trusted.clinics, inferred.clinics, 'name'),
    };
  }, [trusted, inferred]);

  const handleAddTrusted = () => {
    const next = {
      vets: [...trusted.vets],
      clinics: [...trusted.clinics],
    };

    if (form.vetName.trim()) {
      next.vets.unshift({
        id: `${form.vetName.trim()}::${form.clinicName.trim()}`.toLowerCase(),
        name: form.vetName.trim(),
        clinicName: form.clinicName.trim(),
        clinicPhone: form.phone.trim(),
        clinicAddress: form.address.trim(),
        notes: form.notes.trim(),
        source: 'manual',
        trustLevel: 'trusted',
        catFriendlyEligible: true,
      });
    }

    if (form.clinicName.trim()) {
      next.clinics.unshift({
        id: `${form.clinicName.trim()}::${form.phone.trim()}`.toLowerCase(),
        name: form.clinicName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        source: 'manual',
        trustLevel: 'trusted',
        catFriendlyEligible: true,
      });
    }

    saveTrustedProviders(petId, {
      vets: next.vets.slice(0, 30),
      clinics: next.clinics.slice(0, 30),
    });
    setTrusted(readTrustedProviders(petId));
    setForm({ vetName: '', clinicName: '', phone: '', address: '', notes: '' });
  };

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Clínicas e Veterinários
          </h3>
          <p className="text-[11px] font-bold text-gray-400 mt-1">
            Base de confiança do tutor + recorrência do histórico
          </p>
        </div>
        <span
          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: '#DFFF4020', color: '#5A7000', border: '1px solid #DFFF4050' }}
        >
          Futuro guia B2B
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="rounded-[20px] border border-gray-100 p-4 bg-[#FCFCFF]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.vetName}
              onChange={(e) => setForm((prev) => ({ ...prev, vetName: e.target.value }))}
              placeholder="Veterinário de confiança"
              className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 outline-none"
            />
            <input
              value={form.clinicName}
              onChange={(e) => setForm((prev) => ({ ...prev, clinicName: e.target.value }))}
              placeholder="Clínica de confiança"
              className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 outline-none"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Telefone / WhatsApp"
              className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 outline-none"
            />
            <input
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Endereço / Bairro"
              className="w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 outline-none"
            />
          </div>

          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Observações, horário, especialidade, referência..."
            className="mt-3 w-full rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 outline-none resize-none"
          />

          <button
            type="button"
            onClick={handleAddTrusted}
            className="mt-3 inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black text-white"
            style={{ background: `linear-gradient(135deg, ${C.purple}, #8B5CF6)` }}
          >
            <Plus size={14} />
            Salvar na base de confiança
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-[20px] border border-gray-100 p-4 bg-[#FCFCFF]">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={14} className="text-[#8B4AFF]" />
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Clínicas</p>
          </div>

          <div className="space-y-2">
            {merged.clinics.length === 0 ? (
              <p className="text-[11px] font-bold text-gray-400">Nenhuma clínica vinculada ainda.</p>
            ) : (
              merged.clinics.map((clinic) => (
                <div key={clinic.id || clinic.name} className="rounded-[18px] bg-white border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-gray-800">{clinic.name}</p>
                      {clinic.phone ? (
                        <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                          <Phone size={10} /> {clinic.phone}
                        </p>
                      ) : null}
                      {clinic.address ? (
                        <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin size={10} /> {clinic.address}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                      Rede do bem
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[20px] border border-gray-100 p-4 bg-[#FCFCFF]">
          <div className="flex items-center gap-2 mb-3">
            <UserRound size={14} className="text-[#8B4AFF]" />
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Veterinários</p>
          </div>

          <div className="space-y-2">
            {merged.vets.length === 0 ? (
              <p className="text-[11px] font-bold text-gray-400">Nenhum veterinário vinculado ainda.</p>
            ) : (
              merged.vets.map((vet) => (
                <div key={vet.id || vet.name} className="rounded-[18px] bg-white border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-gray-800">{vet.name}</p>
                      {vet.clinicName ? (
                        <p className="text-[10px] font-bold text-gray-500 mt-1">{vet.clinicName}</p>
                      ) : null}
                      {vet.clinicPhone ? (
                        <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                          <Phone size={10} /> {vet.clinicPhone}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-[#F4F3FF] text-[#6D28D9] border border-[#8B4AFF10]">
                      CatFriendly
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[20px] mt-4 p-4 border border-[#DFFF4050]" style={{ background: '#FAFFE8' }}>
        <div className="flex items-start gap-2">
          <HeartHandshake size={14} className="text-[#5A7000] mt-0.5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#5A7000]">
              Ponte futura · Rede CatFriendly GATEDO
            </p>
            <p className="text-[11px] font-bold text-[#657411] mt-1 leading-relaxed">
              Esse bloco já deixa amarrado o futuro guia veterinário. Os contatos mais confiáveis poderão ser indicados
              pelo tutor para a Rede do Bem GATEDO e camada B2B do app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SymptomsSection({ igentRecords = [], records = [] }) {
  const symptomMap = new Map();

  igentRecords.forEach((record) => {
    const match = record?.notes?.match(/Sintoma:\s*([^.]+)/);
    const label = match?.[1]?.trim();
    if (!label) return;

    const prev = symptomMap.get(label) || { label, count: 0, lastDate: null, urgent: false };
    symptomMap.set(label, {
      ...prev,
      count: prev.count + 1,
      lastDate: !prev.lastDate || new Date(record.date) > new Date(prev.lastDate) ? record.date : prev.lastDate,
      urgent: prev.urgent || !!record.isUrgent,
    });
  });

  records.forEach((record) => {
    if (!record?.notes && !record?.reason) return;
    const lower = `${record.notes || ''} ${record.reason || ''}`.toLowerCase();
    ['vômito', 'diarreia', 'apatia', 'espirro', 'coceira', 'febre', 'dor', 'herpes ocular', 'olho', 'ferida'].forEach((keyword) => {
      if (!lower.includes(keyword)) return;
      const prev = symptomMap.get(keyword) || { label: keyword, count: 0, lastDate: null, urgent: false };
      symptomMap.set(keyword, {
        ...prev,
        count: prev.count + 1,
        lastDate: !prev.lastDate || new Date(record.date) > new Date(prev.lastDate) ? record.date : prev.lastDate,
      });
    });
  });

  const symptoms = [...symptomMap.values()].sort((a, b) => {
    const byCount = b.count - a.count;
    if (byCount !== 0) return byCount;
    return new Date(b.lastDate || 0) - new Date(a.lastDate || 0);
  });

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-[#8B4AFF]" />
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Sintomas e Sinais
        </h3>
      </div>

      {symptoms.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-gray-200 p-5 text-center">
          <p className="text-[11px] font-bold text-gray-400">
            Ainda não há sintomas recorrentes mapeados no histórico.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {symptoms.map((symptom) => (
            <div
              key={symptom.label}
              className="px-3 py-2 rounded-full border text-[10px] font-black"
              style={{
                background: symptom.urgent ? '#FFF5F5' : '#F4F3FF',
                borderColor: symptom.urgent ? '#FECACA' : '#E9E4FF',
                color: symptom.urgent ? '#DC2626' : C.purple,
              }}
            >
              {symptom.label} · {symptom.count}x
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LinkedDocumentsSection({ catId, documents = [] }) {
  const navigate = useNavigate();
  const sortedDocs = [...documents].sort((a, b) => new Date(b?.createdAt || b?.date || 0) - new Date(a?.createdAt || a?.date || 0));
  const recentDocs = sortedDocs.slice(0, 4);

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#8B4AFF]" />
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Receitas e Documentos
          </h3>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/cat/${catId}`, { hash: '#documents', state: { scrollToDocuments: true } })}
          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: `${C.purple}10`, color: C.purple }}
        >
          Abrir gaveta
        </button>
      </div>

      {recentDocs.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-gray-200 p-5 text-center">
          <p className="text-[11px] font-bold text-gray-400">
            Nenhum documento clínico recente. As receitas anexadas no formulário já cairão aqui e na aba Documentos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentDocs.map((doc) => (
            <div key={doc.id} className="rounded-[18px] border border-gray-100 bg-[#FCFCFF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-gray-800">
                    {doc.title || doc.fileName || 'Documento clínico'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-1">
                    {String(doc.category || '').toUpperCase() === 'RECEITA' ? 'Receita' : doc.category || 'Documento'} · {fmtDate(doc.createdAt || doc.date)}
                  </p>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  {String(doc.category || '').toUpperCase() === 'RECEITA' ? 'Receita' : 'Arquivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VisitsTimeline({ records = [], igentRecords = [], activeFilter, setActiveFilter, cat }) {
  const mergedTimeline = useMemo(() => {
    const classic = records.map((record) => ({
      ...record,
      _kind: 'clinical',
      _sortDate: record?.date || record?.createdAt || null,
    }));

    const igent = igentRecords.map((record) => ({
      ...record,
      _kind: 'igent',
      _sortDate: record?.date || record?.createdAt || null,
    }));

    return [...classic, ...igent].sort(
      (a, b) => new Date(b?._sortDate || 0) - new Date(a?._sortDate || 0)
    );
  }, [records, igentRecords]);

  const filteredRecords =
    activeFilter === 'igent'
      ? mergedTimeline.filter((r) => r._kind === 'igent')
      : activeFilter === 'vet'
        ? mergedTimeline.filter((r) => r._kind === 'clinical')
        : mergedTimeline;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Histórico de Saúde
        </h3>

        <div className="flex gap-1">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'igent', label: '🤖 IA' },
            { key: 'vet', label: '🏥 Clínico' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="text-[9px] font-black px-2.5 py-1 rounded-full transition-all"
              style={
                activeFilter === f.key
                  ? { background: C.purple, color: '#fff' }
                  : { background: '#F4F3FF', color: C.purple }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {filteredRecords.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <p className="text-3xl mb-2">🐱</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {activeFilter === 'igent'
                  ? 'Nenhuma consulta iGentVet ainda'
                  : activeFilter === 'vet'
                    ? 'Nenhum registro clínico ainda'
                    : 'Nenhum registro de saúde ainda'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredRecords.map((record, i) =>
                record._kind === 'igent' ? (
                  <IgentRecord
                    key={record.id || `igent-${i}`}
                    record={record}
                    catName={cat?.name}
                    catGender={cat?.gender}
                  />
                ) : (
                  <VetRecord key={record.id || `vet-${i}`} record={record} />
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function HealthModule({ cat }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('all');
  const [igentSessions, setIgentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const [pendingTreatmentContext, setPendingTreatmentContext] = useState(null);
  const [autoOpenTracker, setAutoOpenTracker] = useState(false);

  useEffect(() => {
    if (!cat?.id) return;

    setLoadingSessions(true);

    api.get(`/igent/sessions?petId=${cat.id}`)
      .then((r) => setIgentSessions(Array.isArray(r.data) ? r.data : []))
      .catch(() => setIgentSessions([]))
      .finally(() => setLoadingSessions(false));
  }, [cat?.id]);

  useEffect(() => {
    if (!cat?.id) return;
    setLoadingDocuments(true);

    api.get(`/documents?petId=${cat.id}`)
      .then((res) => setDocuments(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDocuments([]))
      .finally(() => setLoadingDocuments(false));
  }, [cat?.id]);

  useEffect(() => {
    const incomingContext = location.state?.treatmentContext || null;
    const shouldAutoOpen = !!location.state?.openTreatmentTracker;

    if (incomingContext) {
      setPendingTreatmentContext(incomingContext);
      setAutoOpenTracker(shouldAutoOpen);
    }

    if (location.state?.openTreatmentTracker || location.state?.treatmentContext || location.state?.openHealthTab) {
      navigate(location.pathname, {
        replace: true,
        state: {
          ...location.state,
          openTreatmentTracker: false,
          treatmentContext: null,
          openHealthTab: false,
        },
      });
    }
  }, [location.state, location.pathname, navigate]);

  const allRecords = Array.isArray(cat?.healthRecords) ? cat.healthRecords : [];
  const allTreatments = Array.isArray(cat?.treatments) ? cat.treatments : [];

  const igentRecordsLegacy = allRecords
    .filter((r) => normalizeRecordType(r.type) === 'IACONSULT')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const igentRecords =
    igentSessions.length > 0
      ? igentSessions.map((s) => ({
          ...s,
          notes: `[iGentVet] Sintoma: ${s.symptomLabel}. ${s.analysisText || ''}`,
          recommendations: s.recommendations || [],
          isUrgent: s.isUrgent,
          date: s.date,
          _fromSession: true,
        }))
      : igentRecordsLegacy;

  const clinicalRecords = allRecords
    .filter((r) => normalizeRecordType(r.type) !== 'IACONSULT')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const clinicalSummaryRecords = clinicalRecords.filter((r) =>
    ['CONSULTATION', 'VACCINE', 'VERMIFUGE', 'PARASITE', 'MEDICATION'].includes(normalizeRecordType(r.type))
  );

  const recentClinicalHighlights = clinicalSummaryRecords
    .slice()
    .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {pendingTreatmentContext && autoOpenTracker && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F4F3FF] border border-[#8B4AFF20] rounded-[22px] px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Pill size={14} className="text-[#8B4AFF]" />
            <p className="text-[10px] font-black uppercase tracking-wider text-[#8B4AFF]">
              Tratamento vindo da consulta
            </p>
          </div>
          <p className="text-[11px] font-bold text-gray-600 mt-1">
            O tracker foi preparado com a medicação prescrita e os dados da consulta.
          </p>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <IgentInsightCard cat={cat} igentSessions={igentRecords} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <HealthSummaryCard
          records={clinicalSummaryRecords}
          treatments={allTreatments}
          documents={documents}
          igentRecords={igentRecords}
        />
      </motion.div>

      {recentClinicalHighlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50"
        >
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock size={14} className="text-[#8B4AFF]" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Últimos cuidados clínicos
            </h3>
          </div>

          <div className="space-y-2">
            {recentClinicalHighlights.map((record) => {
              const meta = getHealthRecordMeta(record.type);
              const Icon = meta.icon;

              return (
                <div key={record.id} className="rounded-[18px] border border-gray-100 bg-[#FCFCFF] p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.toneBg }}
                    >
                      <Icon size={15} style={{ color: meta.toneText }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-gray-800">{record.title || meta.label}</p>
                        <span
                          className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
                          style={{ background: meta.toneBg, color: meta.toneText }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 mt-1">
                        {fmtDate(record.date)} · {record.veterinarian || record.clinicName || 'Sem profissional'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <ProvidersSection petId={cat?.id} records={clinicalRecords} treatments={allTreatments} />
      </motion.div>

      <motion.div
        id="health-treatments"
        className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50 gatedo-scroll-target"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.10 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Tratamentos e Alertas
          </h3>

          <span
            className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: `${C.purple}10`, color: C.purple }}
          >
            Motor contínuo
          </span>
        </div>

        <TreatmentTracker
          cat={cat}
          treatmentContext={pendingTreatmentContext}
          autoOpen={autoOpenTracker}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <SymptomsSection igentRecords={igentRecords} records={clinicalRecords} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        {loadingDocuments ? (
          <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Carregando documentos clínicos...</p>
          </div>
        ) : (
          <LinkedDocumentsSection catId={cat?.id} documents={documents} />
        )}
      </motion.div>

      {loadingSessions ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50"
        >
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Carregando histórico...
          </p>
        </motion.div>
      ) : (
        <VisitsTimeline
          records={clinicalRecords}
          igentRecords={igentRecords}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          cat={cat}
        />
      )}
    </div>
  );
}
