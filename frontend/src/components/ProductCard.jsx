import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import useSensory from '../hooks/useSensory';

export default function ProductCard({ product }) {
  const touch = useSensory();

  return (
    <motion.div 
      whileTap={{ scale: 0.96 }}
      className="bg-white p-3 rounded-[24px] shadow-sm border border-gray-50 flex flex-col relative overflow-hidden group"
    >
      {/* Imagem */}
      <div className="h-32 w-full rounded-[18px] overflow-hidden mb-3 bg-gray-100 relative">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold shadow-sm">
           <Star size={10} className="text-yellow-500 fill-yellow-500" /> {product.rating}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{product.category}</p>
            <h3 className="font-bold text-gray-800 text-sm leading-tight mb-2">{product.name}</h3>
        </div>
        
        <div className="flex items-center justify-between mt-2">
            <span className="font-black text-gatedo-primary text-lg">
                <span className="text-xs mr-0.5">R$</span>{product.price}
            </span>
            <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => touch('success')} // Som de Sucesso ao comprar
                className="w-8 h-8 rounded-full bg-gatedo-accent text-gatedo-primary flex items-center justify-center shadow-sm"
            >
                <Plus size={18} strokeWidth={3} />
            </motion.button>
        </div>
      </div>
    </motion.div>
  );
}