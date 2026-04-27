import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Check,
  AlertTriangle,
  Award,
  Heart,
  Zap,
  Moon,
  Sun,
  Music,
  Smile,
  Star,
  Home,
  MapPin,
  FileText,
  X,
  Hash,
  Download,
  ShieldPlus,
  Activity,
  Dog,
  Cat,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CAT_THEMES, resolveCatTheme } from '../config/catThemes';
import { parseDateOnly } from '../utils/catAge';

const EXTRA_THEMES = [
  { id: 'amber', label: 'Âmbar', fromHex: '#F59E0B', toHex: '#FBBF24', accent: '#FFF7CC', back: '#7C4A03' },
  { id: 'emerald', label: 'Esmeralda', fromHex: '#10B981', toHex: '#34D399', accent: '#D1FAE5', back: '#065F46' },
  { id: 'rose', label: 'Rosé', fromHex: '#F43F5E', toHex: '#FB7185', accent: '#FFE4EA', back: '#881337' },
  { id: 'sky', label: 'Sky', fromHex: '#0EA5E9', toHex: '#38BDF8', accent: '#E0F2FE', back: '#0C4A6E' },
  { id: 'slate', label: 'Slate', fromHex: '#475569', toHex: '#64748B', accent: '#E2E8F0', back: '#1E293B' },
  { id: 'indigo', label: 'Indigo', fromHex: '#6366F1', toHex: '#818CF8', accent: '#E0E7FF', back: '#312E81' },
];

const CARD_GRADIENTS = [
  ...CAT_THEMES.map((t) => ({
    id: t.id,
    label: t.label,
    from: t.fromHex,
    to: t.toHex,
    accent: t.accent,
    back: t.back,
  })),
  ...EXTRA_THEMES.map((t) => ({
    id: t.id,
    label: t.label,
    from: t.fromHex,
    to: t.toHex,
    accent: t.accent,
    back: t.back,
  })),
];

const CIDADES_BR = [
  'São Paulo, SP','Rio de Janeiro, RJ','Belo Horizonte, MG','Salvador, BA','Fortaleza, CE',
  'Manaus, AM','Curitiba, PR','Recife, PE','Porto Alegre, RS','Belém, PA',
  'Goiânia, GO','Guarulhos, SP','Campinas, SP','São Luís, MA','São Gonçalo, RJ',
  'Maceió, AL','Natal, RN','Teresina, PI','Campo Grande, MS','João Pessoa, PB',
  'Osasco, SP','Santo André, SP','São Bernardo do Campo, SP','Ribeirão Preto, SP',
  'Uberlândia, MG','Contagem, MG','Sorocaba, SP','Aracaju, SE','Feira de Santana, BA',
  'Cuiabá, MT','Joinville, SC','Juiz de Fora, MG','Londrina, PR','Florianópolis, SC',
  'Caxias do Sul, RS','Niterói, RJ','Porto Velho, RO','Serra, ES','Vitória, ES',
  'Santos, SP','São José dos Campos, SP','Campina Grande, PB','Piracicaba, SP','Jundiaí, SP',
  'Montes Claros, MG','Anápolis, GO','São José do Rio Preto, SP','Rio Branco, AC',
  'Boa Vista, RR','Palmas, TO','Blumenau, SC','Pelotas, RS','Canoas, RS',
  'Maringá, PR','Cascavel, PR','Foz do Iguaçu, PR','Caruaru, PE','Petrolina, PE',
];

const CAT_BREEDS = [
  '(SRD) Sem raça definida',
  'Persa',
  'Siamês',
  'Maine Coon',
  'Angorá',
  'Sphynx',
  'Ragdoll',
  'British Shorthair',
  'Exótico',
  'Bengal',
  'Norueguês da Floresta',
  'Scottish Fold',
  'Abissínio',
  'Bombay',
  'Birmanês',
  'Burmese',
  'Chartreux',
  'Cornish Rex',
  'Devon Rex',
  'Himalaio',
  'Munchkin',
  'Ocicat',
  'Oriental Shorthair',
  'Russian Blue',
  'Savannah',
  'Selkirk Rex',
  'Somali',
  'Tonquinês',
  'Turkish Angora',
  'Turkish Van',
  'American Curl',
  'American Bobtail',
  'Balinês',
  'Havana Brown',
  'LaPerm',
  'Manx',
];

const DISEASE_OPTIONS = [
  'Renal',
  'FIV',
  'FeLV',
  'Diabetes',
  'Obesidade',
  'Dermatite',
  'Cardíaca',
  'Respiratória',
  'Digestiva',
  'Outra',
];

const FEED_BRANDS = [
  'Royal Canin',
  'Premier',
  'Hill’s',
  'N&D',
  'Golden',
  'Quatree',
  'Guabi Natural',
  'Purina Pro Plan',
  'Whiskas',
  'Outra',
];

const FEED_FREQUENCY_OPTIONS = ['Livre', '2x ao dia', '3x ao dia', '4x ao dia', 'Outra'];
const ARRIVAL_TYPES = ['Adoção', 'Presente', 'Compra', 'Gatil', 'Encontrado na rua', 'Resgatado'];
const COEXIST_OPTIONS = ['Nenhum', 'Gatos', 'Cachorros', 'Ambos'];
const HOUSING_TYPES = ['Apartamento', 'Casa', 'Sítio', 'Gatil', 'Outro'];

const ADD_CAT_DRAFT_VERSION = 1;

function getAddCatDraftKey(userId) {
  return userId ? `gatedo_add_cat_draft_v${ADD_CAT_DRAFT_VERSION}_${userId}` : null;
}

function serializeAddCatDraft(data) {
  const { avatarFile, avatarPreview, pedigreeFile, pedigreeBackFile, ...serializable } = data;
  return serializable;
}

function restoreAddCatDraft(data) {
  return {
    ...data,
    avatarFile: null,
    avatarPreview: null,
    pedigreeFile: null,
    pedigreeBackFile: null,
  };
}

function normalizeGenderedLabel(id, gender) {
  const female = gender === 'FEMALE';
  const labels = {
    calmo: female ? 'Calminha' : 'Calminho',
    eletrico: female ? 'Elétrica' : 'Elétrico',
    carinhoso: female ? 'Carinhosa' : 'Carinhoso',
    independente: 'Independente',
    falante: 'Falante',
    comilao: female ? 'Comilona' : 'Comilão',
    medroso: female ? 'Medrosa' : 'Medroso',
    cacador: female ? 'Caçadora' : 'Caçador',
    curiosa: female ? 'Curiosa' : 'Curioso',
    brincalhao: female ? 'Brincalhona' : 'Brincalhão',
    territorial: 'Territorial',
    sociavel: 'Sociável',
  };
  return labels[id] || id;
}

const BEHAVIOR_OPTIONS = [
  { id: 'calmo', icon: Moon, color: 'bg-blue-50 text-blue-600' },
  { id: 'eletrico', icon: Zap, color: 'bg-yellow-50 text-yellow-600' },
  { id: 'carinhoso', icon: Heart, color: 'bg-pink-50 text-pink-600' },
  { id: 'independente', icon: Star, color: 'bg-purple-50 text-purple-600' },
  { id: 'falante', icon: Music, color: 'bg-green-50 text-green-600' },
  { id: 'comilao', icon: Smile, color: 'bg-orange-50 text-orange-600' },
  { id: 'medroso', icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  { id: 'cacador', icon: Sun, color: 'bg-teal-50 text-teal-600' },
  { id: 'curiosa', icon: Sparkles, color: 'bg-fuchsia-50 text-fuchsia-600' },
  { id: 'brincalhao', icon: Activity, color: 'bg-lime-50 text-lime-700' },
  { id: 'territorial', icon: ShieldPlus, color: 'bg-slate-50 text-slate-700' },
  { id: 'sociavel', icon: Heart, color: 'bg-rose-50 text-rose-600' },
];

function onlyNumbers(v) {
  return String(v || '').replace(/\D/g, '');
}

function joinList(arr) {
  return Array.isArray(arr) && arr.length ? arr.join(', ') : '';
}

function downloadFichaTecnicaHTML(payload) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Ficha Técnica - ${payload.name}</title>
<style>
body { font-family: Arial, sans-serif; max-width: 820px; margin: 30px auto; color: #222; padding: 0 16px; }
h1 { margin-bottom: 2px; color: #4f46e5; }
h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .1em; color: #6b7280; margin-top: 28px; }
.card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; margin-top: 8px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.item { padding: 10px 12px; border-radius: 12px; background: #f9fafb; }
.label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #6b7280; margin-bottom: 6px; }
.value { font-size: 14px; font-weight: 700; color: #111827; white-space: pre-line; }
.footer { margin-top: 32px; font-size: 11px; color: #6b7280; text-align: center; }
img { width: 180px; height: 180px; object-fit: cover; border-radius: 18px; display: block; margin-bottom: 20px; }
</style>
</head>
<body>
<h1>Ficha Técnica do Gato</h1>
<p>Documento gerado pelo GATEDO</p>
${payload.avatarPreview ? `<img src="${payload.avatarPreview}" alt="${payload.name}" />` : ''}
<h2>Identificação</h2>
<div class="card">
  <div class="row">
    <div class="item"><div class="label">Nome</div><div class="value">${payload.name || '-'}</div></div>
    <div class="item"><div class="label">Apelidos carinhosos</div><div class="value">${payload.nicknames || '-'}</div></div>
    <div class="item"><div class="label">Raça</div><div class="value">${payload.displayBreed || '-'}</div></div>
    <div class="item"><div class="label">Sexo</div><div class="value">${payload.genderLabel || '-'}</div></div>
    <div class="item"><div class="label">Cidade de origem</div><div class="value">${payload.city || '-'}</div></div>
    <div class="item"><div class="label">Microchip</div><div class="value">${payload.microchipDisplay || 'Não'}</div></div>
  </div>
</div>
<h2>Origem</h2>
<div class="card">
  <div class="item"><div class="label">Como chegou até você</div><div class="value">${payload.arrivalType || '-'}</div></div>
  <div class="item"><div class="label">Informações adicionais</div><div class="value">${payload.arrivalNotes || '-'}</div></div>
</div>
<h2>Saúde & Nutrição</h2>
<div class="card">
  <div class="row">
    <div class="item"><div class="label">Peso</div><div class="value">${payload.weight || '-'}</div></div>
    <div class="item"><div class="label">Castrado</div><div class="value">${payload.neutered ? 'Sim' : 'Não'}</div></div>
    <div class="item"><div class="label">Doenças pré-existentes</div><div class="value">${payload.preExistingConditions || '-'}</div></div>
    <div class="item"><div class="label">Resumo</div><div class="value">${payload.healthSummary || '-'}</div></div>
    <div class="item"><div class="label">Marca da ração</div><div class="value">${payload.foodBrand || '-'}</div></div>
    <div class="item"><div class="label">Tipo de alimentação</div><div class="value">${payload.foodTypes || '-'}</div></div>
    <div class="item"><div class="label">Frequência</div><div class="value">${payload.feedFrequencyMode || '-'}</div></div>
    <div class="item"><div class="label">Detalhe da frequência</div><div class="value">${payload.feedFrequencyNotes || '-'}</div></div>
  </div>
</div>
<h2>Comportamento & Ambiente</h2>
<div class="card">
  <div class="row">
    <div class="item"><div class="label">Temperamento</div><div class="value">${payload.personality || '-'}</div></div>
    <div class="item"><div class="label">Convive com</div><div class="value">${payload.coexistsWith || '-'}</div></div>
    <div class="item"><div class="label">Problemas de comportamento</div><div class="value">${payload.behaviorIssues || '-'}</div></div>
    <div class="item"><div class="label">Traumas</div><div class="value">${payload.traumaHistory || '-'}</div></div>
    <div class="item"><div class="label">Habitat</div><div class="value">${payload.habitat || '-'}</div></div>
    <div class="item"><div class="label">Moradia</div><div class="value">${payload.housingType || '-'}</div></div>
  </div>
</div>
<div class="footer">
Documento técnico inicial. Pode ser salvo como PDF pelo navegador via impressão.
</div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `ficha-tecnica-${(payload.name || 'gato').toLowerCase().replace(/\s+/g, '-')}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function CitySearch({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const filtered = CIDADES_BR.filter((c) =>
      c.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);
    setResults(filtered);
    setOpen(filtered.length > 0);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (city) => {
    setQuery(city);
    onChange(city);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          className="w-full bg-gray-50 rounded-xl p-3 pl-8 text-sm outline-none placeholder-gray-400"
          placeholder="Digite a cidade de origem..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300"
            onClick={() => {
              setQuery('');
              onChange('');
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 w-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {results.map((city) => (
              <button
                key={city}
                onClick={() => select(city)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-purple-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
              >
                <MapPin size={11} className="text-[#8B4AFF] flex-shrink-0" />
                {city}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PedigreeSlot({ label, file, onSelect, onClear }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) setPreview(null);
  }, [file]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onSelect(f);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : 'pdf');
    e.target.value = '';
  };

  const clear = () => {
    setPreview(null);
    onClear();
  };

  return (
    <div className="flex-1">
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">{label}</p>
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-green-200 bg-green-50 h-24">
          {preview === 'pdf' ? (
            <div className="h-full flex flex-col items-center justify-center gap-1">
              <FileText size={20} className="text-green-600" />
              <span className="text-[10px] font-black text-green-700">PDF ✓</span>
            </div>
          ) : (
            <img src={preview} className="w-full h-full object-cover" />
          )}
          <button onClick={clear} className="absolute top-1.5 right-1.5 bg-white rounded-full p-1 shadow">
            <X size={10} className="text-gray-600" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-24 border-2 border-dashed border-[#8B4AFF]/30 rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-[#8B4AFF]/5 active:bg-[#8B4AFF]/10 transition-all"
        >
          <div className="w-8 h-8 bg-[#8B4AFF]/10 rounded-full flex items-center justify-center">
            <FileText size={16} className="text-[#8B4AFF]" />
          </div>
          <p className="text-[10px] font-black text-[#8B4AFF]">Enviar</p>
        </button>
      )}
    </div>
  );
}

function PedigreeUpload({ onChangeFront, onChangeBack, frontFile, backFile }) {
  return (
    <div className="flex gap-3">
      <PedigreeSlot label="Frente" file={frontFile} onSelect={onChangeFront} onClear={() => onChangeFront(null)} />
      <PedigreeSlot label="Verso" file={backFile} onSelect={onChangeBack} onClear={() => onChangeBack(null)} />
    </div>
  );
}

function VerticalCardPreview({
  gradient,
  name,
  breed,
  gender,
  avatarPreview,
  generatedId,
  city,
  ageLabel,
  weight,
}) {
  return (
    <div
      className="rounded-[30px] overflow-hidden shadow-2xl"
      style={{ background: `linear-gradient(180deg, ${gradient.from} 0%, ${gradient.to} 100%)` }}
    >
      <div className="p-4">
        <div className="rounded-[24px] overflow-hidden bg-white/10 border border-white/15">
          {avatarPreview ? (
            <img src={avatarPreview} className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 flex flex-col items-center justify-center gap-2 bg-black/10">
              <Camera size={34} className="text-white/80" />
              <span className="text-xs font-black uppercase tracking-widest text-white/75">
                Foto principal
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/65">RG Gatedo</p>
          <h3 className="text-2xl font-black text-white leading-tight mt-1">
            {name || 'Seu gatinho'}
          </h3>
          <p className="text-sm font-bold mt-1" style={{ color: gradient.accent }}>
            {breed || 'SRD'} · {gender === 'MALE' ? 'Macho' : gender === 'FEMALE' ? 'Fêmea' : 'N/I'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-[18px] bg-black/15 border border-white/10 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/45 font-black">Origem</p>
            <p className="text-sm font-black text-white mt-1">{city || '—'}</p>
          </div>
          <div className="rounded-[18px] bg-black/15 border border-white/10 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/45 font-black">Idade</p>
            <p className="text-sm font-black text-white mt-1">{ageLabel || '—'}</p>
          </div>
          <div className="rounded-[18px] bg-black/15 border border-white/10 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/45 font-black">Peso</p>
            <p className="text-sm font-black text-white mt-1">{weight || '—'}</p>
          </div>
          <div className="rounded-[18px] bg-black/15 border border-white/10 p-3">
            <p className="text-[9px] uppercase tracking-widest text-white/45 font-black">ID</p>
            <p className="text-sm font-black text-white mt-1">#{generatedId}</p>
          </div>
        </div>

        <div className="mt-4 rounded-[16px] px-4 py-3 bg-black/15 border border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/55">
            Documento técnico
          </span>
          <span className="text-[10px] font-black" style={{ color: gradient.accent }}>
            gatedo.com
          </span>
        </div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange, color = 'green' }) {
  const bg = value ? (color === 'red' ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-300';
  return (
    <div onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${bg}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );
}

export default function AddCat() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const avatarRef = useRef(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [generatedPetPayload, setGeneratedPetPayload] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    nicknames: '',
    gender: 'MALE',
    catType: 'SRD',
    breed: 'SRD',
    coatType: '',

    arrivalType: '',
    arrivalNotes: '',

    hasAwards: false,
    awardsDetail: '',
    hasMicrochip: false,
    microchip: '',
    city: '',

    birthDate: '',
    ageYears: '',
    ageMonths: '',
    isDateEstimated: false,

    weight: '',
    neutered: false,
    neuterIntention: '',

    preExistingConditions: [],
    healthSummary: '',

    foodType: [],
    foodBrand: '',
    foodBrandOther: '',
    feedFrequencySelector: '',
    foodFreq: '',

    personality: [],
    activityLevel: 'Média',
    coexistsWith: [],
    hasBehaviorIssues: false,
    behaviorIssues: '',
    hasTraumaHistory: false,
    traumaHistory: '',

    habitat: 'Interno',
    housingType: '',
    streetAccess: false,
    riskAreaAccess: false,

    themeColor: 'violet',
    avatarFile: null,
    avatarPreview: null,
    pedigreeFile: null,
    pedigreeBackFile: null,
  });
  const draftKey = useMemo(() => getAddCatDraftKey(user?.id), [user?.id]);
  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    setGeneratedId(Math.floor(100000 + Math.random() * 900000).toString());
  }, []);

  useEffect(() => {
    if (!draftKey) {
      setDraftLoaded(false);
      return;
    }

    setDraftLoaded(false);

    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft) {
        const parsedDraft = JSON.parse(rawDraft);
        const savedFormData = parsedDraft?.formData;
        if (savedFormData && typeof savedFormData === 'object') {
          setFormData((current) => ({
            ...current,
            ...restoreAddCatDraft(savedFormData),
          }));
        }
      }
    } catch (error) {
      console.warn('Nao foi possivel restaurar o rascunho do cadastro do gato.', error);
      localStorage.removeItem(draftKey);
    } finally {
      setDraftLoaded(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !draftLoaded || showSuccess) return;

    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            updatedAt: new Date().toISOString(),
            formData: serializeAddCatDraft(formData),
          })
        );
      } catch (error) {
        console.warn('Nao foi possivel salvar o rascunho do cadastro do gato.', error);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [draftKey, draftLoaded, formData, showSuccess]);

  const set = (key, value) => setFormData((p) => ({ ...p, [key]: value }));

  const toggleArray = (key, id) =>
    setFormData((p) => ({
      ...p,
      [key]: p[key].includes(id) ? p[key].filter((v) => v !== id) : [...p[key], id],
    }));

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('avatarFile', file);
    set('avatarPreview', URL.createObjectURL(file));
  };

  const baseTheme = resolveCatTheme(formData.themeColor);
  const activeGradient = {
    ...baseTheme,
    from: baseTheme.fromHex,
    to: baseTheme.toHex,
  };

  const activeBtn = (active) => ({
    className: `flex-1 py-3 rounded-2xl text-sm font-black border-2 transition-all ${
      active ? 'border-transparent text-white' : 'border-gray-100 text-gray-400 bg-gray-50'
    }`,
    style: active ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` } : {},
  });

  const ageLabel = useMemo(() => {
    if (formData.isDateEstimated) {
      const years = formData.ageYears ? `${formData.ageYears}a` : '';
      const months = formData.ageMonths ? `${formData.ageMonths}m` : '';
      return `${years} ${months}`.trim() || '—';
    }

    if (!formData.birthDate) return '—';

    const birth = parseDateOnly(formData.birthDate);
    if (!birth) return '—';
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return `${years}a ${months}m`;
  }, [formData.isDateEstimated, formData.ageYears, formData.ageMonths, formData.birthDate]);

  const displayBreed = useMemo(() => {
    if (formData.catType === 'SRD') {
      return formData.coatType?.trim() ? `SRD · ${formData.coatType.trim()}` : 'SRD';
    }
    return formData.breed || 'SRD';
  }, [formData.catType, formData.coatType, formData.breed]);

  const handleFinish = async () => {
    if (!formData.name.trim()) {
      alert('Digite o nome do gato.');
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();

      const simple = {
        ownerId: user?.id ?? '',
        name: formData.name,
        nicknames: formData.nicknames,
        gender: formData.gender,
        breed: formData.catType === 'SRD' ? 'SRD' : formData.breed,
        coatType: formData.catType === 'SRD' ? formData.coatType : '',
        city: formData.city,
        microchip: formData.hasMicrochip ? formData.microchip : '',
        arrivalType: formData.arrivalType,
        arrivalNotes: formData.arrivalNotes,

        weight: String(formData.weight || 0),
        neutered: String(formData.neutered),
        neuterIntention: formData.neutered ? '' : formData.neuterIntention,

        healthSummary: formData.healthSummary,
        foodBrand: formData.foodBrand === 'Outra' ? (formData.foodBrandOther || 'Outra') : formData.foodBrand,
        feedFrequencyMode: formData.feedFrequencySelector,
        feedFrequencyNotes: formData.foodFreq,

        activityLevel: formData.activityLevel,
        behaviorIssues: formData.hasBehaviorIssues ? formData.behaviorIssues : '',
        traumaHistory: formData.hasTraumaHistory ? formData.traumaHistory : '',
        habitat: formData.habitat,
        housingType: formData.housingType,
        streetAccess: String(formData.streetAccess),
        riskAreaAccess: String(formData.riskAreaAccess),

        adoptionStory: formData.arrivalType || '',
        hasAwards: String(formData.hasAwards),
        awardsDetail: formData.awardsDetail,
        themeColor: formData.themeColor,
        isDateEstimated: String(formData.isDateEstimated),
        hasBehaviorIssues: String(formData.hasBehaviorIssues),
        hasTraumaHistory: String(formData.hasTraumaHistory),
      };

      Object.entries(simple).forEach(([k, v]) => fd.append(k, v ?? ''));

      if (formData.isDateEstimated) {
        fd.append('ageYears', String(formData.ageYears || 0));
        fd.append('ageMonths', String(formData.ageMonths || 0));
      } else if (formData.birthDate) {
        fd.append('birthDate', formData.birthDate);
      }

      fd.append('personality', JSON.stringify(formData.personality || []));
      fd.append('foodType', JSON.stringify(formData.foodType || []));
      fd.append('preExistingConditions', JSON.stringify(formData.preExistingConditions || []));
      fd.append('coexistsWith', JSON.stringify(formData.coexistsWith || []));

      if (formData.avatarFile) fd.append('photo', formData.avatarFile);
      if (formData.pedigreeFile) fd.append('pedigree', formData.pedigreeFile);
      if (formData.pedigreeBackFile) fd.append('pedigreeBack', formData.pedigreeBackFile);

      const res = await api.post('/pets', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const createdPetId = res.data?.id?.split('-').pop()?.toUpperCase() || generatedId;
      setGeneratedId(createdPetId);

      const payload = {
        name: formData.name,
        nicknames: formData.nicknames,
        displayBreed,
        genderLabel:
          formData.gender === 'MALE' ? 'Macho' : formData.gender === 'FEMALE' ? 'Fêmea' : 'N/I',
        city: formData.city,
        microchipDisplay: formData.hasMicrochip ? formData.microchip : 'Não',
        arrivalType: formData.arrivalType,
        arrivalNotes: formData.arrivalNotes,
        weight: formData.weight ? `${formData.weight} kg` : '',
        neutered: formData.neutered,
        preExistingConditions: joinList(formData.preExistingConditions),
        healthSummary: formData.healthSummary,
        foodBrand: formData.foodBrand === 'Outra' ? (formData.foodBrandOther || 'Outra') : formData.foodBrand,
        foodTypes: joinList(formData.foodType),
        feedFrequencyMode: formData.feedFrequencySelector,
        feedFrequencyNotes: formData.foodFreq,
        personality: joinList(formData.personality.map((p) => normalizeGenderedLabel(p, formData.gender))),
        coexistsWith: joinList(formData.coexistsWith),
        behaviorIssues: formData.hasBehaviorIssues ? formData.behaviorIssues : '',
        traumaHistory: formData.hasTraumaHistory ? formData.traumaHistory : '',
        habitat: formData.habitat,
        housingType: formData.housingType,
        avatarPreview: formData.avatarPreview,
      };

      setGeneratedPetPayload(payload);
      downloadFichaTecnicaHTML(payload);
      if (draftKey) localStorage.removeItem(draftKey);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[var(--gatedo-light-bg)] flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="w-24 h-24 rounded-full mx-auto shadow-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` }}
          >
            <span className="text-4xl">🐾</span>
          </motion.div>

          <div>
            <h2 className="text-2xl font-black text-gray-800">Perfil criado com sucesso!</h2>
            <p className="text-gray-500 text-sm mt-1">
              ID <span className="font-black text-[#8B4AFF]">#{generatedId}</span> gerado para {formData.name}
            </p>
          </div>

          <VerticalCardPreview
            gradient={activeGradient}
            name={formData.name}
            breed={displayBreed}
            gender={formData.gender}
            avatarPreview={formData.avatarPreview}
            generatedId={generatedId}
            city={formData.city}
            ageLabel={ageLabel}
            weight={formData.weight ? `${formData.weight} kg` : '—'}
          />

          <div className="space-y-3">
            <button
              onClick={() => generatedPetPayload && downloadFichaTecnicaHTML(generatedPetPayload)}
              className="w-full py-4 rounded-[22px] font-black uppercase tracking-widest text-sm border border-[#8B4AFF]/20 text-[#8B4AFF] bg-white shadow-sm flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Baixar ficha técnica
            </button>

            <button
              onClick={() => navigate('/home')}
              className="w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-white text-sm shadow-xl"
              style={{ background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` }}
            >
              Ir para Home 🏠
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const ic = 'w-full bg-gray-50 rounded-xl p-3 text-sm outline-none placeholder-gray-400';
  const lc = 'text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 block';
  const sc = 'flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mt-2';
  const STEPS = ['Identidade', 'Saúde', 'Comportamento', 'Estilo'];

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-32">
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3 py-4 px-4 max-w-lg mx-auto">
          <button
            onClick={() => (step === 1 ? navigate(-1) : setStep((s) => s - 1))}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 active:scale-90 transition-all"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>

          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Etapa {step} de 4 — {STEPS[step - 1]}
            </p>
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className="h-1 rounded-full flex-1 transition-all duration-500"
                  style={{ background: s <= step ? activeGradient.from : '#e5e7eb' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            <div className="flex flex-col items-center pt-2 pb-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => avatarRef.current?.click()} className="relative">
                <div
                  className="w-28 h-28 rounded-[32px] overflow-hidden border-4 border-white"
                  style={{ boxShadow: `0 8px 32px ${activeGradient.from}40` }}
                >
                  {formData.avatarPreview ? (
                    <img src={formData.avatarPreview} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-1"
                      style={{ background: `linear-gradient(135deg, ${activeGradient.from}20, ${activeGradient.to}20)` }}
                    >
                      <Camera size={28} style={{ color: activeGradient.from }} />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: activeGradient.from }}>
                        Foto
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})`,
                    border: '3px solid white',
                  }}
                >
                  <Camera size={14} className="text-white" />
                </div>
              </motion.button>

              <p className="text-[11px] text-gray-400 font-bold mt-4">
                Toque para definir a foto destaque
              </p>
            </div>

            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className={lc}>Nome do Gatinho *</label>
                <input className={ic} placeholder="Como ele/ela se chama?" value={formData.name} onChange={(e) => set('name', e.target.value)} />
              </div>

              <div>
                <label className={lc}>Apelidos Carinhosos</label>
                <input className={ic} placeholder="Ex: Bolinha, Fofinho..." value={formData.nicknames} onChange={(e) => set('nicknames', e.target.value)} />
              </div>

              <div>
                <label className={lc}>Gênero</label>
                <div className="flex gap-2">
                  {[
                    ['MALE', 'Macho 🐱'],
                    ['FEMALE', 'Fêmea 🐱'],
                    ['UNKNOWN', 'N/I'],
                  ].map(([v, l]) => (
                    <button key={v} onClick={() => set('gender', v)} {...activeBtn(formData.gender === v)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-600">Possui microchip?</span>
                <Toggle
                  value={formData.hasMicrochip}
                  onChange={(v) => {
                    set('hasMicrochip', v);
                    if (!v) set('microchip', '');
                  }}
                />
              </div>

              {formData.hasMicrochip && (
                <div>
                  <label className={lc}>Número do microchip</label>
                  <div className="flex items-center bg-gray-50 rounded-2xl px-4">
                    <Hash size={14} className="text-gray-400 mr-2" />
                    <input
                      className="w-full py-4 bg-transparent font-bold outline-none text-gray-700 text-sm font-mono"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.microchip}
                      onChange={(e) => set('microchip', onlyNumbers(e.target.value))}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={lc}>Cidade de Origem</label>
                <CitySearch value={formData.city} onChange={(v) => set('city', v)} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-3">
              <label className={lc}>Raça</label>

              <div className="flex gap-2">
                {[
                  ['SRD', '(SRD) Sem raça definida'],
                  ['PURO', 'Raça definida'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => {
                      set('catType', v);
                      if (v === 'SRD') set('breed', 'SRD');
                    }}
                    {...activeBtn(formData.catType === v)}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {formData.catType === 'PURO' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 overflow-hidden">
                  <div>
                    <label className={lc}>Raça definida</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CAT_BREEDS.filter((b) => b !== '(SRD) Sem raça definida').map((b) => (
                        <button
                          key={b}
                          onClick={() => set('breed', b)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 text-left transition-all ${
                            formData.breed === b ? 'border-transparent text-white' : 'border-gray-100 text-gray-500 bg-gray-50'
                          }`}
                          style={formData.breed === b ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` } : {}}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={lc}>
                      Pedigree <span className="text-gray-300 normal-case font-medium">(opcional)</span>
                    </label>
                    <PedigreeUpload
                      frontFile={formData.pedigreeFile}
                      backFile={formData.pedigreeBackFile}
                      onChangeFront={(f) => set('pedigreeFile', f)}
                      onChangeBack={(f) => set('pedigreeBackFile', f)}
                    />
                    <p className="text-[10px] text-gray-400 text-center mt-1.5">
                      Aparecerá no módulo Documentos do perfil 📋
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-amber-600" />
                      <span className="text-xs font-bold text-amber-700">Tem premiações?</span>
                    </div>
                    <Toggle value={formData.hasAwards} onChange={(v) => set('hasAwards', v)} />
                  </div>

                  {formData.hasAwards && (
                    <input className={ic} placeholder="Descreva os prêmios..." value={formData.awardsDetail} onChange={(e) => set('awardsDetail', e.target.value)} />
                  )}
                </motion.div>
              )}

              {formData.catType === 'SRD' && (
                <div>
                  <label className={lc}>Qual tipo de pelagem?</label>
                  <input
                    className={ic}
                    placeholder="Ex: laranjinha, frajola, pretinho..."
                    value={formData.coatType}
                    onChange={(e) => set('coatType', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className={lc}>Como chegou até você?</label>
                <div className="grid grid-cols-2 gap-2">
                  {ARRIVAL_TYPES.map((opt) => (
                    <button key={opt} onClick={() => set('arrivalType', opt)} {...activeBtn(formData.arrivalType === opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lc}>Informações adicionais</label>
                <textarea
                  className={`${ic} h-20`}
                  placeholder="Conte algo importante sobre essa chegada..."
                  value={formData.arrivalNotes}
                  onChange={(e) => set('arrivalNotes', e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-3">
              <label className={lc}>Nascimento</label>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-600">Data estimada?</span>
                <Toggle value={formData.isDateEstimated} onChange={(v) => set('isDateEstimated', v)} />
              </div>

              {formData.isDateEstimated ? (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">Anos</label>
                    <input type="number" className={ic} placeholder="0" value={formData.ageYears} onChange={(e) => set('ageYears', e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">Meses</label>
                    <input type="number" className={ic} placeholder="0" value={formData.ageMonths} onChange={(e) => set('ageMonths', e.target.value)} />
                  </div>
                </div>
              ) : (
                <input type="date" className={ic} value={formData.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
              )}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className={lc}>Peso atual (kg)</label>
                <input type="number" step="0.1" className={ic} placeholder="Ex: 4.5" value={formData.weight} onChange={(e) => set('weight', e.target.value)} />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-600">Castrado(a)?</span>
                <Toggle value={formData.neutered} onChange={(v) => set('neutered', v)} />
              </div>

              {!formData.neutered && (
                <div>
                  <label className={lc}>Intenção de castrar</label>
                  <input className={ic} placeholder="Ex: Sim, nos próximos meses" value={formData.neuterIntention} onChange={(e) => set('neuterIntention', e.target.value)} />
                </div>
              )}

              <div>
                <label className={lc}>Doenças pré-existentes</label>
                <div className="flex gap-2 flex-wrap">
                  {DISEASE_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleArray('preExistingConditions', d)}
                      className={`px-4 py-2 rounded-full text-xs font-black border-2 transition-all ${
                        formData.preExistingConditions.includes(d) ? 'border-transparent text-white' : 'border-gray-100 text-gray-500 bg-gray-50'
                      }`}
                      style={formData.preExistingConditions.includes(d) ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` } : {}}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lc}>Resumo de saúde</label>
                <textarea
                  className={`${ic} h-20`}
                  placeholder="Sintomas frequentes, acompanhamento, observações..."
                  value={formData.healthSummary}
                  onChange={(e) => set('healthSummary', e.target.value)}
                />
              </div>
            </div>

            <h3 className={sc}>🍖 Nutrição</h3>

            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className={lc}>Tipo de alimentação</label>
                <div className="flex gap-2 flex-wrap">
                  {['Seca', 'Úmida', 'Natural', 'Mista'].map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleArray('foodType', t)}
                      className={`px-4 py-2 rounded-full text-xs font-black border-2 transition-all ${
                        formData.foodType.includes(t) ? 'border-transparent text-white' : 'border-gray-100 text-gray-500'
                      }`}
                      style={formData.foodType.includes(t) ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` } : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lc}>Marca de ração</label>
                <div className="grid grid-cols-2 gap-2">
                  {FEED_BRANDS.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => set('foodBrand', brand)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 text-left transition-all ${
                        formData.foodBrand === brand ? 'border-transparent text-white' : 'border-gray-100 text-gray-500 bg-gray-50'
                      }`}
                      style={formData.foodBrand === brand ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` } : {}}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {formData.foodBrand === 'Outra' && (
                <div>
                  <label className={lc}>Outra marca</label>
                  <input className={ic} placeholder="Digite a marca" value={formData.foodBrandOther} onChange={(e) => set('foodBrandOther', e.target.value)} />
                </div>
              )}

              <div>
                <label className={lc}>Frequência de alimentação</label>
                <div className="flex gap-2 flex-wrap">
                  {FEED_FREQUENCY_OPTIONS.map((freq) => (
                    <button
                      key={freq}
                      onClick={() => set('feedFrequencySelector', freq)}
                      className={`px-4 py-2 rounded-full text-xs font-black border-2 transition-all ${
                        formData.feedFrequencySelector === freq ? 'border-transparent text-white' : 'border-gray-100 text-gray-500 bg-gray-50'
                      }`}
                      style={formData.feedFrequencySelector === freq ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` } : {}}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lc}>Detalhe da frequência</label>
                <input className={ic} placeholder="Ex: 3x por dia / manhã e noite" value={formData.foodFreq} onChange={(e) => set('foodFreq', e.target.value)} />
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className={lc}>Temperamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {BEHAVIOR_OPTIONS.map((b) => {
                    const active = formData.personality.includes(b.id);
                    const Icon = b.icon;
                    return (
                      <button
                        key={b.id}
                        onClick={() => toggleArray('personality', b.id)}
                        className={`p-3 rounded-[14px] flex items-center gap-2 border-2 transition-all text-left ${
                          active ? 'shadow-md' : 'border-gray-100 bg-white'
                        }`}
                        style={active ? { borderColor: activeGradient.from, background: `${activeGradient.from}10` } : {}}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${b.color}`}>
                          <Icon size={15} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">
                          {normalizeGenderedLabel(b.id, formData.gender)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={lc}>Nível de atividade</label>
                <div className="flex gap-2">
                  {['Baixa', 'Média', 'Alta'].map((l) => (
                    <button
                      key={l}
                      onClick={() => set('activityLevel', l)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all ${
                        formData.activityLevel === l ? 'border-transparent text-white' : 'border-gray-100 text-gray-500'
                      }`}
                      style={formData.activityLevel === l ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` } : {}}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lc}>Convive com animais?</label>
                <div className="grid grid-cols-2 gap-2">
                  {COEXIST_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        if (opt === 'Nenhum') {
                          set('coexistsWith', ['Nenhum']);
                          return;
                        }
                        const next = formData.coexistsWith.includes(opt)
                          ? formData.coexistsWith.filter((i) => i !== opt)
                          : [...formData.coexistsWith.filter((i) => i !== 'Nenhum'), opt];
                        set('coexistsWith', next);
                      }}
                      className={`p-3 rounded-[14px] flex items-center gap-2 border-2 transition-all text-left ${
                        formData.coexistsWith.includes(opt) ? 'shadow-md text-white' : 'border-gray-100 bg-white text-gray-600'
                      }`}
                      style={formData.coexistsWith.includes(opt) ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})`, borderColor: 'transparent' } : {}}
                    >
                      {opt === 'Gatos' && <Cat size={14} />}
                      {opt === 'Cachorros' && <Dog size={14} />}
                      {opt === 'Ambos' && <Heart size={14} />}
                      {opt === 'Nenhum' && <X size={14} />}
                      <span className="text-xs font-bold">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-600">Tem problemas de comportamento?</span>
                <Toggle value={formData.hasBehaviorIssues} onChange={(v) => set('hasBehaviorIssues', v)} color="red" />
              </div>

              {formData.hasBehaviorIssues && (
                <div>
                  <label className={lc}>Se sim, qual?</label>
                  <textarea
                    className={`${ic} h-16`}
                    placeholder="Ex: Arranha sofá, morde, marca território..."
                    value={formData.behaviorIssues}
                    onChange={(e) => set('behaviorIssues', e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-2 bg-red-50 rounded-xl border border-red-100">
                <span className="text-xs font-bold text-red-700">Tem traumas ou medos?</span>
                <Toggle value={formData.hasTraumaHistory} onChange={(v) => set('hasTraumaHistory', v)} color="red" />
              </div>

              {formData.hasTraumaHistory && (
                <div>
                  <label className={lc}>Se sim, qual?</label>
                  <textarea
                    className={`${ic} h-20`}
                    placeholder="Ex: medo de barulho, trauma com humanos, objetos, situações..."
                    value={formData.traumaHistory}
                    onChange={(e) => set('traumaHistory', e.target.value)}
                  />
                </div>
              )}
            </div>

            <h3 className={sc}>
              <Home size={16} />
              Ambiente
            </h3>

            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className={lc}>Habitat</label>
                <div className="flex gap-2">
                  {['Interno', 'Externo', 'Misto'].map((h) => (
                    <button
                      key={h}
                      onClick={() => set('habitat', h)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all ${
                        formData.habitat === h ? 'border-transparent text-white' : 'border-gray-100 text-gray-500'
                      }`}
                      style={formData.habitat === h ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` } : {}}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={lc}>Tipo de moradia</label>
                <div className="grid grid-cols-2 gap-2">
                  {HOUSING_TYPES.map((h) => (
                    <button
                      key={h}
                      onClick={() => set('housingType', h)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 text-left transition-all ${
                        formData.housingType === h ? 'border-transparent text-white' : 'border-gray-100 text-gray-500 bg-gray-50'
                      }`}
                      style={formData.housingType === h ? { background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` } : {}}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-600">Acesso à rua?</span>
                <Toggle value={formData.streetAccess} onChange={(v) => set('streetAccess', v)} color="red" />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-600">Acesso a área de risco?</span>
                <Toggle value={formData.riskAreaAccess} onChange={(v) => set('riskAreaAccess', v)} color="red" />
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <label className={lc}>Cor do cartão RG</label>
              <div className="grid grid-cols-5 gap-2 bg-white p-3 rounded-[24px] shadow-sm border border-gray-100">
                {CARD_GRADIENTS.map((g) => (
                  <button key={g.id} onClick={() => set('themeColor', g.id)} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all ${
                        formData.themeColor === g.id ? 'scale-110' : ''
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                        outline: formData.themeColor === g.id ? `3px solid ${g.from}` : 'none',
                        outlineOffset: '2px',
                        boxShadow: formData.themeColor === g.id ? `0 4px 14px ${g.from}60` : 'none',
                      }}
                    >
                      {formData.themeColor === g.id && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-[8px] font-black text-gray-400">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={lc}>Prévia da ficha principal</label>
              <VerticalCardPreview
                gradient={activeGradient}
                name={formData.name}
                breed={displayBreed}
                gender={formData.gender}
                avatarPreview={formData.avatarPreview}
                generatedId={generatedId}
                city={formData.city}
                ageLabel={ageLabel}
                weight={formData.weight ? `${formData.weight} kg` : '—'}
              />
            </div>

            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm">
              <p className="text-xs text-center text-gray-500 font-bold px-4">
                Ao salvar, o perfil será criado e uma ficha técnica será gerada para download.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-[999]">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={step === 4 ? handleFinish : () => setStep((s) => s + 1)}
          disabled={loading}
          className="w-full max-w-[340px] py-5 rounded-[28px] font-black uppercase text-sm tracking-widest text-white shadow-xl disabled:opacity-70 flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.to})` }}
        >
          {loading ? (
            'Salvando...'
          ) : step === 4 ? (
            <>
              <span>Salvar e gerar ficha</span>
              <Download size={16} strokeWidth={3} />
            </>
          ) : (
            <>
              <span>Próximo passo</span>
              <ChevronRight size={16} strokeWidth={3} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
