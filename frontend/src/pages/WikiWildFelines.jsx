import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, PawPrint, Globe2, ShieldAlert } from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { CONSERVATION_STATUS_OPTIONS } from '../data/wildFelines';
import { getWildFelines, WILD_FELINES_UPDATED_EVENT } from '../services/wildFelineStore';

export default function WikiWildFelines() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [items, setItems] = useState(() => getWildFelines());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    const refresh = () => setItems(getWildFelines());
    window.addEventListener(WILD_FELINES_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(WILD_FELINES_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = status === 'all' || item.status === status;
      const matchesQuery = !query ||
        item.name.toLowerCase().includes(query) ||
        item.scientificName.toLowerCase().includes(query) ||
        item.region.toLowerCase().includes(query) ||
        item.countries.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [items, search, status]);

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 pt-6 px-5 font-sans">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            Felinos <span className="text-emerald-600">Selvagens</span>
          </h1>
          <p className="text-xs text-gray-400 font-bold">Especies, origem e conservacao.</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-700 to-teal-500 rounded-[32px] p-6 text-white mb-6 relative overflow-hidden shadow-lg shadow-emerald-100">
        <div className="relative z-10 max-w-[86%]">
          <h2 className="text-2xl font-black leading-tight mb-2">Da onca ao tigre: o mapa vivo dos felinos.</h2>
          <p className="text-xs font-medium opacity-90 leading-relaxed">Acompanhe habitat, paises de origem, dieta, ameacas e risco de extincao de cada especie.</p>
        </div>
        <PawPrint size={128} className="absolute -right-4 -bottom-8 opacity-15 rotate-[-15deg]" />
      </div>

      <div className="bg-white p-3 rounded-[20px] shadow-sm flex items-center gap-3 mb-4 border border-gray-100">
        <Search size={20} className="text-gray-300" />
        <input
          type="text"
          placeholder="Buscar especie, pais ou regiao..."
          className="flex-1 outline-none text-sm font-bold text-gray-700 placeholder-gray-300 bg-transparent"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        <FilterPill label="Todos" active={status === 'all'} onClick={() => setStatus('all')} />
        {CONSERVATION_STATUS_OPTIONS.map((option) => (
          <FilterPill key={option.value} label={option.value} active={status === option.value} onClick={() => setStatus(option.value)} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => {
            const statusMeta = CONSERVATION_STATUS_OPTIONS.find((option) => option.value === item.status) || CONSERVATION_STATUS_OPTIONS.at(-1);
            return (
              <motion.button
                layout
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                onClick={() => { touch(); navigate(`/wiki-wild-felines/${item.id}`); }}
                className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm text-left hover:shadow-md transition-shadow"
              >
                <div className="h-44 bg-gray-100 relative">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover object-top" />
                  <span className={`absolute top-3 left-3 text-[10px] font-black px-2 py-1 rounded-full ${statusMeta.color}`}>
                    {item.status}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-black text-gray-800 text-lg leading-tight">{item.name}</h3>
                  <p className="text-xs italic text-gray-400 font-bold mt-0.5">{item.scientificName}</p>
                  <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-gray-500">
                    <Globe2 size={14} className="text-emerald-500" />
                    <span className="line-clamp-1">{item.region}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-gray-500">
                    <ShieldAlert size={14} className="text-orange-500" />
                    <span className="line-clamp-1">{statusMeta.label}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap ${active ? 'bg-emerald-600 text-white' : 'bg-white text-gray-400'}`}>
      {label}
    </button>
  );
}
