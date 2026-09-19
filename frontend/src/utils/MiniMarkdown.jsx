import React from 'react';

// Renderizador de markdown mínimo, sem dependência externa.
// Cobre só o que o conteúdo do Guia usa: parágrafos, **negrito**, *itálico* e listas "- item".
// Nunca usa dangerouslySetInnerHTML — tudo vira nó de texto/JSX comum.

function renderInline(text, keyPrefix) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;
  let i = 0;

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-b-${i++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={`${keyPrefix}-i-${i++}`}>{match[2]}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function MiniMarkdown({ text, className }) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);

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
