import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Cat, Info } from 'lucide-react';
import useSensory from '../hooks/useSensory';

// --- BANCO DE DADOS DE RAÇAS (Mock Inicial) ---
// Organizado para cobrir as categorias das imagens
const ALL_BREEDS = [
  // PELAGEM CURTA
  { id: 'abissinio', name: 'Abissínio', type: 'curta', img: 'https://images.unsplash.com/photo-1596798205622-c32360db9360?auto=format&fit=crop&w=300&q=80' },
  { id: 'bobtail_americano', name: 'American Bobtail', type: 'curta', img: 'https://images.unsplash.com/photo-1565552634629-b6348873730e?auto=format&fit=crop&w=300&q=80' },
  { id: 'bengal', name: 'Bengal', type: 'curta', img: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=300&q=80' },
  { id: 'bombay', name: 'Bombay', type: 'curta', img: 'https://images.unsplash.com/photo-1577051320663-1498b30a9042?auto=format&fit=crop&w=300&q=80' },
  { id: 'burmes', name: 'Burmês', type: 'curta', img: 'https://images.unsplash.com/photo-1511275560982-95ac24b90e84?auto=format&fit=crop&w=300&q=80' },
  { id: 'british_shorthair', name: 'British Shorthair', type: 'curta', img: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=300&q=80' },
  { id: 'chartreux', name: 'Chartreux', type: 'curta', img: 'https://images.unsplash.com/photo-1548802673-380ab8ebc427?auto=format&fit=crop&w=300&q=80' },
  { id: 'cornish_rex', name: 'Cornish Rex', type: 'curta', img: 'https://images.unsplash.com/photo-1579844627236-47b2b3a62886?auto=format&fit=crop&w=300&q=80' },
  { id: 'devon_rex', name: 'Devon Rex', type: 'curta', img: 'https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&w=300&q=80' },
  { id: 'sphynx', name: 'Sphynx', type: 'curta', img: 'https://images.unsplash.com/photo-1543160206-df67e23730e6?auto=format&fit=crop&w=300&q=80' },
  { id: 'siames', name: 'Siamês', type: 'curta', img: 'https://images.unsplash.com/photo-1568152950566-c1bf43b4ab51?auto=format&fit=crop&w=300&q=80' },
  { id: 'oriental', name: 'Oriental Shorthair', type: 'curta', img: 'https://images.unsplash.com/photo-1599453272990-2ee288b20929?auto=format&fit=crop&w=300&q=80' },
  { id: 'russo_azul', name: 'Russo Azul', type: 'curta', img: 'https://images.unsplash.com/photo-1626260029339-e47321896895?auto=format&fit=crop&w=300&q=80' },

  // PELAGEM MÉDIA
  { id: 'angora', name: 'Angorá Turco', type: 'media', img: 'https://images.unsplash.com/photo-1627918544973-77293a38892f?auto=format&fit=crop&w=300&q=80' },
  { id: 'bobtail_japones', name: 'Bobtail Japonês', type: 'media', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80' },
  { id: 'cymric', name: 'Cymric', type: 'media', img: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=300&q=80' },
  { id: 'exotico', name: 'Exótico', type: 'media', img: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=300&q=80' },
  { id: 'laperm', name: 'LaPerm', type: 'media', img: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=300&q=80' },
  { id: 'maine_coon', name: 'Maine Coon', type: 'media', img: 'https://images.unsplash.com/photo-1583002626490-67c74c93390d?auto=format&fit=crop&w=300&q=80' },
  { id: 'ragdoll', name: 'Ragdoll', type: 'media', img: 'https://images.unsplash.com/photo-1603598579979-3738096f2e23?auto=format&fit=crop&w=300&q=80' },
  { id: 'sagrado_birmania', name: 'Sagrado da Birmânia', type: 'media', img: 'https://images.unsplash.com/photo-1577980833299-4d6402324707?auto=format&fit=crop&w=300&q=80' },
  { id: 'scottish_fold', name: 'Scottish Fold', type: 'media', img: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80' },

  // PELAGEM LONGA
  { id: 'balines', name: 'Balinês', type: 'longa', img: 'https://images.unsplash.com/photo-1563297750-f84478207ea3?auto=format&fit=crop&w=300&q=80' },
  { id: 'british_longhair', name: 'British Longhair', type: 'longa', img: 'https://images.unsplash.com/photo-1582269932087-2bc92440939f?auto=format&fit=crop&w=300&q=80' },
  { id: 'himalaio', name: 'Himalaio', type: 'longa', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=300&q=80' },
  { id: 'noruegues', name: 'Norueguês da Floresta', type: 'longa', img: 'https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&w=300&q=80' },
  { id: 'persa', name: 'Persa', type: 'longa', img: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=300&q=80' },
  { id: 'siberiano', name: 'Siberiano', type: 'longa', img: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=300&q=80' },
];

export default function WikiBreeds() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [activeTab, setActiveTab] = useState('curta');
  const [search, setSearch] = useState('');

  // Lógica de Filtro
  const filteredBreeds = ALL_BREEDS.filter(breed => 
    breed.type === activeTab && 
    breed.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 pt-6 px-5 font-sans">
      
      {/* 1. HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
                Almanaque <span className="text-[#8B4AFF]">de Raças</span>
            </h1>
            <p className="text-xs text-gray-400 font-bold">Conheça a origem do seu gato.</p>
        </div>
      </div>

      {/* 2. FILTROS VISUAIS (TOPO) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <FilterCard 
            label="Curta" 
            type="curta" 
            active={activeTab === 'curta'} 
            onClick={() => { touch(); setActiveTab('curta'); }} 
            img="https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=100&q=80"
        />
        <FilterCard 
            label="Média" 
            type="media" 
            active={activeTab === 'media'} 
            onClick={() => { touch(); setActiveTab('media'); }} 
            img="https://images.unsplash.com/photo-1583002626490-67c74c93390d?auto=format&fit=crop&w=100&q=80"
        />
        <FilterCard 
            label="Longa" 
            type="longa" 
            active={activeTab === 'longa'} 
            onClick={() => { touch(); setActiveTab('longa'); }} 
            img="https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=100&q=80"
        />
      </div>

      {/* 3. BARRA DE BUSCA */}
      <div className="bg-white p-3 rounded-[20px] shadow-sm flex items-center gap-3 mb-6 border border-gray-100">
        <Search size={20} className="text-gray-300" />
        <input 
            type="text" 
            placeholder={`Buscar em pelagem ${activeTab}...`}
            className="flex-1 outline-none text-sm font-bold text-gray-700 placeholder-gray-300 bg-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 4. GRID DE RAÇAS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
            {filteredBreeds.map((breed) => (
                <motion.div
                    layout
                    key={breed.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group text-center"
                    onClick={() => { touch(); navigate(`/wiki/breeds/${breed.id}`); }}
  
                >
                    <div className="aspect-[4/3] rounded-[16px] overflow-hidden mb-3 bg-gray-50 relative">
                        <img 
                            src={breed.img} 
                            alt={breed.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        {/* Overlay sutil */}
                        <div className="absolute inset-0 bg-[#8B4AFF]/0 group-hover:bg-[#8B4AFF]/10 transition-colors" />
                    </div>
                    <h3 className="font-black text-gray-700 text-sm leading-tight group-hover:text-[#8B4AFF] transition-colors">
                        {breed.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wide">
                        Ver Detalhes
                    </p>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredBreeds.length === 0 && (
          <div className="text-center py-10 opacity-50">
              <Cat size={48} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-bold text-gray-500">Nenhuma raça encontrada.</p>
          </div>
      )}

    </div>
  );
}

// Componente do Card de Filtro (Topo)
const FilterCard = ({ label, type, active, onClick, img }) => (
    <button 
        onClick={onClick}
        className={`relative rounded-[20px] overflow-hidden h-24 border-2 transition-all ${
            active 
            ? 'border-[#8B4AFF] shadow-md scale-105 z-10' 
            : 'border-transparent opacity-60 hover:opacity-80 scale-100 grayscale'
        }`}
    >
        <img src={img} className="absolute inset-0 w-full h-full object-cover" />
        <div className={`absolute inset-0 flex items-end justify-center pb-2 ${active ? 'bg-gradient-to-t from-[#8B4AFF]/90 to-transparent' : 'bg-black/40'}`}>
            <span className="text-white text-[10px] font-black uppercase tracking-wide">
                {label}
            </span>
        </div>
    </button>
);
