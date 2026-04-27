import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Wand2, Check, X,
  AlertTriangle, Coins, Zap, PawPrint,
  Download, RefreshCw, ChevronRight,
  Lightbulb, ChevronDown, Sticker,
} from 'lucide-react';
import api from '../services/api';
import { buildPrompt, MODULE_CONFIG, PROMPT_SUGGESTIONS } from '../utils/studioPromptLibrary';
import { useGamification } from '../context/GamificationContext';
import useSensory from '../hooks/useSensory';

// ─── Constantes lidas da biblioteca ──────────────────────────────────────────
const MODULE_KEY = 'sticker';
const MOD        = MODULE_CONFIG[MODULE_KEY];
const GPTS_COST  = MOD.gptsCost;
const XPT_REWARD = MOD.xptReward;
const XPG_REWARD = MOD.xpgReward;
const GRADIENT   = MOD.gradient;
const PRESETS    = MOD.presets;

const C = {
  dark:   '#0f0a1e',
  card:   '#1a1030',
  purple: '#8B4AFF',
  pink:   '#ec4899',
  accent: '#DFFF40',
  gpts:   '#f59e0b',
  xpt:    '#8B4AFF',
  xpg:    '#10b981',
};

// ─── Upload helper ────────────────────────────────────────────────────────────
async function uploadFile(file, onProgress) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post('/media/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress(Math.round((e.loaded / (e.total || 1)) * 100)),
  });
  if (!res.data?.url) throw new Error('Upload falhou — URL não retornada');
  return res.data.url;
}

// ─── UploadSlot ───────────────────────────────────────────────────────────────
function UploadSlot({ label, icon: Icon, previewUrl, onFile, uploading, uploadPct, accent }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className="flex flex-col items-center justify-center rounded-[24px] cursor-pointer relative overflow-hidden select-none"
      style={{
        minHeight: 200,
        background: previewUrl ? 'transparent' : 'rgba(255,255,255,0.03)',
        border: `1.5px dashed ${previewUrl ? 'transparent' : 'rgba(255,255,255,0.14)'}`,
      }}
    >
      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt={label}
            className="w-full object-cover rounded-[22px]"
            style={{ minHeight: 200, maxHeight: 280 }}
          />
          <div
            className="absolute inset-0 rounded-[22px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(0,0,0,0.42)' }}>
            <div className="flex flex-col items-center gap-1">
              <RefreshCw size={18} className="text-white" />
              <span className="text-[9px] font-black text-white/70">Trocar foto</span>
            </div>
          </div>
          {!uploading && (
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: accent }}>
              <Check size={12} color="#fff" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-[22px] flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.58)' }}>
              <div className="text-center">
                <div className="text-xl font-black text-white">{uploadPct}%</div>
                <p className="text-[9px] text-white/55 font-bold">Enviando...</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center pointer-events-none">
          {uploading ? (
            <>
              <div className="w-12 h-12 rounded-full border-2 border-white/15 flex items-center justify-center mb-1 relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke={accent} strokeWidth="3"
                    strokeDasharray={`${uploadPct * 1.257} 125.7`} strokeLinecap="round" />
                </svg>
                <span className="text-[10px] font-black text-white relative z-10">{uploadPct}%</span>
              </div>
              <p className="text-[9px] text-white/40 font-bold">Enviando...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-1"
                style={{ background: `${accent}16` }}>
                <Icon size={26} style={{ color: accent }} />
              </div>
              <p className="text-sm font-black text-white/80">{label}</p>
              <p className="text-[9px] text-white/30 font-medium">Toque para enviar</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={onFile}
      />
    </motion.div>
  );
}

// ─── Seletor de gato ──────────────────────────────────────────────────────────
function PetSelector({ pets, selected, onSelect }) {
  if (!pets.length) return null;
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[3px] text-white/35 mb-2.5">
        Escolher gato
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {pets.map(pet => {
          const active = selected?.id === pet.id;
          return (
            <motion.button key={pet.id} whileTap={{ scale: 0.92 }}
              onClick={() => onSelect(pet)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-[20px] transition-all"
              style={{
                background: active ? `${C.purple}22` : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${active ? C.pink : 'rgba(255,255,255,0.08)'}`,
                boxShadow: active ? `0 4px 16px ${C.pink}30` : 'none',
                minWidth: 72,
              }}>
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 relative flex items-center justify-center">
                {pet.photoUrl
                  ? <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                  : <PawPrint size={18} className="text-white/25" />}
              </div>
              <span className="text-[9px] font-black text-white/70 max-w-[64px] truncate text-center">
                {pet.name}
              </span>
              {active && <div className="w-4 h-1 rounded-full" style={{ background: C.pink }} />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Preset Card ──────────────────────────────────────────────────────────────
const PRESET_COLORS = {
  fofo:       '#be185d',
  expressivo: '#7c3aed',
  divertido:  '#dc2626',
  artistico:  '#1e40af',
};

function PresetCard({ preset, active, onSelect }) {
  const color = PRESET_COLORS[preset.id] || C.pink;
  return (
    <motion.button whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.02 }}
      onClick={() => onSelect(preset.id)}
      className="p-3.5 rounded-[20px] text-left relative overflow-hidden"
      style={{
        background: active
          ? `linear-gradient(135deg, ${color}38 0%, ${color}1a 100%)`
          : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
        boxShadow: active ? `0 4px 22px ${color}45` : 'none',
        transition: 'all 0.2s',
      }}>
      {active && (
        <div className="absolute top-0 right-0 w-14 h-14 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${color}50 0%, transparent 70%)`,
            transform: 'translate(30%,-30%)',
          }} />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xl">{preset.emoji}</span>
          {active && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: color }}>
              <Check size={10} color="#fff" />
            </div>
          )}
        </div>
        <p className="text-xs font-black text-white leading-tight">{preset.label}</p>
        <p className="text-[9px] font-medium mt-0.5 leading-snug"
          style={{ color: active ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.30)' }}>
          {preset.desc}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Sugestões de prompt da biblioteca ───────────────────────────────────────
function PromptSuggestions({ preset, onSelect }) {
  const [open, setOpen] = useState(false);
  const suggestions = PROMPT_SUGGESTIONS?.[MODULE_KEY]?.[preset] || [];
  if (!suggestions.length) return null;

  return (
    <div>
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[2px] mb-2"
        style={{ color: C.accent }}>
        <Lightbulb size={11} />
        Sugestões de estilo
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={11} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden">
            <div className="space-y-1.5 pb-2">
              {suggestions.map((s, i) => (
                <motion.button key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onSelect(s); setOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 rounded-[14px] text-[10px] font-medium leading-snug"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.60)',
                  }}>
                  ✦ {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── RewardToast ──────────────────────────────────────────────────────────────
function RewardToast({ gpts, xpt, xpg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ y: 60, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 60, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="fixed bottom-28 left-4 right-4 z-[200] rounded-[24px] p-4 flex items-center gap-4"
      style={{
        background: 'linear-gradient(135deg, #1a0d33, #2d1660)',
        border: '1px solid rgba(223,255,64,0.25)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
      }}>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(223,255,64,0.12)' }}>
        <Sparkles size={18} color={C.accent} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-white mb-1">Recompensas creditadas!</p>
        <div className="flex gap-2 flex-wrap">
          {gpts < 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${C.gpts}20`, color: C.gpts }}>{gpts} GPTS</span>
          )}
          {xpt > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${C.xpt}20`, color: '#cbb1ff' }}>+{xpt} XPT</span>
          )}
          {xpg > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${C.xpg}20`, color: C.xpg }}>+{xpg} XPG</span>
          )}
        </div>
      </div>
      <button onClick={onClose}><X size={14} className="text-white/40" /></button>
    </motion.div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function StickerModulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const touch    = useSensory();
  const { points: ctxPoints, refreshGamification } = useGamification();

  const { studioTool, selectedPet: petFromStudio } = location.state || {};
  const effectiveCost = studioTool?.coinsCost ?? GPTS_COST;
  const effectiveXpt  = studioTool?.xpReward  ?? XPT_REWARD;

  // ── Pets ──────────────────────────────────────────────────────────────────
  const [pets,        setPets]        = useState([]);
  const [selectedPet, setSelectedPet] = useState(petFromStudio || null);

  useEffect(() => {
    api.get('/pets')
      .then(r => {
        const list = Array.isArray(r.data)
          ? r.data.filter(p => !p.isMemorial && !p.isArchived)
          : [];
        setPets(list);
        if (!petFromStudio && list.length === 1) setSelectedPet(list[0]);
        if (petFromStudio?.id) {
          const fresh = list.find(p => p.id === petFromStudio.id);
          if (fresh) setSelectedPet(fresh);
        }
      })
      .catch(() => {});
  }, []);

  // ── Upload (só foto do gato) ──────────────────────────────────────────────
  const [catPreview,   setCatPreview]   = useState('');
  const [catUploading, setCatUploading] = useState(false);
  const [catUploadPct, setCatUploadPct] = useState(0);
  const [catUrl,       setCatUrl]       = useState('');

  const catBlobRef = useRef('');

  useEffect(() => () => {
    if (catBlobRef.current) URL.revokeObjectURL(catBlobRef.current);
  }, []);

  const handleCatFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const target = e.target;
    setTimeout(() => { target.value = ''; }, 0);

    setError('');
    if (catBlobRef.current) URL.revokeObjectURL(catBlobRef.current);
    const blob = URL.createObjectURL(file);
    catBlobRef.current = blob;
    setCatPreview(blob);
    setCatUrl('');
    setCatUploading(true);
    setCatUploadPct(0);
    try {
      const url = await uploadFile(file, setCatUploadPct);
      setCatUrl(url);
    } catch {
      setError('Erro ao enviar foto do gato. Tente novamente.');
      setCatPreview('');
      setCatUrl('');
    } finally {
      setCatUploading(false);
    }
  }, []);

  // ── Geração ───────────────────────────────────────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].id);
  const [prompt,         setPrompt]         = useState('');
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [genStep,        setGenStep]        = useState('');
  const [resultUrl,      setResultUrl]      = useState('');
  const [creationId,     setCreationId]     = useState(null);
  const [creationObj,    setCreationObj]    = useState(null);
  const [error,          setError]          = useState('');
  const [showReward,     setShowReward]     = useState(false);
  const [rewardData,     setRewardData]     = useState(null);
  const [resolvedPoints, setResolvedPoints] = useState(ctxPoints || 0);

  useEffect(() => {
    if (ctxPoints > 0) { setResolvedPoints(ctxPoints); return; }
    api.get('/gamification/me')
      .then(r => setResolvedPoints(r.data?.gpts ?? r.data?.points ?? 0))
      .catch(() => {});
  }, [ctxPoints]);

  const handleGenerate = async () => {
    setError('');
    if (!selectedPet?.id) { setError('Selecione um gato antes de continuar.'); return; }
    if (!catUrl)          { setError('Aguarde o upload da foto do gato.'); return; }
    if (resolvedPoints < effectiveCost) {
      setError(`Saldo insuficiente. Você tem ${resolvedPoints} GPTS, precisa de ${effectiveCost}.`);
      return;
    }

    touch('success');
    setIsGenerating(true);
    setResultUrl('');
    setCreationId(null);
    setCreationObj(null);

    const STEPS = [
      'Analisando o rosto do gato...',
      'Criando pack de stickers...',
      'Aplicando estilo e traços...',
      'Finalizando os stickers...',
    ];
    let si = 0;
    setGenStep(STEPS[0]);
    const stepTimer = setInterval(() => {
      si = Math.min(si + 1, STEPS.length - 1);
      setGenStep(STEPS[si]);
    }, 3500);

    try {
      const builtPrompt = buildPrompt({
        moduleKey: MODULE_KEY,
        petName:   selectedPet?.name,
        preset:    selectedPreset,
        prompt:    prompt || '',
      });

      const res = await api.post('/studio/generate', {
        moduleKey:        MODULE_KEY,
        petId:            selectedPet.id,
        originalPhotoUrl: catUrl,
        preset:           selectedPreset,
        prompt:           builtPrompt,
        rawUserPrompt:    prompt || undefined,
      });

      const { creation, reward } = res.data || {};
      const finalUrl =
        creation?.resultUrl || creation?.previewUrl ||
        creation?.outputImageUrl || res.data?.resultUrl || '';

      if (!finalUrl) throw new Error(res.data?.message || 'A IA não retornou os stickers.');

      setResultUrl(finalUrl);
      setCreationId(creation?.id || null);
      setCreationObj({
        ...(creation || {}),
        resultUrl:      finalUrl,
        previewUrl:     creation?.previewUrl || finalUrl,
        outputImageUrl: creation?.outputImageUrl || finalUrl,
        moduleKey:      creation?.moduleKey || MODULE_KEY,
        petId:          creation?.petId || selectedPet?.id,
      });

      setRewardData({
        gpts: -(reward?.gptsDelta ?? effectiveCost),
        xpt:   reward?.xptDelta  ?? effectiveXpt,
        xpg:   reward?.xpgDelta  ?? XPG_REWARD,
      });
      setShowReward(true);
      setResolvedPoints(p => p - effectiveCost);
      window.dispatchEvent(new CustomEvent('gatedo:xp-updated'));
      window.dispatchEvent(new CustomEvent('gatedo-gamification-refresh'));
      await refreshGamification?.();

    } catch (err) {
      console.error('[Sticker] generate error:', err);
      setError(err?.response?.data?.message || err?.message || 'Erro ao gerar os stickers.');
    } finally {
      clearInterval(stepTimer);
      setIsGenerating(false);
      setGenStep('');
    }
  };

  const handlePublish = () => {
    if (!creationId || !creationObj) return;
    navigate('/comunigato/novo', {
      state: {
        studioCreationId:       creationObj.id,
        selectedStudioCreation: creationObj,
        imageUrl:               creationObj.previewUrl || resultUrl,
        source:                 'studio',
        moduleKey:              MODULE_KEY,
        petId:                  selectedPet?.id || creationObj.petId || null,
      },
    });
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `sticker-pack-${selectedPet?.name || 'gato'}-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  };

  const canGenerate =
    !!catUrl && !!selectedPet?.id &&
    !isGenerating && !catUploading &&
    resolvedPoints >= effectiveCost;

  const activePreset = PRESETS.find(p => p.id === selectedPreset) || PRESETS[0];

  return (
    <div className="min-h-screen pb-32 text-white" style={{ background: C.dark }}>

      {/* Header sticky */}
      <div className="sticky top-0 z-40 px-4 pt-5 pb-3"
        style={{ background: 'rgba(15,10,30,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between gap-3">
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { touch(); navigate(-1); }}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ArrowLeft size={17} />
          </motion.button>

          <div className="flex-1 text-center">
            <p className="text-[8px] font-black uppercase tracking-[3px] text-white/40">Módulo IA</p>
            <p className="text-sm font-black text-white">Sticker Pack</p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: `${C.gpts}18`, border: `1px solid ${C.gpts}35` }}>
            <Coins size={11} style={{ color: C.gpts }} />
            <span className="text-[10px] font-black" style={{ color: C.gpts }}>{resolvedPoints}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-2 pb-4 space-y-4 max-w-xl mx-auto">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[28px] overflow-hidden"
          style={{ background: GRADIENT, minHeight: 100 }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'url(/pattern_gatos.webp)', backgroundSize: 'cover' }} />
          <div className="relative z-10 p-5">
            <span className="text-[8px] font-black uppercase tracking-[3px] text-white/60 block mb-1">Módulo criativo</span>
            <h1 className="text-xl font-black text-white leading-tight mb-0.5">🎨 Sticker Pack</h1>
            <p className="text-[11px] text-white/70 font-medium leading-relaxed max-w-xs">
              Transforme seu gato em stickers fofos prontos para usar no app e compartilhar.
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {[
                { Icon: Coins,    val: `${effectiveCost} GPTS`, color: C.gpts },
                { Icon: Zap,      val: `+${effectiveXpt} XPT`,  color: '#fde68a' },
                { Icon: PawPrint, val: `+${XPG_REWARD} XPG`,   color: '#6ee7b7' },
              ].map(({ Icon, val, color }) => (
                <div key={val} className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.28)' }}>
                  <Icon size={10} style={{ color }} />
                  <span className="text-[9px] font-black text-white">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Seletor de gato */}
        <PetSelector pets={pets} selected={selectedPet} onSelect={setSelectedPet} />

        {/* Nenhum gato cadastrado */}
        {!selectedPet && pets.length === 0 && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/studio')}
            className="w-full flex items-center gap-3 p-3.5 rounded-[20px]"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-xs font-black text-white">Nenhum gato encontrado</p>
              <p className="text-[10px] text-white/45">Cadastre um gato primeiro no app</p>
            </div>
            <ChevronRight size={14} className="text-white/30" />
          </motion.button>
        )}

        {/* Gato selecionado confirmado */}
        {selectedPet && (
          <motion.div key={selectedPet.id}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-[20px]"
            style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.20)' }}>
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
              {selectedPet.photoUrl
                ? <img src={selectedPet.photoUrl} alt={selectedPet.name} className="w-full h-full object-cover" />
                : <PawPrint size={16} className="text-white/30" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] text-white/40 font-black uppercase tracking-widest">Gato selecionado</p>
              <p className="text-sm font-black text-white truncate">{selectedPet.name}</p>
            </div>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: C.pink }} />
          </motion.div>
        )}

        {/* Upload único */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[3px] text-white/35 mb-3">
            Foto para os stickers
          </p>
          <UploadSlot
            label="Foto do gato"
            icon={PawPrint}
            previewUrl={catPreview}
            onFile={handleCatFile}
            uploading={catUploading}
            uploadPct={catUploadPct}
            accent={C.pink}
          />
          <div className="flex items-center gap-1.5 mt-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: catUrl ? C.pink : catUploading ? '#f59e0b' : 'rgba(255,255,255,0.12)' }} />
            <span className="text-[9px] font-bold"
              style={{ color: catUrl ? C.pink : 'rgba(255,255,255,0.22)' }}>
              {catUrl ? 'Foto ✓' : catUploading ? `${catUploadPct}%` : 'Aguardando'}
            </span>
          </div>
          <p className="text-[9px] text-white/18 font-medium mt-1.5 text-center">
            Use foto com rosto visível e fundo limpo para melhores stickers
          </p>
        </div>

        {/* Presets */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[3px] text-white/35 mb-2.5">Estilo dos stickers</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(p => (
              <PresetCard key={p.id} preset={p} active={p.id === selectedPreset} onSelect={setSelectedPreset} />
            ))}
          </div>
        </div>

        {/* Prompt + sugestões */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[3px] text-white/35 mb-2">
            Direção criativa{' '}
            <span className="text-white/20 normal-case tracking-normal font-medium">(opcional)</span>
          </p>
          <textarea
            rows={3} value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder={`Ex: stickers fofos com expressões exageradas, estilo ${activePreset.label.toLowerCase()}...`}
            className="w-full rounded-[18px] p-4 text-sm outline-none resize-none placeholder:text-white/20 mb-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
          />
          <PromptSuggestions preset={selectedPreset} onSelect={setPrompt} />
        </div>

        {/* Erro */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-3.5 rounded-[18px]"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300 font-bold leading-snug flex-1">{error}</p>
              <button onClick={() => setError('')}><X size={13} className="text-red-400/60" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão gerar */}
        <motion.button
          whileTap={canGenerate ? { scale: 0.97 } : {}}
          onClick={canGenerate ? handleGenerate : undefined}
          disabled={!canGenerate}
          className="w-full py-4 rounded-[22px] font-black text-sm uppercase tracking-wider relative overflow-hidden"
          style={{
            background: canGenerate ? GRADIENT : 'rgba(255,255,255,0.06)',
            color: canGenerate ? '#fff' : 'rgba(255,255,255,0.25)',
            boxShadow: canGenerate ? '0 8px 28px rgba(139,74,255,0.35)' : 'none',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
          }}>
          {canGenerate && (
            <motion.div className="absolute inset-0 pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.12) 50%,transparent 60%)' }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isGenerating ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Wand2 size={16} />
                </motion.div>
                {genStep || 'Gerando...'}
              </>
            ) : (
              <><Sparkles size={16} /> Gerar stickers — {effectiveCost} GPTS</>
            )}
          </span>
        </motion.button>

        {!isGenerating && resolvedPoints < effectiveCost && (
          <p className="text-center text-[10px] font-bold" style={{ color: C.gpts }}>
            Saldo insuficiente — você tem {resolvedPoints} GPTS, precisa de {effectiveCost}
          </p>
        )}

        {/* Resultado */}
        <AnimatePresence>
          {resultUrl && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-[28px] overflow-hidden"
              style={{ border: '1.5px solid rgba(236,72,153,0.30)' }}>
              <div className="relative">
                <img src={resultUrl} alt="Pack de stickers gerado" className="w-full object-cover" />
                <div className="absolute top-3 right-3">
                  <span className="text-[8px] font-black px-2.5 py-1 rounded-full"
                    style={{ background: C.pink, color: '#fff' }}>✓ Gerado</span>
                </div>
              </div>
              <div className="p-4 space-y-2" style={{ background: 'rgba(26,16,48,0.95)' }}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Check size={14} style={{ color: C.pink }} />
                  <p className="text-xs font-black text-white">Pack de stickers pronto!</p>
                </div>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleDownload}
                  className="w-full py-3.5 rounded-[18px] font-black text-sm flex items-center justify-center gap-2"
                  style={{ background: GRADIENT, boxShadow: '0 6px 20px rgba(139,74,255,0.3)' }}>
                  <Download size={15} /> Salvar pack PNG
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handlePublish}
                  className="w-full py-3 rounded-[18px] font-black text-xs flex items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)' }}>
                  <Sparkles size={13} /> Compartilhar no Comunigato
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => { setResultUrl(''); setCreationId(null); setCreationObj(null); setError(''); }}
                  className="w-full py-3 rounded-[18px] font-black text-xs flex items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>
                  <RefreshCw size={12} /> Gerar outro pack
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RewardToast */}
      <AnimatePresence>
        {showReward && rewardData && (
          <RewardToast
            gpts={rewardData.gpts} xpt={rewardData.xpt} xpg={rewardData.xpg}
            onClose={() => setShowReward(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}