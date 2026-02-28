import React, { useState, useEffect, useContext } from 'react';
import { 
  Plus, ArrowLeft, LayoutGrid, List, Search, 
  AlertCircle, Calendar, Weight, Syringe, Pill, ChevronRight, 

} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import useSensory from '../hooks/useSensory';
import api from '../services/api';

export default function Cats() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);
  
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      api.get('/pets').then(res => {
        // FILTRO: Remove permanentemente os gatos em memorial ou arquivados desta listagem
        const activeCats = res.data.filter(c => !c.isMemorial && !c.isArchived);
        
        // ORDENAÇÃO: Quem tem tratamento (MEDICINE) sobe para o topo
        const sorted = activeCats.sort((a, b) => {
          const aUrg = a.healthRecords?.some(r => r.type === 'MEDICINE' || r.type === 'MEDICATION') ? 0 : 1;
          const bUrg = b.healthRecords?.some(r => r.type === 'MEDICINE' || r.type === 'MEDICATION') ? 0 : 1;
          return aUrg - bUrg;
        });
        setCats(sorted);
      }).finally(() => setLoading(false));
    }
  }, [user]);

  const filteredCats = cats.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-40">
      {/* Header Estourado Gatedo */}
      <div className="bg-[#6158ca] pt-12 pb-24 px-6 rounded-b-[60px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="flex items-center justify-between mb-8 relative z-10">
          <button onClick={() => navigate('/home')} className="bg-white/10 backdrop-blur-xl p-3 rounded-[22px] text-white border border-white/20">
            <ArrowLeft size={22} />
          </button>
          <div className="flex bg-black/20 backdrop-blur-md p-1.5 rounded-[22px] border border-white/10">
            <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-[18px] transition-all ${viewMode === 'grid' ? 'bg-[#ebfc66] text-[#6158ca] shadow-lg' : 'text-white/60'}`}><LayoutGrid size={20}/></button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-[18px] transition-all ${viewMode === 'list' ? 'bg-[#ebfc66] text-[#6158ca] shadow-lg' : 'text-white/60'}`}><List size={20}/></button>
          </div>
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Meus Gatos</h1>
        <p className="text-[#ebfc66] text-[11px] font-black uppercase tracking-[3px] mt-2">Gestão da Família</p>
      </div>

      <div className="px-6 -mt-10 relative z-20 space-y-6">
        {/* Barra de Busca Premium */}
        <div className="bg-white rounded-[30px] p-2 shadow-xl shadow-indigo-900/5 flex items-center border border-gray-50">
          <div className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-gray-50/50 rounded-[25px]">
            <Search size={20} className="text-gray-300" />
            <input 
              className="bg-transparent border-none outline-none text-sm font-bold w-full text-gray-700 placeholder-gray-300" 
              placeholder="Localizar gatinho..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Morphing Grid/List */}
        <LayoutGroup>
          <motion.div layout className={viewMode === 'grid' ? "grid grid-cols-2 gap-5" : "flex flex-col gap-5"}>
            <AnimatePresence>
              {filteredCats.map(cat => (
                <ModularCatCard key={cat.id} pet={cat} viewMode={viewMode} onClick={() => navigate(`/cat/${cat.id}`)} />
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        {filteredCats.length === 0 && !loading && (
          <div className="py-20 text-center">
            <PawPrint size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum gatinho ativo encontrado</p>
          </div>
        )}
      </div>

     {/* Botão Flutuante Gatedo Style - Elevado acima do rodapé */}
      <motion.button 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={() => { touch(); navigate('/cat-new'); }} 
        className="fixed bottom-28 right-8 w-16 h-16 bg-[#6158ca] rounded-[24px] shadow-2xl shadow-yellow-500/40 flex items-center justify-center text-[#ebfc66] z-[999] border-4 border-white"
      >
        <Plus size={32} strokeWidth={3} />
      </motion.button>
    </div>
  );
}

function ModularCatCard({ pet, viewMode, onClick }) {
  const isGrid = viewMode === 'grid';
  const hasMedicine = pet.healthRecords?.some(r => r.type === 'MEDICINE' || r.type === 'MEDICATION');
  const hasVaccine = pet.healthRecords?.some(r => r.type === 'VACCINE');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className={`bg-white rounded-[40px] border border-gray-50 shadow-sm relative overflow-hidden flex cursor-pointer hover:shadow-xl transition-shadow ${isGrid ? 'flex-col p-5 h-[340px]' : 'flex-row p-4 gap-5 h-auto'}`}
    >
      {/* Avatar Estourado */}
      <motion.div layout className={`relative flex-shrink-0 overflow-hidden rounded-[30px] bg-gray-100 ${isGrid ? 'w-full h-40 mb-4' : 'w-24 h-24'}`}>
        <img src={pet.photoUrl || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba"} className="w-full h-full object-cover" alt={pet.name} />
        {hasMedicine && (
            <div className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full animate-pulse shadow-lg"><Pill size={12} strokeWidth={3}/></div>
        )}
      </motion.div>

      {/* Conteúdo Informativo */}
      <motion.div layout className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-lg font-black text-gray-800 uppercase tracking-tighter leading-none truncate">{pet.name}</h4>
            {!isGrid && <ChevronRight size={18} className="text-gray-200" />}
          </div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate mb-2">ID #{pet.id?.slice(0,6)} • {pet.breed || 'SRD'}</p>
          
          <div className="flex items-center gap-3 mb-3">
             <div className="flex items-center gap-1 text-gray-500"><Calendar size={12}/><span className="text-[10px] font-black">{pet.ageYears || '0'}a {pet.ageMonths || '0'}m</span></div>
             <div className="flex items-center gap-1 text-gray-500"><Weight size={12}/><span className="text-[10px] font-black">{pet.weight || '0'}kg</span></div>
          </div>
        </div>

        {/* Pills de Status */}
        <div className="flex flex-wrap gap-1.5">
           {hasMedicine && (
             <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-amber-200">
                <AlertCircle size={10} /> Em Tratamento
             </span>
           )}
           {hasVaccine ? (
             <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-green-200">
                <Check size={10} /> Vacinas OK
             </span>
           ) : (
             <span className="bg-blue-100 text-[#6158ca] px-2.5 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-blue-200">
                <Syringe size={10} /> Pendente
             </span>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
}