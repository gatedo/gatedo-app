import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
  Trophy,
  Sparkles,
  AlertTriangle,
  Pill,
  Syringe,
  Brain,
  HeartPulse,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NOTIF_TYPES } from '../hooks/useNotifications';

const C = { purple: '#8B4AFF', accent: '#DFFF40' };

function getNotifVisual(typeKey) {
  const type = NOTIF_TYPES[typeKey] || NOTIF_TYPES.SYSTEM;

  if (typeKey === 'MED_REMINDER') return { ...type, icon: Pill, strong: true };
  if (typeKey === 'VACCINE_DUE' || typeKey === 'VACCINE_OVERDUE') return { ...type, icon: Syringe, strong: true };
  if (typeKey === 'IGENT_ALERT' || typeKey === 'IGENT_PREDICTIVE') return { ...type, icon: Brain, strong: false };
  if (typeKey === 'COMMUNITY_REPLY' || typeKey === 'COMMUNITY_LIKE') return { ...type, icon: HeartPulse, strong: false };
  if (typeKey === 'GAMIFICATION') return { ...type, icon: Trophy, strong: false };

  return { ...type, icon: Activity, strong: false };
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Agora';
  if (m < 60) return `${m}min`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

function HealthAlertCard({ notif, onRead, onDismiss, onAction }) {
  const visual = getNotifVisual(notif.type);
  const Icon = visual.icon;
  const isNew = !notif.read;

  const isCritical =
    notif.type === 'VACCINE_OVERDUE' ||
    notif.type === 'MED_REMINDER' ||
    notif.type === 'IGENT_PREDICTIVE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      className="relative rounded-[20px] border overflow-hidden"
      style={{
        background: isCritical
          ? 'linear-gradient(180deg, rgba(255,245,245,1) 0%, rgba(255,255,255,1) 100%)'
          : isNew
            ? `${visual.color}08`
            : '#fff',
        borderColor: isCritical ? '#FECACA' : isNew ? `${visual.color}20` : '#F3F4F6',
      }}
    >
      {isNew && (
        <div
          className="absolute top-3 left-3 w-2 h-2 rounded-full"
          style={{ background: visual.color }}
        />
      )}

      <div
        className="px-4 py-3 cursor-pointer"
        onClick={() => {
          onRead(notif.id);
          onAction?.(notif);
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: visual.bg }}
          >
            {notif.catPhotoUrl ? (
              <div className="w-full h-full rounded-2xl overflow-hidden">
                <img src={notif.catPhotoUrl} className="w-full h-full object-cover" alt="" />
              </div>
            ) : (
              <Icon size={18} style={{ color: visual.color }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span
                className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: visual.bg, color: visual.color }}
              >
                {visual.label}
              </span>

              {visual.urgent && (
                <span className="text-[7px] font-black text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                  URGENTE
                </span>
              )}

              {isCritical && (
                <span className="text-[7px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                  AÇÃO
                </span>
              )}
            </div>

            <p className={`text-[12px] leading-snug ${isNew ? 'font-bold text-gray-800' : 'font-medium text-gray-500'}`}>
              {notif.message}
            </p>

            {notif.catName && (
              <p className="text-[10px] font-bold mt-1" style={{ color: visual.color }}>
                🐾 {notif.catName}
                {notif.catBreed ? ` · ${notif.catBreed}` : ''}
              </p>
            )}

            {notif.cta && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRead(notif.id);
                  onAction?.(notif);
                }}
                className="mt-2 flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full active:scale-95"
                style={{ background: `${visual.color}15`, color: visual.color }}
              >
                {notif.cta}
                <ChevronRight size={10} />
              </button>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-[9px] text-gray-400 font-bold whitespace-nowrap">
              {timeAgo(notif.createdAt)}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notif.id);
              }}
              className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              <X size={9} className="text-gray-400 hover:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickHealthSummary({ notifications }) {
  const meds = notifications.filter((n) => n.type === 'MED_REMINDER').length;
  const vaccines = notifications.filter(
    (n) => n.type === 'VACCINE_DUE' || n.type === 'VACCINE_OVERDUE'
  ).length;
  const ia = notifications.filter(
    (n) => n.type === 'IGENT_ALERT' || n.type === 'IGENT_PREDICTIVE'
  ).length;

  if (meds + vaccines + ia === 0) return null;

  return (
    <div
      className="mx-3 mt-3 rounded-[20px] border px-3 py-3"
      style={{
        background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)',
        borderColor: '#FED7AA',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert size={14} className="text-amber-600" />
        <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
          Resumo de Saúde
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[14px] bg-white border border-amber-100 px-2 py-2 text-center">
          <p className="text-[8px] font-black text-gray-400 uppercase">Doses</p>
          <p className="text-sm font-black text-amber-700">{meds}</p>
        </div>
        <div className="rounded-[14px] bg-white border border-amber-100 px-2 py-2 text-center">
          <p className="text-[8px] font-black text-gray-400 uppercase">Vacinas</p>
          <p className="text-sm font-black text-amber-700">{vaccines}</p>
        </div>
        <div className="rounded-[14px] bg-white border border-amber-100 px-2 py-2 text-center">
          <p className="text-[8px] font-black text-gray-400 uppercase">IA</p>
          <p className="text-sm font-black text-amber-700">{ia}</p>
        </div>
      </div>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState('all');

  const handleAction = (notif) => {
    const petId = notif.petId || notif.metadata?.petId || notif.catId || notif.metadata?.catId || null;
    const goCat = (tab, hash, state = {}) => {
      if (!petId) return false;
      navigate(`/cat/${petId}?tab=${tab}${hash ? `#${hash}` : ''}`, {
        state: {
          openHealthTab: tab === 'SAUDE',
          scrollTarget: hash || null,
          highlightTarget: hash || null,
          ...state,
        },
      });
      return true;
    };

    switch (notif.type) {
      case 'MED_REMINDER':
        if (!goCat('SAUDE', 'health-treatments')) navigate('/cats');
        break;

      case 'IGENT_ALERT':
      case 'IGENT_PREDICTIVE':
        if (!goCat('SAUDE', 'health-predictive')) navigate('/igentvet');
        break;

      case 'VACCINE_DUE':
      case 'VACCINE_OVERDUE':
        if (!goCat('IMUNIZANTES', 'immunization-alerts')) navigate('/cats');
        break;

      case 'COMMUNITY_REPLY':
      case 'COMMUNITY_LIKE':
        navigate('/comunigato');
        break;

      case 'GAMIFICATION':
        onClose?.();
        window.dispatchEvent(new CustomEvent('open-gamif-drawer'));
        return;

      default:
        if (petId) navigate(`/cat/${petId}`);
        break;
    }

    onClose?.();
  };

  const tabs = [
    { id: 'all', label: 'Todos', count: notifications.length },
    {
      id: 'health',
      label: 'Saúde',
      count: notifications.filter((n) =>
        ['MED_REMINDER', 'VACCINE_DUE', 'VACCINE_OVERDUE', 'IGENT_ALERT', 'IGENT_PREDICTIVE'].includes(n.type)
      ).length,
    },
    { id: 'urgent', label: 'Urgente', count: urgentCount },
  ];

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'urgent') {
      return notifications.filter((n) => !n.read && NOTIF_TYPES[n.type]?.urgent);
    }

    if (activeTab === 'health') {
      return notifications.filter((n) =>
        ['MED_REMINDER', 'VACCINE_DUE', 'VACCINE_OVERDUE', 'IGENT_ALERT', 'IGENT_PREDICTIVE'].includes(n.type)
      );
    }

    return notifications;
  }, [notifications, activeTab]);

  const visibleGrouped = useMemo(() => {
    if (activeTab === 'all') return grouped;

    return filteredNotifications.reduce((acc, notif) => {
      const date = (() => {
        const d = new Date(notif.createdAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const cmp = new Date(d);
        cmp.setHours(0, 0, 0, 0);

        if (cmp.getTime() === today.getTime()) return 'Hoje';
        if (cmp.getTime() === yesterday.getTime()) return 'Ontem';
        return 'Anteriores';
      })();

      if (!acc[date]) acc[date] = [];
      acc[date].push(notif);
      return acc;
    }, {});
  }, [filteredNotifications, grouped, activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="fixed bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden z-[60] transform-gpu"
      style={{ top: 72, right: 16, left: 16, maxWidth: 380, marginLeft: 'auto', willChange: 'transform, opacity' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: C.purple }} />
            <span className="text-sm font-black text-gray-800">Notificações</span>
            {unreadCount > 0 && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                style={{ background: urgentCount > 0 ? '#DC2626' : C.purple }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 text-[9px] font-black text-gray-400 hover:text-[#8B4AFF] transition-colors"
              >
                <CheckCheck size={12} />
                Ler tudo
              </button>
            )}

            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={12} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-1.5 rounded-xl text-[9px] font-black transition-all"
              style={
                activeTab === tab.id
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

      {userLevel && (
        <div
          className="mx-3 mt-3 px-3 py-2.5 rounded-2xl flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #8B4AFF15 0%, #DFFF4020 100%)',
            border: '1px solid #8B4AFF15',
          }}
        >
          <div className="w-8 h-8 rounded-xl bg-[#8B4AFF] flex items-center justify-center flex-shrink-0">
            <Trophy size={14} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Nível atual</p>
            <p className="text-xs font-black text-[#8B4AFF]">{userLevel.label}</p>
          </div>

          <div className="text-right">
            <p className="text-[9px] font-bold text-gray-400">pontos</p>
            <p className="text-sm font-black text-[#8B4AFF]">{userPoints.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      )}

      <QuickHealthSummary notifications={filteredNotifications} />

      <div className="max-h-[430px] overflow-y-auto overscroll-contain py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-10">
            <BellOff size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-400">
              {activeTab === 'urgent' ? 'Nenhum alerta urgente' : 'Tudo em dia! 🎉'}
            </p>
          </div>
        ) : (
          <>
            {Object.entries(visibleGrouped).map(([date, items]) => (
              <div key={date}>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider px-4 py-1.5">
                  {date}
                </p>

                <div className="px-2 space-y-2 pb-2">
                  {items.map((notif) => (
                    <HealthAlertCard
                      key={notif.id}
                      notif={notif}
                      onRead={onMarkAsRead}
                      onDismiss={onDismiss}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="border-t border-gray-50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            navigate('/notifications');
            onClose?.();
          }}
          className="text-[10px] font-black text-[#8B4AFF] hover:underline"
        >
          Ver todas
        </button>

        <div className="flex items-center gap-1">
          <Sparkles size={10} className="text-[#8B4AFF]" />
          <span className="text-[9px] font-bold text-gray-400">Powered by iGentVet</span>
        </div>
      </div>
    </motion.div>
  );
}
