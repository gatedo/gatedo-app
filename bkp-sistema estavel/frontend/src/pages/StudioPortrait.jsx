import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, Download, Share2, Image as ImageIcon } from 'lucide-react';
import useSensory from '../hooks/useSensory';

// Importa os gatos cadastrados
import { catsData } from '../data/cats';

// Estilos de Prompt
const STYLES = [
    { id: 'pixar', label: '3D Disney', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=100&q=80' },
    { id: 'astronaut', label: 'Astronauta', img: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&w=100&q=80' },
    { id: 'royal', label: 'Realeza', img: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=100&q=80' },
    { id: 'cyber', label: 'Cyberpunk', img: 'https://images.unsplash.com/photo-1511044568932-338cba0fb803?auto=format&fit=crop&w=100&q=80' },
    { id: 'ghibli', label: 'Anime', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=100&q=80' },
];

export default function StudioPortrait() {
  const navigate = useNavigate();
  const touch = useSensory();
  
  // States do Fluxo
  const [step, setStep] = useState(1); // 1: Selecionar, 2: Estilo, 3: Resultado
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('pixar');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = () => {
    touch('success');
    setIsGenerating(true);
    setResult(null);

    // Simula API delay
    setTimeout(() => {
        setIsGenerating(false);
        setStep(3); // Vai para resultado
        // Aqui simularia o resultado com a imagem do gato selecionado + filtro
        setResult("https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80"); 
    }, 3000);
  };

  const reset = () => {
    setStep(1);
    setResult(null);
    setSelectedCat(null);
  };

  return (
    <div className="min-h-screen bg-[#13131f] pb-32 pt-6 px-5 font-sans text-white relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white/10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
            <h1 className="text-lg font-black">Retrato Mágico</h1>
            <div className="flex justify-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-[#ebfc66]' : 'bg-white/20'}`} />
                <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-[#ebfc66]' : 'bg-white/20'}`} />
                <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-[#ebfc66]' : 'bg-white/20'}`} />
            </div>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <AnimatePresence mode='wait'>
        
        {/* --- PASSO 1: SELECIONAR GATO --- */}
        {step === 1 && (
            <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
            >
                <h2 className="text-2xl font-black mb-2 text-center">Quem será o modelo?</h2>
                <p className="text-sm text-gray-400 text-center mb-8">Escolha um dos seus gatos ou carregue uma foto.</p>
                
                <div className="grid grid-cols-2 gap-4">
                    {/* Botão Upload Manual */}
                    <button className="aspect-square rounded-[24px] border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-[#ebfc66] hover:bg-white/5 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ImageIcon size={24} className="text-gray-400 group-hover:text-[#ebfc66]" />
                        </div>
                        <span className="text-xs font-bold text-gray-400">Galeria</span>
                    </button>

                    {/* Meus Gatos */}
                    {catsData.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => { setSelectedCat(cat); setStep(2); }}
                            className="aspect-square rounded-[24px] bg-white/5 border border-white/10 relative overflow-hidden group hover:border-[#ebfc66] transition-all"
                        >
                            <img src={cat.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                                <span className="text-sm font-bold text-white">{cat.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        )}

        {/* --- PASSO 2: ESCOLHER ESTILO & GERAR --- */}
        {(step === 2 || isGenerating) && (
             <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
             >
                {/* Preview Central */}
                <div className="w-full aspect-square bg-black/30 rounded-[32px] border border-white/10 flex items-center justify-center relative overflow-hidden mb-6">
                    {isGenerating ? (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-[#ebfc66] border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-xs font-bold text-[#ebfc66] animate-pulse">A IA está sonhando...</p>
                        </div>
                    ) : (
                        <div className="relative w-full h-full">
                            <img src={selectedCat?.image} className="w-full h-full object-cover opacity-60 blur-sm scale-110" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <img src={selectedCat?.image} className="w-48 h-48 object-cover rounded-full border-4 border-white/20 shadow-2xl" />
                            </div>
                            {/* Badge do Estilo */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                <span className="bg-[#6158ca] px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                                    <Wand2 size={12} /> Transformar em: {STYLES.find(s => s.id === selectedStyle)?.label}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Seletor */}
                <h3 className="text-sm font-bold text-gray-300 mb-3 ml-1">Estilos Mágicos:</h3>
                <div className="flex gap-3 overflow-x-auto pb-4 mb-24 scrollbar-hide">
                    {STYLES.map((style) => (
                        <motion.button
                            key={style.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { touch(); setSelectedStyle(style.id); }}
                            disabled={isGenerating}
                            className={`min-w-[80px] flex flex-col items-center gap-2 p-1 rounded-[16px] transition-all ${
                                selectedStyle === style.id ? 'bg-[#ebfc66] shadow-lg scale-105' : 'bg-white/5'
                            }`}
                        >
                            <img src={style.img} className="w-full h-16 object-cover rounded-[12px]" />
                            <span className={`text-[10px] font-bold pb-1 ${selectedStyle === style.id ? 'text-[#13131f]' : 'text-gray-400'}`}>{style.label}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Botão Flutuante */}
                <div className="fixed bottom-10 left-0 right-0 px-5 max-w-[800px] mx-auto">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`w-full py-4 rounded-[24px] font-black text-lg shadow-xl flex items-center justify-center gap-2 transition-all ${
                            isGenerating ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-[#6158ca] text-white hover:scale-105 active:scale-95'
                        }`}
                    >
                        {isGenerating ? 'Criando Mágica...' : 'Gerar Arte ✨'}
                    </button>
                </div>
             </motion.div>
        )}

        {/* --- PASSO 3: RESULTADO --- */}
        {step === 3 && (
             <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full"
             >
                <div className="w-full aspect-[4/5] bg-black rounded-[32px] overflow-hidden relative shadow-2xl shadow-purple-900/40 mb-6 border-4 border-white/10">
                    <img src={result} className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/20">
                        Feito com Gatedo AI
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button className="bg-[#ebfc66] text-[#13131f] py-4 rounded-[20px] font-black flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                        <Download size={20} /> Salvar
                    </button>
                    <button className="bg-white/10 text-white py-4 rounded-[20px] font-black flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                        <Share2 size={20} /> Compartilhar
                    </button>
                </div>

                <button onClick={reset} className="text-gray-400 text-xs font-bold py-4 hover:text-white">
                    Criar Outro
                </button>
             </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}