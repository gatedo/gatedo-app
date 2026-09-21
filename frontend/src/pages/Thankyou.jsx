/**
 * ThankYou.jsx - Pagina de obrigado pos-compra (Kiwify -> /obrigado)
 */
import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Lock, Mail, Star } from 'lucide-react';
import { getFounderLaunchPhase } from '../utils/founderLaunchConfig';

const PHASE_BADGES = {
  1: '/assets/badges/badge-genese.webp',
  2: '/assets/badges/badge-raiz.webp',
  3: '/assets/badges/badge-cerne.webp',
};

const PHASE_POINTS = {
  1: '300',
  2: '200',
  3: '100',
};

const PHASE_DISCOUNT = {
  1: '25%',
  2: '20%',
  3: '10%',
};

const PHASE_TONE = {
  1: '#10BDF2',
  2: '#10C896',
  3: '#FF7A4F',
};

function buildBenefits(phase, label) {
  return [
    `Selo ${label.toUpperCase()}`,
    'Sem limite de gatos',
    'Comunidade de tutores',
    'Acesso a novos modulos',
    'Acesso extra modulos IA',
    `${PHASE_POINTS[phase] || '300'} (GPT's) Gatedo Points`,
    'Memorial vitalicio',
    `${PHASE_DISCOUNT[phase] || '25%'} OFF vitalicio`,
  ];
}

const PARTICLES = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  x: (i * 29) % 100,
  y: (i * 47) % 100,
  size: (i % 3) + 1,
  duration: 3.5 + (i % 5) * 0.7,
  delay: (i % 8) * 0.18,
  opacity: 0.12 + (i % 4) * 0.08,
}));

export default function ThankYou() {
  const [searchParams] = useSearchParams();

  const phase = Number(searchParams.get('phase') || 1);
  const name = searchParams.get('name') || 'Fundador';
  const cfg = getFounderLaunchPhase(phase);
  const tone = PHASE_TONE[cfg.n] || PHASE_TONE[1];
  const badge = PHASE_BADGES[cfg.n] || PHASE_BADGES[1];
  const benefits = useMemo(() => buildBenefits(cfg.n, cfg.displayLabel), [cfg.n, cfg.displayLabel]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: cfg.price,
        currency: 'BRL',
        content_name: `Fundador Gatedo - Fase ${cfg.n}`,
        content_type: 'product',
        num_items: 1,
      });
    }
  }, [cfg.n, cfg.price]);

  return (
    <main
      className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 overflow-hidden px-5 py-8 text-white md:px-8"
      style={{
        background:
          'radial-gradient(circle at 50% -10%, rgba(139,74,255,0.34), transparent 34%), linear-gradient(160deg, #0B031E 0%, #170634 42%, #270A55 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ opacity: [p.opacity, p.opacity * 0.25, p.opacity] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity }}
          />
        ))}
        <div
          className="absolute -left-32 top-16 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,74,255,.28), transparent 68%)' }}
        />
        <div
          className="absolute -right-40 bottom-8 h-[460px] w-[460px] rounded-full opacity-40 blur-3xl"
          style={{ background: `radial-gradient(circle, ${tone}55, transparent 70%)` }}
        />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[520px] flex-col items-center justify-center gap-4">
        <motion.img
          src="/assets/App_gatedo_logo.svg"
          alt="Gatedo"
          className="h-10 w-auto object-contain"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        />

        <motion.img
          src={badge}
          alt={cfg.displayLabel}
          className="h-36 w-36 object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.28)]"
          initial={{ opacity: 0, scale: 0.78, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 210, damping: 18, delay: 0.08 }}
        />

        <motion.div
          className="flex items-center gap-2 rounded-full border px-5 py-2 text-[10px] font-black uppercase tracking-[0.18em]"
          style={{ borderColor: `${tone}88`, background: 'rgba(255,255,255,0.08)', color: '#EBFC46' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <Star size={12} fill="#EBFC46" />
          Fundador - Fase {cfg.n} - {cfg.displayLabel}
        </motion.div>

        <motion.div
          className="w-full rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_54px_rgba(0,0,0,0.18)]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: '#EBFC46' }}>
            Voce faz parte da historia
          </p>
          <h1 className="mb-3 text-2xl font-black leading-tight md:text-3xl">
            Bem-vindo ao Gatedo, <span style={{ color: '#EBFC46' }}>{name}</span>.
          </h1>
          <p className="text-sm font-semibold leading-relaxed text-white/72">
            Todo mundo tem um gato que mudou sua vida. O Gatedo nasceu para honrar essa relacao com
            tecnologia, comunidade e cuidado real. Voce e um dos primeiros a tornar isso possivel.{' '}
            <strong className="text-white">Obrigado por acreditar antes de todo mundo.</strong>
          </p>
        </motion.div>

        <motion.div
          className="w-full rounded-[26px] border p-5"
          style={{ borderColor: `${tone}55`, background: 'rgba(139,74,255,0.16)' }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/42">
            Seus beneficios incluem
          </p>
          <div className="grid gap-2.5">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                className="flex items-center gap-3 text-xs font-black text-white/76"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.44 + index * 0.035 }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border"
                  style={{ borderColor: `${tone}88`, background: 'rgba(255,255,255,0.06)' }}
                >
                  <CheckIcon color={tone} />
                </span>
                {benefit}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="w-full rounded-[26px] border border-emerald-400/30 bg-emerald-400/[0.08] p-5"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
              <Mail size={21} />
            </div>
            <div>
              <p className="text-base font-black">Verifique seu e-mail</p>
              <p className="text-[10px] font-black uppercase tracking-wide text-white/40">Proximo passo obrigatorio</p>
            </div>
          </div>
          <p className="text-xs font-semibold leading-relaxed text-white/58">
            Enviamos um <strong className="text-white">link de ativacao</strong> para o e-mail usado na compra.
            Clique nele para criar sua senha e acessar o app. Verifique tambem a caixa de{' '}
            <strong className="text-white">spam</strong>.
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-2 pt-2 text-center">
          <p className="text-[10px] font-bold text-white/24">
            <Lock size={10} className="mr-1 inline" />
            Acesso unico - Fase {cfg.n} - {cfg.totalVagas} vagas - {cfg.displayLabel}
          </p>
          <p className="text-[10px] font-bold text-white/24">Duvidas? contato@gatedo.com</p>
        </div>
      </section>
    </main>
  );
}

function CheckIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
