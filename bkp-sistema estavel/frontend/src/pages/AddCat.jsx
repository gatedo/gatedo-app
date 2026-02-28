import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, ChevronRight, ChevronLeft, Check, AlertTriangle,
  ChevronDown, Plus, Award, Heart, Zap, Moon, Sun,
  Music, Smile, Star, Activity, Home, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

// ─── DADOS ────────────────────────────────────────────────────────────────────

const CAT_BREEDS = [
  "Persa", "Siamês", "Maine Coon", "Angorá", "Sphynx",
  "Ragdoll", "British Shorthair", "Exótico", "Bengal", "Outra Raça",
];

const BEHAVIORS = [
  { id: 'calmo',        label: 'Calmo',       icon: Moon,          color: 'bg-blue-50 text-blue-600' },
  { id: 'eletrico',     label: 'Elétrico',    icon: Zap,           color: 'bg-yellow-50 text-yellow-600' },
  { id: 'carinhoso',    label: 'Grude',       icon: Heart,         color: 'bg-pink-50 text-pink-600' },
  { id: 'independente', label: 'Rei/Rainha',  icon: Star,          color: 'bg-purple-50 text-purple-600' },
  { id: 'falante',      label: 'Mia Muito',   icon: Music,         color: 'bg-green-50 text-green-600' },
  { id: 'comilao',      label: 'Comilão',     icon: Smile,         color: 'bg-orange-50 text-orange-600' },
  { id: 'medroso',      label: 'Assustado',   icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  { id: 'cacador',      label: 'Caçador',     icon: Sun,           color: 'bg-teal-50 text-teal-600' },
];

const PROFILE_COLORS = [
  'bg-[#FFF5E6]', 'bg-[#E6FDFF]', 'bg-[#F5D8E8]', 'bg-[#EFFFDE]',
  'bg-[#F0F0F0]', 'bg-[#E6E6FA]', 'bg-[#FFFACD]', 'bg-[#FFE4E1]',
  'bg-[#ffebee]', 'bg-[#f3e5f5]', 'bg-[#e8eaf6]', 'bg-[#e0f7fa]',
];

// ─── TOGGLE ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, color = 'green' }) {
  const bg = value
    ? color === 'red' ? 'bg-red-500' : 'bg-green-500'
    : 'bg-gray-300';
  return (
    <div onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${bg}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function AddCat() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [step, setStep]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [colorIndex, setColorIndex]   = useState(0);
  const VISIBLE_COLORS = 5;

  const [formData, setFormData] = useState({
    // IDENTIDADE
    name:            '',
    nicknames:       '',
    gender:          'MALE',
    catType:         'SRD',    // controle de UI apenas
    breed:           'SRD',
    adoptionStory:   '',
    hasAwards:       false,
    awardsDetail:    '',
    microchip:       '',
    city:            '',

    // IDADE
    birthDate:       '',
    ageYears:        '',
    ageMonths:       '',
    isDateEstimated: false,

    // SAÚDE
    weight:          '',
    neutered:        false,
    neuterIntention: '',
    healthSummary:   '',

    // NUTRIÇÃO
    foodType:        [],
    foodBrand:       '',
    foodFreq:        '',

    // COMPORTAMENTO
    personality:     [],        // behaviors do UI → personality no schema
    activityLevel:   'Média',
    socialOtherPets: '',
    behaviorIssues:  '',
    traumaHistory:   '',

    // AMBIENTE
    habitat:         'Interno',
    housingType:     '',
    streetAccess:    false,
    riskAreaAccess:  false,

    // ESTÉTICA
    themeColor:      'bg-[#FFF5E6]',  // color do UI → themeColor no schema
    avatarFile:      null,
    avatarPreview:   null,
  });

  useEffect(() => {
    setGeneratedId(Math.floor(100000 + Math.random() * 900000).toString());
  }, []);

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const toggleArray = (key, id) =>
    setFormData(prev => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(id) ? arr.filter(v => v !== id) : [...arr, id] };
    });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('avatarFile', file);
    set('avatarPreview', URL.createObjectURL(file));
  };

  // ─── SUBMIT ────────────────────────────────────────────────────────────────

  const handleFinish = async () => {
    if (!formData.name.trim()) { alert('Digite o nome do gato!'); return; }
    setLoading(true);
    try {
      const data = new FormData();

      // Campos simples
      data.append('ownerId',         user?.id ?? '');
      data.append('name',            formData.name);
      data.append('nicknames',       formData.nicknames);
      data.append('gender',          formData.gender);           // já em MALE/FEMALE
      data.append('breed',           formData.breed);
      data.append('city',            formData.city);
      data.append('microchip',       formData.microchip);
      data.append('weight',          String(formData.weight || 0));
      data.append('neutered',        String(formData.neutered));
      data.append('neuterIntention', formData.neuterIntention);
      data.append('healthSummary',   formData.healthSummary);
      data.append('foodBrand',       formData.foodBrand);
      data.append('foodFreq',        formData.foodFreq);
      data.append('activityLevel',   formData.activityLevel);
      data.append('socialOtherPets', formData.socialOtherPets);
      data.append('behaviorIssues',  formData.behaviorIssues);
      data.append('traumaHistory',   formData.traumaHistory);
      data.append('habitat',         formData.habitat);
      data.append('housingType',     formData.housingType);
      data.append('streetAccess',    String(formData.streetAccess));
      data.append('riskAreaAccess',  String(formData.riskAreaAccess));
      data.append('adoptionStory',   formData.adoptionStory);
      data.append('hasAwards',       String(formData.hasAwards));
      data.append('awardsDetail',    formData.awardsDetail);
      data.append('themeColor',      formData.themeColor);
      data.append('isDateEstimated', String(formData.isDateEstimated));

      if (formData.isDateEstimated) {
        data.append('ageYears',  String(formData.ageYears  || 0));
        data.append('ageMonths', String(formData.ageMonths || 0));
      } else if (formData.birthDate) {
        data.append('birthDate', formData.birthDate);
      }

      // Arrays — item por item para o backend receber String[]
      formData.personality.forEach(p => data.append('personality', p));
      formData.foodType.forEach(f    => data.append('foodType', f));

      // Arquivo de avatar
      if (formData.avatarFile) data.append('file', formData.avatarFile);

      const response = await api.post('/pets', data);
      if (response.status === 201 || response.status === 200) {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Erro ao registrar gato:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ─── TELA DE SUCESSO ───────────────────────────────────────────────────────

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#6158ca] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <motion.div
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white rounded-[45px] shadow-2xl w-full max-w-sm relative z-10"
        >
          {/* Faixa amarela */}
          <div className="bg-[#ebfc66] h-32 relative overflow-hidden rounded-t-[45px]">
            <img src="/assets/logo-fundo1.svg" className="absolute left-5 top-4 h-6 opacity-30 brightness-0" />
            <div className="absolute top-4 right-5 flex items-center gap-1 text-[#6158ca] opacity-50">
              <Lock size={11} /><span className="text-[9px] font-black tracking-widest">RG OFICIAL</span>
            </div>
          </div>

          {/* Avatar — posicionado absolutamente na borda do card */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{top: '72px'}}>
            <div className="w-28 h-28 rounded-full border-[5px] border-white shadow-lg bg-gray-100 overflow-hidden">
              {formData.avatarPreview
                ? <img src={formData.avatarPreview} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-200"><Camera size={28}/></div>}
            </div>
          </div>

          {/* Conteúdo do cartão */}
          <div className="flex flex-col items-center px-8 pb-8 pt-20">
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-none">{formData.name}</h2>
            <span className="text-[10px] font-bold text-indigo-400 tracking-[3px] uppercase mt-1">ID #{generatedId}</span>

            <div className="w-full grid grid-cols-2 gap-3 text-left border-t border-gray-100 mt-6 pt-5">
              <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Cidade</p><p className="font-bold text-xs text-gray-700">{formData.city || '—'}</p></div>
              <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Raça</p><p className="font-bold text-xs text-gray-700">{formData.breed || 'SRD'}</p></div>
              <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Sexo</p><p className="font-bold text-xs text-gray-700">{formData.gender === 'MALE' ? 'Macho' : 'Fêmea'}</p></div>
              <div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Peso</p><p className="font-bold text-xs text-gray-700">{formData.weight ? `${formData.weight} kg` : '—'}</p></div>
            </div>

            <div className="flex gap-3 mt-6 w-full">
              <button onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-gray-50 rounded-[20px] font-bold text-gray-500 text-xs flex items-center justify-center gap-1">
                <Plus size={14}/> Outro Gatinho
              </button>
              <button onClick={() => navigate('/home')}
                className="flex-1 py-4 bg-[#6158ca] text-white rounded-[20px] font-black text-xs">
                Ir pro App
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── ESTILOS ───────────────────────────────────────────────────────────────

  const inputClass   = "w-full bg-white border border-gray-100 focus:border-[#6158ca] rounded-[18px] px-4 py-3 text-gray-700 font-bold shadow-sm placeholder-gray-300 outline-none transition-all text-sm appearance-none";
  const labelClass   = "text-xs font-black text-gray-500 ml-1 uppercase tracking-wide mb-1 block";
  const sectionTitle = "text-base font-black text-gray-800 mb-3 mt-5 flex items-center gap-2";

  // ─── RENDER PRINCIPAL ──────────────────────────────────────────────────────

  return (
    <div className="pb-40 min-h-screen bg-[#F8F9FE]">

      {/* ── HEADER ── */}
      <div className="bg-[#6158ca] h-44 rounded-b-[55px] relative w-full overflow-hidden mb-8 shadow-lg">
        <img src="/assets/logo-fundo1.svg" className="absolute -top-16 -right-16 w-64 h-64 opacity-100 pointer-events-none rotate-12" />
        <div className="absolute top-10 left-6 right-6 flex items-center justify-between z-20">
          <button onClick={() => step === 1 ? navigate(-1) : setStep(s => s - 1)}
            className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-1.5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-[#ebfc66]' : 'w-2 bg-white/30'}`} />
            ))}
          </div>
          <div className="w-11" />
        </div>
        <div className="absolute bottom-5 left-6 text-white">
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-0.5">Etapa {step} de 4</p>
          <h1 className="text-xl font-black leading-tight">
            {step === 1 && 'Identidade & Origem'}
            {step === 2 && 'Nutrição & Saúde'}
            {step === 3 && 'Comportamento & Lar'}
            {step === 4 && 'Galeria & Estilo'}
          </h1>
        </div>
      </div>

      <div className="px-5 space-y-4">

        {/* ══════════ ETAPA 1: IDENTIDADE ══════════ */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Avatar */}
            <label className="flex flex-col items-center cursor-pointer">
              <div className="w-28 h-28 rounded-[36px] bg-white border-4 border-white shadow-xl overflow-hidden flex items-center justify-center relative group">
                {formData.avatarPreview
                  ? <img src={formData.avatarPreview} className="w-full h-full object-cover" />
                  : <Camera size={30} className="text-gray-200" />}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[32px]">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
              <span className="text-xs font-bold text-gray-400 mt-2">Toque para adicionar foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>

            {/* Nome e Apelido */}
            <div>
              <label className={labelClass}>Nome do Gato *</label>
              <input className={inputClass} placeholder="Digite o nome..."
                value={formData.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Apelidos Carinhosos</label>
              <input className={inputClass} placeholder="Ex: Fred, Dico..."
                value={formData.nicknames} onChange={e => set('nicknames', e.target.value)} />
            </div>

            {/* Tipo: SRD ou Raça */}
            <div>
              <label className={labelClass}>Raça / Origem *</label>
              <div className="flex bg-white p-1.5 rounded-[18px] shadow-sm mb-4">
                {[['SRD','SRD (Vira-lata)'],['RACA','Raça Definida']].map(([val, label]) => (
                  <button key={val}
                    onClick={() => setFormData(p => ({ ...p, catType: val, breed: val === 'SRD' ? 'SRD' : '' }))}
                    className={`flex-1 py-3 rounded-[14px] text-xs font-black uppercase tracking-wider transition-all ${
                      formData.catType === val ? 'bg-[#6158ca] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'
                    }`}>{label}</button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {formData.catType === 'RACA' ? (
                  <motion.div key="raca" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="relative">
                      <select className={inputClass} value={formData.breed} onChange={e => set('breed', e.target.value)}>
                        <option value="" disabled>Selecione a raça...</option>
                        {CAT_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                    <div className="bg-white p-3 rounded-[16px] border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600 flex items-center gap-2">
                          <Award size={14}/> Participa de Eventos?
                        </span>
                        <Toggle value={formData.hasAwards} onChange={v => set('hasAwards', v)} />
                      </div>
                      {formData.hasAwards && (
                        <input className="w-full bg-gray-50 rounded-xl px-3 py-2 text-xs mt-3 outline-none"
                          placeholder="Quais prêmios?" value={formData.awardsDetail}
                          onChange={e => set('awardsDetail', e.target.value)} />
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="srd" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-orange-50 p-4 rounded-[20px] border border-orange-100 space-y-2">
                      <label className="text-xs font-bold text-orange-800 flex items-center gap-2">
                        <Heart size={14}/> História da Adoção
                      </label>
                      <textarea className="w-full bg-white rounded-xl p-3 text-sm border-none h-24 placeholder-orange-300 font-medium outline-none"
                        placeholder="Conte a história dele..." value={formData.adoptionStory}
                        onChange={e => set('adoptionStory', e.target.value)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sexo e Peso */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Sexo</label>
                <div className="flex bg-white rounded-[16px] p-1 border border-gray-100 shadow-sm h-[46px]">
                  {[['MALE','Macho'],['FEMALE','Fêmea']].map(([val, label]) => (
                    <button key={val} onClick={() => set('gender', val)}
                      className={`flex-1 rounded-[12px] text-xs font-bold transition-all ${
                        formData.gender === val ? 'bg-[#6158ca] text-white shadow-sm' : 'text-gray-400'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Peso (kg)</label>
                <input type="number" className={inputClass} placeholder="0.0"
                  value={formData.weight} onChange={e => set('weight', e.target.value)} />
              </div>
            </div>

            {/* Nascimento */}
            <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 space-y-4">
              <div className="flex gap-4 border-b border-gray-50 pb-3">
                <button onClick={() => set('isDateEstimated', false)}
                  className={`text-xs font-bold ${!formData.isDateEstimated ? 'text-[#6158ca]' : 'text-gray-400'}`}>
                  Data de Nascimento
                </button>
                <button onClick={() => set('isDateEstimated', true)}
                  className={`text-xs font-bold ${formData.isDateEstimated ? 'text-[#6158ca]' : 'text-gray-400'}`}>
                  Idade Aproximada
                </button>
              </div>
              {!formData.isDateEstimated ? (
                <input type="date" className={inputClass} value={formData.birthDate}
                  onChange={e => set('birthDate', e.target.value)} />
              ) : (
                <div className="flex gap-3">
                  <input type="number" className={inputClass} placeholder="Anos"
                    value={formData.ageYears} onChange={e => set('ageYears', e.target.value)} />
                  <input type="number" className={inputClass} placeholder="Meses"
                    value={formData.ageMonths} onChange={e => set('ageMonths', e.target.value)} />
                </div>
              )}
            </div>

            {/* Cidade e Microchip */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Cidade</label>
                <input className={inputClass} placeholder="Ex: São Paulo"
                  value={formData.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Microchip</label>
                <input className={inputClass} placeholder="Opcional"
                  value={formData.microchip} onChange={e => set('microchip', e.target.value)} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════ ETAPA 2: NUTRIÇÃO & SAÚDE ══════════ */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* Castração */}
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Gato Castrado?</span>
                <Toggle value={formData.neutered} onChange={v => set('neutered', v)} />
              </div>
              {!formData.neutered && (
                <input className={inputClass} placeholder="Pretende castrar? (Sim / Não / Futuramente)"
                  value={formData.neuterIntention} onChange={e => set('neuterIntention', e.target.value)} />
              )}
            </div>

            {/* Alimentação */}
            <h3 className={sectionTitle}><Star size={16}/> Alimentação</h3>
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className={labelClass}>Tipo de Ração</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Seca','Úmida','Natural','Mista'].map(t => (
                    <button key={t} onClick={() => toggleArray('foodType', t)}
                      className={`py-2.5 rounded-[14px] text-xs font-bold border transition-all ${
                        formData.foodType.includes(t)
                          ? 'bg-[#6158ca]/10 border-[#6158ca] text-[#6158ca]'
                          : 'border-gray-100 text-gray-500'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Marca da Ração</label>
                <input className={inputClass} placeholder="Ex: Premier, Royal Canin..."
                  value={formData.foodBrand} onChange={e => set('foodBrand', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Frequência de Alimentação</label>
                <input className={inputClass} placeholder="Ex: 2x ao dia, à vontade..."
                  value={formData.foodFreq} onChange={e => set('foodFreq', e.target.value)} />
              </div>
            </div>

            {/* Histórico de Saúde */}
            <h3 className={sectionTitle}><Activity size={16}/> Histórico de Saúde</h3>
            <textarea
              className="w-full bg-white border border-gray-100 rounded-[18px] p-4 text-sm font-medium h-24 focus:border-[#6158ca] outline-none"
              placeholder="Liste doenças crônicas, alergias, cirurgias..."
              value={formData.healthSummary} onChange={e => set('healthSummary', e.target.value)} />
          </motion.div>
        )}

        {/* ══════════ ETAPA 3: COMPORTAMENTO & LAR ══════════ */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            <h3 className={sectionTitle}>Comportamento</h3>
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-4">

              {/* Temperamento */}
              <div>
                <label className={labelClass}>Temperamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {BEHAVIORS.map(b => {
                    const active = formData.personality.includes(b.id);
                    return (
                      <button key={b.id} onClick={() => toggleArray('personality', b.id)}
                        className={`p-3 rounded-[14px] flex items-center gap-2 border transition-all text-left ${
                          active
                            ? 'border-[#6158ca] shadow-md ring-1 ring-[#6158ca]/20 bg-white'
                            : 'border-transparent shadow-sm opacity-60 bg-white'
                        }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${b.color}`}>
                          <b.icon size={15}/>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nível de Atividade */}
              <div>
                <label className={labelClass}>Nível de Atividade</label>
                <div className="flex gap-2">
                  {['Baixa','Média','Alta'].map(l => (
                    <button key={l} onClick={() => set('activityLevel', l)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                        formData.activityLevel === l
                          ? 'bg-blue-100 border-blue-200 text-blue-700'
                          : 'border-gray-100 text-gray-500'
                      }`}>{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Convive com outros animais?</label>
                <input className={inputClass} placeholder="Ex: Sim, 2 gatos"
                  value={formData.socialOtherPets} onChange={e => set('socialOtherPets', e.target.value)} />
              </div>

              <div>
                <label className={labelClass}>Problemas de Comportamento</label>
                <textarea className="w-full bg-gray-50 rounded-xl p-3 text-sm h-16 outline-none placeholder-gray-400"
                  placeholder="Ex: Destrói móveis, agressivo..."
                  value={formData.behaviorIssues} onChange={e => set('behaviorIssues', e.target.value)} />
              </div>
            </div>

            {/* Traumas */}
            <div className="bg-red-50 p-4 rounded-[20px] border border-red-100">
              <label className="text-xs font-bold text-red-800 flex items-center gap-2 mb-2">
                <AlertTriangle size={14}/> Tem algum trauma ou medo?
              </label>
              <textarea className="w-full bg-white rounded-xl p-3 text-sm border-none h-20 placeholder-red-200 outline-none"
                placeholder="Ex: Medo de vassoura, barulhos altos..."
                value={formData.traumaHistory} onChange={e => set('traumaHistory', e.target.value)} />
            </div>

            {/* Ambiente */}
            <h3 className={sectionTitle}><Home size={16}/> Ambiente</h3>
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm space-y-4">
              <div>
                <label className={labelClass}>Habitat</label>
                <div className="flex gap-2">
                  {['Interno','Externo','Misto'].map(h => (
                    <button key={h} onClick={() => set('habitat', h)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                        formData.habitat === h
                          ? 'bg-[#6158ca]/10 border-[#6158ca] text-[#6158ca]'
                          : 'border-gray-100 text-gray-500'
                      }`}>{h}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Tipo de Moradia</label>
                <input className={inputClass} placeholder="Casa, Apartamento..."
                  value={formData.housingType} onChange={e => set('housingType', e.target.value)} />
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-600">Acesso à rua?</span>
                <Toggle value={formData.streetAccess} onChange={v => set('streetAccess', v)} color="red" />
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-600">Acesso a área de risco?</span>
                <Toggle value={formData.riskAreaAccess} onChange={v => set('riskAreaAccess', v)} color="red" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════ ETAPA 4: GALERIA & ESTILO ══════════ */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

            {/* Cor do Tema */}
            <div>
              <label className={labelClass}>Cor do Tema</label>
              <div className="flex items-center gap-2 bg-white p-2 rounded-[24px] shadow-sm">
                <button
                  onClick={() => setColorIndex(i => Math.max(0, i - 1))}
                  disabled={colorIndex === 0}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#6158ca] disabled:opacity-30">
                  <ChevronLeft size={20} />
                </button>
                <div className="flex-1 flex justify-center gap-3 overflow-hidden">
                  {PROFILE_COLORS.slice(colorIndex, colorIndex + VISIBLE_COLORS).map(color => (
                    <button key={color} onClick={() => set('themeColor', color)}
                      className={`w-8 h-8 rounded-full ${color} border border-gray-200 transition-all ${
                        formData.themeColor === color ? 'scale-125 ring-2 ring-[#6158ca] ring-offset-2' : ''
                      }`} />
                  ))}
                </div>
                <button
                  onClick={() => setColorIndex(i => Math.min(PROFILE_COLORS.length - VISIBLE_COLORS, i + 1))}
                  disabled={colorIndex + VISIBLE_COLORS >= PROFILE_COLORS.length}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#6158ca] disabled:opacity-30">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Prévia do RG */}
            <div>
              <label className={labelClass}>Prévia do RG</label>
              <div className={`rounded-[28px] ${formData.themeColor} p-5 border border-white/50 shadow-inner flex items-center gap-4`}>
                <div className="w-16 h-16 rounded-full bg-white shadow overflow-hidden flex-shrink-0">
                  {formData.avatarPreview
                    ? <img src={formData.avatarPreview} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-200"><Camera size={20}/></div>}
                </div>
                <div>
                  <p className="font-black text-gray-800 text-lg leading-none">{formData.name || 'Seu Gatinho'}</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">
                    {formData.breed || 'SRD'} · {formData.gender === 'MALE' ? 'Macho' : 'Fêmea'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">ID #{generatedId}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-gray-400 font-bold px-4">
              Você poderá adicionar mais fotos à galeria após salvar o perfil 🐾
            </p>
          </motion.div>
        )}

      </div>

      {/* ── BOTÃO FLUTUANTE ── */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-[999]">
        <button
          onClick={step === 4 ? handleFinish : () => setStep(s => s + 1)}
          disabled={loading}
          className="w-full max-w-[320px] bg-[#6158ca] text-white py-5 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading
            ? 'Salvando...'
            : step === 4
              ? <><span>Gerar RG Gatedo 🐾</span><Check size={16} strokeWidth={3}/></>
              : <><span>Próximo Passo</span><ChevronRight size={16} strokeWidth={3}/></>
          }
        </button>
      </div>

    </div>
  );
}