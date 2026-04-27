import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Search,
  Folder,
  Star,
  Shield,
  Trash2,
  Share2,
  Download,
  FileBadge,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Stethoscope,
  Activity,
  Award,
  ReceiptText,
  FolderOpen,
  HeartPulse,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import ViewDocModal from '../components/ProfileModules/ProfileSections/ViewDocModal';


const FOLDER_META = {
  laudos_medicos: { key: 'LAUDOS_MEDICOS', label: 'Laudos Médicos', color: 'from-emerald-500 to-green-500', icon: HeartPulse },
  laudo:          { key: 'LAUDOS_MEDICOS', label: 'Laudos Médicos', color: 'from-emerald-500 to-green-500', icon: HeartPulse },
  oficial:        { key: 'LAUDOS_MEDICOS', label: 'Laudos Médicos', color: 'from-emerald-500 to-green-500', icon: HeartPulse },
  prontuario:     { key: 'LAUDOS_MEDICOS', label: 'Laudos Médicos', color: 'from-emerald-500 to-green-500', icon: HeartPulse },
  laudos_ia:      { key: 'LAUDOS_IA',      label: 'Laudos IA',      color: 'from-sky-500 to-blue-500', icon: Sparkles },
  exame:          { key: 'EXAME',          label: 'Exames',         color: 'from-pink-500 to-rose-500', icon: Activity },
  exames:         { key: 'EXAME',          label: 'Exames',         color: 'from-pink-500 to-rose-500', icon: Activity },
  receita:        { key: 'RECEITA',        label: 'Receitas',       color: 'from-orange-500 to-amber-500', icon: ReceiptText },
  receitas:       { key: 'RECEITA',        label: 'Receitas',       color: 'from-orange-500 to-amber-500', icon: ReceiptText },
  pedigree:       { key: 'PEDIGREE',       label: 'Pedigree',       color: 'from-amber-500 to-orange-500', icon: Award },
  vacinacao:      { key: 'VACINACAO',      label: 'Vacinação',      color: 'from-emerald-500 to-green-500', icon: Shield },
  outros:         { key: 'OUTROS',         label: 'Outros',         color: 'from-gray-500 to-zinc-500', icon: FolderOpen },
};

function normalizeFolderCategory(category) {
  const normalized = String(category || '').trim().toUpperCase();

  if (['OFICIAL', 'PRONTUARIO', 'LAUDO', 'LAUDOS_MEDICOS'].includes(normalized)) return 'LAUDOS_MEDICOS';
  if (['LAUDOS_IA', 'LAUDO_IA', 'IA', 'AI_REPORT'].includes(normalized)) return 'LAUDOS_IA';
  if (['EXAME', 'EXAMES'].includes(normalized)) return 'EXAME';
  if (['RECEITA', 'RECEITAS'].includes(normalized)) return 'RECEITA';
  if (['PEDIGREE'].includes(normalized)) return 'PEDIGREE';
  if (['VACINACAO', 'VACINAÇÃO'].includes(normalized)) return 'VACINACAO';

  return normalized || 'OUTROS';
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

function resolveFileUrl(fileUrl) {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  const base = (api.defaults?.baseURL || '').replace(/\/api\/?$/, '');
  return `${base}${fileUrl}`;
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

function canPreviewDocument(doc) {
  const kind = getDocKind(doc);
  return kind === 'image' || kind === 'pdf';
}

function EmptyState({ label }) {
  return (
    <div className="text-center py-20 opacity-90">
      <div className="w-16 h-16 rounded-[22px] bg-[#8B4AFF]/8 mx-auto flex items-center justify-center mb-4">
        <Folder size={30} className="text-[#8B4AFF]/45" />
      </div>
      <p className="text-sm font-black text-gray-400 uppercase tracking-tight">
        Nenhum documento em {label}
      </p>
      <p className="text-[10px] text-gray-300 mt-2 max-w-[220px] mx-auto leading-relaxed">
        Adicione arquivos nessa categoria para organizar melhor a vida documental do gato.
      </p>
    </div>
  );
}

function DocCard({ doc, onFavorite, onVet, onDelete, onExport, onPreview, onDownload }) {
  const kind = getDocKind(doc);

  return (
    <motion.div layout className="bg-white p-4 rounded-[24px] border border-gray-50 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-[16px] bg-[#F4F3FF] flex items-center justify-center text-[#8B4AFF] flex-shrink-0">
          {kind === 'pdf' ? <FileBadge size={20} /> : kind === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-black text-gray-800 uppercase leading-none truncate">
                {doc.title || doc.fileName || 'Documento'}
              </p>
              <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase italic">
                {formatDate(doc.createdAt)}
                {doc.size ? ` · ${formatBytes(doc.size)}` : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onFavorite(doc)}
              className="w-9 h-9 rounded-full bg-[#FFF8DB] flex items-center justify-center flex-shrink-0"
            >
              <Star size={16} className={doc.isFavorite ? 'text-[#FFD600] fill-[#FFD600]' : 'text-[#C7C7C7]'} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
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

        <button type="button" onClick={() => onVet(doc)} className="px-3 py-2 rounded-2xl bg-[#EEF5FF] text-[#3B82F6] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
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

export default function FolderList() {
  const { id, folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const uploadRef = useRef(null);

  const folderMeta = FOLDER_META[String(folderId || '').toLowerCase()] || {
    key: normalizeFolderCategory(folderId),
    label: folderId || 'Pasta',
    color: 'from-gray-500 to-zinc-500',
    icon: FolderOpen,
  };

  const Icon = folderMeta.icon;

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents', { params: { petId: id, category: normalizeFolderCategory(folderMeta.key) } });
      setDocs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, folderMeta.key]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((doc) =>
      [doc.title, doc.fileName, doc.category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [docs, query]);

  const handleFavorite = async (doc) => {
    try {
      await api.patch(`/documents/${doc.id}`, { isFavorite: !doc.isFavorite });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVet = async (doc) => {
    try {
      await api.patch(`/documents/${doc.id}`, {
        isVetShared: !doc.isVetShared,
        isPrivate: doc.isVetShared ? doc.isPrivate : false,
      });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (doc) => {
    const ok = window.confirm(`Excluir "${doc.title || doc.fileName || 'documento'}"?`);
    if (!ok) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      await load();
    } catch (err) {
      console.error(err);
      alert('Não foi possível excluir o documento.');
    }
  };

  const handleExport = async (doc) => {
    const ok = await exportDocument(doc);
    if (!ok) return;
    try {
      await api.patch(`/documents/${doc.id}`, {
        cloudProvider: navigator.share ? 'FILES' : 'DOWNLOAD',
        cloudExportedAt: new Date().toISOString(),
      });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (doc) => {
    try {
      downloadDocument(doc);
    } catch (err) {
      console.error(err);
      alert('Não foi possível baixar este documento agora.');
    }
  };

  const handleUpload = async (file) => {
    if (!file || !id) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('petId', id);
      formData.append('title', file.name);
      formData.append('category', folderMeta.key);
      formData.append('isPrivate', 'true');
      formData.append('isVetShared', 'false');
      formData.append('isFavorite', 'false');
      formData.append('metadata', JSON.stringify({ source: 'persistent_upload', folderSlug: folderId }));

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await load();
    } catch (err) {
      console.error(err);
      alert('Não foi possível adicionar o arquivo nesta pasta.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] px-6 pt-12 pb-32">
      <div className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br ${folderMeta.color} p-5 text-white shadow-2xl mb-6`}>
        <div className="absolute right-[-20px] top-[-14px] w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute left-[-18px] bottom-[-40px] w-32 h-32 rounded-full bg-black/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`${location.state?.backTo || `/cat/${id}`}#documents`, { state: { scrollToDocuments: true } })}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <ArrowLeft size={18} />
          </button>

          <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${folderMeta.color}`}>
            <Icon size={24} />
          </div>

          <div className="flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/60">Pasta ativa</p>
            <h1 className="text-xl font-black tracking-tight mt-1">{folderMeta.label}</h1>
            <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1">
              {docs.length} arquivo{docs.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button type="button" onClick={() => uploadRef.current?.click()} className="w-11 h-11 rounded-full bg-white text-gray-900 shadow-lg flex items-center justify-center">
            <Plus size={18} />
          </button>
        </div>

        <div className="relative z-10 mt-5 flex items-center gap-3 bg-white/10 rounded-[20px] px-4 py-3 backdrop-blur-sm">
          <Search size={16} className="text-white/70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar em ${folderMeta.label.toLowerCase()}...`}
            className="w-full bg-transparent outline-none text-sm placeholder:text-white/50"
          />
        </div>

        <input ref={uploadRef} type="file" hidden onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
          e.target.value = '';
        }} />
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center font-black text-gray-300 uppercase py-20">Buscando arquivos...</p>
        ) : filtered.length > 0 ? (
          filtered.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onFavorite={handleFavorite}
              onVet={handleVet}
              onDelete={handleDelete}
              onExport={handleExport}
              onPreview={(doc) => setPreviewDoc({ ...doc, fileUrl: resolveFileUrl(doc.fileUrl) })}
              onDownload={handleDownload}
            />
          ))
        ) : (
          <EmptyState label={folderMeta.label} />
        )}
      </div>

      {!loading && docs.length > 0 && (
        <div className="mt-5 rounded-[20px] bg-white border border-gray-100 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F3FF] flex items-center justify-center text-[#8B4AFF]">
              <Sparkles size={16} />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6D28D9]">Exportação MVP</p>
              <p className="text-[12px] text-gray-600 leading-relaxed mt-1">
                Aqui o botão Exportar já usa o compartilhamento nativo do aparelho. No iPhone, o tutor pode salvar em Arquivos / iCloud. No Android, pode mandar para Drive e outros apps.
              </p>
            </div>
          </div>
        </div>
      )}

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
