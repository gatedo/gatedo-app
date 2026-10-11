import React, { useEffect, useState } from 'react';
import { brandAssets } from '../../brand/assets';
import { PLATFORM, REPORT_DISCLAIMER, formatPetLine, makeQrDataUrl } from '../../utils/reportDocument';

function Section({ label, children }) {
  return (
    <section className="mt-4 rounded-[16px] border border-gray-100 px-4 py-3.5">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 mb-1.5">{label}</p>
      <div className="text-[13px] leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

// Versão HTML do Laudo IA — leve, responsiva e a mesma pro tutor e pro vet.
// O PDF (utils/reportDocument.js) segue o mesmo layout.
export default function LaudoView({ report, qrUrl, qrCaption }) {
  const [qr, setQr] = useState(null);
  const c = report?.consultation || {};
  const pet = report?.pet || {};
  const attachments = (report?.attachments || []).filter((a) => a?.url);

  useEffect(() => {
    let alive = true;
    if (!qrUrl) return undefined;
    makeQrDataUrl(qrUrl).then((d) => alive && setQr(d)).catch(() => {});
    return () => { alive = false; };
  }, [qrUrl]);

  if (!report) return null;

  return (
    <article className="bg-white text-gray-800 rounded-[22px] shadow-sm overflow-hidden" style={{ fontFamily: "'Asap', system-ui, sans-serif" }}>
      <div className="h-1.5 bg-[#8B4AFF]" />

      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-gray-100">
        <img src={brandAssets.gatedoFull} alt="Gatedo" className="h-8 object-contain object-left" />
        <div className="text-right text-[10px] leading-snug text-gray-400">
          <p className="font-bold text-gray-500">{PLATFORM.name} · {PLATFORM.tagline}</p>
          <p>{PLATFORM.site} · {PLATFORM.email}</p>
          <p>{PLATFORM.instagram}</p>
        </div>
      </header>

      <div className="px-5 pb-5">
        <div className="flex items-start justify-between gap-3 pt-5">
          <div className="flex items-center gap-3 min-w-0">
            <img src={brandAssets.igentvetWordmark} alt="iGentVet" className="h-7 object-contain flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-[19px] font-black text-[#2D2657] leading-tight">Laudo da IA</h1>
              <p className="text-[12px] text-gray-400 truncate">
                {report.reportId} · {c.date}{c.time ? ` às ${c.time}` : ''}
              </p>
            </div>
          </div>
          <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${c.isUrgent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {c.isUrgent ? 'Urgente' : 'Monitoramento'}
          </span>
        </div>

        <Section label="Paciente">
          <p className="text-[15px] font-black text-gray-900">{pet.name}</p>
          <p>{formatPetLine(pet)}</p>
          {report.owner?.name ? <p className="text-[12px] text-gray-400 mt-0.5">Tutor(a): {report.owner.name}</p> : null}
        </Section>

        <Section label="Consulta">
          <p><b>Sintoma:</b> {c.symptom || '—'}</p>
        </Section>

        <Section label="Análise da IA">
          <p className="whitespace-pre-line">{c.analysisText || '—'}</p>
        </Section>

        {c.care?.length ? (
          <Section label="Recomendações">
            <ul className="list-disc pl-5 space-y-1">
              {c.care.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Section>
        ) : null}

        {c.ownerResponse ? (
          <Section label="Resposta do tutor">
            <p className="whitespace-pre-line">{c.ownerResponse}</p>
          </Section>
        ) : null}

        {attachments.length ? (
          <Section label="Imagens enviadas pelo tutor">
            <div className="grid grid-cols-2 gap-3">
              {attachments.map((att, i) => (
                <figure key={i}>
                  <img src={att.url} alt={att.label || `Imagem ${i + 1}`} className="w-full rounded-xl object-cover aspect-[4/3] bg-gray-50" loading="lazy" />
                  {att.label || att.note ? (
                    <figcaption className="text-[10px] text-gray-400 mt-1">{[att.label, att.note].filter(Boolean).join(' — ')}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </Section>
        ) : null}

        <footer className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-4">
          {qr ? <img src={qr} alt="QR code" className="w-[72px] h-[72px] flex-shrink-0" /> : null}
          <div className="min-w-0">
            {qrCaption ? <p className="text-[12px] font-black text-[#8B4AFF]">{qrCaption}</p> : null}
            <p className="text-[10px] leading-snug text-gray-400 mt-0.5">{REPORT_DISCLAIMER}</p>
            <p className="text-[10px] text-gray-300 mt-1">Gerado por iGentVet IA — {PLATFORM.name}</p>
          </div>
        </footer>
      </div>
    </article>
  );
}
