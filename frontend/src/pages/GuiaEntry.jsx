import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircleHeart, AlertTriangle, AlertOctagon, ChevronRight } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import MiniMarkdown from '../utils/MiniMarkdown';
import OfferCard from '../components/offers/OfferCard';
import BlockRenderer from '../components/content/BlockRenderer';
import { isBlocksArray } from '../components/content/blockTypes';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', bg: '#F4F3FF' };

const URGENCY_META = {
  ROTINA: { label: 'Rotina', color: '#10B981', bg: '#ECFDF5' },
  ATENCAO: { label: 'Atenção', color: '#F59E0B', bg: '#FFFBEB', icon: AlertTriangle },
  EMERGENCIA: { label: 'Emergência', color: '#DC2626', bg: '#FEF2F2', icon: AlertOctagon },
};

function UrgencyBadge({ urgency }) {
  const meta = URGENCY_META[urgency];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide"
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

  return (
    <div className="min-h-screen pb-32" style={{ background: C.bg }}>
      <div className="px-5 pt-8 pb-4">
        <button
          onClick={() => { touch(); navigate(-1); }}
          className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm mb-5"
          style={{ color: C.purple }}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF]">{entry.category?.nome || entry.theme}</p>
          <UrgencyBadge urgency={entry.urgency} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1.5">{entry.title}</h1>
        {entry.excerpt && <p className="text-[13px] font-medium text-gray-500 leading-relaxed mb-4">{entry.excerpt}</p>}

        {hasBlocks ? (
          <div className="mb-4">
            <BlockRenderer blocks={entry.blocks} petId={catId} />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm mb-4">
              <MiniMarkdown text={entry.body} className="text-[14px] font-medium text-gray-600 leading-relaxed" />
            </div>

            {offer && (
              <div className="mb-4">
                <OfferCard offer={offer} surface="PAIN_ALMANAC" petId={catId} onDismiss={() => setOffer(null)} />
              </div>
            )}
          </>
        )}

        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {entry.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-black" style={{ background: '#EDE9FE', color: C.purple }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={askIgent}
          disabled={asking}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm mb-4"
          style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
        >
          <MessageCircleHeart size={18} /> Perguntar ao iGentVet sobre isso
        </button>

        {entry.relatedEntries?.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">Veja também</p>
            <div className="space-y-1.5">
              {entry.relatedEntries.map((rel) => (
                <button
                  key={rel.slug}
                  onClick={() => openRelated(rel.slug)}
                  className="w-full flex items-center gap-2 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm text-left"
                >
                  <span className="flex-1 text-[12px] font-black text-gray-700">{rel.title}</span>
                  <UrgencyBadge urgency={rel.urgency} />
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {entry.globalNotice && (
          <p className="text-[10px] font-medium text-gray-400 leading-relaxed text-center px-2">
            {entry.globalNotice}
          </p>
        )}
      </div>
    </div>
  );
}
