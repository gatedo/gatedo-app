import ReactDOM from 'react-dom';
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Lock, ChevronDown, Palette, X,
  FileText, Phone, MapPin, User, Heart, Send,
  Shield, Syringe, Weight, Calendar, Trophy, Sparkles
} from 'lucide-react';

import { CAT_THEMES, resolveCatTheme, resolveCatThemeHex } from '../../config/catThemes';
import { formatCatAge, formatDateOnlyBR, getCatLifeStage, LIFE_STAGE_META } from '../../utils/catAge';

// Compatibilidade temporária com módulos legados
export const CARD_GRADIENTS = CAT_THEMES.map((t) => ({
  ...t,
  front: '',
}));

export function resolveThemeHex(themeColor) {
  return resolveCatThemeHex(themeColor);
}

export function resolveThemeGradient(themeColor) {
  return resolveCatTheme(themeColor);
}

// ─── OVERLAYS ─────────────────────────────────────────────────────────────────
export const CARD_OVERLAYS = [
  { id: 'none',   label: 'Nenhum',   style: '' },
  { id: 'paws',   label: 'Patinhas', style: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='3' fill='white' fill-opacity='0.07'/%3E%3Ccircle cx='20' cy='6' r='2' fill='white' fill-opacity='0.07'/%3E%3Ccircle cx='30' cy='10' r='3' fill='white' fill-opacity='0.07'/%3E%3Cellipse cx='20' cy='20' rx='7' ry='9' fill='white' fill-opacity='0.05'/%3E%3C/svg%3E\")" },
  { id: 'dots',   label: 'Pontos',   style: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)" },
  { id: 'lines',  label: 'Linhas',   style: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 12px)" },
  { id: 'stars',  label: 'Estrelas', style: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='white' fill-opacity='0.08' font-size='14'%3E✦%3C/text%3E%3C/svg%3E\")" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const shortId = (id) => (id ? id.split('-').pop().toUpperCase() : '—');

function calcXPProgress(xp = 0, level = 1) {
  const xpPerLevel = 200;
  const xpIntoLevel = xp - (level - 1) * xpPerLevel;
  return Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpPerLevel) * 100)));
}

const formatAge = (birthDate, ageYears, ageMonths, isDateEstimated) => {
  if (isDateEstimated) {
    if (ageYears && ageMonths) return `${ageYears}a ${ageMonths}m`;
    if (ageYears) return ageYears === 1 ? '1 ano' : `${ageYears} anos`;
    if (ageMonths) return ageMonths === 1 ? '1 mês' : `${ageMonths} meses`;
    return '—';
  }

  if (!birthDate) return '—';

  try {
    const d = new Date(birthDate);
    if (isNaN(d.getTime())) return birthDate;

    const now = new Date();
    const years = now.getFullYear() - d.getFullYear() -
      (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();

    return `${dd}.${mm}.${yyyy} · ${years}a`;
  } catch {
    return birthDate;
  }
};

const formatCatAgeWithDate = (cat) => {
  const age = formatCatAge(cat, {
    fallback: formatAge(cat?.birthDate, cat?.ageYears, cat?.ageMonths, cat?.isDateEstimated),
  });
  const birthDate = cat?.birthDate ? formatDateOnlyBR(cat.birthDate, { fallback: '' }) : '';
  return birthDate ? `${birthDate} · ${age}` : age;
};

function getPetPublicUrl(cat) {
  if (!cat?.id) return '#';
  return `${window.location.origin}/gato/${cat.id}`;
}

function getWhatsappShareUrl(cat) {
  const publicUrl = getPetPublicUrl(cat);
  const text = encodeURIComponent(`Conheça o perfil do(a) ${cat?.name || 'meu gato'} no GATEDO 🐾 ${publicUrl}`);
  return `https://wa.me/?text=${text}`;
}

function normalizeAchievements(cat) {
  const explicit = Array.isArray(cat?.achievements) ? cat.achievements : null;
  const stageAchievement = {
    id: 'life-stage',
    label: getCatLifeStage(cat) || 'Idade',
    unlocked: Boolean(getCatLifeStage(cat)),
    icon: <Calendar className="text-amber-600" />,
  };

  if (explicit?.length) return [stageAchievement, ...explicit];

  const derived = [
    stageAchievement,
    {
      id: 'registered',
      label: 'RG Criado',
      unlocked: Boolean(cat?.id),
      icon: <Shield className="text-indigo-600" />,
    },
    {
      id: 'vaccinated',
      label: 'Vacinado',
      unlocked: Boolean(cat?.healthRecords?.some((r) => r.type === 'VACCINE')),
      icon: <Syringe className="text-emerald-600" />,
    },
    {
      id: 'weighted',
      label: 'Peso em Dia',
      unlocked: Boolean(cat?.weight),
      icon: <Weight className="text-sky-600" />,
    },
    {
      id: 'birthday',
      label: 'Idade Registrada',
      unlocked: Boolean(cat?.birthDate || cat?.ageYears || cat?.ageMonths),
      icon: <Calendar className="text-amber-600" />,
    },
    {
      id: 'microchip',
      label: 'Microchip',
      unlocked: Boolean(cat?.microchip),
      icon: <Sparkles className="text-fuchsia-600" />,
    },
    {
      id: 'level',
      label: `Nível ${cat?.level || 1}`,
      unlocked: Boolean(cat?.level),
      icon: <Trophy className="text-orange-500" />,
    },
    {
      id: 'photo',
      label: 'Foto Oficial',
      unlocked: Boolean(cat?.photoUrl),
      icon: <Heart className="text-rose-500 fill-rose-500" />,
    },
    {
      id: 'summary',
      label: 'Bio de Saúde',
      unlocked: Boolean(cat?.healthSummary),
      icon: <Shield className="text-teal-600" />,
    },
  ];

  return derived;
}

// ─── ANEL XP ──────────────────────────────────────────────────────────────────
function XPRing({ size = 80, progress = 0, accentColor = '#edff61', children }) {
  const R = (size / 2) - 4;
  const circumference = 2 * Math.PI * R;
  const offset = circumference * (1 - progress / 100);
  const cx = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        <circle
          cx={cx}
          cy={cx}
          r={R}
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ─── QR MODAL ─────────────────────────────────────────────────────────────────
function QRCardModal({ cat, preset, onClose, onViewPDF, onOpenVets }) {
  const publicUrl = getPetPublicUrl(cat);
  const whatsappUrl = getWhatsappShareUrl(cat);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      alert('Link copiado com sucesso!');
    } catch {
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const modal = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/65 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[28px] shadow-2xl overflow-hidden"
        style={{ width: '85vw', maxWidth: '360px' }}
      >
        <div className="relative">
          <div
            className="h-16 flex items-center px-4"
            style={{ background: `linear-gradient(135deg, ${preset.fromHex}, ${preset.toHex})` }}
          >
            <img src="/assets/logo-fundo1.svg" className="h-4 opacity-20 brightness-0 invert" />
            <span className="absolute top-3 right-4 text-[8px] font-black tracking-widest opacity-60 text-white flex items-center gap-1">
              <Lock size={9} /> RG OFICIAL
            </span>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 -bottom-8">
            <div className="w-16 h-16 rounded-full border-[4px] border-white shadow-lg overflow-hidden bg-gray-200">
              <img
                src={cat.photoUrl || '/placeholder-cat.png'}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 mb-2 text-center px-4">
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight leading-none">{cat.name}</h2>
          <p className="text-[9px] font-bold text-gray-400 tracking-[2px] mt-0.5">ID #{shortId(cat.id)}</p>
        </div>

        <div className="flex justify-center gap-5 mb-3 px-4">
          {[
            ['Idade', formatCatAgeWithDate(cat)],
            ['Raça', cat.breed || '—'],
            ['Peso', cat.weight ? `${cat.weight}kg` : '—'],
          ].map(([label, value], i) => (
            <React.Fragment key={label}>
              {i > 0 && <div className="w-px bg-gray-100" />}
              <div className="text-center">
                <p className="text-[7px] font-black text-gray-300 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-[10px] font-black text-gray-700">{value}</p>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col items-center mb-3">
          <div className="relative">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}&bgcolor=ffffff&color=1a1a2e&margin=2&qzone=1&format=png&ecc=H`}
              alt="QR Code"
              className="w-28 h-28 rounded-xl"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center p-1 border border-gray-100">
                <img src="/assets/Gatedo_logo.webp" alt="Gatedo" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="text-[7px] text-gray-400 font-black tracking-widest mt-2 uppercase hover:text-gray-600 transition-colors"
          >
            Copiar link público
          </button>
        </div>

        <div className="px-4 pb-4 flex flex-col gap-2">
          <button
            onClick={onViewPDF}
            className="w-full py-3 text-white rounded-[14px] font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
            style={{ background: `linear-gradient(135deg, ${preset.fromHex}, ${preset.toHex})` }}
          >
            <FileText size={13} /> Ver Ficha PDF
          </button>

          <div className="flex gap-2">
            <button
              onClick={onOpenVets}
              className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-[12px] font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <Heart size={12} /> Meus Vets
            </button>

            <button
              onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
              className="flex-1 py-2.5 bg-[#25D366] text-white rounded-[12px] font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <Send size={12} /> Enviar Whats
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

// ─── CUSTOMIZE MODAL ──────────────────────────────────────────────────────────
function CustomizeModal({ currentPreset, currentOverlay, onApply, onClose }) {
  const [selPreset, setSelPreset] = useState(currentPreset);
  const [selOverlay, setSelOverlay] = useState(currentOverlay);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-[28px] p-6 pb-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black text-gray-800">Personalizar RG</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Cor do Cartão</p>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {CAT_THEMES.map((g) => (
            <button key={g.id} onClick={() => setSelPreset(g)} className="flex flex-col items-center gap-1">
              <div
                className={`w-11 h-11 rounded-[14px] transition-all ${selPreset.id === g.id ? 'scale-110' : ''}`}
                style={{
                  background: `linear-gradient(135deg, ${g.fromHex}, ${g.toHex})`,
                  outline: selPreset.id === g.id ? `3px solid ${g.fromHex}` : 'none',
                  outlineOffset: '2px',
                  boxShadow: selPreset.id === g.id ? `0 4px 14px ${g.fromHex}60` : 'none',
                }}
              />
              <span className="text-[8px] font-black text-gray-400">{g.label}</span>
            </button>
          ))}
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Textura</p>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {CARD_OVERLAYS.map((ov) => (
            <button
              key={ov.id}
              onClick={() => setSelOverlay(ov)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border-2 transition-all ${
                selOverlay.id === ov.id ? 'border-transparent text-white' : 'border-gray-100 text-gray-500'
              }`}
              style={selOverlay.id === ov.id ? { background: `linear-gradient(135deg, ${selPreset.fromHex}, ${selPreset.toHex})` } : {}}
            >
              {ov.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            onApply(selPreset, selOverlay);
            onClose();
          }}
          className="w-full py-4 text-white rounded-[18px] font-black text-sm uppercase tracking-wider shadow-lg"
          style={{ background: `linear-gradient(135deg, ${selPreset.fromHex}, ${selPreset.toHex})` }}
        >
          Aplicar
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── PDF PLACEHOLDER MODAL ────────────────────────────────────────────────────
function PDFPlaceholderModal({ cat, onClose }) {
  const publicUrl = getPetPublicUrl(cat);

  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[24px] w-full max-w-sm p-6 text-center shadow-2xl"
      >
        <div className="w-14 h-14 rounded-full bg-indigo-50 mx-auto flex items-center justify-center mb-4">
          <FileText className="text-indigo-600" size={24} />
        </div>

        <h3 className="text-lg font-black text-gray-800">Ficha do Gato</h3>
        <p className="text-sm text-gray-500 mt-2">
          O PDF final ainda não está plugado nesta etapa.
          O card já está pronto para receber a rota/gerador quando você conectar isso.
        </p>

        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-left">
          <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Link público atual</p>
          <p className="text-xs text-gray-700 break-all">{publicUrl}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-[14px] bg-indigo-600 text-white font-black uppercase text-xs tracking-wider"
        >
          Fechar
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function CatIdentityCard({ cat, tutor: tutorProp, onOpenVets }) {
  const tutor = tutorProp ?? cat?.owner ?? null;

  const defaultPreset = resolveCatTheme(cat?.themeColor);
  const defaultOverlay = CARD_OVERLAYS[0];

  const [isFlipped, setIsFlipped] = useState(false);
  const [preset, setPreset] = useState(defaultPreset);
  const [overlay, setOverlay] = useState(defaultOverlay);
  const [showQR, setShowQR] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    setPreset(resolveCatTheme(cat?.themeColor));
  }, [cat?.themeColor]);

  const achievements = useMemo(() => normalizeAchievements(cat), [cat]);

  if (!cat) return null;

  const xpProgress = calcXPProgress(cat.xp || 0, cat.level || 1);
  const lifeStage = getCatLifeStage(cat);
  const lifeStageMeta = lifeStage ? LIFE_STAGE_META[lifeStage] : null;

  const handleQRClick = (e) => {
    e.stopPropagation();
    setShowQR(true);
  };

  const handleOpenVets = () => {
    if (typeof onOpenVets === 'function') {
      onOpenVets(cat);
      return;
    }

    window.location.href = `/gato/${cat.id}?tab=saude`;
  };

  return (
    <>
      <div className="relative w-full px-0 max-w-sm mx-auto" style={{ height: '230px', perspective: '1200px' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setShowCustomize(true);
          }}
          className="absolute top-2 left-8 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-sm"
        >
          <Palette size={14} className="text-white" />
        </motion.button>

        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%', cursor: 'pointer' }}
          onClick={() => setIsFlipped((f) => !f)}
        >
          {/* FRENTE */}
          <div
            className="absolute inset-0 rounded-[32px] overflow-hidden shadow-xl flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              background: `linear-gradient(135deg, ${preset.fromHex}, ${preset.toHex})`,
            }}
          >
            {overlay.id !== 'none' && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: overlay.style,
                  backgroundSize: overlay.id === 'dots' ? '12px 12px' : undefined,
                  opacity: 0.7,
                }}
              />
            )}

            <div className="relative z-10 flex items-start justify-between px-4 pt-4 pb-1">
              <img src="/assets/logo-fundo1.svg" className="h-5 opacity-25 brightness-0 invert" />
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/20">
                <Lock size={9} className="text-white/70" />
                <span className="text-[8px] font-black tracking-widest text-white/70 uppercase">RG</span>
              </div>
            </div>

            <div className="relative z-10 flex-1 flex items-center gap-4 px-4 pb-2">
              <div className="flex-shrink-0">
                <XPRing size={80} progress={xpProgress} accentColor={preset.accent}>
                  <div className="w-[62px] h-[62px] rounded-full overflow-hidden border-2 border-white/40 shadow-lg">
                    <img
                      src={cat.photoUrl || '/placeholder-cat.png'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                </XPRing>

                <p className="text-center text-[8px] font-black mt-0.5 opacity-70" style={{ color: preset.accent }}>
                  {xpProgress}% XP
                </p>
              </div>

              <div className="flex-1 min-w-0 text-white space-y-1.5">
                <div>
                  <h2
                    className="text-[24px] font-bold leading-[0.9] tracking-tight truncate drop-shadow-sm"
                    style={{ color: preset.accent }}
                  >
                    {cat.name}
                  </h2>
                  <div className="h-[1px] w-full bg-white/20 mt-1" />
                </div>

                <div>
                  <p className="text-[8px] opacity-70 uppercase tracking-widest font-bold mb-0.4">RAÇA</p>
                  <p className="font-bold text-sm leading-none truncate">{cat.breed || 'SRD'}</p>
                  <div className="h-[1px] w-full bg-white/20 mt-1" />
                </div>

                <div>
                  <p className="text-[8px] opacity-70 uppercase tracking-widest font-bold mb-0.4">GÊNERO</p>
                  <p className="font-bold text-sm leading-none">
                    {cat.gender === 'MALE' ? 'Macho' : cat.gender === 'FEMALE' ? 'Fêmea' : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-4 mt-auto bg-[#2D2D3A]/50 backdrop-blur-md rounded-[20px] mx-3 mb-3 mt-1 p-2 flex items-center justify-between border border-white/15">
              <div className="flex-4 space-y-0.5 pr-4 ml-2">
                <div>
                  <p className="text-[8px] text-white/50 uppercase font-bold mb-0.5">GATEDO ID</p>
                  <p className="text-white font-mono font-bold text-[12px] tracking-wide">#{shortId(cat.id)}</p>
                </div>
                <div className="h-[1px] w-8 bg-white/10" />
                <div>
                  <p className="text-[8px] text-white/50 uppercase font-bold mb-1">MICROCHIP</p>
                  <p className="text-white font-mono font-bold text-[10px] tracking-wide">{cat.microchip || '—'}</p>
                </div>
              </div>

              <div className="flex-1 text-right px-1 space-y-1">
                <div>
                  <p className="text-[8px] text-white/50 uppercase font-bold mb-1">IDADE</p>
                  {lifeStageMeta && (
                    <span className="inline-flex mb-1 px-2 py-0.5 rounded-full bg-white/15 text-[8px] font-black text-white tracking-wider">
                      {lifeStageMeta.label}
                    </span>
                  )}
                  <p className="text-white font-black text-[11px] leading-tight">
                    {formatCatAgeWithDate(cat)}
                  </p>
                </div>
                <div className="h-[1px] w-full bg-white/10" />
                <div>
                  <p className="text-[8px] text-white/50 uppercase font-bold mb-0.5">TUTOR</p>
                  <p className="text-white font-bold text-[10px] truncate">
                    {tutor?.name || cat?.owner?.name || cat?.ownerName || '—'}
                  </p>
                </div>
              </div>

              <div className="pl-2 mr-2 border-l border-white/10">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleQRClick}
                  className="bg-white p-1.5 rounded-xl shadow-sm active:bg-gray-50"
                >
                  <QrCode size={30} className="text-[#2D2D3A]" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* VERSO */}
          <div
            className="absolute inset-0 rounded-[32px] overflow-hidden shadow-xl flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: preset.back,
            }}
          >
            <div className="flex-1 flex flex-col p-4">
              <div className="flex gap-2 mb-3">
                <div className="flex-1 bg-black/10 rounded-full py-1 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Tutor</span>
                </div>
                <div className="flex-1 bg-black/10 rounded-full py-1 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Conquistas</span>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur rounded-[20px] p-3 mb-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow">
                  {tutor?.photoUrl
                    ? <img src={tutor.photoUrl} className="w-full h-full object-cover" />
                    : <User size={22} className="text-gray-400 m-auto mt-2.5" />}
                </div>

                <div className="min-w-0">
                  <p className="font-black text-gray-800 text-sm truncate">{tutor?.name || 'Tutor'}</p>
                  {tutor?.city && (
                    <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">
                      <MapPin size={9} /> {tutor.city}
                    </p>
                  )}
                  {tutor?.phone && (
                    <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                      <Phone size={9} /> {tutor.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 content-start flex-1">
                {achievements.slice(0, 8).map((ach, idx) => (
                  <div
                    key={ach.id || idx}
                    className="flex flex-col items-center justify-center bg-white/60 rounded-[12px] py-1.5 px-1 shadow-sm h-[58px]"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center mb-0.5 border-[1.5px] ${
                        ach.unlocked ? 'border-indigo-300 bg-white' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {ach.unlocked
                        ? React.cloneElement(ach.icon, { size: 14 })
                        : <Lock size={12} className="text-gray-300" />}
                    </div>

                    <span
                      className={`text-[6.5px] font-black text-center leading-tight uppercase line-clamp-2 ${
                        ach.unlocked ? 'text-indigo-700' : 'text-gray-300'
                      }`}
                    >
                      {ach.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pb-2">
              <ChevronDown size={14} className="animate-bounce text-gray-400" />
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showQR && (
          <QRCardModal
            cat={cat}
            preset={preset}
            onClose={() => setShowQR(false)}
            onViewPDF={() => {
              setShowQR(false);
              setShowPDF(true);
            }}
            onOpenVets={() => {
              setShowQR(false);
              handleOpenVets();
            }}
          />
        )}

        {showCustomize && (
          <CustomizeModal
            currentPreset={preset}
            currentOverlay={overlay}
            onApply={(p, o) => {
              setPreset(p);
              setOverlay(o);
            }}
            onClose={() => setShowCustomize(false)}
          />
        )}

        {showPDF && (
          <PDFPlaceholderModal
            cat={cat}
            onClose={() => setShowPDF(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
