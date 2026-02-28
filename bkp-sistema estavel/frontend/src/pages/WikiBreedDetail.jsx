import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Zap, Shield, MapPin, 
  Clock, Weight, Info, Star, Scissors
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

// DADOS MOCKADOS (Num app real, viria de uma API ou arquivo JSON gigante)
const BREED_DATA = {
  'maine_coon': {
    name: "Maine Coon",
    tagline: "O Gigante Gentil",
    desc: "Conhecidos por seu tamanho impressionante e personalidade doce, os Maine Coons são 'cães no corpo de gatos'. Adoram água, são vocais e muito companheiros.",
    img: "https://images.unsplash.com/photo-1583002626490-67c74c93390d?auto=format&fit=crop&w=800&q=80",
    stats: {
      energy: 80,
      affection: 95,
      shedding: 90, // Queda de pelo
      intelligence: 90
    },
    specs: {
      origin: "EUA",
      life: "12-15 anos",
      weight: "6-11 kg"
    },
    tags: ["Sociável", "Brincalhão", "Vocal"]
  },
  'siamês': {
    name: "Siamês",
    tagline: "O Falante Elegante",
    desc: "Uma das raças mais antigas e reconhecíveis. O Siamês é extremamente inteligente, exige atenção e 'conversa' o dia todo com seu dono.",
    img: "https://images.unsplash.com/photo-1568152950566-c1bf43b4ab51?auto=format&fit=crop&w=800&q=80",
    stats: {
      energy: 95,
      affection: 100,
      shedding: 40,
      intelligence: 100
    },
    specs: {
      origin: "Tailândia",
      life: "15-20 anos",
      weight: "3-5 kg"
    },
    tags: ["Vocal", "Inteligente", "Ciumento"]
  },
  // Fallback genérico para não quebrar se faltar ID
  'default': {
    name: "Gato Incrível",
    tagline: "Um companheiro especial",
    desc: "Esta raça possui características únicas que a tornam uma excelente companhia.",
    img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
    stats: { energy: 50, affection: 50, shedding: 50, intelligence: 50 },
    specs: { origin: "Mundo", life: "12-16 anos", weight: "Variável" },
    tags: ["Amigo", "Fofo"]
  }
};

export default function WikiBreedDetail() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { id } = useParams(); // Pega o ID da URL (ex: /wiki/breeds/maine_coon)

  // Normaliza o ID para buscar no objeto (remove acentos se precisar, etc)
  const breedKey = id?.toLowerCase().replace(/ /g, '_') || 'default';
  const data = BREED_DATA[breedKey] || BREED_DATA['default'];

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-32 font-sans relative">
      
      {/* 1. HERO IMAGE (CAPA) */}
      <div className="relative h-80">
        <img src={data.img} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FE] via-transparent to-black/30" />
        
        {/* Botão Voltar Flutuante */}
        <button 
            onClick={() => { touch(); navigate(-1); }}
            className="absolute top-6 left-5 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-20"
        >
            <ArrowLeft size={20} />
        </button>

        {/* Título na Capa */}
        <div className="absolute bottom-0 left-0 w-full px-5 pb-8 pt-20 bg-gradient-to-t from-[#F8F9FE] to-transparent">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <span className="bg-[#ebfc66] text-[#6158ca] text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">
                    Raça Oficial
                </span>
                <h1 className="text-4xl font-black text-gray-800 leading-none mb-1">{data.name}</h1>
                <p className="text-sm font-medium text-gray-500 italic">{data.tagline}</p>
            </motion.div>
        </div>
      </div>

      <div className="px-5 space-y-6 -mt-2 relative z-10">
        
        {/* 2. FICHA TÉCNICA (GRID) */}
        <div className="grid grid-cols-3 gap-3">
            <SpecCard icon={MapPin} label="Origem" value={data.specs.origin} color="text-blue-500" bg="bg-blue-50" />
            <SpecCard icon={Clock} label="Vida" value={data.specs.life} color="text-green-500" bg="bg-green-50" />
            <SpecCard icon={Weight} label="Peso" value={data.specs.weight} color="text-orange-500" bg="bg-orange-50" />
        </div>

        {/* 3. SOBRE */}
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 text-lg mb-3 flex items-center gap-2">
                <Info size={20} className="text-[#6158ca]" /> Sobre
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {data.desc}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
                {data.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>

        {/* 4. RADAR DE PERSONALIDADE (STATS) */}
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Star size={20} className="text-[#ebfc66] fill-[#ebfc66]" /> Personalidade
            </h3>
            
            <div className="space-y-4">
                <StatBar label="Nível de Energia" icon={Zap} value={data.stats.energy} color="bg-yellow-400" />
                <StatBar label="Apego ao Dono" icon={Heart} value={data.stats.affection} color="bg-pink-400" />
                <StatBar label="Inteligência" icon={Shield} value={data.stats.intelligence} color="bg-blue-400" />
                <StatBar label="Queda de Pelo" icon={Scissors} value={data.stats.shedding} color="bg-gray-400" />
            </div>
        </div>

      </div>
    </div>
  );
}

// Componentes Pequenos
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