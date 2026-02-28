import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Wand2, Sparkles, Command, 
  Palette, Camera, Heart, Download, Sticker, Type,
  CreditCard, Newspaper, Search, Video, Play
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

// --- DADOS MOCKADOS ---
const ASSET_PACKS = [
  { id: 1, title: 'Pack Zueira', count: '20 Stickers', color: 'bg-[#ebfc66] text-[#6158ca]', icon: Sticker },
  { id: 2, title: 'Filtros VHS', count: '5 Presets', color: 'bg-pink-400 text-white', icon: Camera },
  { id: 3, title: 'Fontes', count: '3 Fontes', color: 'bg-cyan-400 text-white', icon: Type },
];

const GALLERY_ITEMS = [
  { id: 1, type: 'video', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80', title: 'POV: Fofoqueiro', likes: '12k' },
  { id: 2, type: 'image', img: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=400&q=80', title: 'Gato Astronauta', likes: '8.5k' },
  { id: 3, type: 'image', img: 'https://images.unsplash.com/photo-1495360019602-e001922271aa?auto=format&fit=crop&w=400&q=80', title: 'Renaissance', likes: '5k' },
  { id: 4, type: 'video', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=400&q=80', title: 'Dancinha', likes: '22k' },
];

const ToolCard = ({ title, desc, icon: Icon, bg, iconBg, iconColor, onClick, isLarge, badge }) => (
    <motion.button
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className={`${bg} ${isLarge ? 'col-span-2' : 'col-span-1'} p-5 rounded-[28px] relative overflow-hidden shadow-lg border border-white/10 flex flex-col justify-between text-left group transition-all`}
        style={{ minHeight: isLarge ? '180px' : '150px' }}
    >
        <div className="flex justify-between items-start w-full">
            <div className={`w-12 h-12 rounded-[18px] ${iconBg} ${iconColor} flex items-center justify-center mb-3 shadow-inner`}>
                <Icon size={24} />
            </div>
            {badge && (
                <span className="bg-[#ebfc66] text-[#6158ca] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{badge}</span>
            )}
        </div>
        
        <div className="relative z-10">
            <h4 className={`font-black text-lg leading-tight mb-1 ${bg.includes('white') ? 'text-gray-800' : 'text-white'}`}>
                {title}
            </h4>
            <p className={`text-xs font-medium opacity-70 ${bg.includes('white') ? 'text-gray-500' : 'text-gray-300'}`}>
                {desc}
            </p>
        </div>
        
        {/* Decorativo */}
        <Icon size={100} className={`absolute -right-4 -bottom-4 opacity-5 rotate-12 ${bg.includes('white') ? 'text-black' : 'text-white'}`} />
    </motion.button>
);

export default function Studio() {
  const navigate = useNavigate();
  const touch = useSensory();

  return (
    <div className="min-h-screen bg-[#13131f] pb-32 pt-6 px-5 font-sans text-white overflow-x-hidden">
      
      {/* 1. HEADER (Dark Mode) */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white/10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 backdrop-blur-md border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
            <Palette size={16} className="text-[#ebfc66]" />
            <h1 className="text-sm font-black tracking-wide">GATEDO <span className="text-[#ebfc66]">STUDIO</span></h1>
        </div>
        <button className="bg-white/10 w-10 h-10 flex items-center justify-center rounded-full text-[#ebfc66] border border-white/10">
          <Command size={20} />
        </button>
      </div>

      {/* 2. PACKS (Carrossel Horizontal) */}
      <div className="mb-8">
        <h3 className="text-sm font-black text-white/80 mb-3 ml-1 flex items-center gap-2">
            <Download size={16} className="text-[#ebfc66]" /> Downloads
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
            {ASSET_PACKS.map(pack => (
                <motion.button 
                    key={pack.id}
                    whileTap={{ scale: 0.95 }}
                    className="min-w-[140px] bg-white/5 p-3 rounded-[24px] border border-white/10 flex flex-col gap-3 group hover:bg-white/10 transition-colors"
                >
                    <div className={`h-24 rounded-[20px] ${pack.color} flex items-center justify-center relative overflow-hidden`}>
                        <pack.icon size={32} className="relative z-10" />
                        <div className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </div>
                    <div className="text-left px-1">
                        <h5 className="font-bold text-xs text-white">{pack.title}</h5>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-gray-400">{pack.count}</span>
                            <Download size={12} className="text-[#ebfc66]" />
                        </div>
                    </div>
                </motion.button>
            ))}
        </div>
      </div>

      {/* 3. FERRAMENTAS PRINCIPAIS (Bento Grid) */}
      <h3 className="text-sm font-black text-white/80 mb-4 ml-1 flex items-center gap-2">
         <Sparkles size={16} className="text-[#ebfc66]" /> Criar Novo
      </h3>
      
      <div className="grid grid-cols-2 gap-3 mb-8">
        
        {/* Retrato Mágico (Destaque) */}
        <ToolCard 
            title="Retrato IA" 
            desc="Transforme fotos em arte 3D, Pixar e mais." 
            icon={Wand2} 
            bg="bg-gradient-to-br from-[#6158ca] to-[#4a40a5]" 
            iconBg="bg-[#ebfc66]" 
            iconColor="text-[#6158ca]"
            isLarge={true}
            badge="Popular"
            onClick={() => navigate('/studio/portrait')}
        />

        {/* RG Pet */}
        <ToolCard 
            title="RG Pet" 
            desc="Carteirinha oficial." 
            icon={CreditCard} 
            bg="bg-[#1E1E2C]"
            iconBg="bg-cyan-500" 
            iconColor="text-white"
            onClick={() => navigate('/studio/id')}
        />

        {/* Capa de Revista */}
        <ToolCard 
            title="Vogue Cat" 
            desc="Seu gato na capa." 
            icon={Newspaper} 
            bg="bg-[#1E1E2C]"
            iconBg="bg-pink-500" 
            iconColor="text-white"
            onClick={() => navigate('/studio/magazine')}
        />

        {/* Desafio Diário */}
        <motion.button 
            whileTap={{ scale: 0.98 }}
            className="col-span-2 bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10 p-4 rounded-[24px] flex items-center justify-between shadow-lg group relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ebfc66]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#ebfc66] border border-white/10">
                    <Sparkles size={20} />
                </div>
                <div className="text-left">
                    <h4 className="font-black text-sm text-white">Desafio do Dia</h4>
                    <p className="text-[10px] text-gray-400">Crie um meme com a tag #GatoPreguiça</p>
                </div>
            </div>
            <div className="bg-[#ebfc66] text-[#6158ca] p-2 rounded-full group-hover:rotate-90 transition-transform">
                <Play size={16} fill="currentColor" />
            </div>
        </motion.button>
      </div>

      {/* 4. GALERIA DE INSPIRAÇÃO */}
      <div className="mb-4 flex items-center justify-between px-1">
         <h3 className="text-sm font-black text-white/80 flex items-center gap-2">
             <Search size={16} className="text-[#ebfc66]" /> Galeria da Comunidade
         </h3>
      </div>

      <div className="columns-2 gap-3 space-y-3">
        {GALLERY_ITEMS.map((item) => (
            <motion.div 
                key={item.id}
                whileTap={{ scale: 0.98 }}
                className="break-inside-avoid bg-white/5 rounded-[20px] overflow-hidden border border-white/10 relative group cursor-pointer"
            >
                <img src={item.img} className="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3">
                    <p className="text-white text-[10px] font-bold truncate">{item.title}</p>
                    <div className="flex items-center gap-1 text-[#ebfc66] text-[9px] font-black">
                        <Heart size={10} fill="currentColor" /> {item.likes}
                    </div>
                </div>
                {item.type === 'video' && (
                    <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white backdrop-blur-sm border border-white/20">
                        <Video size={10} />
                    </div>
                )}
            </motion.div>
        ))}
      </div>

    </div>
  );
}