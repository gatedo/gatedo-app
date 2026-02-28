import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Stethoscope, MessageSquare, Brain, ChevronDown,
  ChevronUp, AlertCircle, CheckCircle, Clock, TrendingUp,
  Activity, Pill, Calendar, Sparkles
} from 'lucide-react';
import api from '../../../services/api';
import TreatmentTracker from './TreatmentTracker';

const C = {
  purple: '#6158ca',
  purpleDark: '#4B40C6',
  accent: '#DFFF40',
};

// Formata data de forma humana
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

// Diferença em dias entre hoje e uma data
const daysSince = (d) => {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return '1 dia atrás';
  if (days < 30) return `${days} dias atrás`;
  if (days < 365) return `${Math.floor(days/30)} meses atrás`;
  return `${Math.floor(days/365)} ano(s) atrás`;
};

// ─── CARD DE CONSULTA IGENTVET ────────────────────────────────────────────────
function IgentRecord({ record, catName }) {
  const [expanded, setExpanded] = useState(false);
  const recs = record.recommendations || [];
  const isUrgent = record.isUrgent;

  // Tenta extrair o sintoma do notes: "[iGentVet] Sintoma: Olhos. ..."
  const symptomMatch = record.notes?.match(/Sintoma:\s*([^.]+)/);
  const symptomLabel = symptomMatch?.[1]?.trim() || 'Consulta IA';

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
      {/* Header da sessão */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Ícone IA */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: isUrgent ? '#FEE2E2' : `${C.purple}15` }}>
          <Brain size={16} style={{ color: isUrgent ? '#DC2626' : C.purple }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${C.purple}15`, color: C.purple }}>
              iGentVet IA
            </span>
            {record._fromSession && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: '#DFFF4020', color: '#5A7000', border: '1px solid #DFFF4055' }}>
                Prontuario Rico
              </span>
            )}
            {isUrgent && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                🔴 Urgente
              </span>
            )}
          </div>
          <p className="font-black text-gray-800 text-sm leading-tight mt-0.5 truncate">{symptomLabel}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5">{fmtDate(record.date)} · {daysSince(record.date)}</p>
          {daysSince(record.date) === 'Hoje' && (
            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
              style={{ background: '#DFFF4025', color: '#5A7000', border: '1px solid #DFFF4050' }}>
              Nova sessao
            </span>
          )}
        </div>

        <div className="flex-shrink-0 text-gray-300">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Detalhe expandido */}
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
              {/* Análise da IA */}
              {record.notes && (
                <div className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Análise da IA</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {record.notes.replace(/\[iGentVet\]\s*Sintoma:[^.]+\.\s*/, '')}
                  </p>
                </div>
              )}

              {/* Recomendações */}
              {recs.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Recomendações</p>
                  <ul className="space-y-1">
                    {recs.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="font-black mt-0.5 flex-shrink-0" style={{ color: C.purple }}>•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resposta do tutor (IgentSession) */}
              {record._fromSession && record.ownerResponse && (
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider mb-1">Resposta do tutor</p>
                  <p className="text-xs text-indigo-700 italic">"{record.ownerResponse}"</p>
                </div>
              )}
              {/* Snapshot clínico resumido (IgentSession) */}
              {record._fromSession && record.clinicalSnapshot && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Snapshot clínico</p>
                  <div className="flex gap-2 flex-wrap">
                    {record.clinicalSnapshot.weight && (
                      <span className="text-[9px] bg-white border border-gray-200 rounded-full px-2 py-0.5 font-bold text-gray-600">⚖ {record.clinicalSnapshot.weight}kg</span>
                    )}
                    {record.clinicalSnapshot.ageYears && (
                      <span className="text-[9px] bg-white border border-gray-200 rounded-full px-2 py-0.5 font-bold text-gray-600">🎂 {record.clinicalSnapshot.ageYears}a</span>
                    )}
                    {record.clinicalSnapshot.neutered !== undefined && (
                      <span className="text-[9px] bg-white border border-gray-200 rounded-full px-2 py-0.5 font-bold text-gray-600">{record.clinicalSnapshot.neutered ? '✂ Castrad' + (cat?.gender === 'FEMALE' ? 'a' : 'o') : '🔓 Inteiro'}</span>
                    )}
                  </div>
                </div>
              )}
              {/* Status */}
              <div className="flex items-center gap-1.5">
                {isUrgent
                  ? <AlertCircle size={12} className="text-red-400" />
                  : <CheckCircle size={12} className="text-green-500" />
                }
                <span className="text-[10px] font-black"
                  style={{ color: isUrgent ? '#DC2626' : '#16A34A' }}>
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

// ─── CARD DE CONSULTA VETERINÁRIA PRESENCIAL ──────────────────────────────────
function VetRecord({ record }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] overflow-hidden bg-white border border-gray-100 shadow-sm"
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Stethoscope size={16} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-800 text-sm leading-tight truncate">
            {record.title || 'Consulta Veterinária'}
          </p>
          <p className="text-[10px] text-gray-400 font-bold mt-0.5">
            {fmtDate(record.date)} · {record.veterinarian || 'Clínica Geral'}
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
              {record.notes && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Anotações</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{record.notes}</p>
                </div>
              )}
              {record.prescription && (
                <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
                  <Pill size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider mb-0.5">Prescrição</p>
                    <p className="text-xs text-blue-700">{record.prescription}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── INSIGHT CARD DA IA ───────────────────────────────────────────────────────
function IgentInsightCard({ cat, igentSessions }) {
  // Calcula métricas para o insight
  const totalSessions = igentSessions.length;
  const urgentCount = igentSessions.filter(r => r.isUrgent).length;
  const lastSession = igentSessions[0]; // já ordenado por data desc

  // Sintomas mais frequentes
  const symptomFreq = {};
  igentSessions.forEach(r => {
    const m = r.notes?.match(/Sintoma:\s*([^.]+)/);
    if (m) { const s = m[1].trim(); symptomFreq[s] = (symptomFreq[s] || 0) + 1; }
  });
  const topSymptom = Object.entries(symptomFreq).sort((a, b) => b[1] - a[1])[0];

  const insightText = totalSessions === 0
    ? `Ainda não há consultas iGentVet para ${cat.name}. Inicie uma análise para começar a construir o histórico preditivo.`
    : topSymptom && topSymptom[1] > 1
      ? `${cat.name} já teve ${totalSessions} análises. A área de "${topSymptom[0]}" apareceu ${topSymptom[1]} vezes — vale atenção especial nessa região.${urgentCount > 0 ? ` ${urgentCount} consulta(s) indicaram urgência.` : ''}`
      : `${cat.name} tem ${totalSessions} análise${totalSessions > 1 ? 's' : ''} registrada${totalSessions > 1 ? 's' : ''} pelo iGentVet. Continue registrando para ativar os padrões preditivos.`;

  return (
    <div className="rounded-[28px] p-5 text-white shadow-lg relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
      {/* Fundo decorativo */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.07]">
        <Brain size={110} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: C.accent }}>
            <Zap size={12} className="text-[#2D2657]" />
          </div>
          <h3 className="text-[9px] font-black uppercase tracking-widest text-white/80">iGentVet · Insight Preditivo</h3>
        </div>

        <p className="text-sm leading-relaxed text-white/90 italic mb-4">"{insightText}"</p>

        {/* Métricas */}
        {totalSessions > 0 && (
          <div className="flex gap-3">
            <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2 text-center">
              <p className="text-lg font-black" style={{ color: C.accent }}>{totalSessions}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-white/60">Análises</p>
            </div>
            {urgentCount > 0 && (
              <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2 text-center">
                <p className="text-lg font-black text-red-300">{urgentCount}</p>
                <p className="text-[8px] font-black uppercase tracking-wider text-white/60">Urgentes</p>
              </div>
            )}
            {lastSession && (
              <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2 text-center">
                <p className="text-[10px] font-black" style={{ color: C.accent }}>{daysSince(lastSession.date)}</p>
                <p className="text-[8px] font-black uppercase tracking-wider text-white/60">Última</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function HealthModule({ cat }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'igent' | 'vet'
  const [igentSessions, setIgentSessions] = useState([]); // IgentSession do Prisma
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Busca as IgentSessions dedicadas (modelo rico no Prisma)
  // GET /igent/sessions?petId= retorna IgentSession[]
  useEffect(() => {
    if (!cat?.id) return;
    setLoadingSessions(true);
    api.get(`/igent/sessions?petId=${cat.id}`)
      .then(r => setIgentSessions(Array.isArray(r.data) ? r.data : []))
      .catch(() => setIgentSessions([]))
      .finally(() => setLoadingSessions(false));
  }, [cat?.id]);

  const allRecords = cat?.healthRecords || [];

  // Separa por tipo — health-records legados
  const igentRecordsLegacy = allRecords
    .filter(r => r.type === 'IACONSULT')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Funde IgentSessions (novo modelo) com legado, sem duplicar
  // IgentSession tem precedência — mais dados; legado só aparece se não há session equivalente
  const igentRecords = igentSessions.length > 0
    ? igentSessions.map(s => ({
        ...s,
        // normaliza para o mesmo shape do IgentRecord
        notes: `[iGentVet] Sintoma: ${s.symptomLabel}. ${s.analysisText || ''}`,
        recommendations: s.recommendations || [],
        isUrgent: s.isUrgent,
        date: s.date,
        _fromSession: true, // flag para UI mostrar info extra
      }))
    : igentRecordsLegacy;

  const vetRecords = allRecords
    .filter(r => r.type === 'CONSULTATION')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Lista filtrada para renderizar
  const filteredRecords = activeFilter === 'igent'
    ? igentRecords.map(r => ({ ...r, _kind: 'igent' }))
    : activeFilter === 'vet'
      ? vetRecords.map(r => ({ ...r, _kind: 'vet' }))
      : [
          ...igentRecords.map(r => ({ ...r, _kind: 'igent' })),
          ...vetRecords.map(r => ({ ...r, _kind: 'vet' })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: i => ({ y: 0, opacity: 1, transition: { delay: i * 0.06 } }),
  };

  return (
    <div className="space-y-4">

      {/* Insight iGentVet */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <IgentInsightCard cat={cat} igentSessions={igentRecords} />
      </motion.div>

      {/* ── Tratamentos e Medicações ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.10 }}
        className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50"
      >
        <TreatmentTracker cat={cat} />
      </motion.div>

      {/* Bloco de histórico */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50"
      >
        {/* Título + filtros */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            Histórico de Saúde
          </h3>
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'igent', label: '🤖 IA' },
              { key: 'vet', label: '🏥 Vet' },
            ].map(f => (
              <button key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className="text-[9px] font-black px-2.5 py-1 rounded-full transition-all"
                style={activeFilter === f.key
                  ? { background: C.purple, color: '#fff' }
                  : { background: '#F4F3FF', color: C.purple }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Registros */}
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
                      ? 'Nenhuma consulta presencial registrada'
                      : 'Nenhum registro de saúde ainda'
                  }
                </p>
                {activeFilter !== 'vet' && (
                  <p className="text-[10px] text-gray-300 mt-1 font-bold">
                    Use o iGentVet para iniciar o prontuário IA
                  </p>
                )}
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
                  record._kind === 'igent'
                    ? <IgentRecord key={record.id || i} record={record} catName={cat.name} />
                    : <VetRecord key={record.id || i} record={record} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contador total */}
        {(igentRecords.length > 0 || vetRecords.length > 0) && (
          <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-wider">
            <span>{igentRecords.length} análises IA</span>
            <span>{vetRecords.length} consultas presenciais</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}