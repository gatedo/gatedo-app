import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle, Lock, ChevronLeft, Star, Award, ShieldCheck } from 'lucide-react';
import useSensory from '../hooks/useSensory';

const BADGES = [
  { id: 1, name: "Gateiro Fundador", desc: "Apoiou o Gatedo desde o início.", icon: CheckCircle, color: "#6158ca", earned: true },
  { id: 2, name: "Tutor Vigilante", desc: "Manteve todas as vacinas em dia por 6 meses.", icon: ShieldCheck, color: "#2ecc71", earned: true },
  { id: 3, name: "Explorador da Wiki", desc: "Leu 10 artigos sobre saúde felina.", icon: Star, color: "#f59e0b", earned: false },
  { id: 4, name: "Artista do Studio", desc: "Criou 5 retratos mágicos no Studio.", icon: Award, color: "#ec4899", earned: false },
];

export default function Achievements() {
  const navigate = useNavigate();
  const touch = useSensory();

  return (
    <div className="min-h-screen bg-[#F8F9FE] px-6 pt-12 pb-32 font-sans">
      {/* Header da Página */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => { touch(); navigate(-1); }} className="p-2 bg-white rounded-2xl shadow-sm text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-gray-800">Minhas Conquistas</h1>
      </div>

      {/* Resumo de Pontuação */}
      <div className="bg-gradient-to-br from-[#6158ca] to-[#8b83ff] rounded-[32px] p-6 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase opacity-60 tracking-widest">Total de Selas</p>
            <p className="text-4xl font-black">02 <span className="text-lg opacity-40">/ {BADGES.length}</span></p>
          </div>
          <Trophy size={48} className="text-[#ebfc66] opacity-80" />
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10 w-24 h-24 bg-white rounded-full blur-3xl" />
      </div>

      {/* Grid de Conquistas */}
      <div className="grid grid-cols-2 gap-4">
        {BADGES.map((badge) => (
          <motion.div 
            key={badge.id}
            whileTap={{ scale: 0.96 }}
            className={`p-5 rounded-[28px] border-2 flex flex-col items-center text-center transition-all ${
              badge.earned ? 'bg-white border-transparent shadow-md' : 'bg-gray-50 border-dashed border-gray-200 opacity-60'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              badge.earned ? 'bg-opacity-10' : 'bg-gray-200'
            }`} style={{ backgroundColor: badge.earned ? `${badge.color}20` : '', color: badge.earned ? badge.color : '#9ca3af' }}>
              {badge.earned ? <badge.icon size={28} /> : <Lock size={24} />}
            </div>
            <h3 className="text-[11px] font-black text-gray-800 uppercase leading-tight mb-1">{badge.name}</h3>
            <p className="text-[9px] font-bold text-gray-400 leading-tight">{badge.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}