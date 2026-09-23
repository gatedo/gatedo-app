import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import api from '../../services/api';
import useSensory from '../../hooks/useSensory';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6' };

// Sem assets de ilustração reais ainda — usa um pictograma simples por CSS
// no lugar de "gato_agachado"/"gato_em_pe", troca fácil quando tiver a arte.
function GatoIlustracao({ tipo }) {
  if (tipo === 'gato_em_pe') {
    return (
      <div className="w-10 h-10 flex items-end justify-center">
        <div className="w-3 h-7 rounded-full" style={{ background: C.purple }} />
      </div>
    );
  }
  if (tipo === 'gato_agachado') {
    return (
      <div className="w-10 h-10 flex items-end justify-center">
        <div className="w-7 h-3.5 rounded-full" style={{ background: C.purple }} />
      </div>
    );
  }
  return null;
}

/**
 * "Aconteceu de novo" — dois toques (onde/como), acionável de qualquer
 * lugar (card da home, botão + do app, dentro do dia). `spec` já vem
 * carregado por quem abre o modal — sem fetch próprio.
 */
export default function RegistroAvulsoModal({ spec, slug, enrollmentId, catName, onClose, onSaved }) {
  const touch = useSensory();
  const [step, setStep] = useState('onde'); // onde -> como -> done
  const [onde, setOnde] = useState(null);
  const [saving, setSaving] = useState(false);

  const cfg = spec?.registro_avulso;
  const passoOnde = cfg?.passos?.find((p) => p.id === 'onde');
  const passoComo = cfg?.passos?.find((p) => p.id === 'como');

  const pickOnde = (opt) => {
    touch();
    setOnde(opt);
    setStep('como');
  };

  const pickComo = async (opt) => {
    touch('success');
    setSaving(true);
    try {
      const res = await api.post(`/content/protocol-spec/${slug}/registro-avulso`, {
        enrollmentId,
        onde,
        como: opt.rotulo || opt,
      }).catch(() => null);
      onSaved?.(res?.data);
      setStep('done');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="relative w-full sm:max-w-[420px] bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">
              {cfg?.nome || 'Aconteceu de novo'} {catName ? `· ${catName}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'onde' && (
            <motion.div key="onde" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <p className="text-[15px] font-black text-gray-900 mb-3">{passoOnde?.pergunta || 'Onde foi?'}</p>
              <div className="grid grid-cols-2 gap-2">
                {(passoOnde?.opcoes || []).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => pickOnde(opt)}
                    className="px-4 py-3.5 rounded-2xl text-left text-[12px] font-bold border border-gray-100 bg-gray-50 active:scale-95 transition-transform"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'como' && (
            <motion.div key="como" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <p className="text-[15px] font-black text-gray-900 mb-3">{passoComo?.pergunta || 'Você viu como ele estava?'}</p>
              <div className="space-y-2">
                {(passoComo?.opcoes || []).map((opt) => (
                  <button
                    key={opt.id}
                    disabled={saving}
                    onClick={() => pickComo(opt)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-left active:scale-[0.98] transition-transform"
                  >
                    {opt.ilustracao && <GatoIlustracao tipo={opt.ilustracao} />}
                    <span className="text-[13px] font-bold text-gray-800">{opt.rotulo}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${C.purple}18` }}>
                <Check size={22} style={{ color: C.purple }} />
              </div>
              <p className="text-[13px] font-bold text-gray-700 mb-5">{cfg?.confirmacao || 'Anotado.'}</p>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-2xl font-black text-white text-[12px]"
                style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
              >
                Fechar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
