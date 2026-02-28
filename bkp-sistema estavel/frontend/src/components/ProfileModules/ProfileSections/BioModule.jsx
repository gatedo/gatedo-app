import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Zap, Shield, Target, Smile, Edit3, Plus, Trash2, Info, X, Share2, Send, Check, Loader2 } from 'lucide-react';
import EditBioModal from './EditBioModal';
import GalleryUploadModal from './GalleryUploadModal'; 
import api from '../../../services/api';

// MODAL DE VISUALIZAÇÃO E COMPARTILHAMENTO NO COMUNIGATO
const ImageShareModal = ({ imageUrl, cat, onClose }) => {
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  const handleShareComunigato = async () => {
    setIsPosting(true);
    try {
      // Simulação de integração com o feed do Comunigato
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      setPosted(true);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      alert("Erro ao postar no feed.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white"><X /></button>
      
      <div className="w-full max-w-md">
        <motion.img 
          initial={{ scale: 0.9, y: 20 }} 
          animate={{ scale: 1, y: 0 }}
          src={imageUrl} 
          className="w-full rounded-[40px] shadow-2xl border-4 border-white/10 mb-8" 
        />
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleShareComunigato}
            disabled={isPosting || posted}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[32px] text-white shadow-xl transition-all active:scale-95 ${posted ? 'bg-green-500' : 'bg-[#6158ca]'}`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              {posted ? <Check size={24} /> : <Send size={22} className={isPosting ? 'animate-pulse' : ''} />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-center">
              {posted ? 'Postado!' : isPosting ? 'Postando...' : 'Postar no Feed'}
            </span>
          </button>

          <button 
            onClick={() => navigator.share?.({ title: cat.name, url: imageUrl })}
            className="flex flex-col items-center justify-center gap-3 bg-[#ebfc66] p-6 rounded-[32px] text-[#6158ca] shadow-xl transition-all active:scale-95"
          >
            <div className="w-12 h-12 bg-[#6158ca]/10 rounded-full flex items-center justify-center"><Share2 size={22} /></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Redes Sociais</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function BioModule({ cat, refreshCat }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isGalleryUploadOpen, setIsGalleryUploadOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Estado para o modal de visualização
  const [isDeleting, setIsDeleting] = useState(null);

  const skills = [
    { id: 'skillSocial', label: 'Social', icon: Heart, color: 'text-rose-400', bar: 'bg-rose-400', val: cat?.skillSocial || "80" },
    { id: 'skillDocile', label: 'Dócil', icon: Smile, color: 'text-pink-500', bar: 'bg-pink-500', val: cat?.skillDocile || "95" },
    { id: 'skillCuriosity', label: 'Curioso', icon: Star, color: 'text-amber-400', bar: 'bg-amber-400', val: cat?.skillCuriosity || "90" },
    { id: 'skillIndep', label: 'Indep.', icon: Shield, color: 'text-orange-500', bar: 'bg-orange-500', val: cat?.skillIndep || "60" },
    { id: 'skillEnergy', label: 'Energia', icon: Zap, color: 'text-indigo-400', bar: 'bg-indigo-400', val: cat?.skillEnergy || "75" },
    { id: 'skillAgility', label: 'Agilidade', icon: Target, color: 'text-purple-500', bar: 'bg-purple-500', val: cat?.skillAgility || "85" },
  ];

  const handleDeletePhoto = async (e, photoUrlToDelete) => {
    e.stopPropagation(); // Evita abrir o modal de visualização ao clicar na lixeira
    if (!window.confirm('Tem certeza que deseja remover esta foto da galeria?')) return;

    setIsDeleting(photoUrlToDelete);
    try {
      const currentGallery = cat?.gallery || [];
      const updatedGallery = currentGallery.filter(url => url !== photoUrlToDelete);
      await api.patch(`/pets/${cat.id}`, { gallery: updatedGallery });
      refreshCat();
    } catch (error) {
      console.error('Erro ao deletar foto:', error.response?.data);
      alert('Erro ao remover a foto.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* CARD DE BIO */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">História & Personalidade</h3>
          <button onClick={() => setIsEditOpen(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
            <Edit3 size={18} />
          </button>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed font-medium">{cat?.bio || "Nenhuma história registrada."}</p>
      </section>

      {/* GRID RPG */}
      <section className="grid grid-cols-2 gap-3">
        {skills.map((skill) => (
          <div key={skill.id} className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <skill.icon size={14} className={skill.color} />
              <span className="text-[9px] font-black text-gray-400 uppercase">{skill.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${skill.val}%` }} className={`h-full ${skill.bar}`} />
              </div>
              <span className="text-[10px] font-black text-gray-700">{skill.val}%</span>
            </div>
          </div>
        ))}
      </section>

      {/* GALERIA */}
      <section>
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Galeria de Momentos</h3>
          <button 
            onClick={() => setIsGalleryUploadOpen(true)}
            className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px] uppercase bg-indigo-50 px-3 py-1.5 rounded-full"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {cat?.gallery?.map((photo, index) => (
            <motion.div 
              key={index}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedImage(photo)}
              className="aspect-square rounded-2xl overflow-hidden relative group border border-gray-100 bg-gray-50 cursor-pointer shadow-sm"
            >
              <img src={photo} alt="Momento" className="w-full h-full object-cover" loading="lazy" />
              <button 
                onClick={(e) => handleDeletePhoto(e, photo)}
                disabled={isDeleting === photo}
                className="absolute top-1 right-1 p-1.5 bg-white/90 text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                {isDeleting === photo ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </motion.div>
          ))}
          {(!cat?.gallery || cat.gallery.length === 0) && (
            <div className="col-span-3 py-8 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-gray-300">
              <Info size={24} className="mb-2" />
              <p className="text-[10px] font-black uppercase">Nenhuma foto ainda.</p>
            </div>
          )}
        </div>
      </section>

      {/* MODAIS */}
      <AnimatePresence>
        {selectedImage && <ImageShareModal imageUrl={selectedImage} cat={cat} onClose={() => setSelectedImage(null)} />}
        {isEditOpen && <EditBioModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} cat={cat} onSave={refreshCat} />}
        {isGalleryUploadOpen && <GalleryUploadModal isOpen={isGalleryUploadOpen} onClose={() => setIsGalleryUploadOpen(false)} catId={cat.id} onUploadSuccess={refreshCat} />}
      </AnimatePresence>
    </div>
  );
}