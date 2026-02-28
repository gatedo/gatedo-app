import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Crown, Heart } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: "Seu Gato Merece o Melhor",
    desc: "Controle vacinas, saúde e o dia a dia do seu felino em um único lugar.",
    img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80",
    icon: Heart
  },
  {
    id: 2,
    title: "Inteligência Veterinária",
    desc: "O iGent Vet tira suas dúvidas sobre comportamento e saúde em segundos.",
    img: "https://images.unsplash.com/photo-1519052537078-e6302a4968ef?auto=format&fit=crop&w=400&q=80",
    icon: Sparkles
  },
  {
    id: 3,
    title: "Torne-se um Fundador",
    desc: "Garanta acesso VITALÍCIO ao selo de Fundador e 1 ano de Premium por apenas R$ 37,00.",
    img: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=400&q=80",
    icon: Crown,
    isOffer: true
  }
];

export default function Welcome() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      setCurrent(curr => curr + 1);
    } else {
      navigate('/register'); // Vai para o cadastro
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col font-sans">
      {/* Imagem do Slide (Metade Superior) */}
      <div className="h-[55%] relative overflow-hidden rounded-b-[40px] shadow-xl bg-gray-100">
        <AnimatePresence mode='wait'>
            <motion.img 
                key={SLIDES[current].id}
                src={SLIDES[current].img}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 w-full h-full object-cover"
            />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#6158ca]/80 to-transparent flex items-end justify-center pb-10">
            {/* Dots */}
            <div className="flex gap-2">
                {SLIDES.map((_, idx) => (
                    <div key={idx} className={`w-2 h-2 rounded-full transition-all ${current === idx ? 'bg-[#ebfc66] w-6' : 'bg-white/50'}`} />
                ))}
            </div>
        </div>
      </div>

      {/* Conteúdo (Metade Inferior) */}
      <div className="flex-1 flex flex-col px-8 pt-8 pb-6">
        <AnimatePresence mode='wait'>
            <motion.div 
                key={SLIDES[current].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 text-center"
            >
                <div className="w-12 h-12 bg-[#ebfc66] text-[#6158ca] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    {React.createElement(SLIDES[current].icon, { size: 24 })}
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-3 leading-tight">
                    {SLIDES[current].title}
                </h2>
                <p className="text-gray-500 font-medium leading-relaxed">
                    {SLIDES[current].desc}
                </p>
                
                {/* Preço destaque no último slide */}
                {SLIDES[current].isOffer && (
                    <div className="mt-4 inline-block bg-[#6158ca] text-white px-4 py-1 rounded-lg font-black text-lg animate-pulse">
                        R$ 37,00 <span className="text-xs font-normal opacity-80">/ano</span>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>

        {/* Botões */}
        <div className="mt-auto space-y-3">
            <button 
                onClick={handleNext}
                className="w-full py-4 bg-[#6158ca] text-white rounded-[20px] font-black text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
            >
                {current === SLIDES.length - 1 ? 'Quero ser Fundador' : 'Próximo'} 
                <ArrowRight size={20} />
            </button>
            
            <button 
                onClick={() => navigate('/login')}
                className="w-full py-3 text-gray-400 font-bold text-sm hover:text-[#6158ca] transition-colors"
            >
                Já tenho uma conta
            </button>
        </div>
      </div>
    </div>
  );
}