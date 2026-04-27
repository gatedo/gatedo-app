import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const MAX_FREE_GALLERY = 9;

export default function GalleryUploadModal({
  isOpen,
  onClose,
  catId,
  existingCount = 0,
  onUploadSuccess,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

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

  const remainingSlots = Math.max(0, MAX_FREE_GALLERY - existingCount);
  const maxSelectableNow = Math.max(0, MAX_FREE_GALLERY - existingCount);

  const previewItems = useMemo(
    () =>
      selectedFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles]
  );

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter(
      (file) =>
        file.type.startsWith('image/') &&
        !selectedFiles.some((sf) => sf.name === file.name)
    );

    const limitedFiles = validFiles.slice(
      0,
      Math.max(0, maxSelectableNow - selectedFiles.length)
    );

    if (existingCount >= MAX_FREE_GALLERY) {
      setUploadMessage('Seu plano atual permite até 9 fotos.');
      e.target.value = null;
      return;
    }

    if (limitedFiles.length < validFiles.length) {
      setUploadMessage(`Limite atual: até ${MAX_FREE_GALLERY} fotos na galeria.`);
    } else {
      setUploadMessage('');
    }

    setSelectedFiles((prev) => [...prev, ...limitedFiles]);
    e.target.value = null;
  };

  const handleRemoveFile = (fileName) => {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadMessage('Selecione ao menos uma imagem.');
      return;
    }

    setLoading(true);
    setUploadMessage('A carregar...');

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('gallery', file);
    });

    try {
      await api.patch(`/pets/${catId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadMessage('Upload concluído com sucesso!');
      setSelectedFiles([]);
      onUploadSuccess?.();

      setTimeout(() => {
        onClose?.();
      }, 800);
    } catch (error) {
      console.error('Erro ao fazer upload da galeria:', error?.response?.data || error);
      setUploadMessage('Erro ao carregar imagens. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          margin: 0,
          padding: 0,
        }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            padding: 0,
            background: '#fff',
            borderTopLeftRadius: '34px',
            borderTopRightRadius: '34px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
            maxHeight: '85dvh',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              background: '#E5E7EB',
              borderRadius: 999,
              margin: '12px auto 16px auto',
            }}
          />

          <div
            style={{
              padding: '0 24px 24px 24px',
              overflowY: 'auto',
              maxHeight: 'calc(85dvh - 20px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: '#1F2937',
                    textTransform: 'uppercase',
                    fontStyle: 'italic',
                    lineHeight: 1,
                    margin: 0,
                  }}
                >
                  Adicionar à Galeria
                </h2>

                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#9CA3AF',
                    marginTop: 8,
                    marginBottom: 0,
                  }}
                >
                  {existingCount}/9 fotos usadas · restam {remainingSlots}
                </p>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  border: 'none',
                  background: '#F3F4F6',
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 24 }}>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={existingCount >= MAX_FREE_GALLERY}
                style={{
                  width: '100%',
                  minHeight: 120,
                  borderRadius: 20,
                  border: existingCount >= MAX_FREE_GALLERY
                    ? '2px dashed #E5E7EB'
                    : '2px dashed #818CF8',
                  background: existingCount >= MAX_FREE_GALLERY ? '#F9FAFB' : '#fff',
                  color: existingCount >= MAX_FREE_GALLERY ? '#D1D5DB' : '#4F46E5',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: existingCount >= MAX_FREE_GALLERY ? 'not-allowed' : 'pointer',
                  padding: 24,
                }}
              >
                <UploadCloud size={34} />
                <span style={{ marginTop: 12, fontSize: 15, fontWeight: 600 }}>
                  {existingCount >= MAX_FREE_GALLERY
                    ? 'Limite atual atingido'
                    : 'Clique para selecionar imagens'}
                </span>
              </button>

              {previewItems.length > 0 && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: '#374151',
                      margin: 0,
                    }}
                  >
                    Imagens selecionadas ({previewItems.length})
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 12,
                    }}
                  >
                    {previewItems.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        style={{
                          position: 'relative',
                          aspectRatio: '1 / 1',
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '1px solid #F3F4F6',
                          background: '#F9FAFB',
                        }}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />

                        <button
                          onClick={() => handleRemoveFile(item.name)}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            border: 'none',
                            background: 'rgba(255,255,255,0.9)',
                            color: '#F43F5E',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    color: uploadMessage.includes('sucesso')
                      ? '#16A34A'
                      : uploadMessage.includes('A carregar')
                        ? '#4F46E5'
                        : '#E11D48',
                    margin: 0,
                  }}
                >
                  {uploadMessage}
                </motion.p>
              )}

              <button
                onClick={handleUpload}
                disabled={loading || selectedFiles.length === 0}
                style={{
                  width: '100%',
                  height: 64,
                  borderRadius: 28,
                  border: 'none',
                  background: '#B495F1',
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: loading || selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: loading || selectedFiles.length === 0 ? 0.5 : 1,
                  boxShadow: '0 10px 24px rgba(180,149,241,0.35)',
                }}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                {loading ? 'A carregar...' : 'Fazer Upload'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modal, document.body);
}