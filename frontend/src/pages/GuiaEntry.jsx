import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircleHeart, AlertTriangle, AlertOctagon, ChevronRight, Clock } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import MiniMarkdown from '../utils/MiniMarkdown';
import OfferCard from '../components/offers/OfferCard';
import BlockRenderer from '../components/content/BlockRenderer';
import { isBlocksArray } from '../components/content/blockTypes';
import { entryCover, guideGradient, guideVisual, readingMinutes } from '../utils/guideVisuals';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', bg: 'var(--gatedo-light-bg)' };

const URGENCY_META = {
  ROTINA: { label: 'Rotina', color: '#047857', bg: '#ECFDF5' },
  ATENCAO: { label: 'Atenção', color: '#B45309', bg: '#FFFBEB', icon: AlertTriangle },
  EMERGENCIA: { label: 'Emergência', color: '#B91C1C', bg: '#FEF2F2', icon: AlertOctagon },
};

function UrgencyBadge({ urgency }) {
  const meta = URGENCY_META[urgency];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-wide"
      style={{ background: meta.bg, color: meta.color }}
    >
      {Icon && <Icon size={12} />}
      {meta.label}
    </span>
  );
}

// Substitui os placeholders com dados reais quando existem; o resto fica
// literal no texto pro tutor editar antes de enviar.
async function buildPrefilledQuestion(template, catId) {
  let text = template;
  try {
    const res = await api.get('/pets');
    const pets = Array.isArray(res.data) ? res.data : [];
    if (pets.length) text = text.replace('{n_gatos}', String(pets.length));

    const cat = catId ? pets.find((p) => p.id === catId) : null;
    if (cat) {
      if (cat.ageYears != null) {
        const ageLabel = cat.ageMonths ? `${cat.ageYears} anos e ${cat.ageMonths} meses` : `${cat.ageYears} anos`;
        text = text.replace('{idade}', ageLabel);
      }
      if (cat.weight) text = text.replace('{peso}', `${cat.weight}kg`);
    }
  } catch {
    // sem dados — placeholders ficam como estão, editáveis
  }
  return text;
}

export default function GuiaEntry() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const touch = useSensory();
  const catId = location.state?.catId || null;

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [asking, setAsking] = useState(false);
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/content/guides/${slug}`)
      .then((r) => setEntry(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Contexto de dor — verbete legado (sem blocos), categoria "caixa": pergunta
  // ao módulo único de decisão se cabe o card do Protocolo, no fim do texto.
  // Verbetes com blocos ricos decidem isso via bloco OFFER_SLOT (o admin
  // escolhe onde; o motor único continua sendo quem decide o quê) — por isso
  // esse fallback só roda quando NÃO há blocos, pra nunca duplicar oferta.
  const hasBlocks = isBlocksArray(entry?.blocks);
  useEffect(() => {
    setOffer(null);
    if (hasBlocks || entry?.category?.id !== 'caixa') return;
    api.get('/offers/decide', { params: { surface: 'PAIN_ALMANAC', petId: catId || undefined } })
      .then((r) => setOffer(r.data?.offer || null))
      .catch(() => {});
  }, [entry, catId, hasBlocks]);

  const askIgent = async () => {
    touch();
    setAsking(true);
    try {
      const template = entry?.perguntaIgentvet || `Tenho uma dúvida sobre: ${entry.title}`;
      const prefillMessage = await buildPrefilledQuestion(template, catId);

      if (!catId) {
        navigate('/igent-vet', { state: { prefillMessage } });
        return;
      }
      navigate('/igent-vet', { state: { catId, prefillMessage } });
    } finally {
      setAsking(false);
    }
  };

  const openRelated = (relatedSlug) => {
    touch('nav');
    navigate(`/guia/${relatedSlug}`, { state: { catId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <p className="text-[12px] font-medium text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (notFound || !entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: C.bg }}>
        <p className="text-[13px] font-black text-gray-500">Verbete não encontrado.</p>
        <button onClick={() => navigate('/guia')} className="text-[12px] font-black" style={{ color: C.purple }}>
          Voltar ao guia
        </button>
      </div>
    );
  }

  const cover = entryCover(entry);
  const visual = guideVisual(entry.category?.id);
  const minutes = readingMinutes(entry);

  return (
    <div className="min-h-screen pb-32" style={{ background: C.bg }}>
      <div className="max-w-[760px] mx-auto">
        {/* Banner do topo: imagem do admin ou degradê da categoria */}
        <div className="relative h-[220px] sm:h-[280px] overflow-hidden sm:rounded-b-[32px]">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full relative" style={{ background: guideGradient(entry.category?.id) }}>
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/15" />
              <div className="absolute -left-12 -bottom-16 w-48 h-48 rounded-full bg-black/5" />
              <span className="absolute right-6 bottom-12 text-7xl drop-shadow" aria-hidden="true">{visual.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), transparent 40%)' }} />
          <button
            onClick={() => { touch(); navigate(-1); }}
            aria-label="Voltar"
            className="absolute left-5 top-6 w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-md"
            style={{ color: C.purple }}
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="px-5 -mt-10 relative">
          <div className="bg-white rounded-[28px] shadow-sm border border-gray-100 px-5 pt-5 pb-6 sm:px-8">
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <span className="text-[12px] font-black uppercase tracking-[2.5px]" style={{ color: C.purple }}>{entry.category?.nome || entry.theme}</span>
              <UrgencyBadge urgency={entry.urgency} />
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-gray-400">
                <Clock size={12} /> {minutes} min de leitura
              </span>
            </div>
            <h1 className="text-[26px] sm:text-[30px] font-black text-gray-900 leading-tight">{entry.title}</h1>
            {entry.excerpt && <p className="text-[16px] font-medium text-gray-500 leading-relaxed mt-2">{entry.excerpt}</p>}

            <div className="h-px bg-gray-100 my-5" />

            {hasBlocks ? (
              <BlockRenderer blocks={entry.blocks} petId={catId} />
            ) : (
              <MiniMarkdown text={entry.body} variant="article" className="text-[16px] font-medium text-gray-700 leading-[1.75]" />
            )}
          </div>

          {!hasBlocks && offer && (
            <div className="mt-4">
              <OfferCard offer={offer} surface="PAIN_ALMANAC" petId={catId} onDismiss={() => setOffer(null)} />
            </div>
          )}

          {entry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {entry.tags.map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-full text-[12px] font-black" style={{ background: '#EDE9FE', color: C.purple }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={askIgent}
            disabled={asking}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-[15px] mt-5 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)`, boxShadow: '0 10px 24px rgba(139,74,255,0.3)' }}
          >
            <MessageCircleHeart size={19} /> Perguntar ao iGentVet sobre isso
          </button>

          {entry.relatedEntries?.length > 0 && (
            <div className="mt-7">
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-gray-400 mb-3">Veja também</p>
              <div className="space-y-2.5">
                {entry.relatedEntries.map((rel) => {
                  const relCover = rel.coverUrl || cover;
                  return (
                    <button
                      key={rel.slug}
                      onClick={() => openRelated(rel.slug)}
                      className="w-full flex items-center gap-3 bg-white rounded-2xl p-2.5 pr-4 border border-gray-100 shadow-sm text-left"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={relCover ? undefined : { background: guideGradient(entry.category?.id) }}>
                        {relCover
                          ? <img src={relCover} alt="" className="w-full h-full object-cover" loading="lazy" />
                          : <div className="w-full h-full flex items-center justify-center text-xl" aria-hidden="true">{visual.emoji}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-black text-gray-800 leading-snug line-clamp-2">{rel.title}</p>
                        {rel.urgency ? <div className="mt-1"><UrgencyBadge urgency={rel.urgency} /></div> : null}
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {entry.globalNotice && (
            <p className="text-[12px] font-medium text-gray-400 leading-relaxed text-center px-2 mt-6">
              {entry.globalNotice}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
