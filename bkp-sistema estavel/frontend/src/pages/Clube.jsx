import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket, Zap, ShieldCheck, Star, Crown } from 'lucide-react';
import useSensory from '../hooks/useSensory';

export default function Clube() {
  const navigate = useNavigate();
  const touch = useSensory();

  const AdvantageCard = ({ icon: Icon, title, desc }) => (
    <div className="bg-white p-6 rounded-[35px] border border-gray-50 shadow-sm flex gap-4 items-start">
      <div className="bg-[#6158ca]/10 p-4 rounded-2xl text-[#6158ca]">
        <Icon size={24} />
      </div>
      <div>
        <h4 className="font-black text-gray-800 uppercase text-xs tracking-tight">{title}</h4>
        <p className="text-[11px] text-gray-400 font-bold mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-32">
      {/* Header Sensorial */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-[#F8F9FE] z-20">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl text-gray-400 shadow-sm">
          <ArrowLeft size={20}/>
        </button>
        <h1 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex-1">Gatedo Clube</h1>
      </header>

      <div className="p-6 space-y-6">
        {/* Banner de Destaque / Call to Action */}
<motion.div 
  whileTap={{ scale: 0.98 }}
  className="bg-gradient-to-br from-[#6158ca] to-[#4c44a3] p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden"
>
  {/* LOGO DE FUNDO ESTOURADA */}
  <img 
    src="/assets/logo-fundo1.svg" 
    alt="" 
    className="absolute -top-20 -right-[150px] w-[400px] h-[400px] opacity-100 pointer-events-none rotate-12"
  />

  <div className="relative z-10">
    <div className="bg-white/20 w-max px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
      Premium 🐾
    </div>
    <h2 className="text-2xl font-black leading-none uppercase tracking-tighter">
      Transforme o cuidado <br/> em recompensa
    </h2>
    <p className="text-white/70 text-xs mt-4 font-bold max-w-[200px]">
      Assine e garanta descontos exclusivos em rações, vet e farmácia.
    </p>
    <button 
      onClick={() => touch()}
      className="mt-6 bg-white text-[#6158ca] px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all relative z-20"
    >
      Quero ser do Clube
    </button>
  </div>
         
        </motion.div>

        {/* Lista de Vantagens */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[4px]">Vantagens Exclusive</h3>
          </div>
          
          <AdvantageCard 
            icon={Ticket} 
            title="Cupons Reais" 
            desc="Descontos de até 30% nas maiores redes de petshop do Brasil." 
          />
          <AdvantageCard 
            icon={Zap} 
            title="IA Ilimitada" 
            desc="Acesso total ao IGent para tirar dúvidas sobre saúde 24h por dia." 
          />
          <AdvantageCard 
            icon={ShieldCheck} 
            title="Seguro Saúde" 
            desc="Rede de veterinários parceiros com preços diferenciados." 
          />
        </section>

        {/* Prova Social ou Depoimento */}
        <div className="bg-amber-50 p-6 rounded-[35px] border border-amber-100/50 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Star className="text-amber-400" size={20} fill="currentColor"/>
            </div>
            <p className="text-[10px] font-bold text-amber-700 italic">
                "O Clube já me fez economizar mais que o valor da assinatura em apenas um mês!"
            </p>
        </div>
      </div>
    </div>
  );
}