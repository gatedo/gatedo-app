import React, { useEffect, useRef, useState } from 'react';
import { Share2, Check } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { brandAssets } from '../brand/assets';
import { TUTOR_BADGE_META } from '../utils/membershipMeta';

const badgeMeta = TUTOR_BADGE_META.PRIMEIRA_JORNADA;

// Card vertical 9:16 do selo "Primeira Jornada" — mesmo padrão de captura
// (html2canvas + navigator.share, com fallback pra link/clipboard) já usado
// no card de adoção do Comunigato/ONG (OngDashboard.jsx InviteModal).
export default function OnboardingBadgeCard({ cat }) {
  const touch = useSensory();
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(null);
  const [done, setDone] = useState(null);
  const impressionFired = useRef(false);

  useEffect(() => {
    if (impressionFired.current) return;
    impressionFired.current = true;
    api.post('/offers/event', { surface: 'ONBOARDING_BADGE_SHARE', offerKey: 'CARD_SHOWN', action: 'IMPRESSION' }).catch(() => {});
  }, []);

  const share = async (channel) => {
    touch();
    setSharing(channel);
    setDone(null);
    api.post('/offers/event', { surface: 'ONBOARDING_BADGE_SHARE', offerKey: channel, action: 'CLICK' }).catch(() => {});

    const shareText = `${cat?.name || 'Meu gato'} e eu completamos a Primeira Jornada no GATEDO! 🐾`;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2, useCORS: true });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const file = blob ? new File([blob], `primeira-jornada-${cat?.name || 'gatedo'}.png`, { type: 'image/png' }) : null;

      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Primeira Jornada GATEDO', text: shareText });
      } else if (navigator.share) {
        await navigator.share({ title: 'Primeira Jornada GATEDO', text: shareText });
      } else {
        await navigator.clipboard?.writeText(shareText);
        setDone(channel);
        setTimeout(() => setDone(null), 1800);
      }
      api.post('/offers/event', { surface: 'ONBOARDING_BADGE_SHARE', offerKey: channel, action: 'CONVERT' }).catch(() => {});
    } catch {
      // Foto pode travar o canvas por CORS — nesse caso ainda oferece o texto.
      if (navigator.share) {
        navigator.share({ title: 'Primeira Jornada GATEDO', text: shareText }).catch(() => {});
      }
    } finally {
      setSharing(null);
    }
  };

  return (
    <div className="w-full max-w-[220px] mx-auto">
      <div
        ref={cardRef}
        className="rounded-[24px] overflow-hidden aspect-[9/16] flex flex-col"
        style={{ background: badgeMeta.gradient }}
      >
        <div className="pt-5 px-5">
          <img src={brandAssets.gatedoYellow} alt="Gatedo" className="h-5 object-contain" crossOrigin="anonymous" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-white/15 border-2 border-white/30 mb-4">
            {cat?.photoUrl ? (
              <img src={cat.photoUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🐱</div>
            )}
          </div>
          <p className="text-white text-lg font-black mb-1">{cat?.name || 'Meu gato'}</p>
          <div className="bg-white/15 border border-white/25 rounded-2xl px-4 py-2.5 mt-2">
            <span className="text-2xl">{badgeMeta.emoji}</span>
            <p className="text-white text-[11px] font-black uppercase tracking-[2px] mt-1">{badgeMeta.label}</p>
          </div>
        </div>

        <div className="pb-5 pt-2 text-center">
          <p className="text-white/50 text-[9px] font-black uppercase tracking-[3px]">GATEDO</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => share('INSTAGRAM')}
          disabled={sharing === 'INSTAGRAM'}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-black text-[11px] text-white"
          style={{ background: sharing === 'INSTAGRAM' ? '#9ca3af' : 'linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)' }}
        >
          {done === 'INSTAGRAM' ? <Check size={13} /> : <Share2 size={13} />} Instagram
        </button>
        <button
          onClick={() => share('WHATSAPP')}
          disabled={sharing === 'WHATSAPP'}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-black text-[11px] text-white"
          style={{ background: sharing === 'WHATSAPP' ? '#9ca3af' : '#25D366' }}
        >
          {done === 'WHATSAPP' ? <Check size={13} /> : <Share2 size={13} />} WhatsApp
        </button>
      </div>
    </div>
  );
}
