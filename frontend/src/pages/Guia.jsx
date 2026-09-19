import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, BookOpen, ChevronRight, AlertTriangle, AlertOctagon } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', bg: '#F4F3FF' };

const URGENCY_META = {
  ROTINA: { label: 'Rotina', color: '#10B981', bg: '#ECFDF5' },
  ATENCAO: { label: 'Atenção', color: '#F59E0B', bg: '#FFFBEB', icon: AlertTriangle },
  EMERGENCIA: { label: 'Emergência', color: '#DC2626', bg: '#FEF2F2', icon: AlertOctagon },
};

function UrgencyBadge({ urgency }) {
  const meta = URGENCY_META[urgency];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide shrink-0"
      style={{ background: meta.bg, color: meta.color }}
    >
      {Icon && <Icon size={10} />}
      {meta.label}
    </span>
  );
}

export default function Guia() {
  const navigate = useNavigate();
  const location = useLocation();
  const touch = useSensory();
  const catId = location.state?.catId || null;

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/content/guide-categories').then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  const isBrowsing = Boolean(query.trim()) || Boolean(activeCategory);

  useEffect(() => {
    if (!isBrowsing) return;
    setLoading(true);
    const params = {};
    if (activeCategory) params.categoryId = activeCategory.id;
    if (query.trim()) params.q = query.trim();

    const timeout = setTimeout(() => {
      api
        .get('/content/guides', { params })
        .then((r) => setEntries(Array.isArray(r.data) ? r.data : []))
        .catch(() => setEntries([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [activeCategory, query, isBrowsing]);

  const openEntry = (entry) => {
    touch('nav');
    navigate(`/guia/${entry.slug}`, { state: { catId } });
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: C.bg }}>
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => {
              touch();
              if (activeCategory && !query.trim()) { setActiveCategory(null); return; }
              navigate(-1);
            }}
            className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm"
            style={{ color: C.purple }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">Biblioteca</p>
            <h1 className="text-xl font-black text-gray-900 leading-none mt-1">
              {activeCategory ? activeCategory.nome : 'Almanaque Gatedo'}
            </h1>
          </div>
        </div>

        {/* Busca — acesso principal */}
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          <Search size={16} className="text-gray-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busque pelo que está acontecendo com seu gato..."
            className="flex-1 text-sm font-medium outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Índice de categorias — navegação secundária */}
      {!isBrowsing && (
        <div className="px-5 grid grid-cols-2 gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { touch('nav'); setActiveCategory(cat); }}
              className="text-left bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm"
            >
              <p className="text-[13px] font-black text-gray-800 mb-1">{cat.nome}</p>
              <p className="text-[10px] font-medium text-gray-400 leading-snug mb-2 line-clamp-2">{cat.descricao}</p>
              <p className="text-[10px] font-black" style={{ color: C.purple }}>{cat.count} verbete{cat.count === 1 ? '' : 's'}</p>
            </button>
          ))}
        </div>
      )}

      {/* Resultados de busca / categoria */}
      {isBrowsing && (
        <div className="px-5 space-y-2.5">
          {loading && <p className="text-center text-[12px] font-medium text-gray-400 py-10">Carregando...</p>}

          {!loading && entries.length === 0 && (
            <p className="text-center text-[12px] font-medium text-gray-400 py-10">
              Nenhum verbete encontrado{query ? ` para "${query}"` : ''}.
            </p>
          )}

          {entries.map((entry) => (
            <motion.button
              key={entry.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => openEntry(entry)}
              className="w-full text-left bg-white rounded-[22px] p-4 border border-gray-100 shadow-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F1E9FF' }}>
                <BookOpen size={18} style={{ color: C.purple }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-[13px] font-black text-gray-800 truncate">{entry.title}</p>
                </div>
                <p className="text-[11px] font-medium text-gray-400 truncate">{entry.excerpt || entry.category?.nome}</p>
              </div>
              <UrgencyBadge urgency={entry.urgency} />
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
