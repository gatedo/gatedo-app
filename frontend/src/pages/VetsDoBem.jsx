import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Stethoscope, MapPin, Star, Share2,
  Search, ShieldCheck, Phone, Navigation, Heart, Lock, Users, Building2, X
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

const PREVIEW_VETS = [
  {
    id: 1,
    name: 'Dr. Ricardo Silva',
    clinic: 'Gatos & Cia',
    rating: 4.9,
    reviews: 124,
    dist: '0.8km',
    img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80',
    tags: ['Cat Friendly', 'Raio-X'],
    isOpen: true,
    isVerified: true,
    phone: '11999999999',
    address: 'Rua dos Gatos, 123, São Paulo',
    indicators: [],
  },
  {
    id: 2,
    name: 'Clínica 24h VetLife',
    clinic: 'VetLife Hospital',
    rating: 4.5,
    reviews: 89,
    dist: '3.2km',
    img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=150&q=80',
    tags: ['24h', 'Emergência'],
    isOpen: true,
    isVerified: false,
    phone: '11888888888',
    address: 'Av. Veterinária, 500, São Paulo',
    indicators: [],
  },
];

const STORAGE_KEY = 'gatedo_vets_preview_signals';

function ComingSoonModal({ open, onClose }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-[#0B1020]/40 backdrop-blur-[3px] px-5 flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="w-full max-w-md rounded-[30px] bg-white shadow-[0_25px_90px_rgba(54,35,94,0.22)] border border-white/70 overflow-hidden"
        >
          <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-[#8B4AFF] via-[#7B61FF] to-[#5B7CFF] text-white relative overflow-hidden">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
            <div className="w-14 h-14 rounded-2xl bg-white/14 border border-white/20 flex items-center justify-center mb-4">
              <Stethoscope size={28} />
            </div>
            <h2 className="text-xl font-black leading-tight">Guia Veterinário em construção</h2>
            <p className="mt-2 text-sm text-white/90 leading-relaxed font-medium">
              Este módulo será implementado conforme a adesão real da plataforma e alimentado pelas indicações dos próprios tutores dentro do app.
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-[#EEEAFD] bg-[#FAF9FF] p-4">
                <div className="flex items-center gap-2 text-[#7B61FF] font-black text-sm mb-2">
                  <Users size={16} /> Tutor indica
                </div>
                <p className="text-xs text-[#6F6B7D] leading-relaxed font-semibold">
                  veterinários e clínicas informados no HealthForm já ficam pré-mapeados para o ranking futuro.
                </p>
              </div>
              <div className="rounded-[22px] border border-[#EEEAFD] bg-[#FAF9FF] p-4">
                <div className="flex items-center gap-2 text-[#7B61FF] font-black text-sm mb-2">
                  <Building2 size={16} /> MVP+
                </div>
                <p className="text-xs text-[#6F6B7D] leading-relaxed font-semibold">
                  ranking social com validação por tutores, mini avatares e prova comunitária.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full h-12 rounded-[18px] bg-gradient-to-r from-[#8B4AFF] to-[#5B34F2] text-white font-black text-sm shadow-[0_12px_30px_rgba(109,69,255,0.28)]"
            >
              Entendi, seguir em modo prévia
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PreviewActionButton({ icon: Icon, label, secondary = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
        secondary
          ? 'bg-green-50 text-green-600 border border-green-100'
          : 'bg-[#8B4AFF] text-white shadow-lg shadow-indigo-100'
      }`}
    >
      <Icon size={14} /> {label}
      <Lock size={12} className={secondary ? 'text-green-500/70' : 'text-white/80'} />
    </button>
  );
}

export default function VetsDoBem() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [filter, setFilter] = useState('todos');
  const [showModal, setShowModal] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setShowModal(true);
  }, []);

  const previewSignals = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const mergedVets = useMemo(() => {
    const map = new Map();

    PREVIEW_VETS.forEach((item) => {
      map.set(`base-${item.id}`, { ...item, source: 'base' });
    });

    previewSignals.forEach((entry, idx) => {
      const vetName = entry?.vetName?.trim();
      const clinicName = entry?.clinicName?.trim();
      const key = `${vetName || 'vet'}-${clinicName || 'clinic'}`.toLowerCase();
      const indicators = Array.isArray(entry?.indicators) ? entry.indicators : [];
      const base = map.get(key);

      if (base) {
        base.indicators = [...(base.indicators || []), ...indicators];
        base.reviews = Math.max(base.reviews || 0, indicators.length || 0);
        return;
      }

      map.set(key, {
        id: `preview-${idx}`,
        name: vetName || clinicName || 'Indicação em preparação',
        clinic: clinicName || 'Clínica informada por tutores',
        rating: 5,
        reviews: indicators.length || 1,
        dist: 'comunidade',
        img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80',
        tags: ['Prévia', 'Indicações reais'],
        isOpen: false,
        isVerified: false,
        phone: entry?.phone || '',
        address: entry?.address || '',
        indicators,
        source: 'preview',
      });
    });

    return Array.from(map.values()).sort((a, b) => (b?.indicators?.length || 0) - (a?.indicators?.length || 0));
  }, [previewSignals]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mergedVets;
    return mergedVets.filter((item) => [item.name, item.clinic, ...(item.tags || [])].join(' ').toLowerCase().includes(q));
  }, [mergedVets, query]);

  const reopenPreview = () => {
    touch?.();
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32 pt-6 px-5 font-sans relative overflow-hidden">
      <ComingSoonModal open={showModal} onClose={() => setShowModal(false)} />

      <div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10" />

      <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[color:var(--gatedo-light-bg)]/90 backdrop-blur-sm z-20 py-2">
        <button onClick={() => { touch?.(); navigate(-1); }} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600 border border-gray-100 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            Guia <span className="text-green-600">Vet</span> <ShieldCheck size={20} className="text-green-600" />
          </h1>
          <p className="text-xs text-gray-400 font-bold">Modo prévia do futuro guia veterinário GATEDO.</p>
        </div>
        <button onClick={reopenPreview} className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-green-600 border border-green-100 relative hover:scale-105 transition-transform">
          <Heart size={20} />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </div>

      <div className="sticky top-16 z-20 space-y-3 bg-[var(--gatedo-light-bg)] pb-2">
        <div className="bg-white p-3 rounded-[20px] shadow-sm flex items-center gap-3 border border-gray-100">
          <Search size={20} className="text-gray-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clínica, vet ou bairro..."
            className="flex-1 outline-none text-sm font-bold text-gray-700 placeholder-gray-300 bg-transparent"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['Perto de mim', '24h', 'Cat Friendly', 'Especialistas'].map((tag, i) => (
            <button
              key={i}
              onClick={() => { touch?.(); setFilter(tag); reopenPreview(); }}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${filter === tag ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:border-green-200 hover:text-green-600'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="mb-6 bg-gradient-to-br from-green-400 to-teal-500 rounded-[24px] p-6 text-white relative overflow-hidden shadow-lg shadow-green-200"
      >
        <div className="relative z-10">
          <h3 className="text-lg font-black mb-1">Guia em construção comunitária</h3>
          <p className="text-xs font-medium opacity-90 mb-4 max-w-[90%] leading-relaxed">
            Os dados informados pelos tutores no HealthForm já preparam a inteligência do ranking futuro de veterinários e clínicas.
          </p>
          <button
            onClick={reopenPreview}
            className="bg-white text-green-600 px-5 py-2.5 rounded-full text-xs font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-sm"
          >
            <Share2 size={16} /> Entender o modo prévia
          </button>
        </div>
        <Stethoscope size={120} className="absolute -right-6 -bottom-6 opacity-20 rotate-[-15deg] text-white" />
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-[22px] border border-gray-100 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#8B4AFF] mb-2">Indicações mapeadas</p>
          <div className="text-3xl font-black text-[#28243B] leading-none">{previewSignals.length}</div>
          <p className="text-xs text-[#7E7A8E] font-semibold mt-2">indicações salvas para futura inteligência</p>
        </div>
        <div className="bg-white rounded-[22px] border border-gray-100 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#8B4AFF] mb-2">MVP+</p>
          <div className="text-3xl font-black text-[#28243B] leading-none">{mergedVets.length}</div>
          <p className="text-xs text-[#7E7A8E] font-semibold mt-2">ranking social com validação por tutores</p>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((vet) => (
          <motion.div
            key={vet.id}
            whileTap={{ scale: 0.98 }}
            className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden"
          >
            {vet.isVerified && (
              <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-sm">
                <ShieldCheck size={10} /> VERIFICADO
              </div>
            )}

            <div className="flex gap-4">
              <div className="relative">
                <img src={vet.img} alt={vet.name} className="w-20 h-20 rounded-[18px] object-cover border-2 border-white shadow-sm bg-gray-100" />
                {vet.isOpen && (
                  <div className="absolute -bottom-2 -right-1 bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-white flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Aberto
                  </div>
                )}
              </div>

              <div className="flex-1 pt-1">
                <h3 className="font-black text-gray-800 text-base leading-tight mb-1">{vet.name}</h3>
                <p className="text-xs text-gray-500 font-medium mb-2">{vet.clinic}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(vet.tags || []).map((tag) => (
                    <span key={tag} className="text-[9px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md font-bold border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 border-t border-gray-50 pt-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-black text-gray-700">{vet.rating}</span>
                    <span className="text-[10px] text-gray-400">({vet.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin size={12} />
                    <span className="text-xs font-bold">{vet.dist}</span>
                  </div>
                  {(vet.indicators?.length || 0) > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {vet.indicators.slice(0, 3).map((person, idx) => (
                          <div
                            key={`${person?.name || 'tutor'}-${idx}`}
                            title={person?.name || 'Tutor'}
                            className="w-6 h-6 rounded-full border-2 border-white bg-[#EFE9FF] text-[#6E46FF] text-[10px] font-black flex items-center justify-center overflow-hidden"
                          >
                            {person?.avatar ? (
                              <img src={person.avatar} alt={person?.name || 'Tutor'} className="w-full h-full object-cover" />
                            ) : (
                              (person?.name || '?').trim().charAt(0).toUpperCase()
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] text-[#7E7A8E] font-bold">{vet.indicators.length} tutor(es) indicaram</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <PreviewActionButton icon={Phone} label="Ligar" onClick={reopenPreview} />
              <PreviewActionButton icon={Navigation} label="Ir Agora" secondary onClick={reopenPreview} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
