import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertOctagon,
  Check,
  X,
  Stethoscope,
  MessageCircleHeart,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

const RED = '#DC2626';
const RED_BG = '#FEF2F2';
const RED_BORDER = '#FECACA';

function getSigns(cat) {
  const urinaryLabel =
    cat?.gender === 'MALE'
      ? 'Macho tentando urinar e não sai nada'
      : 'Tentando urinar e não sai nada';

  return [
    { id: 'urinary', label: urinaryLabel },
    { id: 'prostration', label: 'Prostração — não reage, muito fraco' },
    { id: 'breathing', label: 'Dificuldade para respirar' },
    { id: 'seizure', label: 'Convulsão' },
    { id: 'anorexia', label: 'Mais de 24h sem comer' },
    { id: 'belly', label: 'Barriga dura e dolorida' },
  ];
}

function catArticle(cat) {
  return cat?.gender === 'FEMALE' ? 'a' : 'o';
}

// ─── Checklist inicial ───────────────────────────────────────────────────────
function ChecklistScreen({ cat, onFlag, onNoneSelected }) {
  const signs = getSigns(cat);
  const [checkedId, setCheckedId] = useState(null);
  const title = cat?.name
    ? `O que está acontecendo com ${catArticle(cat)} ${cat.name}?`
    : 'Seu gato está estranho agora?';

  const handleSelect = (id) => {
    if (checkedId) return;
    setCheckedId(id);
    window.setTimeout(() => onFlag(id), 260);
  };

  return (
    <>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: RED_BG }}>
          <AlertOctagon size={22} style={{ color: RED }} />
        </div>
        <div>
          <p className="font-black text-gray-900 text-[15px] leading-tight">{title}</p>
          <p className="text-[12px] font-medium text-gray-500 mt-1">
            Marque se notar qualquer um destes sinais neste momento:
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {signs.map((s) => {
          const checked = checkedId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              disabled={checkedId !== null}
              className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-colors duration-200 ${
                checked
                  ? 'bg-[#DC2626] border-[#DC2626]'
                  : 'bg-[#FEF2F2] border-[#FECACA] hover:bg-[#FEE2E2] hover:border-[#FCA5A5] active:bg-[#FECACA] active:border-[#FCA5A5]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors duration-200 ${
                  checked ? 'bg-white border-white' : 'border-current'
                }`}
                style={!checked ? { borderColor: RED } : undefined}
              >
                {checked && <Check size={14} strokeWidth={3.5} style={{ color: RED }} />}
              </span>
              <span
                className={`text-[13px] font-bold transition-colors duration-200 ${
                  checked ? 'text-white' : 'text-gray-800'
                }`}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNoneSelected}
        className="w-full py-3.5 rounded-2xl font-black text-[13px] text-gray-500 bg-gray-100"
      >
        Não notei nenhum desses sinais
      </button>
    </>
  );
}

// ─── Tela única de orientação urgente ───────────────────────────────────────
function UrgentScreen({ cat, flaggedLabel, onGoToConsultation, onClose }) {
  return (
    <>
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: RED }}>
          <AlertOctagon size={30} className="text-white" />
        </div>
        <p className="font-black text-gray-900 text-[17px] leading-tight mb-2">
          Procure um veterinário agora
        </p>
        <p className="text-[13px] font-medium text-gray-500 leading-relaxed">
          {flaggedLabel ? <>Você marcou: <b className="text-gray-700">{flaggedLabel}</b>. </> : null}
          Isso pede avaliação presencial imediata — não espere para ver se {cat?.name || 'o gato'} melhora sozinho.
        </p>
      </div>

      <button
        onClick={onGoToConsultation}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm mb-2"
        style={{ background: RED }}
      >
        <Stethoscope size={18} /> Registrar consulta agora
      </button>
      <button onClick={onClose} className="w-full py-3 rounded-2xl font-black text-[13px] text-gray-400">
        Fechar
      </button>
    </>
  );
}

// ─── Tela calma — nada marcado ───────────────────────────────────────────────
function CalmScreen({ onGoToIgent, onGoToDiary }) {
  return (
    <>
      <div className="flex flex-col items-center text-center mb-5">
        <p className="font-black text-gray-900 text-[16px] leading-tight mb-1.5">
          Que bom que não é nada grave agora
        </p>
        <p className="text-[13px] font-medium text-gray-500 leading-relaxed">
          Se ainda assim algo te preocupa, você pode:
        </p>
      </div>

      <button
        onClick={onGoToIgent}
        className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl mb-2"
        style={{ background: '#F4F3FF' }}
      >
        <MessageCircleHeart size={20} style={{ color: '#8B4AFF' }} className="shrink-0" />
        <span className="flex-1 text-left text-[13px] font-black text-gray-800">Perguntar ao iGentVet</span>
        <ChevronRight size={16} className="text-gray-300" />
      </button>

      <button
        onClick={onGoToDiary}
        className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl"
        style={{ background: '#FFF7ED' }}
      >
        <BookOpen size={20} style={{ color: '#F97316' }} className="shrink-0" />
        <span className="flex-1 text-left text-[13px] font-black text-gray-800">Registrar no diário</span>
        <ChevronRight size={16} className="text-gray-300" />
      </button>
    </>
  );
}

// ─── Modal principal ─────────────────────────────────────────────────────────
export default function EmergencyCheckModal({ cat, onClose, navigate }) {
  const [screen, setScreen] = useState('checklist'); // checklist | urgent | calm
  const [flaggedLabel, setFlaggedLabel] = useState(null);

  const handleFlag = (id) => {
    const sign = getSigns(cat).find((s) => s.id === id);
    setFlaggedLabel(sign?.label || null);
    setScreen('urgent');
  };

  const goToConsultation = () => {
    onClose();
    navigate?.(`/cat/${cat.id}/health-new?type=consultation`);
  };

  const goToIgent = () => {
    onClose();
    navigate?.('/igent-vet', { state: { catId: cat.id } });
  };

  const goToDiary = () => {
    onClose();
    navigate?.(`/cat/${cat.id}/diary`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4">
          <X size={18} className="text-gray-300" />
        </button>

        <AnimatePresence mode="wait">
          {screen === 'checklist' && (
            <motion.div key="checklist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChecklistScreen cat={cat} onFlag={handleFlag} onNoneSelected={() => setScreen('calm')} />
            </motion.div>
          )}
          {screen === 'urgent' && (
            <motion.div key="urgent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UrgentScreen
                cat={cat}
                flaggedLabel={flaggedLabel}
                onGoToConsultation={goToConsultation}
                onClose={onClose}
              />
            </motion.div>
          )}
          {screen === 'calm' && (
            <motion.div key="calm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CalmScreen onGoToIgent={goToIgent} onGoToDiary={goToDiary} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
