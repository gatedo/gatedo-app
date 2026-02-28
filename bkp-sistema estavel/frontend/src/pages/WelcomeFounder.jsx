import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Users, Clock } from 'lucide-react';
import api from '../services/api'; // Sua conexão com o backend

export default function WelcomeFounder() {
  const navigate = useNavigate();
  const [spotsLeft, setSpotsLeft] = useState(null); // Começa nulo pra não piscar errado
  const TOTAL_SPOTS = 1000;

  // Simulação de busca de dados reais (Depois conectamos no backend)
  useEffect(() => {
    // AQUI SERIA: api.get('/founders/count').then(...)
    // Vamos simular que já temos 843 fundadores
    setTimeout(() => {
      setSpotsLeft(TOTAL_SPOTS - 843); 
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FE] relative overflow-hidden flex flex-col">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-0 w-full h-2/3 bg-[#6158ca] rounded-b-[60px] z-0" />
      <div className="absolute top-10 right-10 w-64 h-64 bg-[#ebfc66] rounded-full blur-[80px] opacity-20 z-0" />

      {/* Conteúdo */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-12 pb-6">
        
        {/* Header / Logo */}
        <div className="flex justify-center mb-8">
            <img src="/logo-full.png" className="h-12 brightness-0 invert" alt="Gatedo" />
        </div>

        {/* Card Principal */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-[40px] p-8 shadow-2xl flex-1 flex flex-col items-center text-center relative overflow-hidden"
        >
            {/* Faixa de Escassez */}
            {spotsLeft !== null && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-red-50 text-red-500 px-4 py-2 rounded-full border border-red-100 flex items-center gap-2 mb-6 shadow-sm"
                >
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-wide">
                        Restam apenas <span className="text-lg">{spotsLeft}</span> vagas
                    </span>
                </motion.div>
            )}

            <div className="w-24 h-24 bg-gradient-to-tr from-[#ebfc66] to-orange-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-200">
                <Shield size={48} className="text-[#6158ca] fill-current" />
            </div>

            <h1 className="text-3xl font-black text-gray-800 mb-4 leading-tight">
                Torne-se um <br/>
                <span className="text-[#6158ca]">Gateiro Fundador</span>
            </h1>

            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                Você é um dos primeiros a chegar. Garanta seu acesso vitalício e o <b className="text-[#6158ca]">Selo Exclusivo de Fundador</b> antes que as vagas acabem.
            </p>

            {/* Benefícios */}
            <div className="w-full space-y-4 mb-auto">
                <div className="flex items-center gap-4 text-left p-3 bg-gray-50 rounded-2xl">
                    <div className="bg-white p-2 rounded-xl text-[#6158ca] shadow-sm"><Users size={20}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Comunidade</p>
                        <p className="font-bold text-gray-800">Acesso ao Clube Gatedo</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-left p-3 bg-gray-50 rounded-2xl">
                    <div className="bg-white p-2 rounded-xl text-[#6158ca] shadow-sm"><Clock size={20}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Vitalício</p>
                        <p className="font-bold text-gray-800">Sem mensalidades futuras</p>
                    </div>
                </div>
            </div>

            {/* Preço e CTA */}
            <div className="w-full mt-6">
                <div className="flex justify-between items-end mb-4 px-2">
                    <span className="text-gray-400 text-sm font-medium line-through">de R$ 97,00</span>
                    <div className="text-right">
                        <span className="text-xs font-bold text-[#6158ca] bg-[#6158ca]/10 px-2 py-1 rounded-md mb-1 inline-block">Oferta Única</span>
                        <p className="text-3xl font-black text-gray-800">R$ 37<span className="text-lg text-gray-400">,00</span></p>
                    </div>
                </div>

                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/register')} // Manda pro cadastro primeiro!
                    className="w-full bg-[#6158ca] text-white h-16 rounded-2xl font-black text-lg shadow-xl shadow-[#6158ca]/40 flex items-center justify-center gap-2 group"
                >
                    GARANTIR MINHA VAGA
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <p className="text-[10px] text-gray-400 mt-4 font-medium">Pagamento seguro via Kiwify • Satisfação garantida</p>
            </div>

        </motion.div>
      </div>
    </div>
  );
}