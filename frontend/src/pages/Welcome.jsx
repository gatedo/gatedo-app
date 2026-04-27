/**
 * Welcome.jsx — Tela pública universal
 *
 * Exibida para: visitantes, pós-logout, acesso direto
 * Fluxo: slides cinematográficos → /planos
 *        "Já tenho conta" → /login
 *
 * FIX: Zap importado (estava sendo usado sem import no original)
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Crown, Heart, User, Zap } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    eyebrow: 'Saúde & Bem-estar',
    title: ['Seu Gato', 'Merece', 'o Melhor'],
    desc: 'Vacinas, consultas, peso e humor — tudo em um único perfil feito só pra ele.',
    img: '/assets/slide-2.webp',
    Icon: Heart,
    accentColor: '#823fff',
  },
  {
    id: 2,
    eyebrow: 'IA Preditiva',
    title: ['Respostas', 'na Hora', 'que Precisa'],
    desc: 'O iGentVet entende comportamento, sintomas e hábitos do seu gato em segundos.',
    img: '/assets/jade.webp',
    Icon: Sparkles,
    accentColor: '#ebfc66',
  },
  {
    id: 3,
    eyebrow: 'Plano Fundador',
    title: ['Seja', 'Fundador', ' Gatedo'],
    desc: 'Acesso vitalício com preço de lançamento. Sem renovações. Prioridade na comunidade.',
    img: '/assets/slide-3.webp',
    Icon: Crown,
    accentColor: '#f59e0b',
    isOffer: true,
  },
];

export default function Welcome() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const slide = SLIDES[current];

  // Autoplay 5s
  useEffect(() => {
    if (paused || current === SLIDES.length - 1) return;
    const t = setInterval(() => setCurrent(c => c + 1), 5000);
    return () => clearInterval(t);
  }, [current, paused]);

  const handleCTA = () => {
    setPaused(true);
    if (current < SLIDES.length - 1) setCurrent(c => c + 1);
    else navigate('/clube');
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden relative select-none">

      {/* ── Foto de fundo cinematográfica ── */}
      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0">
          <img src={slide.img} alt="" className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.42) saturate(1.3)' }} />
          <div className="absolute inset-0" style={{
            background: `
              linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.05) 65%, transparent 100%),
              linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 55%),
              radial-gradient(ellipse at 75% 15%, ${slide.accentColor}18 0%, transparent 55%)
            `
          }} />
        </motion.div>
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-14">
        <img src="/assets/logo_gatedo_amarelo.webp" alt="Gatedo"
          className="h-10 opacity-90"
          onError={e => e.currentTarget.style.display = 'none'} />

        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.16)',
            color: 'rgba(255,255,255,0.8)',
          }}>
          <User size={12} /> Já tenho conta
        </motion.button>
      </div>

      {/* ── Progress bars ── */}
      <div className="relative z-20 flex gap-1.5 px-6 mt-4">
        {SLIDES.map((s, i) => (
          <button key={i} onClick={() => { setCurrent(i); setPaused(true); }}
            className="relative flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.18)' }}>
            {i < current && (
              <div className="absolute inset-0 rounded-full" style={{ background: s.accentColor }} />
            )}
            {i === current && (
              <motion.div className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: slide.accentColor }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={paused ? { duration: 0 } : { duration: 5, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Conteúdo ── */}
      <div className="relative z-20 flex-1 flex flex-col justify-end px-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div key={current}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-[10px] flex items-center justify-center"
                style={{ background: slide.accentColor + '22', border: `1px solid ${slide.accentColor}40` }}>
                <slide.Icon size={13} style={{ color: slide.accentColor }} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.22em]"
                style={{ color: slide.accentColor }}>
                {slide.eyebrow}
              </span>
            </div>

            {/* Título em bloco — layout editorial */}
            <div className="mb-6" style={{ lineHeight: 0.88 }}>
              {slide.title.map((line, i) => (
                <motion.h1 key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="block font-black text-white"
                  style={{ fontSize: 'clamp(2.2rem, 1.5vw, 3.2rem)' }}>
                  {line}
                </motion.h1>
              ))}
            </div>

            <p className="font-medium leading-relaxed mb-6 max-w-[290px]"
              style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.93rem' }}>
              {slide.desc}
            </p>

            {slide.isOffer && (
              <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-wide mb-5"
                style={{ background: 'linear-gradient(135deg, #ffa20085, #d97706a1)', color: 'white' }}>
                <Zap size={11} fill="white" /> Oferta de Lançamento · Vagas Limitadas
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleCTA}
          className="w-full flex items-center justify-between px-6 rounded-full font-black text-sm uppercase tracking-widest text-white"
          style={{
            height: 62,
            background: slide.isOffer
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #823fff, #682adb)',
            boxShadow: slide.isOffer
              ? '0 8px 28px rgba(245,158,11,0.4)'
              : '0 8px 28px rgba(120,101,218,0.5)',
          }}>
          <span>{current === SLIDES.length - 1 ? 'Ver Planos' : 'Próximo'}</span>
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}>
            <ArrowRight size={20} />
          </motion.span>
        </motion.button>

        <button onClick={() => navigate('/clube')}
          className="mt-4 text-center text-[10px] font-black uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.28)' }}>
          Ver todos os planos
        </button>
      </div>
    </div>
  );
}