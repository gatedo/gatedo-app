import React, { useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CheckCheck, Trash2, ChevronLeft,
  ChevronRight, Brain, Pill, Syringe, Trophy, Sparkles,
  MessageCircle, Heart, AlertCircle, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import useNotifications, { NOTIF_TYPES } from '../hooks/useNotifications';
import useSensory from '../hooks/useSensory';

const C = { purple: '#6158ca', accent: '#DFFF40', bg: '#F4F3FF' };

// ─── HELPER tempo relativo ─────────────────────────────────────────────────────
const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'Agora';
  if (m < 60) return `${m}min atrás`;
  if (h < 24) return `${h}h atrás`;
  if (d === 1) return 'Ontem';
  if (d < 7)  return `${d} dias atrás`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Agrupa por data para header de seção
const groupByDay = (list) => {
  const groups = {};
  list.forEach(n => {
    const d = new Date(n.createdAt || Date.now());
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let key;
    if (d.toDateString() === today.toDateString())     key = 'Hoje';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Ontem';
    else key = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
};

// ─── ITEM DE NOTIFICAÇÃO (versão página — mais espaço) ────────────────────────
function NotifItem({ notif, onRead, onDismiss, onAction }) {
  const type  = NOTIF_TYPES[notif.type] || NOTIF_TYPES.SYSTEM;
  const isNew = !notif.read;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
      className="relative flex items-start gap-3 px-4 py-4 rounded-[20px] cursor-pointer transition-all"
      style={{
        background: isNew ? `${type.color}09` : 'white',
        border: `1.5px solid ${isNew ? type.color + '22' : '#F3F4F6'}`,
      }}
      onClick={() => { onRead(notif.id); onAction?.(notif); }}
    >
      {/* Dot não lido */}
      {isNew && (
        <div className="absolute top-4 left-2 w-2 h-2 rounded-full"
          style={{ background: type.color }} />
      )}

      {/* Ícone */}
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: type.bg }}>
        {notif.catPhotoUrl ? (
          <div className="w-full h-full rounded-2xl overflow-hidden">
            <img src={notif.catPhotoUrl} className="w-full h-full object-cover" alt="" />
          </div>
        ) : <span>{type.emoji}</span>}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ background: type.bg, color: type.color }}>
                {type.label}
              </span>
              {type.urgent && isNew && (
                <span className="text-[7px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                  ⚡ URGENTE
                </span>
              )}
            </div>

            {/* Mensagem */}
            <p className={`text-[13px] leading-snug ${isNew ? 'font-bold text-gray-800' : 'font-medium text-gray-500'}`}>
              {notif.message}
            </p>

            {/* Cat name */}
            {notif.catName && (
              <p className="text-[11px] font-bold mt-1" style={{ color: type.color }}>
                🐾 {notif.catName}{notif.catBreed ? ` · ${notif.catBreed}` : ''}
              </p>
            )}

            {/* CTA */}
            {notif.cta && (
              <button
                onClick={e => { e.stopPropagation(); onRead(notif.id); onAction?.(notif); }}
                className="mt-2 flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full transition-all active:scale-95"
                style={{ background: `${type.color}15`, color: type.color }}
              >
                {notif.cta} <ChevronRight size={10} />
              </button>
            )}
          </div>

          {/* Tempo + dismiss */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
              {timeAgo(notif.createdAt)}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onDismiss(notif.id); }}
              className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-50 transition-colors group"
            >
              <Trash2 size={10} className="text-gray-400 group-hover:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',       label: 'Todas'   },
  { id: 'urgent',    label: '⚡ Urgente' },
  { id: 'health',    label: '🏥 Saúde' },
  { id: 'ai',        label: '🤖 IA'   },
  { id: 'community', label: '💬 Social'},
];

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate();
  const touch    = useSensory();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('all');
  const [showReadFilter, setShowReadFilter] = useState(false); // false = todas | true = só não lidas

  const {
    notifications,
    unreadCount,
    urgentCount,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications(user?.id, { pollInterval: 30000 });

  // Roteamento por tipo (igual ao NotificationCenter)
  const handleAction = useCallback((notif) => {
    const petId = notif.metadata?.petId || notif.petId;

    switch (notif.type) {
      case 'MED_REMINDER':
        navigate(petId ? `/cat/${petId}?tab=SAUDE` : '/cats'); break;
      case 'IGENT_ALERT':
      case 'IGENT_PREDICTIVE':
        navigate(petId ? `/cat/${petId}?tab=SAUDE` : '/igentvet'); break;
      case 'VACCINE_DUE':
      case 'VACCINE_OVERDUE':
        navigate(petId ? `/cat/${petId}?tab=IMUNIZANTES` : '/cats'); break;
      case 'COMMUNITY_REPLY':
      case 'COMMUNITY_LIKE':
        navigate('/comunigato'); break;
      case 'GAMIFICATION':
        navigate('/tutor-profile'); break;
      default:
        if (petId) navigate(`/cat/${petId}`);
    }
  }, [navigate]);

  // Filtro por aba
  const filtered = notifications.filter(n => {
    if (showReadFilter && n.read) return false;
    switch (activeTab) {
      case 'urgent':    return NOTIF_TYPES[n.type]?.urgent;
      case 'health':    return ['MED_REMINDER','VACCINE_DUE','VACCINE_OVERDUE'].includes(n.type);
      case 'ai':        return n.type?.startsWith('IGENT');
      case 'community': return ['COMMUNITY_REPLY','COMMUNITY_LIKE'].includes(n.type);
      default:          return true;
    }
  });

  const grouped = groupByDay(filtered);

  const tabCount = (id) => {
    if (id === 'all')       return notifications.length;
    if (id === 'urgent')    return urgentCount;
    if (id === 'health')    return notifications.filter(n => ['MED_REMINDER','VACCINE_DUE','VACCINE_OVERDUE'].includes(n.type)).length;
    if (id === 'ai')        return notifications.filter(n => n.type?.startsWith('IGENT')).length;
    if (id === 'community') return notifications.filter(n => ['COMMUNITY_REPLY','COMMUNITY_LIKE'].includes(n.type)).length;
    return 0;
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: C.bg, fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Header ── */}
      <div className="px-4 pt-10 pb-5 relative"
        style={{ background: `linear-gradient(160deg, ${C.purple} 0%, #4B40C6 100%)` }}>
        {/* Orbs */}
        <div className="absolute top-[-30px] right-[-20px] w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

        <div className="max-w-[800px] mx-auto">
          {/* Topbar */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => { touch(); navigate(-1); }}
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <div className="text-center">
              <h1 className="font-black text-white text-base">Notificações</h1>
              {unreadCount > 0 && (
                <p className="text-[10px] font-bold text-white/60">
                  {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={() => { touch(); markAllAsRead(); }}
              disabled={unreadCount === 0}
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center disabled:opacity-40"
              title="Marcar todas como lidas"
            >
              <CheckCheck size={18} className="text-white" />
            </button>
          </div>

          {/* Stats row */}
          {(unreadCount > 0 || urgentCount > 0) && (
            <div className="flex gap-2 mb-4">
              {unreadCount > 0 && (
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black text-white">{unreadCount} nova{unreadCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {urgentCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-500/80 rounded-full px-3 py-1.5">
                  <AlertCircle size={11} className="text-white" />
                  <span className="text-[10px] font-black text-white">{urgentCount} urgente{urgentCount > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs (scroll horizontal) ── */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-[800px] mx-auto px-3 py-2 flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}>
          {TABS.map(t => {
            const count = tabCount(t.id);
            const active = activeTab === t.id;
            return (
              <button key={t.id}
                onClick={() => { touch(); setActiveTab(t.id); }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-all"
                style={active
                  ? { background: C.purple, color: 'white' }
                  : { background: '#F4F3FF', color: '#6B7280' }
                }>
                {t.label}
                {count > 0 && (
                  <span className="text-[8px] font-black px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none"
                    style={active
                      ? { background: 'rgba(255,255,255,0.25)', color: 'white' }
                      : { background: `${C.purple}15`, color: C.purple }
                    }>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Filtro não lidas */}
          <button
            onClick={() => { touch(); setShowReadFilter(f => !f); }}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black transition-all ml-auto"
            style={showReadFilter
              ? { background: '#DFFF40', color: '#5A7000' }
              : { background: '#F4F3FF', color: '#9CA3AF' }
            }>
            <Filter size={11} />
            Não lidas
          </button>
        </div>
      </div>

      {/* ── Lista ── */}
      <div className="max-w-[800px] mx-auto px-4 py-4 space-y-5">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (

            // Empty state
            <motion.div key="empty"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                <BellOff size={24} className="text-gray-300" />
              </div>
              <p className="font-black text-gray-400 text-sm">
                {showReadFilter ? 'Nenhuma notificação não lida' : 'Tudo em dia! 🎉'}
              </p>
              <p className="text-xs text-gray-300 font-bold mt-1">
                {activeTab !== 'all'
                  ? 'Nenhuma nesta categoria ainda'
                  : 'Quando houver alertas, eles aparecerão aqui'
                }
              </p>
            </motion.div>

          ) : (

            <motion.div key={activeTab + showReadFilter}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="space-y-5">
              {Object.entries(grouped).map(([day, items]) => (
                <div key={day}>
                  {/* Separador de data */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {day}
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  {/* Itens do dia */}
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map(notif => (
                        <NotifItem
                          key={notif.id}
                          notif={notif}
                          onRead={markAsRead}
                          onDismiss={dismiss}
                          onAction={handleAction}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}

              {/* Rodapé */}
              <div className="text-center pt-4">
                <p className="text-[10px] font-bold text-gray-300 flex items-center justify-center gap-1.5">
                  <Sparkles size={10} />
                  Powered by iGentVet
                </p>
              </div>
            </motion.div>

          )}
        </AnimatePresence>
      </div>
    </div>
  );
}