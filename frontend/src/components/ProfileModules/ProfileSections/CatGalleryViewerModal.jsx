import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CatGalleryViewerModal({
  isOpen,
  items = [],
  currentIndex = 0,
  onClose,
  onPrev,
  onNext,
  onDelete,
  canDelete = true,
  showDeleteLoading = false,
  accentColor = '#8B4AFF',
  onShare,
  onOpenSocialProfile,
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

  if (!isOpen) return null;

  const current = items[currentIndex];

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
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <X size={18} className="text-white" />
          </button>

          <span className="text-white/50 text-xs font-black">
            {currentIndex + 1} / {items.length}
          </span>

          {canDelete ? (
            <button
              onClick={() => onDelete?.(current, currentIndex)}
              disabled={showDeleteLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                opacity: showDeleteLoading ? 0.6 : 1,
              }}
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        <div
          className="relative flex-1 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={current?.id || current?.url || currentIndex}
              src={current?.url}
              alt={current?.alt || 'Foto do gato'}
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
          </AnimatePresence>

          {items.length > 1 && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-2 w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <ChevronLeft size={18} className="text-white" />
              </button>

              <button
                onClick={onNext}
                className="absolute right-2 w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <ChevronRight size={18} className="text-white" />
              </button>
            </>
          )}
        </div>

        <div
          className="px-5 py-5 flex gap-3 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] font-black text-[11px]"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            onClick={() => onShare?.(current, currentIndex)}
          >
            Compartilhar
          </button>

          <button
            className="flex-[2] py-3 rounded-[16px] font-black text-[11px] text-white"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
            onClick={onOpenSocialProfile}
          >
            Ver no perfil social
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}