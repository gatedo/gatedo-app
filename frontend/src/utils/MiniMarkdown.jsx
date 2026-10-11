import React from 'react';

// Renderizador de markdown mínimo, sem dependência externa.
// Base: parágrafos, **negrito**, *itálico*, ==marca-texto== e listas "- item".
// No modo variant="article" (verbetes do Almanaque) também entende:
//   ## Subtítulo
//   > frase em destaque
//   **Rótulo:** texto      → vira uma caixa de destaque com o rótulo como título
//   1. item                → lista numerada em "passos"
// Nunca usa dangerouslySetInnerHTML — tudo vira nó de texto/JSX comum.

function renderInline(text, keyPrefix) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*|==(.+?)==|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-b-${i++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(
        <mark key={`${keyPrefix}-m-${i++}`} className="rounded px-1 font-bold text-[#3B1A80]" style={{ background: 'linear-gradient(transparent 35%, #EBFC66 35%)' }}>
          {match[2]}
        </mark>,
      );
    } else if (match[3] !== undefined) {
      parts.push(<em key={`${keyPrefix}-i-${i++}`}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function ArticleBlock({ block, bi }) {
  const lines = block.split('\n').filter((l) => l.trim());
  const first = lines[0]?.trim() || '';

  // Texto e lista colados no mesmo bloco ("Sinais:\n- a\n- b"): separa em partes.
  const isItem = (l) => /^([-*•]|\d+[.)])\s+/.test(l.trim());
  if (lines.some(isItem) && !lines.every(isItem)) {
    const groups = [];
    lines.forEach((l) => {
      const last = groups[groups.length - 1];
      if (last && last.item === isItem(l)) last.lines.push(l);
      else groups.push({ item: isItem(l), lines: [l] });
    });
    return groups.map((g, gi) => <ArticleBlock key={gi} block={g.lines.join('\n')} bi={`${bi}-${gi}`} />);
  }

  // ## Subtítulo
  if (lines.length === 1 && /^#{2,3}\s+/.test(first)) {
    return (
      <h3 className="text-[18px] font-black text-gray-900 leading-snug mt-6 mb-2 first:mt-0">
        {renderInline(first.replace(/^#{2,3}\s+/, ''), String(bi))}
      </h3>
    );
  }

  // > destaque
  if (lines.every((l) => /^>\s?/.test(l.trim()))) {
    return (
      <blockquote className="my-4 rounded-2xl px-5 py-4 text-[17px] font-bold leading-relaxed text-[#3B1A80]" style={{ background: '#F4F0FF', borderLeft: '4px solid #8B4AFF' }}>
        {renderInline(lines.map((l) => l.trim().replace(/^>\s?/, '')).join(' '), String(bi))}
      </blockquote>
    );
  }

  // - lista com marcadores
  if (lines.every((l) => /^[-*•]\s+/.test(l.trim()))) {
    return (
      <ul className="my-4 space-y-2">
        {lines.map((line, li) => (
          <li key={li} className="flex items-start gap-3 rounded-xl bg-[#FAF8FF] px-3.5 py-2.5">
            <span className="mt-[9px] w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#8B4AFF' }} />
            <span className="flex-1">{renderInline(line.trim().replace(/^[-*•]\s+/, ''), `${bi}-${li}`)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // 1. passos numerados
  if (lines.every((l) => /^\d+[.)]\s+/.test(l.trim()))) {
    return (
      <ol className="my-4 space-y-2.5">
        {lines.map((line, li) => (
          <li key={li} className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-black text-white" style={{ background: '#8B4AFF' }}>
              {li + 1}
            </span>
            <span className="flex-1 pt-0.5">{renderInline(line.trim().replace(/^\d+[.)]\s+/, ''), `${bi}-${li}`)}</span>
          </li>
        ))}
      </ol>
    );
  }

  // **Rótulo:** texto → caixa de destaque
  const label = block.match(/^\*\*([^*]{2,60}?):?\*\*:?\s*([\s\S]*)$/);
  if (label && label[2].trim()) {
    return (
      <div className="my-4 rounded-2xl px-5 py-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <p className="text-[12px] font-black uppercase tracking-[0.14em] text-emerald-700 mb-1.5">{label[1].replace(/:$/, '')}</p>
        <p className="text-gray-800">{renderInline(label[2].trim(), String(bi))}</p>
      </div>
    );
  }

  return <p className="mb-4 last:mb-0">{renderInline(block, String(bi))}</p>;
}

export default function MiniMarkdown({ text, className, variant }) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);

  if (variant === 'article') {
    return (
      <div className={className}>
        {blocks.map((block, bi) => <ArticleBlock key={bi} block={block} bi={bi} />)}
      </div>
    );
  }

  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter((l) => l.trim());
        const isList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l.trim()));

        if (isList) {
          return (
            <ul key={bi} className="list-disc pl-5 space-y-1 my-2">
              {lines.map((line, li) => (
                <li key={li}>{renderInline(line.trim().replace(/^[-*]\s+/, ''), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bi} className="mb-3 last:mb-0">
            {renderInline(block, String(bi))}
          </p>
        );
      })}
    </div>
  );
}
