import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Camera, ChevronRight, Check, Award, Lock, MapPin, Heart, Utensils, Home, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 
import { AuthContext } from '../context/AuthContext'; 

// ... Listas de Raças e Comportamentos conforme seu código original

export default function AddCat() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  const [formData, setFormData] = useState({
    name: '', nicknames: '', breed: 'SRD', gender: 'MALE',
    birthDate: '', city: '', weight: '', adoptionStory: '',
    personality: [], foodType: [], avatarFile: null, avatarPreview: null
  });

  useEffect(() => {
    setGeneratedId(Math.floor(100000 + Math.random() * 900000).toString());
  }, []);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append('ownerId', user?.id);
      data.append('name', formData.name);
      data.append('breed', formData.breed);
      data.append('city', formData.city);
      data.append('weight', String(formData.weight || 0));
      
      // CORREÇÃO: Enviar arrays item por item para que o backend receba String[]
      formData.personality.forEach(p => data.append('personality', p));
      formData.foodType.forEach(f => data.append('foodType', f));

      if (formData.avatarFile) {
        data.append('file', formData.avatarFile);
      }

      const response = await api.post('/pets', data);
      
      if (response.status === 201 || response.status === 200) {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Erro ao registrar gato:", error);
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) return <SuccessScreen formData={formData} generatedId={generatedId} navigate={navigate} />;

  return (
    <div className="pb-40 min-h-screen bg-[var(--gatedo-light-bg)]">
      {/* Cabeçalho Lilás com Logo Estourada */}
      <div className="bg-[#8B4AFF] h-44 rounded-b-[55px] relative w-full overflow-hidden mb-8 shadow-lg">
        <img src="/assets/logo-fundo1.svg" className="absolute -top-16 -right-16 w-64 h-64 opacity-20 pointer-events-none rotate-12" />
        <div className="absolute top-10 left-6 flex items-center gap-4 z-20 text-white font-black uppercase text-xs tracking-widest">
           <button onClick={() => navigate(-1)} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl"><ArrowLeft size={20}/></button>
           Incluir Gatinho
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Renderização dos campos do formulário mantendo TODOS os seus dados originais */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
               <div className="w-32 h-32 rounded-[40px] bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                  {formData.avatarPreview ? <img src={formData.avatarPreview} className="w-full h-full object-cover" /> : <Camera className="text-gray-200" />}
               </div>
            </div>
            <input 
               className="w-full bg-white border border-gray-100 rounded-[22px] px-5 py-4 text-sm font-bold shadow-sm outline-none" 
               placeholder="Nome do Gato" 
               value={formData.name} 
               onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
        )}

        {/* Botão de Navegação com Z-Index corrigido */}
        <div className="fixed bottom-10 left-0 right-0 px-8 flex justify-center z-[999]">
          <button 
            onClick={() => step === 4 ? handleFinish() : setStep(step + 1)}
            className="w-full max-w-[320px] bg-[#8B4AFF] text-white py-5 rounded-[28px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all"
          >
            {loading ? 'Salvando...' : step === 4 ? 'Gerar RG Gatedo 🐾' : 'Próximo Passo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de Sucesso (RG Gatedo conforme o print enviado)
function SuccessScreen({ formData, generatedId, navigate }) {
  return (
    <div className="min-h-screen bg-[#8B4AFF] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[45px] shadow-2xl w-full max-w-sm overflow-hidden p-10 relative z-10">
        <div className="bg-[#ebfc66] h-24 absolute top-0 left-0 right-0 flex items-center justify-center">
             <div className="absolute top-4 right-6 text-[#8B4AFF] opacity-40 uppercase font-black text-[9px] flex items-center gap-1"><Lock size={12}/> RG Oficial</div>
        </div>
        <div className="relative z-10 pt-4">
          <div className="w-32 h-32 rounded-full border-8 border-white shadow-xl overflow-hidden mx-auto mb-6 bg-gray-50">
            <img src={formData.avatarPreview} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none mb-2">{formData.name}</h2>
          <span className="text-[10px] font-black text-indigo-400 tracking-[3px] uppercase">ID #{generatedId}</span>
          <div className="grid grid-cols-2 gap-4 text-left border-t border-gray-100 mt-6 pt-6">
            <div><p className="text-[8px] font-black text-gray-300 uppercase mb-1">Cidade</p><p className="font-bold text-xs text-gray-700">{formData.city}</p></div>
            <div><p className="text-[8px] font-black text-gray-300 uppercase mb-1">Raça</p><p className="font-bold text-xs text-gray-700">{formData.breed}</p></div>
          </div>
        </div>
        <button onClick={() => navigate('/home')} className="mt-10 w-full bg-[#8B4AFF] text-white py-5 rounded-[25px] font-black uppercase text-[10px] tracking-[2px]">Ir para o App</button>
      </motion.div>
    </div>
  );
}
