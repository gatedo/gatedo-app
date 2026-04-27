/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const APP_SETTINGS_KEY = 'gatedo_app_settings';

const DEFAULT_SETTINGS = Object.freeze({
  soundEnabled: true,
  notificationsEnabled: false,
  biometricsEnabled: false,
});

const LOCAL_STORAGE_RESET_KEYS = [
  APP_SETTINGS_KEY,
  'officialNoticeSeen',
];

const SESSION_STORAGE_RESET_KEYS = [
  'pwa-ios-dismissed',
];

const AppSettingsContext = createContext(null);

function safeParseSettings(rawValue) {
  if (!rawValue) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(rawValue);
    return {
      soundEnabled: parsed?.soundEnabled !== false,
      notificationsEnabled: parsed?.notificationsEnabled === true,
      biometricsEnabled: parsed?.biometricsEnabled === true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function readStoredSettings() {
  try {
    return safeParseSettings(window.localStorage.getItem(APP_SETTINGS_KEY));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function readNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

async function clearBrowserCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
  } catch {
    // CacheStorage may be unavailable or blocked; keep cleanup best-effort.
  }
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => readStoredSettings());
  const [notificationPermission, setNotificationPermission] = useState(() => readNotificationPermission());

  useEffect(() => {
    try {
      window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage failures to avoid blocking the app.
    }
  }, [settings]);

  useEffect(() => {
    const syncPermission = () => setNotificationPermission(readNotificationPermission());

    syncPermission();
    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);

    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
  }, []);

  const setSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: typeof value === 'function' ? value(prev[key]) : value,
    }));
  }, []);

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

  const syncNotificationPermission = useCallback(() => {
    const next = readNotificationPermission();
    setNotificationPermission(next);
    return next;
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      LOCAL_STORAGE_RESET_KEYS.forEach((key) => window.localStorage.removeItem(key));
      SESSION_STORAGE_RESET_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
    } catch {
      // Storage cleanup is best-effort.
    }

    await clearBrowserCaches();

    setSettings({ ...DEFAULT_SETTINGS });
    setNotificationPermission(readNotificationPermission());
  }, []);

  const value = useMemo(() => ({
    settings,
    setSetting,
    updateSettings,
    resetSettings,
    notificationPermission,
    syncNotificationPermission,
  }), [notificationPermission, resetSettings, setSetting, settings, syncNotificationPermission, updateSettings]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }

  return context;
}
