import React, { useEffect, useState } from 'react';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

// Placeholder do card de gato da Home: mesmo tamanho do card real (112×140,
// faixa de 7px embaixo), silhueta de gato e um brilho que atravessa o card.
// Cada card começa um pouco depois do anterior, pra não piscar tudo junto.
export default function CatCardSkeleton({ index = 0 }) {
  const reduced = usePrefersReducedMotion();
  const id = `cat-sk-${index}`;
  const delay = `${index * 0.18}s`;

  return (
    <div
      className="flex-shrink-0 w-28 rounded-[22px] overflow-hidden relative"
      style={{ height: 140, borderBottom: '7px solid #E4DCFF', background: '#F6F3FF', boxShadow: '0 2px 8px rgba(139,74,255,0.08)' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 112 133" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            {!reduced && (
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="-1 0"
                to="1.5 0"
                dur="1.6s"
                begin={delay}
                repeatCount="indefinite"
              />
            )}
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <rect width="112" height="133" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${id}-clip)`}>
          {/* Silhueta: orelhas, cabeça e ombros */}
          <g fill="#E4DCFF">
            <path d="M34 46 L38 22 L52 38 Z" />
            <path d="M78 46 L74 22 L60 38 Z" />
            <ellipse cx="56" cy="52" rx="24" ry="21" />
            <path d="M26 104 C26 84 39 72 56 72 C73 72 86 84 86 104 Z" />
          </g>
          {/* Olhos que piscam */}
          <g fill="#CBBDFF">
            <ellipse cx="47" cy="52" rx="3" ry="3.4">
              {!reduced && <animate attributeName="ry" values="3.4;3.4;0.4;3.4;3.4" keyTimes="0;0.86;0.9;0.94;1" dur="3.2s" begin={delay} repeatCount="indefinite" />}
            </ellipse>
            <ellipse cx="65" cy="52" rx="3" ry="3.4">
              {!reduced && <animate attributeName="ry" values="3.4;3.4;0.4;3.4;3.4" keyTimes="0;0.86;0.9;0.94;1" dur="3.2s" begin={delay} repeatCount="indefinite" />}
            </ellipse>
          </g>

          {/* Linhas do nome e da idade */}
          <rect x="10" y="112" width="58" height="8" rx="4" fill="#DDD3FF" />
          <rect x="10" y="124" width="36" height="5" rx="2.5" fill="#E8E1FF" />

          {/* Brilho atravessando */}
          <rect width="112" height="133" fill={`url(#${id}-shine)`} />
        </g>
      </svg>
    </div>
  );
}
