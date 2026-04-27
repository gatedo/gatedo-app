import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Paperclip, FileText, X, Sparkles, Bell,
  BellOff, CheckCircle, RefreshCw, Zap, Stethoscope, CalendarClock, Pill,
  Check, ChevronDown, ChevronUp, SkipForward, Activity, Clock,
  Trash2, Plus,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { awardHealthXP } from '../utils/healthGamification';
import ProvidersSelector from '../components/ProfileModules/ProvidersSelector';
import usePushNotifications from '../hooks/usePushNotifications';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const C = { purple: '#8B4AFF' };

const TYPE_CONFIG = {
  vaccine:      { label: 'Vacina',     color: 'bg-pink-500',   colorText: 'text-pink-600',  icon: '💉', igentType: 'VACCINE',      xpAction: 'vaccine_created' },
  vermifuge:    { label: 'Vermífugo',  color: 'bg-blue-500',   colorText: 'text-blue-600',  icon: '💊', igentType: 'VERMIFUGE',    xpAction: 'vermifuge_created' },
  parasite:     { label: 'Antipulgas', color: 'bg-purple-500', colorText: 'text-purple-600',icon: '✨', igentType: 'PARASITE',     xpAction: 'parasite_created' },
  medicine:     { label: 'Medicação',  color: 'bg-amber-500',  colorText: 'text-amber-600', icon: '🩺', igentType: 'MEDICATION',   xpAction: 'medication_created' },
  consultation: { label: 'Consulta',   color: 'bg-[#8B4AFF]',  colorText: 'text-[#8B4AFF]', icon: '🩺', igentType: 'CONSULTATION', xpAction: 'consultation_created' },
};

const TYPE_MAP = {
  vaccine:'VACCINE', vermifuge:'VERMIFUGE', parasite:'PARASITE',
  medicine:'MEDICATION', consultation:'CONSULTATION',
};

const ONGOING_TYPES          = ['medicine', 'parasite', 'vermifuge'];
const PRESCRIPTION_TYPES     = ['medicine', 'consultation'];
const TREATMENT_TRIGGER_TYPES= ['medicine', 'consultation'];
const IGENT_MEDICATION_TYPES = ['medicine', 'vermifuge', 'parasite'];

const COMMON_REASONS = [
  'Herpes ocular','Conjuntivite / olho irritado','Vômito','Diarreia',
  'Falta de apetite','Apatia','Espirros','Coceira / pele',
  'Ferida / machucado','Reavaliação / retorno','Outro',
];

const SPECIALTIES = [
  'Felinos','Oftalmologia','Dermatologia','Odontologia',
  'Cardiologia','Nefrologia','Neurologia','Comportamento','Outro',
];

const INTERVALS = [
  { value: 4,  label: 'A cada 4h'  },
  { value: 6,  label: 'A cada 6h'  },
  { value: 8,  label: 'A cada 8h'  },
  { value: 12, label: 'A cada 12h' },
  { value: 24, label: '1x ao dia'  },
  { value: 48, label: 'A cada 2 dias' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }) : '—';

const timeUntil = (d) => {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return 'Atrasada';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h === 0) return `em ${m}min`;
  if (m === 0) return `em ${h}h`;
  return `em ${h}h${m}min`;
};

const getLocalUserId = () => {
  try { return JSON.parse(localStorage.getItem('gatedo_user') || '{}')?.id || null; } catch { return null; }
};

const getLocalUserProfile = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('gatedo_user') || '{}') || {};
    return {
      id: raw?.id || null,
      name: raw?.name || raw?.fullName || raw?.firstName || 'Tutor Gatedo',
      avatar: raw?.avatar || raw?.avatarUrl || raw?.photoUrl || null,
    };
  } catch {
    return { id: null, name: 'Tutor Gatedo', avatar: null };
  }
};

const persistProviderGuideSignal = ({ formData, petId, petName, reason, specialty }) => {
  const veterinarian = formData?.veterinarian?.trim();
  const clinicName = formData?.clinicName?.trim();
  if (!veterinarian && !clinicName) return;

  try {
    const tutor = getLocalUserProfile();
    const key = 'gatedo_provider_signals';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const next = [
      {
        id: `${petId || 'pet'}-${Date.now()}`,
        petId: petId || null,
        petName: petName || 'Gatinho',
        tutorId: tutor.id || null,
        tutorName: tutor.name || 'Tutor Gatedo',
        tutorAvatar: tutor.avatar || null,
        veterinarian: veterinarian || null,
        clinicName: clinicName || null,
        clinicPhone: formData?.clinicPhone?.trim() || null,
        clinicAddress: formData?.clinicAddress?.trim() || null,
        specialty: specialty || null,
        reason: reason || null,
        createdAt: new Date().toISOString(),
        source: 'health_form_consultation',
      },
      ...existing,
    ].slice(0, 120);

    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
};

const buildProtocolNumber = (petId) => {
  const safe = String(petId || 'cat').slice(0, 6).toUpperCase();
  return `GATEDO-${safe}-${Date.now()}`;
};

const fmtDateFull = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('pt-BR', {
      day:'2-digit', month:'2-digit', year:'numeric',
    });
  } catch {
    return '—';
  }
};

const safeText = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
};

const toDataUrlLogo = async () => {
  try {
    const response = await fetch(`${window.location.origin}/assets/logo-gatedo.jpg`, { cache: 'no-store' });
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const fileFromBlob = (blob, filename, type='application/pdf') => new File([blob], filename, { type });

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI atoms
// ─────────────────────────────────────────────────────────────────────────────

function XPSuccessPill({ text }) {
  return (
    <motion.div
      initial={{ opacity:0, y:14, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8, scale:0.96 }}
      className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[130] px-4 py-2 rounded-full shadow-xl border"
      style={{ background:'linear-gradient(135deg,#8B4AFF 0%,#4B40C6 100%)', borderColor:'rgba(255,255,255,0.16)' }}>
      <div className="flex items-center gap-2">
        <Zap size={13} className="text-[#DFFF40]" />
        <span className="text-[11px] font-black text-white">{text}</span>
      </div>
    </motion.div>
  );
}

function Toggle({ label, sublabel, icon, active, onToggle, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-wider">{label}</p>
          {sublabel && <p className="text-[9px] text-gray-400 font-bold">{sublabel}</p>}
        </div>
      </div>
      <button type="button" onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${active ? color : 'bg-gray-200'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function SegmentedButton({ active, onClick, label }) {
  return (
    <button type="button" onClick={onClick}
      className="flex-1 rounded-[18px] px-3 py-3 text-[10px] font-black uppercase tracking-wider transition-all"
      style={active ? { background:'#8B4AFF', color:'#fff' } : { background:'#F4F3FF', color:'#8B4AFF' }}>
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DoseCard
// ─────────────────────────────────────────────────────────────────────────────

function DoseCard({ dose, onTake, onSkip }) {
  const now = new Date();
  const scheduledAt = new Date(dose.scheduledAt);
  const isPast    = scheduledAt < now;
  const isOverdue = isPast && !dose.takenAt && !dose.skipped;
  const isTaken   = !!dose.takenAt;
  const isSkipped = dose.skipped;

  const bg     = isTaken?'#F0FDF4':isOverdue?'#FEF2F2':isSkipped?'#F9FAFB':'#F4F3FF';
  const border = isTaken?'#BBF7D0':isOverdue?'#FECACA':isSkipped?'#E5E7EB':`${C.purple}20`;
  const dot    = isTaken?'#16A34A':isOverdue?'#DC2626':isSkipped?'#9CA3AF':C.purple;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border" style={{ background:bg, borderColor:border }}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:dot }} />
      <div className="flex-1">
        <p className="text-xs font-black text-gray-700">
          {fmtTime(dose.scheduledAt)}
          <span className="text-[9px] font-bold text-gray-400 ml-1.5">{fmtDate(dose.scheduledAt)}</span>
        </p>
        {isTaken   && <p className="text-[9px] font-bold text-green-600">✓ Tomada às {fmtTime(dose.takenAt)}</p>}
        {isSkipped && <p className="text-[9px] font-bold text-gray-400">Pulada</p>}
        {isOverdue && <p className="text-[9px] font-black text-red-500">⚠ Atrasada</p>}
        {!isPast && !isTaken && !isSkipped && (
          <p className="text-[9px] font-bold" style={{ color:C.purple }}>{timeUntil(dose.scheduledAt)}</p>
        )}
      </div>
      {!isTaken && !isSkipped && (
        <div className="flex gap-1.5 flex-shrink-0">
          <motion.button whileTap={{ scale:0.85 }} onClick={() => onTake(dose.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500">
            <Check size={14} className="text-white" />
          </motion.button>
          <motion.button whileTap={{ scale:0.85 }} onClick={() => onSkip(dose.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-200">
            <SkipForward size={12} className="text-gray-500" />
          </motion.button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InlineTreatmentTracker — self-contained, rendered inside HealthForm
// ─────────────────────────────────────────────────────────────────────────────

function InlineTreatmentTracker({ petId, petName, treatment: initial, userId }) {
  const [schedule, setSchedule]       = useState(initial);
  const [expanded, setExpanded]       = useState(true);
  const [optimisticDoses, setDoses]   = useState(initial?.doses || []);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory]         = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pushStatus, setPushStatus]   = useState('idle');
  const [xpToast, setXpToast]         = useState('');

  // usePushNotifications needs userId + petId
  const { requestPermission, notificationsEnabled, notificationPermission } = usePushNotifications(userId, petId);

  useEffect(() => {
    setPushStatus(notificationPermission);
  }, [notificationPermission]);

  // Poll server once to get generated doses
  const reload = useCallback(async () => {
    if (!schedule?.id) return;
    try {
      const res = await api.get(`/treatments?petId=${petId}`);
      const fresh = (res.data || []).find((t) => t.id === schedule.id);
      if (fresh) { setSchedule(fresh); setDoses(fresh.doses || []); }
    } catch {}
  }, [schedule?.id, petId]);

  useEffect(() => { const t = setTimeout(reload, 800); return () => clearTimeout(t); }, [reload]);

  const showXp = (text) => { setXpToast(text); setTimeout(() => setXpToast(''), 2400); };

  const handleTake = async (doseId) => {
    setDoses((prev) => prev.map((d) => d.id === doseId ? { ...d, takenAt: new Date().toISOString() } : d));
    try {
      await api.post(`/treatments/doses/${doseId}/take`, { userId, catName: petName });
      await awardHealthXP({ userId, petId, action:'treatment_dose_taken', amount:5, meta:{ treatmentId:schedule.id, doseId } });
      showXp('+5 XP por dose concluída');
      reload();
    } catch { reload(); }
  };

  const handleSkip = async (doseId) => {
    setDoses((prev) => prev.map((d) => d.id === doseId ? { ...d, skipped:true } : d));
    try { await api.post(`/treatments/doses/${doseId}/skip`); reload(); }
    catch { reload(); }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Encerrar tratamento "${schedule?.title}"?`)) return;
    await api.patch(`/treatments/${schedule.id}/deactivate`);
    setSchedule((s) => ({ ...s, active:false }));
  };

  const loadHistory = async () => {
    if (history.length > 0) { setShowHistory((s) => !s); return; }
    setLoadingHistory(true);
    try {
      const res = await api.get(`/treatments/${schedule.id}/doses`);
      setHistory(res.data || []); setShowHistory(true);
    } catch {} finally { setLoadingHistory(false); }
  };

  const handleEnablePush = async () => {
    setPushStatus('asking');
    const result = await requestPermission();
    setPushStatus(result);
  };

  if (!schedule || schedule.active === false) return null;

  const overdue   = schedule.overdueCount || 0;
  const adherence = schedule.adherencePct ?? 100;
  const hasOrigin = !!(schedule.originHealthRecordId || schedule.originPrescriptionDocumentId);
  const intervalLabel = INTERVALS.find((i) => i.value === schedule.intervalHours)?.label || `${schedule.intervalHours}h`;

  const now = new Date();
  const visibleDoses = optimisticDoses.filter((d) => {
    const at = new Date(d.scheduledAt);
    return at >= new Date(now.getTime() - 86400000) && at <= new Date(now.getTime() + 24 * 3600000);
  });

  return (
    <>
      <motion.div
        initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:260, damping:22 }}
        className="rounded-[28px] overflow-hidden border"
        style={{ borderColor: overdue > 0 ? '#FECACA' : `${C.purple}22`, background: overdue > 0 ? '#FFF5F5' : '#fff' }}
      >
        {/* Push prompt */}
        {!notificationsEnabled && (
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-slate-100" style={{ background:'#F8FAFC' }}>
            <BellOff size={15} className="text-slate-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-700">Notificações desativadas nas configurações</p>
              <p className="text-[9px] font-bold text-slate-500">Ative em Configurações para receber lembretes locais</p>
            </div>
          </div>
        )}

        {notificationsEnabled && pushStatus !== 'granted' && pushStatus !== 'denied' && (
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-amber-100" style={{ background:'#FFFBEB' }}>
            <Bell size={15} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-800">Ativar alertas no celular</p>
              <p className="text-[9px] font-bold text-amber-600">Receba lembretes 10min antes de cada dose</p>
            </div>
            <button onClick={handleEnablePush} disabled={pushStatus === 'asking'}
              className="text-[9px] font-black text-white px-3 py-1.5 rounded-full bg-amber-500 flex-shrink-0">
              {pushStatus === 'asking' ? '...' : 'Ativar'}
            </button>
          </div>
        )}

        {notificationsEnabled && pushStatus === 'granted' && (
          <div className="flex items-center gap-1.5 px-5 py-2 border-b border-green-50" style={{ background:'#F0FDF4' }}>
            <CheckCircle size={11} className="text-green-500" />
            <p className="text-[9px] font-black text-green-700">Alertas no celular ativados</p>
          </div>
        )}

        {notificationsEnabled && pushStatus === 'denied' && (
          <div className="flex items-center gap-1.5 px-5 py-2 border-b border-gray-100" style={{ background:'#F9FAFB' }}>
            <BellOff size={11} className="text-gray-400" />
            <p className="text-[9px] font-bold text-gray-500">Notificações bloqueadas no navegador</p>
          </div>
        )}

        {/* Header */}
        <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-start gap-3 px-5 py-4 text-left">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: overdue > 0 ? '#FEE2E2' : `${C.purple}12` }}>
            <Pill size={18} style={{ color: overdue > 0 ? '#DC2626' : C.purple }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-800 text-sm leading-tight truncate">{schedule.title}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background:`${C.purple}10`, color:C.purple }}>
                <Clock size={8} className="inline mr-0.5" />{intervalLabel}
              </span>
              {overdue > 0 && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  ⚠ {overdue} atrasada{overdue > 1 ? 's' : ''}
                </span>
              )}
              {hasOrigin && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{ background:'#EEF2FF', color:'#4F46E5' }}>
                  <Stethoscope size={7} /> Prescrito
                </span>
              )}
              <span className="text-[9px] font-bold text-gray-400">{adherence}% adesão</span>
            </div>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                    : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-1" />}
        </button>

        {/* Body */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
              exit={{ height:0, opacity:0 }} transition={{ duration:0.22 }} className="overflow-hidden">
              <div className="px-5 pb-5 space-y-3">

                {schedule.notes && (
                  <div className="bg-[#F4F3FF] rounded-xl px-3 py-2 border border-[#8B4AFF10]">
                    <p className="text-[9px] font-black text-[#8B4AFF] uppercase tracking-wider mb-0.5">Orientações</p>
                    <p className="text-xs font-bold text-gray-600">{schedule.notes}</p>
                  </div>
                )}

                {/* Clinical origin */}
                {(hasOrigin || schedule.veterinarian || schedule.clinicName) && (
                  <div className="rounded-[16px] px-3 py-2.5"
                    style={{ background:'#EEF2FF', border:'1px solid #C7D2FE' }}>
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider mb-1.5">Origem clínica</p>
                    <div className="flex flex-wrap gap-1.5">
                      {schedule.veterinarian && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white text-indigo-700 border border-indigo-100">
                          <Stethoscope size={8} className="inline mr-0.5" />{schedule.veterinarian}
                        </span>
                      )}
                      {schedule.clinicName && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white text-gray-600 border border-gray-100">
                          {schedule.clinicName}
                        </span>
                      )}
                      {schedule.originHealthRecordId && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-50 text-cyan-700 border border-cyan-100">
                          Consulta vinculada
                        </span>
                      )}
                      {schedule.originPrescriptionDocumentId && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-100">
                          <FileText size={8} className="inline mr-0.5" />Receita vinculada
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Doses */}
                {visibleDoses.length > 0 ? (
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Doses — próximas 24h</p>
                    <div className="space-y-1.5">
                      {visibleDoses.map((dose) => (
                        <DoseCard key={dose.id} dose={dose} onTake={handleTake} onSkip={handleSkip} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 rounded-2xl border border-dashed border-gray-200">
                    <RefreshCw size={14} className="text-gray-300 mx-auto mb-1 animate-spin" />
                    <p className="text-[10px] font-bold text-gray-400">Gerando doses...</p>
                  </div>
                )}

                {/* Adherence */}
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Adesão ao tratamento</p>
                    <p className="text-[9px] font-black"
                      style={{ color: adherence >= 80 ? '#16A34A' : adherence >= 50 ? '#D97706' : '#DC2626' }}>
                      {adherence}%
                    </p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width:0 }} animate={{ width:`${adherence}%` }} transition={{ duration:0.7 }}
                      className="h-full rounded-full"
                      style={{ background: adherence >= 80 ? '#16A34A' : adherence >= 50 ? '#D97706' : '#DC2626' }} />
                  </div>
                </div>

                {/* History */}
                <button onClick={loadHistory} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                  style={{ color:C.purple }}>
                  <Activity size={11} />
                  {showHistory ? 'Ocultar histórico' : 'Ver histórico completo'}
                  {loadingHistory && <RefreshCw size={10} className="animate-spin" />}
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} className="overflow-hidden space-y-1.5">
                      {history.slice(0, 20).map((dose) => (
                        <DoseCard key={dose.id} dose={dose} onTake={() => {}} onSkip={() => {}} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reward */}
                <div className="rounded-xl bg-[#F4F3FF] border border-[#8B4AFF14] px-3 py-2">
                  <p className="text-[9px] font-black text-[#8B4AFF] uppercase tracking-wider mb-0.5">Recompensa</p>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    Cada dose concluída corretamente gera <strong>+5 XP</strong> para o tutor.
                  </p>
                </div>

                <button onClick={handleDeactivate}
                  className="flex items-center gap-1.5 text-[9px] font-black text-red-400 uppercase tracking-wider mt-1">
                  <Trash2 size={11} /> Encerrar tratamento
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>{xpToast ? <XPSuccessPill text={xpToast} /> : null}</AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main HealthForm
// ─────────────────────────────────────────────────────────────────────────────

export default function HealthForm() {
  const { id }            = useParams();
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const fileInputRef      = useRef(null);
  const trackerRef        = useRef(null);

  const type   = searchParams.get('type') || 'vaccine';
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.vaccine;

  const [loading, setLoading]                 = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [hasPrescription, setHasPrescription] = useState(false);
  const [isOngoing, setIsOngoing]             = useState(false);
  const [isControlled, setIsControlled]       = useState(false);
  const [selectedFile, setSelectedFile]       = useState(null);
  const [xpToast, setXpToast]                 = useState('');
  const [saveError, setSaveError]             = useState('');
  const [providerSources, setProviderSources] = useState({ healthRecords:[], treatments:[] });
  const [createdTreatment, setCreatedTreatment] = useState(null); // triggers inline tracker
  const [protocolDocument, setProtocolDocument] = useState(null);
  const [protocolNumber, setProtocolNumber] = useState('');
  const [petName, setPetName] = useState('');

  const [formData, setFormData] = useState({
    title:'', date: new Date().toISOString().split('T')[0], nextDate:'',
    veterinarian:'', clinicName:'', clinicPhone:'', clinicAddress:'',
    reason:'', customReason:'', appointmentMode:'clinical', specialty:'', specialtyCustom:'',
    recommendedRecheck:false, recheckDate:'',
    startTreatmentNow:false, prescribedMedicationName:'',
    prescribedIntervalHours:8, prescribedEndDate:'',
    notes:'',
  });

  const set = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    api.get(`/pets/${id}`)
      .then((res) => {
        if (!mounted) return;
        setPetName(res?.data?.name || '');
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, [id]);

  // Load provider sources
  useEffect(() => {
    if (!id) return;
    let m = true;
    Promise.allSettled([api.get(`/health-records?petId=${id}`), api.get(`/treatments/pet/${id}`)]).then(([h, t]) => {
      if (!m) return;
      setProviderSources({
        healthRecords: h.status==='fulfilled' && Array.isArray(h.value?.data) ? h.value.data : [],
        treatments:    t.status==='fulfilled' && Array.isArray(t.value?.data) ? t.value.data : [],
      });
    });
    return () => { m = false; };
  }, [id]);

  // Scroll to tracker when it appears
  useEffect(() => {
    if (createdTreatment && trackerRef.current) {
      setTimeout(() => trackerRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 300);
    }
  }, [createdTreatment]);

  const handleFileChange  = (e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); };
  const updateProviders   = (v) => setFormData((p) => ({ ...p, veterinarian:v?.veterinarian||'', clinicName:v?.clinicName||'', clinicPhone:v?.clinicPhone||'', clinicAddress:v?.clinicAddress||'' }));
  const showXpEarned      = (t) => { setXpToast(t); setTimeout(() => setXpToast(''), 2400); };
  const getReasonValue    = () => formData.reason === 'Outro' ? formData.customReason?.trim()||null : formData.reason?.trim()||null;
  const getSpecialtyValue = () => formData.appointmentMode!=='specialist' ? null : formData.specialty==='Outro' ? formData.specialtyCustom?.trim()||null : formData.specialty?.trim()||null;

  const shouldLaunchTracker = () => {
    const explicit = TREATMENT_TRIGGER_TYPES.includes(type) && !!formData.startTreatmentNow;
    const implicit = type === 'medicine' && isOngoing;
    return explicit || implicit;
  };

  const getEffectiveMedName = () =>
    type === 'consultation' ? formData.prescribedMedicationName?.trim() : formData.title?.trim();

  const uploadPrescription = async ({ linkedHealthRecordId=null }={}) => {
    if (!selectedFile || !hasPrescription) return null;
    const f = new FormData();
    f.append('file', selectedFile);
    f.append('petId', id);
    f.append('title', ['Receita', formData.title?.trim()||config.label, formData.veterinarian?.trim()||formData.clinicName?.trim()].filter(Boolean).join(' • '));
    f.append('category','RECEITA'); f.append('isPrivate','true'); f.append('isVetShared','false'); f.append('isFavorite','false');
    f.append('metadata', JSON.stringify({ source:'health_form', type:TYPE_MAP[type], date:formData.date, title:formData.title?.trim(), reason:getReasonValue(), linkedHealthRecordId }));
    const res = await api.post('/documents/upload', f, { headers:{ 'Content-Type':'multipart/form-data' } });
    return res?.data||null;
  };


  const uploadConsultationProtocol = async ({
    linkedHealthRecordId = null,
    protocolNumber: nextProtocolNumber,
  } = {}) => {
    if (type !== 'consultation' || !linkedHealthRecordId || !nextProtocolNumber) return null;

    const reason = getReasonValue();
    const specialty = getSpecialtyValue();
    const catName = safeText(petName || 'Paciente');

    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const lineWidth = pageWidth - 28;
    let y = 14;

    const logoDataUrl = await toDataUrlLogo().catch(() => null);
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, 'JPEG', 14, y, 34, 14); } catch {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(139, 74, 255);
    doc.text(`PROTOCOLO ${nextProtocolNumber}`, pageWidth - 14, y + 5, { align:'right' });

    doc.setFontSize(16);
    doc.setTextColor(35, 35, 35);
    doc.text('Prontuário Clínico GATEDO', pageWidth - 14, y + 12, { align:'right' });

    y += 22;
    doc.setDrawColor(139, 74, 255);
    doc.setLineWidth(0.6);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(110, 110, 110);
    doc.text('Paciente:', 14, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(35, 35, 35);
    doc.text(catName, 36, y);
    y += 9;

    const rows = [
      ['Consulta', safeText(formData.title?.trim() || 'Consulta clínica')],
      ['Data da consulta', fmtDateFull(formData.date)],
      ['Motivo', safeText(reason)],
      ['Veterinário', safeText(formData.veterinarian?.trim())],
      ['Clínica', safeText(formData.clinicName?.trim())],
      ['Telefone', safeText(formData.clinicPhone?.trim())],
      ['Endereço', safeText(formData.clinicAddress?.trim())],
      ['Especialidade', safeText(specialty)],
      ['Atendimento', formData.appointmentMode === 'specialist' ? 'Especialista' : 'Clínico'],
      ['Reconsulta', formData.recommendedRecheck ? `Sim · ${fmtDateFull(formData.recheckDate)}` : 'Não recomendada'],
      ['Medicação prescrita', safeText(formData.prescribedMedicationName?.trim())],
      ['Intervalo', formData.startTreatmentNow ? `${safeText(formData.prescribedIntervalHours)}h` : '—'],
      ['Fim do tratamento', formData.startTreatmentNow && formData.prescribedEndDate ? fmtDateFull(formData.prescribedEndDate) : '—'],
    ];

    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text(`${label}:`, 14, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(35, 35, 35);
      const lines = doc.splitTextToSize(String(value), lineWidth - 34);
      doc.text(lines, 48, y);
      y += Math.max(7, lines.length * 5);
    });

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text('Observações clínicas:', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(35, 35, 35);
    const notesLines = doc.splitTextToSize(safeText(formData.notes?.trim()), lineWidth);
    doc.text(notesLines, 14, y);
    y += Math.max(12, notesLines.length * 5 + 4);

    const qrPayload = JSON.stringify({
      protocolNumber: nextProtocolNumber,
      petId: id,
      petName: catName,
      linkedHealthRecordId,
      category: 'LAUDOS_MEDICOS',
      type: 'consultation_protocol',
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width:220,
        margin:1,
        color:{ dark:'#2D2D2D', light:'#FFFFFF' },
      });

      if (y > 230) {
        doc.addPage();
        y = 20;
      }

      doc.setDrawColor(235, 235, 245);
      doc.roundedRect(14, y, pageWidth - 28, 34, 4, 4);
      doc.addImage(qrDataUrl, 'PNG', 18, y + 4, 22, 22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(35, 35, 35);
      doc.text('QR do prontuário', 46, y + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Use este código para identificar rapidamente a ficha clínica vinculada.', 46, y + 16, {
        maxWidth: pageWidth - 64,
      });
    } catch {}

    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfArrayBuffer], { type:'application/pdf' });
    const fileName = `prontuario-${nextProtocolNumber}.pdf`;
    const pdfFile = fileFromBlob(pdfBlob, fileName, 'application/pdf');

    const f = new FormData();
    f.append('file', pdfFile);
    f.append('petId', id);
    f.append('title', `Prontuário • ${catName} • ${fmtDateFull(formData.date)}`);
    f.append('category', 'LAUDOS_MEDICOS');
    f.append('isPrivate', 'true');
    f.append('isVetShared', 'false');
    f.append('isFavorite', 'false');
    f.append('metadata', JSON.stringify({
      source:'health_form_protocol',
      type:'consultation_protocol',
      protocolNumber: nextProtocolNumber,
      linkedHealthRecordId,
      date: formData.date,
      petName: catName,
      title: formData.title?.trim() || null,
      reason,
      specialty,
      veterinarian: formData.veterinarian?.trim() || null,
      clinicName: formData.clinicName?.trim() || null,
      clinicPhone: formData.clinicPhone?.trim() || null,
      clinicAddress: formData.clinicAddress?.trim() || null,
      recommendedRecheck: !!formData.recommendedRecheck,
      recheckDate: formData.recheckDate || null,
      folderLabel:'PRONTUARIOS',
      qrPayload,
    }));

    const res = await api.post('/documents/upload', f, { headers:{ 'Content-Type':'multipart/form-data' } });
    return res?.data || null;
  };

  const handleSave = async () => {
    if (!formData.title?.trim())                                                  { alert('Informe o nome/motivo'); return; }
    if (type==='consultation' && !getReasonValue())                               { alert('Selecione o motivo da consulta'); return; }
    if (formData.appointmentMode==='specialist' && !getSpecialtyValue())          { alert('Informe a especialidade'); return; }
    if (formData.recommendedRecheck && !formData.recheckDate)                     { alert('Informe a data da reconsulta'); return; }
    if (type==='consultation' && formData.startTreatmentNow && !formData.prescribedMedicationName?.trim()) { alert('Informe o nome da medicação'); return; }

    setLoading(true); setSaveError('');

    try {
      const reason    = getReasonValue();
      const specialty = getSpecialtyValue();
      const userId    = getLocalUserId();
      const nextProtocolNumber = type === 'consultation' ? buildProtocolNumber(id) : '';

      // 1. Health record
      const recordRes = await api.post('/health-records', {
        petId:id, type:TYPE_MAP[type], title:formData.title.trim(),
        date:new Date(formData.date),
        nextDueDate: type === 'consultation' ? null : (formData.nextDate ? new Date(formData.nextDate) : null),
        veterinarian:formData.veterinarian?.trim()||undefined, clinicName:formData.clinicName?.trim()||undefined,
        clinicPhone:formData.clinicPhone?.trim()||undefined, clinicAddress:formData.clinicAddress?.trim()||undefined,
        notes:formData.notes?.trim()||undefined, ongoing:isOngoing, active:isOngoing,
        prescription:hasPrescription, isControlled, reason:reason||undefined,
        appointmentMode:formData.appointmentMode||undefined, specialty:specialty||undefined,
        recommendedRecheck:!!formData.recommendedRecheck,
        recheckDate: formData.recommendedRecheck&&formData.recheckDate ? new Date(formData.recheckDate) : null,
      });
      const createdRecord = recordRes?.data||null;

      if (type === 'consultation') {
        persistProviderGuideSignal({
          formData,
          petId: id,
          petName: petName || 'Gatinho',
          reason,
          specialty,
        });
      }

      // 2. Consultation protocol upload
      let uploadedProtocol = null;
      if (type === 'consultation' && createdRecord?.id) {
        try {
          uploadedProtocol = await uploadConsultationProtocol({
            linkedHealthRecordId: createdRecord.id,
            protocolNumber: nextProtocolNumber,
          });

          if (uploadedProtocol?.id) {
            setProtocolDocument(uploadedProtocol);
            setProtocolNumber(nextProtocolNumber);
          }
        } catch (err) {
          console.error('Erro ao gerar prontuário PDF:', err);
          setSaveError('Consulta salva, mas o prontuário em PDF não foi gerado.');
        }
      }

      // 3. Prescription upload
      let uploadedPrescription = null;
      if (hasPrescription && selectedFile) {
        try { uploadedPrescription = await uploadPrescription({ linkedHealthRecordId:createdRecord?.id }); }
        catch (err) { console.error(err); setSaveError('Registro salvo, mas a receita não foi enviada.'); }
      }

      // 4. Notify iGent
      if (IGENT_MEDICATION_TYPES.includes(type)||type==='vaccine'||type==='consultation') {
        api.post('/igent/record-update', {
          petId:id, recordType:TYPE_MAP[type], title:formData.title.trim(), date:formData.date,
          reason, specialty, ongoing:isOngoing, veterinarian:formData.veterinarian?.trim()||null,
          clinicName:formData.clinicName?.trim()||null, prescriptionDocumentId:uploadedPrescription?.id||null,
          protocolDocumentId: uploadedProtocol?.id || null,
          protocolNumber: nextProtocolNumber || null,
          recordId:createdRecord?.id||null,
        }).catch(()=>{});
      }

      // 5. XP for health record
      await awardHealthXP({ userId, petId:id, action:config.xpAction, amount:5, meta:{ type:TYPE_MAP[type], title:formData.title.trim() } });

      // 5. Create treatment & show inline tracker
      if (shouldLaunchTracker()) {
        const medName = getEffectiveMedName();
        if (medName) {
          try {
            const treatmentNotes = [
              reason     ? `Motivo da consulta: ${reason}` : null,
              specialty  ? `Especialidade: ${specialty}`   : null,
              isOngoing  ? 'Tratamento contínuo'           : null,
              formData.notes?.trim()||null,
            ].filter(Boolean).join('\n');

            const tRes = await api.post('/treatments', {
              petId:id, userId, title:medName,
              notes:treatmentNotes||undefined,
              intervalHours:Number(formData.prescribedIntervalHours)||8,
              startDate:`${formData.date}T08:00`,
              endDate:formData.prescribedEndDate ? `${formData.prescribedEndDate}T20:00` : undefined,
              originHealthRecordId:createdRecord?.id||undefined,
              originPrescriptionDocumentId:uploadedPrescription?.id||undefined,
              veterinarian:formData.veterinarian?.trim()||undefined, clinicName:formData.clinicName?.trim()||undefined,
              clinicPhone:formData.clinicPhone?.trim()||undefined, clinicAddress:formData.clinicAddress?.trim()||undefined,
            });

            await awardHealthXP({ userId, petId:id, action:'treatment_created', amount:5, meta:{ title:medName } });

            setCreatedTreatment(tRes.data);
            showXpEarned('+10 XP · consulta + tratamento criados');
          } catch (err) {
            console.error('Erro ao criar tratamento:', err);
            showXpEarned(`+5 XP por ${config.label.toLowerCase()} registrada`);
          }
        }
      } else {
        showXpEarned(`+5 XP por ${config.label.toLowerCase()} registrada`);
      }

      setSaved(true);
    } catch (error) {
      const msg = error?.response?.data?.message;
      const final = Array.isArray(msg) ? msg.join(' | ') : msg||'Erro ao salvar.';
      setSaveError(final); alert(final);
    } finally { setLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-24 pt-6 px-5 overflow-y-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registrar</p>
            <h1 className="text-lg font-black text-gray-800 tracking-tight leading-none">{config.icon} {config.label}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F3FF] rounded-2xl border border-[#8B4AFF]/15 mb-3">
          <Sparkles size={12} className="text-[#8B4AFF]" />
          <p className="text-[10px] font-bold text-[#8B4AFF]">Ao salvar, o iGentVet aprende com essa informação automaticamente</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border border-[#8B4AFF]/10 mb-5">
          <Zap size={12} className="text-[#8B4AFF]" />
          <p className="text-[10px] font-bold text-gray-700">Esta ação gera <span className="text-[#8B4AFF]">+5 XP</span> para o tutor</p>
        </div>

        {/* Success banner */}
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
              className="rounded-[22px] px-4 py-3 mb-4 flex items-center gap-3"
              style={{ background:'#F0FDF4', border:'1px solid #BBF7D0' }}>
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-black text-green-800">{config.label} registrada com sucesso!</p>
                {type === 'consultation' && protocolNumber && (
                  <p className="text-[9px] font-bold text-green-700 mt-0.5">Prontuário gerado · protocolo {protocolNumber}</p>
                )}
                {createdTreatment && (
                  <p className="text-[9px] font-bold text-green-600 mt-0.5">Tratamento ativo · role abaixo para gerenciar as doses</p>
                )}
              </div>
              <button onClick={() => navigate(-1)} className="text-[9px] font-black text-green-700 px-2.5 py-1 bg-green-100 rounded-full">
                Voltar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {/* Title */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Nome / Motivo principal</label>
            <input type="text" disabled={saved}
              className="w-full text-sm font-bold outline-none bg-transparent text-gray-800 placeholder-gray-300"
              placeholder={`Qual ${config.label.toLowerCase()}?`}
              value={formData.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          {/* Consultation extras */}
          {type === 'consultation' && (
            <>
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
                <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Motivo da consulta</label>
                <select className="w-full text-sm font-bold outline-none bg-transparent text-gray-800" disabled={saved}
                  value={formData.reason} onChange={(e) => set('reason', e.target.value)}>
                  <option value="">Selecione</option>
                  {COMMON_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {formData.reason === 'Outro' && (
                  <input type="text" disabled={saved}
                    className="w-full text-sm font-bold outline-none bg-transparent text-gray-800 placeholder-gray-300 mt-3 pt-3 border-t border-gray-100"
                    placeholder="Descreva o motivo" value={formData.customReason}
                    onChange={(e) => set('customReason', e.target.value)} />
                )}
              </div>

              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope size={14} className="text-[#8B4AFF]" />
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo de atendimento</p>
                </div>
                <div className="flex gap-2">
                  <SegmentedButton label="Clínico"     active={formData.appointmentMode==='clinical'}   onClick={() => set('appointmentMode','clinical')} />
                  <SegmentedButton label="Especialista" active={formData.appointmentMode==='specialist'} onClick={() => set('appointmentMode','specialist')} />
                </div>
                <AnimatePresence>
                  {formData.appointmentMode === 'specialist' && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Especialidade</label>
                        <select className="w-full text-sm font-bold outline-none bg-transparent text-gray-800" disabled={saved}
                          value={formData.specialty} onChange={(e) => set('specialty', e.target.value)}>
                          <option value="">Selecione</option>
                          {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {formData.specialty === 'Outro' && (
                          <input type="text" disabled={saved}
                            className="w-full text-sm font-bold outline-none bg-transparent text-gray-800 placeholder-gray-300 mt-3 pt-3 border-t border-gray-100"
                            placeholder="Qual especialidade?" value={formData.specialtyCustom}
                            onChange={(e) => set('specialtyCustom', e.target.value)} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          <ProvidersSelector petId={id}
            healthRecords={providerSources.healthRecords} treatments={providerSources.treatments}
            value={{ veterinarian:formData.veterinarian, clinicName:formData.clinicName, clinicPhone:formData.clinicPhone, clinicAddress:formData.clinicAddress }}
            onChange={updateProviders} />

          {/* Dates */}
          {type === 'consultation' ? (
            <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50">
              <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-tighter text-center">Data da consulta</label>
              <input type="date" disabled={saved}
                className="w-full text-xs font-bold outline-none bg-transparent text-center text-gray-700"
                value={formData.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[['date','Data'],['nextDate','Próxima dose']].map(([k,l]) => (
                <div key={k} className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50">
                  <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-tighter text-center">{l}</label>
                  <input type="date" disabled={saved}
                    className="w-full text-xs font-bold outline-none bg-transparent text-center text-gray-700"
                    value={formData[k]} onChange={(e) => set(k, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {/* Recheck */}
          {type === 'consultation' && (
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
              <Toggle label="Reconsulta recomendada" sublabel="Ativa lembrete para retorno"
                icon={<CalendarClock size={14} className="text-[#8B4AFF]" />}
                active={!!formData.recommendedRecheck}
                onToggle={() => set('recommendedRecheck', !formData.recommendedRecheck)} color="bg-[#8B4AFF]" />
              <AnimatePresence>
                {formData.recommendedRecheck && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-tighter text-center">Data da reconsulta</label>
                      <input type="date" disabled={saved}
                        className="w-full text-xs font-bold outline-none bg-transparent text-center text-gray-700"
                        value={formData.recheckDate} onChange={(e) => set('recheckDate', e.target.value)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Ongoing / controlled */}
          {ONGOING_TYPES.includes(type) && (
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50 space-y-3">
              <Toggle label="Tratamento contínuo"
                sublabel={type==='medicine' ? 'Ativa agendamento de doses com alertas automáticos' : 'iGentVet saberá que está em uso ativo'}
                icon={<RefreshCw size={14} className="text-[#8B4AFF]" />}
                active={isOngoing} onToggle={() => setIsOngoing((o) => !o)} color="bg-[#8B4AFF]" />
              {type === 'medicine' && (
                <Toggle label="Medicação controlada" sublabel="Ativa lembretes de dose no iGentVet"
                  icon={<Bell size={14} className="text-amber-500" />}
                  active={isControlled} onToggle={() => setIsControlled((o) => !o)} color="bg-amber-500" />
              )}
            </div>
          )}

          {/* Prescription */}
          {PRESCRIPTION_TYPES.includes(type) && (
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
              <Toggle label="Possui receita?" sublabel="Anexe PDF ou foto"
                icon={<FileText size={14} className="text-gray-400" />}
                active={hasPrescription} onToggle={() => setHasPrescription((o) => !o)} color={config.color} />
              <AnimatePresence>
                {hasPrescription && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                    <div onClick={() => fileInputRef.current?.click()}
                      className="mt-4 p-4 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 bg-gray-50 cursor-pointer active:scale-95 transition-all">
                      {selectedFile ? (
                        <div className="flex items-center gap-2 w-full px-2">
                          <FileText size={18} className={config.colorText} />
                          <span className="text-[10px] font-bold text-gray-700 truncate flex-1">{selectedFile.name}</span>
                          <X size={14} className="text-red-400" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} />
                        </div>
                      ) : (
                        <>
                          <Paperclip size={20} className="text-gray-300" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Anexar PDF ou Foto</span>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── TREATMENT TRIGGER CARD ─────────────────────────────────── */}
          {TREATMENT_TRIGGER_TYPES.includes(type) && !createdTreatment && (
            <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
              className="rounded-[24px] p-5 border"
              style={{ background:'linear-gradient(135deg,#F4F3FF 0%,#ffffff 100%)', borderColor:'#8B4AFF25' }}>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background:'#8B4AFF15' }}>
                  <Bell size={13} style={{ color:'#8B4AFF' }} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tratamento com alertas</p>
                  <p className="text-[9px] font-bold text-[#8B4AFF]">TreatmentTracker · Motor contínuo</p>
                </div>
              </div>

              {type === 'medicine' && isOngoing && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} className="overflow-hidden mb-4">
                  <div className="rounded-[16px] px-3 py-2.5 flex items-center gap-2" style={{ background:'#8B4AFF12', border:'1px solid #8B4AFF20' }}>
                    <Pill size={12} style={{ color:'#8B4AFF' }} />
                    <p className="text-[10px] font-bold text-[#8B4AFF]">Tratamento contínuo ativado — o tracker aparecerá aqui ao salvar</p>
                  </div>
                </motion.div>
              )}

              {(type === 'consultation' || (type === 'medicine' && !isOngoing)) && !saved && (
                <Toggle
                  label={type === 'consultation' ? 'Prescrever medicação com alertas' : 'Abrir tracker de doses'}
                  sublabel="Agenda doses e ativa notificações · aparece aqui mesmo"
                  icon={<Pill size={14} className="text-[#8B4AFF]" />}
                  active={!!formData.startTreatmentNow}
                  onToggle={() => set('startTreatmentNow', !formData.startTreatmentNow)} color="bg-[#8B4AFF]" />
              )}

              <AnimatePresence>
                {(formData.startTreatmentNow || (type === 'medicine' && isOngoing)) && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                    <div className="space-y-3 pt-4 mt-1 border-t border-[#8B4AFF10]">

                      {type === 'consultation' ? (
                        <div className="bg-white p-4 rounded-[20px] border border-gray-100">
                          <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">Medicação prescrita *</label>
                          <input type="text" disabled={saved}
                            className="w-full text-sm font-bold outline-none bg-transparent text-gray-800 placeholder-gray-300"
                            placeholder="ex: Amoxicilina 250mg"
                            value={formData.prescribedMedicationName}
                            onChange={(e) => set('prescribedMedicationName', e.target.value)} />
                        </div>
                      ) : (
                        <div className="rounded-[16px] px-3 py-2.5 flex items-center gap-2" style={{ background:'#F4F3FF', border:'1px solid #8B4AFF20' }}>
                          <Pill size={12} style={{ color:'#8B4AFF' }} />
                          <p className="text-[10px] font-bold text-gray-700">
                            Medicação: <span style={{ color:'#8B4AFF' }}>{formData.title || 'preenchida no campo acima'}</span>
                          </p>
                        </div>
                      )}

                      {/* Interval selector */}
                      <div className="grid grid-cols-3 gap-2">
                        {INTERVALS.map((opt) => (
                          <button key={opt.value} type="button" disabled={saved}
                            onClick={() => set('prescribedIntervalHours', opt.value)}
                            className="py-2.5 rounded-2xl text-[10px] font-black transition-all border"
                            style={formData.prescribedIntervalHours === opt.value
                              ? { background:C.purple, color:'white', borderColor:C.purple }
                              : { background:'#F4F3FF', color:C.purple, borderColor:'transparent' }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="bg-white p-4 rounded-[20px] border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block text-center tracking-widest">Fim do tratamento (vazio = contínuo)</label>
                        <input type="date" disabled={saved}
                          className="w-full text-xs font-bold outline-none bg-transparent text-center text-gray-700"
                          value={formData.prescribedEndDate}
                          onChange={(e) => set('prescribedEndDate', e.target.value)} />
                      </div>

                      <div className="rounded-[16px] px-3 py-2.5 flex items-start gap-2" style={{ background:'#FFF8E7', border:'1px solid #FDE68A' }}>
                        <Sparkles size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[9px] font-bold text-amber-700 leading-relaxed">
                          Ao confirmar, o tracker aparecerá aqui com as doses agendadas e alertas prontos para ativar — sem sair desta tela.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Notes */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
            <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block tracking-tighter">Observações</label>
            <textarea rows={3} disabled={saved}
              className="w-full text-sm font-bold outline-none resize-none bg-transparent text-gray-800 placeholder-gray-300"
              placeholder="Reações, lote, posologia, orientações..."
              value={formData.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-100 rounded-[20px] px-4 py-3">
              <p className="text-[10px] font-bold text-red-600">{saveError}</p>
            </div>
          )}

          {/* Submit */}
          {!saved && (
            <div className="pt-2">
              <button onClick={handleSave} disabled={loading}
                className={`w-full py-5 rounded-[24px] font-black text-white shadow-xl ${config.color} active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2`}>
                {loading ? 'Salvando...' : <>{config.icon} Confirmar {config.label}</>}
              </button>
              <p className="text-center text-[9px] text-[#8B4AFF] font-bold mt-3 flex items-center justify-center gap-1">
                <Sparkles size={9} /> iGentVet será informado automaticamente
              </p>
            </div>
          )}
        </div>

        {/* ── INLINE TREATMENT TRACKER ─────────────────────────────────── */}
        <AnimatePresence>
          {createdTreatment && (
            <motion.div ref={trackerRef} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ type:'spring', stiffness:220, damping:24, delay:0.1 }} className="mt-5">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background:'#8B4AFF15' }}>
                  <Bell size={11} style={{ color:'#8B4AFF' }} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tratamentos e Alertas</p>
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full" style={{ background:'#8B4AFF10', color:'#8B4AFF' }}>
                  Motor contínuo
                </span>
              </div>

              <InlineTreatmentTracker
                petId={id}
                petName={''}
                treatment={createdTreatment}
                userId={getLocalUserId()}
              />

              <button onClick={() => navigate(-1)}
                className="mt-4 w-full py-4 rounded-[22px] font-black text-[#8B4AFF] text-sm border border-[#8B4AFF20] bg-white"
                style={{ boxShadow:'0 2px 8px rgba(139,74,255,0.07)' }}>
                ← Voltar ao perfil
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>{xpToast ? <XPSuccessPill text={xpToast} /> : null}</AnimatePresence>
    </>
  );
}
