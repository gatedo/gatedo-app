import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, FileDown, Loader2 } from 'lucide-react';
import LaudoView from './LaudoView';
import { exportReportPdf, getReport } from '../../utils/reportDocument';

export default function LaudoModal({ isOpen, doc, qr, onClose }) {
  const [exporting, setExporting] = useState(false);
  const report = getReport(doc);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen || !report) return null;

  const handlePdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportReportPdf(report, { qrUrl: qr?.url, qrCaption: qr?.caption });
    } catch (err) {
      console.error(err);
      alert('Não foi possível gerar o PDF agora.');
    } finally {
      setExporting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex flex-col bg-black/90" style={{ zIndex: 10001 }} onClick={onClose}>
      <div className="flex items-center justify-between px-4 pt-10 pb-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Fechar" className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border border-white/15">
          <X size={18} className="text-white" />
        </button>
        <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.22em]">Laudo iGentVet</p>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4" onClick={(e) => e.stopPropagation()}>
        <div className="max-w-[720px] mx-auto">
          <LaudoView report={report} qrUrl={qr?.url} qrCaption={qr?.caption} />
        </div>
      </div>

      <div className="px-5 py-4 flex gap-3 flex-shrink-0 max-w-[720px] w-full mx-auto" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={handlePdf} disabled={exporting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] font-black text-[12px] uppercase tracking-widest bg-[#8B4AFF] text-white disabled:opacity-70">
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </button>
      </div>
    </div>,
    document.body
  );
}
