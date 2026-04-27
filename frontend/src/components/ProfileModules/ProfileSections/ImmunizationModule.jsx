import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Syringe,
  Pill,
  Sparkles,
  ShoppingBag,
  Plus,
  Clock,
  ChevronDown,
  AlertCircle,
  Shield,
  BellRing,
  Activity,
  BookOpen,
  HeartPulse,
} from 'lucide-react';

function fmtDate(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

function daysUntil(date) {
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

function getStatusMeta(days) {
  if (days === null) {
    return {
      label: 'Sem próxima data',
      color: '#6B7280',
      bg: 'bg-gray-50',
      border: 'border-gray-100',
      chip: 'bg-gray-100 text-gray-500',
    };
  }

  if (days < 0) {
    return {
      label: `Vencido há ${Math.abs(days)}d`,
      color: '#DC2626',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      chip: 'bg-rose-100 text-rose-700',
    };
  }

  if (days === 0) {
    return {
      label: 'Vence hoje',
      color: '#D97706',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      chip: 'bg-amber-100 text-amber-700',
    };
  }

  if (days <= 30) {
    return {
      label: `Vence em ${days}d`,
      color: '#D97706',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      chip: 'bg-amber-100 text-amber-700',
    };
  }

  return {
    label: `Em dia · ${days}d`,
    color: '#059669',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    chip: 'bg-emerald-100 text-emerald-700',
  };
}

function ProtocolBanners({ onOpenVaccine, onOpenParasite }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onOpenVaccine}
        className="relative overflow-hidden rounded-[24px] p-4 text-left bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white shadow-lg active:scale-[0.98] transition"
      >
        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/70 mb-1">
            Guia oficial
          </p>
          <h3 className="text-sm font-black flex items-center gap-2">
            <Syringe size={16} />
            Vacinação Felina
          </h3>
          <p className="text-[11px] text-white/85 mt-2 leading-relaxed max-w-[90%]">
            Calendário essencial, reforços e atenção à FeLV.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 border border-white/15 rounded-full px-3 py-1.5">
            <BookOpen size={12} />
            <span className="text-[10px] font-black uppercase tracking-wide">Abrir guia</span>
          </div>
        </div>

        <Syringe size={88} className="absolute -right-4 -bottom-4 text-white/10 rotate-[-18deg]" />
      </button>

      <button
        type="button"
        onClick={onOpenParasite}
        className="relative overflow-hidden rounded-[24px] p-4 text-left bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg active:scale-[0.98] transition"
      >
        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/70 mb-1">
            Guia oficial
          </p>
          <h3 className="text-sm font-black flex items-center gap-2">
            <Shield size={16} />
            Vermifugação & Antiparasitário
          </h3>
          <p className="text-[11px] text-white/85 mt-2 leading-relaxed max-w-[90%]">
            Orientação preventiva para vermífugo, pulgas e proteção contínua.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 border border-white/15 rounded-full px-3 py-1.5">
            <BookOpen size={12} />
            <span className="text-[10px] font-black uppercase tracking-wide">Abrir guia</span>
          </div>
        </div>

        <Sparkles size={88} className="absolute -right-4 -bottom-4 text-white/10 rotate-[12deg]" />
      </button>
    </div>
  );
}

function SnapshotCard({ icon: Icon, label, value, sub, tone = 'gray' }) {
  const toneMap = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
    gray: 'bg-white border-gray-100 text-gray-700',
  };

  return (
    <div className={`rounded-[20px] border px-4 py-3 ${toneMap[tone] || toneMap.gray}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-[12px] bg-white flex items-center justify-center shadow-sm">
          <Icon size={15} />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em]">{label}</p>
      </div>

      <p className="text-lg font-black leading-none">{value}</p>
      {sub ? <p className="text-[10px] mt-1 font-bold opacity-80">{sub}</p> : null}
    </div>
  );
}

function RecordCard({ record, sec, isTreatment = false }) {
  const [expanded, setExpanded] = useState(false);
  const days = daysUntil(record?.nextDueDate);
  const status = getStatusMeta(days);

  return (
    <motion.div layout className="rounded-[22px] bg-white border border-gray-100 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 text-left flex items-start justify-between gap-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl ${sec.bg} border ${sec.border} flex items-center justify-center shadow-sm`}>
            <sec.icon size={18} className={sec.color} />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-black text-gray-800 leading-tight truncate">
              {record?.title || sec.label}
              {isTreatment && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[8px] font-black uppercase">
                  Em andamento
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">
                {fmtDate(record?.date)}
              </span>
              {record?.nextDueDate ? (
                <span className={`text-[9px] font-black px-2 py-1 rounded-full ${status.chip}`}>
                  {status.label}
                </span>
              ) : (
                <span className="text-[9px] font-black px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                  Sem reforço agendado
                </span>
              )}
            </div>
          </div>
        </div>

        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
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
            <div className="px-4 pb-4 pt-0 border-t border-gray-50 space-y-2.5">
              {record?.veterinarian ? (
                <div className="pt-3 flex items-center gap-2">
                  <span className="w-16 flex-shrink-0 text-[9px] font-black uppercase tracking-wider text-gray-400">
                    Vet
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    Dr(a). {record.veterinarian}
                  </span>
                </div>
              ) : null}

              {record?.nextDueDate ? (
                <div className="flex items-center gap-2">
                  <span className="w-16 flex-shrink-0 text-[9px] font-black uppercase tracking-wider text-gray-400">
                    Próxima
                  </span>
                  <span className="text-xs font-bold" style={{ color: status.color }}>
                    {fmtDate(record.nextDueDate)}
                  </span>
                </div>
              ) : null}

              {record?.notes ? (
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-gray-600 leading-relaxed">{record.notes}</p>
                </div>
              ) : null}

              <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                <Sparkles size={10} className="text-[#8B4AFF]" />
                <p className="text-[9px] font-bold text-[#8B4AFF]/75">
                  Registro útil para score preventivo e leitura do iGentVet
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryToggle({ records, sec }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-wider"
      >
        <Clock size={10} />
        {open ? 'Ocultar histórico' : `Ver histórico (${records.length})`}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {records.map((r, i) => (
              <RecordCard key={r.id || i} record={r} sec={sec} isTreatment={r._isTreatment} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ImmunizationModule({ cat, treatments = [] }) {
  const navigate = useNavigate();

  const getRecords = (dbType) => {
    if (!cat?.healthRecords) return [];
    return cat.healthRecords
      .filter((r) => r.type === dbType && !r.title?.toLowerCase().includes('peso'))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Filtrar tratamentos ativos
  const activeTreatments = useMemo(() => {
    return treatments.filter(t => t.active !== false && t.status !== 'completed');
  }, [treatments]);

  const sections = [
    {
      id: 'vaccine',
      label: 'Vacinas',
      action: 'Aplicar',
      icon: Syringe,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-100',
      dbType: 'VACCINE',
    },
    {
      id: 'vermifuge',
      label: 'Vermífugo',
      action: 'Vermifugar',
      icon: Pill,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      dbType: 'VERMIFUGE',
    },
    {
      id: 'parasite',
      label: 'Antipulgas',
      action: 'Proteger',
      icon: Sparkles,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      dbType: 'PARASITE',
    },
    {
      id: 'medicine',
      label: 'Medicações',
      action: 'Medicar',
      icon: ShoppingBag,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      dbType: 'MEDICATION',
    },
  ];

  // Para a seção de medicações, combinar registros históricos + tratamentos ativos
  const medicationItems = useMemo(() => {
    const records = getRecords('MEDICATION');
    const treatmentItems = activeTreatments.map(t => ({
      ...t,
      id: t.id,
      title: t.title,
      date: t.startDate,
      nextDueDate: t.nextDoseDate,
      notes: t.notes,
      veterinarian: t.veterinarian,
      clinicName: t.clinicName,
      _isTreatment: true,
    }));
    // Ordenar por data decrescente
    return [...records, ...treatmentItems].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [cat, activeTreatments]);

  const allRecords = useMemo(
    () => sections.flatMap((sec) => {
      if (sec.id === 'medicine') return medicationItems.map(r => ({ ...r, sec }));
      return getRecords(sec.dbType).map((r) => ({ ...r, sec }));
    }),
    [cat, medicationItems]
  );

  const alerts = useMemo(
    () =>
      allRecords
        .filter((r) => r.nextDueDate)
        .map((r) => ({ ...r, days: daysUntil(r.nextDueDate) }))
        .filter((r) => r.days !== null && r.days <= 30)
        .sort((a, b) => a.days - b.days),
    [allRecords]
  );

  const coveredCount = useMemo(
    () => sections.filter((sec) => {
      if (sec.id === 'medicine') return medicationItems.length > 0;
      return getRecords(sec.dbType).length > 0;
    }).length,
    [cat, medicationItems]
  );

  const nextDue = alerts.length > 0 ? alerts[0] : null;

  const preventiveStatus = useMemo(() => {
    if (alerts.some((a) => a.days < 0)) {
      return { label: 'Sob atenção', tone: 'rose', sub: 'Há item preventivo vencido' };
    }
    if (alerts.length > 0) {
      return { label: 'Monitorado', tone: 'amber', sub: 'Há reforço próximo' };
    }
    if (coveredCount > 0) {
      return { label: 'Em dia', tone: 'emerald', sub: 'Sem pendências próximas' };
    }
    return { label: 'Sem base', tone: 'gray', sub: 'Ainda sem registros preventivos' };
  }, [alerts, coveredCount]);

  return (
    <div className="space-y-6 pb-28 px-0 pt-2">
      <ProtocolBanners
        onOpenVaccine={() => navigate('/wiki-vaccines?mode=vaccine')}
        onOpenParasite={() => navigate('/wiki-vaccines?mode=parasite')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SnapshotCard
          icon={Shield}
          label="Cobertura"
          value={`${coveredCount}/4`}
          sub="Frentes preventivas com registro"
          tone={coveredCount >= 3 ? 'emerald' : coveredCount >= 1 ? 'amber' : 'gray'}
        />

        <SnapshotCard
          icon={BellRing}
          label="Próximo reforço"
          value={
            nextDue
              ? nextDue.days < 0
                ? `${Math.abs(nextDue.days)}d atrasado`
                : nextDue.days === 0
                ? 'Hoje'
                : `${nextDue.days}d`
              : '—'
          }
          sub={nextDue ? nextDue.title : 'Sem próximo vencimento'}
          tone={nextDue ? (nextDue.days < 0 ? 'rose' : nextDue.days <= 30 ? 'amber' : 'emerald') : 'gray'}
        />

        <SnapshotCard
          icon={HeartPulse}
          label="Status preventivo"
          value={preventiveStatus.label}
          sub={preventiveStatus.sub}
          tone={preventiveStatus.tone}
        />
      </div>

      {alerts.length > 0 && (
        <div id="immunization-alerts" className="bg-amber-50 border border-amber-100 rounded-[22px] px-4 py-3 flex items-start gap-3 gatedo-scroll-target">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">
              {alerts.length} lembrete{alerts.length > 1 ? 's' : ''} pendente{alerts.length > 1 ? 's' : ''}
            </p>

            {alerts.map((a, i) => (
              <p key={i} className="text-[10px] text-amber-700 font-bold leading-relaxed">
                • {a.title}: {a.days < 0 ? `vencido há ${Math.abs(a.days)}d` : a.days === 0 ? 'vence hoje' : `vence em ${a.days}d`}
              </p>
            ))}
          </div>
        </div>
      )}

      {sections.map((sec) => {
        const isMedicineSection = sec.id === 'medicine';
        const records = isMedicineSection ? medicationItems : getRecords(sec.dbType);
        const latest = records[0];
        const hasMore = records.length > 1;

        return (
          <div key={sec.id} className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <sec.icon size={13} className={sec.color} />
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${sec.color}`}>
                  {sec.label}
                </h3>

                {records.length > 0 && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${sec.bg} ${sec.color}`}>
                    {records.length}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/cat/${cat.id}/health-new?type=${sec.id}`)}
                className={`flex items-center gap-1 text-[9px] font-black ${sec.color} bg-white border border-current px-3 py-1.5 rounded-full active:scale-95 transition-all shadow-sm`}
              >
                <Plus size={10} />
                {sec.action}
              </button>
            </div>

            {records.length === 0 && (
              <div className={`p-4 ${sec.bg} rounded-[22px] border ${sec.border} flex items-center gap-3`}>
                <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center ${sec.color} shadow-sm`}>
                  <sec.icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-tight">[PENDENTE]</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Nenhum registro ainda</p>
                </div>
              </div>
            )}

            {records.length > 0 && (
              <div className="space-y-2">
                <RecordCard record={latest} sec={sec} isTreatment={latest._isTreatment} />
                {hasMore && <HistoryToggle records={records.slice(1)} sec={sec} />}
              </div>
            )}
          </div>
        );
      })}

      <div className="rounded-[22px] bg-[#F4F3FF] border border-[#8B4AFF18] px-4 py-3 flex items-start gap-2">
        <Activity size={14} className="text-[#8B4AFF] mt-0.5" />
        <div>
          <p className="text-[10px] font-black text-[#6D28D9] uppercase tracking-wider">
            Score, XPT, XPG e iGent
          </p>
          <p className="text-[10px] text-gray-600 leading-relaxed mt-0.5">
            O ganho real deve continuar acontecendo no salvamento do registro. Cada vacina, vermífugo,
            antiparasitário ou medicação fortalece o histórico preventivo do gato, contribui para a leitura
            do score de saúde e alimenta o contexto clínico do iGentVet.
          </p>
        </div>
      </div>
    </div>
  );
}
