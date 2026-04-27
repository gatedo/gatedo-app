import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Globe2, Share2, ChevronLeft, ChevronRight,
  Sparkles, Clock, Copy, Check,
} from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import SocialPostComposerModal from './social/SocialPostComposerModal';

const LOGO_WATERMARK = '/assets/App_gatedo_logo1.webp';

const C = {
  dark: '#0f0a1e',
  card: '#1a1030',
  purple: '#8B4AFF',
  accentDim: '#ebfc66',
  accent: '#DFFF40',
};

const MODULE_LABELS = {
  'tutor-cat': { label: 'Tutor + Gato', emoji: '📸' },
  portrait: { label: 'Estilos', emoji: '🎨' },
  sticker: { label: 'Sticker', emoji: '✨' },
  'cat-dance': { label: 'Dancinhas', emoji: '🕺' },
  default: { label: 'Criação', emoji: '🐱' },
};

function getModuleMeta(key) {
  return MODULE_LABELS[key] || MODULE_LABELS.default;
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '';
  }
}

function resolveAssetImage(asset) {
  return (
    asset?.previewUrl ||
    asset?.outputImageUrl ||
    asset?.resultUrl ||
    asset?.assetUrl ||
    asset?.imageUrl ||
    asset?.url ||
    ''
  );
}

function normalizeStudioCreation(asset) {
  const resolvedUrl = resolveAssetImage(asset);

  return {
    ...asset,
    previewUrl: asset?.previewUrl || resolvedUrl,
    outputImageUrl: asset?.outputImageUrl || resolvedUrl,
    resultUrl: asset?.resultUrl || resolvedUrl,
    imageUrl: asset?.imageUrl || resolvedUrl,
    moduleKey: asset?.moduleKey || asset?.toolId || 'default',
  };
}

async function buildShareCanvas(imageUrl) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const SIZE = 1080;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = '#0f0a1e';
      ctx.fillRect(0, 0, SIZE, SIZE);

      const ratio = Math.max(SIZE / img.width, SIZE / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = (SIZE - w) / 2;
      const y = (SIZE - h) / 2;
      ctx.drawImage(img, x, y, w, h);

      const grad = ctx.createLinearGradient(0, SIZE - 200, 0, SIZE);
      grad.addColorStop(0, 'rgba(15,10,30,0)');
      grad.addColorStop(1, 'rgba(15,10,30,0.88)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, SIZE - 200, SIZE, 200);

      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const lw = 140;
        const lh = (logo.height / logo.width) * lw;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(logo, SIZE - lw - 28, SIZE - lh - 28, lw, lh);
        ctx.globalAlpha = 1;
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      logo.onerror = () => {
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      logo.src = LOGO_WATERMARK;
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

function ShareCardPreview({ imageUrl, moduleMeta, petName, onClose, onShare }) {
  const [dataUrl, setDataUrl] = useState('');
  const [building, setBuilding] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBuilding(true);
    buildShareCanvas(imageUrl)
      .then((url) => {
        setDataUrl(url);
        setBuilding(false);
      })
      .catch(() => {
        setBuilding(false);
      });
  }, [imageUrl]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `gatedo-${Date.now()}.jpg`;
    a.click();
  };

  const handleNativeShare = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'gatedo.jpg', { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Feito no Gatedo Studio 🐱' });
      } else {
        handleDownload();
      }
    } catch {}
    onShare?.();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://gatedo.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, scale: 0.94 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 60 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="w-full max-w-sm rounded-[32px] overflow-hidden"
        style={{ background: C.card, border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-square bg-black">
          {building ? (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={28} className="text-white/30" />
              </motion.div>
            </div>
          ) : dataUrl ? (
            <img src={dataUrl} alt="Share card" className="w-full h-full object-cover" />
          ) : (
            <img src={imageUrl} alt="Share card" className="w-full h-full object-cover" />
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          >
            <X size={14} className="text-white" />
          </button>

          <div
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <span className="text-sm">{moduleMeta.emoji}</span>
            <span className="text-[9px] font-black text-white/80">{moduleMeta.label}</span>
            {petName && <span className="text-[9px] text-white/45">· {petName}</span>}
          </div>
        </div>

        <div className="p-4 space-y-2">
          <p className="text-[9px] text-white/35 font-black uppercase tracking-[2px] mb-3 text-center">
            Compartilhar criação
          </p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNativeShare}
            className="w-full py-3.5 rounded-[18px] font-black text-sm flex items-center justify-center gap-2 text-white"
            style={{ background: 'linear-gradient(135deg, #8B4AFF, #ec4899)', boxShadow: '0 6px 20px rgba(139,74,255,0.35)' }}
          >
            <Share2 size={15} />
            Compartilhar agora
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            className="w-full py-3 rounded-[18px] font-black text-xs flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)' }}
          >
            <Download size={13} />
            Salvar no dispositivo
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCopyLink}
            className="w-full py-3 rounded-[18px] font-black text-xs flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.04)', color: copied ? C.accentDim : 'rgba(255,255,255,0.35)' }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Link copiado!' : 'Copiar link do Gatedo'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AssetModal({ asset, allAssets, onClose }) {
  const touch = useSensory();
  const [idx, setIdx] = useState(() => allAssets.findIndex((a) => a.id === asset.id));
  const [share, setShare] = useState(false);
  const [compose, setCompose] = useState(false);

  const current = normalizeStudioCreation(allAssets[idx] || asset);
  const imgUrl = resolveAssetImage(current);
  const meta = getModuleMeta(current.moduleKey || current.toolId);

  const prev = () => {
    touch();
    setIdx((i) => Math.max(0, i - 1));
  };

  const next = () => {
    touch();
    setIdx((i) => Math.min(allAssets.length - 1, i + 1));
  };

  const startX = useRef(null);
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    if (diff < -50) prev();
    startX.current = null;
  };

  const handlePublish = () => {
    if (!current?.id) return;
    setCompose(true);
  };

  return (
    <>
      {!compose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col"
          style={{ background: 'rgba(0,0,0,0.96)' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between px-4 pt-5 pb-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <X size={16} className="text-white" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-lg">{meta.emoji}</span>
              <div>
                <p className="text-xs font-black text-white leading-none">{meta.label}</p>
                {current.petName && (
                  <p className="text-[9px] text-white/40">{current.petName}</p>
                )}
              </div>
            </div>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <Clock size={10} className="text-white/40" />
              <span className="text-[9px] text-white/40">{fmtDate(current.createdAt)}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="flex-1 flex items-center justify-center px-4 relative"
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={meta.label}
                  className="max-w-full max-h-full rounded-[24px] object-contain"
                  style={{ maxHeight: 'calc(100vh - 280px)' }}
                />
              ) : (
                <div
                  className="w-64 h-64 rounded-[24px] flex items-center justify-center text-5xl"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  🎨
                </div>
              )}

              {idx > 0 && (
                <button
                  onClick={prev}
                  className="absolute left-2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                >
                  <ChevronLeft size={18} className="text-white" />
                </button>
              )}

              {idx < allAssets.length - 1 && (
                <button
                  onClick={next}
                  className="absolute right-2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                >
                  <ChevronRight size={18} className="text-white" />
                </button>
              )}
            </motion.div>
          </AnimatePresence>

          {allAssets.length > 1 && (
            <div className="flex justify-center gap-1.5 py-2">
              {allAssets.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === idx ? 20 : 6,
                    height: 6,
                    background: i === idx ? C.accentDim : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>
          )}

          <div className="px-4 pb-8 pt-2 grid grid-cols-2 gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handlePublish}
              className="py-3.5 rounded-[18px] font-black text-xs flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #8B4AFF, #ec4899)', color: '#fff' }}
            >
              <Globe2 size={13} />
              Publicar no Feed
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                touch();
                setShare(true);
              }}
              className="py-3.5 rounded-[18px] font-black text-xs flex items-center justify-center gap-1.5"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              <Share2 size={13} />
              Compartilhar
            </motion.button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {share && (
          <ShareCardPreview
            imageUrl={imgUrl}
            moduleMeta={meta}
            petName={current.petName}
            onClose={() => setShare(false)}
            onShare={() => setShare(false)}
          />
        )}
      </AnimatePresence>

      {compose && (
        <div className="fixed inset-0 z-[500]">
          <SocialPostComposerModal
            isOpen={compose}
            onClose={() => setCompose(false)}
            onSuccess={() => {
              setCompose(false);
              onClose?.();
              window.dispatchEvent(new CustomEvent('gatedo-social-published'));
            }}
            selectedStudioCreation={current}
          />
        </div>
      )}
    </>
  );
}

export default function StudioGallery({ refreshTrigger = 0 }) {
  const touch = useSensory();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/studio/creations')
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        setAssets(list.map(normalizeStudioCreation));
      })
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const moduleKeys = [...new Set(assets.map((a) => a.moduleKey || 'default'))];
  const filtered = filter === 'all'
    ? assets
    : assets.filter((a) => (a.moduleKey || 'default') === filter);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-[16px] animate-pulse"
            style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.06)' }}
          />
        ))}
      </div>
    );
  }

  if (!assets.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-20 h-20 rounded-[28px] mb-4 flex items-center justify-center text-4xl"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          🎨
        </div>
        <p className="text-white/35 text-sm font-black mb-1">Nenhuma criação ainda</p>
        <p className="text-white/20 text-[10px] font-medium max-w-[180px] leading-relaxed">
          Gere sua primeira arte com um dos módulos ativos
        </p>
      </div>
    );
  }

  return (
    <>
      {moduleKeys.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
          {['all', ...moduleKeys].map((key) => {
            const meta = getModuleMeta(key);
            const active = filter === key;

            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  touch();
                  setFilter(key);
                }}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black"
                style={{
                  background: active ? C.purple : 'rgba(255,255,255,0.07)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {key !== 'all' && <span>{meta.emoji}</span>}
                {key === 'all' ? 'Todos' : meta.label}
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {filtered.map((asset, i) => {
          const imgUrl = resolveAssetImage(asset);
          const meta = getModuleMeta(asset.moduleKey || asset.toolId);

          return (
            <motion.button
              key={asset.id || i}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                touch();
                setOpen(asset);
              }}
              className="relative rounded-[16px] overflow-hidden focus:outline-none"
              style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.05)' }}
            >
              {imgUrl ? (
                <motion.img
                  src={imgUrl}
                  alt={meta.label}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
                  {meta.emoji}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-1.5 left-1.5">
                <span className="text-[11px]">{meta.emoji}</span>
              </div>

              <div className="absolute bottom-1.5 right-1.5 opacity-50">
                <img src={LOGO_WATERMARK} alt="" className="w-5 h-5 object-contain" />
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-[9px] text-white/25 font-bold mt-3">
        {filtered.length} criação{filtered.length !== 1 ? 'ões' : ''}
        {filter !== 'all' && ` · ${getModuleMeta(filter).label}`}
      </p>

      <AnimatePresence>
        {open && (
          <AssetModal
            asset={open}
            allAssets={filtered}
            onClose={() => setOpen(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}