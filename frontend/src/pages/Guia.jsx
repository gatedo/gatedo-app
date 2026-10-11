import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, ChevronRight, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { entryCover, guideGradient, guideVisual } from '../utils/guideVisuals';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6' };

const URGENCY_META = {
  ROTINA: { label: 'Rotina', color: '#047857', bg: '#ECFDF5' },
  ATENCAO: { label: 'Atenção', color: '#B45309', bg: '#FFFBEB', icon: AlertTriangle },
  EMERGENCIA: { label: 'Emergência', color: '#B91C1C', bg: '#FEF2F2', icon: AlertOctagon },
};

function UrgencyBadge({ urgency }) {
  const meta = URGENCY_META[urgency];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0"
      style={{ background: meta.bg, color: meta.color }}
    >
      {Icon && <Icon size={11} />}
      {meta.label}
    </span>
  );
}

// Banner da categoria: imagem do admin, ou degradê + emoji da categoria.
function CategoryArt({ category, className = '', emojiSize = 'text-5xl' }) {
  const v = guideVisual(category?.id);
  if (category?.coverUrl) {
    return <img src={category.coverUrl} alt="" className={`w-full h-full object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div className={`w-full h-full relative overflow-hidden ${className}`} style={{ background: guideGradient(category?.id) }}>
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/15" />
      <div className="absolute -left-8 -bottom-10 w-28 h-28 rounded-full bg-black/5" />
      <span className={`absolute right-4 bottom-3 ${emojiSize} drop-shadow-sm`} aria-hidden="true">{v.emoji}</span>
    </div>
  );
}

function EntryThumb({ entry }) {
  const cover = entryCover(entry);
  const v = guideVisual(entry?.category?.id);
  return (
    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0" style={cover ? undefined : { background: guideGradient(entry?.category?.id) }}>
      {cover
        ? <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />
        : <div className="w-full h-full flex items-center justify-center text-2xl" aria-hidden="true">{v.emoji}</div>}
    </div>
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
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    api.get('/content/guide-categories')
      .then((r) => setCategories(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  const isBrowsing = Boolean(query.trim()) || Boolean(activeCategory);

  useEffect(() => {
    if (!isBrowsing) return undefined;
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

  const totalEntries = categories.reduce((s, c) => s + (c.count || 0), 0);

  return (
    <div className="min-h-screen pb-32 bg-[var(--gatedo-light-bg)]">
      <div className="max-w-[920px] mx-auto">
        <div className="px-5 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => {
                touch();
                if (activeCategory && !query.trim()) { setActiveCategory(null); return; }
                navigate(-1);
              }}
              aria-label="Voltar"
              className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm"
              style={{ color: C.purple }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[12px] font-black uppercase tracking-[3px] text-gray-400">Biblioteca</p>
              <h1 className="text-2xl font-black text-gray-900 leading-none mt-1">
                {activeCategory ? activeCategory.nome : 'Almanaque Gatedo'}
              </h1>
            </div>
          </div>

          {/* Busca — acesso principal */}
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100">
            <Search size={18} className="text-gray-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque pelo que está acontecendo com seu gato..."
              className="flex-1 text-[15px] font-medium outline-none bg-transparent"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca" className="text-gray-300">
                <X size={16} />
              </button>
            ) : null}
          </div>
          {!isBrowsing && totalEntries > 0 ? (
            <p className="text-[12px] font-bold text-gray-400 mt-2.5 px-1">
              {totalEntries} verbetes em {categories.length} temas, escritos para o dia a dia de quem tem gato.
            </p>
          ) : null}
        </div>

        {/* Índice de categorias */}
        {!isBrowsing && (
          <div className="px-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {loadingCats
              ? [0, 1, 2, 3].map((i) => <div key={i} className="h-[196px] rounded-[26px] bg-white/70 animate-pulse" />)
              : categories.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { touch('nav'); setActiveCategory(cat); }}
                  className="text-left bg-white rounded-[26px] overflow-hidden border border-gray-100 shadow-sm group"
                >
                  <div className="h-[104px] overflow-hidden">
                    <CategoryArt category={cat} className="transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[16px] font-black text-gray-900">{cat.nome}</p>
                      <span className="text-[12px] font-black px-2.5 py-1 rounded-full shrink-0" style={{ background: '#F4F0FF', color: C.purple }}>
                        {cat.count} {cat.count === 1 ? 'verbete' : 'verbetes'}
                      </span>
                    </div>
                    {cat.descricao ? <p className="text-[13px] font-medium text-gray-500 leading-snug mt-1 line-clamp-2">{cat.descricao}</p> : null}
                  </div>
                </motion.button>
              ))}
          </div>
        )}

        {/* Banner da categoria aberta */}
        {activeCategory && !query.trim() ? (
          <div className="px-5 mb-4">
            <div className="h-[140px] rounded-[26px] overflow-hidden relative shadow-sm">
              <CategoryArt category={activeCategory} emojiSize="text-6xl" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent 65%)' }} />
              {activeCategory.descricao ? (
                <p className="absolute left-5 right-5 bottom-4 text-white text-[14px] font-bold leading-snug drop-shadow">{activeCategory.descricao}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Resultados de busca / categoria */}
        {isBrowsing && (
          <div className="px-5 space-y-3">
            {loading && <p className="text-center text-[13px] font-medium text-gray-400 py-10">Carregando...</p>}

            {!loading && entries.length === 0 && (
              <p className="text-center text-[13px] font-medium text-gray-400 py-10">
                Nenhum verbete encontrado{query ? ` para "${query}"` : ''}.
              </p>
            )}

            {!loading && entries.map((entry) => (
              <motion.button
                key={entry.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => openEntry(entry)}
                className="w-full text-left bg-white rounded-[22px] p-3 pr-4 border border-gray-100 shadow-sm flex items-center gap-3.5"
              >
                <EntryThumb entry={entry} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-black text-gray-900 leading-snug line-clamp-2">{entry.title}</p>
                  <p className="text-[12px] font-medium text-gray-500 leading-snug mt-0.5 line-clamp-2">{entry.excerpt || entry.category?.nome}</p>
                  {entry.urgency ? <div className="mt-1.5"><UrgencyBadge urgency={entry.urgency} /></div> : null}
                </div>
                <ChevronRight size={18} className="text-gray-300 shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
