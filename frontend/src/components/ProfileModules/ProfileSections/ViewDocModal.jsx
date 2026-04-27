import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, FileText, AlertTriangle } from 'lucide-react';

function getApiOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const frontOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';

  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001`;
    }
  }

  return frontOrigin;
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value) || /^blob:/i.test(value) || /^data:/i.test(value);
}

function isLocalFsPath(value) {
  return /^[a-zA-Z]:\\/.test(value || '');
}

function normalizeFileUrl(raw) {
  if (!raw) return '';

  const value = String(raw).trim();
  if (!value) return '';
  if (isLocalFsPath(value)) return '';
  if (isAbsoluteUrl(value)) return value;

  const apiOrigin = getApiOrigin();

  if (value.startsWith('/uploads/') || value.startsWith('uploads/')) {
    const clean = value.startsWith('/') ? value : `/${value}`;
    return `${apiOrigin}${clean}`;
  }

  if (value.startsWith('/api/') || value.startsWith('api/')) {
    const clean = value.startsWith('/') ? value : `/${value}`;
    return `${apiOrigin}${clean}`;
  }

  if (
    value.startsWith('/documents/') ||
    value.startsWith('documents/') ||
    value.startsWith('/files/') ||
    value.startsWith('files/') ||
    value.startsWith('/storage/') ||
    value.startsWith('storage/')
  ) {
    const clean = value.startsWith('/') ? value : `/${value}`;
    return `${apiOrigin}${clean}`;
  }

  if (value.startsWith('/')) {
    return `${apiOrigin}${value}`;
  }

  return `${apiOrigin}/${value.replace(/^\/+/, '')}`;
}

function getDocumentPreviewUrl(doc) {
  if (!doc) return '';

  const candidates = [
    doc.publicUrl,
    doc.downloadUrl,
    doc.fileUrl,
    doc.url,
    doc.path,
    doc.filePath,
    doc.previewUrl,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = normalizeFileUrl(candidate);
    if (normalized) return normalized;
  }

  return '';
}

function getDocKind(doc, previewUrl) {
  const url = String(previewUrl || '').toLowerCase();
  const mime = String(doc?.mimeType || doc?.type || '').toLowerCase();
  const name = String(doc?.fileName || doc?.title || '').toLowerCase();

  if (mime.includes('pdf') || url.endsWith('.pdf') || name.endsWith('.pdf')) return 'pdf';

  if (
    mime.includes('image') ||
    ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'].some(
      (ext) => url.endsWith(ext) || name.endsWith(ext)
    )
  ) {
    return 'image';
  }

  return 'file';
}

export default function ViewDocModal({
  isOpen,
  doc,
  onClose,
  onDownload,
  onOpenExternal,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  const fileName = doc?.title || doc?.fileName || 'Documento';
  const previewUrl = useMemo(() => getDocumentPreviewUrl(doc), [doc]);
  const kind = useMemo(() => getDocKind(doc, previewUrl), [doc, previewUrl]);

  if (!isOpen || !doc) return null;

  const handleOpenExternal = () => {
    if (onOpenExternal) return onOpenExternal({ ...doc, resolvedUrl: previewUrl });
    if (!previewUrl) return;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = () => {
    if (onDownload) return onDownload({ ...doc, resolvedUrl: previewUrl });
    if (!previewUrl) return;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex flex-col"
        style={{
          zIndex: 10001,
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={onClose}
      >
        <div
          className="flex items-center justify-between px-4 pt-12 pb-4 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <X size={18} className="text-white" />
          </button>

          <div className="text-center min-w-0 px-3">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.22em]">
              Preview do documento
            </p>
            <p className="text-white text-sm font-black truncate mt-1 max-w-[48vw] sm:max-w-[60vw]">
              {fileName}
            </p>
          </div>

          <div className="w-10" />
        </div>

        <div
          className="relative flex-1 flex items-center justify-center px-3 sm:px-5"
          onClick={(e) => e.stopPropagation()}
        >
          {!previewUrl ? (
            <div
              className="flex flex-col items-center justify-center text-center px-6 shadow-2xl"
              style={{
                width: 'min(720px, calc(100vw - 24px))',
                minHeight: '50vh',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div className="w-20 h-20 rounded-[24px] bg-white/10 flex items-center justify-center mb-4">
                <AlertTriangle size={34} className="text-yellow-300" />
              </div>
              <p className="text-white text-lg font-black">Documento sem URL válida</p>
              <p className="text-white/55 text-sm max-w-md mt-2">
                O arquivo foi encontrado, mas não recebemos uma URL pública válida para exibição.
                Verifique o retorno do upload ou a rota pública do documento.
              </p>
            </div>
          ) : kind === 'image' ? (
            <motion.img
              key={previewUrl}
              src={previewUrl}
              alt={fileName}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.22 }}
              className="object-contain shadow-2xl"
              style={{
                maxWidth: 'calc(100vw - 24px)',
                maxHeight: '70vh',
                borderRadius: '20px',
              }}
            />
          ) : kind === 'pdf' ? (
            <div
              className="overflow-hidden bg-white shadow-2xl"
              style={{
                width: 'min(1100px, calc(100vw - 24px))',
                height: '70vh',
                borderRadius: '20px',
              }}
            >
              <iframe
                src={`${previewUrl}${previewUrl.includes('#') ? '' : '#toolbar=0&navpanes=0&scrollbar=1'}`}
                title={fileName}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center text-center px-6 shadow-2xl"
              style={{
                width: 'min(720px, calc(100vw - 24px))',
                minHeight: '50vh',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div className="w-20 h-20 rounded-[24px] bg-white/10 flex items-center justify-center mb-4">
                <FileText size={34} className="text-white/70" />
              </div>
              <p className="text-white text-lg font-black">Preview indisponível</p>
              <p className="text-white/55 text-sm max-w-md mt-2">
                Esse formato não tem visualização interna. Você pode abrir em nova aba ou baixar o arquivo.
              </p>
            </div>
          )}
        </div>

        <div
          className="px-5 py-5 flex gap-3 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] font-black text-[11px]"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            onClick={handleDownload}
          >
            <Download size={16} />
            Baixar
          </button>

          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] font-black text-[11px]"
            style={{ background: '#8B4AFF', color: 'white' }}
            onClick={handleOpenExternal}
            disabled={!previewUrl}
          >
            <ExternalLink size={16} />
            Abrir
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
