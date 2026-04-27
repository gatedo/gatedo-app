import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';

export default function WelcomeFounder() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const name = query.get('name') || 'Tutor';
  const phase = query.get('phase') || '1';

  const [step, setStep] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep(2);
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#936cff,#8b4dff,#682adb)' }}
    >

       <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/assets/juju_memo.webp"
          alt=""
          className="w-full h-full object-cover opacity-50 mix-blend-screen"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(104,42,219,0.28),rgba(104,42,219,0.68))]" />
      </div>

      {/* Fundo base */}
      <img
        src="/assets/logo-fundo1.svg"
        alt=""
        className="absolute bottom-[-12%] left-[-30%] w-[135%] max-w-none opacity-100 pointer-events-none z-0 rotate-12"
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />

      <div className="relative z-10 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="welcome-step-1"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -12 }}
              transition={{ duration: 0.55 }}
              className="rounded-[42px] px-7 py-10 shadow-2xl text-center border border-white/15"
              style={{
                background: 'rgba(244,243,255,0.90)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-white/15 border border-white/20 shadow-lg flex items-center justify-center">
                  <img
                    src="/assets/App_gatedo_logo1.webp"
                    alt="Gatedo"
                    className="w-32 h-32 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-white/80 text-[11px] font-black uppercase tracking-[3px] mb-2 text-[#22223b]"
              >
                Bem-vindo(a), {name}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white text-[28px] leading-tight font-black mb-3 text-[#22223b]"
              >
                AO MUNDO
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                className="flex justify-center mb-5"
              >
                <img
                  src="/assets/logo_gatedo_full.webp"
                  alt="Gatedo"
                  className="h-10 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/75 text-sm leading-relaxed font-medium px-3 text-[#22223b]"
              >
                Seu acesso fundador foi ativado. Você entrou antes, em condição especial,
                e agora faz parte da base que ajuda a construir o futuro do GATEDO.
              </motion.p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="welcome-step-2"
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-[40px] shadow-2xl relative pt-16 pb-8 px-7"
              style={{
                background: 'rgba(244,243,255,0.95)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 bg-[#f8f4ff83] rounded-full flex items-center justify-center shadow-lg">
                  <img
                    src="/assets/App_gatedo_logo1.webp"
                    alt="Gatedo"
                    className="w-32 h-32 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full w-fit mx-auto border bg-[#FFFBEB] border-[#FDE68A]">
                  <Star size={11} className="text-[#f59e0b] fill-[#f59e0b]" />
                  <span className="text-[9px] font-black uppercase tracking-[2px] text-[#f59e0b]">
                    Fundador Vitalício · Fase {phase}
                  </span>
                </div>

                <h2 className="text-[28px] leading-none font-black text-[#22223b] mt-5 mb-2">
                  Seu acesso está ativo
                </h2>

                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Você agora possui um lugar especial dentro da primeira fase do GATEDO.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-4 p-4 rounded-[22px] bg-white border border-[#efeafe]">
                  <div className="w-11 h-11 rounded-2xl bg-[#fff7e8] flex items-center justify-center shrink-0">
                    <Crown size={18} className="text-[#f59e0b]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight text-[#22223b]">
                      Plano founder aplicado
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold">
                      Condição especial com status fundador ativo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-[22px] bg-white border border-[#efeafe]">
                  <div className="w-11 h-11 rounded-2xl bg-[#f4edff] flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-[#8B4AFF]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight text-[#22223b]">
                      Acesso antecipado
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold">
                      Entrada antes do público geral e novas evoluções primeiro.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-[22px] bg-white border border-[#efeafe]">
                  <div className="w-11 h-11 rounded-2xl bg-[#eefbf3] flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight text-[#22223b]">
                      Perfil com selo especial
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold">
                      Sua entrada fica marcada como parte da fase fundadora.
                    </p>
                  </div>
                </div>

                
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/home')}
                className="w-full text-white h-12 rounded-[40px] font-black shadow-lg flex items-center justify-center gap-2 uppercase text-sm tracking-wide"
                style={{
                  background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                  boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
                }}
              >
                Entrar no Gatedo <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}