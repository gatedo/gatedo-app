import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Heart, Zap, Shield, MapPin,
  Clock, Weight, Info, Star, Scissors
} from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { getBreedById } from '../services/breedContentStore';

const fallbackBreed = {
  name: 'Gato Incrivel',
  tagline: 'Um companheiro especial',
  desc: 'Esta raca ainda esta em revisao editorial na Gatedopedia.',
  img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
  stats: { energy: 50, affection: 50, shedding: 50, intelligence: 50 },
  specs: { origin: 'A revisar', life: '12-16 anos', weight: 'Variavel' },
  tags: ['Gatedopedia'],
};

export default function WikiBreedDetail() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { id } = useParams();
  const data = useMemo(() => getBreedById(id) || fallbackBreed, [id]);

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 font-sans relative">
      <div className="relative h-80">
        <img src={data.img} alt={data.name} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--gatedo-light-bg)] via-transparent to-black/30" />

        <button
          onClick={() => { touch(); navigate(-1); }}
          className="absolute top-6 left-5 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-20"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="absolute bottom-0 left-0 w-full px-5 pb-8 pt-20 bg-gradient-to-t from-[var(--gatedo-light-bg)] to-transparent">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span className="bg-[#ebfc66] text-[#8B4AFF] text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
              Raca Oficial
            </span>
            <h1 className="text-4xl font-black text-gray-800 leading-none mb-1">{data.name}</h1>
            <p className="text-sm font-medium text-gray-500 italic">{data.tagline}</p>
          </motion.div>
        </div>
      </div>

      <div className="px-5 space-y-6 -mt-2 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <SpecCard icon={MapPin} label="Origem" value={data.specs.origin} color="text-blue-500" bg="bg-blue-50" />
          <SpecCard icon={Clock} label="Vida" value={data.specs.life} color="text-green-500" bg="bg-green-50" />
          <SpecCard icon={Weight} label="Peso" value={data.specs.weight} color="text-orange-500" bg="bg-orange-50" />
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg mb-3 flex items-center gap-2">
            <Info size={20} className="text-[#8B4AFF]" /> Sobre
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {data.desc}
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            {data.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Star size={20} className="text-[#ebfc66] fill-[#ebfc66]" /> Personalidade
          </h3>

          <div className="space-y-4">
            <StatBar label="Nivel de Energia" icon={Zap} value={data.stats.energy} color="bg-yellow-400" />
            <StatBar label="Apego ao Tutor" icon={Heart} value={data.stats.affection} color="bg-pink-400" />
            <StatBar label="Inteligencia" icon={Shield} value={data.stats.intelligence} color="bg-blue-400" />
            <StatBar label="Queda de Pelo" icon={Scissors} value={data.stats.shedding} color="bg-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

const SpecCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-[20px] ${bg} border border-transparent`}>
    <Icon size={18} className={`${color} mb-1`} />
    <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
    <span className="text-xs font-black text-gray-700 text-center leading-tight">{value}</span>
  </div>
);

const StatBar = ({ label, icon: Icon, value, color }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
        <Icon size={12} /> {label}
      </span>
      <span className="text-[10px] font-black text-gray-400">{value}%</span>
    </div>
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.2 }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  </div>
);
