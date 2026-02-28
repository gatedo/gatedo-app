import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSensory from '../hooks/useSensory';

// ─── ÍCONES SVG CUSTOMIZADOS ──────────────────────────────────────────────────
const HomeIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'}
    strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const IgentIcon = ({ active }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'}
    strokeWidth={active ? 2.3 : 1.7} strokeLinecap="round" strokeLinejoin="round">
    {/* Orelhas pontudas de gato */}
    <path d="M7 10 L6 5 L9.5 8.5"/>
    <path d="M17 10 L18 5 L14.5 8.5"/>
    {/* Cabeça redonda */}
    <circle cx="12" cy="13" r="5.5"/>
    {/* Olhos amendoados */}
    <path d="M9.5 12 C9.5 11.2 10 10.8 10.5 11 C11 11.2 11 12 10.5 12.4 C10 12.7 9.5 12.7 9.5 12z" fill={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'} stroke="none"/>
    <path d="M14.5 12 C14.5 11.2 14 10.8 13.5 11 C13 11.2 13 12 13.5 12.4 C14 12.7 14.5 12.7 14.5 12z" fill={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'} stroke="none"/>
    {/* Narizinho */}
    <path d="M11.2 14.2 L12 14.8 L12.8 14.2" strokeWidth="1.2"/>
    <circle cx="12" cy="14" r="0.5" fill={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'} stroke="none"/>
    {/* Bigodes */}
    <line x1="6.5" y1="14" x2="9.5" y2="14.2" strokeWidth="0.9" strokeOpacity="0.7"/>
    <line x1="6.5" y1="15.2" x2="9.5" y2="15" strokeWidth="0.9" strokeOpacity="0.7"/>
    <line x1="17.5" y1="14" x2="14.5" y2="14.2" strokeWidth="0.9" strokeOpacity="0.7"/>
    <line x1="17.5" y1="15.2" x2="14.5" y2="15" strokeWidth="0.9" strokeOpacity="0.7"/>
  </svg>
);

const ChatIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'}
    strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <circle cx="9" cy="10" r="0.6" fill={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'} stroke="none"/>
    <circle cx="12" cy="10" r="0.6" fill={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'} stroke="none"/>
    <circle cx="15" cy="10" r="0.6" fill={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'} stroke="none"/>
  </svg>
);

const StoreIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#DFFF40' : 'rgba(185,175,255,0.55)'}
    strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

// ─── LIQUID GLASS CSS ─────────────────────────────────────────────────────────
const glassCSS = `
  /* Pílula: roxo escuro fosco do logo */
  .bn-pill {
    background: linear-gradient(175deg,
      rgba(66, 77, 139, 0.59) 0%,
      rgba(44, 30, 107, 0.62) 50%,
      rgba(28, 23, 59, 0.77) 100%
    );
    backdrop-filter: blur(32px) saturate(180%) brightness(0.78);
    -webkit-backdrop-filter: blur(32px) saturate(180%) brightness(0.78);
    border: 1px solid rgba(255,255,255,0.10);
    border-top: 1.5px solid rgba(255,255,255,0.20);
    position: relative;
    overflow: visible;
    animation: glowBorder 3.2s ease-in-out infinite;
  }
  /* Reflexo especular no topo */
  .bn-pill::before {
    content: '';
    position: absolute;
    top: 0; left: 8%; right: 8%;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(99, 84, 153, 0.4) 28%,
      rgba(255,255,255,0.65) 50%,
      rgba(99, 64, 255, 0.05) 72%,
      transparent
    );
    border-radius: 50%;
    z-index: 5;
    pointer-events: none;
  }
  /* Véu interno */
  .bn-pill::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 45%;
    background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%);
    border-radius: 50px 50px 0 0;
    z-index: 4;
    pointer-events: none;
  }
  @keyframes glowBorder {
    0%,100% {
      box-shadow:
        0 0 0 1.5px rgba(223,255,64,0.22),
        0 -4px 30px rgba(223,255,64,0.06),
        0 12px 48px rgba(20,12,90,0.85),
        0 3px 10px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.14);
    }
    50% {
      box-shadow:
        0 0 0 2px rgba(99, 64, 255, 0.07),
        0 -4px 30px rgba(223,255,64,0.18),
        0 12px 48px rgba(20,12,90,0.85),
        0 3px 10px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.14);
    }
  }

  /* Botão central: esfera de vidro roxo */
  .bn-center {
    background: radial-gradient(circle at 38% 30%,
      rgba(175,165,255,0.55) 0%,
      rgba(95,82,210,0.82) 45%,
      rgba(48,34,165,0.97) 100%
    );
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 2px solid rgba(255,255,255,0.20);
    border-top: 2.5px solid rgba(255,255,255,0.42);
    animation: centerPulse 2.6s ease-in-out infinite;
    position: relative;
    overflow: hidden;
    /* Clip inferior para a pílula "morder" a bolinha */
    clip-path: none;
  }
  /* Brilho especular interno */
  .bn-center::before {
    content: '';
    position: absolute;
    top: 7px; left: 10px;
    width: 20px; height: 8px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.72), transparent 70%);
    border-radius: 50%;
    opacity: 0.5;
    pointer-events: none;
  }
  @keyframes centerPulse {
    0%,100% {
      box-shadow:
        0 0 0 3px rgba(223,255,64,0.32),
        0 0 20px rgba(223,255,64,0.38),
        0 14px 40px rgba(18,10,88,0.75),
        inset 0 2px 0 rgba(255,255,255,0.28);
    }
    50% {
      box-shadow:
        0 0 0 9px rgba(223,255,64,0.12),
        0 0 46px rgba(223,255,64,0.62),
        0 14px 40px rgba(18,10,88,0.75),
        inset 0 2px 0 rgba(255,255,255,0.28);
    }
  }

  @keyframes tapRipple {
    from { transform: scale(0.4); opacity: 0.75; }
    to   { transform: scale(3); opacity: 0; }
  }
  .tap-ripple {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(223,255,64,0.45);
    animation: tapRipple 0.8s ease-out forwards;
    pointer-events: none;
  }
`;

// ─── ROTAS ────────────────────────────────────────────────────────────────────
const NAV = [
  { to: '/home',        Icon: HomeIcon,  match: p => p === '/home' },
  { to: '/cats',        Icon: IgentIcon,   match: p => p.includes('cats') },
  { to: '/comunigato',  Icon: ChatIcon,  match: p => p.includes('comunigato') },
  { to: '/store',       Icon: StoreIcon, match: p => p.includes('store') },
];

export default function BottomNav() {
  const location = useLocation();
  const touch = useSensory();
  const [ripples, setRipples] = useState([]);

  const activeIdx = NAV.findIndex(n => n.match(location.pathname));
  const isIgent   = location.pathname.includes('igent');

  const fireRipple = () => {
    const id = Date.now();
    setRipples(r => [...r, id]);
    setTimeout(() => setRipples(r => r.filter(x => x !== id)), 900);
  };

  // Pill tem 4 slots iguais (2 left + 2 right). Gap central = 78px fixo.
  // Cada slot ocupa 50% de cada metade.
  // Calculamos a posição absoluta da barra como % da largura total da pill.
  // Pill total width ≈ 100%. Gap central ≈ 22% (78px de ~360px).
  // Left side: 0–39% → 2 slots: 9.75%, 29.25%
  // Right side: 61–100% → 2 slots: 70.75%, 90.25%
 const slotCenters = ['10%', '31%', '70%', '90%'];

  return (
    <>
      <style>{glassCSS}</style>
      <div className="h-28" />

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-50"
        style={{ maxWidth: '460px', padding: '0 12px 20px' }}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26, delay: 0.06 }}
          className="relative"
        >

          {/* ─── BOTÃO CENTRAL FLUTUANTE ─── */}
          {/* Desce para a borda superior da pill coincidir com o centro do botão */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
            style={{ top: '-34px' }} /* metade do botão (68/2 = 34) acima da pill */
          >
            <Link to="/igent-vet" onClick={() => { fireRipple(); touch('success'); }}>
              <motion.div
                whileTap={{ scale: 0.87 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="bn-center w-[68px] h-[68px] rounded-full flex items-center justify-center"
              >
                {ripples.map(id => <div key={id} className="tap-ripple" />)}
                <img
                  src="/logo-icon.png"
                  alt="G"
                  className="w-10 h-10 object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                />
              </motion.div>
            </Link>
            {/* Label colado à bolinha, antes da pill */}
            <span
              className="text-[9px] font-black tracking-wide select-none"
              style={{ marginTop: '10px', textShadow: '0 1px 8px rgba(41, 26, 80, 0.8)' }}>
              <span style={{ color: 'rgba(253, 253, 253, 0.75)' }}>i</span>
              <span style={{ color: isIgent ? '#DFFF40' : 'rgba(255, 255, 255, 0.92)' }}>Gent</span>
              <span style={{ color: '#DFFF40' }}>Vet</span>
            </span>
          </div>

          {/* ─── PÍLULA ─── */}
          <div
            className="bn-pill rounded-[50px]"
            style={{ height: '64px', overflow: 'hidden' }}
          >
            {/* Barra deslizante amarela — centralizada no ícone ativo */}
            {activeIdx >= 0 && (
              <motion.div
                animate={{ left: `calc(${slotCenters[activeIdx]} - 14px)` }}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                className="absolute bottom-0 rounded-t-full z-10"
                style={{
                  width: '28px',
                  height: '3px',
                  background: 'linear-gradient(90deg, rgba(223,255,64,0.6), #DFFF40, rgba(223,255,64,0.6))',
                  boxShadow: '0 0 16px rgba(223,255,64,1), 0 0 6px rgba(223,255,64,1)',
                }}
              />
            )}

            {/* ITENS: 2 left | gap | 2 right */}
            <div className="flex items-center h-full">

              {/* Esquerda */}
              {NAV.slice(0, 2).map((n) => (
                <Link key={n.to} to={n.to} onClick={() => touch()}
                  className="flex-1 flex items-center justify-center h-full relative z-10 select-none">
                  <motion.div
                    whileTap={{ scale: 0.72 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                  >
                    <n.Icon active={n.match(location.pathname)} />
                  </motion.div>
                </Link>
              ))}

              {/* Gap central */}
              <div style={{ width: '78px', flexShrink: 0 }} />

              {/* Direita */}
              {NAV.slice(2, 4).map((n) => (
                <Link key={n.to} to={n.to} onClick={() => touch()}
                  className="flex-1 flex items-center justify-center h-full relative z-10 select-none">
                  <motion.div
                    whileTap={{ scale: 0.72 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                  >
                    <n.Icon active={n.match(location.pathname)} />
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>



        </motion.div>
      </div>
    </>
  );
}