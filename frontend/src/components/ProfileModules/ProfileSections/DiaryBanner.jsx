import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Flame, Sparkles, Star, Zap, TrendingUp, ChevronRight } from 'lucide-react';

// Utility: darken a hex color by a percentage
function darkenHex(hex, amount = 30) {
  const safeHex = String(hex || '#6366f1');
  const normalized = safeHex.startsWith('#') ? safeHex : `#${safeHex}`;
  const num = parseInt(normalized.replace('#', ''), 16);

  if (Number.isNaN(num)) return '#4f46e5';

  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);

  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// XP needed per level (simple curve)
function xpForLevel(lvl) {
  return Math.max(120, Number(lvl || 1) * 120);
}

const STATS = [
  {
    key: 'entries',
    label: 'Entradas',
    icon: BookOpen,
    iconColor: '#3b82f6',
  },
  {
    key: 'streak',
    label: 'Streak',
    icon: Flame,
    iconColor: '#f97316',
  },
  {
    key: 'level',
    label: 'Level',
    icon: Star,
    iconColor: '#eab308',
  },
  {
    key: 'xpg',
    label: 'XPG',
    icon: Zap,
    iconColor: '#22c55e',
  },
];

export default function DiaryBanner({ cat, themeColor = '#6366f1', navigate }) {
  const streak = Number(cat?.diaryStats?.streak ?? cat?.streak ?? 0);
  const entries = Number(cat?.diaryStats?.entries ?? cat?.diaryCount ?? 0);
  const level = Number(cat?.petLevel ?? cat?.level ?? 1);
  const xpg = Number(cat?.xpg ?? cat?.petXp ?? cat?.xp ?? 0);

  const xpMax = xpForLevel(level);
  const xpProgress = Math.min(xpg / xpMax, 1);
  const statValues = { entries, streak, level, xpg };

  function handleOpenDiary() {
    if (!cat?.id || typeof navigate !== 'function') return;

    navigate(`/cat/${cat.id}/diary`, {
      state: {
        returnTo: `/cat/${cat.id}`,
        restoreTab: 'BIO',
        source: 'bio-diary-banner',
      },
    });
  }

  const darkTheme = darkenHex(themeColor, 60);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.985 }}
      onClick={handleOpenDiary}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
      className="w-full text-left rounded-[22px] overflow-hidden relative group transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]"
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${themeColor}10, transparent 80%)`,
        }}
      />

      <div className="relative z-10 flex items-center gap-3.5 px-5 pt-4 pb-3">
        <div className="relative flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="w-[52px] h-[52px] rounded-[15px] flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${themeColor}30 0%, ${themeColor}10 100%)`,
              border: `1.5px solid ${themeColor}45`,
              boxShadow: `0 0 20px ${themeColor}18`,
            }}
          >
            <BookOpen size={22} style={{ color: themeColor }} />
          </motion.div>

          {streak > 0 && (
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: '#fff',
                border: `1.5px solid ${themeColor}40`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
            >
              <Flame size={10} className="text-orange-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[9px] font-bold uppercase tracking-[0.18em] mb-0.5"
            style={{ color: themeColor }}
          >
            Mundo Interno
          </p>

          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-[15px] font-black text-gray-900 tracking-tight truncate">
              Diário do Gato
            </h3>
            <ChevronRight size={16} style={{ color: themeColor }} className="flex-shrink-0" />
          </div>

          <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug line-clamp-2">
            Registre humor, hábitos e pequenas pistas do dia a dia de {cat?.name || 'seu gato'}.
          </p>
        </div>
      </div>

      <div className="relative z-10 px-5 pb-4">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            const value = statValues[stat.key];

            return (
              <div
                key={stat.key}
                className="rounded-[16px] px-2.5 py-2 bg-gray-50/90 border border-gray-100 min-w-0"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={11} style={{ color: stat.iconColor }} />
                  <span className="text-[8px] font-bold uppercase tracking-wide text-gray-400 truncate">
                    {stat.label}
                  </span>
                </div>

                <p className="text-[14px] font-black text-gray-800 truncate">{value}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-[16px] px-3.5 py-3 border border-gray-100 bg-[#FAFBFF]">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} style={{ color: themeColor }} />
                <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">
                  Progresso de evolução
                </p>
              </div>

              <p className="text-[11px] font-bold text-gray-700 mt-1 truncate">
                Nível {level} · {xpg}/{xpMax} XPG
              </p>
            </div>

            <div
              className="px-2 py-1 rounded-full text-[9px] font-black flex items-center gap-1 flex-shrink-0"
              style={{
                background: `${themeColor}12`,
                color: darkTheme,
                border: `1px solid ${themeColor}25`,
              }}
            >
              <Sparkles size={10} />
              Diário ativo
            </div>
          </div>

          <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${themeColor} 0%, ${darkTheme} 100%)`,
                boxShadow: `0 0 10px ${themeColor}40`,
              }}
            />
          </div>
        </div>
      </div>
    </motion.button>
  );
}