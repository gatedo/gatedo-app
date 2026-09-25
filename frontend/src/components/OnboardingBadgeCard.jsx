import React, { useEffect, useRef, useState } from 'react';
import { Share2, Check } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { formatCatAge } from '../utils/catAge';
import OfficialRgCard from './OfficialRgCard';
import { track } from '../utils/track';

export const ONBOARDING_BADGE_GRADIENT = 'linear-gradient(145deg, #8B4AFF 0%, #7644E8 48%, #5C35C8 100%)';

// Selo compartilhável do tour de boas-vindas — mesmo "RG" oficial usado no
// cadastro completo (AddCat.jsx), pra manter a identidade visual do app,
// com a faixa da Primeira Jornada por cima. Reaproveita o padrão de captura
// (html2canvas + navigator.share) já usado no card de adoção do Comunigato.
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
    track('badge_shared', { badge_id: 'PRIMEIRA_JORNADA', channel });

    const shareText = `${cat?.name || 'Meu gato'} e eu completamos a Primeira Jornada no GATEDO! 🐾`;
    try {
      const { default: html2canvas } = await import('html2canvas');
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        proxy: `${api.defaults.baseURL}/media/proxy`,
      });
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

  const generatedId = cat?.id ? String(cat.id).split('-').pop().toUpperCase() : 'GATEDO';
  const ageLabel = cat ? formatCatAge(cat, { fallback: null }) : null;

  return (
    <div className="w-full max-w-[380px] mx-auto">
      <div ref={cardRef} className="rounded-[28px] p-6 pb-7" style={{ background: ONBOARDING_BADGE_GRADIENT }}>
        <OfficialRgCard
          name={cat?.name}
          breed={cat?.breed}
          avatarPreview={cat?.photoUrl}
          generatedId={generatedId}
          petId={cat?.id}
          ageLabel={ageLabel}
          weight={cat?.weight ? `${cat.weight} kg` : null}
        />

        <div className="flex justify-center mt-4 mb-4">
          <span className="inline-flex items-center gap-1.5 bg-[#ebfc66] text-[#4B2AAF] text-[10px] font-black uppercase tracking-[1.5px] px-3.5 py-1.5 rounded-full shadow-md">
            🐾 Primeira Jornada
          </span>
        </div>

        <p className="text-white text-center text-lg font-black leading-tight">Bem-vindo à Família!</p>
        <p className="text-white/70 text-center text-[12px] font-bold mt-1">
          {cat?.name || 'Seu gato'} agora pertence ao mundo <span className="text-[#ebfc66]">GATEDO</span>.
        </p>
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
