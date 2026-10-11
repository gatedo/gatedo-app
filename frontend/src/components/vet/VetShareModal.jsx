import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Stethoscope, Copy, Check, Share2, RefreshCw, Ban, Loader2, MessageCircle } from 'lucide-react';
import { makeQrDataUrl, vetShareUrl } from '../../utils/reportDocument';

function formatExpiry(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// Gera/mostra o link da Pasta do Vet: QR pra mostrar no consultório, copiar,
// WhatsApp ou compartilhar. O link expira e pode ser revogado a qualquer hora.
export default function VetShareModal({ isOpen, onClose, petName, vetShare }) {
  const { link, sharedCount, loading, create, revoke, reload } = vetShare;
  const [days, setDays] = useState(7);
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(false);
  const url = vetShareUrl(link?.token);

  useEffect(() => { if (isOpen) reload(); }, [isOpen, reload]);

  useEffect(() => {
    let alive = true;
    setQr(null);
    if (url) makeQrDataUrl(url, 320).then((d) => alive && setQr(d)).catch(() => {});
    return () => { alive = false; };
  }, [url]);

  if (!isOpen) return null;

  const message = `Olá! Aqui estão os documentos de ${petName || 'meu gato'} pelo Gatedo: ${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copie o link:', url);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: `Pasta do Vet — ${petName || ''}`, text: message, url });
    } catch { /* cancelado */ }
  };

  const handleCreate = async () => {
    try {
      await create(days);
    } catch (err) {
      alert(err?.response?.data?.message || 'Não foi possível gerar o link agora.');
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm('Revogar o link? Quem tiver o link atual perde o acesso na hora.')) return;
    try {
      await revoke();
    } catch {
      alert('Não foi possível revogar agora.');
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" style={{ zIndex: 10002 }} onClick={onClose}>
      <div className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-8 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[16px] bg-[#EEF5FF] text-[#3B82F6] flex items-center justify-center">
              <Stethoscope size={20} />
            </div>
            <div>
              <p className="text-[15px] font-black text-gray-900 leading-tight">Pasta do Vet</p>
              <p className="text-[12px] text-gray-400">
                {sharedCount} documento{sharedCount === 1 ? '' : 's'} marcado{sharedCount === 1 ? '' : 's'} com “Vet”
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {sharedCount === 0 ? (
          <p className="mt-4 text-[12px] leading-relaxed text-amber-700 bg-amber-50 rounded-2xl px-4 py-3">
            Nenhum documento na pasta ainda. Toque em <b>Vet</b> nos documentos que o veterinário deve ver — só eles aparecem no link.
          </p>
        ) : null}

        {link ? (
          <>
            <div className="mt-5 flex flex-col items-center">
              <div className="w-[200px] h-[200px] rounded-[20px] border border-gray-100 flex items-center justify-center bg-white">
                {qr ? <img src={qr} alt="QR code da Pasta do Vet" className="w-[184px] h-[184px]" /> : <Loader2 className="animate-spin text-gray-300" />}
              </div>
              <p className="mt-2 text-[12px] text-gray-400 text-center">
                Mostre no consultório ou envie o link. Válido até <b className="text-gray-600">{formatExpiry(link.expiresAt)}</b>
                {link.viewCount ? ` · aberto ${link.viewCount}x` : ''}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2.5">
              <p className="flex-1 min-w-0 truncate text-[12px] text-gray-600 font-mono">{url}</p>
              <button type="button" onClick={copy} className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-1.5 shadow-sm">
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="py-3 rounded-2xl bg-[#25D366] text-white text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <MessageCircle size={14} /> WhatsApp
              </a>
              {typeof navigator !== 'undefined' && navigator.share ? (
                <button type="button" onClick={share} className="py-3 rounded-2xl bg-[#8B4AFF] text-white text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <Share2 size={14} /> Compartilhar
                </button>
              ) : (
                <button type="button" onClick={copy} className="py-3 rounded-2xl bg-[#8B4AFF] text-white text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <Copy size={14} /> Copiar link
                </button>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={handleCreate} disabled={loading} className="py-2.5 rounded-2xl bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-60">
                <RefreshCw size={12} /> Novo link
              </button>
              <button type="button" onClick={handleRevoke} disabled={loading} className="py-2.5 rounded-2xl bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-60">
                <Ban size={12} /> Revogar
              </button>
            </div>
            <p className="mt-2 text-[10px] text-gray-300 text-center">Gerar um novo link desativa o anterior.</p>
          </>
        ) : (
          <div className="mt-5">
            <p className="text-[12px] text-gray-500 leading-relaxed">
              O veterinário abre sem precisar de conta e vê o resumo d{petName ? 'e ' + petName : 'o gato'} e só os documentos marcados com Vet. Você pode revogar quando quiser.
            </p>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Validade do link</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[7, 30].map((d) => (
                <button key={d} type="button" onClick={() => setDays(d)} className={`py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest ${days === d ? 'bg-[#2D2657] text-white' : 'bg-gray-50 text-gray-500'}`}>
                  {d} dias
                </button>
              ))}
            </div>
            <button type="button" onClick={handleCreate} disabled={loading} className="mt-4 w-full py-3.5 rounded-2xl bg-[#3B82F6] text-white text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Stethoscope size={16} />}
              Gerar link para o vet
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
