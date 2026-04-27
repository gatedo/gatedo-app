/**
 * ManifestoPopup.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES:
 *   ✓ AnimatePresence importado (faltava — causava crash no step 3)
 *   ✓ ArrowRight, Star, Shield, Zap, CheckCircle importados
 *   ✓ export default adicionado
 *   ✓ audioRef com lazy init (não crasha se arquivo não existe)
 *   ✓ Suporte a plan='VIP' e plan='FOUNDER'
 *
 * Props:
 *   name     — nome pré-preenchido pelo token
 *   plan     — 'VIP' | 'FOUNDER'
 *   phase    — 1 | 2 | 3 (só Founder)
 *   onClose  — callback ao concluir (vai para formulário)
 */
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, ArrowRight,
  Star, Shield, Zap, CheckCircle, Crown, Sparkles
} from 'lucide-react';

// ─── Config por plano ─────────────────────────────────────────────────────────
const PLAN_CONFIG = {
  VIP: {
    badge:    '👑 Acesso VIP Beta',
    badgeBg:  '#823fff',
    greeting: 'Você foi escolhido para testar o Gatedo antes de todo mundo. Seu acesso é 100% gratuito.',
    stepLabel: 'O que você ganha como VIP',
    perks: [
      { icon: Star,   title: 'Selo Vitalício',  desc: 'Exclusivo para os primeiros testadores.' },
      { icon: Shield, title: 'Canal Direto',     desc: 'Seu feedback vai direto pro fundador.'   },
      { icon: Zap,    title: 'iGentVet Livre',   desc: 'IA veterinária sem nenhum limite.'        },
    ],
    cta: 'Começar Agora 🐾',
    finalMsg: 'Agora é só criar sua conta e cadastrar seus gatinhos.',
  },
  FOUNDER: {
    badge:    '🌟 Fundador Vitalício',
    badgeBg:  '#f59e0b',
    greeting: 'Seu plano vitalício está confirmado. Você faz parte da história do Gatedo.',
    stepLabel: 'Benefícios do Fundador',
    perks: [
      { icon: Crown,  title: 'Plano Vitalício',  desc: 'Sem renovações. Para sempre.'       },
      { icon: Shield, title: 'Suporte Direto',   desc: 'Canal aberto com o fundador.'       },
      { icon: Zap,    title: 'iGentVet Completo',desc: 'Acesso total ao assistente de IA.' },
    ],
    cta: 'Ativar Minha Conta 🌟',
    finalMsg: 'Seu selo de Fundador já está reservado no seu perfil.',
  },
};

export default function ManifestoPopup({ name = 'Tutor', plan = 'VIP', phase, onClose }) {
  const [step, setStep]       = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const cfg = PLAN_CONFIG[plan] || PLAN_CONFIG.VIP;

  // Lazy init do áudio — não crasha se arquivo não existe
  const handleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('./assets/sounds/manifesto.mp3');
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => { setIsPlaying(false); };
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(97,88,202,0.96)', backdropFilter: 'blur(16px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
        style={{ minHeight: 520, maxHeight: '90vh' }}
      >
        {/* ── Progress bar ── */}
        <div className="flex gap-1.5 px-7 pt-6 pb-0 shrink-0">
          {[1, 2, 3].map(i => (
            <motion.div key={i}
              className="h-1.5 flex-1 rounded-full"
              animate={{ background: step >= i ? '#823fff' : '#E5E7EB' }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ══ STEP 1: Manifesto ══ */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ x: 28, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -28, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="px-8 pt-6 pb-8 flex flex-col"
              >
                {/* Avatar / logo */}
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl shrink-0"
                  style={{ background: 'linear-gradient(135deg, #823fff, #5e42c0)' }}>
                  <img src="/logo-icon.png" alt="Gatedo"
                    className="w-12 h-12 object-contain"
                    onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }} />
                  <Sparkles size={32} color="white" style={{ display: 'none' }} />
                </div>

                {/* Badge */}
                <div className="flex justify-center mb-4">
                  <span className="text-[10px] font-black px-3 py-1.5 rounded-full text-white uppercase tracking-widest"
                    style={{ background: cfg.badgeBg }}>
                    {cfg.badge}{phase ? ` · Fase ${phase}` : ''}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-gray-800 mb-3 italic text-center">
                  Fala, {name}! 🐾
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 text-center font-medium">
                  {cfg.greeting}
                </p>

                {/* Botão de áudio */}
                <button onClick={handleAudio}
                  className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 mb-6 border border-gray-100 transition-all active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ background: '#823fff' }}>
                    {isPlaying
                      ? <div className="flex gap-0.5 items-end h-4">
                          {[3,5,4,6,3].map((h,i) => (
                            <div key={i} className="w-1 rounded-full bg-white"
                              style={{ height: h*3, animation: `bounce ${0.4+i*0.1}s ease-in-out infinite alternate` }} />
                          ))}
                        </div>
                      : <Play size={16} fill="white" />
                    }
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-[#8B4AFF] uppercase tracking-widest">
                      {isPlaying ? 'Ouvindo manifesto...' : 'Ouça o propósito do Gatedo'}
                    </p>
                    <p className="text-[9px] text-gray-400 font-medium mt-0.5">~2 minutos</p>
                  </div>
                </button>

                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(2)}
                  className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 text-sm uppercase tracking-wide shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #823fff, #5e42c0)' }}>
                  Continuar <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

            {/* ══ STEP 2: Benefícios ══ */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ x: 28, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -28, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="px-8 pt-6 pb-8 flex flex-col"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-[#8B4AFF] mb-1">
                  Seu plano inclui
                </p>
                <h2 className="text-xl font-black text-gray-800 italic mb-5">
                  {cfg.stepLabel}
                </h2>

                <div className="space-y-3 mb-6">
                  {cfg.perks.map((perk, idx) => {
                    const Icon = perk.icon;
                    return (
                      <motion.div key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex gap-3 p-3.5 bg-gray-50 rounded-[18px] border border-gray-100 items-center"
                      >
                        <div className="w-9 h-9 rounded-[14px] flex items-center justify-center shrink-0 bg-white shadow-sm"
                          style={{ border: '1px solid #e0ddff' }}>
                          <Icon size={17} color="#823fff" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-gray-800">{perk.title}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{perk.desc}</p>
                        </div>
                        <CheckCircle size={14} color="#10B981" />
                      </motion.div>
                    );
                  })}
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(3)}
                  className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 text-sm uppercase tracking-wide shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #823fff, #5e42c0)' }}>
                  Próximo <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            )}

            {/* ══ STEP 3: Pronto ══ */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ x: 28, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.22 }}
                className="px-8 pt-6 pb-8 flex flex-col items-center text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' }}
                >
                  <CheckCircle size={40} color="#059669" strokeWidth={2.5} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <h2 className="text-2xl font-black text-gray-800 mb-2 italic">Tudo pronto!</h2>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed mb-6">
                    {cfg.finalMsg}
                  </p>
                </motion.div>

                {/* Próximos passos */}
                <div className="w-full space-y-2.5 mb-6">
                  {['Criar minha conta', 'Cadastrar meu gato', 'Explorar o iGentVet'].map((item, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-[16px] bg-gray-50 border border-gray-100 text-left"
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[9px] font-black"
                        style={{ background: '#823fff' }}>{i + 1}</div>
                      <p className="text-xs font-black text-gray-700 flex-1">{item}</p>
                      <ArrowRight size={12} color="#D1D5DB" />
                    </motion.div>
                  ))}
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                  className="w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, #823fff, #5e42c0)',
                    boxShadow: '0 8px 32px rgba(97,88,202,0.4)',
                  }}>
                  {cfg.cta}
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}