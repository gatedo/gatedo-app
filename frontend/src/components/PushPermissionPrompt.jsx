import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Share, PlusSquare, X } from 'lucide-react';
import { enablePush, isIosNotStandalone } from '../utils/push';
import useSensory from '../hooks/useSensory';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6' };

// Tela explicativa antes do pedido nativo de permissão — só aparece depois
// do primeiro lembrete criado (ver HealthForm.jsx). No iPhone fora do modo
// instalado, mostra o passo a passo de "Adicionar à Tela de Início" em vez
// do pedido de permissão, já que push não funciona no Safari solto.
export default function PushPermissionPrompt({ onClose }) {
  const touch = useSensory();
  const [status, setStatus] = useState(null);
  const iosBlocked = isIosNotStandalone();

  const handleEnable = async () => {
    touch();
    const result = await enablePush();
    setStatus(result);
    if (result === 'granted') {
      setTimeout(onClose, 1400);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/40 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-[28px] p-6 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={14} className="text-gray-500" />
          </button>

          <div
            className="w-14 h-14 rounded-[20px] flex items-center justify-center mb-4"
            style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
          >
            <Bell size={22} className="text-white" />
          </div>

          {iosBlocked ? (
            <>
              <h2 className="text-lg font-black text-gray-900 mb-1">Adicione o Gatedo à Tela de Início</h2>
              <p className="text-[13px] font-medium text-gray-500 mb-5 leading-relaxed">
                No iPhone, avisos só funcionam com o app instalado. É rápido:
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                  <Share size={16} className="text-[#8B4AFF] shrink-0" />
                  <p className="text-[12px] font-bold text-gray-600">Toque no ícone de compartilhar, na barra do Safari</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                  <PlusSquare size={16} className="text-[#8B4AFF] shrink-0" />
                  <p className="text-[12px] font-bold text-gray-600">Escolha "Adicionar à Tela de Início"</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full px-5 py-3.5 rounded-2xl font-black text-white text-sm"
                style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
              >
                Entendi
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-black text-gray-900 mb-1">Quer que a gente te avise no dia?</h2>
              <p className="text-[13px] font-medium text-gray-500 mb-6 leading-relaxed">
                Só lembretes de cuidado — vermífugo, antipulgas, vacina, pesagem. No máximo 1 aviso por dia.
              </p>

              {status === 'denied' && (
                <p className="text-[11px] font-bold text-amber-600 mb-3">
                  O navegador bloqueou o aviso. Dá pra liberar depois nas configurações do site.
                </p>
              )}
              {status === 'granted' && <p className="text-[12px] font-black text-emerald-600 mb-3">Prontinho, avisos ativados 🐾</p>}

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 px-5 py-3.5 rounded-2xl font-black text-gray-500 text-sm bg-gray-100">
                  Agora não
                </button>
                <button
                  onClick={handleEnable}
                  disabled={status === 'granted'}
                  className="flex-1 px-5 py-3.5 rounded-2xl font-black text-white text-sm"
                  style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
                >
                  Quero os avisos
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
