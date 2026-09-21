import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Cat } from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { BREED_TYPE_OPTIONS } from '../data/breeds';
import { BREEDS_UPDATED_EVENT, getBreedCatalog } from '../services/breedContentStore';

export default function WikiBreeds() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [activeTab, setActiveTab] = useState('curta');
  const [search, setSearch] = useState('');
  const [breeds, setBreeds] = useState(() => getBreedCatalog());

  useEffect(() => {
    const refreshBreeds = () => setBreeds(getBreedCatalog());

    window.addEventListener(BREEDS_UPDATED_EVENT, refreshBreeds);
    window.addEventListener('storage', refreshBreeds);
    window.addEventListener('focus', refreshBreeds);

    return () => {
      window.removeEventListener(BREEDS_UPDATED_EVENT, refreshBreeds);
      window.removeEventListener('storage', refreshBreeds);
      window.removeEventListener('focus', refreshBreeds);
    };
  }, []);

  const filteredBreeds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return breeds.filter((breed) => (
      breed.type === activeTab &&
      (!query || breed.name.toLowerCase().includes(query) || breed.tags.some((tag) => tag.toLowerCase().includes(query)))
    ));
  }, [activeTab, breeds, search]);

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 pt-6 px-5 font-sans">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            Almanaque <span className="text-[#8B4AFF]">de Racas</span>
          </h1>
          <p className="text-xs text-gray-400 font-bold">Conheca a origem do seu gato.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {BREED_TYPE_OPTIONS.map((option) => {
          const cover = breeds.find((breed) => breed.type === option.value)?.img;

          return (
            <FilterCard
              key={option.value}
              label={option.shortLabel}
              active={activeTab === option.value}
              onClick={() => { touch(); setActiveTab(option.value); }}
              img={cover || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=200&q=80'}
            />
          );
        })}
      </div>

      <div className="bg-white p-3 rounded-[20px] shadow-sm flex items-center gap-3 mb-6 border border-gray-100">
        <Search size={20} className="text-gray-300" />
        <input
          type="text"
          placeholder={`Buscar em ${BREED_TYPE_OPTIONS.find((item) => item.value === activeTab)?.label.toLowerCase()}...`}
          className="flex-1 outline-none text-sm font-bold text-gray-700 placeholder-gray-300 bg-transparent"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

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
                  className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-[#8B4AFF]/0 group-hover:bg-[#8B4AFF]/10 transition-colors" />
              </div>
              <h3 className="font-black text-gray-700 text-sm leading-tight group-hover:text-[#8B4AFF] transition-colors">
                {breed.name}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wide">
                Ver detalhes
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredBreeds.length === 0 && (
        <div className="text-center py-10 opacity-50">
          <Cat size={48} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-bold text-gray-500">Nenhuma raca encontrada.</p>
        </div>
      )}
    </div>
  );
}

const FilterCard = ({ label, active, onClick, img }) => (
  <button
    onClick={onClick}
    className={`relative rounded-[20px] overflow-hidden h-24 border-2 transition-all ${
      active
        ? 'border-[#8B4AFF] shadow-md scale-105 z-10'
        : 'border-transparent opacity-60 hover:opacity-80 scale-100 grayscale'
    }`}
  >
    <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
    <div className={`absolute inset-0 flex items-end justify-center pb-2 ${active ? 'bg-gradient-to-t from-[#8B4AFF]/90 to-transparent' : 'bg-black/40'}`}>
      <span className="text-white text-[10px] font-black uppercase tracking-wide">
        {label}
      </span>
    </div>
  </button>
);
