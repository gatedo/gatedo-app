import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ChevronRight, Calendar, Ghost, AlertCircle } from 'lucide-react';

export default function CatCard({ pet, onClick, hasUrgency }) {
  if (!pet) return null;

  const isInMemoriam = pet.isArchived || pet.isMemorial;

  return (
    <motion.div 
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`rounded-[32px] p-4 flex items-center gap-4 shadow-sm border transition-all cursor-pointer 
        ${isInMemoriam 
          ? 'bg-gray-100/50 border-gray-200 opacity-70' 
          : hasUrgency 
            ? 'bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-100' 
            : 'bg-white border-gray-50 active:bg-gray-50 shadow-sm'
        }`}
    >
      <div className={`w-20 h-20 rounded-[24px] overflow-hidden flex-shrink-0 border-2 border-white shadow-sm bg-gray-100
        ${isInMemoriam ? 'grayscale filter' : ''}`}>
        <img 
          src={pet.photoUrl || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200&auto=format&fit=crop"} 
          className="w-full h-full object-cover"
          alt={pet.name}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className={`text-base font-black truncate ${isInMemoriam ? 'text-gray-500' : 'text-gray-800'}`}>
            {pet.name}
          </h4>
          {hasUrgency && !isInMemoriam && (
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <AlertCircle size={16} className="text-amber-500 shadow-sm" />
            </motion.span>
          )}
          {isInMemoriam ? (
            <Ghost size={12} className="text-gray-400" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${pet.gender === 'MALE' ? 'bg-blue-400' : 'bg-pink-400'}`} />
          )}
        </div>
        
        <div className="flex flex-col gap-0.5">
          <p className={`text-[10px] font-black uppercase tracking-wider truncate 
            ${isInMemoriam ? 'text-gray-400' : 'text-[#6158ca]'}`}>
            {isInMemoriam ? '✨ Em Memória' : (pet.breed || 'SRD')}
          </p>
          
          <div className="flex items-center gap-1 text-gray-400">
            <Calendar size={10} />
            <span className="text-[10px] font-black uppercase tracking-tighter">
              {isInMemoriam ? 'Eternizado' : (pet.age ? `${pet.age} anos` : 'Gatedo')}
            </span>
          </div>
        </div>
      </div>

      <div className={`p-2 rounded-2xl ${isInMemoriam ? 'bg-gray-200/50 text-gray-400' : 'bg-gray-50 text-gray-300'}`}>
        <ChevronRight size={18} />
      </div>
    </motion.div>
  );
}