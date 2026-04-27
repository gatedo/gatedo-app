import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MapPin, Filter, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const FALLBACK_CAT = '/assets/App_gatedo_logo1.webp';

function safeImg(url) {
  return url && String(url).trim() ? url : FALLBACK_CAT;
}

function calcAgeLabel(cat) {
  const years = Number(cat?.ageYears ?? cat?.age ?? null);
  const months = Number(cat?.ageMonths ?? null);

  if (Number.isFinite(years) && years > 0) {
    return `${years}a`;
  }

  if (Number.isFinite(months) && months > 0) {
    return `${months}m`;
  }

  if (cat?.birthDate) {
    try {
      const birth = new Date(cat.birthDate);
      const now = new Date();
      let ageYears = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) ageYears--;
      if (ageYears > 0) return `${ageYears}a`;
    } catch {}
  }

  return '';
}

function getProgressPercent(cat) {
  const xp =
    Number(
      cat?.xpg ??
      cat?.xp ??
      cat?.progressXp ??
      cat?.gamification?.xp ??
      0
    ) || 0;

  const level =
    Number(
      cat?.level ??
      cat?.gamification?.level ??
      1
    ) || 1;

  const nextLevelBase = Math.max(100, level * 100);
  return Math.max(8, Math.min(100, Math.round((xp / nextLevelBase) * 100)));
}

function normalizeCity(cat) {
  return (
    cat?.city ||
    cat?.location?.city ||
    cat?.owner?.city ||
    ''
  );
}

function normalizeRace(cat) {
  return cat?.breed || cat?.race || 'SRD';
}

function normalizeSex(cat) {
  return String(cat?.sex || cat?.gender || '').toLowerCase();
}

function normalizeJoinedAt(cat) {
  return cat?.createdAt || cat?.joinedAt || cat?.communityJoinedAt || null;
}

function normalizeNickname(cat) {
  return cat?.nickname || cat?.slug || cat?.socialNickname || '';
}

function ProgressRing({ percent, size = 62, stroke = 4, imageUrl, alt }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(209,213,219,0.7)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#communityCatProgressGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dash}
        />
        <defs>
          <linearGradient id="communityCatProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e5ff00" />
            <stop offset="100%" stopColor="#823fff" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-[5px] rounded-full overflow-hidden border-2 border-white bg-white shadow-sm">
        <img
          src={safeImg(imageUrl)}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_CAT;
          }}
        />
      </div>
    </div>
  );
}

function CatBubble({ cat, onSelect }) {
  const percent = getProgressPercent(cat);
  const nickname = normalizeNickname(cat);

  return (
    <button
      onClick={() => onSelect?.(cat)}
      className="flex flex-col items-center gap-1.5 min-w-[74px] max-w-[78px]"
      title={`${cat.name}${nickname ? ` • @${nickname}` : ''}`}
    >
      <ProgressRing
        percent={percent}
        imageUrl={cat.photoUrl || cat.img || cat.imageUrl}
        alt={cat.name}
      />
      <span className="text-[10px] font-black text-gray-700 truncate w-full text-center">
        {cat.name}
      </span>
      {nickname ? (
        <span className="text-[8px] font-bold text-gray-400 truncate w-full text-center">
          @{nickname}
        </span>
      ) : null}
    </button>
  );
}

export default function CommunityCatsBar({
  followedCatIds = [],
  onSelectCat,
  onAddPress,
}) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);

  const [scope, setScope] = useState('all');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [raceFilter, setRaceFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sexFilter, setSexFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const followedSet = useMemo(() => new Set(followedCatIds || []), [followedCatIds]);

  const races = useMemo(() => {
    return ['all', ...new Set(cats.map((c) => normalizeRace(c)).filter(Boolean))];
  }, [cats]);

  const cities = useMemo(() => {
    return ['all', ...new Set(cats.map((c) => normalizeCity(c)).filter(Boolean))];
  }, [cats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchDraft.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchDraft]);

  useEffect(() => {
    let active = true;

    const loadCats = async () => {
      setLoading(true);

      try {
        const params = {
          scope: scope === 'following' ? 'following' : 'all',
          q: search || undefined,
          race: raceFilter !== 'all' ? raceFilter : undefined,
          city: cityFilter !== 'all' ? cityFilter : undefined,
          sex: sexFilter !== 'all' ? sexFilter : undefined,
          sort:
            sortBy === 'newest'
              ? 'newest'
              : sortBy === 'name'
              ? 'name'
              : sortBy === 'xpg'
              ? 'xpg'
              : 'newest',
        };

        const res = await api.get('/social/community-cats', { params });
        const list = Array.isArray(res.data) ? res.data : [];

        if (active) {
          setCats(list);
        }
      } catch (err) {
        console.error('Erro ao carregar gatos da comunidade:', err);
        if (active) setCats([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCats();

    return () => {
      active = false;
    };
  }, [scope, search, raceFilter, cityFilter, sexFilter, sortBy]);

  const filteredCats = useMemo(() => {
    let list = [...cats];

    if (scope === 'following' && followedSet.size > 0) {
      list = list.filter((cat) => cat.followedByMe || followedSet.has(cat.id));
    }

    if (ageFilter !== 'all') {
      list = list.filter((cat) => {
        const ageYears = Number(cat?.ageYears ?? null);
        if (!Number.isFinite(ageYears)) return false;
        if (ageFilter === 'baby') return ageYears <= 1;
        if (ageFilter === 'young') return ageYears >= 2 && ageYears <= 4;
        if (ageFilter === 'adult') return ageYears >= 5 && ageYears <= 8;
        if (ageFilter === 'senior') return ageYears >= 9;
        return true;
      });
    }

    if (sortBy === 'oldest') {
      list.sort((a, b) => {
        const da = normalizeJoinedAt(a) ? new Date(normalizeJoinedAt(a)).getTime() : 0;
        const db = normalizeJoinedAt(b) ? new Date(normalizeJoinedAt(b)).getTime() : 0;
        return da - db;
      });
    }

    return list;
  }, [cats, scope, followedSet, ageFilter, sortBy]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setScope('all')}
          className="px-3 py-1.5 rounded-full text-[10px] font-black"
          style={scope === 'all'
            ? { background: '#823fff', color: '#fff' }
            : { background: '#F3F4F6', color: '#6B7280' }}
        >
          Toda Comunigato
        </button>

        <button
          onClick={() => setScope('following')}
          className="px-3 py-1.5 rounded-full text-[10px] font-black"
          style={scope === 'following'
            ? { background: '#823fff', color: '#fff' }
            : { background: '#F3F4F6', color: '#6B7280' }}
        >
          Só os que sigo
        </button>

        <button
          onClick={() => setShowFilters((s) => !s)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black"
          style={{ background: '#F3F4F6', color: '#6B7280' }}
        >
          <Filter size={12} />
          Filtros
          <ChevronDown size={12} className={showFilters ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-100">
        <Search size={14} className="text-gray-400" />
        <input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Buscar por nome, id, tutor ou nickname"
          className="flex-1 bg-transparent outline-none text-sm text-gray-700 font-medium"
        />
        <button
          onClick={onAddPress}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#823fff', color: '#fff' }}
        >
          <Plus size={14} />
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <select
            value={raceFilter}
            onChange={(e) => setRaceFilter(e.target.value)}
            className="rounded-[14px] px-3 py-2 text-[11px] font-bold border border-gray-200 bg-white text-gray-700 outline-none"
          >
            <option value="all">Todas as raças</option>
            {races.filter((r) => r !== 'all').map((race) => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="rounded-[14px] px-3 py-2 text-[11px] font-bold border border-gray-200 bg-white text-gray-700 outline-none"
          >
            <option value="all">Todas as cidades</option>
            {cities.filter((c) => c !== 'all').map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={sexFilter}
            onChange={(e) => setSexFilter(e.target.value)}
            className="rounded-[14px] px-3 py-2 text-[11px] font-bold border border-gray-200 bg-white text-gray-700 outline-none"
          >
            <option value="all">Todos os sexos</option>
            <option value="macho">Macho</option>
            <option value="fêmea">Fêmea</option>
            <option value="femea">Fêmea</option>
          </select>

          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="rounded-[14px] px-3 py-2 text-[11px] font-bold border border-gray-200 bg-white text-gray-700 outline-none"
          >
            <option value="all">Todas as idades</option>
            <option value="baby">Até 1 ano</option>
            <option value="young">2 a 4 anos</option>
            <option value="adult">5 a 8 anos</option>
            <option value="senior">9+ anos</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-[14px] px-3 py-2 text-[11px] font-bold border border-gray-200 bg-white text-gray-700 outline-none"
          >
            <option value="newest">Mais novos</option>
            <option value="oldest">Mais antigos</option>
            <option value="xpg">Mais XPGs</option>
            <option value="name">Nome A-Z</option>
          </select>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-1">
        {loading ? (
          <div className="w-full rounded-[18px] p-4 bg-gray-50 border border-gray-100 text-center">
            <p className="text-[11px] font-black text-gray-600">Carregando gatos da comunidade...</p>
          </div>
        ) : filteredCats.length === 0 ? (
          <div className="w-full rounded-[18px] p-4 bg-gray-50 border border-gray-100 text-center">
            <p className="text-[11px] font-black text-gray-600">Nenhum gato encontrado</p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              Ajuste a busca ou os filtros.
            </p>
          </div>
        ) : (
          filteredCats.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center">
              <CatBubble cat={cat} onSelect={onSelectCat} />
           <div className="hidden">
  {cat.nickname}
  {cat.city}
  {cat.ageYears}
</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}