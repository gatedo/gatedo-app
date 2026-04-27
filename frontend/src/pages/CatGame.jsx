import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Settings2, RotateCcw, Volume2 } from 'lucide-react';
import { useAppSettings } from '../context/AppSettingsContext';

const C = {
  purple: '#8B4AFF',
  accent: '#edff50',
  accentDim: '#e7ff60',
  bg: '#f4f3ff',
};

const CAT_GAME_NAV_EVENT = 'gatedo-bottom-nav-visibility';
const CAT_GAME_SETTINGS_KEY = 'gatedo_cat_game_settings';

const THEMES = {
  bugs: {
    bg: '#1a2e0f',
    label: 'Bichinhos',
    cardImg: '/assets/catgames/insetos.webp',
    items: [
      { e: '🐞', t: 'pop' },
      { e: '🪲', t: 'pop' },
      { e: '🦋', t: 'buzz' },
      { e: '🐛', t: 'buzz' },
      { e: '🐝', t: 'buzz' },
      { e: '🪶', t: 'whoosh' },
    ],
  },
  ocean: {
    bg: '#051e38',
    label: 'Fundo do Mar',
    cardImg: '/assets/catgames/fundo-mar.webp',
    items: [
      { e: '🐠', t: 'ting' },
      { e: '🦐', t: 'pop' },
      { e: '🦑', t: 'buzz' },
      { e: '🐡', t: 'pop' },
      { e: '🐙', t: 'buzz' },
      { e: '🦀', t: 'pop' },
    ],
  },
  garden: {
    bg: '#261a0a',
    label: 'Jardim',
    cardImg: '/assets/catgames/jardim.webp',
    items: [
      { e: '🌼', t: 'ting' },
      { e: '🍂', t: 'whoosh' },
      { e: '🍃', t: 'whoosh' },
      { e: '🌿', t: 'whoosh' },
      { e: '🦎', t: 'pop' },
      { e: '🐜', t: 'pop' },
    ],
  },
  space: {
    bg: '#05050f',
    label: 'Espaco',
    cardImg: '/assets/catgames/gato-espaco.webp',
    items: [
      { e: '⭐', t: 'ting' },
      { e: '🌙', t: 'ting' },
      { e: '☄️', t: 'buzz' },
      { e: '✨', t: 'ting' },
      { e: '🛸', t: 'buzz' },
      { e: '🌠', t: 'ting' },
    ],
  },
};

const PALETTE = {
  pop: ['#e74c3c', '#c0392b', '#fff', '#ffd6d6'],
  buzz: ['#f1c40f', '#f39c12', '#fff'],
  whoosh: ['#ecf0f1', '#bdc3c7', '#a0c4ff'],
  ting: ['#fff', '#fffde7', '#a5d6a7', C.accent],
};

const SLIDER_CSS = `
  .cat-game-range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 14px;
    border-radius: 999px;
    border: 1px solid rgba(139, 74, 255, 0.22);
    cursor: pointer;
    outline: none;
    box-shadow: inset 0 2px 8px rgba(35, 12, 92, 0.18);
  }

  .cat-game-range:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .cat-game-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: #ffffff;
    border: 3px solid #edff50;
    box-shadow: 0 6px 16px rgba(16, 8, 58, 0.24);
  }

  .cat-game-range::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: #ffffff;
    border: 3px solid #edff50;
    box-shadow: 0 6px 16px rgba(16, 8, 58, 0.24);
  }
`;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeStoredConfig(initialTheme) {
  const safeTheme = Object.prototype.hasOwnProperty.call(THEMES, initialTheme) ? initialTheme : 'bugs';

  return {
    themeKey: safeTheme,
    objCount: 3,
    speed: 2,
    duration: 60,
    soundVolume: 70,
  };
}

function readStoredGameConfig(initialTheme) {
  const fallback = normalizeStoredConfig(initialTheme);

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(CAT_GAME_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const themeKey = Object.prototype.hasOwnProperty.call(THEMES, parsed?.themeKey) ? parsed.themeKey : fallback.themeKey;

    return {
      themeKey,
      objCount: clamp(Number(parsed?.objCount || fallback.objCount), 1, 6),
      speed: clamp(Number(parsed?.speed || fallback.speed), 1, 5),
      duration: clamp(Number(parsed?.duration || fallback.duration), 10, 120),
      soundVolume: clamp(Number(parsed?.soundVolume ?? fallback.soundVolume), 0, 100),
    };
  } catch {
    return fallback;
  }
}

function storeGameConfig(config) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CAT_GAME_SETTINGS_KEY, JSON.stringify(config));
  } catch {
    // local persistence only
  }
}

let audioCtx = null;

function getAudio() {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioCtx;
}

function playSound(type, volume = 0.7) {
  if (volume <= 0) return;

  try {
    const ac = getAudio();
    if (!ac) return;

    if (ac.state === 'suspended') {
      ac.resume().catch(() => {});
    }

    if (type === 'pop') {
      const oscillator = ac.createOscillator();
      const gain = ac.createGain();
      oscillator.connect(gain);
      gain.connect(ac.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ac.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, ac.currentTime + 0.3);
      gain.gain.setValueAtTime(0.42 * volume, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(ac.currentTime + 0.3);
      return;
    }

    if (type === 'whoosh') {
      const buffer = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < channel.length; index += 1) {
        channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
      }

      const source = ac.createBufferSource();
      const filter = ac.createBiquadFilter();
      const gain = ac.createGain();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      gain.gain.value = 0.3 * volume;
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      source.start();
      return;
    }

    if (type === 'buzz') {
      const oscillator = ac.createOscillator();
      const gain = ac.createGain();
      oscillator.connect(gain);
      gain.connect(ac.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(180, ac.currentTime);
      oscillator.frequency.setValueAtTime(260, ac.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(180, ac.currentTime + 0.2);
      gain.gain.setValueAtTime(0.24 * volume, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
      oscillator.start();
      oscillator.stop(ac.currentTime + 0.4);
      return;
    }

    if (type === 'ting') {
      [523, 659, 784, 1047].forEach((freq, index) => {
        const oscillator = ac.createOscillator();
        const gain = ac.createGain();
        oscillator.connect(gain);
        gain.connect(ac.destination);
        oscillator.type = 'triangle';
        oscillator.frequency.value = freq;
        gain.gain.setValueAtTime(0, ac.currentTime + index * 0.06);
        gain.gain.linearRampToValueAtTime(0.22 * volume, ac.currentTime + index * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + index * 0.06 + 0.3);
        oscillator.start(ac.currentTime + index * 0.06);
        oscillator.stop(ac.currentTime + index * 0.06 + 0.3);
      });
    }
  } catch {
    // audio is optional
  }
}

function spawnParticles(x, y, soundType, particles) {
  const colors = PALETTE[soundType] || PALETTE.pop;

  for (let index = 0; index < 22; index += 1) {
    const angle = (Math.PI * 2 / 22) * index + Math.random() * 0.4;
    const speed = 2.5 + Math.random() * 6;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 5 + Math.random() * 9,
      life: 1,
      decay: 0.016 + Math.random() * 0.02,
      kind: 'circle',
    });
  }

  ['💥', '✨', '⭐'].forEach((emoji) => {
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 5,
      vy: -3 - Math.random() * 4,
      emoji,
      size: 20 + Math.random() * 12,
      life: 1,
      decay: 0.022,
      kind: 'emoji',
    });
  });

  particles.push({
    x,
    y,
    radius: 8,
    color: colors[0],
    life: 1,
    decay: 0.025,
    kind: 'ring',
  });
}

function Slider({ label, min, max, step = 1, value, onChange, format, disabled = false, icon = null }) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div
      className="mb-4 rounded-[18px] px-3 py-3"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <div className="flex justify-between items-center gap-3 mb-2">
        <span className="text-[11px] font-black uppercase tracking-[2px] text-white/70 flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="text-[13px] font-black text-[#edff50]">
          {format ? format(value) : value}
        </span>
      </div>

      <input
        className="cat-game-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          background: `linear-gradient(90deg, ${C.accent} 0%, ${C.accent} ${progress}%, rgba(107, 61, 230, 0.94) ${progress}%, rgba(107, 61, 230, 0.94) 100%)`,
        }}
      />
    </div>
  );
}

function ThemeCard({ id, theme, selected, onClick }) {
  const gradients = {
    bugs: 'linear-gradient(160deg, rgba(20,83,45,0.85), rgba(22,163,74,0.7))',
    ocean: 'linear-gradient(160deg, rgba(12,61,107,0.85), rgba(2,132,199,0.7))',
    garden: 'linear-gradient(160deg, rgba(74,55,40,0.85), rgba(217,119,6,0.7))',
    space: 'linear-gradient(160deg, rgba(10,10,26,0.9), rgba(124,58,237,0.7))',
  };

  const emojis = theme.items.slice(0, 4).map((item) => item.e).join('  ');

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        height: 100,
        cursor: 'pointer',
        boxShadow: selected
          ? `0 0 0 3px ${C.purple}, 0 6px 20px rgba(139,74,255,0.35)`
          : '0 4px 14px rgba(0,0,0,0.2)',
        transform: selected ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.15s',
        border: 'none',
      }}
    >
      <img
        src={theme.cardImg}
        alt={theme.label}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: gradients[id] }} />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '10px 12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 18 }}>{emojis}</div>
        <p
          style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: 13,
            fontWeight: 900,
            color: '#fff',
            textShadow: '0 1px 6px rgba(0,0,0,0.5)',
          }}
        >
          {theme.label}
        </p>
      </div>

      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: C.purple,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}
        >
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>
        </div>
      )}
    </button>
  );
}

function MenuScreen({ config, globalSoundEnabled, onConfigChange, onStart, onBack }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, fontFamily: 'Nunito, sans-serif' }}>
      <style>{SLIDER_CSS}</style>

      <div
        className="flex items-center gap-3 px-4 pb-1"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(139,74,255,0.1)' }}
        >
          <ArrowLeft size={18} style={{ color: C.purple }} />
        </button>

        <div className="flex-1">
          <p className="text-[9px] font-black uppercase tracking-[3px] text-gray-400">Gatedo</p>
          <h1 className="text-lg font-black text-gray-800 tracking-tight leading-none">Joguinhos para Gatos</h1>
        </div>

        <img src="/assets/App_gatedo_logo.svg" alt="Gatedo" style={{ height: 56, opacity: 0.85 }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[148px] pt-1">
        <p className="text-[11px] font-bold text-gray-400 mb-4 leading-relaxed">
          Escolha o tema e configure o jogo antes de colocar na frente do seu gatinho.
        </p>

        <h2 className="text-[9px] font-black uppercase tracking-[3px] text-gray-400 mb-3 flex items-center gap-2">
          <span style={{ color: C.purple }}>●</span> Escolha o tema
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {Object.entries(THEMES).map(([id, theme]) => (
            <ThemeCard
              key={id}
              id={id}
              theme={theme}
              selected={config.themeKey === id}
              onClick={() => onConfigChange('themeKey', id)}
            />
          ))}
        </div>

        <div
          className="rounded-[26px] p-5 mb-6"
          style={{
            background: 'linear-gradient(180deg, rgba(139,74,255,0.96) 0%, rgba(104,60,228,0.95) 100%)',
            boxShadow: '0 14px 34px rgba(94,52,199,0.22)',
            border: '1px solid rgba(139,74,255,0.2)',
          }}
        >
          <h2 className="text-[10px] font-black uppercase tracking-[3px] mb-4 flex items-center gap-2 text-white">
            <Settings2 size={12} /> Configurar jogo
          </h2>

          <Slider
            label="Objetos na tela"
            min={1}
            max={6}
            value={config.objCount}
            onChange={(value) => onConfigChange('objCount', value)}
          />
          <Slider
            label="Velocidade"
            min={1}
            max={5}
            value={config.speed}
            onChange={(value) => onConfigChange('speed', value)}
          />
          <Slider
            label="Duracao"
            min={10}
            max={120}
            step={10}
            value={config.duration}
            onChange={(value) => onConfigChange('duration', value)}
            format={(value) => `${value}s`}
          />
          <Slider
            label="Volume dos sons"
            min={0}
            max={100}
            step={5}
            value={config.soundVolume}
            onChange={(value) => onConfigChange('soundVolume', value)}
            format={(value) => `${value}%`}
            disabled={!globalSoundEnabled}
            icon={<Volume2 size={11} />}
          />

          {!globalSoundEnabled && (
            <p className="text-[10px] font-bold text-white/72 leading-relaxed mt-1">
              Os sons do app estao desativados nas configuracoes gerais. Reative em Configuracoes para ouvir o jogo.
            </p>
          )}
        </div>

        <div
          className="rounded-[18px] px-4 py-3 mb-6 flex items-start gap-3"
          style={{ background: `${C.purple}0d`, border: `1px solid ${C.purple}20` }}
        >
          <span className="text-xl shrink-0">💡</span>
          <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
            Coloque o celular no chao ou em uma mesa baixa e deixe seu gato interagir livremente com a tela.
          </p>
        </div>

        <div className="sticky bottom-[108px] md:bottom-6 pt-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart(config)}
            className="w-full py-4 rounded-[20px] flex items-center justify-center gap-3 font-black text-base uppercase tracking-wider"
            style={{
              background: `linear-gradient(135deg, ${C.purple} 0%, #4B40C6 100%)`,
              color: '#fff',
              boxShadow: `0 8px 24px ${C.purple}50`,
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <Play size={18} fill="white" />
            Iniciar para o Gato
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function GameScreen({ config, soundEnabled, onEnd }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    objects: [],
    particles: [],
    trail: [],
    pointerX: -999,
    pointerY: -999,
    score: 0,
    running: true,
  });
  const scoreRef = useRef(null);
  const timerRefLabel = useRef(null);
  const animRef = useRef(null);
  const timerRef = useRef(null);
  const timeLeftRef = useRef(config.duration);
  const theme = THEMES[config.themeKey];
  const speedPx = config.speed * 1.5;
  const effectiveVolume = soundEnabled ? config.soundVolume / 100 : 0;

  function makeObj(width, height) {
    const item = theme.items[Math.floor(Math.random() * theme.items.length)];
    const angle = Math.random() * Math.PI * 2;
    const speed = speedPx * (1 + Math.random() * 0.6);

    return {
      x: 60 + Math.random() * (width - 120),
      y: 60 + Math.random() * (height - 120),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      emoji: item.e,
      sound: item.t,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.04,
      alive: true,
    };
  }

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const state = stateRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    state.trail = state.trail.filter((dot) => dot.life > 0);
    state.trail.forEach((dot) => {
      const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 20 * dot.life);
      gradient.addColorStop(0, `rgba(139,74,255,${dot.life * 0.28})`);
      gradient.addColorStop(1, 'rgba(139,74,255,0)');
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 20 * dot.life, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      dot.life -= 0.07;
    });

    state.objects.forEach((obj) => {
      if (!obj.alive) return;

      obj.wobble += obj.wobbleSpeed;
      obj.x += obj.vx;
      obj.y += obj.vy;

      if (obj.x < 30 || obj.x > width - 30) obj.vx *= -1;
      if (obj.y < 30 || obj.y > height - 30) obj.vy *= -1;

      obj.x = Math.max(30, Math.min(width - 30, obj.x));
      obj.y = Math.max(30, Math.min(height - 30, obj.y));

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.font = '46px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const wobbleX = Math.cos(obj.wobble) * 4;
      const wobbleY = Math.sin(obj.wobble * 1.3) * 3;
      const scale = 1 + Math.sin(obj.wobble * 0.7) * 0.06;

      ctx.translate(obj.x + wobbleX, obj.y + wobbleY);
      ctx.scale(scale, scale);
      ctx.fillText(obj.emoji, 0, 0);
      ctx.restore();

      const dx = obj.x - state.pointerX;
      const dy = obj.y - state.pointerY;

      if (Math.sqrt(dx * dx + dy * dy) < 54) {
        obj.alive = false;
        playSound(obj.sound, effectiveVolume);
        spawnParticles(obj.x, obj.y, obj.sound, state.particles);
        state.score += 1;

        if (scoreRef.current) {
          scoreRef.current.textContent = state.score;
        }

        window.setTimeout(() => {
          if (state.running) {
            state.objects.push(makeObj(width, height));
          }
        }, 700);
      }
    });

    state.particles = state.particles.filter((particle) => particle.life > 0);
    state.particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = particle.life;

      if (particle.kind === 'ring') {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 3 * particle.life;
        ctx.stroke();
        particle.radius += 5;
        particle.life -= particle.decay;
      } else if (particle.kind === 'emoji') {
        ctx.font = `${particle.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(particle.x, particle.y);
        ctx.fillText(particle.emoji, 0, 0);
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.18;
        particle.life -= particle.decay;
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.95;
        particle.vy = particle.vy * 0.95 + 0.1;
        particle.life -= particle.decay;
      }

      ctx.restore();
    });

    animRef.current = requestAnimationFrame(loop);
  }, [effectiveVolume, theme, speedPx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const state = stateRef.current;
    state.objects = [];
    state.particles = [];
    state.trail = [];
    state.score = 0;
    state.running = true;

    for (let index = 0; index < config.objCount; index += 1) {
      state.objects.push(makeObj(canvas.width, canvas.height));
    }

    if (scoreRef.current) scoreRef.current.textContent = '0';
    if (timerRefLabel.current) timerRefLabel.current.textContent = String(config.duration);
    timeLeftRef.current = config.duration;

    animRef.current = requestAnimationFrame(loop);

    timerRef.current = window.setInterval(() => {
      timeLeftRef.current -= 1;

      if (timerRefLabel.current) {
        timerRefLabel.current.textContent = String(timeLeftRef.current);
      }

      if (timeLeftRef.current <= 0) {
        state.running = false;
        window.clearInterval(timerRef.current);
        cancelAnimationFrame(animRef.current);
        onEnd(state.score);
      }
    }, 1000);

    const handleMove = (x, y) => {
      state.pointerX = x;
      state.pointerY = y;
      state.trail.push({ x, y, life: 1 });
    };

    const handleMouse = (event) => handleMove(event.clientX, event.clientY);
    const handleTouch = (event) => {
      event.preventDefault();
      const ac = getAudio();
      ac?.resume?.().catch(() => {});
      const touch = event.touches[0];
      if (!touch) return;
      handleMove(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('touchmove', handleTouch, { passive: false });
    window.addEventListener('touchstart', handleTouch, { passive: false });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.clearInterval(timerRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [config.duration, config.objCount, loop, onEnd]);

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh' }} />

      <div
        style={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 10,
          zIndex: 50,
        }}
      >
        {[
          { icon: '🐾', ref: scoreRef, initial: '0', suffix: '' },
          { icon: '⏱', ref: timerRefLabel, initial: config.duration, suffix: 's' },
        ].map((item, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(12px)',
              borderRadius: 20,
              padding: '7px 16px',
              color: '#fff',
              fontSize: 14,
              fontWeight: 900,
              fontFamily: 'Nunito, sans-serif',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {item.icon} <span ref={item.ref}>{item.initial}</span>
            {item.suffix}
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          stateRef.current.running = false;
          window.clearInterval(timerRef.current);
          cancelAnimationFrame(animRef.current);
          onEnd(stateRef.current.score);
        }}
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 50,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%',
          width: 42,
          height: 42,
          fontSize: 16,
          cursor: 'pointer',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </button>
    </div>
  );
}

function EndScreen({ score, themeKey, onReplay, onMenu }) {
  const theme = THEMES[themeKey];
  const message =
    score === 0
      ? 'Quase la!'
      : score < 5
        ? 'Bom começo!'
        : score < 15
          ? 'Que caçador!'
          : 'Campeão Felino!';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: `linear-gradient(160deg, ${C.purple} 0%, #1e1b4b 100%)`, fontFamily: 'Nunito, sans-serif' }}
    >
      <img src="/assets/App_gatedo_logo.svg" alt="Gatedo" style={{ height: 100, marginBottom: 28, opacity: 0.9 }} />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      >
        <div style={{ fontSize: 72, textAlign: 'center', marginBottom: 8 }}>😸</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 4 }}>
          {message}
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 8 }}>
          Tema: {theme.label}
        </p>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: C.accent }}>{score}</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 8, fontWeight: 700 }}>
            capturas
          </span>
        </div>
      </motion.div>

      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onReplay}
          style={{
            flex: 1,
            padding: '14px 0',
            border: 'none',
            borderRadius: 18,
            fontSize: 15,
            fontWeight: 900,
            background: C.accent,
            color: C.purple,
            cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <RotateCcw size={15} /> De novo
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onMenu}
          style={{
            flex: 1,
            padding: '14px 0',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 18,
            fontSize: 15,
            fontWeight: 900,
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          ← Menu
        </motion.button>
      </div>
    </div>
  );
}

export default function CatGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useAppSettings();
  const initialTheme = location.state?.theme || 'bugs';

  const [screen, setScreen] = useState('menu');
  const [menuConfig, setMenuConfig] = useState(() => readStoredGameConfig(initialTheme));
  const [gameConfig, setGameConfig] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [themeKey, setThemeKey] = useState(initialTheme);

  useEffect(() => {
    storeGameConfig(menuConfig);
  }, [menuConfig]);

  useEffect(() => {
    const hidden = screen === 'game';

    window.dispatchEvent(
      new CustomEvent(CAT_GAME_NAV_EVENT, {
        detail: { hidden },
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent(CAT_GAME_NAV_EVENT, {
          detail: { hidden: false },
        }),
      );
    };
  }, [screen]);

  const handleConfigChange = (key, value) => {
    setMenuConfig((current) => ({
      ...current,
      [key]: value,
    }));
  };

  if (screen === 'menu') {
    return (
      <MenuScreen
        config={menuConfig}
        globalSoundEnabled={settings.soundEnabled}
        onConfigChange={handleConfigChange}
        onBack={() => navigate(-1)}
        onStart={(nextConfig) => {
          setThemeKey(nextConfig.themeKey);
          setGameConfig(nextConfig);
          setScreen('game');
        }}
      />
    );
  }

  if (screen === 'game') {
    return (
      <GameScreen
        config={gameConfig || menuConfig}
        soundEnabled={settings.soundEnabled}
        onEnd={(score) => {
          setFinalScore(score);
          setScreen('end');
        }}
      />
    );
  }

  return (
    <EndScreen
      score={finalScore}
      themeKey={themeKey}
      onReplay={() => setScreen('game')}
      onMenu={() => setScreen('menu')}
    />
  );
}
