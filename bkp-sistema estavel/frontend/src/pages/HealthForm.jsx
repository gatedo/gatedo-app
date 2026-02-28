import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Paperclip, User, FileText, X, Sparkles, Bell, CheckCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const TYPE_CONFIG = {
  vaccine:      { label: 'Vacina',      color: 'bg-pink-500',     colorText: 'text-pink-600',     icon: '💉', igentType: 'VACCINE'     },
  vermifuge:    { label: 'Vermífugo',   color: 'bg-blue-500',     colorText: 'text-blue-600',     icon: '💊', igentType: 'VERMIFUGE'   },
  parasite:     { label: 'Antipulgas',  color: 'bg-purple-500',   colorText: 'text-purple-600',   icon: '✨', igentType: 'PARASITE'    },
  medicine:     { label: 'Medicação',   color: 'bg-amber-500',    colorText: 'text-amber-600',    icon: '🛍️', igentType: 'MEDICATION'  },
  consultation: { label: 'Consulta',   color: 'bg-[#6158ca]',    colorText: 'text-[#6158ca]',    icon: '🩺', igentType: 'CONSULTATION' },
};

const TYPE_MAP = {
  vaccine: 'VACCINE', vermifuge: 'VERMIFUGE', parasite: 'PARASITE',
  medicine: 'MEDICATION', consultation: 'CONSULTATION',
};

// Tipos que podem ser tratamentos contínuos (iGentVet precisa saber)
const ONGOING_TYPES = ['medicine', 'parasite', 'vermifuge'];
// Tipos que têm receita médica relevante
const PRESCRIPTION_TYPES = ['medicine', 'consultation'];
// Tipos que alimentam o contexto de medicação da IA
const IGENT_MEDICATION_TYPES = ['medicine', 'vermifuge', 'parasite'];

export default function HealthForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const type = searchParams.get('type') || 'vaccine';
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.vaccine;

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasPrescription, setHasPrescription] = useState(false);
  const [isOngoing, setIsOngoing] = useState(false);    // tratamento contínuo
  const [isControlled, setIsControlled] = useState(false); // medicação controlada
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    nextDate: '',
    veterinarian: '',
    notes: '',
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!formData.title) return alert('Informe o nome/motivo');
    setLoading(true);
    try {
      // 1. Salva o health-record normalmente
      await api.post('/health-records', {
        petId: id,
        type: TYPE_MAP[type],
        title: formData.title,
        date: new Date(formData.date),
        nextDueDate: formData.nextDate ? new Date(formData.nextDate) : null,
        veterinarian: formData.veterinarian || undefined,
        notes: formData.notes || undefined,
        ongoing: isOngoing,
        active: isOngoing,
        prescription: hasPrescription,
        isControlled: isControlled,
      });

      // 2. Notifica o iGentVet sobre nova medicação/vacina — alimenta o contexto da IA
      // Fire-and-forget: não bloqueia mesmo se endpoint não existir
      if (IGENT_MEDICATION_TYPES.includes(type) || type === 'vaccine') {
        api.post('/igent/record-update', {
          petId: id,
          recordType: TYPE_MAP[type],
          title: formData.title,
          date: formData.date,
          nextDueDate: formData.nextDate || null,
          ongoing: isOngoing,
          isControlled,
          notes: formData.notes || null,
        }).catch(() => {}); // silencioso
      }

      setSaved(true);
      setTimeout(() => navigate(-1), 1400);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center px-6 gap-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircle size={36} className="text-green-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-center">
          <p className="font-black text-gray-800 text-lg">{config.label} registrada!</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Sparkles size={12} className="text-[#6158ca]" />
            <p className="text-sm text-[#6158ca] font-bold">iGentVet atualizado com essa informação</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-24 pt-6 px-5 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registrar</p>
          <h1 className="text-lg font-black text-gray-800 tracking-tight leading-none">
            {config.icon} {config.label}
          </h1>
        </div>
      </div>

      {/* Badge iGentVet */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F3FF] rounded-2xl border border-[#6158ca]/15 mb-5">
        <Sparkles size={12} className="text-[#6158ca]" />
        <p className="text-[10px] font-bold text-[#6158ca]">
          Ao salvar, o iGentVet aprende com essa informação automaticamente
        </p>
      </div>

      <div className="space-y-3">

        {/* Nome */}
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
          <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-widest">
            Nome / Motivo
          </label>
          <input
            type="text"
            className="w-full text-sm font-bold outline-none bg-transparent text-gray-800 placeholder-gray-300"
            placeholder={`Qual ${config.label.toLowerCase()}?`}
            value={formData.title}
            onChange={e => set('title', e.target.value)}
          />
        </div>

        {/* Veterinário */}
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50 flex items-center gap-3">
          <User size={16} className="text-gray-300 flex-shrink-0" />
          <div className="flex-1">
            <label className="text-[9px] font-black text-gray-400 uppercase mb-0.5 block tracking-widest">
              Veterinário
            </label>
            <input
              type="text"
              className="w-full text-sm font-bold outline-none bg-transparent text-gray-800 placeholder-gray-300"
              placeholder="Nome do Dr(a)."
              value={formData.veterinarian}
              onChange={e => set('veterinarian', e.target.value)}
            />
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50">
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-tighter text-center">
              Data
            </label>
            <input
              type="date"
              className="w-full text-xs font-bold outline-none bg-transparent text-center text-gray-700"
              value={formData.date}
              onChange={e => set('date', e.target.value)}
            />
          </div>
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50">
            <label className="text-[9px] font-black text-gray-400 uppercase mb-1.5 block tracking-tighter text-center">
              Próxima dose
            </label>
            <input
              type="date"
              className="w-full text-xs font-bold outline-none bg-transparent text-center text-gray-700"
              value={formData.nextDate}
              onChange={e => set('nextDate', e.target.value)}
            />
          </div>
        </div>

        {/* Tratamento contínuo — só para tipos relevantes */}
        {ONGOING_TYPES.includes(type) && (
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50 space-y-3">
            <Toggle
              label="Tratamento contínuo"
              sublabel="iGentVet saberá que está em uso ativo"
              icon={<RefreshCw size={14} className="text-[#6158ca]" />}
              active={isOngoing}
              onToggle={() => setIsOngoing(o => !o)}
              color="bg-[#6158ca]"
            />
            {type === 'medicine' && (
              <Toggle
                label="Medicação controlada"
                sublabel="Ativa lembretes de dose no iGentVet"
                icon={<Bell size={14} className="text-amber-500" />}
                active={isControlled}
                onToggle={() => setIsControlled(o => !o)}
                color="bg-amber-500"
              />
            )}
          </div>
        )}

        {/* Alerta de medicação controlada */}
        <AnimatePresence>
          {isControlled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-amber-50 border border-amber-100 rounded-[20px] px-4 py-3 flex items-start gap-3">
                <Bell size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                  O iGentVet vai exibir chips de lembrete de dose durante as próximas consultas e sugerir o agendamento de notificações no seu dispositivo.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Receita */}
        {PRESCRIPTION_TYPES.includes(type) && (
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
            <Toggle
              label="Possui receita?"
              sublabel="Anexe PDF ou foto"
              icon={<FileText size={14} className="text-gray-400" />}
              active={hasPrescription}
              onToggle={() => setHasPrescription(o => !o)}
              color={config.color}
            />
            <AnimatePresence>
              {hasPrescription && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                  />
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="mt-4 p-4 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 bg-gray-50 cursor-pointer active:scale-95 transition-all"
                  >
                    {selectedFile ? (
                      <div className="flex items-center gap-2 w-full px-2">
                        <FileText size={18} className={config.colorText} />
                        <span className="text-[10px] font-bold text-gray-700 truncate flex-1">{selectedFile.name}</span>
                        <X size={14} className="text-red-400" onClick={e => { e.stopPropagation(); setSelectedFile(null); }} />
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

        {/* Observações */}
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
          <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block tracking-tighter">
            Observações
          </label>
          <textarea
            rows={3}
            className="w-full text-sm font-bold outline-none resize-none bg-transparent text-gray-800 placeholder-gray-300"
            placeholder="Reações, lote, posologia..."
            value={formData.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        {/* Botão salvar */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full py-5 rounded-[24px] font-black text-white shadow-xl ${config.color} active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2`}
          >
            {loading ? (
              <><span className="animate-pulse">Salvando...</span></>
            ) : (
              <>{config.icon} Confirmar {config.label}</>
            )}
          </button>
          <p className="text-center text-[9px] text-[#6158ca] font-bold mt-3 flex items-center justify-center gap-1">
            <Sparkles size={9} />
            iGentVet será informado automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── TOGGLE REUTILIZÁVEL ──────────────────────────────────────────────────────
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
      <button
        type="button"
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${active ? color : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${active ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}