import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { Home, Sparkles, MessagesSquare, ShoppingBag } from 'lucide-react';
import useSensory from '../hooks/useSensory';

// ─── CORES — mantém a identidade original ────────────────────────────────────
const ICON_ACTIVE = '#5B21B6';
const ICON_INACTIVE = 'rgba(211,204,255,0.68)';
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
        filter: active ? 'drop-shadow(0 0 5px rgba(236,255,62,0.45))' : 'none',
        transition: 'filter 180ms ease, stroke 180ms ease',
      }}
    />
  );
});

// ─── CSS ──────────────────────────────────────────────────────────────────────
const glassCSS = `
  .gatedo-bottom-nav-wrap {
    padding-bottom: max(20px, env(safe-area-inset-bottom));
    background: linear-gradient(
      to top,
      var(--gatedo-app-bg, #eeeeff) 0,
      var(--gatedo-app-bg, #eeeeff) env(safe-area-inset-bottom, 0px),
      transparent calc(env(safe-area-inset-bottom, 0px) + 1px)
    );
  }

  .bn-pill {
    background:
      linear-gradient(175deg,
        rgba(58,20,129,0.50) 0%,
        rgba(39,18,99,0.58) 48%,
        rgba(42,9,78,0.70) 100%
      );
    backdrop-filter: blur(18px) saturate(165%);
    -webkit-backdrop-filter: blur(18px) saturate(165%);
    border: 1px solid rgba(190,157,255,0.46);
    border-top: 1px solid rgba(255,255,255,0.22);
    position: relative;
    overflow: hidden;
    animation: glowBorder 3.5s ease-in-out infinite;
    transform: translateZ(0);
    will-change: transform, opacity;
  }

  .bn-pill::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg,
        rgba(255,255,255,0.16) 0%,
        rgba(255,255,255,0.055) 42%,
        rgba(255,255,255,0.02) 100%
      );
    pointer-events: none;
    z-index: 2;
  }

  .bn-pill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 8px;
    right: 8px;
    height: 47%;
    background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%);
    border-radius: 50px 50px 0 0;
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
    background: radial-gradient(ellipse, rgba(255,255,255,0.76), transparent 70%);
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
  { to: '/home', Icon: Home, match: (p) => p === '/home' || p === '/' },
  { to: '/studio', Icon: Sparkles, match: (p) => p.includes('studio') },
  { to: '/comunigato', Icon: MessagesSquare, match: (p) => p.includes('comunigato') || p.includes('social') },
  { to: '/store', Icon: ShoppingBag, match: (p) => p.includes('store') || p.includes('loja') },
];

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
      aria-label={item.to.replace('/', '') || 'home'}
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
  const touch = useSensory();
  const [ripples, setRipples] = useState([]);

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
    touch?.('light');
  }, [touch]);

  const handleCenterTap = useCallback(() => {
    fireRipple();
    touch?.('success');
  }, [fireRipple, touch]);

  return (
    <>
      <style>{glassCSS}</style>

      <div
        data-bottom-nav="true"
        className="gatedo-bottom-nav-wrap fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-50 transition-all duration-300"
        style={{ maxWidth: '460px', paddingLeft: 12, paddingRight: 12 }}
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
            <Link to="/igent-vet" onClick={handleCenterTap} aria-label="iGent Vet">
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                className="bn-center w-[62px] h-[62px] rounded-full flex items-center justify-center"
              >
                {ripples.map((id) => <div key={id} className="tap-ripple" />)}
                <img
                  src="/assets/Gatedo_logo.webp"
                  alt="G"
                  className="w-10 h-10 object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.58)]"
                />
              </motion.div>
            </Link>

            <img
              src="/assets/igentvet_logo.webp"
              alt="iGentVet"
              className="w-12 h-12 object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.58)]"
            />
          </div>

          {/* ─── PÍLULA GLASS ─── */}
          <div
            ref={pillRef}
            className="bn-pill rounded-[50px]"
            style={{ height: 64 }}
          >
            <LiquidBlob activeIdx={activeIdx} slotRefs={slotRefs} pillRef={pillRef} />
            <NavBar activeIdx={activeIdx} slotRefs={slotRefs} pillRef={pillRef} />

            <div className="flex items-center h-full relative z-[8]">
              <NavSlot item={NAV[0]} index={0} slotRef={ref0} pathname={location.pathname} onTap={handleNavTap} />
              <NavSlot item={NAV[1]} index={1} slotRef={ref1} pathname={location.pathname} onTap={handleNavTap} />

              <div style={{ width: 78, flexShrink: 0 }} />

              <NavSlot item={NAV[2]} index={2} slotRef={ref2} pathname={location.pathname} onTap={handleNavTap} />
              <NavSlot item={NAV[3]} index={3} slotRef={ref3} pathname={location.pathname} onTap={handleNavTap} />
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
