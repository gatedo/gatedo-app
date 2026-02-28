import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, UploadCloud, Image as ImageIcon, Trash2, Loader2, CheckCircle } from 'lucide-react';
import api from '../../../services/api';

export default function GalleryUploadModal({ isOpen, onClose, catId, onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Filtra para aceitar apenas imagens e evita duplicatas (se tiver um ID)
    const validFiles = files.filter(file => file.type.startsWith('image/') && !selectedFiles.some(sf => sf.name === file.name));
    setSelectedFiles(prev => [...prev, ...validFiles]);
    e.target.value = null; // Limpa o input para permitir upload do mesmo arquivo
  };

  const handleRemoveFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadMessage('Selecione ao menos uma imagem.');
      return;
    }

    setLoading(true);
    setUploadMessage('A carregar...');
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('gallery', file)); // 'gallery' deve bater com o FileFieldsInterceptor

    try {
      await api.patch(`/pets/${catId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMessage('Upload concluído com sucesso!');
      setSelectedFiles([]);
      if (onUploadSuccess) onUploadSuccess();
      setTimeout(onClose, 1500); // Fecha o modal após 1.5s
    } catch (error) {
      console.error('Erro ao fazer upload da galeria:', error.response?.data);
      setUploadMessage('Erro ao carregar imagens. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-lg rounded-t-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-800 uppercase italic">Adicionar à Galeria</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20}/></button>
        </div>

        <div className="space-y-6">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />

          <button 
            onClick={() => fileInputRef.current.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <UploadCloud size={32} />
            <span className="mt-2 text-sm font-semibold">Arraste e solte ou clique para selecionar</span>
          </button>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-gray-700">Imagens selecionadas ({selectedFiles.length})</h3>
              <div className="grid grid-cols-3 gap-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleRemoveFile(file.name)}
                      className="absolute top-1 right-1 p-1 bg-white/80 text-rose-500 rounded-full shadow-sm hover:bg-white transition-colors"
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
              className={`text-center text-sm font-semibold ${uploadMessage.includes('sucesso') ? 'text-green-600' : 'text-rose-600'}`}
            >
              {uploadMessage}
            </motion.p>
          )}

          <button 
            onClick={handleUpload}
            disabled={loading || selectedFiles.length === 0}
            className="w-full bg-[#6158ca] text-white h-16 rounded-[28px] font-black text-lg shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20}/>} 
            {loading ? 'A carregar...' : 'Fazer Upload'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}