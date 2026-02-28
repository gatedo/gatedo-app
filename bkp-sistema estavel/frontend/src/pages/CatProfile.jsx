import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSensory from "../hooks/useSensory";
import { AuthContext } from '../context/AuthContext';

// MÓDULOS DE INTERFACE
import ProfileHeader from "../components/ProfileModules/ProfileHeader";
import ProfileCardSection from "../components/ProfileModules/ProfileCardSection";
import ProfileHealthBar from "../components/ProfileModules/ProfileHealthBar";
import ProfileTabs from "../components/ProfileModules/ProfileTabs";
import ProfileContent from "../components/ProfileModules/ProfileContent";
import ProfileFAB from "../components/ProfileModules/ProfileFAB";
import EditProfileModal from '../components/ProfileModules/ProfileSections/EditProfileModal';

import api from "../services/api";

export default function CatProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const touch = useSensory();
  const { user: loggedUser } = useContext(AuthContext); 
  
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('BIO');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [showMemorialContent, setShowMemorialContent] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const fetchCatData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/pets/${id}`);
      setCat(response.data);
    } catch (error) {
      console.error("Erro ao carregar gato:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatData();
  }, [id]);

  if (loading || !cat) return (
    <div className="min-h-screen flex items-center justify-center font-black uppercase text-gray-300">
      Carregando Gatedo...
    </div>
  );

  const isInMemoriam = cat.isArchived || cat.isMemorial;
  const tutorFirstName = cat.owner?.name?.split(' ')[0] || loggedUser?.name?.split(' ')[0] || 'Tutor';

  return (
    <div className={`min-h-screen pb-40 pt-6 px-4 transition-all duration-700 ${isInMemoriam && !showMemorialContent ? 'bg-gray-200 overflow-hidden' : 'bg-[#F8F9FE]'}`}>
      
      {/* OVERLAY IN MEMORIAM */}
      <AnimatePresence>
        {isInMemoriam && !showMemorialContent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="fixed inset-0 z-[2000] bg-gray-200/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 w-full max-w-xs">
              <div className="relative mx-auto">
                <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl bg-white grayscale mx-auto">
                  <img src={cat.photoUrl || "/placeholder-cat.png"} alt={cat.name} className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg">
                   <Heart size={20} className="text-rose-400 fill-rose-400" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-black text-gray-600 uppercase tracking-tighter">
                  {tutorFirstName},
                </h3>
                <p className="text-gray-500 font-medium leading-tight text-sm">
                  Gostaria de relembrar os momentos com <br/>
                  <span className="font-black text-gray-700 text-lg uppercase tracking-widest">{cat.name}</span>?
                </p>
              </div>

              <button 
                onClick={() => {
                  if (typeof touch === 'function') touch(); 
                  setShowMemorialContent(true);
                }}
                className="w-full bg-white text-gray-700 py-5 rounded-[24px] font-black uppercase tracking-[3px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-gray-100"
              >
                Relembrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTEÚDO PRINCIPAL (COM BLUR CONDICIONAL) */}
      <div className={`transition-all duration-1000 ${isInMemoriam && !showMemorialContent ? 'blur-2xl grayscale opacity-20 scale-90 pointer-events-none' : 'blur-0 grayscale-0 opacity-100 scale-100'}`}>
        <ProfileHeader cat={cat} id={id} onEdit={() => setIsEditProfileOpen(true)} />
        <ProfileCardSection cat={cat} isFlipped={isFlipped} setIsFlipped={() => setIsFlipped(!isFlipped)} />
        <ProfileHealthBar cat={cat} />
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} touch={touch} />
        <ProfileContent activeTab={activeTab} cat={cat} touch={touch} navigate={navigate} refreshCat={fetchCatData} />
      </div>

      {/* 🚀 FAB FIXADO: POSICIONADO FORA DA DIV DE BLUR PARA NÃO ROLAR */}
      <ProfileFAB 
        id={id} 
        isFabOpen={isFabOpen} 
        setIsFabOpen={setIsFabOpen} 
        touch={touch} 
        navigate={navigate} 
        refreshCat={fetchCatData}
      />

      {/* MODAL DE EDIÇÃO */}
      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
        cat={cat} 
        onSave={fetchCatData} 
      />
    </div>
  );
}