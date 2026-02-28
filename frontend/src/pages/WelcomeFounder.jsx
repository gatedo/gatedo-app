import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Users, Clock, Star } from 'lucide-react';

export default function WelcomeFounder() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FE] relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#6158ca] rounded-b-[60px] z-0" />
      
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-12 pb-6">
        <div className="flex justify-center mb-8">
            <img src="/logo-full.png" className="h-10 brightness-0 invert" alt="Gatedo" />
        </div>

        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[40px] p-8 shadow-2xl flex-1 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-[#ebfc66] rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Shield size={40} className="text-[#6158ca] fill-current" />
            </div>

            <h1 className="text-2xl font-black text-gray-800 mb-2 leading-tight uppercase italic">
                Bem-vindo, <br/> <span className="text-[#6158ca]">Fundador Gatedo!</span>
            </h1>
            
            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full mb-6 border border-amber-100">
                <Star size={12} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-widest">Acesso Vitalício Ativado</span>
            </div>

            <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                Seu selo exclusivo já está aplicado ao seu perfil. Agora você faz parte da história do Gatedo e terá voz nas próximas funcionalidades.
            </p>

            <div className="w-full space-y-3 mb-10">
                {[ 
                  { icon: Users, label: "Clube Gatedo Liberado" },
                  { icon: Clock, label: "Sem taxas de renovação" } 
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-left p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="bg-white p-2 rounded-xl text-[#6158ca] shadow-sm"><item.icon size={18}/></div>
                    <p className="font-black text-gray-800 text-xs uppercase tracking-tight">{item.label}</p>
                  </div>
                ))}
            </div>

            <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/home')}
                className="w-full bg-[#6158ca] text-white h-16 rounded-2xl font-black text-lg shadow-xl shadow-[#6158ca]/40 flex items-center justify-center gap-2 group uppercase tracking-widest"
            >
                ENTRAR NO APP
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
        </motion.div>
      </div>
    </div>
  );
}