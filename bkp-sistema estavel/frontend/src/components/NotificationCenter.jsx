import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Bell, BellOff, CheckCheck, Trash2,
  ChevronRight, Brain, Stethoscope, Zap,
  Heart, MessageCircle, Trophy, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NOTIF_TYPES } from '../hooks/useNotifications';

const C = { purple: '#6158ca', accent: '#DFFF40' };

// ─── ITEM DE NOTIFICAÇÃO ──────────────────────────────────────────────────────
function NotifItem({ notif, onRead, onDismiss, onAction }) {
  const type  = NOTIF_TYPES[notif.type] || NOTIF_TYPES.SYSTEM;
  const isNew = !notif.read;

  // Formata tempo relativo
  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1)  return 'Agora';
    if (m < 60) return `${m}min`;
    if (h < 24) return `${h}h`;
    return `${d}d`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      className="relative flex items-start gap-3 px-4 py-3 rounded-[18px] cursor-pointer transition-colors"
      style={{ background: isNew ? `${type.color}08` : 'transparent' }}
      onClick={() => { onRead(notif.id); onAction?.(notif); }}
    >
      {/* Dot de não lido */}
      {isNew && (
        <div className="absolute top-3.5 left-1.5 w-1.5 h-1.5 rounded-full"
          style={{ background: type.color }} />
      )}

      {/* Ícone */}
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: type.bg }}>
        {notif.catPhotoUrl ? (
          <div className="w-full h-full rounded-2xl overflow-hidden">
            <img src={notif.catPhotoUrl} className="w-full h-full object-cover" alt="" />
          </div>
        ) : (
          <span>{type.emoji}</span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ background: type.bg, color: type.color }}>
                {type.label}
              </span>
              {type.urgent && isNew && (
                <span className="text-[7px] font-black text-red-500 bg-red-50 px-1 py-0.5 rounded-full">
                  URGENTE
                </span>
              )}
            </div>
            <p className={`text-[12px] leading-snug ${isNew ? 'font-bold text-gray-800' : 'font-medium text-gray-500'}`}>
              {notif.message}
            </p>
            {notif.catName && (
              <p className="text-[10px] font-bold mt-0.5" style={{ color: type.color }}>
                🐾 {notif.catName}
                {notif.catBreed ? ` · ${notif.catBreed}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">
              {timeAgo(notif.createdAt)}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onDismiss(notif.id); }}
              className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              <X size={9} className="text-gray-400 hover:text-red-400" />
            </button>
          </div>
        </div>

        {/* CTA inline */}
        {notif.cta && (
          <button
            onClick={e => { e.stopPropagation(); onRead(notif.id); onAction?.(notif); }}
            className="mt-2 flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full transition-all active:scale-95"
            style={{ background: `${type.color}15`, color: type.color }}
          >
            {notif.cta}
            <ChevronRight size={9} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── PAINEL PRINCIPAL ─────────────────────────────────────────────────────────
export default function NotificationCenter({
  notifications = [],
  grouped = {},
  unreadCount = 0,
  urgentCount = 0,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  userPoints = 0,
  userLevel = null,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'urgent' | 'ai'

  const handleAction = (notif) => {
    // metadata pode ter petId direto ou vir do notif.petId
    const petId = notif.metadata?.petId || notif.petId;

    switch (notif.type) {
      case 'MED_REMINDER':
        // Tratamento → perfil do gato (aba saúde está em /cat/:id)
        if (petId) navigate(`/cat/${petId}`);
        else navigate('/cats');
        break;
      case 'IGENT_ALERT':
      case 'IGENT_PREDICTIVE':
        if (petId) navigate(`/cat/${petId}`);
        else navigate('/igentvet');
        break;
      case 'VACCINE_DUE':
      case 'VACCINE_OVERDUE':
        // Rota real da health form
        if (petId) navigate(`/cat/${petId}/health-new`);
        else navigate('/cats');
        break;
      case 'COMMUNITY_REPLY':
      case 'COMMUNITY_LIKE':
        navigate('/comunigato');
        break;
      case 'VET_CONFIRM':
        navigate('/cats');
        break;
      case 'GAMIFICATION':
        // Abre drawer de gamificação — fecha o painel primeiro
        onClose?.();
        // Dispatch evento customizado para o Header abrir a gaveta
        window.dispatchEvent(new CustomEvent('open-gamif-drawer'));
        return;
      default:
        if (petId) navigate(`/cat/${petId}`);
        break;
    }
    onClose?.();
  };

  const tabs = [
    { id: 'all',    label: 'Todos',   count: notifications.length },
    { id: 'urgent', label: 'Urgente', count: urgentCount },
    { id: 'ai',     label: 'IA',      count: notifications.filter(n => n.type?.startsWith('IGENT')).length },
  ];

  const filtered = notifications.filter(n => {
    if (activeTab === 'urgent') return NOTIF_TYPES[n.type]?.urgent;
    if (activeTab === 'ai')     return n.type?.startsWith('IGENT');
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="absolute right-0 top-14 w-80 bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden z-[60] origin-top-right"
      onClick={e => e.stopPropagation()}
    >
      {/* ── Header do painel ── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: C.purple }} />
            <span className="text-sm font-black text-gray-800">Notificações</span>
            {unreadCount > 0 && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                style={{ background: urgentCount > 0 ? '#DC2626' : C.purple }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={onMarkAllAsRead}
                className="flex items-center gap-1 text-[9px] font-black text-gray-400 hover:text-[#6158ca] transition-colors">
                <CheckCheck size={12} />
                Ler tudo
              </button>
            )}
            <button onClick={onClose}
              className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X size={12} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-1.5 rounded-xl text-[9px] font-black transition-all"
              style={activeTab === tab.id
                ? { background: C.purple, color: 'white' }
                : { background: '#F4F3FF', color: '#6B7280' }
              }
            >
              {tab.label}
              {tab.count > 0 && ` (${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pontos / Gamificação teaser ── */}
      {userLevel && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-2xl flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #6158ca15 0%, #DFFF4020 100%)', border: '1px solid #6158ca15' }}>
          <div className="w-8 h-8 rounded-xl bg-[#6158ca] flex items-center justify-center flex-shrink-0">
            <Trophy size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Nível atual</p>
            <p className="text-xs font-black text-[#6158ca]">{userLevel.label}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-gray-400">pontos</p>
            <p className="text-sm font-black text-[#6158ca]">{userPoints.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      )}

      {/* ── Lista ── */}
      <div className="max-h-[400px] overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <BellOff size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-400">
              {activeTab === 'urgent' ? 'Nenhum alerta urgente' : 'Tudo em dia! 🎉'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {Object.entries(grouped).map(([date, items]) => {
              const visibleItems = items.filter(n => {
                if (activeTab === 'urgent') return NOTIF_TYPES[n.type]?.urgent;
                if (activeTab === 'ai')     return n.type?.startsWith('IGENT');
                return true;
              });
              if (visibleItems.length === 0) return null;
              return (
                <div key={date}>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider px-4 py-1.5">
                    {date}
                  </p>
                  {visibleItems.map(n => (
                    <NotifItem
                      key={n.id}
                      notif={n}
                      onRead={onMarkAsRead}
                      onDismiss={onDismiss}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => { navigate('/notifications'); onClose?.(); }}
          className="text-[10px] font-black text-[#6158ca] hover:underline"
        >
          Ver todas
        </button>
        <div className="flex items-center gap-1">
          <Sparkles size={10} className="text-[#6158ca]" />
          <span className="text-[9px] font-bold text-gray-400">Powered by iGentVet</span>
        </div>
      </div>
    </motion.div>
  );
}