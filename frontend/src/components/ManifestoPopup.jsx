import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, X } from 'lucide-react';

const ManifestoPopup = ({ name, onClose }) => {
  const [step, setStep] = useState(1); // 1: Manifesto, 2: Benefícios, 3: App
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef(new Audio('/assets/sounds/manifesto.mp3'));

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#6158ca]/95 backdrop-blur-md"
    >
      <motion.div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl relative min-h-[500px] flex flex-col">
        
        {/* Barra de Progresso no Topo */}
        <div className="flex gap-1 p-6 pb-0">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${step >= i ? 'bg-[#6158ca]' : 'bg-gray-100'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="p-8 pt-4 flex-1 flex flex-col">
              {/* Logo Gatedo com destaque total */}
              <div className="w-24 h-24 bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white shrink-0">
                <img src="/assets/logo-gatedo.svg" className="w-14 h-14 object-contain" alt="Gatedo" />
              </div>

              <h2 className="text-2xl font-black text-gray-800 mb-4 italic tracking-tight text-center">Fala, {name}! 🐾</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 text-center font-medium">
                Criei o Gatedo para ser o braço direito de quem ama gatos. Você foi escolhido para testar isso antes de todo mundo.
              </p>

              <button onClick={() => { audioRef.current.play(); setIsPlaying(true); }} className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 mb-auto border border-gray-100">
                <div className="w-10 h-10 bg-[#6158ca] rounded-full flex items-center justify-center text-white">
                  {isPlaying ? <div className="flex gap-1"><div className="w-1 h-3 bg-white animate-bounce" /><div className="w-1 h-4 bg-white animate-bounce delay-75" /></div> : <Play size={18} fill="currentColor" />}
                </div>
                <span className="text-[10px] font-black text-[#6158ca] uppercase tracking-widest text-left">
                  {isPlaying ? 'Ouvindo Manifesto...' : 'Toque para ouvir o propósito'}
                </span>
              </button>

              <button onClick={() => setStep(2)} className="w-full bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0]  text-white h-12 rounded-xl font-black shadow-lg shadow-[#6158ca]/30 flex items-center justify-center gap-2 uppercase text-sm tracking-wide disabled:opacity-70">
                CONTINUAR <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="p-8 flex-1 flex flex-col">
              <h2 className="text-xl font-black text-gray-800 mb-6 italic">O que você ganha como VIP:</h2>
              <div className="space-y-4 mb-auto">
                {[
                  { icon: Star, t: "Selo Vitalício", d: "Exclusivo para os primeiros 50." },
                  { icon: Shield, t: "Suporte Direto", d: "Canal aberto comigo para sugestões." },
                  { icon: Zap, t: "IA Liberada", d: "Acesso total ao iGent Vet." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="bg-white p-2 rounded-xl text-[#6158ca] shadow-sm"><item.icon size={20} /></div>
                    <div>
                      <p className="text-xs font-black text-gray-800">{item.t}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(3)} className="w-full bg-[#6158ca] text-white py-5 rounded-2xl font-black mt-6">PRÓXIMO</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="p-8 flex-1 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2 italic">Tudo pronto!</h2>
              <p className="text-gray-500 text-sm text-center font-medium mb-8">
                Agora é só preencher seus dados e começar a cuidar melhor do seu bichano.
              </p>
              <button onClick={onClose} className="w-full bg-gradient-to-br from-[#9D8FFF] via-[#7865da] to-[#5e42c0] text-white h-12 rounded-xl font-black shadow-lg shadow-[#6158ca]/30 flex items-center justify-center gap-2 uppercase text-sm tracking-wide disabled:opacity-70"
            >COMEÇAR AGORA</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};