import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, MessageCircle, Heart, 
  Stethoscope, Star 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSensory from '../hooks/useSensory';

// Imagens de Fundo
const IMG_STORE = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=60";
const IMG_SOCIAL = "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=60";
const IMG_VET = "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=300&q=60";
const IMG_ONG = "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=300&q=60";
const IMG_MEMORIAL = "https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=60";

const ActionCard = ({ title, subtitle, icon: Icon, gradient, img, onClick, isFull, iconColor }) => {
  const touch = useSensory();
  
  return (
    <motion.button 
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={() => { touch(); if(onClick) onClick(); }}
      className={`relative overflow-hidden rounded-[24px] shadow-sm text-left group transition-all hover:shadow-md ${isFull ? 'col-span-2 h-24 flex items-center px-5' : 'col-span-1 h-36 flex flex-col justify-between p-4'} ${gradient}`}
    >
      {/* 1. Imagem de Fundo */}
      <div className="absolute inset-0 overflow-hidden rounded-[24px]">
          <img 
            src={img} 
            className="absolute right-0 bottom-0 w-32 h-32 object-cover opacity-20 mix-blend-soft-light grayscale transition-transform duration-700 ease-out group-hover:scale-125" 
            style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}
          />
      </div>
      
      {/* 2. Conteúdo */}
      <div className={`relative z-20 flex-shrink-0 w-12 h-12 rounded-[18px] bg-white flex items-center justify-center shadow-sm ${isFull ? 'mr-4' : 'mb-2'}`}>
          <Icon size={22} className={iconColor} strokeWidth={2.5} />
      </div>
        
      <div className={`relative z-20 ${isFull ? 'flex-1' : ''}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-60 mix-blend-overlay ${isFull ? 'text-white' : 'text-black'}`}>
            {subtitle}
          </p>
          <h4 className={`font-black text-lg leading-none ${isFull ? 'text-white' : 'text-gray-800/90'}`}>
            {title}
          </h4>
      </div>

      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none" />
    </motion.button>
  );
};

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      
      {/* 1. Store */}
      <ActionCard 
        title="Store" 
        subtitle="MIMOS" 
        icon={ShoppingBag} 
        gradient="bg-gradient-to-br from-[#FFB75E] to-[#ED8F03]" 
        img={IMG_STORE} 
        iconColor="text-orange-500"
        onClick={() => navigate('/store')} 
      />
      
      {/* 2. Social */}
      <ActionCard 
        title="Social" 
        subtitle="COMUNIGATO" 
        icon={MessageCircle} 
        gradient="bg-gradient-to-br from-[#6DD5FA] to-[#2980B9]" 
        img={IMG_SOCIAL} 
        iconColor="text-blue-500"
        onClick={() => navigate('/comunigato')}
      />

      {/* 3. Vets (LINK ATIVADO) */}
      <ActionCard 
        title="Vets" 
        subtitle="VOLUNTÁRIOS" 
        icon={Stethoscope} 
        gradient="bg-gradient-to-br from-[#5AFF15] to-[#00B712]" 
        img={IMG_VET} 
        iconColor="text-green-600"
        onClick={() => navigate('/vets')} 
      />

      {/* 4. Ajude (LINK ATIVADO) */}
      <ActionCard 
        title="Ajude" 
        subtitle="ADOTE & ONGs" 
        icon={Heart} 
        gradient="bg-gradient-to-br from-[#FF99AC] to-[#FF5E89]" 
        img={IMG_ONG} 
        iconColor="text-pink-500"
        onClick={() => navigate('/ongs')} 
      />

      {/* 5. Memorial (LINK ATIVADO) */}
      <ActionCard 
        title="Das Estrelinhas" 
        subtitle="MEMORIAL" 
        icon={Star} 
        isFull={true}
        gradient="bg-gradient-to-r from-[#2c3e50] to-[#4ca1af]" 
        img={IMG_MEMORIAL} 
        iconColor="text-yellow-400"
        onClick={() => navigate('/memorial')} 
      />

    </div>
  );
}