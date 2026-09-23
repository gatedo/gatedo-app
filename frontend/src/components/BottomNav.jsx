import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { AlertOctagon, Cat, HeartPulse, Home, MapPin, Menu, MessagesSquare, PlusCircle, Stethoscope } from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { brandAssets } from '../brand/assets';
import EmergencyCheckModal from './ProfileModules/EmergencyCheckModal';
import EmergencyCatPicker from './EmergencyCatPicker';
import useEmergencyCheck from '../hooks/useEmergencyCheck';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import RegistroAvulsoModal from './protocol/RegistroAvulsoModal';

// ─── CORES — mantém a identidade original ────────────────────────────────────
const ICON_ACTIVE = '#ecff3e';
const ICON_INACTIVE = 'rgba(236, 232, 255, 0.86)';
const NEON = '#ecff3e';
const PURPLE = '#8b4aff';

const iconStroke = (active) => (active ? ICON_ACTIVE : ICON_INACTIVE);
const iconWidth = (active) => (active ? 2.55 : 1.85);

const NavIcon = memo(function NavIcon({ active, Icon }) {
  return (
    <Icon
      size={22}
      stroke={iconStroke(active)}
      strokeWidth={iconWidth(active)}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        filter: active ? 'drop-shadow(0 0 8px rgba(236,255,62,0.42))' : 'none',
        transition: 'filter 180ms ease, stroke 180ms ease',
      }}
    />
  );
});

// ─── CSS ──────────────────────────────────────────────────────────────────────
const glassCSS = `
  .gatedo-bottom-nav-wrap {
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: linear-gradient(180deg, rgba(89,43,182,0) 0%, rgba(89,43,182,0) 72px, rgba(89,43,182,0.96) 72px, rgba(89,43,182,0.96) 100%);
  }

  .bn-pill {
    background:
      linear-gradient(180deg,
        rgba(159,99,255,0.90) 0%,
        rgba(126,70,225,0.91) 54%,
        rgba(89,43,182,0.96) 100%
      );
    backdrop-filter: blur(18px) saturate(150%);
    -webkit-backdrop-filter: blur(18px) saturate(150%);
    border: 1px solid rgba(220,207,255,0.24);
    border-bottom: 0;
    border-radius: 42px 42px 0 0;
    position: relative;
    overflow: hidden;
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg width='368' height='72' viewBox='0 0 368 72' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='white' d='M44 0H128C151 0 154 34 184 34C214 34 217 0 240 0H324C348.301 0 368 19.6995 368 44V72H0V44C0 19.6995 19.6995 0 44 0Z'/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg width='368' height='72' viewBox='0 0 368 72' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='white' d='M44 0H128C151 0 154 34 184 34C214 34 217 0 240 0H324C348.301 0 368 19.6995 368 44V72H0V44C0 19.6995 19.6995 0 44 0Z'/%3E%3C/svg%3E");
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    animation: none;
    transform: translateZ(0);
    will-change: transform, opacity;
    box-shadow:
      0 -8px 22px rgba(70,34,145,0.14),
      inset 0 1px 0 rgba(255,255,255,0.22),
      inset 0 -18px 24px rgba(52,25,132,0.18);
  }

  .bn-pill::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg,
        rgba(255,255,255,0.16) 0%,
        rgba(255,255,255,0.07) 46%,
        rgba(255,255,255,0.02) 100%
      );
    pointer-events: none;
    z-index: 2;
  }

  .bn-pill::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='368' height='72' viewBox='0 0 368 72' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M44 1H128C151 1 154 35 184 35C214 35 217 1 240 1H324' fill='none' stroke='rgba(255,255,255,0.34)' stroke-width='1.25' stroke-linecap='round'/%3E%3C/svg%3E");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    z-index: 4;
    pointer-events: none;
  }

  @keyframes glowBorder {
    0%,100% {
      box-shadow:
        0 0 0 1.5px rgba(223,255,64,0.18),
        0 -6px 28px rgba(139,74,255,0.16),
        0 14px 38px rgba(20,12,90,0.54),
        0 3px 10px rgba(0,0,0,0.30),
        inset 0 1px 0 rgba(255,255,255,0.14);
    }
    50% {
      box-shadow:
        0 0 0 1.5px rgba(223,255,64,0.28),
        0 -6px 32px rgba(223,255,64,0.12),
        0 14px 38px rgba(20,12,90,0.54),
        0 3px 10px rgba(0,0,0,0.30),
        inset 0 1px 0 rgba(255,255,255,0.14);
    }
  }

  .bn-center {
    background:
      radial-gradient(circle at 34% 24%, rgba(255,255,255,0.42) 0%, rgba(142,77,255,0.22) 28%, transparent 46%),
      radial-gradient(circle at 50% 54%, rgba(142,77,255,0.78) 0%, rgba(75,28,176,0.78) 48%, rgba(37,10,112,0.82) 100%);
    backdrop-filter: blur(14px) saturate(175%);
    -webkit-backdrop-filter: blur(14px) saturate(175%);
    border: 2px solid rgba(255,255,255,0.22);
    border-top: 2.5px solid rgba(255,255,255,0.44);
    animation: centerPulse 2.7s ease-in-out infinite;
    position: relative;
    overflow: hidden;
    transform: translateZ(0);
    will-change: transform, box-shadow;
  }

  .bn-center::before {
    content: '';
    position: absolute;
    top: 7px;
    left: 10px;
    width: 22px;
    height: 8px;
    background: radial-gradient(ellipse, rgba(255, 255, 255, 0.76), transparent 70%);
    border-radius: 50%;
    opacity: 0.48;
    pointer-events: none;
  }

  .bn-center::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.10), transparent 46%);
    pointer-events: none;
  }

  @keyframes centerPulse {
    0%,100% {
      box-shadow:
        0 0 0 3px rgba(223,255,64,0.28),
        0 0 19px rgba(223,255,64,0.34),
        0 14px 34px rgba(18,10,88,0.62),
        inset 0 2px 0 rgba(255,255,255,0.24);
    }
    50% {
      box-shadow:
        0 0 0 8px rgba(223,255,64,0.10),
        0 0 42px rgba(223,255,64,0.50),
        0 14px 34px rgba(18,10,88,0.62),
        inset 0 2px 0 rgba(255,255,255,0.24);
    }
  }

  @keyframes tapRipple {
    from { transform: scale(0.4); opacity: 0.72; }
    to   { transform: scale(3); opacity: 0; }
  }

  .tap-ripple {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(223,255,64,0.42);
    animation: tapRipple 0.72s ease-out forwards;
    pointer-events: none;
  }

  .bn-item {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .bn-fab-action {
    width: 46px;
    height: 46px;
    border-radius: 999px;
    background:
      radial-gradient(circle at 32% 22%, rgba(255,255,255,0.68), transparent 34%),
      linear-gradient(145deg, var(--fab-glass-a), var(--fab-glass-b));
    color: var(--fab-icon);
    box-shadow:
      0 8px 24px var(--fab-shadow),
      0 0 18px var(--fab-glow),
      inset 0 1px 0 rgba(255,255,255,0.72),
      inset 0 -10px 18px rgba(35,19,92,0.10);
    border: 1px solid rgba(255,255,255,0.58);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .bn-fab-action-label {
    position: absolute;
    top: 50%;
    padding: 3px 7px;
    border-radius: 999px;
    background: var(--fab-label-bg);
    color: #ffffff;
    font-size: 7px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    pointer-events: none;
  }

  .bn-fab-action-label-left {
    right: calc(100% + 8px);
    transform: translateY(-50%);
    text-align: right;
  }

  .bn-fab-action-label-right {
    left: calc(100% + 8px);
    transform: translateY(-50%);
    text-align: left;
  }

  @media (prefers-reduced-motion: reduce) {
    .bn-pill,
    .bn-center,
    .tap-ripple {
      animation: none !important;
    }
  }
`;

// ─── ROTAS — mesmas rotas definidas ───────────────────────────────────────────
const NAV = [
  { to: '/home', label: 'Início', Icon: Home, match: (p) => p === '/home' || p === '/', tour: 'nav-home' },
  { to: '/health', label: 'Saúde', Icon: HeartPulse, match: (p) => p.includes('health'), tour: 'nav-health' },
  { to: '/comunigato', label: 'ComuniGato', Icon: MessagesSquare, match: (p) => p.includes('comunigato') || p.includes('social'), tour: 'nav-comunigato' },
  { to: '/more', label: 'Mais', Icon: Menu, match: (p) => p.includes('more'), tour: 'nav-more' },
];

const CENTER_ACTIONS = [
  {
    to: '/cats',
    label: 'Meus Gatos',
    Icon: Cat,
    tour: 'fab-cats',
    x: -71,
    y: -33,
    side: 'left',
    theme: {
      '--fab-glass-a': 'rgba(244,255,104,0.88)',
      '--fab-glass-b': 'rgba(220,244,26,0.72)',
      '--fab-icon': '#4d3f00',
      '--fab-shadow': 'rgba(149,164,0,0.24)',
      '--fab-glow': 'rgba(236,255,62,0.48)',
      '--fab-label-bg': 'rgba(98,92,8,0.78)',
    },
  },
  {
    to: '/igent-vet',
    label: 'iGentVet',
    Icon: Stethoscope,
    tour: 'fab-igentvet',
    x: -33,
    y: -71,
    side: 'left',
    theme: {
      '--fab-glass-a': 'rgba(204,164,255,0.90)',
      '--fab-glass-b': 'rgba(137,82,255,0.76)',
      '--fab-icon': '#ffffff',
      '--fab-shadow': 'rgba(75,32,164,0.28)',
      '--fab-glow': 'rgba(174,113,255,0.46)',
      '--fab-label-bg': 'rgba(70,37,146,0.82)',
    },
  },
  {
    to: '/vets',
    label: 'Guia Vet',
    Icon: MapPin,
    x: 33,
    y: -71,
    side: 'right',
    theme: {
      '--fab-glass-a': 'rgba(92,248,224,0.88)',
      '--fab-glass-b': 'rgba(16,196,170,0.74)',
      '--fab-icon': '#064f49',
      '--fab-shadow': 'rgba(0,119,105,0.24)',
      '--fab-glow': 'rgba(57,238,216,0.44)',
      '--fab-label-bg': 'rgba(7,94,87,0.80)',
    },
  },
  {
    key: 'emergency',
    label: 'Emergência',
    Icon: AlertOctagon,
    x: 71,
    y: -33,
    side: 'right',
    isEmergency: true,
    theme: {
      '--fab-glass-a': 'rgba(255,140,140,0.92)',
      '--fab-glass-b': 'rgba(220,38,38,0.84)',
      '--fab-icon': '#ffffff',
      '--fab-shadow': 'rgba(153,15,15,0.32)',
      '--fab-glow': 'rgba(255,90,90,0.52)',
      '--fab-label-bg': 'rgba(153,15,15,0.86)',
    },
  },
];

// Só entra no leque quando há um protocolo com "registro_avulso" em
// andamento (ex.: Xixi Fora da Caixa) — atalho pro "Aconteceu de novo" de
// qualquer tela do app, sem precisar abrir o protocolo primeiro.
const AVULSO_ACTION = {
  key: 'avulso',
  label: 'Aconteceu de novo',
  Icon: PlusCircle,
  x: 0,
  y: -88,
  side: 'right',
  isAvulso: true,
  theme: {
    '--fab-glass-a': 'rgba(255,180,180,0.92)',
    '--fab-glass-b': 'rgba(220,38,38,0.80)',
    '--fab-icon': '#ffffff',
    '--fab-shadow': 'rgba(153,15,15,0.28)',
    '--fab-glow': 'rgba(255,90,90,0.46)',
    '--fab-label-bg': 'rgba(153,15,15,0.86)',
  },
};

// Acesso sempre visível — sinais graves, sem gamificação, sem IA
const CAT_ROUTE_RE = /^\/(cat|gato)\/([^/]+)/;

const BLOB_H = 44;
const BLOB_BR = 22;

// ─── LIQUID BLOB ──────────────────────────────────────────────────────────────
function LiquidBlob({ activeIdx, slotRefs, pillRef }) {
  const controls = useAnimation();
  const prevIdx = useRef(-1);
  const ready = useRef(false);

  const getCenterX = useCallback((idx) => {
    const slot = slotRefs[idx]?.current;
    const pill = pillRef?.current;
    if (!slot || !pill) return null;
    const sr = slot.getBoundingClientRect();
    const pr = pill.getBoundingClientRect();
    return sr.left + sr.width / 2 - pr.left;
  }, [pillRef, slotRefs]);

  useEffect(() => {
    if (activeIdx < 0) return;

    const from = prevIdx.current;
    const to = activeIdx;
    prevIdx.current = to;

    const toX = getCenterX(to);
    if (toX === null) return;

    if (!ready.current || from < 0 || from === to) {
      ready.current = true;
      controls.set({ left: toX - BLOB_H / 2, width: BLOB_H, borderRadius: `${BLOB_BR}px`, opacity: 0, scaleY: 0.42 });
      controls.start({ opacity: 1, scaleY: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } });
      return;
    }

    const fromX = getCenterX(from);
    if (fromX === null) return;

    const leftEdge = Math.min(fromX, toX) - BLOB_H / 2;
    const stretchW = Math.abs(toX - fromX) + BLOB_H;

    controls.start({
      left: leftEdge,
      width: stretchW,
      scaleY: 0.74,
      borderRadius: `${BLOB_BR}px`,
      opacity: 1,
      transition: {
        left: { duration: 0.055, ease: 'linear' },
        width: { duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] },
        scaleY: { duration: 0.14, ease: [0.4, 0, 0.6, 1] },
      },
    }).then(() => {
      controls.start({
        left: toX - BLOB_H / 2,
        width: BLOB_H,
        scaleY: 1,
        borderRadius: `${BLOB_BR}px`,
        transition: {
          left: { type: 'spring', stiffness: 520, damping: 34 },
          width: { type: 'spring', stiffness: 520, damping: 34 },
          scaleY: { type: 'spring', stiffness: 560, damping: 22 },
          borderRadius: { duration: 0.1 },
        },
      });
    });
  }, [activeIdx, controls, getCenterX]);

  if (activeIdx < 0) return null;

  return (
    <motion.div
      animate={controls}
      style={{
        position: 'absolute',
        top: '50%',
        translateY: '-50%',
        height: BLOB_H,
        background: 'linear-gradient(135deg, #f5ff6e 0%, #ecff3e 45%, #c8e800 100%)',
        boxShadow: '0 0 18px rgba(223,255,64,0.54), 0 2px 7px rgba(0,0,0,0.24)',
        zIndex: 3,
        pointerEvents: 'none',
        transformOrigin: 'center center',
        willChange: 'left, width, border-radius, transform',
      }}
    />
  );
}

// ─── BARRA INDICADORA ─────────────────────────────────────────────────────────
function NavBar({ activeIdx, slotRefs, pillRef }) {
  const [barLeft, setBarLeft] = useState(0);

  const updateBar = useCallback(() => {
    if (activeIdx < 0) return;
    const slot = slotRefs[activeIdx]?.current;
    const pill = pillRef?.current;
    if (!slot || !pill) return;
    const sr = slot.getBoundingClientRect();
    const pr = pill.getBoundingClientRect();
    const cx = sr.left + sr.width / 2 - pr.left;
    setBarLeft(cx - 14);
  }, [activeIdx, pillRef, slotRefs]);

  useEffect(() => {
    updateBar();
    const pill = pillRef?.current;
    if (!pill) return;

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateBar);
    };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (ro) ro.observe(pill);
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [activeIdx, updateBar, pillRef]);

  if (activeIdx < 0) return null;

  return (
    <motion.div
      animate={{ left: barLeft }}
      transition={{ type: 'spring', stiffness: 430, damping: 38 }}
      style={{
        position: 'absolute',
        bottom: 0,
        width: 28,
        height: 3,
        borderRadius: '3px 3px 0 0',
        background: `linear-gradient(90deg, rgba(223,255,64,0.45), ${NEON}, rgba(223,255,64,0.45))`,
        boxShadow: `0 0 12px ${NEON}, 0 0 4px ${NEON}`,
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}

function NavSlot({ item, index, slotRef, pathname, onTap }) {
  const active = item.match(pathname);

  return (
    <Link
      ref={slotRef}
      to={item.to}
      onClick={onTap}
      aria-label={item.label}
      data-tour={item.tour}
      className="bn-item flex-1 flex items-center justify-center h-full relative select-none"
      style={{ zIndex: 10 }}
    >
      <motion.div
        whileTap={{ scale: 0.74 }}
        transition={{ type: 'spring', stiffness: 620, damping: 24 }}
      >
        <NavIcon active={active} Icon={item.Icon} />
      </motion.div>
    </Link>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);
  const [ripples, setRipples] = useState([]);
  const [centerOpen, setCenterOpen] = useState(false);
  const [avulsoEnrollment, setAvulsoEnrollment] = useState(null);
  const [avulsoOpen, setAvulsoOpen] = useState(false);

  const emergency = useEmergencyCheck({ navigate, touch });

  // "Aconteceu de novo" só entra no leque quando há um protocolo com esse
  // recurso em andamento — atalho global, sem precisar abrir o protocolo.
  useEffect(() => {
    if (!user?.id) return;
    api.get('/content/protocols/enrollments/mine', { params: { userId: user.id } })
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        const found = list.find((e) => e.status === 'EM_ANDAMENTO' && e.currentDay >= 1 && e.protocol?.spec?.registro_avulso);
        setAvulsoEnrollment(found || null);
      })
      .catch(() => {});
  }, [user?.id]);

  const centerActions = useMemo(
    () => (avulsoEnrollment ? [...CENTER_ACTIONS, AVULSO_ACTION] : CENTER_ACTIONS),
    [avulsoEnrollment],
  );

  // Permite que o tour de recursos (SpotlightTour) abra/feche o leque do
  // botão central pra conseguir destacar "Meus Gatos"/"iGentVet" de verdade.
  useEffect(() => {
    const handler = (e) => setCenterOpen(Boolean(e.detail));
    window.addEventListener('gatedo-tour-fab', handler);
    return () => window.removeEventListener('gatedo-tour-fab', handler);
  }, []);

  const pillRef = useRef(null);
  const ref0 = useRef(null);
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);

  const slotRefs = useMemo(() => [ref0, ref1, ref2, ref3], []);
  const activeIdx = useMemo(() => NAV.findIndex((n) => n.match(location.pathname)), [location.pathname]);

  const fireRipple = useCallback(() => {
    const id = Date.now();
    setRipples((r) => [...r, id]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 820);
  }, []);

  const handleNavTap = useCallback(() => {
    setCenterOpen(false);
    touch?.('nav');
  }, [touch]);

  const handleCenterTap = useCallback(() => {
    fireRipple();
    setCenterOpen((open) => !open);
    touch?.('success');
  }, [fireRipple, touch]);

  const handleCenterActionTap = useCallback(() => {
    setCenterOpen(false);
    touch?.('nav');
  }, [touch]);

  const handleEmergencyTap = useCallback(() => {
    setCenterOpen(false);
    const match = CAT_ROUTE_RE.exec(location.pathname);
    emergency.trigger(match ? match[2] : undefined);
  }, [emergency, location.pathname]);

  const handleAvulsoTap = useCallback(() => {
    setCenterOpen(false);
    touch?.('success');
    setAvulsoOpen(true);
  }, [touch]);

  return (
    <>
      <style>{glassCSS}</style>

      <div
        data-bottom-nav="true"
        className="gatedo-bottom-nav-wrap fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-50 transition-all duration-300"
        style={{
          maxWidth: '460px',
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 28, delay: 0.04 }}
          className="relative"
        >
          {/* ─── BOTÃO CENTRAL FLUTUANTE ─── */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
            style={{ top: '-34px' }}
          >
            <div className="absolute left-1/2 top-[31px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              {centerActions.map((action, index) => {
                const Icon = action.Icon;
                const labelClass = `bn-fab-action-label bn-fab-action-label-${action.side === 'left' ? 'left' : 'right'}`;
                return (
                  <motion.div
                    key={action.to || action.key}
                    className="absolute left-1/2 top-1/2 pointer-events-auto"
                    initial={false}
                    animate={{
                      x: centerOpen ? action.x : 0,
                      y: centerOpen ? action.y : 0,
                      scale: centerOpen ? 1 : 0.2,
                      opacity: centerOpen ? 1 : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 520,
                      damping: 28,
                      delay: centerOpen ? index * 0.035 : 0,
                    }}
                    style={{ transformOrigin: 'center', pointerEvents: centerOpen ? 'auto' : 'none' }}
                  >
                    {action.isEmergency ? (
                      <button
                        type="button"
                        onClick={handleEmergencyTap}
                        disabled={emergency.loading}
                        aria-label={action.label}
                        className="bn-fab-action relative -translate-x-1/2 -translate-y-1/2"
                        style={action.theme}
                      >
                        <Icon size={19} strokeWidth={2.25} />
                        <span className={labelClass}>{action.label}</span>
                      </button>
                    ) : action.isAvulso ? (
                      <button
                        type="button"
                        onClick={handleAvulsoTap}
                        aria-label={action.label}
                        className="bn-fab-action relative -translate-x-1/2 -translate-y-1/2"
                        style={action.theme}
                      >
                        <Icon size={19} strokeWidth={2.25} />
                        <span className={labelClass}>{action.label}</span>
                      </button>
                    ) : (
                      <Link
                        to={action.to}
                        onClick={handleCenterActionTap}
                        aria-label={action.label}
                        data-tour={action.tour}
                        className="bn-fab-action relative -translate-x-1/2 -translate-y-1/2"
                        style={action.theme}
                      >
                        <Icon size={19} strokeWidth={2.25} />
                        <span className={labelClass}>{action.label}</span>
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCenterTap}
              aria-label="Abrir atalhos iGentVet"
              data-tour="fab-center"
              className="p-0 border-0 bg-transparent"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: centerOpen ? 12 : 0, scale: centerOpen ? 1.04 : 1 }}
                transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                className="bn-center w-[62px] h-[62px] rounded-full flex items-center justify-center"
              >
                {ripples.map((id) => <div key={id} className="tap-ripple" />)}
                <img
                  src={brandAssets.gatedoSymbol}
                  alt="G"
                  className="w-10 h-10 object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.58)]"
                />
              </motion.div>
            </button>

            <img
              src={brandAssets.igentvetLogo}
              alt="iGentVet"
              className="w-12 h-12 object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.58)]"
            />
          </div>

          {/* ─── PÍLULA GLASS ─── */}
          <div
            ref={pillRef}
            className="bn-pill"
            style={{ height: 72 }}
          >
            <div className="flex items-center h-full relative z-[8]">
              <NavSlot item={NAV[0]} index={0} slotRef={ref0} pathname={location.pathname} onTap={handleNavTap} />
              <NavSlot item={NAV[1]} index={1} slotRef={ref1} pathname={location.pathname} onTap={handleNavTap} />

              <div style={{ width: 84, flexShrink: 0 }} />

              <NavSlot item={NAV[2]} index={2} slotRef={ref2} pathname={location.pathname} onTap={handleNavTap} />
              <NavSlot item={NAV[3]} index={3} slotRef={ref3} pathname={location.pathname} onTap={handleNavTap} />
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {avulsoOpen && avulsoEnrollment && (
          <RegistroAvulsoModal
            spec={avulsoEnrollment.protocol?.spec}
            slug={avulsoEnrollment.protocol?.slug}
            enrollmentId={avulsoEnrollment.id}
            onClose={() => setAvulsoOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {emergency.open && (
          <EmergencyCheckModal
            cat={emergency.cat}
            navigate={navigate}
            onClose={emergency.close}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {emergency.pickerOpen && (
          <EmergencyCatPicker
            cats={emergency.pickerCats}
            onPick={emergency.pickCat}
            onClose={emergency.closePicker}
          />
        )}
      </AnimatePresence>
    </>
  );
}
