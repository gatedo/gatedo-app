import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  AlertCircle,
  RefreshCw,
  Trash2,
  Bell,
  BellOff,
  CheckCircle,
  SkipForward,
  Activity,
  Sparkles,
  Zap,
  Stethoscope,
  FileText,
  Link,
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import api from '../../../services/api';
import usePushNotifications from '../../../hooks/usePushNotifications';
import { awardHealthXP } from '../../../utils/healthGamification';

const C = { purple: '#8B4AFF', accent: '#DFFF40' };

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '—';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : '—';

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

const INTERVALS = [
  { value: 4, label: 'A cada 4h' },
  { value: 6, label: 'A cada 6h' },
  { value: 8, label: 'A cada 8h' },
  { value: 12, label: 'A cada 12h' },
  { value: 24, label: '1x ao dia' },
  { value: 48, label: 'A cada 2 dias' },
];

function XPSuccessPill({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[120] px-4 py-2 rounded-full shadow-xl border"
      style={{
        background: 'linear-gradient(135deg, #8B4AFF 0%, #4B40C6 100%)',
        borderColor: 'rgba(255,255,255,0.18)',
      }}
    >
      <div className="flex items-center gap-2">
        <Zap size={13} className="text-[#DFFF40]" />
        <span className="text-[11px] font-black text-white">{text}</span>
      </div>
    </motion.div>
  );
}

function NewTreatmentModal({ cat, userId, onCreated, onClose, onXpEarned, treatmentContext = null }) {
  const [form, setForm] = useState({
    title: treatmentContext?.title || '',
    notes: treatmentContext?.notes || '',
    intervalHours: treatmentContext?.intervalHours || 8,
    startDate: treatmentContext?.startDate || new Date().toISOString().slice(0, 16),
    endDate: treatmentContext?.endDate || '',
    originHealthRecordId: treatmentContext?.originHealthRecordId || '',
    originPrescriptionDocumentId: treatmentContext?.originPrescriptionDocumentId || '',
    veterinarian: treatmentContext?.veterinarian || '',
    clinicName: treatmentContext?.clinicName || '',
    clinicPhone: treatmentContext?.clinicPhone || '',
    clinicAddress: treatmentContext?.clinicAddress || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!treatmentContext) return;

    setForm((prev) => ({
      ...prev,
      title: treatmentContext?.title || prev.title,
      notes: treatmentContext?.notes || prev.notes,
      intervalHours: treatmentContext?.intervalHours || prev.intervalHours,
      startDate: treatmentContext?.startDate || prev.startDate,
      endDate: treatmentContext?.endDate || prev.endDate,
      originHealthRecordId:
        treatmentContext?.originHealthRecordId || prev.originHealthRecordId,
      originPrescriptionDocumentId:
        treatmentContext?.originPrescriptionDocumentId || prev.originPrescriptionDocumentId,
      veterinarian: treatmentContext?.veterinarian || prev.veterinarian,
      clinicName: treatmentContext?.clinicName || prev.clinicName,
      clinicPhone: treatmentContext?.clinicPhone || prev.clinicPhone,
      clinicAddress: treatmentContext?.clinicAddress || prev.clinicAddress,
    }));
  }, [treatmentContext]);


  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Nome da medicação obrigatório');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        petId: cat.id,
        userId,
        title: form.title.trim(),
        notes: form.notes.trim() || undefined,
        intervalHours: form.intervalHours,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        veterinarian: form.veterinarian.trim() || undefined,
        clinicName: form.clinicName.trim() || undefined,
        clinicPhone: form.clinicPhone.trim() || undefined,
        clinicAddress: form.clinicAddress.trim() || undefined,
        originHealthRecordId: form.originHealthRecordId || undefined,
        originPrescriptionDocumentId: form.originPrescriptionDocumentId || undefined,
      };

      const res = await api.post('/treatments', payload);

      onCreated(res.data);

      await awardHealthXP({
        userId,
        petId: cat.id,
        action: 'treatment_created',
        amount: 5,
        meta: {
          title: form.title.trim(),
          intervalHours: form.intervalHours,
        },
      });

      onXpEarned?.('+5 XP por novo tratamento');
      onClose();
    } catch {
      setError('Erro ao criar tratamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const hasClinicContext = !!treatmentContext?.originHealthRecordId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-[800px] bg-white rounded-t-[32px] p-6 pb-10"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-gray-800">Novo Tratamento</h2>
            <p className="text-xs font-bold text-gray-400">para {cat.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* ── Linked consultation banner ───────────────────────────────── */}
        {hasClinicContext && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[18px] px-4 py-3 mb-4 flex items-start gap-3"
            style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}
          >
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#6366F120' }}
            >
              <Link size={12} className="text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                Tratamento vinculado a consulta
              </p>
              <p className="text-[10px] font-bold text-indigo-500 mt-0.5">
                Os dados do veterinário e da receita foram preenchidos automaticamente. Confirme e salve.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {treatmentContext?.veterinarian && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-700">
                    <Stethoscope size={8} className="inline mr-0.5" />
                    {treatmentContext.veterinarian}
                  </span>
                )}
                {treatmentContext?.clinicName && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gray-100 text-gray-600">
                    {treatmentContext.clinicName}
                  </span>
                )}
                {treatmentContext?.originPrescriptionDocumentId && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700">
                    <FileText size={8} className="inline mr-0.5" />
                    Receita vinculada
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
              Medicação / Tratamento *
            </label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="ex: Amoxicilina 250mg"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#8B4AFF] transition-colors"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
              Orientações (opcional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="ex: Dar com comida, diluído em água"
              rows={2}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#8B4AFF] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
              Intervalo entre doses
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTERVALS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set('intervalHours', opt.value)}
                  className="py-2.5 rounded-2xl text-[10px] font-black transition-all border"
                  style={
                    form.intervalHours === opt.value
                      ? { background: C.purple, color: 'white', borderColor: C.purple }
                      : { background: '#F4F3FF', color: C.purple, borderColor: 'transparent' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
              Início do tratamento
            </label>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#8B4AFF] transition-colors"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
              Fim do tratamento (opcional — deixe vazio para contínuo)
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#8B4AFF] transition-colors"
            />
          </div>

          {(form.veterinarian || form.clinicName || form.originPrescriptionDocumentId || form.originHealthRecordId) && (
            <div className="rounded-2xl bg-white border border-gray-200 px-4 py-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                    Contexto clínico do tratamento
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Este tratamento pode nascer de uma consulta, receita ou orientação clínica.
                  </p>
                </div>
                <div
                  className="px-2.5 py-1 rounded-full text-[9px] font-black"
                  style={{ background: '#F4F3FF', color: C.purple }}
                >
                  Integrado
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                    Veterinário responsável
                  </label>
                  <input
                    value={form.veterinarian}
                    onChange={(e) => set('veterinarian', e.target.value)}
                    placeholder="Nome do veterinário"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#8B4AFF] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                    Clínica
                  </label>
                  <input
                    value={form.clinicName}
                    onChange={(e) => set('clinicName', e.target.value)}
                    placeholder="Nome da clínica"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#8B4AFF] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                    Telefone da clínica
                  </label>
                  <input
                    value={form.clinicPhone}
                    onChange={(e) => set('clinicPhone', e.target.value)}
                    placeholder="(00) 0000-0000"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#8B4AFF] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                    Endereço / referência
                  </label>
                  <input
                    value={form.clinicAddress}
                    onChange={(e) => set('clinicAddress', e.target.value)}
                    placeholder="Cidade / bairro / endereço"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-[#8B4AFF] transition-colors"
                  />
                </div>
              </div>

              {(form.originHealthRecordId || form.originPrescriptionDocumentId) && (
                <div className="flex flex-wrap gap-2">
                  {form.originHealthRecordId ? (
                    <span
                      className="px-2.5 py-1 rounded-full text-[9px] font-black"
                      style={{ background: '#ECFEFF', color: '#155E75' }}
                    >
                      Registro clínico vinculado
                    </span>
                  ) : null}

                  {form.originPrescriptionDocumentId ? (
                    <span
                      className="px-2.5 py-1 rounded-full text-[9px] font-black"
                      style={{ background: '#FEF3C7', color: '#92400E' }}
                    >
                      Receita vinculada
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-[#F4F3FF] border border-[#8B4AFF18] px-4 py-3">
            <p className="text-[10px] font-black text-[#6D28D9] uppercase tracking-wider mb-1">
              Recompensa GATEDO
            </p>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Ao salvar um tratamento, o tutor recebe <strong>+5 XP</strong> pela organização da saúde do gato.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-bold flex items-center gap-1">
              <AlertCircle size={12} /> {error}
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: `linear-gradient(135deg, ${C.purple}, #8B5CF6)`,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
            {loading ? 'Criando...' : 'Criar Tratamento'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DoseCard({ dose, onTake, onSkip }) {
  const now = new Date();
  const scheduledAt = new Date(dose.scheduledAt);
  const isPast = scheduledAt < now;
  const isOverdue = isPast && !dose.takenAt && !dose.skipped;
  const isTaken = !!dose.takenAt;
  const isSkipped = dose.skipped;
  const until = timeUntil(dose.scheduledAt);

  const bg = isTaken ? '#F0FDF4' : isOverdue ? '#FEF2F2' : isSkipped ? '#F9FAFB' : '#F4F3FF';
  const border = isTaken ? '#BBF7D0' : isOverdue ? '#FECACA' : isSkipped ? '#E5E7EB' : `${C.purple}20`;
  const dot = isTaken ? '#16A34A' : isOverdue ? '#DC2626' : isSkipped ? '#9CA3AF' : C.purple;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all"
      style={{ background: bg, borderColor: border }}
    >
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot }} />

      <div className="flex-1">
        <p className="text-xs font-black text-gray-700">
          {fmtTime(dose.scheduledAt)}
          <span className="text-[9px] font-bold text-gray-400 ml-1.5">{fmtDate(dose.scheduledAt)}</span>
        </p>

        {isTaken && (
          <p className="text-[9px] font-bold text-green-600">
            ✓ Tomada às {fmtTime(dose.takenAt)}
          </p>
        )}

        {isSkipped && <p className="text-[9px] font-bold text-gray-400">Pulada</p>}
        {isOverdue && <p className="text-[9px] font-black text-red-500">⚠ Atrasada</p>}

        {!isPast && !isTaken && !isSkipped && (
          <p className="text-[9px] font-bold" style={{ color: C.purple }}>
            {until}
          </p>
        )}
      </div>

      {!isTaken && !isSkipped && (
        <div className="flex gap-1.5 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onTake(dose.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500"
          >
            <Check size={14} className="text-white" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onSkip(dose.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-200"
          >
            <SkipForward size={12} className="text-gray-500" />
          </motion.button>
        </div>
      )}
    </div>
  );
}

function TreatmentCard({ schedule, catName, userId, petId, onUpdate, onXpEarned }) {
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [optimisticDoses, setOptimisticDoses] = useState(schedule.doses || []);

  const nextDose = schedule.nextDose;
  const overdue = schedule.overdueCount || 0;
  const adherence = schedule.adherencePct ?? 100;

  // Is this treatment linked to a clinical consultation or prescription?
  const hasOrigin = !!(schedule.originHealthRecordId || schedule.originPrescriptionDocumentId);
  const hasProvider = !!(schedule.veterinarian || schedule.clinicName);

  const handleTake = async (doseId) => {
    setOptimisticDoses((prev) =>
      prev.map((d) => (d.id === doseId ? { ...d, takenAt: new Date().toISOString() } : d))
    );

    try {
      await api.post(`/treatments/doses/${doseId}/take`, { userId, catName });

      await awardHealthXP({
        userId,
        petId,
        action: 'treatment_dose_taken',
        amount: 5,
        meta: {
          treatmentId: schedule.id,
          title: schedule.title,
          doseId,
        },
      });

      onXpEarned?.('+5 XP por dose concluída');
      onUpdate();
    } catch {
      setOptimisticDoses(schedule.doses);
    }
  };

  const handleSkip = async (doseId) => {
    setOptimisticDoses((prev) =>
      prev.map((d) => (d.id === doseId ? { ...d, skipped: true } : d))
    );

    try {
      await api.post(`/treatments/doses/${doseId}/skip`);
      onUpdate();
    } catch {
      setOptimisticDoses(schedule.doses);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Encerrar tratamento "${schedule.title}"?`)) return;
    await api.patch(`/treatments/${schedule.id}/deactivate`);
    onUpdate();
  };

  const loadHistory = async () => {
    if (history.length > 0) {
      setShowHistory((s) => !s);
      return;
    }

    setLoadingHistory(true);

    try {
      const res = await api.get(`/treatments/${schedule.id}/doses`);
      setHistory(res.data || []);
      setShowHistory(true);
    } catch {
    } finally {
      setLoadingHistory(false);
    }
  };

  const interval =
    INTERVALS.find((i) => i.value === schedule.intervalHours)?.label || `${schedule.intervalHours}h`;

  const now = new Date();
  const visibleDoses = optimisticDoses.filter((d) => {
    const at = new Date(d.scheduledAt);
    return at >= new Date(now.getTime() - 86400000) && at <= new Date(now.getTime() + 24 * 3600000);
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border overflow-hidden"
      style={{
        borderColor: overdue > 0 ? '#FECACA' : `${C.purple}20`,
        background: overdue > 0 ? '#FFF5F5' : 'white',
      }}
    >
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-start gap-3 p-4 text-left">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: overdue > 0 ? '#FEE2E2' : `${C.purple}12` }}
        >
          <Pill size={18} style={{ color: overdue > 0 ? '#DC2626' : C.purple }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-black text-gray-800 text-sm leading-tight truncate">{schedule.title}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: `${C.purple}10`, color: C.purple }}
                >
                  <Clock size={8} className="inline mr-0.5" />
                  {interval}
                </span>

                {overdue > 0 && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                    ⚠ {overdue} atrasada{overdue > 1 ? 's' : ''}
                  </span>
                )}

                {/* ── Origin badge: shows when treatment came from a consultation ── */}
                {hasOrigin && (
                  <span
                    className="text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{ background: '#EEF2FF', color: '#4F46E5' }}
                  >
                    <Stethoscope size={7} />
                    Prescrito
                  </span>
                )}

                <span className="text-[9px] font-bold text-gray-400">{adherence}% adesão</span>
              </div>
            </div>

            {expanded ? (
              <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-1" />
            ) : (
              <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-1" />
            )}
          </div>

          {!expanded && nextDose && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.purple }} />
              <p className="text-[10px] font-black" style={{ color: C.purple }}>
                Próxima: {fmtTime(nextDose.scheduledAt)} ({timeUntil(nextDose.scheduledAt)})
              </p>
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {schedule.notes && (
                <div className="bg-[#F4F3FF] rounded-xl px-3 py-2 border border-[#8B4AFF10]">
                  <p className="text-[9px] font-black text-[#8B4AFF] uppercase tracking-wider mb-0.5">
                    Orientações
                  </p>
                  <p className="text-xs font-bold text-gray-600">{schedule.notes}</p>
                </div>
              )}

              {/* ── Clinical origin info (vet / clinic / linked record) ─────── */}
              {(hasOrigin || hasProvider) && (
                <div
                  className="rounded-[16px] px-3 py-2.5"
                  style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}
                >
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider mb-1.5">
                    Origem clínica
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {schedule.veterinarian && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white text-indigo-700 border border-indigo-100">
                        <Stethoscope size={8} className="inline mr-0.5" />
                        {schedule.veterinarian}
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
                        <FileText size={8} className="inline mr-0.5" />
                        Receita vinculada
                      </span>
                    )}
                  </div>
                </div>
              )}

              {visibleDoses.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">
                    Doses — próximas 24h
                  </p>
                  <div className="space-y-1.5">
                    {visibleDoses.map((dose) => (
                      <DoseCard key={dose.id} dose={dose} onTake={handleTake} onSkip={handleSkip} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                    Adesão ao tratamento
                  </p>
                  <p
                    className="text-[9px] font-black"
                    style={{
                      color: adherence >= 80 ? '#16A34A' : adherence >= 50 ? '#D97706' : '#DC2626',
                    }}
                  >
                    {adherence}%
                  </p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${adherence}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{
                      background: adherence >= 80 ? '#16A34A' : adherence >= 50 ? '#D97706' : '#DC2626',
                    }}
                  />
                </div>
              </div>

              <button
                onClick={loadHistory}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                style={{ color: C.purple }}
              >
                <Activity size={11} />
                {showHistory ? 'Ocultar histórico' : 'Ver histórico completo'}
                {loadingHistory && <RefreshCw size={10} className="animate-spin" />}
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-1.5"
                  >
                    {history.slice(0, 20).map((dose) => (
                      <DoseCard key={dose.id} dose={dose} onTake={() => {}} onSkip={() => {}} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="rounded-xl bg-[#F4F3FF] border border-[#8B4AFF14] px-3 py-2">
                <p className="text-[9px] font-black text-[#8B4AFF] uppercase tracking-wider mb-0.5">
                  Recompensa
                </p>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Cada dose concluída corretamente gera <strong>+5 XP</strong> para o tutor.
                </p>
              </div>

              <button
                onClick={handleDeactivate}
                className="flex items-center gap-1.5 text-[9px] font-black text-red-400 uppercase tracking-wider mt-1"
              >
                <Trash2 size={11} />
                Encerrar tratamento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TreatmentTracker({
  cat,
  treatmentContext = null,
  autoOpen = false,
}) {
  const { user } = useContext(AuthContext);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pushStatus, setPushStatus] = useState('idle');
  const [xpToast, setXpToast] = useState('');

  const { requestPermission, notificationsEnabled, notificationPermission } = usePushNotifications(user?.id, cat?.id);

  const loadSchedules = useCallback(async () => {
    if (!cat?.id) return;

    try {
      const res = await api.get(`/treatments?petId=${cat.id}`);
      setSchedules(res.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [cat?.id]);

  useEffect(() => {
    loadSchedules();

    setPushStatus(notificationPermission);
  }, [cat?.id, loadSchedules, notificationPermission]);

  useEffect(() => {
    if (autoOpen) {
      setShowModal(true);
    }
  }, [autoOpen]);

  const handleEnablePush = async () => {
    setPushStatus('asking');
    const result = await requestPermission();
    setPushStatus(result);
  };

  const handleCreated = (newSchedule) => {
    setSchedules((prev) => [newSchedule, ...prev]);
  };

  const showXpEarned = (text) => {
    setXpToast(text);
    setTimeout(() => setXpToast(''), 2400);
  };

  const activeSchedules = schedules.filter((s) => s.active);
  const hasOverdue = activeSchedules.some((s) => s.overdueCount > 0);

  return (
    <div className="space-y-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill size={14} style={{ color: C.purple }} />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
            Tratamentos Ativos
          </span>

          {activeSchedules.length > 0 && (
            <span
              className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
              style={{
                background: hasOverdue ? '#FEE2E2' : `${C.purple}15`,
                color: hasOverdue ? '#DC2626' : C.purple,
              }}
            >
              {activeSchedules.length}
            </span>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black text-white"
          style={{ background: `linear-gradient(135deg, ${C.purple}, #8B5CF6)` }}
        >
          <Plus size={11} /> Novo
        </motion.button>
      </div>

      {/* ── Pending context banner (when arriving from HealthForm) ───────── */}
      {(
        treatmentContext?.title ||
        treatmentContext?.veterinarian ||
        treatmentContext?.clinicName ||
        treatmentContext?.originPrescriptionDocumentId
      ) && (
        <div className="rounded-[24px] border px-4 py-3 bg-white shadow-sm" style={{ borderColor: '#E9D5FF' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[2px]" style={{ color: C.purple }}>
                Tratamento com contexto clínico
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                Este módulo já está pronto para receber vínculo com consulta, receita e dados do veterinário.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 rounded-full text-[9px] font-black text-white"
              style={{ background: `linear-gradient(135deg, ${C.purple}, #8B5CF6)` }}
            >
              Vincular agora
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {treatmentContext?.title ? (
              <span className="px-2 py-1 rounded-full text-[9px] font-black bg-[#F4F3FF] text-[#8B4AFF]">
                Medicação: {treatmentContext.title}
              </span>
            ) : null}
            {treatmentContext?.veterinarian ? (
              <span className="px-2 py-1 rounded-full text-[9px] font-black bg-gray-100 text-gray-700">
                Vet: {treatmentContext.veterinarian}
              </span>
            ) : null}
            {treatmentContext?.clinicName ? (
              <span className="px-2 py-1 rounded-full text-[9px] font-black bg-gray-100 text-gray-700">
                Clínica: {treatmentContext.clinicName}
              </span>
            ) : null}
            {treatmentContext?.originPrescriptionDocumentId ? (
              <span className="px-2 py-1 rounded-full text-[9px] font-black bg-amber-50 text-amber-700">
                Receita vinculada
              </span>
            ) : null}
          </div>
        </div>
      )}

      {!notificationsEnabled && activeSchedules.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 w-fit">
          <BellOff size={10} className="text-slate-400" />
          <p className="text-[9px] font-bold text-slate-500">NotificaÃ§Ãµes desativadas nas configuraÃ§Ãµes</p>
        </div>
      )}

      {notificationsEnabled && pushStatus !== 'granted' && pushStatus !== 'denied' && activeSchedules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl px-4 py-3 flex items-center gap-3 border"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
        >
          <Bell size={16} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-amber-800">Ativar lembretes no celular</p>
            <p className="text-[9px] font-bold text-amber-600">Receba alertas 10min antes de cada dose</p>
          </div>
          <button
            onClick={handleEnablePush}
            disabled={pushStatus === 'asking'}
            className="text-[9px] font-black text-white px-3 py-1.5 rounded-full bg-amber-500 flex-shrink-0"
          >
            {pushStatus === 'asking' ? '...' : 'Ativar'}
          </button>
        </motion.div>
      )}

      {notificationsEnabled && pushStatus === 'granted' && activeSchedules.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 w-fit">
          <CheckCircle size={10} className="text-green-500" />
          <p className="text-[9px] font-black text-green-700">Alertas no celular ativados</p>
        </div>
      )}

      {notificationsEnabled && pushStatus === 'denied' && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 w-fit">
          <BellOff size={10} className="text-gray-400" />
          <p className="text-[9px] font-bold text-gray-500">Notificações bloqueadas no navegador</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : activeSchedules.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-gray-200 rounded-[24px]">
          <Pill size={24} className="text-gray-200 mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-400">Nenhum tratamento ativo</p>
          <p className="text-[10px] text-gray-300 mt-0.5">
            Clique em "+ Novo" para agendar medicações com lembretes
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {activeSchedules.map((schedule) => (
              <TreatmentCard
                key={schedule.id}
                schedule={schedule}
                catName={cat?.name}
                userId={user?.id}
                petId={cat?.id}
                onUpdate={loadSchedules}
                onXpEarned={showXpEarned}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <NewTreatmentModal
            cat={cat}
            userId={user?.id}
            onCreated={handleCreated}
            onClose={() => setShowModal(false)}
            onXpEarned={showXpEarned}
            treatmentContext={treatmentContext}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{xpToast ? <XPSuccessPill text={xpToast} /> : null}</AnimatePresence>
    </div>
  );
}
