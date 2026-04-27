import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Heart,
  ChevronRight,
  ChevronLeft,
  X,
  Brain,
  TrendingUp,
} from 'lucide-react';
import useSensory from '../hooks/useSensory';
import api from '../services/api';
import { formatDateOnlyBR } from '../utils/catAge';

const FALLBACK_CAT = '/assets/App_gatedo_logo1.webp';
const PAGE_SIZE = 12;

function safeImg(url) {
  return url && String(url).trim() ? url : FALLBACK_CAT;
}

function getAgeLabel(pet) {
  if (!pet) return null;

  const years = pet.ageYears;
  const months = pet.ageMonths;

  if ((years || years === 0) && (months || months === 0)) {
    return `${years}a ${months}m`;
  }

  if (years || years === 0) return `${years} ano${Number(years) === 1 ? '' : 's'}`;
  if (months || months === 0) return `${months} mês${Number(months) === 1 ? '' : 'es'}`;

  return null;
}

function getDeathCauseLabel(value) {
  const map = {
    IRC: 'Insuficiência Renal Crônica',
    FIV: 'Imunodeficiência Felina (FIV)',
    FELV: 'Leucemia Felina (FeLV)',
    LINFOMA: 'Linfoma / Câncer',
    PIF: 'Peritonite Infecciosa Felina',
    TRAUMA: 'Trauma / Acidente',
    INFECCAO: 'Infecção Grave',
    CARDIACO: 'Problema Cardíaco',
    VELHICE: 'Velhice Natural',
    DESCONHECIDO: 'Causa Desconhecida',
    OUTRO: 'Outra causa',
  };

  return map[value] || value || null;
}

function getSlidesFromTribute(tribute) {
  const pet = tribute?.pet || {};
  const slides = [
    tribute?.photoUrl,
    pet?.photoUrl,
    ...(Array.isArray(pet?.gallery) ? pet.gallery : []),
  ].filter(Boolean);

  return [...new Set(slides)];
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-[18px] bg-black/20 border border-white/5 p-3">
      <p className="text-[9px] uppercase text-white/40 font-black tracking-widest">
        {label}
      </p>

      <p className="text-sm font-black text-white mt-1">
        {value || '—'}
      </p>
    </div>
  );
}

function MemorialIntroScreen({ tribute, onBack, onLightCandle }) {
  const pet = tribute?.pet || {};
  const tutorName = tribute?.user?.name || pet?.owner?.name || 'Tutor';
  const deathDate = pet?.deathDate
    ? formatDateOnlyBR(pet.deathDate, { month: 'long', fallback: '' })
    : tribute?.deathYear || null;

  const deathCauseLabel = getDeathCauseLabel(pet?.deathCause);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          'linear-gradient(160deg, #1a1428 0%, #2D2657 50%, #1a1428 100%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: (i % 3) + 1,
              height: (i % 3) + 1,
              top: `${(i * 17) % 70}%`,
              left: `${(i * 23) % 100}%`,
              opacity: 0.15 + (i % 4) * 0.08,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-12 max-w-[820px] mx-auto w-full">
        <button
          onClick={onBack}
          className="self-start mb-8 flex items-center gap-2 text-white/50 font-bold text-sm hover:text-white/80 transition-colors"
        >
          <ChevronLeft size={18} />
          Voltar
        </button>

        <div className="relative mb-5">
          <div
            className="w-28 h-28 rounded-full overflow-hidden border-4 shadow-2xl"
            style={{
              borderColor: 'rgba(255,255,255,0.12)',
              filter: 'grayscale(35%)',
            }}
          >
            <img
              src={safeImg(tribute?.photoUrl || pet?.photoUrl)}
              alt={tribute?.name || pet?.name || 'Gatinho'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_CAT;
              }}
            />
          </div>

          <div
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: '#1a1428',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Heart size={16} className="text-rose-400 fill-rose-400" />
          </div>
        </div>

        <h2 className="font-black text-3xl text-white tracking-tight mb-1">
          {tribute?.name || pet?.name || 'Gatinho'}
        </h2>

        {deathDate && (
          <p className="text-white/40 text-sm font-bold mb-6">{deathDate}</p>
        )}

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[28px] p-6 mb-4 text-center w-full">
          <p className="text-white/85 text-base leading-relaxed font-medium">
            {tutorName}, sabemos o quanto{' '}
            <span className="text-white font-black">
              {tribute?.name || pet?.name}
            </span>{' '}
            foi importante para você. ❤️
          </p>

          <p className="text-white/50 text-sm leading-relaxed mt-3">
            A Gatedo aprende com cada história. As informações de{' '}
            {tribute?.name || pet?.name} ajudarão a cuidar de outros felinos —{' '}
            {pet?.breed && pet.breed !== 'SRD'
              ? `especialmente outros ${pet.breed} que precisam de atenção especial.`
              : 'de outros gatinhos que precisam de cuidado.'}
          </p>
        </div>

        {deathCauseLabel && (
          <div className="w-full bg-white/5 border border-white/10 rounded-[22px] px-5 py-4 mb-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
              <Brain size={16} className="text-purple-300" />
            </div>
            <div>
              <p className="text-[9px] font-black text-purple-300/70 uppercase tracking-wider mb-0.5">
                Causa registrada
              </p>
              <p className="text-white/80 text-sm font-bold">{deathCauseLabel}</p>
              <p className="text-white/35 text-[10px] mt-0.5">
                Dados cruzados na IA preditiva da Gatedo
              </p>
            </div>
          </div>
        )}

        {pet?.breed && pet.breed !== 'SRD' && (
          <div className="w-full bg-white/5 border border-white/10 rounded-[22px] px-5 py-4 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} className="text-indigo-300" />
            </div>
            <div>
              <p className="text-[9px] font-black text-indigo-300/70 uppercase tracking-wider mb-0.5">
                Impacto na comunidade
              </p>
              <p className="text-white/70 text-sm leading-snug">
                O histórico de {tribute?.name || pet?.name} agora protege outros{' '}
                <span className="text-white font-bold">{pet.breed}</span> no sistema.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onLightCandle}
          className="w-full py-4 rounded-[22px] font-black text-white text-sm border border-yellow-400/20 transition-all"
          style={{
            background:
              'linear-gradient(180deg, rgba(234,179,8,0.10) 0%, rgba(255,255,255,0.04) 100%)',
            boxShadow: '0 0 30px rgba(234,179,8,0.08)',
          }}
        >
          🕯️ Acender uma velinha para {tribute?.name || pet?.name}
        </button>
      </div>
    </motion.div>
  );
}

function MemorialLegacyModal({ tribute, onClose }) {
  const touch = useSensory();
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => getSlidesFromTribute(tribute), [tribute]);

  useEffect(() => {
    setIndex(0);
  }, [tribute?.id]);

  if (!tribute) return null;

  const pet = tribute?.pet || {};
  const tutorName = tribute?.user?.name || pet?.owner?.name || 'Tutor';
  const ageLabel = getAgeLabel(pet);
  const currentImage = safeImg(slides[index]);
  const deathDate = pet?.deathDate
    ? formatDateOnlyBR(pet.deathDate, { fallback: '' })
    : tribute?.deathYear || null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[160] flex items-end justify-center"
        style={{
          backdropFilter: 'blur(18px)',
          background:
            'linear-gradient(180deg, rgba(12,16,28,.55) 0%, rgba(10,14,24,.92) 100%)',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-t-[40px] border-t border-white/10 bg-[#0F172A] text-white max-h-[92vh] overflow-y-auto pb-10"
        >
          <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mt-3 mb-5" />

          <div className="flex items-center justify-between px-6 mb-2">
            <div>
              <p className="text-[10px] tracking-[0.28em] font-black uppercase text-yellow-400">
                Legado
              </p>

              <h3 className="text-xl font-black">
                {tribute?.name || pet?.name}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 mt-4">
            <div className="relative rounded-[28px] overflow-hidden border border-white/10">
              <img
                src={currentImage}
                alt={pet?.name}
                className="w-full aspect-square object-cover"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_CAT;
                }}
              />

              {slides.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      touch?.();
                      setIndex((prev) =>
                        prev === 0 ? slides.length - 1 : prev - 1
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={() => {
                      touch?.();
                      setIndex((prev) =>
                        prev === slides.length - 1 ? 0 : prev + 1
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-6 mt-5">
            <div className="rounded-[24px] bg-white/5 border border-white/10 p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-yellow-400 font-black mb-1">
                Guardião do legado
              </p>

              <p className="text-lg font-black">{tutorName}</p>
            </div>
          </div>

          <div className="px-6 mt-4">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Heart size={14} className="text-yellow-400" />

                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-400">
                  Eternizado no universo Gatedo
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoBlock label="Idade" value={ageLabel} />
                <InfoBlock label="Raça" value={pet?.breed || 'SRD'} />
                <InfoBlock label="Partida" value={deathDate} />
                <InfoBlock label="Memorial" value="Ativo" />
              </div>
            </div>
          </div>

          <div className="px-6 mt-4">
            <div className="rounded-[26px] border border-yellow-400/20 bg-yellow-400/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-400 mb-3">
                Homenagem do tutor
              </p>

              <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-line">
                {tribute?.message ||
                  'Este legado ainda não recebeu uma mensagem do tutor.'}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MemorialGrid({
  tributes,
  loading,
  search,
  setSearch,
  visibleCount,
  onLoadMore,
  hasMore,
  onOpenIntro,
  onBack,
}) {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          'linear-gradient(160deg, #1a1428 0%, #2D2657 50%, #1a1428 100%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: (i % 3) + 1,
              height: (i % 3) + 1,
              top: `${(i * 11) % 100}%`,
              left: `${(i * 19) % 100}%`,
              opacity: 0.12 + (i % 4) * 0.06,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-5 pt-10 pb-28 max-w-[980px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/55 font-bold text-sm"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.28em] font-black text-yellow-500">
              Memorial
            </p>
            <p className="text-white/45 text-xs font-bold">
              {tributes.length} estrelas no universo GATEDO
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-[22px] bg-white/6 border border-white/10 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
          <Search size={16} className="text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por gato, tutor ou raça..."
            className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/30 font-medium"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/35 font-black uppercase tracking-[0.28em] text-[10px] animate-pulse">
            Invocando memórias...
          </div>
        ) : tributes.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-white/10 rounded-[32px] bg-white/5">
            <p className="text-white/45 text-sm font-bold">
              Nenhum legado encontrado.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tributes.slice(0, visibleCount).map((item, index) => {
                const pet = item?.pet || {};
                const tutorName = item?.user?.name || pet?.owner?.name || 'Tutor';

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.025, 0.2) }}
                    onClick={() => onOpenIntro(item)}
                    className="text-left bg-white/5 border border-white/10 p-4 rounded-[28px] flex items-center gap-4 relative overflow-hidden group hover:bg-white/7 transition-all"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 bg-white/5 flex-shrink-0"
                      style={{ filter: 'grayscale(30%)' }}
                    >
                      <img
                        src={safeImg(item?.photoUrl || pet?.photoUrl)}
                        alt={item?.name || pet?.name || 'Gato memorial'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_CAT;
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-100 text-lg truncate">
                        {item?.name || pet?.name || 'Gatinho'}
                      </h3>

                      <p className="text-[10px] font-black text-yellow-500/70 uppercase tracking-[0.25em] mt-1">
                        Eternizado
                      </p>

                      <p className="text-[11px] text-white/45 font-bold mt-2 truncate">
                        Tutor: {tutorName}
                      </p>

                      <p className="text-[11px] text-white/40 mt-1 truncate">
                        {item?.message
                          ? `“${item.message}”`
                          : 'Toque para ver o legado'}
                      </p>
                    </div>

                    <ChevronRight size={16} className="text-white/30 flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-7">
                <button
                  onClick={onLoadMore}
                  className="px-6 py-3 rounded-full border border-white/15 bg-white/6 text-white/70 font-black text-sm"
                >
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Memorial() {
  const navigate = useNavigate();
  const { petId } = useParams();
  const touch = useSensory();

  const [loading, setLoading] = useState(true);
  const [tributes, setTributes] = useState([]);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [introTribute, setIntroTribute] = useState(null);
  const [legacyTribute, setLegacyTribute] = useState(null);
  const [candleToast, setCandleToast] = useState(false);
  const [candleName, setCandleName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/memorial/tributes');
      const list = Array.isArray(res?.data) ? res.data : [];
      setTributes(list);
    } catch (error) {
      console.error('Erro ao carregar memorial:', error);
      setTributes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!petId || !tributes.length) return;

    const found = tributes.find((item) => item?.petId === petId || item?.pet?.id === petId);
    if (found) {
      setIntroTribute(found);
    }
  }, [petId, tributes]);

  const filteredTributes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tributes;

    return tributes.filter((item) => {
      const pet = item?.pet || {};
      const tutorName = item?.user?.name || pet?.owner?.name || '';
      const breed = pet?.breed || '';
      const name = item?.name || pet?.name || '';

      return (
        String(name).toLowerCase().includes(q) ||
        String(tutorName).toLowerCase().includes(q) ||
        String(breed).toLowerCase().includes(q)
      );
    });
  }, [tributes, search]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  const hasMore = visibleCount < filteredTributes.length;

  return (
    <>
      <MemorialLegacyModal
        tribute={legacyTribute}
        onClose={() => setLegacyTribute(null)}
      />

      <AnimatePresence>
        {candleToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[220] px-5 py-3 rounded-full text-sm font-black"
            style={{
              background: 'rgba(15,23,42,0.92)',
              color: '#FACC15',
              border: '1px solid rgba(250,204,21,0.18)',
              backdropFilter: 'blur(12px)',
            }}
          >
            🕯️ Uma luz foi acesa para {candleName || 'este gatinho'}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {introTribute ? (
          <MemorialIntroScreen
            key={`intro_${introTribute.id}`}
            tribute={introTribute}
            onBack={() => {
              setIntroTribute(null);
              if (petId) navigate('/memorial');
            }}
            onLightCandle={() => {
              const name = introTribute?.name || introTribute?.pet?.name || 'este gatinho';

              touch?.('success');
              setCandleName(name);
              setCandleToast(true);
              setIntroTribute(null);

              setTimeout(() => {
                setCandleToast(false);
                navigate('/home');
              }, 1200);
            }}
          />
        ) : (
          <MemorialGrid
            key="grid"
            tributes={filteredTributes}
            loading={loading}
            search={search}
            setSearch={setSearch}
            visibleCount={visibleCount}
            hasMore={hasMore}
            onLoadMore={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            onOpenIntro={(item) => {
              touch?.();
              setIntroTribute(item);
            }}
            onBack={() => navigate(-1)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
