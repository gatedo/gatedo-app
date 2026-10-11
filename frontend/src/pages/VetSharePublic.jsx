import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileBadge, FileText, Image as ImageIcon, BrainCircuit, Clock, ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { brandAssets } from '../brand/assets';
import ViewDocModal from '../components/ProfileModules/ProfileSections/ViewDocModal';
import LaudoModal from '../components/report/LaudoModal';
import { PLATFORM, formatPetLine } from '../utils/reportDocument';
import { downloadDocument } from '../utils/documentFiles';

const CATEGORY_LABEL = {
  LAUDOS_MEDICOS: 'Laudo médico',
  OFICIAL: 'Laudo médico',
  PRONTUARIO: 'Laudo médico',
  LAUDOS_IA: 'Laudo IA',
  EXAME: 'Exame',
  RECEITA: 'Receita',
  VACINACAO: 'Vacinação',
  PEDIGREE: 'Pedigree',
  OUTROS: 'Outros',
};

function apiOrigin() {
  return String(api.defaults?.baseURL || '').replace(/\/api\/?$/, '');
}

function resolveFileUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
}

function docKind(doc) {
  if (doc.isReport) return 'report';
  const mime = String(doc.mimeType || '').toLowerCase();
  if (mime.includes('pdf')) return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  return 'file';
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

// Página aberta pelo veterinário (link/QR da Pasta do Vet). Sem login: o token
// do link é a credencial e o backend só devolve os documentos marcados.
export default function VetSharePublic() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [previewDoc, setPreviewDoc] = useState(null);
  const [reportDoc, setReportDoc] = useState(null);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    let alive = true;
    api.get(`/vet-share/public/${encodeURIComponent(token)}`)
      .then(({ data }) => alive && setState({ loading: false, error: null, data }))
      .catch((err) => {
        if (!alive) return;
        const status = err?.response?.status;
        setState({
          loading: false,
          data: null,
          error: status === 410
            ? 'Este link expirou ou foi revogado pelo tutor. Peça um novo link.'
            : status === 404
              ? 'Link inválido. Confira se ele foi copiado inteiro.'
              : 'Não foi possível carregar agora. Tente novamente em instantes.',
        });
      });
    return () => { alive = false; };
  }, [token]);

  const qr = useMemo(() => ({ url: window.location.href, caption: 'Pasta do Vet — Gatedo' }), []);
  const { loading, error, data } = state;
  const pet = data?.pet;

  const openDoc = (doc) => {
    const kind = docKind(doc);
    if (kind === 'report') return setReportDoc(doc);
    if (kind === 'image' || kind === 'pdf') return setPreviewDoc({ ...doc, fileUrl: resolveFileUrl(doc.fileUrl) });
    window.open(resolveFileUrl(doc.fileUrl), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] px-4 pt-8 pb-16" style={{ fontFamily: "'Asap', system-ui, sans-serif" }}>
      <div className="max-w-[720px] mx-auto">
        <header className="flex items-center justify-between">
          <img src={brandAssets.gatedoFull} alt="Gatedo" className="h-8 object-contain" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6] bg-white px-3 py-1.5 rounded-full shadow-sm">
            Pasta do Vet
          </span>
        </header>

        {loading ? (
          <p className="text-center font-black text-gray-300 uppercase py-24">Carregando documentos...</p>
        ) : error ? (
          <div className="mt-10 bg-white rounded-[24px] p-6 text-center shadow-sm">
            <AlertTriangle className="mx-auto text-amber-400" size={32} />
            <p className="mt-3 text-[14px] font-black text-gray-800">{error}</p>
          </div>
        ) : (
          <>
            <section className="mt-6 bg-white rounded-[24px] p-5 shadow-sm flex items-center gap-4">
              {pet?.photoUrl ? (
                <img src={pet.photoUrl} alt={pet.name} className="w-16 h-16 rounded-[20px] object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-[20px] bg-[#F4F3FF] flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[20px] font-black text-[#2D2657] leading-tight">{pet?.name}</p>
                <p className="text-[12px] text-gray-500">{formatPetLine(pet || {})}</p>
                {data.tutorFirstName ? <p className="text-[12px] text-gray-400 mt-0.5">Tutor(a): {data.tutorFirstName}</p> : null}
              </div>
            </section>

            <p className="mt-3 px-1 flex items-center gap-1.5 text-[12px] text-gray-400">
              <Clock size={12} /> Acesso válido até {formatDate(data.expiresAt)} · compartilhado pelo tutor via Gatedo
            </p>

            <h2 className="mt-6 mb-3 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Documentos ({data.documents.length})
            </h2>

            {data.documents.length === 0 ? (
              <div className="bg-white rounded-[24px] p-6 text-center text-[13px] text-gray-400 shadow-sm">
                O tutor ainda não incluiu documentos nesta pasta.
              </div>
            ) : (
              <div className="space-y-3">
                {data.documents.map((doc) => {
                  const kind = docKind(doc);
                  const Icon = kind === 'report' ? BrainCircuit : kind === 'pdf' ? FileBadge : kind === 'image' ? ImageIcon : FileText;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      disabled={doc.fileMissing}
                      onClick={() => openDoc(doc)}
                      className="w-full text-left bg-white rounded-[20px] p-4 shadow-sm flex items-center gap-3 disabled:opacity-50"
                    >
                      <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 ${kind === 'report' ? 'bg-sky-50 text-sky-600' : 'bg-[#F4F3FF] text-[#8B4AFF]'}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-gray-800 truncate">{doc.title}</p>
                        <p className="text-[10px] text-gray-400">
                          {CATEGORY_LABEL[doc.category] || doc.category} · {formatDate(doc.createdAt)}
                          {doc.fileMissing ? ' · arquivo indisponível' : ''}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        <footer className="mt-10 text-center text-[10px] text-gray-400 leading-relaxed">
          <p className="flex items-center justify-center gap-1"><ShieldCheck size={12} /> Link privado e temporário, gerado pelo tutor.</p>
          <p className="mt-1">{PLATFORM.name} · {PLATFORM.site} · {PLATFORM.email}</p>
        </footer>
      </div>

      <ViewDocModal
        isOpen={!!previewDoc}
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={(doc) => downloadDocument(doc, resolveFileUrl)}
      />
      <LaudoModal isOpen={!!reportDoc} doc={reportDoc} qr={qr} onClose={() => setReportDoc(null)} />
    </div>
  );
}
