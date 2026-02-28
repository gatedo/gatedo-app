import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Crown, Heart, User } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: "Seu Gato Merece o Melhor",
    desc: "Controle vacinas, saúde e o dia a dia do seu felino em um único lugar.",
    img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
    icon: Heart,
    color: "#6158ca"
  },
  {
    id: 2,
    title: "Inteligência Veterinária",
    desc: "O iGent Vet tira suas dúvidas sobre comportamento e saúde em segundos.",
    img: "https://images.unsplash.com/photo-1519052537078-e6302a4968ef?auto=format&fit=crop&w=600&q=80",
    icon: Sparkles,
    color: "#ebfc66"
  },
  {
    id: 3,
    title: "Torne-se um Fundador",
    desc: "Garanta acesso VITALÍCIO ao selo de Fundador e bônus exclusivos no lançamento.",
    img: "https://images.unsplash.com/photo-1513245535761-07742dd13ebe?auto=format&fit=crop&w=600&q=80",
    icon: Crown,
    color: "#f59e0b",
    isOffer: true
  },
];

export default function Welcome() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1);
    } else {
      navigate('/register?type=founder');
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden font-sans">
      {/* Botão de Pular/Login Rápido no Topo */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white font-bold text-xs uppercase tracking-widest shadow-lg"
        >
          <User size={14} /> Já tenho conta
        </button>
      </div>

      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {/* Imagem com Gradiente de Leitura */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
            <img 
              src={SLIDES[current].img} 
              alt="Slide" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Conteúdo do Texto */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-[#ebfc66] w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-2">
                {React.createElement(SLIDES[current].icon, { size: 24, className: "text-[#6158ca]" })}
              </div>
              
              <h2 className="text-4xl font-black text-white italic leading-tight tracking-tight">
                {SLIDES[current].title}
              </h2>
              
              <p className="text-gray-200 text-lg font-medium leading-relaxed max-w-[280px]">
                {SLIDES[current].desc}
              </p>

              {SLIDES[current].isOffer && (
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-black text-sm uppercase tracking-tighter"
                >
                  OFERTA LIMITADA <Zap size={14} fill="white" />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Indicadores e Botões */}
          <div className="mt-10 space-y-6">
            <div className="flex gap-2">
              {SLIDES.map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ 
                    width: i === current ? 32 : 8,
                    backgroundColor: i === current ? "#ebfc66" : "rgba(255,255,255,0.3)"
                  }}
                  className="h-2 rounded-full transition-all"
                />
              ))}
            </div>

            <button 
              onClick={handleNext}
              className="w-full py-5 bg-[#6158ca] text-white rounded-[24px] font-black text-xl shadow-2xl shadow-indigo-900/50 flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest"
            >
              {current === SLIDES.length - 1 ? 'Ser um Fundador' : 'Próximo'} 
              <ArrowRight size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}