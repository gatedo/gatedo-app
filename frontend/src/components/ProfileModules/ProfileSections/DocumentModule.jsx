import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import ViewDocModal from './ViewDocModal';

import {
  Award,
  Upload,
  Maximize2,
  Minimize2,
  ZoomIn,
  Book,
  ChevronRight,
  Stethoscope,
  Activity,
  ReceiptText,
  FolderOpen,
  FileText,
  Star,
  Shield,
  Trash2,
  Share2,
  Download,
  Folder,
  Sparkles,
  ExternalLink,
  Lock,
  FileBadge,
  Plus,
  FileImage,
  ScanText,
  HeartPulse,
  BrainCircuit,
} from 'lucide-react';

const FOLDER_META = {
  LAUDOS_MEDICOS: { slug: 'laudos_medicos', label: 'Laudos Médicos', color: 'from-emerald-500 to-green-500', icon: HeartPulse },
  LAUDOS_IA:      { slug: 'laudos_ia',      label: 'Laudos IA',      color: 'from-blue-500 to-cyan-500',    icon: BrainCircuit },
  RECEITA:        { slug: 'receita',        label: 'Receitas',       color: 'from-orange-500 to-amber-500',  icon: ReceiptText },
  EXAME:          { slug: 'exame',          label: 'Exames',         color: 'from-pink-500 to-rose-500',     icon: Activity },
  PEDIGREE:       { slug: 'pedigree',       label: 'Pedigree',       color: 'from-amber-500 to-orange-500',  icon: Award },
  VACINACAO:      { slug: 'vacinacao',      label: 'Vacinação',      color: 'from-emerald-500 to-green-500', icon: Shield },
  OUTROS:         { slug: 'outros',         label: 'Outros',         color: 'from-gray-500 to-zinc-500',     icon: FolderOpen },
};

function normalizeFolderKey(category) {
  const normalized = String(category || '').trim().toUpperCase();

  if (['OFICIAL', 'PRONTUARIO', 'PRONTUARIOS', 'LAUDO', 'LAUDOS_MEDICOS'].includes(normalized)) {
    return 'LAUDOS_MEDICOS';
  }

  if (['LAUDOS_IA', 'LAUDO_IA', 'IA', 'IGENT', 'IGENT_LAUDO'].includes(normalized)) {
    return 'LAUDOS_IA';
  }

  if (['EXAME', 'EXAMES'].includes(normalized)) {
    return 'EXAME';
  }

  if (['RECEITA', 'RECEITAS'].includes(normalized)) {
    return 'RECEITA';
  }

  return normalized || 'OUTROS';
}

function normalizeCategory(category) {
  return String(category || '').trim().toUpperCase();
}

function getCategoryMeta(category) {
  const normalized = normalizeFolderKey(category);

  if (normalized === 'RECEITA') return { label: 'Receita', tint: 'bg-orange-50 text-orange-600 border-orange-100', iconWrap: 'bg-orange-50 text-orange-500', icon: ReceiptText };
  if (normalized === 'EXAME') return { label: 'Exame', tint: 'bg-pink-50 text-pink-600 border-pink-100', iconWrap: 'bg-pink-50 text-pink-500', icon: Activity };
  if (normalized === 'LAUDOS_MEDICOS') return { label: 'Laudo Médico', tint: 'bg-emerald-50 text-emerald-600 border-emerald-100', iconWrap: 'bg-emerald-50 text-emerald-500', icon: HeartPulse };
  if (normalized === 'LAUDOS_IA') return { label: 'Laudo IA', tint: 'bg-sky-50 text-sky-600 border-sky-100', iconWrap: 'bg-sky-50 text-sky-500', icon: BrainCircuit };
  if (normalized === 'PEDIGREE') return { label: 'Pedigree', tint: 'bg-amber-50 text-amber-700 border-amber-100', iconWrap: 'bg-amber-50 text-amber-600', icon: Award };
  if (normalized === 'VACINACAO') return { label: 'Vacinação', tint: 'bg-emerald-50 text-emerald-600 border-emerald-100', iconWrap: 'bg-emerald-50 text-emerald-500', icon: Shield };
  return { label: 'Outro', tint: 'bg-gray-100 text-gray-600 border-gray-200', iconWrap: 'bg-gray-100 text-gray-500', icon: FolderOpen };
}

function getDocKind(doc) {
  const mime = String(doc?.mimeType || doc?.type || '').toLowerCase();
  const name = String(doc?.fileName || doc?.title || '').toLowerCase();

  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (
    mime.includes('image') ||
    ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some((ext) => name.endsWith(ext))
  ) return 'image';
  return 'file';
}

function getSmartDocVisual(doc) {
  const kind = getDocKind(doc);
  const categoryMeta = getCategoryMeta(doc?.category);

  if (kind === 'image') {
    return {
      icon: FileImage,
      wrapClass: 'bg-fuchsia-50 text-fuchsia-600',
      badgeClass: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
      badgeLabel: 'Imagem',
    };
  }

  if (kind === 'pdf') {
    return {
      icon: FileBadge,
      wrapClass: 'bg-red-50 text-red-600',
      badgeClass: 'bg-red-50 text-red-600 border-red-100',
      badgeLabel: 'PDF',
    };
  }

  const fileName = String(doc?.fileName || doc?.title || '').toLowerCase();

  if (/(doc|docx|odt|rtf)$/.test(fileName)) {
    return {
      icon: ScanText,
      wrapClass: 'bg-indigo-50 text-indigo-600',
      badgeClass: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badgeLabel: 'Documento',
    };
  }

  return {
    icon: categoryMeta.icon,
    wrapClass: categoryMeta.iconWrap,
    badgeClass: categoryMeta.tint,
    badgeLabel: categoryMeta.label,
  };
}

function resolveFileUrl(fileUrl) {
  if (!fileUrl) return null;

  const raw = String(fileUrl).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`;
  const base =
    String(api?.defaults?.baseURL || '')
      .replace(/\/api\/?$/, '')
      .replace(/\/$/, '') || window.location.origin;

  return `${base}${normalizedPath}`;
}

function openExternal(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function downloadDocument(doc) {
  const finalUrl = resolveFileUrl(doc?.fileUrl);
  if (!finalUrl) return;

  const a = document.createElement('a');
  a.href = finalUrl;
  a.download = doc?.fileName || doc?.title || 'documento';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function exportDocument(doc) {
  const finalUrl = resolveFileUrl(doc?.fileUrl);
  if (!finalUrl) return false;

  try {
    if (navigator.share) {
      await navigator.share({
        title: doc.title || doc.fileName || 'Documento',
        text: 'Documento exportado do GATEDO',
        url: finalUrl,
      });
      return true;
    }
  } catch {
    return false;
  }

  const a = document.createElement('a');
  a.href = finalUrl;
  a.download = doc.fileName || doc.title || 'documento';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatBytes(bytes) {
  if (!bytes || Number(bytes) <= 0) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = Number(bytes);
  while (val >= 1024 && i < sizes.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function canPreviewDocument(doc) {
  const kind = getDocKind(doc);
  return kind === 'image' || kind === 'pdf';
}

function PedigreeViewer({
  frontUrl,
  backUrl,
  onUploadFront,
  onUploadBack,
  touch,
}) {
  const pages = [
    { label: 'Frente', url: frontUrl, onUpload: onUploadFront },
    { label: 'Verso', url: backUrl, onUpload: onUploadBack },
  ];

  const [page, setPage] = useState(0);
  const [previewDoc, setPreviewDoc] = useState(null);
  const current = pages[page];

  return (
    <>
      <div className="relative rounded-[30px] overflow-hidden bg-white border border-gray-100 shadow-sm">
        {current.url ? (
          <>
            <img
              src={current.url}
              alt={`Pedigree ${current.label}`}
              className="w-full aspect-[1.18/1] object-cover bg-gray-50"
            />

            <div className="absolute inset-x-0 top-0 p-3 flex justify-between">
              <span className="px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest">
                {current.label}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPreviewDoc({
                    fileUrl: current.url,
                    title: `Pedigree ${current.label}`,
                    fileName: `pedigree-${current.label}`.toLowerCase(),
                    category: 'PEDIGREE',
                  })
                }
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center active:scale-95 transition-all"
              >
                <ZoomIn size={18} className="text-gray-700" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                touch?.();
                current.onUpload?.();
              }}
              className="absolute bottom-3 left-3 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-full z-10 active:scale-95 transition-all"
            >
              <span className="text-[9px] font-black text-white uppercase tracking-widest">
                Trocar
              </span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              touch?.();
              current.onUpload?.();
            }}
            className="w-full border-2 border-dashed border-[#8B4AFF]/25 bg-[#8B4AFF]/5 flex flex-col items-center justify-center gap-3 active:bg-[#8B4AFF]/10 transition-all"
            style={{ paddingTop: '14%', paddingBottom: '14%' }}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#8B4AFF]/10 flex items-center justify-center">
              <Upload size={26} className="text-[#8B4AFF]/60" />
            </div>

            <div className="text-center">
              <p className="text-sm font-black text-[#8B4AFF]/60 uppercase tracking-widest">
                Enviar {current.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Aceita imagem ou PDF</p>
            </div>
          </button>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        {pages.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              touch?.();
              setPage(i);
            }}
            className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
              i === page
                ? 'bg-[#8B4AFF] text-white shadow-md'
                : 'bg-white text-gray-400 border border-gray-100'
            }`}
          >
            {p.label}
            {p.url ? (
              <span className={`text-[8px] ${i === page ? 'text-white/70' : 'text-green-400'}`}>✓</span>
            ) : (
              <span className="text-[8px] opacity-40">—</span>
            )}
          </button>
        ))}
      </div>

      <ViewDocModal
        isOpen={!!previewDoc}
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={downloadDocument}
        onOpenExternal={(doc) => openExternal(doc?.fileUrl)}
      />
    </>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="px-3 py-2 rounded-2xl bg-white/75 backdrop-blur border border-white/60 shadow-sm">
      <p className="text-[8px] font-black text-white/70 uppercase tracking-[0.18em]">{label}</p>
      <p className="text-sm font-black text-white leading-none mt-1">{value}</p>
    </div>
  );
}

function FolderCard({ item, onClick, onAdd }) {
  const meta = FOLDER_META[item.id] || FOLDER_META.OUTROS;
  const Icon = meta.icon;

  return (
    <div className="relative bg-white p-5 rounded-[28px] border border-gray-50 shadow-sm group transition-all">
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-white mb-4 shadow-lg bg-gradient-to-br ${meta.color} group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>

        <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">
          {item.label || meta.label}
        </p>

        <span className="text-[8px] font-bold text-gray-300 uppercase mt-1 tracking-widest block">
          {item.count || 0} documento{(item.count || 0) !== 1 ? 's' : ''}
        </span>

        {!!item.lastCreatedAt && (
          <span className="text-[8px] text-gray-400 font-bold mt-2 block">
            Último: {formatDate(item.lastCreatedAt)}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={onAdd}
        className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br ${meta.color} text-white shadow-lg flex items-center justify-center active:scale-95 transition-all`}
        title={`Adicionar em ${item.label || meta.label}`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function RecentDocCard({ doc, onToggleFavorite, onToggleVet, onDelete, onExport, onPreview, onDownload }) {
  const visual = getSmartDocVisual(doc);
  const Icon = visual.icon;
  const categoryMeta = getCategoryMeta(doc?.category);

  return (
    <motion.div layout className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 ${visual.wrapClass}`}>
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-black text-gray-800 leading-tight truncate">
                {doc.title || doc.fileName || 'Documento'}
              </p>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${visual.badgeClass}`}>
                  {visual.badgeLabel}
                </span>
                <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${categoryMeta.tint}`}>
                  {categoryMeta.label}
                </span>
                <span className="text-[8px] font-bold text-gray-400">{formatDate(doc.createdAt)}</span>
                {doc.size ? (
                  <>
                    <span className="text-[8px] font-bold text-gray-300">•</span>
                    <span className="text-[8px] font-bold text-gray-400">{formatBytes(doc.size)}</span>
                  </>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleFavorite(doc)}
              className="w-9 h-9 rounded-full bg-[#FFF8DB] flex items-center justify-center flex-shrink-0"
            >
              <Star size={16} className={doc.isFavorite ? 'text-[#FFD600] fill-[#FFD600]' : 'text-[#C7C7C7]'} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {doc.isPrivate ? (
              <span className="text-[8px] font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                <Lock size={9} /> Privado
              </span>
            ) : (
              <span className="text-[8px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                Público
              </span>
            )}

            {doc.isVetShared ? (
              <span className="text-[8px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                <Shield size={9} /> Compartilhado com vet
              </span>
            ) : null}

            {doc.cloudProvider ? (
              <span className="text-[8px] font-black px-2.5 py-1 rounded-full bg-violet-50 text-violet-600">
                Exportado: {doc.cloudProvider}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button type="button" onClick={() => (canPreviewDocument(doc) ? onPreview(doc) : openExternal(resolveFileUrl(doc.fileUrl)))} className="px-3 py-2 rounded-2xl bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
          <ExternalLink size={12} />
          Ver
        </button>

        <button type="button" onClick={() => onToggleVet(doc)} className="px-3 py-2 rounded-2xl bg-[#EEF5FF] text-[#3B82F6] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Shield size={12} />
          Vet
        </button>

        <button type="button" onClick={() => onExport(doc)} className="px-3 py-2 rounded-2xl bg-[#F4F3FF] text-[#8B4AFF] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Share2 size={12} />
          Exportar
        </button>

        <button type="button" onClick={() => onDownload(doc)} className="px-3 py-2 rounded-2xl bg-[#FAFAFA] text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Download size={12} />
          Baixar
        </button>

        <button type="button" onClick={() => onDelete(doc)} className="px-3 py-2 rounded-2xl bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Trash2 size={12} />
          Excluir
        </button>
      </div>
    </motion.div>
  );
}

export default function DocumentModule({ cat, touch, onUploadPedigree, onUploadPedigreeBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);
  const genericInputRef = useRef(null);
  const categoryInputRefs = useRef({});

  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  const pedigreeUrl = cat?.pedigreeFrontUrl || cat?.pedigreeUrl || cat?.pedigree || null;
  const pedigreeBackUrl = cat?.pedigreeBackUrl || null;

  useEffect(() => {
    const shouldScroll = location.hash === '#documents' || location.state?.scrollToDocuments;
    if (shouldScroll) {
      const timer = setTimeout(() => {
        rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.state]);

  const isSRD = !cat?.breed || cat.breed.toUpperCase() === 'SRD';
  const showPedigreeSection = !isSRD;

  const loadData = async () => {
    if (!cat?.id) return;
    try {
      setLoading(true);
      const [docsRes, foldersRes] = await Promise.all([
        api.get(`/documents?petId=${cat.id}`),
        api.get(`/documents/summary/${cat.id}`),
      ]);

      const docsData = Array.isArray(docsRes.data) ? docsRes.data : [];
      const summaryData = foldersRes?.data && typeof foldersRes.data === 'object' ? foldersRes.data : {};

      const mergedSummary = Object.entries(summaryData).reduce((acc, [rawKey, count]) => {
        const normalizedKey = normalizeFolderKey(rawKey);
        acc[normalizedKey] = (acc[normalizedKey] || 0) + Number(count || 0);
        return acc;
      }, {});

      setDocs(docsData);
      setFolders(
        Object.entries(mergedSummary).map(([id, count]) => ({
          id,
          count,
          label: FOLDER_META[id]?.label || id,
          slug: FOLDER_META[id]?.slug || 'outros',
        }))
      );
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
      setDocs([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [cat?.id]);

  const totalDocs = docs.length;
  const favoritesCount = useMemo(() => docs.filter((d) => d.isFavorite).length, [docs]);
  const vetSharedCount = useMemo(() => docs.filter((d) => d.isVetShared).length, [docs]);

  const handleDownload = (doc) => {
    try {
      downloadDocument(doc);
    } catch (err) {
      console.error('Erro ao baixar documento:', err);
      alert('Não foi possível baixar este documento agora.');
    }
  };

  const handleUploadDocument = async (file, forcedCategory = null) => {
    if (!file || !cat?.id) return;
    const guessedCategory = forcedCategory || (file.type?.includes('pdf') ? 'OFICIAL' : file.type?.includes('image') ? 'OUTROS' : 'OUTROS');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('petId', cat.id);
      formData.append('title', file.name);
      formData.append('category', guessedCategory);
      formData.append('isPrivate', 'true');
      formData.append('isVetShared', 'false');
      formData.append('isFavorite', 'false');
      formData.append('metadata', JSON.stringify({ source: 'persistent_upload' }));

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao subir documento:', err);
      alert('Não foi possível enviar o arquivo agora.');
    }
  };

  const handleFavorite = async (doc) => {
    try {
      await api.patch(`/documents/${doc.id}`, { isFavorite: !doc.isFavorite });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVetShare = async (doc) => {
    try {
      await api.patch(`/documents/${doc.id}`, {
        isVetShared: !doc.isVetShared,
        isPrivate: doc.isVetShared ? doc.isPrivate : false,
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (doc) => {
    const ok = window.confirm(`Excluir "${doc.title || doc.fileName || 'documento'}"?`);
    if (!ok) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o documento.');
    }
  };

  const handleExport = async (doc) => {
    touch?.();
    const ok = await exportDocument(doc);
    if (!ok) return;
    try {
      await api.patch(`/documents/${doc.id}`, {
        cloudProvider: navigator.share ? 'FILES' : 'DOWNLOAD',
        cloudExportedAt: new Date().toISOString(),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const resolvedFolders = useMemo(() => {
    if (folders.length) {
      const grouped = folders.reduce((acc, folder) => {
        const normalizedId = normalizeFolderKey(folder.id);
        const current = acc[normalizedId] || {
          id: normalizedId,
          count: 0,
          slug: FOLDER_META[normalizedId]?.slug || 'outros',
          label: FOLDER_META[normalizedId]?.label || normalizedId,
        };

        current.count += Number(folder.count || 0);
        acc[normalizedId] = current;
        return acc;
      }, {});

      return Object.values(grouped);
    }

    return Object.entries(FOLDER_META).map(([id, meta]) => ({
      id,
      slug: meta.slug,
      label: meta.label,
      count: 0,
    }));
  }, [folders]);

  return (
    <div id="documents" ref={rootRef} className="space-y-8 pb-40 px-0 pt-2">
      {showPedigreeSection && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Award size={14} className="text-[#8B4AFF]" />
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
                Pedigree Oficial
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {onUploadPedigree && (
                <button type="button" onClick={() => { touch?.(); onUploadPedigree(); }} className="flex items-center gap-1.5 px-3 py-2 bg-[#8B4AFF]/10 rounded-xl text-[#8B4AFF] text-[10px] font-black uppercase tracking-widest border border-[#8B4AFF]/20 active:scale-95 transition-all">
                  <Upload size={12} />
                  {pedigreeUrl ? 'Trocar Frente' : 'Enviar'}
                </button>
              )}

              <button type="button" onClick={() => setIsMinimized((m) => !m)} className="p-2 bg-white rounded-xl shadow-sm text-gray-400">
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!isMinimized && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="px-2">
                {pedigreeUrl ? (
                  <PedigreeViewer
                    frontUrl={resolveFileUrl(pedigreeUrl)}
                    backUrl={resolveFileUrl(pedigreeBackUrl)}
                    onUploadFront={onUploadPedigree}
                    onUploadBack={onUploadPedigreeBack}
                    touch={touch}
                  />
                ) : (
                  <button type="button" onClick={() => { touch?.(); onUploadPedigree?.(); }} className="w-full rounded-[28px] border-2 border-dashed border-[#8B4AFF]/25 bg-[#8B4AFF]/5 flex flex-col items-center justify-center gap-3 active:bg-[#8B4AFF]/10 transition-all" style={{ paddingTop: '14%', paddingBottom: '14%' }}>
                    <div className="w-14 h-14 rounded-2xl bg-[#8B4AFF]/10 flex items-center justify-center">
                      <Upload size={26} className="text-[#8B4AFF]/60" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-[#8B4AFF]/60 uppercase tracking-widest">Enviar Pedigree</p>
                      <p className="text-[10px] text-gray-400 mt-1">Aceita imagem ou PDF</p>
                    </div>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="px-2">
        <button type="button" onClick={() => navigate(`/cat/${cat.id}/diary`)} className="w-full relative overflow-hidden bg-gradient-to-r from-[#8B4AFF] to-[#8c84df] p-6 rounded-[32px] shadow-xl shadow-indigo-100 flex items-center gap-4 active:scale-[0.98] transition-all group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
            <Sparkles size={80} />
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
            <Book size={28} />
          </div>
          <div className="flex-1 text-left z-10">
            <h4 className="text-white font-black uppercase tracking-tight text-sm leading-none">Caderno do Gatedo</h4>
            <p className="text-white/70 font-bold uppercase text-[9px] tracking-widest mt-1">Registros de rotina e humor</p>
          </div>
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">
            <ChevronRight size={18} />
          </div>
        </button>
      </div>

      <div className="px-2">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#191B2A] to-[#2B1F53] p-5 text-white shadow-2xl">
          <div className="absolute right-[-20px] top-[-14px] w-36 h-36 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute left-[-18px] bottom-[-40px] w-36 h-36 rounded-full bg-[#8B4AFF]/20 blur-2xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/55">Biblioteca viva</p>
              <h3 className="text-lg font-black tracking-tight mt-1">Documentos do GATO</h3>
              <p className="text-[11px] text-white/70 mt-2 max-w-[260px] leading-relaxed">
                Centralize exames, receitas, laudos e arquivos oficiais com exportação rápida para Drive ou iCloud.
              </p>
            </div>

            <button type="button" onClick={() => genericInputRef.current?.click()} className="px-4 py-3 rounded-2xl bg-white text-[#2B1F53] text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
              <Plus size={14} />
              Adicionar
            </button>
          </div>

          <div className="relative z-10 mt-5 flex gap-2 flex-wrap">
            <StatPill label="Arquivos" value={totalDocs} />
            <StatPill label="Favoritos" value={favoritesCount} />
            <StatPill label="Vet Share" value={vetSharedCount} />
          </div>

          <div className="relative z-10 mt-4 rounded-[22px] bg-white/8 border border-white/10 backdrop-blur-md px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Share2 size={16} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">Exportar para Drive / iCloud</p>
              <p className="text-[10px] text-white/60 mt-1">No MVP, o GATEDO usa o compartilhamento nativo do aparelho e fallback em download no desktop.</p>
            </div>
          </div>

          <input ref={genericInputRef} type="file" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUploadDocument(f);
            e.target.value = '';
          }} />
        </div>
      </div>

      <div className="space-y-4 px-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Pasta de Arquivos</h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white h-36 rounded-[28px] border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {resolvedFolders.map((folder) => (
              <React.Fragment key={folder.id}>
                <FolderCard
                  item={folder}
                  onClick={() => navigate(`/cat/${cat.id}/folder/${folder.slug}`, { state: { backTo: `/cat/${cat.id}`, scrollToDocuments: true } })}
                  onAdd={() => {
                    touch?.();
                    categoryInputRefs.current[folder.id]?.click();
                  }}
                />
                <input type="file" hidden ref={(el) => { categoryInputRefs.current[folder.id] = el; }} onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadDocument(f, folder.id);
                  e.target.value = '';
                }} />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 px-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Documentos Recentes</h3>
          {!!docs.length && (
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
              {docs.length} item{docs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white h-36 rounded-[24px] border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : docs.length > 0 ? (
          <div className="space-y-3">
            {docs.slice(0, 8).map((doc) => (
              <RecentDocCard
                key={doc.id}
                doc={doc}
                onToggleFavorite={handleFavorite}
                onToggleVet={handleVetShare}
                onDelete={handleDelete}
                onExport={handleExport}
                onPreview={(doc) => setPreviewDoc({ ...doc, fileUrl: resolveFileUrl(doc.fileUrl) })}
                onDownload={handleDownload}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[28px] border border-gray-100 p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-[22px] bg-[#8B4AFF]/8 mx-auto flex items-center justify-center mb-4">
              <Folder size={28} className="text-[#8B4AFF]/55" />
            </div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-tight">Nenhum documento registrado</p>
            <p className="text-[10px] text-gray-300 mt-2 max-w-[220px] mx-auto leading-relaxed">
              Comece enviando um arquivo e monte a biblioteca clínica e afetiva do seu gato.
            </p>
          </div>
        )}
      </div>

      <ViewDocModal
        isOpen={!!previewDoc}
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onDownload={handleDownload}
        onOpenExternal={(doc) => openExternal(doc?.fileUrl)}
      />
    </div>
  );
}
