import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Ghost,
  MapPin,
  Hash,
  Camera,
  Award,
  Upload,
  Loader2,
  ChevronRight,
  HeartPulse,
  AlertCircle,
  ShieldPlus,
  Activity,
  Dog,
  Cat,
  Sparkles,
  Heart,
} from 'lucide-react';
import api from '../../../services/api';
import { CAT_THEMES } from '../../../config/catThemes';
import { getDateOnly } from '../../../utils/catAge';

const EXTRA_THEMES = [
  { id: 'amber', label: 'Âmbar', fromHex: '#F59E0B', toHex: '#FBBF24', accent: '#FFF7CC', back: '#7C4A03' },
  { id: 'emerald', label: 'Esmeralda', fromHex: '#10B981', toHex: '#34D399', accent: '#D1FAE5', back: '#065F46' },
  { id: 'rose', label: 'Rosé', fromHex: '#F43F5E', toHex: '#FB7185', accent: '#FFE4EA', back: '#881337' },
  { id: 'sky', label: 'Sky', fromHex: '#0EA5E9', toHex: '#38BDF8', accent: '#E0F2FE', back: '#0C4A6E' },
  { id: 'slate', label: 'Slate', fromHex: '#475569', toHex: '#64748B', accent: '#E2E8F0', back: '#1E293B' },
  { id: 'indigo', label: 'Indigo', fromHex: '#6366F1', toHex: '#818CF8', accent: '#E0E7FF', back: '#312E81' },
];

const ALL_THEMES = [...CAT_THEMES, ...EXTRA_THEMES];

const BREEDS = [
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

const ARRIVAL_TYPES = [
  'Adoção',
  'Presente',
  'Compra',
  'Gatil',
  'Encontrado na rua',
  'Resgatado',
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
const COEXIST_OPTIONS = ['Nenhum', 'Gatos', 'Cachorros', 'Ambos'];
const HOUSING_TYPES = ['Apartamento', 'Casa', 'Sítio', 'Gatil', 'Outro'];

const BEHAVIOR_OPTIONS = [
  { id: 'calmo', color: 'bg-blue-50 text-blue-600' },
  { id: 'eletrico', color: 'bg-yellow-50 text-yellow-600' },
  { id: 'carinhoso', color: 'bg-pink-50 text-pink-600' },
  { id: 'independente', color: 'bg-purple-50 text-purple-600' },
  { id: 'falante', color: 'bg-green-50 text-green-600' },
  { id: 'comilao', color: 'bg-orange-50 text-orange-600' },
  { id: 'medroso', color: 'bg-red-50 text-red-600' },
  { id: 'cacador', color: 'bg-teal-50 text-teal-600' },
  { id: 'curiosa', color: 'bg-fuchsia-50 text-fuchsia-600' },
  { id: 'brincalhao', color: 'bg-lime-50 text-lime-700' },
  { id: 'territorial', color: 'bg-slate-50 text-slate-700' },
  { id: 'sociavel', color: 'bg-rose-50 text-rose-600' },
];

function onlyNumbers(v) {
  return String(v || '').replace(/\D/g, '');
}


function formatCatIdentity(value) {
  const raw = String(value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return raw ? `GTD-${raw.slice(0, 8)}` : 'GTD-SEMID';
}


function normalizeBehaviorLabel(id, gender) {
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

function Toggle({ value, onChange, color = 'green' }) {
  const bg = value ? (color === 'red' ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-300';
  return (
    <div
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${bg}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );
}

export default function EditProfileModal({ isOpen, onClose, cat, onSave }) {
  const [loading, setLoading] = useState(false);
  const [birthMode, setBirthMode] = useState('exact');

  const [showIdentity, setShowIdentity] = useState(true);
  const [showHealth, setShowHealth] = useState(true);
  const [showBehavior, setShowBehavior] = useState(false);
  const [showMemorial, setShowMemorial] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const avatarRef = useRef(null);
  const pedigreeFrontRef = useRef(null);
  const pedigreeBackRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    nicknames: '',
    breed: 'SRD',
    coatType: '',
    city: '',
    hasMicrochip: false,
    microchip: '',
    gender: 'UNKNOWN',

    arrivalType: '',
    arrivalNotes: '',

    preExistingConditions: [],
    healthSummary: '',

    foodBrand: '',
    foodBrandOther: '',
    feedFrequencyMode: '',
    feedFrequencyNotes: '',
    foodType: [],

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

    neutered: false,
    neuterIntention: '',

    hasAwards: false,
    awardsDetail: '',

    deathDate: '',
    deathCause: '',
    memorialTitle: '',
    memorialMessage: '',
    memorialIsPublic: true,
    isMemorial: false,
    isArchived: false,

    themeColor: 'violet',
    birthDate: '',
    ageYears: '',
    ageMonths: '',
  });

  const [previews, setPreviews] = useState({
    avatar: null,
    front: null,
    back: null,
  });

  const set = (key, value) => setFormData((p) => ({ ...p, [key]: value }));

  const toggleArray = (key, id) =>
    setFormData((p) => ({
      ...p,
      [key]: p[key].includes(id)
        ? p[key].filter((v) => v !== id)
        : [...p[key], id],
    }));

  useEffect(() => {
    if (cat && isOpen) {
      setFormData({
        name: cat.name || '',
        nicknames: cat.nicknames || '',
        breed: cat.breed || 'SRD',
        coatType: cat.coatType || '',
        city: cat.city || '',
        hasMicrochip: !!cat.microchip,
        microchip: cat.microchip || '',
        gender: cat.gender || 'UNKNOWN',

        arrivalType: cat.arrivalType || '',
        arrivalNotes: cat.arrivalNotes || '',

        preExistingConditions: Array.isArray(cat.preExistingConditions) ? cat.preExistingConditions : [],
        healthSummary: cat.healthSummary || '',

        foodBrand: FEED_BRANDS.includes(cat.foodBrand) ? cat.foodBrand : (cat.foodBrand ? 'Outra' : ''),
        foodBrandOther: cat.foodBrand && !FEED_BRANDS.includes(cat.foodBrand) ? cat.foodBrand : '',
        feedFrequencyMode: cat.feedFrequencyMode || '',
        feedFrequencyNotes: cat.feedFrequencyNotes || '',
        foodType: Array.isArray(cat.foodType) ? cat.foodType : [],

        personality: Array.isArray(cat.personality) ? cat.personality : [],
        activityLevel: cat.activityLevel || 'Média',
        coexistsWith: Array.isArray(cat.coexistsWith) ? cat.coexistsWith : [],

        hasBehaviorIssues: !!cat.hasBehaviorIssues,
        behaviorIssues: cat.behaviorIssues || '',
        hasTraumaHistory: !!cat.hasTraumaHistory,
        traumaHistory: cat.traumaHistory || '',

        habitat: cat.habitat || 'Interno',
        housingType: cat.housingType || '',
        streetAccess: !!cat.streetAccess,
        riskAreaAccess: !!cat.riskAreaAccess,

        neutered: !!cat.neutered,
        neuterIntention: cat.neuterIntention || '',

        hasAwards: !!cat.hasAwards,
        awardsDetail: cat.awardsDetail || '',

        deathDate: getDateOnly(cat.deathDate),
        deathCause: cat.deathCause || '',
        memorialTitle: cat.memorial?.title || '',
        memorialMessage: cat.memorial?.message || '',
        memorialIsPublic: cat.memorial?.isPublic ?? true,
        isMemorial: !!cat.isMemorial,
        isArchived: !!cat.isArchived,

        themeColor: cat.themeColor && !cat.themeColor.startsWith('#') ? cat.themeColor : 'violet',
        birthDate: getDateOnly(cat.birthDate),
        ageYears: cat.ageYears ?? '',
        ageMonths: cat.ageMonths ?? '',
      });

      setPreviews({
        avatar: cat.photoUrl || null,
        front: cat.pedigreeUrl || cat.pedigreeFrontUrl || null,
        back: cat.pedigreeBackUrl || null,
      });

      setBirthMode(cat.isDateEstimated ? 'approx' : 'exact');
    }
  }, [cat, isOpen]);

  const handleFilePreview = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => ({ ...prev, [type]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);

    const data = new FormData();

    data.append('name', formData.name);
    data.append('nicknames', formData.nicknames);
    data.append('breed', formData.breed || 'SRD');
    data.append('coatType', formData.breed === 'SRD' ? formData.coatType : '');
    data.append('city', formData.city);
    data.append('microchip', formData.hasMicrochip ? formData.microchip : '');
    data.append('gender', formData.gender);

    data.append('arrivalType', formData.arrivalType);
    data.append('arrivalNotes', formData.arrivalNotes);

    data.append('healthSummary', formData.healthSummary);
    data.append('foodBrand', formData.foodBrand === 'Outra' ? (formData.foodBrandOther || 'Outra') : formData.foodBrand);
    data.append('feedFrequencyMode', formData.feedFrequencyMode);
    data.append('feedFrequencyNotes', formData.feedFrequencyNotes);

    data.append('activityLevel', formData.activityLevel);
    data.append('behaviorIssues', formData.hasBehaviorIssues ? formData.behaviorIssues : '');
    data.append('traumaHistory', formData.hasTraumaHistory ? formData.traumaHistory : '');

    data.append('habitat', formData.habitat);
    data.append('housingType', formData.housingType);
    data.append('streetAccess', String(formData.streetAccess));
    data.append('riskAreaAccess', String(formData.riskAreaAccess));

    data.append('neutered', String(formData.neutered));
    data.append('neuterIntention', formData.neutered ? '' : formData.neuterIntention);

    data.append('hasAwards', String(formData.hasAwards));
    data.append('awardsDetail', formData.awardsDetail);

    data.append('themeColor', formData.themeColor);
    data.append('isMemorial', String(formData.isMemorial));
    data.append('isArchived', String(formData.isArchived));
    data.append('isDateEstimated', String(birthMode === 'approx'));
    data.append('hasBehaviorIssues', String(formData.hasBehaviorIssues));
    data.append('hasTraumaHistory', String(formData.hasTraumaHistory));

    data.append('personality', JSON.stringify(formData.personality || []));
    data.append('foodType', JSON.stringify(formData.foodType || []));
    data.append('preExistingConditions', JSON.stringify(formData.preExistingConditions || []));
    data.append('coexistsWith', JSON.stringify(formData.coexistsWith || []));

    if (birthMode === 'exact') {
      if (formData.birthDate) data.append('birthDate', formData.birthDate);
      data.append('ageYears', '');
      data.append('ageMonths', '');
    } else {
      data.append('birthDate', '');
      if (formData.ageYears !== '') data.append('ageYears', String(formData.ageYears));
      if (formData.ageMonths !== '') data.append('ageMonths', String(formData.ageMonths));
    }

    if (formData.deathDate) data.append('deathDate', formData.deathDate);
    if (formData.deathCause) data.append('deathCause', formData.deathCause);

    if (avatarRef.current?.files?.[0]) data.append('file', avatarRef.current.files[0]);
    if (pedigreeFrontRef.current?.files?.[0]) data.append('pedigree', pedigreeFrontRef.current.files[0]);
    if (pedigreeBackRef.current?.files?.[0]) data.append('pedigreeBack', pedigreeBackRef.current.files[0]);

    try {
      await api.patch(`/pets/${cat.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (formData.isMemorial && formData.memorialMessage?.trim()) {
        await api.post(`/memorial/tributes/${cat.id}`, {
          name: formData.name,
          title: formData.memorialTitle?.trim() || null,
          message: formData.memorialMessage.trim(),
          photoUrl: previews.avatar || cat.photoUrl || null,
          birthYear:
            birthMode === 'exact' && formData.birthDate
              ? String(new Date(formData.birthDate).getFullYear())
              : formData.ageYears
                ? String(new Date().getFullYear() - Number(formData.ageYears))
                : null,
          deathYear: formData.deathDate
            ? String(new Date(formData.deathDate).getFullYear())
            : null,
          deathDate: formData.deathDate || null,
          isPublic: formData.memorialIsPublic,
        });
      }

      onSave?.();
      onClose?.();
    } catch (error) {
      console.error(error);
      alert('Erro ao sincronizar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/pets/${cat.id}`);
      onClose();
      window.location.href = '/cats';
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir.');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  const lc = 'text-[8px] font-black text-gray-400 uppercase ml-2 mb-1 block';
  const inputBase = 'w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none text-gray-700 text-sm';
  const catRef = formatCatIdentity(cat?.id);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-[3px] flex items-end justify-center text-left">
      <motion.div
        initial={{ y: 72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 72, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[95vh] overflow-y-auto shadow-[0_-18px_50px_rgba(19,14,35,0.18)]"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Edição Mestre
            </h2>
            <p className="text-[12px] font-mono font-bold text-[#6B30E0] uppercase tracking-[0.12em] mt-1">
              {catRef}
            </p>
          </div>

          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <section className="bg-gray-50 p-6 rounded-[32px] flex items-center gap-6 border border-gray-100">
            <div className="relative">
              <div className="w-24 h-24 rounded-[30px] overflow-hidden border-4 border-white shadow-xl bg-white">
                <img src={previews.avatar || '/placeholder-cat.png'} className="w-full h-full object-cover" />
              </div>

              <button
                onClick={() => avatarRef.current.click()}
                className="absolute -bottom-2 -right-2 p-2.5 text-white rounded-2xl shadow-lg border-2 border-white active:scale-90 transition-transform"
                style={{ background: 'linear-gradient(135deg, rgb(139, 74, 255), rgb(107, 48, 224))' }}
              >
                <Camera size={16} />
              </button>

              <input type="file" ref={avatarRef} className="hidden" onChange={(e) => handleFilePreview(e, 'avatar')} />
            </div>

            <div className="flex-1">
              <span className="text-[9px] font-black uppercase text-gray-400 block mb-2 tracking-widest">
                Cor do Perfil
              </span>

              <div className="grid grid-cols-6 gap-2">
                {ALL_THEMES.map((g) => {
                  const isActive = formData.themeColor === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => set('themeColor', g.id)}
                      title={g.label}
                      className="aspect-square rounded-[10px] flex items-center justify-center transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${g.fromHex}, ${g.toHex})`,
                        outline: isActive ? `2.5px solid ${g.fromHex}` : 'none',
                        outlineOffset: '2px',
                        transform: isActive ? 'scale(1.18)' : 'scale(1)',
                        boxShadow: isActive ? `0 4px 10px ${g.fromHex}60` : 'none',
                      }}
                    >
                      {isActive && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowIdentity(!showIdentity)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Identidade & Origem
                </span>
              </div>
              <ChevronRight size={18} className={`text-gray-300 transition-transform ${showIdentity ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showIdentity && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-6 space-y-4">
                    <div>
                      <label className={lc}>Nome Principal</label>
                      <input className={inputBase} value={formData.name} onChange={(e) => set('name', e.target.value)} />
                    </div>

                    <div>
                      <label className={lc}>Apelidos Carinhosos</label>
                      <input className={inputBase} value={formData.nicknames} onChange={(e) => set('nicknames', e.target.value)} />
                    </div>

                    <div>
                      <label className={lc}>Gênero</label>
                      <select className={inputBase} value={formData.gender} onChange={(e) => set('gender', e.target.value)}>
                        <option value="MALE">Macho</option>
                        <option value="FEMALE">Fêmea</option>
                        <option value="UNKNOWN">N/I</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
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
                        <label className={lc}>Número do Microchip</label>
                        <div className="flex items-center bg-gray-50 rounded-2xl px-4">
                          <Hash size={14} className="text-gray-400 mr-2" />
                          <input
                            className="w-full py-4 bg-transparent font-bold outline-none text-gray-700 text-sm font-mono"
                            value={formData.microchip}
                            onChange={(e) => set('microchip', onlyNumbers(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className={lc}>Cidade de Origem</label>
                      <div className="flex items-center bg-gray-50 rounded-2xl px-4">
                        <MapPin size={14} className="text-gray-400 mr-2" />
                        <input className="w-full py-4 bg-transparent font-bold outline-none text-gray-700 text-sm" value={formData.city} onChange={(e) => set('city', e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Raça</label>
                      <select
                        className={inputBase}
                        value={formData.breed === 'SRD' ? '(SRD) Sem raça definida' : formData.breed}
                        onChange={(e) => {
                          const value = e.target.value === '(SRD) Sem raça definida' ? 'SRD' : e.target.value;
                          set('breed', value);
                        }}
                      >
                        {BREEDS.map((breed) => (
                          <option key={breed} value={breed}>
                            {breed}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.breed === 'SRD' && (
                      <div>
                        <label className={lc}>Qual tipo de pelagem?</label>
                        <input className={inputBase} placeholder="Ex: frajola, laranjinha, pretinho..." value={formData.coatType} onChange={(e) => set('coatType', e.target.value)} />
                      </div>
                    )}

                    <div>
                      <label className={lc}>Como chegou até você?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ARRIVAL_TYPES.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => set('arrivalType', opt)}
                            className={`py-3 px-3 rounded-xl text-xs font-bold border-2 text-left transition-all ${
                              formData.arrivalType === opt ? 'border-transparent text-white bg-indigo-600' : 'border-gray-100 text-gray-500 bg-gray-50'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Informações Adicionais</label>
                      <textarea
                        className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-medium text-gray-600 border border-gray-100 outline-none min-h-[90px] resize-none"
                        value={formData.arrivalNotes}
                        onChange={(e) => set('arrivalNotes', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={lc}>Nascimento</label>
                      <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl shadow-sm mb-3">
                        <button
                          onClick={() => {
                            setBirthMode('exact');
                            setFormData((f) => ({ ...f, ageYears: '', ageMonths: '' }));
                          }}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${birthMode === 'exact' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
                        >
                          Calendário
                        </button>
                        <button
                          onClick={() => {
                            setBirthMode('approx');
                            setFormData((f) => ({ ...f, birthDate: '' }));
                          }}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${birthMode === 'approx' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
                        >
                          Aproximada
                        </button>
                      </div>

                      {birthMode === 'exact' ? (
                        <input type="date" className={inputBase} value={formData.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <input type="number" placeholder="Anos" className={inputBase} value={formData.ageYears} onChange={(e) => set('ageYears', e.target.value)} />
                          <input type="number" placeholder="Meses" className={inputBase} value={formData.ageMonths} onChange={(e) => set('ageMonths', e.target.value)} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2">
                          <Award size={14} className="text-amber-600" />
                          <span className="text-xs font-bold text-amber-700">Tem premiações?</span>
                        </div>
                        <Toggle value={formData.hasAwards} onChange={(v) => set('hasAwards', v)} />
                      </div>

                      {formData.hasAwards && (
                        <input className={inputBase} placeholder="Descreva os prêmios..." value={formData.awardsDetail} onChange={(e) => set('awardsDetail', e.target.value)} />
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className={lc}>Documentação de raça</label>
                      <div className="grid grid-cols-2 gap-4">
                        {['front', 'back'].map((side) => (
                          <div key={side} className="p-3 bg-amber-50 rounded-[24px] border border-amber-100 text-center space-y-2">
                            <span className="text-[7px] font-black uppercase text-amber-700 block">
                              {side === 'front' ? 'Frente' : 'Verso'}
                            </span>
                            <div
                              className="w-full aspect-video bg-white rounded-xl overflow-hidden border border-amber-200 flex items-center justify-center relative cursor-pointer"
                              onClick={() => (side === 'front' ? pedigreeFrontRef : pedigreeBackRef).current.click()}
                            >
                              {previews[side] ? <img src={previews[side]} className="w-full h-full object-cover" /> : <Upload size={16} className="text-amber-200" />}
                            </div>

                            <input
                              type="file"
                              ref={side === 'front' ? pedigreeFrontRef : pedigreeBackRef}
                              className="hidden"
                              onChange={(e) => handleFilePreview(e, side)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHealth(!showHealth)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HeartPulse size={16} className="text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Saúde & Nutrição
                </span>
              </div>
              <ChevronRight size={18} className={`text-gray-300 transition-transform ${showHealth ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showHealth && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-6 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold text-gray-600">Castrado(a)?</span>
                      <Toggle value={formData.neutered} onChange={(v) => set('neutered', v)} />
                    </div>

                    {!formData.neutered && (
                      <div>
                        <label className={lc}>Intenção de castrar</label>
                        <input className={inputBase} value={formData.neuterIntention} onChange={(e) => set('neuterIntention', e.target.value)} />
                      </div>
                    )}

                    <div>
                      <label className={lc}>Doenças Pré-Existentes</label>
                      <div className="flex gap-2 flex-wrap">
                        {DISEASE_OPTIONS.map((d) => (
                          <button
                            key={d}
                            onClick={() => toggleArray('preExistingConditions', d)}
                            className={`px-4 py-2 rounded-full text-xs font-black border-2 transition-all ${
                              formData.preExistingConditions.includes(d) ? 'border-transparent text-white bg-indigo-600' : 'border-gray-100 text-gray-500 bg-gray-50'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Resumo de Saúde</label>
                      <textarea
                        className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-medium text-gray-600 border border-gray-100 outline-none min-h-[100px] resize-none"
                        value={formData.healthSummary}
                        onChange={(e) => set('healthSummary', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={lc}>Marca de Ração</label>
                      <div className="grid grid-cols-2 gap-2">
                        {FEED_BRANDS.map((brand) => (
                          <button
                            key={brand}
                            onClick={() => set('foodBrand', brand)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 text-left transition-all ${
                              formData.foodBrand === brand ? 'border-transparent text-white bg-indigo-600' : 'border-gray-100 text-gray-500 bg-gray-50'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.foodBrand === 'Outra' && (
                      <div>
                        <label className={lc}>Outra Marca</label>
                        <input className={inputBase} value={formData.foodBrandOther} onChange={(e) => set('foodBrandOther', e.target.value)} />
                      </div>
                    )}

                    <div>
                      <label className={lc}>Tipo de Alimentação</label>
                      <div className="flex gap-2 flex-wrap">
                        {['Seca', 'Úmida', 'Natural', 'Mista'].map((t) => (
                          <button
                            key={t}
                            onClick={() => toggleArray('foodType', t)}
                            className={`px-4 py-2 rounded-full text-xs font-black border-2 transition-all ${
                              formData.foodType.includes(t) ? 'border-transparent text-white bg-indigo-600' : 'border-gray-100 text-gray-500 bg-gray-50'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Frequência de Alimentação</label>
                      <div className="flex gap-2 flex-wrap">
                        {FEED_FREQUENCY_OPTIONS.map((freq) => (
                          <button
                            key={freq}
                            onClick={() => set('feedFrequencyMode', freq)}
                            className={`px-4 py-2 rounded-full text-xs font-black border-2 transition-all ${
                              formData.feedFrequencyMode === freq ? 'border-transparent text-white bg-indigo-600' : 'border-gray-100 text-gray-500 bg-gray-50'
                            }`}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Detalhe da Frequência</label>
                      <input className={inputBase} placeholder="Ex: 3x ao dia" value={formData.feedFrequencyNotes} onChange={(e) => set('feedFrequencyNotes', e.target.value)} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBehavior(!showBehavior)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Activity size={16} className="text-violet-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Comportamento & Ambiente
                </span>
              </div>
              <ChevronRight size={18} className={`text-gray-300 transition-transform ${showBehavior ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showBehavior && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-6 pb-6 space-y-4">
                    <div>
                      <label className={lc}>Temperamento</label>
                      <div className="grid grid-cols-2 gap-2">
                        {BEHAVIOR_OPTIONS.map((b) => {
                          const active = formData.personality.includes(b.id);
                          return (
                            <button
                              key={b.id}
                              onClick={() => toggleArray('personality', b.id)}
                              className={`p-3 rounded-[14px] flex items-center gap-2 border-2 transition-all text-left ${
                                active ? 'shadow-md' : 'border-gray-100 bg-white'
                              }`}
                              style={active ? { borderColor: '#6366F1', background: '#6366F110' } : {}}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${b.color}`}>
                                <Sparkles size={14} />
                              </div>
                              <span className="text-xs font-bold text-gray-700">
                                {normalizeBehaviorLabel(b.id, formData.gender)}
                              </span>
                            </button>
                          );
                        })}
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
                              formData.coexistsWith.includes(opt) ? 'shadow-md text-white bg-indigo-600 border-transparent' : 'border-gray-100 bg-white text-gray-600'
                            }`}
                          >
                            {opt === 'Gatos' && <Cat size={14} />}
                            {opt === 'Cachorros' && <Dog size={14} />}
                            {opt === 'Ambos' && <HeartPulse size={14} />}
                            {opt === 'Nenhum' && <X size={14} />}
                            <span className="text-xs font-bold">{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold text-gray-600">Problemas de comportamento?</span>
                      <Toggle value={formData.hasBehaviorIssues} onChange={(v) => set('hasBehaviorIssues', v)} color="red" />
                    </div>

                    {formData.hasBehaviorIssues && (
                      <div>
                        <label className={lc}>Se sim, qual?</label>
                        <textarea
                          className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-medium text-gray-600 border border-gray-100 outline-none min-h-[90px] resize-none"
                          value={formData.behaviorIssues}
                          onChange={(e) => set('behaviorIssues', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-xs font-bold text-red-700">Traumas?</span>
                      <Toggle value={formData.hasTraumaHistory} onChange={(v) => set('hasTraumaHistory', v)} color="red" />
                    </div>

                    {formData.hasTraumaHistory && (
                      <div>
                        <label className={lc}>Se sim, qual?</label>
                        <textarea
                          className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-medium text-gray-600 border border-gray-100 outline-none min-h-[90px] resize-none"
                          value={formData.traumaHistory}
                          onChange={(e) => set('traumaHistory', e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <label className={lc}>Habitat</label>
                      <div className="flex gap-2">
                        {['Interno', 'Externo', 'Misto'].map((h) => (
                          <button
                            key={h}
                            onClick={() => set('habitat', h)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all ${
                              formData.habitat === h ? 'border-transparent text-white bg-indigo-600' : 'border-gray-100 text-gray-500 bg-gray-50'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={lc}>Tipo de Moradia</label>
                      <div className="grid grid-cols-2 gap-2">
                        {HOUSING_TYPES.map((h) => (
                          <button
                            key={h}
                            onClick={() => set('housingType', h)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 text-left transition-all ${
                              formData.housingType === h ? 'border-transparent text-white bg-indigo-600' : 'border-gray-100 text-gray-500 bg-gray-50'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold text-gray-600">Acesso à rua?</span>
                      <Toggle value={formData.streetAccess} onChange={(v) => set('streetAccess', v)} color="red" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs font-bold text-gray-600">Acesso a área de risco?</span>
                      <Toggle value={formData.riskAreaAccess} onChange={(v) => set('riskAreaAccess', v)} color="red" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="bg-[#1a1a1a] rounded-[40px] shadow-2xl overflow-hidden relative">
            <button
              type="button"
              onClick={() => setShowMemorial(!showMemorial)}
              className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors relative z-10"
            >
              <div className="flex items-center gap-3">
                <Ghost size={18} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[3px]">
                  Memorial de Partida
                </span>
              </div>
              <ChevronRight size={18} className={`text-indigo-400 transition-transform ${showMemorial ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showMemorial && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="p-8 pt-0 space-y-6 relative z-10">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-indigo-300/60 uppercase tracking-widest ml-1 block">
                          Data da Partida
                        </label>
                        <input
                          type="date"
                          className="w-full p-4 bg-white/5 rounded-2xl text-white border border-white/10 outline-none font-bold text-xs"
                          value={formData.deathDate}
                          onChange={(e) => set('deathDate', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-indigo-300/60 uppercase tracking-widest ml-1 block">
                          Causa Mortis
                        </label>
                        <select
                          className="w-full p-4 bg-white/5 rounded-2xl text-white border border-white/10 outline-none font-bold text-xs appearance-none"
                          value={formData.deathCause}
                          onChange={(e) => set('deathCause', e.target.value)}
                        >
                          <option value="" style={{ background: '#1a1a2e', color: 'white' }}>Não informado</option>
                          <option value="IRC" style={{ background: '#1a1a2e', color: 'white' }}>IRC — Insuficiência Renal Crônica</option>
                          <option value="FIV" style={{ background: '#1a1a2e', color: 'white' }}>FIV — Imunodeficiência Felina</option>
                          <option value="FELV" style={{ background: '#1a1a2e', color: 'white' }}>FeLV — Leucemia Felina</option>
                          <option value="LINFOMA" style={{ background: '#1a1a2e', color: 'white' }}>Linfoma / Câncer</option>
                          <option value="PIF" style={{ background: '#1a1a2e', color: 'white' }}>PIF — Peritonite Infecciosa Felina</option>
                          <option value="TRAUMA" style={{ background: '#1a1a2e', color: 'white' }}>Trauma / Acidente</option>
                          <option value="INFECCAO" style={{ background: '#1a1a2e', color: 'white' }}>Infecção Grave</option>
                          <option value="CARDIACO" style={{ background: '#1a1a2e', color: 'white' }}>Problema Cardíaco</option>
                          <option value="VELHICE" style={{ background: '#1a1a2e', color: 'white' }}>Velhice Natural</option>
                          <option value="DESCONHECIDO" style={{ background: '#1a1a2e', color: 'white' }}>Causa Desconhecida</option>
                          <option value="OUTRO" style={{ background: '#1a1a2e', color: 'white' }}>Outro</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-indigo-300/60 uppercase tracking-widest ml-1 block">
                          Título Memorial
                        </label>
                        <input
                          className="w-full p-4 bg-white/5 rounded-2xl text-white border border-white/10 outline-none font-medium text-xs"
                          placeholder="Ex: Para sempre em nossos corações"
                          value={formData.memorialTitle}
                          onChange={(e) => set('memorialTitle', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-indigo-300/60 uppercase tracking-widest ml-1 block">
                          Mensagem do Tutor
                        </label>
                        <textarea
                          className="w-full p-4 bg-white/5 rounded-2xl text-white border border-white/10 outline-none font-medium text-xs min-h-[110px] resize-none"
                          placeholder="Escreva uma homenagem para este gatinho..."
                          value={formData.memorialMessage}
                          onChange={(e) => set('memorialMessage', e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3">
                          <Heart size={16} className="text-indigo-300" />
                          <div>
                            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-wider">
                              Memorial público
                            </p>
                            <p className="text-[8px] text-indigo-300/50 font-medium mt-0.5">
                              Exibir na constelação comunitária do memorial
                            </p>
                          </div>
                        </div>
                        <Toggle value={formData.memorialIsPublic} onChange={(v) => set('memorialIsPublic', v)} />
                      </div>

                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-wider">
                              Marcar In Memoriam
                            </p>
                            <p className="text-[8px] text-indigo-300/50 font-medium mt-0.5">
                              O gato continua na sua lista com visual especial
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            className="w-6 h-6 accent-indigo-500 flex-shrink-0"
                            checked={formData.isMemorial}
                            onChange={(e) => setFormData((f) => ({ ...f, isMemorial: e.target.checked, isArchived: false }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div className="py-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-4 border-2 border-dashed border-red-100 text-red-300 rounded-[30px] font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-3 hover:bg-red-50 transition-all active:scale-95"
            >
              Excluir Perfil Permanentemente
            </button>
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full py-5 text-white rounded-full font-black uppercase tracking-[3px] shadow-[0_16px_30px_rgba(107,48,224,0.28)] flex items-center justify-center gap-3 active:scale-95 mb-8 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, rgb(139, 74, 255), rgb(107, 48, 224))' }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Salvar Perfil</>}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-end justify-center"
          >
            <motion.div
              initial={{ y: 72, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 72, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-t-[45px] p-10 pb-14 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>

              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter mb-2">
                Excluir {formData.name}?
              </h3>

              <div className="my-6 space-y-2 text-left">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">
                  Qual o motivo?
                </label>
                <select
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none border border-gray-100"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                >
                  <option value="">Selecione um motivo...</option>
                  <option value="erro">Erro no cadastro</option>
                  <option value="partida">O gatinho faleceu 🕯️</option>
                  <option value="doacao">Foi doado / Novo lar</option>
                  <option value="outro">Outro motivo</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute('href', dataStr);
                  downloadAnchorNode.setAttribute('download', `backup_${formData.name}.json`);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
                className="w-full py-4 mb-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-indigo-100"
              >
                <Upload size={14} className="rotate-180" /> Baixar Backup de Segurança
              </button>

              <div className="space-y-3">
                <button
                  onClick={handleDelete}
                  disabled={!deleteReason}
                  className={`w-full py-5 rounded-[25px] font-black uppercase text-[10px] tracking-widest shadow-lg ${
                    deleteReason ? 'bg-red-500 text-white' : 'bg-gray-200 text-white cursor-not-allowed'
                  }`}
                >
                  Confirmar Exclusão
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-5 bg-gray-100 text-gray-400 rounded-[25px] font-black uppercase text-[10px] tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
