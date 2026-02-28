import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FolderOpen } from 'lucide-react';

// Módulos
import BioModule from './ProfileSections/BioModule';
import NutritionModule from './ProfileSections/NutritionModule';
import HealthModule from './ProfileSections/HealthModule';
import ImmunizationModule from './ProfileSections/ImmunizationModule';
import DocumentModule from './ProfileSections/DocumentModule';

// import api from "../../services/api"; 

export default function ProfileContent({ activeTab, cat, touch, refreshCat }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // REFS PARA DISPARAR O CLIQUE
  const galleryInputRef = useRef(null);
  const pedigreeInputRef = useRef(null);

  if (!cat) return null;

  // FUNÇÃO DE UPLOAD DO PEDIGREE
  const handlePedigreeUpload = async (event) => {
    console.log("🔥 2. ARQUIVO SELECIONADO!");
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pedigree', file);

    try {
      touch?.();
      // const response = await api.patch(`/pets/${cat.id}`, formData);
      // refreshCat(response.data);
      alert("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro no upload:", error);
    }
  };

  // FUNÇÃO DE UPLOAD DA GALERIA
  const handleGalleryUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('gallery', file);
    try {
      touch?.();
      // const response = await api.patch(`/pets/${cat.id}`, formData);
      // refreshCat(response.data);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 pb-24">
      {/* INPUTS ESCONDIDOS (Sempre montados para o REF funcionar) */}
      <input 
        type="file" 
        ref={pedigreeInputRef} 
        className="hidden" 
        onChange={handlePedigreeUpload} 
        accept="image/*"
      />
      <input 
        type="file" 
        ref={galleryInputRef} 
        className="hidden" 
        onChange={handleGalleryUpload} 
        accept="image/*"
      />

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }}
        >
               {activeTab === 'BIO' && (
               <BioModule 
                cat={cat} 
                refreshCat={refreshCat}
    // onUploadClick e onDeletePhoto não são mais necessários aqui
             />
)}

          {activeTab === 'EVOLUCAO' && <NutritionModule cat={cat} touch={touch} />}
          {activeTab === 'SAUDE' && <HealthModule cat={cat} />}
          {activeTab === 'IMUNIZANTES' && <ImmunizationModule cat={cat} />}

          {activeTab === 'DOCUMENTOS' && (
            <DocumentModule 
              cat={cat} 
              touch={touch} 
              onUploadPedigree={() => {
                console.log("🖱️ 1. CLIQUE NO BOTÃO");
                pedigreeInputRef.current.click();
              }} 
              onDeleteDoc={(id) => console.log("Deletar:", id)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}