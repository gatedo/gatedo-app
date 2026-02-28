import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Sparkles, Heart, ChevronRight, Flame, Ghost } from 'lucide-react';
import useSensory from '../hooks/useSensory';
import api from '../services/api';

const COMFORT_MESSAGES = [
  "Não chore porque eu parti, sorria porque eu existi ao seu lado.",
  "Agora eu brinco livre nos campos de estrelas.",
  "Meu amor por você é eterno, assim como a luz que agora emito.",
  "Estarei sempre ronronando em seu coração."
];

export default function Memorial() {
  const navigate = useNavigate();
  const touch = useSensory();
  
  const [isIntro, setIsIntro] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [tributes, setTributes] = useState([]); // Gatos JÁ no memorial
  const [candidates, setCandidates] = useState([]); // Gatos ativos (para selecionar)
  const [selectedCat, setSelectedCat] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // BUSCA REAL DOS GATINHOS
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pets');
      const allPets = response.data;

      // Filtra quem já é memorial e quem ainda é candidato
      setTributes(allPets.filter(p => p.isMemorial || p.isArchived));
      setCandidates(allPets.filter(p => !p.isMemorial && !p.isArchived));
    } catch (error) {
      console.error("Erro ao carregar memorial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTribute = async () => {
    if (!selectedCat) return;
    setIsSubmitting(true);
    try {
      // Atualiza o status do gato para memorial no banco
      await api.patch(`/pets/${selectedCat.id}`, { 
        isMemorial: true,
        isArchived: true 
      });
      await fetchData(); // Recarrega as listas
      setShowForm(false);
      setSelectedCat(null);
      if (typeof touch === 'function') touch();
    } catch (error) {
      alert("Erro ao eternizar gatinho.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans selection:bg-yellow-500/30 overflow-hidden relative">
      
      {/* ESTRELAS DE FUNDO */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.2, 1] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {isIntro ? (
          <motion.div key="intro" exit={{ opacity: 0, scale: 1.1 }} className="h-screen flex flex-col items-center justify-center p-8 text-center relative z-10">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
              <Star size={48} className="text-yellow-400 fill-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
            </motion.div>
            <h1 className="text-3xl font-black uppercase tracking-[6px] mb-4">Memorial</h1>
            <p className="text-gray-400 max-w-[280px] leading-relaxed text-sm font-medium italic">"Para aqueles que agora brilham no céu, mas nunca deixaram nossos corações."</p>
            <button onClick={() => setIsIntro(false)} className="mt-12 px-10 py-4 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Entrar no Campo</button>
          </motion.div>
        ) : (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 p-6 pt-12 min-h-screen pb-32">
            
            <div className="flex justify-between items-center mb-10">
              <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl border border-white/10"><ArrowLeft size={20}/></button>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Constelação</span>
                <p className="text-xs text-gray-400 font-bold">{tributes.length} Estrelas Guia</p>
              </div>
            </div>

            {/* LISTA DE ESTRELAS (GATOS ETERNIZADOS) */}
            <div className="grid grid-cols-1 gap-4 mb-12">
              {loading ? (
                <div className="text-center py-20 text-gray-500 font-black uppercase text-[10px] tracking-widest animate-pulse">Invocando Memórias...</div>
              ) : tributes.length > 0 ? (
                tributes.map(cat => (
                  <motion.div key={cat.id} className="bg-white/5 border border-white/10 p-4 rounded-[28px] flex items-center gap-4 relative overflow-hidden group">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden grayscale opacity-60 border border-white/20">
                      <img src={cat.photoUrl || "/placeholder-cat.png"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black uppercase tracking-tighter text-gray-200">{cat.name}</h3>
                      <p className="text-[9px] font-bold text-yellow-500/60 uppercase tracking-widest mt-1">Eternizado em Estrela</p>
                    </div>
                    <Sparkles size={16} className="text-yellow-500/40" />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-[32px]">
                  <p className="text-gray-500 text-xs font-bold px-10">Nenhuma estrela cadastrada ainda.</p>
                </div>
              )}
            </div>

            {/* BOTÃO ADICIONAR NOVA ESTRELA */}
            <button onClick={() => setShowForm(true)} className="w-full py-6 bg-gradient-to-r from-yellow-600/20 to-transparent border border-yellow-500/30 rounded-[32px] flex flex-col items-center gap-2 group active:scale-95 transition-all">
               <div className="p-3 bg-yellow-500 rounded-full text-black shadow-[0_0_20px_rgba(234,179,8,0.4)] group-hover:scale-110 transition-transform">
                 <Flame size={20} fill="currentColor" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[3px] text-yellow-500">Eternizar Gatinho</span>
            </button>

            {/* MODAL DE SELEÇÃO */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#0F172A]/90 backdrop-blur-xl flex items-end justify-center">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white/5 border-t border-white/10 w-full rounded-t-[40px] p-8 max-h-[80vh] overflow-y-auto">
                            <h2 className="text-center text-yellow-500 font-black uppercase tracking-[4px] text-sm mb-8">Quem virou uma estrela?</h2>
                            
                            <div className="space-y-3 mb-8">
                                {candidates.length > 0 ? candidates.map(cat => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => setSelectedCat(cat)}
                                        className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${selectedCat?.id === cat.id ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-white/5 border-white/10 text-white'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                                          <img src={cat.photoUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-black uppercase text-xs tracking-widest">{cat.name}</span>
                                    </button>
                                )) : (
                                    <p className="text-center text-gray-500 text-[10px] font-bold py-4">Todos os seus gatinhos já estão no memorial ou você não possui gatos cadastrados.</p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setShowForm(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px]">Cancelar</button>
                                <button 
                                    onClick={handleCreateTribute}
                                    disabled={!selectedCat || isSubmitting}
                                    className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-30"
                                >
                                    {isSubmitting ? 'Elevando...' : 'Confirmar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}