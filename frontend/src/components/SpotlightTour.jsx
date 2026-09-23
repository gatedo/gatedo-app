import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSensory from '../hooks/useSensory';

const C = { purple: '#8B4AFF', yellow: '#ebfc66' };
const PAD = 8; // respiro entre o elemento real e o anel de destaque
const GAP = 400; // ms de espera após onEnter, pra dar tempo de animações (ex.: leque do FAB) abrirem antes de medir a posição

// Tour "spotlight": escurece/borra a tela inteira, recorta um respiro em
// volta do elemento real e liga o texto solto (sem caixa) até ele com uma
// seta curva animada em SVG — nunca cobre o elemento destacado, porque o
// texto sempre fica no lado oposto da tela.
export default function SpotlightTour({ steps, onFinish }) {
  const touch = useSensory();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [textRect, setTextRect] = useState(null);
  const textRef = useRef(null);

  const step = steps[index];

  const measureTarget = useCallback(() => {
    if (!step?.selector) return;
    const el = document.querySelector(step.selector);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
  }, [step]);

  const measureText = useCallback(() => {
    if (!textRef.current) return;
    const r = textRef.current.getBoundingClientRect();
    setTextRect({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    setRect(null);
    setTextRect(null);
    step?.onEnter?.();

    let cancelled = false;
    let attempts = 0;
    let timeoutId;

    // Algumas seções são condicionais (ex.: "O que precisa de você hoje" só
    // existe se houver pendência) — tenta algumas vezes e, se o elemento
    // realmente não existir agora pra esse usuário, pula o passo sozinho em
    // vez de mostrar um texto solto sem seta e sem alvo.
    const attempt = () => {
      if (cancelled) return;
      const el = step?.selector ? document.querySelector(step.selector) : null;
      if (el) {
        measureTarget();
        return;
      }
      attempts += 1;
      if (attempts >= 4) {
        if (index >= steps.length - 1) onFinish?.();
        else setIndex((i) => i + 1);
        return;
      }
      timeoutId = setTimeout(attempt, 200);
    };

    timeoutId = setTimeout(attempt, step?.onEnter ? GAP : 30);

    window.addEventListener('resize', measureTarget, { passive: true });
    window.addEventListener('scroll', measureTarget, { passive: true });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget);
      step?.onExit?.();
    };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(measureText);
    window.addEventListener('resize', measureText, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measureText); };
  }, [index, rect, measureText]);

  const next = () => {
    touch();
    if (index >= steps.length - 1) {
      onFinish?.();
      return;
    }
    setIndex((i) => i + 1);
  };

  const skip = () => {
    touch();
    onFinish?.();
  };

  if (!step) return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

  const top = rect ? Math.max(0, rect.top - PAD) : 0;
  const left = rect ? Math.max(0, rect.left - PAD) : 0;
  const right = rect ? rect.right + PAD : 0;
  const bottom = rect ? rect.bottom + PAD : 0;

  // Texto sempre no lado oposto da tela em relação ao alvo, pra nunca cobrir
  // o elemento destacado.
  const targetBelowMid = rect ? (rect.top + rect.height / 2) > vh / 2 : true;
  const textZoneTop = targetBelowMid ? Math.max(88, vh * 0.13) : Math.min(vh - 200, vh * 0.46);

  let arrowPath = null;
  let arrowAngle = 0;
  let arrowEnd = null;

  if (rect && textRect) {
    const start = {
      x: textRect.left + textRect.width / 2,
      y: targetBelowMid ? textRect.bottom + 6 : textRect.top - 6,
    };
    const end = {
      x: Math.min(Math.max(rect.left + rect.width / 2, 28), vw - 28),
      y: targetBelowMid ? top - 2 : bottom + 2,
    };
    const dx = end.x - start.x;
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const bend = Math.max(-70, Math.min(70, dx * 0.4)) || (targetBelowMid ? 40 : -40);
    const controlX = midX + bend;
    const controlY = midY;

    arrowPath = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
    arrowAngle = (Math.atan2(end.y - controlY, end.x - controlX) * 180) / Math.PI;
    arrowEnd = end;
  }

  return (
    <div className="fixed inset-0 z-[400]" style={{ pointerEvents: 'auto' }}>
      <AnimatePresence mode="wait">
        {rect ? (
          <React.Fragment key={`panels-${index}`}>
            {/* 4 painéis borrados/escurecidos em volta do recorte */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed left-0 right-0" style={{ top: 0, height: top, background: 'rgba(10,5,30,0.62)', backdropFilter: 'blur(3px)' }} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed left-0 right-0" style={{ top: bottom, bottom: 0, background: 'rgba(10,5,30,0.62)', backdropFilter: 'blur(3px)' }} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed" style={{ top, height: bottom - top, left: 0, width: left, background: 'rgba(10,5,30,0.62)', backdropFilter: 'blur(3px)' }} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed" style={{ top, height: bottom - top, left: right, right: 0, background: 'rgba(10,5,30,0.62)', backdropFilter: 'blur(3px)' }} />

            {/* Anel de destaque, pulsando, em volta do elemento real */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="fixed rounded-2xl pointer-events-none"
              style={{ top, left, width: right - left, height: bottom - top, border: `2px solid ${C.purple}` }}
            >
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{ boxShadow: ['0 0 0 4px rgba(139,74,255,0.22)', '0 0 0 9px rgba(139,74,255,0.05)', '0 0 0 4px rgba(139,74,255,0.22)'] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </React.Fragment>
        ) : (
          <motion.div key="blank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0" style={{ background: 'rgba(10,5,30,0.62)', backdropFilter: 'blur(3px)' }} />
        )}
      </AnimatePresence>

      {/* Seta curva animada ligando o texto ao elemento */}
      {arrowPath && (
        <svg className="fixed inset-0 pointer-events-none" width={vw} height={vh} style={{ zIndex: 401 }}>
          <motion.path
            key={`arrow-${index}`}
            d={arrowPath}
            fill="none"
            stroke={C.yellow}
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
          />
          <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: [1, 1.25, 1] }}
            transition={{ opacity: { delay: 0.5, duration: 0.2 }, scale: { delay: 0.5, duration: 1.1, repeat: Infinity } }}
            style={{ transformOrigin: `${arrowEnd.x}px ${arrowEnd.y}px` }}
            transform={`translate(${arrowEnd.x}, ${arrowEnd.y}) rotate(${arrowAngle + 90})`}
          >
            <polygon points="-6,-2 6,-2 0,9" fill={C.yellow} />
          </motion.g>
        </svg>
      )}

      {/* Texto solto — nunca em cima do elemento destacado */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${index}`}
          ref={textRef}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          className="fixed left-0 right-0 px-8 text-center"
          style={{ top: textZoneTop, zIndex: 402 }}
        >
          <p className="text-[10px] font-black uppercase tracking-[3px] mb-1.5 drop-shadow-md" style={{ color: C.yellow }}>
            {index + 1} / {steps.length} · {step.title}
          </p>
          <p className="text-white text-[15px] font-bold leading-snug drop-shadow-md max-w-xs mx-auto">
            {step.text}
          </p>
          <div className="flex items-center justify-center gap-4 mt-5">
            <button onClick={skip} className="text-white/60 text-[12px] font-black">Pular</button>
            <button
              onClick={next}
              className="px-5 py-2.5 rounded-full font-black text-[12px]"
              style={{ background: C.yellow, color: '#3a2a70' }}
            >
              {index >= steps.length - 1 ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
