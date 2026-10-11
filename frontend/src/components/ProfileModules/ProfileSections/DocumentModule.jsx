import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import ViewDocModal from './ViewDocModal';
import LaudoModal from '../../report/LaudoModal';
import VetShareModal from '../../vet/VetShareModal';
import useVetShare from '../../../hooks/useVetShare';
import { exportReportPdf, getReport, reportQrTarget } from '../../../utils/reportDocument';
import { toDisplayDate } from '../../../utils/dates';

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
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  DOCUMENT_ACCEPT,
  MAX_DOCUMENT_BYTES,
  compressImageForUpload,
  downloadDocument,
  exportDocumentFile,
} from '../../../utils/documentFiles';

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
  if (doc?.isReport) return 'report';
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

async function exportDocument(doc) {
  return Boolean(await exportDocumentFile(doc, resolveFileUrl));
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
  return kind === 'image' || kind === 'pdf' || kind === 'report';
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

function StatPill({ label, value, color = '#8B4AFF' }) {
  return (
    <div
      className="px-3 py-2 rounded-2xl bg-white/92 border shadow-sm min-w-[74px]"
      style={{ borderColor: `${color}36` }}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.18em]" style={{ color }}>
        {label}
      </p>
      <p className="text-sm font-black text-slate-800 leading-none mt-1">{value}</p>
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

        <p className="text-[12px] font-black text-gray-800 uppercase tracking-tighter">
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

// ─── Organizador da lista de documentos (por período e tipo) ────────────────
const GROUP_MODES = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
];
const PAGE_SIZE = 8;

// Data que importa pro tutor: a da consulta/exame quando o documento traz
// (prontuário, receita), senão a do envio.
function docDate(doc) {
  return toDisplayDate(doc?.metadata?.date) || toDisplayDate(doc?.createdAt) || new Date(0);
}

function startOfWeek(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (x.getDay() + 6) % 7; // segunda-feira
  x.setDate(x.getDate() - diff);
  return x;
}

function groupInfo(date, mode) {
  const now = new Date();
  if (mode === 'year') {
    return { key: String(date.getFullYear()), label: date.getFullYear() === now.getFullYear() ? `Este ano · ${date.getFullYear()}` : String(date.getFullYear()) };
  }
  if (mode === 'month') {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const name = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const isNow = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    return { key, label: isNow ? `Este mês · ${name}` : name.charAt(0).toUpperCase() + name.slice(1) };
  }
  const start = startOfWeek(date);
  const thisWeek = startOfWeek(now);
  const weeks = Math.round((thisWeek - start) / (7 * 86400000));
  const label = weeks === 0 ? 'Esta semana' : weeks === 1 ? 'Semana passada'
    : `Semana de ${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}${start.getFullYear() !== now.getFullYear() ? ` ${start.getFullYear()}` : ''}`;
  return { key: start.toISOString(), label };
}

function DocumentOrganizer({ docs, renderCard }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('gatedo_docs_group') || 'month'; } catch { return 'month'; }
  });
  const [type, setType] = useState('ALL');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    try { localStorage.setItem('gatedo_docs_group', mode); } catch { /* sem storage */ }
  }, [mode]);
  useEffect(() => { setVisible(PAGE_SIZE); }, [mode, type]);

  const types = useMemo(() => {
    const counts = new Map();
    docs.forEach((d) => {
      const key = normalizeFolderKey(d.category);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()].map(([key, count]) => ({ key, count, label: getCategoryMeta(key).label }));
  }, [docs]);

  const filtered = useMemo(() => docs
    .filter((d) => type === 'ALL' || normalizeFolderKey(d.category) === type)
    .sort((a, b) => docDate(b) - docDate(a)), [docs, type]);

  const groups = useMemo(() => {
    const out = [];
    filtered.slice(0, visible).forEach((doc) => {
      const info = groupInfo(docDate(doc), mode);
      const last = out[out.length - 1];
      if (last && last.key === info.key) last.items.push(doc);
      else out.push({ ...info, items: [doc] });
    });
    return out;
  }, [filtered, visible, mode]);

  const totalsByGroup = useMemo(() => {
    const map = new Map();
    filtered.forEach((doc) => {
      const { key } = groupInfo(docDate(doc), mode);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [filtered, mode]);

  return (
    <div>
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white border border-gray-100 shadow-sm mb-2">
        {GROUP_MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${mode === m.key ? 'bg-[#8B4AFF] text-white' : 'text-gray-400'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {types.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1" style={{ scrollbarWidth: 'none' }}>
          {[{ key: 'ALL', label: 'Todos', count: docs.length }, ...types].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black transition-colors ${type === t.key ? 'bg-[#2D2657] text-white' : 'bg-white text-gray-500 border border-gray-100'}`}
            >
              {t.label} <span className="opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.key}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6D28D9]">{g.label}</p>
              <span className="text-[9px] font-black text-gray-300">{totalsByGroup.get(g.key)}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="space-y-3">{g.items.map(renderCard)}</div>
          </section>
        ))}
      </div>

      {filtered.length > visible ? (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-4 w-full py-3 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#8B4AFF] shadow-sm"
        >
          Mostrar mais ({filtered.length - visible})
        </button>
      ) : null}
    </div>
  );
}

function RecentDocCard({ doc, onToggleFavorite, onToggleVet, onDelete, onExport, onPreview, onDownload }) {
  const visual = getSmartDocVisual(doc);
  const Icon = visual.icon;
  const categoryMeta = getCategoryMeta(doc?.category);
  const missing = Boolean(doc.fileMissing);
  const fileBtnState = missing ? ' opacity-40 pointer-events-none' : '';

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
            {missing ? (
              <span className="text-[8px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1">
                <AlertTriangle size={9} /> Arquivo indisponível — envie novamente
              </span>
            ) : null}

            {doc.isVetShared ? (
              <span className="text-[8px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                <Shield size={9} /> Na pasta do vet
              </span>
            ) : (
              <span className="text-[8px] font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                <Lock size={9} /> Só você
              </span>
            )}

            {doc.cloudProvider ? (
              <span className="text-[8px] font-black px-2.5 py-1 rounded-full bg-violet-50 text-violet-600">
                Exportado: {doc.cloudProvider}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button type="button" onClick={() => (canPreviewDocument(doc) ? onPreview(doc) : openExternal(resolveFileUrl(doc.fileUrl)))} disabled={missing} className={`px-3 py-2 rounded-2xl bg-gray-50 text-gray-600${fileBtnState} text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5`}>
          <ExternalLink size={12} />
          Ver
        </button>

        <button type="button" onClick={() => onToggleVet(doc)} className="px-3 py-2 rounded-2xl bg-[#EEF5FF] text-[#3B82F6] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Shield size={12} />
          Vet
        </button>

        <button type="button" onClick={() => onExport(doc)} disabled={missing} className={`px-3 py-2 rounded-2xl bg-[#F4F3FF] text-[#8B4AFF]${fileBtnState} text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5`}>
          <Share2 size={12} />
          Exportar
        </button>

        <button type="button" onClick={() => onDownload(doc)} disabled={missing} className={`px-3 py-2 rounded-2xl bg-[#FAFAFA] text-gray-600${fileBtnState} text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5`}>
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
  const [reportDoc, setReportDoc] = useState(null);
  const [vetModalOpen, setVetModalOpen] = useState(false);
  const vetShare = useVetShare(cat?.id);
  const [uploading, setUploading] = useState(false);

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

  // Laudo IA não tem arquivo: o PDF é montado na hora a partir dos dados.
  const exportReport = async (doc, preferShare) => {
    try {
      await exportReportPdf(getReport(doc), reportQrTarget(doc, vetShare.link), { preferShare });
      return true;
    } catch (err) {
      console.error('Erro ao gerar PDF do laudo:', err);
      alert('Não foi possível gerar o PDF agora.');
      return false;
    }
  };

  const handlePreview = (doc) => {
    if (doc.isReport) return setReportDoc(doc);
    setPreviewDoc({ ...doc, fileUrl: resolveFileUrl(doc.fileUrl) });
  };

  const handleDownload = (doc) => {
    if (doc?.isReport) return exportReport(doc, false);
    try {
      downloadDocument(doc, resolveFileUrl);
    } catch (err) {
      console.error('Erro ao baixar documento:', err);
      alert('Não foi possível baixar este documento agora.');
    }
  };

  const handleUploadDocument = async (file, forcedCategory = null) => {
    if (!file || !cat?.id || uploading) return;
    if (file.size > MAX_DOCUMENT_BYTES) {
      alert('Arquivo muito grande. O limite é 25 MB.');
      return;
    }
    const guessedCategory = forcedCategory || (file.type?.includes('pdf') ? 'OFICIAL' : file.type?.includes('image') ? 'OUTROS' : 'OUTROS');
    try {
      setUploading(true);
      const toSend = await compressImageForUpload(file);
      const formData = new FormData();
      formData.append('file', toSend);
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
      alert(err?.response?.data?.message || 'Não foi possível enviar o arquivo agora.');
    } finally {
      setUploading(false);
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
      await api.patch(`/documents/${doc.id}`, { isVetShared: !doc.isVetShared });
      await Promise.all([loadData(), vetShare.reload()]);
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
    const ok = doc.isReport ? await exportReport(doc, true) : await exportDocument(doc);
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
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#332267] via-[#2B1F53] to-[#21183F] p-5 text-white shadow-[0_18px_42px_rgba(46,31,83,0.18)] border border-white/10">
          <div className="absolute right-[-42px] top-[-44px] w-44 h-44 rounded-full bg-[#8B4AFF]/16 blur-3xl" />
          <div className="absolute left-[-34px] bottom-[-48px] w-44 h-44 rounded-full bg-[#DFFF40]/8 blur-3xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#DFFF40]/80">Biblioteca viva</p>
              <h3 className="text-lg font-black tracking-tight mt-1">Documentos do GATO</h3>
              <p className="text-[12px] text-white/68 mt-2 max-w-[260px] leading-relaxed">
                Centralize exames, receitas, laudos e arquivos oficiais com exportação rápida para Drive ou iCloud.
              </p>
            </div>

            <button type="button" onClick={() => genericInputRef.current?.click()} disabled={uploading} className="disabled:opacity-70 px-4 py-3 rounded-2xl bg-white text-[#2B1F53] text-[10px] font-black uppercase tracking-widest shadow-[0_12px_24px_rgba(0,0,0,0.12)] flex items-center gap-2 active:scale-[0.98] transition-transform">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {uploading ? 'Enviando...' : 'Adicionar'}
            </button>
          </div>

          <div className="relative z-10 mt-5 flex gap-2 flex-wrap">
            <StatPill label="Arquivos" value={totalDocs} color="#8B4AFF" />
            <StatPill label="Favoritos" value={favoritesCount} color="#F59E0B" />
            <StatPill label="Pasta do Vet" value={vetSharedCount} color="#16A34A" />
          </div>

          <button type="button" onClick={() => setVetModalOpen(true)} className="relative z-10 mt-4 w-full text-left rounded-[22px] bg-white/10 border border-white/14 backdrop-blur-sm px-4 py-3 flex items-center gap-3 active:scale-[0.99] transition-transform">
            <div className="w-10 h-10 rounded-2xl bg-white/12 border border-white/12 flex items-center justify-center text-[#DFFF40]">
              <Stethoscope size={16} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/82">Enviar ao veterinário</p>
              <p className="text-[10px] text-white/58 mt-1">
                {vetShare.link
                  ? 'Link da Pasta do Vet ativo · toque para ver o QR'
                  : 'Gere um link/QR com os documentos marcados com Vet'}
              </p>
            </div>
            <ChevronRight size={16} className="text-white/60" />
          </button>

          <input ref={genericInputRef} type="file" accept={DOCUMENT_ACCEPT} hidden onChange={(e) => {
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
                <input type="file" accept={DOCUMENT_ACCEPT} hidden ref={(el) => { categoryInputRefs.current[folder.id] = el; }} onChange={(e) => {
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
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Documentos</h3>
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
          <DocumentOrganizer
            docs={docs}
            renderCard={(doc) => (
              <RecentDocCard
                key={doc.id}
                doc={doc}
                onToggleFavorite={handleFavorite}
                onToggleVet={handleVetShare}
                onDelete={handleDelete}
                onExport={handleExport}
                onPreview={handlePreview}
                onDownload={handleDownload}
              />
            )}
          />
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
      <LaudoModal
        isOpen={!!reportDoc}
        doc={reportDoc}
        qr={reportQrTarget(reportDoc, vetShare.link)}
        onClose={() => setReportDoc(null)}
      />
      <VetShareModal
        isOpen={vetModalOpen}
        onClose={() => setVetModalOpen(false)}
        petName={cat?.name}
        vetShare={vetShare}
      />
    </div>
  );
}
