import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

// ─── TIPOS DE NOTIFICAÇÃO ─────────────────────────────────────────────────────
export const NOTIF_TYPES = {
  MED_REMINDER:    { label: 'Medicação',     emoji: '💊', color: '#D97706', bg: '#FFFBEB', urgent: true  },
  VACCINE_DUE:     { label: 'Vacina',        emoji: '💉', color: '#EC4899', bg: '#FDF2F8', urgent: true  },
  VACCINE_OVERDUE: { label: 'Vacina Vencida',emoji: '⚠️', color: '#DC2626', bg: '#FEF2F2', urgent: true  },
  IGENT_ALERT:     { label: 'iGentVet',      emoji: '🤖', color: '#6158ca', bg: '#F4F3FF', urgent: false },
  IGENT_PREDICTIVE:{ label: 'IA Preditiva',  emoji: '🧠', color: '#6158ca', bg: '#F4F3FF', urgent: true  },
  COMMUNITY_REPLY: { label: 'Comunigato',    emoji: '💬', color: '#0EA5E9', bg: '#F0F9FF', urgent: false },
  COMMUNITY_LIKE:  { label: 'Curtida',       emoji: '❤️', color: '#EC4899', bg: '#FDF2F8', urgent: false },
  VET_CONFIRM:     { label: 'Veterinário',   emoji: '🩺', color: '#16A34A', bg: '#F0FDF4', urgent: false },
  GAMIFICATION:    { label: 'Conquista',     emoji: '🏆', color: '#F59E0B', bg: '#FFFBEB', urgent: false },
  SYSTEM:          { label: 'Sistema',       emoji: '📣', color: '#6B7280', bg: '#F9FAFB', urgent: false },
};

// ─── HOOK PRINCIPAL ────────────────────────────────────────────────────────────
export default function useNotifications(userId, { pollInterval = 30000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const pollRef                           = useRef(null);

  // ── Fetch do backend ──────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/notifications?userId=${userId}&limit=30`);
      setNotifications(res.data || []);
      setError(null);
    } catch (e) {
      setError(e);
      // Fallback: mantém notificações locais geradas por calendário
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ── Polling automático ────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, pollInterval);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications, pollInterval]);

  // ── Marcar uma como lida ──────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // Reverter se falhar
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: false } : n)
      );
    }
  }, []);

  // ── Marcar todas como lidas ───────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.patch('/notifications/read-all', { userId });
    } catch {
      fetchNotifications(); // Re-fetch se falhar
    }
  }, [userId, fetchNotifications]);

  // ── Deletar notificação ───────────────────────────────────────────────────
  const dismiss = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Adicionar notificação local (ex: lembrete de medicação agendado) ──────
  const addLocal = useCallback((notif) => {
    const local = {
      id: `local-${Date.now()}`,
      ...notif,
      read: false,
      createdAt: new Date().toISOString(),
      isLocal: true,
    };
    setNotifications(prev => [local, ...prev]);
  }, []);

  // ── Derivados ─────────────────────────────────────────────────────────────
  const unreadCount  = notifications.filter(n => !n.read).length;
  const urgentCount  = notifications.filter(n => !n.read && NOTIF_TYPES[n.type]?.urgent).length;
  const grouped      = groupByDate(notifications);

  return {
    notifications,
    grouped,
    unreadCount,
    urgentCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    addLocal,
    refresh: fetchNotifications,
  };
}

// ─── HELPER: agrupa notificações por data ─────────────────────────────────────
function groupByDate(notifs) {
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  return notifs.reduce((acc, n) => {
    const d = new Date(n.createdAt); d.setHours(0,0,0,0);
    const key = d >= today     ? 'Hoje'
              : d >= yesterday ? 'Ontem'
              : 'Anteriores';
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});
}