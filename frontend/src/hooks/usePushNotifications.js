import { useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

// ─── PUSH NOTIFICATIONS — Web Notifications API ───────────────────────────────
// Solicita permissão e dispara alertas nativos de doses
export default function usePushNotifications(userId, petId) {
  const pollRef = useRef(null);

  // ── Solicita permissão de notificação ────────────────────────────────────
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result;
  }, []);

  // ── Dispara notificação nativa ────────────────────────────────────────────
  const fireNative = useCallback((title, body, options = {}) => {
    if (Notification.permission !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag:   options.tag || 'gatedo-treatment',
      requireInteraction: options.urgent || false,
      ...options,
    });
    n.onclick = () => {
      window.focus();
      if (options.url) window.location.href = options.url;
      n.close();
    };
    return n;
  }, []);

  // ── Agenda alerta local para uma dose ─────────────────────────────────────
  const scheduleDoseAlert = useCallback((dose, catName, medTitle) => {
    const scheduledAt = new Date(dose.scheduledAt).getTime();
    const now = Date.now();
    const delay = scheduledAt - now;

    if (delay <= 0 || delay > 24 * 3600000) return; // só agenda próximas 24h

    // Alerta 10min antes
    const preDelay = delay - 10 * 60000;
    if (preDelay > 0) {
      setTimeout(() => {
        fireNative(
          `💊 Dose em 10 minutos`,
          `${medTitle} para ${catName} às ${new Date(scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          { tag: `pre-${dose.id}`, url: `/cat/${dose.schedule?.petId}/health` }
        );
      }, preDelay);
    }

    // Alerta na hora
    setTimeout(() => {
      fireNative(
        `🔔 Hora da medicação!`,
        `Dê ${medTitle} para ${catName} agora`,
        { tag: `now-${dose.id}`, urgent: true, url: `/cat/${dose.schedule?.petId}/health` }
      );
    }, Math.max(0, delay));
  }, [fireNative]);

  // ── Polling de doses pendentes (a cada 5min) ──────────────────────────────
  const pollPendingDoses = useCallback(async () => {
    if (!userId || !petId) return;
    if (Notification.permission !== 'granted') return;

    try {
      const res = await api.get(`/treatments/pending?petId=${petId}`);
      const doses = res.data || [];

      doses.forEach((dose) => {
        const catName  = dose.schedule?.pet?.name || 'seu gato';
        const medTitle = dose.schedule?.title || 'medicação';
        scheduleDoseAlert(dose, catName, medTitle);
      });
    } catch {
      // Silencioso — não trava a UI
    }
  }, [userId, petId, scheduleDoseAlert]);

  // ── Setup: pede permissão e inicia polling ────────────────────────────────
  useEffect(() => {
    if (!userId || !petId) return;

    requestPermission().then((perm) => {
      if (perm === 'granted') {
        pollPendingDoses();
        // Poll a cada 5 minutos
        pollRef.current = setInterval(pollPendingDoses, 5 * 60000);
      }
    });

    return () => clearInterval(pollRef.current);
  }, [userId, petId]);

  return { requestPermission, fireNative, scheduleDoseAlert };
}