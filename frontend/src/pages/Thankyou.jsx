/**
 * ThankYou.jsx — Página de obrigado pós-compra (Kiwify → /obrigado)
 *
 * URL de destino na Kiwify:
 *   https://app.gatedo.com/obrigado?phase=1&name=João
 *
 * Fluxo completo:
 *   Kiwify (pagamento) → /obrigado → email de ativação → /register?token=XXX → /home
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, Star, Shield, Zap, Crown, Lock } from 'lucide-react';

const PHASE_CONFIG = {
  1: { price: 47, label: 'Early Bird',  vagas: 50  },
  2: { price: 67, label: 'Fundador',    vagas: 100 },
  3: { price: 97, label: 'Acesso Final',vagas: 200 },
};

const PERKS = [
  { icon: Crown,  text: 'Plano Vitalício — sem renovações, para sempre'    },
  { icon: Zap,    text: 'iGentVet IA veterinária sem restrições de uso'    },
  { icon: Shield, text: 'Suporte direto com o fundador do Gatedo'          },
  { icon: Star,   text: 'Badge exclusivo de Fundador no perfil do app'     },
];

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  duration: 3 + Math.random() * 4,
  delay: Math.random() * 4,
  opacity: Math.random() * 0.4 + 0.1,
}));

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);

  const phase = Number(searchParams.get('phase') || 1);
  const name  = searchParams.get('name') || 'Fundador';
  const cfg   = PHASE_CONFIG[phase] || PHASE_CONFIG[1];

  // Facebook Pixel
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: cfg.price,
        currency: 'BRL',
        content_name: `Fundador Gatedo — Fase ${phase}`,
        content_type: 'product',
        num_items: 1,
      });
    }
  }, []);

  // Avança para manifesto após entrada
  useEffect(() => {
    const t = setTimeout(() => setStep(1), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-5 pb-16 pt-12 overflow-x-hidden relative"
      style={{ background: 'linear-gradient(160deg, #0d0520 0%, #1a0a38 50%, #0d0520 100%)' }}>

      {/* Partículas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map(p => (
          <motion.div key={p.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ opacity: [p.opacity, p.opacity * 0.15, p.opacity] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity }} />
        ))}
        <div className="absolute top-[-10%] right-[-15%] w-[60vw] h-[60vw] max-w-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(130,63,255,0.2), transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute bottom-[5%] left-[-10%] w-[50vw] h-[40vw] max-w-[350px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(223,255,64,0.08), transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-8">
          <img src="/assets/App_gatedo_logo.svg" alt="Gatedo"
            className="h-10 brightness-0 invert"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        </motion.div>

        <AnimatePresence mode="wait">

          {/* STEP 0 — Confirmação */}
          {step === 0 && (
            <motion.div key="confirm"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center">

              <motion.div
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.2 }}
                className="w-28 h-28 rounded-full flex items-center justify-center mb-6 relative">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(223,255,64,0.5), transparent 70%)', filter: 'blur(16px)' }} />
                <div className="w-full h-full rounded-full flex items-center justify-center relative"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, rgba(223,255,64,0.25), rgba(130,63,255,0.5) 60%, rgba(30,10,80,0.9) 100%)',
                    border: '2px solid rgba(223,255,64,0.35)',
                    boxShadow: '0 0 40px rgba(223,255,64,0.2)',
                  }}>
                  <CheckCircle size={52} color="#ebfc66" strokeWidth={2} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2"
                  style={{ color: 'rgba(235,252,102,0.7)' }}>Compra confirmada ✓</p>
                <h1 className="text-3xl font-black text-white leading-tight">
                  Bem-vindo ao<br />
                  <span style={{ color: '#ebfc66' }}>Gatedo, {name}!</span>
                </h1>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 1 — Manifesto + instruções */}
          {step === 1 && (
            <motion.div key="content"
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col gap-4">

              {/* Badge de fase */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{ background: 'rgba(235,252,102,0.1)', border: '1px solid rgba(235,252,102,0.25)' }}>
                  <Star size={11} color="#ebfc66" fill="#ebfc66" />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ebfc66' }}>
                    Fundador · Fase {phase} · {cfg.label}
                  </span>
                </div>
              </div>

              {/* Manifesto */}
              <div className="rounded-[24px] p-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-3"
                  style={{ color: 'rgba(235,252,102,0.6)' }}>Você faz parte da história</p>
                <p className="text-sm font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Todo mundo tem um gato que mudou sua vida. O Gatedo nasceu para honrar essa relação —
                  com tecnologia, comunidade e cuidado real. Você é um dos primeiros a tornar isso possível.{' '}
                  <span className="font-black text-white">Obrigado por acreditar antes de todo mundo.</span>
                </p>
              </div>

              {/* Benefícios */}
              <div className="rounded-[24px] p-5 space-y-3"
                style={{ background: 'rgba(130,63,255,0.1)', border: '1px solid rgba(130,63,255,0.2)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>Seus benefícios incluem</p>
                {PERKS.map((perk, i) => {
                  const Icon = perk.icon;
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(235,252,102,0.1)', border: '1px solid rgba(235,252,102,0.2)' }}>
                        <Icon size={14} color="#ebfc66" />
                      </div>
                      <p className="text-[11px] font-bold leading-snug" style={{ color: 'rgba(255,255,255,0.7)' }}>{perk.text}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Próximo passo — email */}
              <div className="rounded-[24px] p-5"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Mail size={20} color="#34d399" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Verifique seu e-mail</p>
                    <p className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Próximo passo obrigatório</p>
                  </div>
                </div>
                <p className="text-[11px] font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Enviamos um <span className="text-white font-black">link de ativação</span> para
                  o e-mail usado na compra. Clique nele para criar sua senha e acessar o app.{' '}
                  Verifique também a caixa de <span className="text-white font-black">spam</span>.
                </p>
              </div>

              {/* Rodapé */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <p className="text-[10px] font-bold text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <Lock size={9} className="inline mr-1" />
                  Acesso único · Fase {phase} · {cfg.vagas} vagas · {cfg.label}
                </p>
                <p className="text-[10px] font-bold text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Dúvidas? contato@gatedo.com
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}