import { useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAppSettings } from '../context/AppSettingsContext';

export default function usePushNotifications(userId, petId) {
  const pollRef = useRef(null);
  const timeoutRefs = useRef([]);
  const { settings, setSetting, notificationPermission, syncNotificationPermission } = useAppSettings();

  const notificationsEnabled = settings.notificationsEnabled;

  const clearScheduledTimeouts = useCallback(() => {
    timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutRefs.current = [];
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setSetting('notificationsEnabled', false);
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      setSetting('notificationsEnabled', true);
      syncNotificationPermission();
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      setSetting('notificationsEnabled', false);
      syncNotificationPermission();
      return 'denied';
    }

    const result = await Notification.requestPermission();
    syncNotificationPermission();
    setSetting('notificationsEnabled', result === 'granted');
    return result;
  }, [setSetting, syncNotificationPermission]);

  const fireNative = useCallback((title, body, options = {}) => {
    if (!notificationsEnabled) return null;
    if (notificationPermission !== 'granted') return null;

    const notification = new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: options.tag || 'gatedo-treatment',
      requireInteraction: options.urgent || false,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      if (options.url) window.location.href = options.url;
      notification.close();
    };

    return notification;
  }, [notificationPermission, notificationsEnabled]);

  const scheduleDoseAlert = useCallback((dose, catName, medTitle) => {
    if (!notificationsEnabled) return;
    if (notificationPermission !== 'granted') return;

    const scheduledAt = new Date(dose.scheduledAt).getTime();
    const now = Date.now();
    const delay = scheduledAt - now;

    if (delay <= 0 || delay > 24 * 3600000) return;

    const preDelay = delay - 10 * 60000;
    if (preDelay > 0) {
      const timeoutId = window.setTimeout(() => {
        fireNative(
          'Dose em 10 minutos',
          `${medTitle} para ${catName} as ${new Date(scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          { tag: `pre-${dose.id}`, url: `/cat/${dose.schedule?.petId}/health` }
        );
      }, preDelay);

      timeoutRefs.current.push(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      fireNative(
        'Hora da medicacao!',
        `De ${medTitle} para ${catName} agora`,
        { tag: `now-${dose.id}`, urgent: true, url: `/cat/${dose.schedule?.petId}/health` }
      );
    }, Math.max(0, delay));

    timeoutRefs.current.push(timeoutId);
  }, [fireNative, notificationPermission, notificationsEnabled]);

  const pollPendingDoses = useCallback(async () => {
    if (!userId || !petId) return;
    if (!notificationsEnabled) return;
    if (notificationPermission !== 'granted') return;

    try {
      const res = await api.get(`/treatments/pending?petId=${petId}`);
      const doses = res.data || [];

      clearScheduledTimeouts();

      doses.forEach((dose) => {
        const catName = dose.schedule?.pet?.name || 'seu gato';
        const medTitle = dose.schedule?.title || 'medicacao';
        scheduleDoseAlert(dose, catName, medTitle);
      });
    } catch {
      // Keep notification scheduling best-effort and silent.
    }
  }, [clearScheduledTimeouts, notificationPermission, notificationsEnabled, petId, scheduleDoseAlert, userId]);

  useEffect(() => {
    if (!userId || !petId) return undefined;

    clearScheduledTimeouts();
    clearInterval(pollRef.current);
    pollRef.current = null;

    if (!notificationsEnabled || notificationPermission !== 'granted') {
      return undefined;
    }

    pollPendingDoses();
    pollRef.current = setInterval(pollPendingDoses, 5 * 60000);

    return () => {
      clearScheduledTimeouts();
      clearInterval(pollRef.current);
    };
  }, [clearScheduledTimeouts, notificationPermission, notificationsEnabled, petId, pollPendingDoses, userId]);

  useEffect(() => () => {
    clearScheduledTimeouts();
    clearInterval(pollRef.current);
  }, [clearScheduledTimeouts]);

  return {
    requestPermission,
    fireNative,
    scheduleDoseAlert,
    notificationsEnabled,
    notificationPermission,
  };
}
