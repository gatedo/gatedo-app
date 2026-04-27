import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Volume2,
  Bell,
  Smartphone,
  Trash2,
  Fingerprint,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import useSensory from '../hooks/useSensory';
import usePushNotifications from '../hooks/usePushNotifications';
import { useAppSettings } from '../context/AppSettingsContext';

const STATUS_COPY = {
  granted: {
    icon: CheckCircle2,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    title: 'Notificações ativas no dispositivo',
    text: 'O app já pode enviar lembretes locais quando a preferência estiver ligada.',
  },
  denied: {
    icon: BellOff,
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    title: 'Notificações bloqueadas no navegador',
    text: 'Para voltar a receber alertas, libere a permissão nas configurações do navegador.',
  },
  default: {
    icon: Bell,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    title: 'Permissão ainda não concedida',
    text: 'Ao ativar, o navegador vai pedir autorização para enviar alertas.',
  },
  unsupported: {
    icon: AlertTriangle,
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    title: 'Este dispositivo não suporta Web Notifications',
    text: 'Os lembretes locais não podem ser ativados neste ambiente.',
  },
};

function SettingToggle({
  icon,
  label,
  desc,
  active,
  onToggle,
  color = '#8B4AFF',
  disabled = false,
  badge = null,
}) {
  return (
    <div className="bg-white rounded-[24px] p-5 mb-4 shadow-sm border border-gray-50 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}10`, color }}
        >
          {React.createElement(icon, { size: 22 })}
        </div>
        <div className="min-w-0">
          <p className="font-black text-gray-800 text-sm">{label}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{desc}</p>
          {badge ? <p className="text-[10px] font-black mt-1" style={{ color }}>{badge}</p> : null}
        </div>
      </div>

      <button
        type="button"
        aria-pressed={active}
        disabled={disabled}
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${active ? 'bg-[#8B4AFF]' : 'bg-gray-200'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { settings, setSetting, resetSettings, notificationPermission, syncNotificationPermission } = useAppSettings();
  const { requestPermission } = usePushNotifications(null, null);

  const [isClearing, setIsClearing] = useState(false);
  const [clearFeedback, setClearFeedback] = useState('');
  const [notifBusy, setNotifBusy] = useState(false);

  const notificationState = useMemo(() => {
    if (notificationPermission === 'unsupported') return STATUS_COPY.unsupported;
    if (notificationPermission === 'denied') return STATUS_COPY.denied;
    if (notificationPermission === 'granted') return STATUS_COPY.granted;
    return STATUS_COPY.default;
  }, [notificationPermission]);

  const notificationToggleActive = settings.notificationsEnabled && notificationPermission === 'granted';
  const notificationBadge = useMemo(() => {
    if (notificationPermission === 'denied') return 'Permissão bloqueada no navegador';
    if (notificationPermission === 'default' && settings.notificationsEnabled) return 'Aguardando permissão do dispositivo';
    if (notificationPermission === 'granted' && settings.notificationsEnabled) return 'Lembretes prontos para uso';
    return null;
  }, [notificationPermission, settings.notificationsEnabled]);

  const handleBack = () => {
    touch();
    navigate(-1);
  };

  const handleSoundToggle = () => {
    touch();
    setSetting('soundEnabled', (current) => !current);
  };

  const handleBiometricsToggle = () => {
    touch();
    setSetting('biometricsEnabled', (current) => !current);
  };

  const handleNotificationToggle = async () => {
    touch();

    if (notifBusy) return;

    if (notificationToggleActive || settings.notificationsEnabled) {
      setSetting('notificationsEnabled', false);
      syncNotificationPermission();
      return;
    }

    setNotifBusy(true);
    try {
      await requestPermission();
    } finally {
      syncNotificationPermission();
      setNotifBusy(false);
    }
  };

  const handleClearData = async () => {
    touch('success');
    setIsClearing(true);
    setClearFeedback('');

    try {
      await resetSettings();
      setClearFeedback('Preferências locais e caches temporários foram limpos. Recarregando...');
      window.setTimeout(() => window.location.reload(), 900);
    } catch {
      setClearFeedback('Não foi possível concluir a limpeza agora.');
      setIsClearing(false);
    }
  };

  const StatusIcon = notificationState.icon;

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] px-6 pt-12 pb-32 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={handleBack} className="p-2 bg-white rounded-2xl shadow-sm text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-800">Configurações</h1>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.18em] mt-1">
            Preferências deste dispositivo
          </p>
        </div>
      </div>

      <section className="mb-8">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 ml-2">Experiência</p>
        <SettingToggle
          icon={Volume2}
          label="Sons Sensoriais"
          desc="Miados, cliques suaves e vibração"
          active={settings.soundEnabled}
          onToggle={handleSoundToggle}
        />
        <SettingToggle
          icon={Bell}
          label="Notificações"
          desc={notifBusy ? 'Solicitando permissão do dispositivo' : 'Alertas de saúde e lembretes'}
          active={notificationToggleActive}
          onToggle={handleNotificationToggle}
          color="#f59e0b"
          disabled={notificationPermission === 'unsupported' || notifBusy}
          badge={notificationBadge}
        />

        <div
          className="mt-2 p-4 rounded-[24px] border flex items-start gap-3"
          style={{ background: notificationState.bg, borderColor: notificationState.border }}
        >
          <StatusIcon size={18} style={{ color: notificationState.color }} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: notificationState.color }}>
              {notificationState.title}
            </p>
            <p className="text-[11px] font-bold leading-relaxed mt-1" style={{ color: notificationState.color }}>
              {notificationState.text}
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 ml-2">Segurança & PWA</p>
        <SettingToggle
          icon={Fingerprint}
          label="Acesso Rápido"
          desc="Salvar preferência de biometria para próximas fases"
          active={settings.biometricsEnabled}
          onToggle={handleBiometricsToggle}
          color="#2ecc71"
          badge="Preferência salva localmente; desbloqueio real ainda não foi ativado."
        />

        <button
          type="button"
          onClick={handleClearData}
          disabled={isClearing}
          className="w-full flex items-center gap-4 p-5 bg-white rounded-[24px] shadow-sm border border-gray-50 text-left active:scale-[0.98] transition-all disabled:opacity-70"
        >
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
            <Trash2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="font-black text-gray-800 text-sm">Limpar Dados do App</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
              {isClearing ? 'Limpando preferências e cache temporário' : 'Redefinir preferências locais sem deslogar'}
            </p>
          </div>
        </button>

        <AnimatePresence>
          {clearFeedback ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3 rounded-[20px] border border-emerald-100 bg-emerald-50 px-4 py-3 flex items-start gap-3"
            >
              <ShieldCheck size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] font-black text-emerald-700 leading-relaxed">{clearFeedback}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <div className="mt-4 p-4 bg-indigo-50 rounded-[24px] flex items-start gap-3">
        <Smartphone size={20} className="text-[#8B4AFF] mt-0.5 flex-shrink-0" />
        <p className="text-[10px] font-bold text-indigo-400 leading-relaxed uppercase">
          O Gatedo está instalado como PWA. Sons, notificações e biometria desta tela valem para este navegador e este dispositivo.
        </p>
      </div>
    </div>
  );
}
