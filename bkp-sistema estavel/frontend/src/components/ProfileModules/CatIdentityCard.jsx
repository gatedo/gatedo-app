import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Lock, Trophy, ChevronDown, Palette, X,
  Share2, FileText, Phone, MapPin, User, Heart,
  Shield, Syringe, Weight, Calendar, Cpu, Home,
  CheckCircle, AlertCircle, Download, Send
} from 'lucide-react';

// ─── PALETA DE CORES DO CARD ───────────────────────────────────────────────────
// Helper: exibe apenas o último bloco do UUID
const shortId = (id) => id ? id.split('-').pop().toUpperCase() : '—';

// Formata data/idade: ISO string ou anos estimados → "18.02.2015" ou "2 anos"
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
  } catch { return birthDate; }
};

export const CARD_GRADIENTS = [
  { id: 'violet',  label: 'Violeta',  front: 'from-[#6B61FF] to-[#4B40C6]', back: '#ebfc66', accent: '#DFFF40' },
  { id: 'rose',    label: 'Rosa',     front: 'from-[#FF6B9D] to-[#C94B7B]', back: '#FFF0F5', accent: '#FFD6E7' },
  { id: 'mint',    label: 'Menta',    front: 'from-[#2ECC71] to-[#1A9E55]', back: '#F0FFF4', accent: '#ADFFCE' },
  { id: 'ocean',   label: 'Oceano',   front: 'from-[#0EA5E9] to-[#0369A1]', back: '#F0F9FF', accent: '#BAE6FD' },
  { id: 'sunset',  label: 'Sunset',   front: 'from-[#F97316] to-[#C2410C]', back: '#FFF7ED', accent: '#FED7AA' },
  { id: 'galaxy',  label: 'Galáxia', front: 'from-[#312E81] to-[#1E1B4B]', back: '#EDE9FE', accent: '#C4B5FD' },
  { id: 'cherry',  label: 'Cereja',  front: 'from-[#E11D48] to-[#9F1239]', back: '#FFF1F2', accent: '#FECDD3' },
  { id: 'forest',  label: 'Floresta',front: 'from-[#166534] to-[#14532D]', back: '#F0FDF4', accent: '#BBF7D0' },
];

// ─── OVERLAYS SUTIS ────────────────────────────────────────────────────────────
export const CARD_OVERLAYS = [
  { id: 'none',   label: 'Nenhum',   style: '' },
  { id: 'paws',   label: 'Patinhas', style: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='3' fill='white' fill-opacity='0.07'/%3E%3Ccircle cx='20' cy='6' r='2' fill='white' fill-opacity='0.07'/%3E%3Ccircle cx='30' cy='10' r='3' fill='white' fill-opacity='0.07'/%3E%3Cellipse cx='20' cy='20' rx='7' ry='9' fill='white' fill-opacity='0.05'/%3E%3C/svg%3E\")" },
  { id: 'dots',   label: 'Pontos',   style: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)" },
  { id: 'lines',  label: 'Linhas',   style: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 12px)" },
  { id: 'stars',  label: 'Estrelas', style: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='white' fill-opacity='0.08' font-size='14'%3E✦%3C/text%3E%3C/svg%3E\")" },
];

// ─── COMPONENTE QR CARD (modal ao clicar no QR) ──────────────────────────────
function QRCardModal({ cat, preset, onClose, onViewPDF }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm"
      style={{ paddingBottom: '80px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full mx-5 bg-white rounded-[32px] shadow-2xl"
        style={{ maxHeight: 'calc(100dvh - 160px)', overflow: 'hidden' }}
      >
        {/* Header com a cor do preset — overflow visible para o avatar sair */}
        <div className={`bg-gradient-to-br ${preset.front} relative`} style={{ paddingBottom: '60px', paddingTop: '16px' }}>
          <img src="/assets/logo-fundo1.svg" className="absolute top-3 left-4 h-5 opacity-20 brightness-0 invert" />
          <span className="absolute top-3 right-4 text-[9px] font-black tracking-widest opacity-60 text-white flex items-center gap-1">
            <Lock size={10}/> RG OFICIAL
          </span>
        </div>

        {/* Zona de avatar — fora do header para não cortar */}
        <div className="relative flex justify-center" style={{ marginTop: '-48px' }}>
          <div className="w-24 h-24 rounded-full border-[5px] border-white shadow-xl overflow-hidden bg-gray-200 flex-shrink-0">
            <img src={cat.photoUrl} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
          </div>
        </div>

        {/* Corpo branco */}
        <div className="pb-5 px-5 flex flex-col items-center overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 340px)' }}>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{cat.name}</h2>
          <p className="text-[10px] font-bold text-gray-400 tracking-[2px] mt-0.5">ID #{shortId(cat.id)}</p>

          {/* Stats */}
          <div className="flex gap-5 mt-3 text-center">
            <div>
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Idade</p>
              <p className="text-xs font-black text-gray-700">{formatAge(cat.birthDate, cat.ageYears, cat.ageMonths, cat.isDateEstimated)}</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div>
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Raça</p>
              <p className="text-xs font-black text-gray-700">{cat.breed || '—'}</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div>
              <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Peso</p>
              <p className="text-xs font-black text-gray-700">{cat.weight ? `${cat.weight}kg` : '—'}</p>
            </div>
          </div>

          {/* QR centralizado com logo no meio */}
          <div className="mt-4 flex flex-col items-center">
            <div className="relative">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('https://app.gatedo.com/pet/' + cat.id)}&bgcolor=ffffff&color=1a1a2e&margin=2&qzone=1&format=png&ecc=H`}
                alt="QR Code"
                className="w-36 h-36 rounded-xl"
              />
              {/* Logo icon no centro — caminho correto */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center p-1 border border-gray-100">
                  <img src="/public/logo-icon.png" alt="Gatedo" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
            <p className="text-[8px] text-gray-400 font-black tracking-widest mt-2 uppercase">Escaneie para compartilhar</p>
          </div>

          {/* Botões */}
          <button onClick={onViewPDF}
            className={`w-full mt-4 py-3.5 bg-gradient-to-r ${preset.front} text-white rounded-[16px] font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md`}>
            <FileText size={14}/> Ver Ficha PDF
          </button>
          <div className="flex gap-2 w-full mt-2">
            <button className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-[14px] font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Heart size={13}/> Meus Vets
            </button>
            <button className="flex-1 py-2.5 bg-[#25D366] text-white rounded-[14px] font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Send size={13}/> Enviar Whats
            </button>
          </div>

          <button onClick={onClose} className="mt-3 text-gray-400 font-black text-[10px] uppercase tracking-widest py-2">
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── MODAL PDF ────────────────────────────────────────────────────────────────
function PDFModal({ cat, tutor, preset, onClose }) {
  const Row = ({ label, value, icon: Icon }) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-none">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon size={13} className="text-[#6158ca]" />
      </div>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider w-20 flex-shrink-0">{label}</span>
      <span className="text-sm font-bold text-gray-700 flex-1 text-right">{value || '—'}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-h-[92vh] bg-[#F7F8FC] rounded-t-[36px] overflow-hidden flex flex-col"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header clean — estilo ficha médica */}
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4">
          {/* Logo + título */}
          <div className="flex-1 flex items-center gap-3">
            <img src="/assets/logo_gatedo.svg" alt="Gatedo" className="h-7 w-auto" />
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Ficha Clínica Digital</p>
              <h2 className="text-base font-black text-gray-800 uppercase tracking-tight leading-none">{cat.name}</h2>
            </div>
          </div>
          {/* Foto miniatura + ID */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">ID</p>
              <p className="text-[10px] font-black text-[#6158ca] font-mono">#{shortId(cat.id)}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-gray-100 flex-shrink-0">
              <img src={cat.photoUrl} className="w-full h-full object-cover" />
            </div>
            <button onClick={onClose} className="bg-gray-100 p-2 rounded-full flex-shrink-0">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 bg-[#F7F8FC]">

          {/* Identificação */}
          <section>
            <h3 className="text-[9px] font-black text-[#6158ca] uppercase tracking-[3px] mb-2 px-1 flex items-center gap-2 before:content-[''] before:w-1 before:h-3 before:bg-[#6158ca] before:rounded-full">Identificação</h3>
            <div className="bg-white border border-gray-100 rounded-[16px] px-4 shadow-none">
              <Row label="Nome"     value={cat.name}     icon={User}     />
              <Row label="Apelido"  value={cat.nicknames} icon={Heart}    />
              <Row label="Raça"     value={cat.breed}    icon={Shield}   />
              <Row label="Gênero"   value={cat.gender === 'MALE' ? 'Macho' : cat.gender === 'FEMALE' ? 'Fêmea' : cat.gender || '—'} icon={User}     />
              <Row label="Microchip" value={cat.microchip} icon={Cpu}   />
              <Row label="ID Gatedo" value={cat.id} icon={QrCode} />
            </div>
          </section>

          {/* Dados Vitais */}
          <section>
            <h3 className="text-[9px] font-black text-[#6158ca] uppercase tracking-[3px] mb-2 px-1 flex items-center gap-2 before:content-[''] before:w-1 before:h-3 before:bg-[#6158ca] before:rounded-full">Dados Vitais</h3>
            <div className="bg-white border border-gray-100 rounded-[16px] px-4 shadow-none">
              <Row label="Nascimento" value={formatAge(cat.birthDate, cat.ageYears, cat.ageMonths, cat.isDateEstimated)} icon={Calendar} />
              <Row label="Peso"       value={cat.weight ? `${cat.weight} kg` : null} icon={Weight} />
              <Row label="Castrado"   value={cat.neutered ? 'Sim ✓' : 'Não'} icon={CheckCircle} />
              <Row label="Cidade"     value={cat.city}      icon={MapPin}  />
            </div>
          </section>

          {/* Saúde */}
          <section>
            <h3 className="text-[9px] font-black text-[#6158ca] uppercase tracking-[3px] mb-2 px-1 flex items-center gap-2 before:content-[''] before:w-1 before:h-3 before:bg-[#6158ca] before:rounded-full">Saúde</h3>
            <div className="bg-white border border-gray-100 rounded-[16px] px-4 shadow-none">
              <Row label="Resumo"   value={cat.healthSummary} icon={AlertCircle} />
              <Row label="Ração"    value={cat.foodBrand}    icon={Home}        />
              <Row label="Freq."    value={cat.foodFreq}     icon={Calendar}    />
            </div>
          </section>

          {/* Comportamento */}
          <section>
            <h3 className="text-[9px] font-black text-[#6158ca] uppercase tracking-[3px] mb-2 px-1 flex items-center gap-2 before:content-[''] before:w-1 before:h-3 before:bg-[#6158ca] before:rounded-full">Comportamento</h3>
            <div className="bg-white border border-gray-100 rounded-[16px] px-4 shadow-none">
              <Row label="Habitat"   value={cat.habitat}       icon={Home}     />
              <Row label="Atividade" value={cat.activityLevel} icon={Shield}   />
              <Row label="Traumas"   value={cat.traumaHistory} icon={AlertCircle} />
            </div>
          </section>

          {/* Tutor */}
          <section>
            <h3 className="text-[9px] font-black text-[#6158ca] uppercase tracking-[3px] mb-2 px-1 flex items-center gap-2 before:content-[''] before:w-1 before:h-3 before:bg-[#6158ca] before:rounded-full">Tutor Responsável</h3>
            <div className="bg-white border border-gray-100 rounded-[16px] px-4 shadow-none">
              <Row label="Nome"   value={profile.name || 'Tutor'}  icon={User}  />
              <Row label="Cidade" value={tutor?.city}  icon={MapPin} />
              <Row label="Fone"   value={tutor?.phone} icon={Phone} />
            </div>
          </section>

          {/* Personalidade */}
          {cat.personality?.length > 0 && (
            <section>
              <h3 className="text-[9px] font-black text-[#6158ca] uppercase tracking-[3px] mb-2 px-1 flex items-center gap-2 before:content-[''] before:w-1 before:h-3 before:bg-[#6158ca] before:rounded-full">Personalidade</h3>
              <div className="flex flex-wrap gap-2 px-1">
                {cat.personality.map((p, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#6158ca]/10 text-[#6158ca] rounded-full text-[10px] font-black uppercase tracking-wide border border-[#6158ca]/20">
                    {p}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="h-4" />
        </div>

        {/* Rodapé com ações */}
        <div className="px-5 py-4 pb-8 border-t border-gray-50 flex gap-3">
          <button className="flex-1 py-4 bg-[#6158ca] text-white rounded-[18px] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
            <Download size={15}/> Baixar PDF
          </button>
          <button className="flex-1 py-4 bg-[#25D366] text-white rounded-[18px] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg">
            <Send size={15}/> Compartilhar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── MODAL DE PERSONALIZAÇÃO ──────────────────────────────────────────────────
function CustomizeModal({ currentPreset, currentOverlay, onApply, onClose }) {
  const [selPreset,  setSelPreset]  = useState(currentPreset);
  const [selOverlay, setSelOverlay] = useState(currentOverlay);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end bg-black/60 backdrop-blur-sm"
      style={{ zIndex: 200 }}
      onClick={onClose}
    >
      {/* Esconde bottom bar empurrando para cima com z-index alto */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full bg-white rounded-t-[36px] px-5 pt-4 overflow-y-auto"
        style={{ maxHeight: '68dvh', paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-gray-800 uppercase tracking-wide flex items-center gap-2">
            <Palette size={18} className="text-[#6158ca]" /> Personalizar Card
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={16} /></button>
        </div>

        {/* Prévia */}
        <div className={`h-16 rounded-[20px] bg-gradient-to-r ${selPreset.front} mb-5 relative overflow-hidden flex items-center justify-center`}>
          {selOverlay.style && (
            <div className="absolute inset-0" style={{ backgroundImage: selOverlay.style, backgroundSize: '30px 30px' }} />
          )}
          <span className="text-white font-black text-sm uppercase tracking-widest relative z-10 drop-shadow">
            Prévia do Card
          </span>
        </div>

        {/* Cores */}
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Cor do Card</label>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {CARD_GRADIENTS.map(p => (
            <button key={p.id} onClick={() => setSelPreset(p)}
              className={`h-12 rounded-[14px] bg-gradient-to-br ${p.front} transition-all ${selPreset.id === p.id ? 'ring-2 ring-[#6158ca] ring-offset-2 scale-105' : 'opacity-70'}`}>
              <span className="text-[8px] text-white font-black drop-shadow">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Overlays */}
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Textura Overlay</label>
        <div className="flex gap-2 mb-6">
          {CARD_OVERLAYS.map(o => (
            <button key={o.id} onClick={() => setSelOverlay(o)}
              className={`flex-1 h-10 rounded-[12px] bg-gray-800 relative overflow-hidden border-2 transition-all ${selOverlay.id === o.id ? 'border-[#6158ca]' : 'border-transparent opacity-60'}`}>
              {o.style && <div className="absolute inset-0" style={{ backgroundImage: o.style, backgroundSize: '20px 20px' }} />}
              <span className="text-[8px] text-white font-black relative z-10 drop-shadow">{o.label}</span>
            </button>
          ))}
        </div>

        <button onClick={() => { onApply(selPreset, selOverlay); onClose(); }}
          className="w-full py-4 bg-[#6158ca] text-white rounded-[20px] font-black text-sm uppercase tracking-wider shadow-lg mb-6">
          Aplicar
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function CatIdentityCard({ cat, tutor }) {
  const [isFlipped,    setIsFlipped]    = useState(false);
  const [showQR,       setShowQR]       = useState(false);
  const [showPDF,      setShowPDF]      = useState(false);
  const [showCustomize,setShowCustomize]= useState(false);
  const [preset,       setPreset]       = useState(CARD_GRADIENTS[0]);
  const [overlay,      setOverlay]      = useState(CARD_OVERLAYS[0]);

  const handleQRClick = (e) => {
    e.stopPropagation();
    setShowQR(true);
  };

  return (
    <>
      {/* Botão de personalizar */}
      <div className="flex justify-end mb-2 pr-1">
        <button onClick={() => setShowCustomize(true)}
          className="flex items-center gap-1.5 text-[10px] font-black text-[#6158ca] uppercase tracking-wider bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-[#6158ca]/20">
          <Palette size={12}/> Personalizar
        </button>
      </div>

      {/* ── CARD COM FLIP ── */}
      <div className="w-full h-64 cursor-pointer select-none" style={{ perspective: '1000px' }}
        onClick={() => setIsFlipped(v => !v)}>
        <motion.div
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 180, damping: 22 }}
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
        >

          {/* ══ FRENTE ══ */}
          <div
            className={`absolute inset-1 rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-900/40 bg-gradient-to-br ${preset.front}`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Overlay sutil */}
            {overlay.style && (
              <div className="absolute inset-0 z-0 pointer-events-none"
                style={{ backgroundImage: overlay.style, backgroundSize: '50px 50px' }} />
            )}

            <div className="relative z-10 h-full flex flex-col p-4">
              <div className="flex justify-between items-start mb-2">
                {/* Foto */}
                <div className="relative w-32 h-32 shrink-0 -ml-2 -mt-2">
                  <svg className="absolute inset-0 w-full h-full rotate-[-15deg] drop-shadow-md">
                    <circle cx="50%" cy="50%" r="46%" fill="transparent" stroke={preset.accent} strokeWidth="5"
                      strokeLinecap="round" strokeDasharray="240" strokeDashoffset="40" />
                  </svg>
                  <div className="absolute inset-[10px] rounded-full overflow-hidden border-4 border-white/20 shadow-inner bg-gray-300">
                    <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                  </div>
                  <div className="absolute top-2 left-2 w-9 h-9 bg-[#2ECC71] rounded-full flex items-center justify-center border-[3px] border-white/20 shadow-sm z-20">
                    <span className="text-white font-black text-xs">N{cat.level}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-right flex flex-col gap-1 mt-1 pl-4 text-white">
                  <div>
                    <p className="text-[8px] opacity-70 uppercase tracking-widest font-bold mb-0.5">NOME</p>
                    <h2 className="text-[32px] font-bold leading-[0.9] tracking-tight truncate drop-shadow-sm" style={{ color: preset.accent }}>
                      {cat.name}
                    </h2>
                    <div className="h-[1px] w-full bg-white/20 mt-1" />
                  </div>
                  <div>
                    <p className="text-[8px] opacity-70 uppercase tracking-widest font-bold mb-0.5">RAÇA</p>
                    <p className="font-bold text-sm leading-none truncate">{cat.breed}</p>
                    <div className="h-[1px] w-full bg-white/20 mt-1" />
                  </div>
                  <div>
                    <p className="text-[8px] opacity-70 uppercase tracking-widest font-bold mb-0.5">GÊNERO</p>
                    <p className="font-bold text-sm leading-none">{cat.gender === 'MALE' ? 'Macho' : 'Fêmea'}</p>
                  </div>
                </div>
              </div>

              {/* Rodapé */}
              <div className="mt-auto bg-[#2D2D3A]/50 backdrop-blur-md rounded-[20px] p-2 flex items-center justify-between border border-white/10">
                <div className="flex-1 space-y-1 pr-1 border-r0 border-white/10">
                  <div>
                    <p className="text-[8px] text-white/50 uppercase font-bold mb-0.5">GATEDO ID</p>
                    <p className="text-white font-mono font-bold text-[11px] tracking-wide">#{shortId(cat.id)}</p>
                  </div>
                  <div className="h-[1px] w-8 bg-white/10" />
                  <div>
                    <p className="text-[8px] text-white/50 uppercase font-bold mb-0.5">MICROCHIP</p>
                    <p className="text-white font-mono font-bold text-[11px] tracking-wide">{cat.microchip || '—'}</p>
                  </div>
                </div>
                <div className="flex-1 text-right px-1 space-y-2">
                  <div>
                    <p className="text-[8px] text-white/50 uppercase font-bold mb-0.5">IDADE</p>
                    <p className="text-white font-bold text-[10px] leading-tight">{formatAge(cat.birthDate, cat.ageYears, cat.ageMonths, cat.isDateEstimated)}</p>
                  </div>
                  <div className="h-[1px] w-full bg-white/10" />
                  <div>
                    <p className="text-[8px] text-white/50 uppercase font-bold mb-0.5">TUTOR</p>
                    <p className="text-white font-bold text-[10px] truncate">{tutor?.name || '—'}</p>
                  </div>
                </div>
                {/* QR clicável */}
                <div className="pl-4 border-l border-white/10">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleQRClick}
                    className="bg-white p-2 rounded-xl shadow-sm active:bg-gray-50"
                  >
                    <QrCode size={38} className="text-[#2D2D3A]" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* ══ VERSO — TUTOR + CONQUISTAS ══ */}
          <div
            className="absolute inset-0 rounded-[32px] overflow-hidden shadow-xl flex flex-col"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: preset.back }}
          >
            <div className="flex-1 flex flex-col p-4">

              {/* Tabs */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 bg-black/10 rounded-full py-1 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Tutor</span>
                </div>
                <div className="flex-1 bg-black/10 rounded-full py-1 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Conquistas</span>
                </div>
              </div>

              {/* Dados do tutor */}
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
                      <MapPin size={9}/> {tutor.city}
                    </p>
                  )}
                  {tutor?.phone && (
                    <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                      <Phone size={9}/> {tutor.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Conquistas */}
              <div className="grid grid-cols-4 gap-1.5 content-start flex-1">
                {cat.achievements?.slice(0, 8).map((ach, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center bg-white/60 rounded-[12px] py-1.5 px-1 shadow-sm h-[58px]">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-0.5 border-[1.5px] ${
                      ach.unlocked ? 'border-indigo-300 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                      {ach.unlocked
                        ? React.cloneElement(ach.icon, { size: 14 })
                        : <Lock size={12} className="text-gray-300" />}
                    </div>
                    <span className={`text-[6.5px] font-black text-center leading-tight uppercase line-clamp-2 ${ach.unlocked ? 'text-indigo-700' : 'text-gray-300'}`}>
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

      {/* ── MODAIS ── */}
      <AnimatePresence>
        {showQR && (
          <QRCardModal cat={cat} preset={preset}
            onClose={() => setShowQR(false)}
            onViewPDF={() => { setShowQR(false); setShowPDF(true); }} />
        )}
        {showPDF && (
          <PDFModal cat={cat} tutor={tutor} preset={preset} onClose={() => setShowPDF(false)} />
        )}
        {showCustomize && (
          <CustomizeModal
            currentPreset={preset}
            currentOverlay={overlay}
            onApply={(p, o) => { setPreset(p); setOverlay(o); }}
            onClose={() => setShowCustomize(false)} />
        )}
      </AnimatePresence>
    </>
  );
}