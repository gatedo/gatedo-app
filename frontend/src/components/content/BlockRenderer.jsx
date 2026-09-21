import React, { useState } from 'react';
import { AlertTriangle, Lightbulb, Stethoscope, CheckSquare, Square } from 'lucide-react';
import MiniMarkdown from '../../utils/MiniMarkdown';
import OfferCard from '../offers/OfferCard';
import useOfferDecision from '../../hooks/useOfferDecision';
import { BLOCK_TYPES, CALLOUT_TONES } from './blockTypes';

// ── SECTION — a "seção colorida" pedida: bloco com fundo chapado na cor
// escolhida pelo admin, título opcional e corpo em markdown.
function SectionBlock({ block }) {
  return (
    <div className="rounded-[20px] p-4" style={{ background: block.color || '#8B4AFF' }}>
      {block.heading && (
        <h3 className="font-black text-white text-base mb-1.5 leading-tight">{block.heading}</h3>
      )}
      {block.body && (
        <MiniMarkdown text={block.body} className="text-white/90 text-[13px] leading-relaxed [&_strong]:text-white" />
      )}
    </div>
  );
}

function ImageBlock({ block }) {
  if (!block.url) return null;
  return (
    <figure className="rounded-[20px] overflow-hidden">
      <img src={block.url} alt={block.caption || ''} className="w-full h-auto object-cover" />
      {block.caption && (
        <figcaption className="text-[10px] text-gray-400 font-bold px-1 pt-1.5">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function ChecklistBlock({ block }) {
  const [checked, setChecked] = useState(() => new Set());
  const items = Array.isArray(block.items) ? block.items.filter(Boolean) : [];
  if (items.length === 0) return null;

  const toggle = (i) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="rounded-[20px] bg-gray-50 border border-gray-100 p-4">
      {block.title && <p className="font-black text-gray-700 text-[13px] mb-2.5">{block.title}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <button key={i} onClick={() => toggle(i)} className="w-full flex items-start gap-2 text-left">
            {checked.has(i)
              ? <CheckSquare size={16} className="shrink-0 mt-0.5" style={{ color: '#8B4AFF' }} />
              : <Square size={16} className="shrink-0 mt-0.5 text-gray-300" />}
            <span className={`text-[13px] font-bold leading-snug ${checked.has(i) ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {item}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const CALLOUT_ICON = { tip: Lightbulb, warning: AlertTriangle, vet: Stethoscope };

function CalloutBlock({ block }) {
  if (!block.text) return null;
  const tone = CALLOUT_TONES.find((t) => t.id === block.tone) || CALLOUT_TONES[0];
  const Icon = CALLOUT_ICON[tone.id] || Lightbulb;
  return (
    <div className="rounded-[18px] p-3.5 flex items-start gap-2.5"
      style={{ background: `${tone.color}0F`, border: `1px solid ${tone.color}30`, borderLeft: `3px solid ${tone.color}` }}>
      <Icon size={15} className="shrink-0 mt-0.5" style={{ color: tone.color }} />
      <p className="text-[13px] font-bold leading-snug" style={{ color: tone.color }}>{block.text}</p>
    </div>
  );
}

// ── OFFER_SLOT — o admin só escolhe ONDE, nunca O QUÊ: pede pro módulo único
// de decisão (mesma regra de qualquer outra superfície) e mostra ou não mostra
// nada, exatamente como as outras superfícies já feitas.
function OfferSlotBlock({ block, petId }) {
  const { offer, dismiss } = useOfferDecision({ surface: block.surface, petId, enabled: !!petId });
  if (!offer) return null;
  return <OfferCard offer={offer} surface={block.surface} petId={petId} onDismiss={dismiss} />;
}

export default function BlockRenderer({ blocks, petId, className = '' }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, i) => {
        const key = block.id || i;
        switch (block.type) {
          case BLOCK_TYPES.TEXT:
            return block.markdown ? <MiniMarkdown key={key} text={block.markdown} className="text-gray-700 text-[14px] leading-relaxed" /> : null;
          case BLOCK_TYPES.SECTION:
            return <SectionBlock key={key} block={block} />;
          case BLOCK_TYPES.IMAGE:
            return <ImageBlock key={key} block={block} />;
          case BLOCK_TYPES.CHECKLIST:
            return <ChecklistBlock key={key} block={block} />;
          case BLOCK_TYPES.CALLOUT:
            return <CalloutBlock key={key} block={block} />;
          case BLOCK_TYPES.OFFER_SLOT:
            return <OfferSlotBlock key={key} block={block} petId={petId} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
