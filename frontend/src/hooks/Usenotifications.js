import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

// ─── TIPOS DE NOTIFICAÇÃO ─────────────────────────────────────────────────────
export const NOTIF_TYPES = {
  MED_REMINDER:    { label: 'Medicação',      emoji: '💊', color: '#D97706', bg: '#FFFBEB', urgent: true  },
  VACCINE_DUE:     { label: 'Vacina',         emoji: '💉', color: '#EC4899', bg: '#FDF2F8', urgent: true  },
  VACCINE_OVERDUE: { label: 'Vacina Vencida', emoji: '⚠️', color: '#DC2626', bg: '#FEF2F2', urgent: true  },
  IGENT_ALERT:     { label: 'iGentVet',       emoji: '🤖', color: '#8B4AFF', bg: '#F4F3FF', urgent: false },
  IGENT_PREDICTIVE:{ label: 'IA Preditiva',   emoji: '🧠', color: '#8B4AFF', bg: '#F4F3FF', urgent: true  },
  COMMUNITY_REPLY: { label: 'Comunigato',     emoji: '💬', color: '#0EA5E9', bg: '#F0F9FF', urgent: false },
  COMMUNITY_LIKE:  { label: 'Curtida',        emoji: '❤️', color: '#EC4899', bg: '#FDF2F8', urgent: false },
  VET_CONFIRM:     { label: 'Veterinário',    emoji: '🩺', color: '#16A34A', bg: '#F0FDF4', urgent: false },
  GAMIFICATION:    { label: 'Conquista',      emoji: '🏆', color: '#F59E0B', bg: '#FFFBEB', urgent: false },
  SYSTEM:          { label: 'Sistema',        emoji: '📣', color: '#6B7280', bg: '#F9FAFB', urgent: false },
};

const VACCINE_ALERT_WINDOW_DAYS = 30;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function normalizeDateKey(date) {
  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return 'unknown';
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildSyntheticNotificationId(kind, petId, recordId, nextDueDate) {
  return `synthetic:${kind}:${petId || 'unknown'}:${recordId || 'unknown'}:${normalizeDateKey(nextDueDate)}`;
}

function sortByCreatedAtDesc(list) {
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function dedupeNotifications(list) {
  const seen = new Set();
  const deduped = [];

  for (const item of list) {
    const key =
      item.id ||
      `${item.type}:${item.petId || item.metadata?.petId || 'unknown'}:${item.message || ''}:${normalizeDateKey(item.createdAt)}`;

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

async function fetchSyntheticVaccineNotifications() {
  try {
    const petsRes = await api.get('/pets');
    const pets = safeArray(petsRes.data).filter((p) => !p?.isArchived && !p?.isMemorial);

    const synthetic = [];

    await Promise.all(
      pets.map(async (pet) => {
        try {
          const hrRes = await api.get(`/health-records?petId=${pet.id}`);
          const records = safeArray(hrRes.data);

          const vaccines = records.filter(
            (r) => r?.type === 'VACCINE' && r?.nextDueDate
          );

          for (const record of vaccines) {
            const dueInDays = daysUntil(record.nextDueDate);

            if (dueInDays === null) continue;

            if (dueInDays > VACCINE_ALERT_WINDOW_DAYS) continue;

            const isOverdue = dueInDays < 0;
            const type = isOverdue ? 'VACCINE_OVERDUE' : 'VACCINE_DUE';

            const message = isOverdue
              ? `${record.title || 'Vacina'} de ${pet.name} está vencida há ${Math.abs(dueInDays)} dia(s)`
              : `${record.title || 'Vacina'} de ${pet.name} vence em ${dueInDays} dia(s)`;

            synthetic.push({
              id: buildSyntheticNotificationId(type, pet.id, record.id, record.nextDueDate),
              type,
              message,
              read: false,
              createdAt: record.updatedAt || record.createdAt || new Date().toISOString(),
              petId: pet.id,
              catId: pet.id,
              catName: pet.name,
              catBreed: pet.breed || '',
              catPhotoUrl: pet.photoUrl || pet.avatarUrl || pet.imageUrl || '',
              cta: isOverdue ? 'Registrar agora' : 'Ver imunização',
              metadata: {
                petId: pet.id,
                recordId: record.id,
                nextDueDate: record.nextDueDate,
                synthetic: true,
              },
              isLocal: true,
              synthetic: true,
            });
          }
        } catch {
          // silencioso por pet
        }
      })
    );

    return synthetic;
  } catch {
    return [];
  }
}

// ─── HOOK PRINCIPAL ───────────────────────────────────────────────────────────
export default function useNotifications(userId, { pollInterval = 30000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const [backendResult, syntheticVaccines] = await Promise.allSettled([
        api.get(`/notifications?userId=${userId}&limit=30`),
        fetchSyntheticVaccineNotifications(),
      ]);

      const backendNotifications =
        backendResult.status === 'fulfilled' ? safeArray(backendResult.value.data) : [];

      const vaccineNotifications =
        syntheticVaccines.status === 'fulfilled' ? syntheticVaccines.value : [];

      const merged = dedupeNotifications(
        sortByCreatedAtDesc([...backendNotifications, ...vaccineNotifications])
      );

      setNotifications(merged);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, pollInterval);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications, pollInterval]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    if (String(id).startsWith('synthetic:')) return;

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await api.patch('/notifications/read-all', { userId });
    } catch {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  const dismiss = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (String(id).startsWith('synthetic:')) return;

    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const addLocal = useCallback((notif) => {
    const local = {
      id: `local-${Date.now()}`,
      ...notif,
      read: false,
      createdAt: new Date().toISOString(),
      isLocal: true,
    };
    setNotifications((prev) => [local, ...prev]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter(
    (n) => !n.read && NOTIF_TYPES[n.type]?.urgent
  ).length;
  const grouped = groupByDate(notifications);

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return notifs.reduce((acc, n) => {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);

    const key =
      d >= today ? 'Hoje' :
      d >= yesterday ? 'Ontem' :
      'Anteriores';

    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});
}