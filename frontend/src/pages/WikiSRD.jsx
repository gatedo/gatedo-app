import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Shield, Sparkles, Palette, Info, Search } from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { SRD_COAT_OPTIONS } from '../data/srdProfiles';
import { getSrdProfiles, SRD_UPDATED_EVENT } from '../services/srdContentStore';

export default function WikiSRD() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [profiles, setProfiles] = useState(() => getSrdProfiles());
  const [activeCoat, setActiveCoat] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const refreshProfiles = () => setProfiles(getSrdProfiles());

    window.addEventListener(SRD_UPDATED_EVENT, refreshProfiles);
    window.addEventListener('storage', refreshProfiles);
    window.addEventListener('focus', refreshProfiles);

    return () => {
      window.removeEventListener(SRD_UPDATED_EVENT, refreshProfiles);
      window.removeEventListener('storage', refreshProfiles);
      window.removeEventListener('focus', refreshProfiles);
    };
  }, []);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchesCoat = activeCoat === 'all' || profile.coat === activeCoat;
      const matchesQuery = !query ||
        profile.name.toLowerCase().includes(query) ||
        profile.pattern.toLowerCase().includes(query) ||
        profile.traits.some((trait) => trait.toLowerCase().includes(query));

      return matchesCoat && matchesQuery;
    });
  }, [activeCoat, profiles, search]);

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 pt-6 px-5 font-sans">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => { touch(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100 hover:bg-gray-50">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#ebfc66] text-[#8B4AFF] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Especial</span>
          </div>
          <h1 className="text-xl font-black text-gray-800">
            Gatos <span className="text-[#FF9F43]">SRD</span>
          </h1>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#FF9F43] to-[#ffb673] rounded-[32px] p-6 text-white mb-8 relative overflow-hidden shadow-lg shadow-orange-200">
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-2 leading-tight">Unicos, exclusivos<br />e cheios de historia.</h2>
          <p className="text-xs font-medium opacity-90 leading-relaxed max-w-[84%]">
            SRD significa "Sem Raca Definida". O melhor jeito de entender cada um e observar pelagem, comportamento, rotina e historico individual.
          </p>
        </div>
        <Heart size={120} className="absolute -right-4 -bottom-8 opacity-20 rotate-[-15deg]" />
      </div>

      <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
        <Shield size={20} className="text-[#FF9F43]" /> Superpoderes
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3">
            <ActivityIcon />
          </div>
          <h4 className="font-bold text-sm text-gray-800">Variabilidade</h4>
          <p className="text-[10px] text-gray-500 mt-1">Mistura genetica ampla, com menos previsibilidade de padrao unico.</p>
        </div>
        <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-3">
            <Sparkles size={20} />
          </div>
          <h4 className="font-bold text-sm text-gray-800">Exclusividade</h4>
          <p className="text-[10px] text-gray-500 mt-1">Pelagem, temperamento e historia formam um perfil unico.</p>
        </div>
      </div>

      <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
        <Palette size={20} className="text-[#FF9F43]" /> Pelagens e perfis SRD
      </h3>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        <button
          onClick={() => { touch(); setActiveCoat('all'); }}
          className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap ${activeCoat === 'all' ? 'bg-[#FF9F43] text-white' : 'bg-white text-gray-400'}`}
        >
          Todos
        </button>
        {SRD_COAT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => { touch(); setActiveCoat(option.value); }}
            className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap ${activeCoat === option.value ? 'bg-[#FF9F43] text-white' : 'bg-white text-gray-400'}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-3 rounded-[20px] shadow-sm flex items-center gap-3 mb-5 border border-gray-100">
        <Search size={20} className="text-gray-300" />
        <input
          type="text"
          placeholder="Buscar por nome, padrao ou caracteristica..."
          className="flex-1 outline-none text-sm font-bold text-gray-700 placeholder-gray-300 bg-transparent"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredProfiles.map((profile, index) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex gap-4 items-start hover:shadow-md transition-all"
            onClick={() => { touch(); navigate(`/wiki-srd/${profile.id}`); }}
          >
            <div className="w-20 h-20 rounded-[18px] flex-shrink-0 overflow-hidden relative shadow-sm bg-gray-100">
              <img src={profile.img} alt={profile.name} className="w-full h-full object-cover object-top" />
              <div className={`absolute bottom-0 w-full h-1.5 ${profile.colorClass}`} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="text-base font-black text-gray-800">{profile.name}</h4>
                <span className="text-[10px] font-black text-[#FF9F43] bg-orange-50 px-2 py-0.5 rounded-full">{profile.pattern}</span>
              </div>
              <p className="text-[10px] font-medium text-gray-500 leading-tight">{profile.desc}</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {profile.traits.map((trait) => (
                  <span key={trait} className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{trait}</span>
                ))}
              </div>
              {profile.care && (
                <p className="text-[10px] text-orange-700/80 bg-orange-50 rounded-xl px-3 py-2 mt-3 leading-tight">
                  {profile.care}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-10 opacity-50">
          <Palette size={44} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-bold text-gray-500">Nenhum perfil SRD encontrado.</p>
        </div>
      )}

      <div className="mt-8 bg-blue-50 rounded-[24px] p-5 flex gap-4 items-start border border-blue-100">
        <Info size={24} className="text-blue-500 flex-shrink-0 mt-1" />
        <div>
          <h4 className="text-sm font-bold text-blue-800 mb-1">Voce sabia?</h4>
          <p className="text-xs text-blue-700/80 leading-relaxed">
            O dia 31 de julho e lembrado como Dia do Vira-Lata no Brasil. Uma data para celebrar adocao, cuidado e amor sem pedigree.
          </p>
        </div>
      </div>
    </div>
  );
}

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
);
