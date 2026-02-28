import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Syringe, Pill, Sparkles, ShoppingBag, ChevronRight, BookOpen, AlertCircle, CheckCircle, Clock, Plus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : null;

const daysUntil = (d) => {
  if (!d) return null;
  const diff = new Date(d) - Date.now();
  return Math.ceil(diff / 86400000);
};

const daysAgo = (d) => {
  if (!d) return null;
  const diff = Date.now() - new Date(d);
  return Math.floor(diff / 86400000);
};

// ─── BANNER GUIA DE VACINAÇÃO ─────────────────────────────────────────────────
function VaccineBanner({ navigate }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/pedia?categoria=saude&artigo=vacinacao')}
      className="w-full rounded-[24px] overflow-hidden shadow-lg mb-6 relative"
      style={{ background: 'linear-gradient(135deg, #6158ca 0%, #4B40C6 60%, #8B5CF6 100%)' }}
    >
      {/* Orb decorativo */}
      <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-15px] left-[-15px] w-24 h-24 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #DFFF40 0%, transparent 70%)' }} />

      <div className="relative z-10 flex items-center gap-4 px-5 py-4">
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <BookOpen size={22} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-0.5">
            Gatedo Pedia
          </p>
          <p className="text-sm font-black text-white leading-snug">
            Guia Completo de Vacinação Felina
          </p>
          <p className="text-[10px] text-white/60 mt-0.5">
            Calendário, doses e o que esperar de cada vacina
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
          <ChevronRight size={16} className="text-white" />
        </div>
      </div>
    </motion.button>
  );
}

// ─── CARD DE REGISTRO ─────────────────────────────────────────────────────────
function RecordCard({ record, sec }) {
  const [expanded, setExpanded] = useState(false);
  const nextDays = daysUntil(record.nextDueDate);
  const appliedDays = daysAgo(record.date);

  const statusColor = nextDays === null ? null
    : nextDays < 0 ? '#DC2626'
    : nextDays <= 30 ? '#D97706'
    : '#16A34A';

  const statusLabel = nextDays === null ? null
    : nextDays < 0 ? `Vencida há ${Math.abs(nextDays)}d`
    : nextDays === 0 ? 'Vence hoje'
    : nextDays <= 7 ? `Vence em ${nextDays}d`
    : nextDays <= 30 ? `Vence em ${nextDays}d`
    : `Próxima em ${nextDays}d`;

  return (
    <motion.div
      layout
      className="bg-white rounded-[22px] border overflow-hidden shadow-sm"
      style={{ borderColor: statusColor ? `${statusColor}30` : '#f3f4f6' }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sec.bg}`}>
          <sec.icon size={18} className={sec.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-800 truncate">{record.title}</p>
          <p className="text-[10px] text-gray-400 font-bold">
            {fmtDate(record.date)}{appliedDays === 0 ? ' · Hoje' : appliedDays === 1 ? ' · Ontem' : appliedDays && appliedDays < 30 ? ` · ${appliedDays}d atrás` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {statusLabel && (
            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full"
              style={{ background: `${statusColor}15`, color: statusColor }}>
              {statusLabel}
            </span>
          )}
          <ChevronDown size={14} className={`text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-2 border-t border-gray-50">
              {record.veterinarian && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider w-16 flex-shrink-0">Veterinário</span>
                  <span className="text-xs font-bold text-gray-600">Dr(a). {record.veterinarian}</span>
                </div>
              )}
              {record.nextDueDate && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider w-16 flex-shrink-0">Próxima</span>
                  <span className="text-xs font-bold" style={{ color: statusColor || '#374151' }}>{fmtDate(record.nextDueDate)}</span>
                </div>
              )}
              {record.notes && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 mt-1">
                  <p className="text-[10px] text-gray-500 leading-relaxed">{record.notes}</p>
                </div>
              )}
              {/* Contexto IA */}
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50">
                <Sparkles size={10} className="text-[#6158ca]" />
                <p className="text-[9px] font-bold text-[#6158ca]/70">
                  Informação disponível para o iGentVet
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function ImmunizationModule({ cat }) {
  const navigate = useNavigate();

  const getRecords = (dbType) => {
    if (!cat?.healthRecords) return [];
    return cat.healthRecords
      .filter(r => r.type === dbType && !r.title?.toLowerCase().includes('peso'))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const sections = [
    { id: 'vaccine',   label: 'Vacinas',    action: 'Aplicar',   icon: Syringe,      color: 'text-pink-600',   bg: 'bg-pink-50',   border: 'border-pink-100',   dbType: 'VACCINE'    },
    { id: 'vermifuge', label: 'Vermífugo',  action: 'Vermifugar', icon: Pill,         color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',   dbType: 'VERMIFUGE'  },
    { id: 'parasite',  label: 'Antipulgas', action: 'Proteger',   icon: Sparkles,     color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', dbType: 'PARASITE'   },
    { id: 'medicine',  label: 'Medicações', action: 'Medicar',    icon: ShoppingBag,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100',  dbType: 'MEDICATION' },
  ];

  // Conta alertas: próximos vencimentos ou itens atrasados
  const alerts = sections.flatMap(sec =>
    getRecords(sec.dbType)
      .filter(r => r.nextDueDate)
      .map(r => ({ ...r, sec, days: daysUntil(r.nextDueDate) }))
      .filter(r => r.days !== null && r.days <= 30)
  );

  return (
    <div className="space-y-6 pb-28 px-0 pt-2">

      {/* Banner Gatedo Pedia */}
      <VaccineBanner navigate={navigate} />

      {/* Alertas de vencimento */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-[20px] px-2 py-3 flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">
              {alerts.length} lembrete{alerts.length > 1 ? 's' : ''} pendente{alerts.length > 1 ? 's' : ''}
            </p>
            {alerts.map((a, i) => (
              <p key={i} className="text-[10px] text-amber-600 font-bold">
                • {a.title}: {a.days < 0 ? `vencida há ${Math.abs(a.days)}d` : a.days === 0 ? 'vence hoje' : `vence em ${a.days}d`}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Seções */}
      {sections.map((sec) => {
        const records = getRecords(sec.dbType);
        const latest = records[0];
        const hasMore = records.length > 1;

        return (
          <div key={sec.id} className="space-y-2">
            {/* Header da seção */}
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
                onClick={() => navigate(`/cat/${cat.id}/health-new?type=${sec.id}`)}
                className={`flex items-center gap-1 text-[9px] font-black ${sec.color} bg-white border border-current px-3 py-1.5 rounded-full active:scale-95 transition-all shadow-sm`}
              >
                <Plus size={10} />
                {sec.action}
              </button>
            </div>

            {/* Sem registros */}
            {records.length === 0 && (
              <div className={`p-4 ${sec.bg} rounded-[22px] border ${sec.border} flex items-center gap-3`}>
                <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center ${sec.color} shadow-sm`}>
                  <sec.icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-tight">[PENDENTE]</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">Nenhum registro ainda</p>
                </div>
              </div>
            )}

            {/* Registros */}
            {records.length > 0 && (
              <div className="space-y-2">
                {/* Mostra o mais recente sempre + opção de expandir os demais */}
                <RecordCard record={latest} sec={sec} />
                {hasMore && (
                  <HistoryToggle records={records.slice(1)} sec={sec} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── HISTÓRICO COLAPSÁVEL ─────────────────────────────────────────────────────
function HistoryToggle({ records, sec }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-wider"
      >
        <Clock size={10} />
        {open ? 'Ocultar histórico' : `Ver histórico (${records.length} anterior${records.length > 1 ? 'es' : ''})`}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {records.map((r, i) => (
              <RecordCard key={r.id || i} record={r} sec={sec} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}