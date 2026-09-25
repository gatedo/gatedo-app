import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Syringe, Bug, Pill, Scale, CalendarClock, Check, Clock3 } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';

const C = { purple: '#8B4AFF' };

const TYPE_ICON = { VACCINE: Syringe, VERMIFUGE: Pill, PARASITE: Bug, MEDICATION: Pill, WEIGHT: Scale };
const TYPE_ROUTE = { VACCINE: 'vaccine', VERMIFUGE: 'vermifuge', PARASITE: 'parasite', MEDICATION: 'medicine' };

const URGENCY_STYLE = {
  atrasado: { bg: '#FEF2F2', color: '#DC2626', label: 'Atrasado' },
  esta_semana: { bg: '#FFFBEB', color: '#D97706', label: 'Esta semana' },
  em_breve: { bg: '#F5F3FF', color: '#8B4AFF', label: 'Em breve' },
};

function formatDue(dueDate) {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'amanhã';
  if (diffDays === -1) return 'ontem';
  if (diffDays > 0) return `em ${diffDays} dias`;
  return `há ${Math.abs(diffDays)} dias`;
}

// "Próximos cuidados" — home (agregado, todos os gatos) e aba Saúde
// (catId fixo). Cada item: Feito (abre registro pré-preenchido) ou Adiar.
export default function UpcomingCareBlock({ catId, onWeightFeito, limit = 3 }) {
  const navigate = useNavigate();
  const touch = useSensory();
  const [items, setItems] = useState(null);
  const [postponingId, setPostponingId] = useState(null);

  const load = () => {
    api.get('/reminders/upcoming').then((r) => {
      const data = r.data || {};
      if (catId) {
        setItems((data[catId] || []).slice(0, limit));
      } else {
        const all = Object.values(data).flat();
        all.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setItems(all.slice(0, limit));
      }
    }).catch(() => setItems([]));
  };

  useEffect(() => { load(); }, [catId]); // eslint-disable-line

  const handleFeito = (item) => {
    touch('success');
    if (item.type === 'WEIGHT') {
      if (onWeightFeito) onWeightFeito(item.catId);
      else navigate('/health');
      return;
    }
    const routeType = TYPE_ROUTE[item.type] || 'medicine';
    navigate(`/cat/${item.catId}/health-new?type=${routeType}&reminderId=${item.id}`);
  };

  const handleAdiar = async (item, days) => {
    touch('light');
    setPostponingId(null);
    await api.patch(`/reminders/${item.id}/postpone`, { days }).catch(() => {});
    load();
  };

  if (items === null) {
    return <div className="h-24 rounded-[24px] bg-gray-100 animate-pulse" />;
  }

  return (
    <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <CalendarClock size={13} style={{ color: C.purple }} />
        <p className="text-[11px] font-black text-gray-700 uppercase tracking-wide">Próximos cuidados</p>
      </div>

      {items.length === 0 ? (
        <p className="text-[12px] font-medium text-gray-400 py-3 text-center">
          Tudo em dia. Registre o próximo cuidado e a gente avisa.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type] || CalendarClock;
            const urgency = URGENCY_STYLE[item.urgency] || URGENCY_STYLE.em_breve;
            return (
              <div key={item.id} className="rounded-2xl p-3" style={{ background: '#FAFAFC' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: urgency.bg }}>
                    <Icon size={15} style={{ color: urgency.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-gray-800 truncate">
                      {item.typeLabel}{!catId && ` · ${item.catName}`}
                    </p>
                    <p className="text-[10px] font-bold" style={{ color: urgency.color }}>
                      {urgency.label} · {formatDue(item.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={() => handleFeito(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl font-black text-[10px] text-white"
                    style={{ background: C.purple }}
                  >
                    <Check size={11} /> Feito
                  </button>
                  <div className="relative flex-1">
                    <button
                      onClick={() => setPostponingId(postponingId === item.id ? null : item.id)}
                      className="w-full flex items-center justify-center gap-1 py-2 rounded-xl font-black text-[10px] text-gray-500 bg-white border border-gray-100"
                    >
                      <Clock3 size={11} /> Adiar
                    </button>
                    <AnimatePresence>
                      {postponingId === item.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10 w-28"
                        >
                          <button onClick={() => handleAdiar(item, 3)} className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
                            3 dias
                          </button>
                          <button onClick={() => handleAdiar(item, 7)} className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50">
                            1 semana
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
