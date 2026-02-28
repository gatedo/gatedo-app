import React, { useState, useEffect, useContext } from 'react';
import {
  Plus, ArrowLeft, LayoutGrid, List, Search,
  AlertCircle, Calendar, Weight, Syringe, Pill,
  ChevronRight, PawPrint, GripVertical, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import useSensory from '../hooks/useSensory';
import api from '../services/api';

const C = { purple: '#6158ca', accent: '#ebfc66' };

function GridCard({ pet, onClick }) {
  const [hovered, setHovered] = useState(false);
  const hasMedicine = pet.healthRecords?.some(r => r.type === 'MEDICINE' || r.type === 'MEDICATION');
  const hasVaccine  = pet.healthRecords?.some(r => r.type === 'VACCINE');
  const theme = pet.themeColor || C.purple;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="relative overflow-hidden cursor-pointer bg-white"
      style={{
        borderRadius: 40, height: 300,
        boxShadow: hovered ? `0 20px 48px ${theme}28, 0 4px 12px rgba(0,0,0,0.08)` : '0 2px 8px rgba(0,0,0,0.05)',
        border: hovered ? `2px solid ${theme}40` : '2px solid #F3F4F6',
        transition: 'box-shadow 0.3s, border 0.25s',
      }}>
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 38 }}>
        <motion.img
          src={pet.photoUrl || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=70'}
          alt={pet.name} className="w-full h-full object-cover"
          animate={{ scale: hovered ? 1.09 : 1 }}
          style={{ filter: hovered ? 'brightness(1.1) saturate(1.2)' : 'brightness(1)', transition: 'filter 0.4s' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 40%, transparent 100%)' }} />
        <motion.div className="absolute inset-0"
          animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.3 }}
          style={{ background: `radial-gradient(ellipse at 70% 10%, ${theme}40 0%, transparent 60%)` }} />
      </div>

      {hasMedicine && (
        <div className="absolute top-3 right-3 z-10">
          <motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}
            className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg border-2 border-white">
            <Pill size={11} className="text-white" strokeWidth={3} />
          </motion.div>
        </div>
      )}

      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
          <div className={`w-1.5 h-1.5 rounded-full ${pet.gender === 'MALE' ? 'bg-blue-300' : 'bg-pink-300'}`} />
          <span className="text-[8px] font-black text-white/80 uppercase tracking-wide">
            {pet.gender === 'MALE' ? 'Macho' : 'Fêmea'}
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <motion.div animate={{ y: hovered ? -5 : 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
          <h4 className="font-black text-white text-lg leading-none tracking-tight truncate">{pet.name}</h4>
          <p className="text-[10px] font-black text-white/55 uppercase tracking-widest mt-0.5">
            {pet.breed || 'SRD'} · {pet.ageYears || '?'}a
          </p>
          <AnimatePresence>
            {hovered && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }} transition={{ duration: 0.2 }}
                className="flex flex-wrap gap-1.5 mt-2.5">
                {hasMedicine && (
                  <span className="bg-red-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[8px] font-black">
                    💊 Em tratamento
                  </span>
                )}
                {hasVaccine
                  ? <span className="bg-green-500/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[8px] font-black">✓ Vacinas OK</span>
                  : <span className="bg-amber-400/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[8px] font-black">💉 Vacina pendente</span>
                }
                <span className="bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[8px] font-black">
                  {pet.weight || '?'}kg
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <motion.div className="absolute inset-0 pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        style={{ borderRadius: 38, boxShadow: `inset 0 0 0 2.5px ${theme}70` }} />
    </motion.div>
  );
}

function ListCard({ pet, onClick, dragControls }) {
  const [hovered, setHovered] = useState(false);
  const hasMedicine = pet.healthRecords?.some(r => r.type === 'MEDICINE' || r.type === 'MEDICATION');
  const hasVaccine  = pet.healthRecords?.some(r => r.type === 'VACCINE');
  const theme = pet.themeColor || C.purple;

  return (
    <motion.div
      layout
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex items-center gap-3 overflow-hidden"
      style={{
        borderRadius: 30,
        background: hovered ? `${theme}07` : 'white',
        border: `1.5px solid ${hovered ? theme + '35' : '#F3F4F6'}`,
        boxShadow: hovered ? `0 10px 36px ${theme}18` : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'background 0.2s, border 0.2s, box-shadow 0.25s',
      }}>
      <div onPointerDown={e => dragControls?.start(e)} onClick={e => e.stopPropagation()}
        className="pl-3.5 py-5 pr-1 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 select-none">
        <GripVertical size={15} className="text-gray-200" />
      </div>

      <div className="w-16 h-16 rounded-[20px] overflow-hidden flex-shrink-0 my-3"
        style={{ border: `2px solid ${theme}22` }}>
        <motion.img
          src={pet.photoUrl || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&q=70'}
          alt={pet.name} className="w-full h-full object-cover"
          animate={{ scale: hovered ? 1.14 : 1 }} transition={{ duration: 0.42 }}
        />
      </div>

      <div className="flex-1 min-w-0 py-4" onClick={onClick}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <h4 className="font-black text-gray-800 text-sm leading-none truncate">{pet.name}</h4>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pet.gender === 'MALE' ? 'bg-blue-400' : 'bg-pink-400'}`} />
          {hasMedicine && (
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
              <Pill size={11} className="text-red-500" strokeWidth={3} />
            </motion.div>
          )}
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider truncate mb-1.5" style={{ color: theme }}>
          {pet.breed || 'SRD'}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-gray-400">
            <Calendar size={10} />
            <span className="text-[10px] font-bold">{pet.ageYears || '0'}a {pet.ageMonths || '0'}m</span>
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <Weight size={10} />
            <span className="text-[10px] font-bold">{pet.weight || '?'}kg</span>
          </span>
          {hasVaccine
            ? <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Vacinas</span>
            : <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">💉 Pendente</span>
          }
          {hasMedicine && (
            <span className="text-[8px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Em tratamento</span>
          )}
        </div>
      </div>

      <div className="pr-4 pl-1 flex-shrink-0" onClick={onClick}>
        <motion.div animate={{ x: hovered ? 3 : 0 }} transition={{ duration: 0.2 }}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: hovered ? `${theme}14` : '#F9FAFB' }}>
          <ChevronRight size={16} style={{ color: hovered ? theme : '#D1D5DB' }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function DraggableCard({ pet, viewMode, onClick }) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item value={pet} id={pet.id} dragListener={false}
      dragControls={dragControls} style={{ listStyle: 'none', outline: 'none' }}>
      {viewMode === 'grid'
        ? <GridCard pet={pet} onClick={onClick} />
        : <ListCard pet={pet} onClick={onClick} dragControls={dragControls} />}
    </Reorder.Item>
  );
}

export default function Cats() {
  const navigate = useNavigate();
  const touch    = useSensory();
  const { user } = useContext(AuthContext);

  const [cats,       setCats]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [viewMode,   setViewMode]   = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderDirty, setOrderDirty] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/pets').then(res => {
      const active = (res.data || []).filter(c => !c.isMemorial && !c.isArchived);
      const sorted = active.sort((a, b) => {
        const aU = a.healthRecords?.some(r => ['MEDICINE','MEDICATION'].includes(r.type)) ? 0 : 1;
        const bU = b.healthRecords?.some(r => ['MEDICINE','MEDICATION'].includes(r.type)) ? 0 : 1;
        return aU - bU;
      });
      setCats(sorted);
    }).catch(() => setCats([])).finally(() => setLoading(false));
  }, [user]);

  const saveOrder = async () => {
    try {
      await api.patch('/pets/reorder', { order: cats.map((c, i) => ({ id: c.id, position: i })) });
      setOrderDirty(false);
      touch();
    } catch {}
  };

  const filtered = cats.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-40">
      <div className="bg-[#6158ca] pt-12 pb-24 px-6 rounded-b-[60px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full -ml-10 -mb-10 opacity-20"
          style={{ background: `radial-gradient(circle, ${C.accent} 0%, transparent 70%)` }} />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <button onClick={() => navigate('/home')}
            className="bg-white/10 backdrop-blur-xl p-3 rounded-[22px] text-white border border-white/20">
            <ArrowLeft size={22} />
          </button>
          <div className="flex bg-black/20 backdrop-blur-md p-1.5 rounded-[22px] border border-white/10 gap-0.5">
            <button onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-[18px] transition-all ${viewMode === 'grid' ? 'bg-[#ebfc66] text-[#6158ca] shadow-lg' : 'text-white/60'}`}>
              <LayoutGrid size={20} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-[18px] transition-all ${viewMode === 'list' ? 'bg-[#ebfc66] text-[#6158ca] shadow-lg' : 'text-white/60'}`}>
              <List size={20} />
            </button>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[#ebfc66] text-[10px] font-black uppercase tracking-[4px] mb-1">Sua Família</p>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Meus Gatos</h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1.5">
            {cats.length} ativo{cats.length !== 1 ? 's' : ''} cadastrado{cats.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="px-5 -mt-10 relative z-20 space-y-4 max-w-[800px] mx-auto">
        <div className="bg-white rounded-[30px] p-2 shadow-xl shadow-indigo-900/5 flex items-center border border-gray-50">
          <div className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-gray-50/50 rounded-[25px]">
            <Search size={20} className="text-gray-300" />
            <input
              className="bg-transparent border-none outline-none text-sm font-bold w-full text-gray-700 placeholder-gray-300"
              placeholder="Localizar gatinho..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-300 text-xs font-black">✕</button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {orderDirty && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between bg-white rounded-[22px] px-4 py-3 shadow-sm"
              style={{ border: `1.5px solid ${C.purple}25` }}>
              <p className="text-xs font-black text-gray-600 flex items-center gap-2">
                <GripVertical size={13} className="text-gray-400" />
                Nova ordem não salva
              </p>
              <button onClick={saveOrder}
                className="text-[10px] font-black px-4 py-2 rounded-full text-white shadow"
                style={{ background: C.purple }}>
                Salvar ordem
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
            {[1,2,3,4].map(i => (
              <div key={i} className={`bg-gray-100 animate-pulse rounded-[32px] ${viewMode === 'grid' ? 'h-72' : 'h-24'}`} />
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <Reorder.Group axis="y" values={filtered}
              onReorder={(o) => { setCats(o); setOrderDirty(true); }}
              className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}
              style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filtered.map(cat => (
                <DraggableCard key={cat.id} pet={cat} viewMode={viewMode}
                  onClick={() => { touch(); navigate(`/cat/${cat.id}`); }} />
              ))}
            </Reorder.Group>

            {viewMode === 'list' && filtered.length > 1 && !orderDirty && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-[3px] flex items-center justify-center gap-1.5 pt-1">
                <GripVertical size={11} />
                Segure e arraste para reordenar
              </motion.p>
            )}
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4">🐱</div>
            <p className="font-black text-gray-400 text-sm uppercase tracking-widest">
              {searchTerm ? 'Nenhum resultado' : 'Nenhum gatinho ativo'}
            </p>
          </div>
        )}
      </div>

      <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        onClick={() => { touch(); navigate('/cat-new'); }}
        className="fixed bottom-28 right-5 w-16 h-16 bg-[#6158ca] rounded-[24px] flex items-center justify-center text-[#ebfc66] z-[999] border-4 border-white"
        style={{ boxShadow: '0 8px 32px rgba(97,88,202,0.45)' }}>
        <Plus size={30} strokeWidth={3} />
      </motion.button>
    </div>
  );
}