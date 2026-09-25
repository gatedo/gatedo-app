import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Scale } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import OnboardingBadgeCard from '../components/OnboardingBadgeCard';
import { CAT_BREEDS } from '../utils/catBreeds';
import { track } from '../utils/track';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6' };

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Macho' },
  { value: 'FEMALE', label: 'Fêmea' },
  { value: 'UNKNOWN', label: 'Não sei' },
];

function fireTourEvent(step) {
  api.post('/offers/event', { surface: 'ONBOARDING_TOUR', offerKey: `STEP_${step}`, action: 'IMPRESSION' }).catch(() => {});
}

function TopBar({ step, onClose, dark }) {
  return (
    <div className="px-5 pt-6 pb-2 flex items-center gap-3">
      <div className="flex-1 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: n <= step ? (dark ? '#ebfc66' : C.purple) : dark ? 'rgba(255,255,255,0.25)' : '#EDE9FE' }}
          />
        ))}
      </div>
      <button
        onClick={onClose}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dark ? 'bg-white/15' : 'bg-gray-100'}`}
      >
        <X size={14} className={dark ? 'text-white' : 'text-gray-500'} />
      </button>
    </div>
  );
}

const screenMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.22 },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();

  const [wizardStep, setWizardStep] = useState(1);
  const [ready, setReady] = useState(false);
  const [cat, setCat] = useState(null);

  // Formulário do passo 2
  const [name, setName] = useState('');
  const [gender, setGender] = useState(null);
  const [breedMode, setBreedMode] = useState('SRD'); // 'SRD' | 'CUSTOM'
  const [breedValue, setBreedValue] = useState('');
  const [neutered, setNeutered] = useState(null);
  const [ageChoice, setAgeChoice] = useState(null); // 'NOW' | 'LATER'
  const [ageMethod, setAgeMethod] = useState(null); // 'APPROX' | 'BIRTH' | 'ADOPTION'
  const [approxYears, setApproxYears] = useState('');
  const [approxMonths, setApproxMonths] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [savingCat, setSavingCat] = useState(false);
  const fileInputRef = useRef(null);

  // Passo 3
  const [weightValue, setWeightValue] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  // Resolve de onde entrar: item pendente na Home manda ?step= e ?catId=
  useEffect(() => {
    if (!user?.id) return;

    const queryStep = Number(searchParams.get('step') || 0);
    const queryCatId = searchParams.get('catId');

    api.get(`/users/${user.id}/onboarding`).then(async (r) => {
      const { step: serverStep, completedAt } = r.data || {};
      if (completedAt) {
        navigate('/home');
        return;
      }

      if (queryStep >= 2) {
        setWizardStep(queryStep);
        if (queryCatId) {
          try {
            const petRes = await api.get(`/pets/${queryCatId}`);
            setCat(petRes.data);
          } catch {}
        }
      } else {
        setWizardStep(Math.min(5, (serverStep || 0) + 1));
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, [user?.id]);

  useEffect(() => {
    if (!ready) return;
    fireTourEvent(wizardStep);
    if (wizardStep === 1) track('tour_started');
    else track('tour_step', { step: wizardStep });
  }, [ready, wizardStep]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const advance = async (step) => {
    if (user?.id) api.patch(`/users/${user.id}/onboarding`, { step }).catch(() => {});
  };

  const exitTour = () => {
    touch();
    track('tour_skipped', { step: wizardStep });
    navigate('/home');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submitCat = async () => {
    if (!name.trim() || savingCat) return;
    touch();
    setSavingCat(true);
    try {
      const fd = new FormData();
      fd.append('ownerId', user.id);
      fd.append('name', name.trim());
      fd.append('neutered', String(neutered === true));
      if (gender) fd.append('gender', gender);
      if (breedMode === 'CUSTOM' && breedValue.trim()) fd.append('breed', breedValue.trim());

      if (ageChoice === 'NOW' && ageMethod === 'APPROX' && (approxYears || approxMonths)) {
        fd.append('isDateEstimated', 'true');
        fd.append('ageYears', String(parseInt(approxYears, 10) || 0));
        fd.append('ageMonths', String(parseInt(approxMonths, 10) || 0));
      } else if (ageChoice === 'NOW' && (ageMethod === 'BIRTH' || ageMethod === 'ADOPTION') && dateValue) {
        fd.append('birthDate', dateValue);
        fd.append('isDateEstimated', String(ageMethod === 'ADOPTION'));
      }

      if (photoFile) fd.append('photo', photoFile);

      const res = await api.post('/pets', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCat(res.data);
      await advance(2);
      setWizardStep(3);
    } catch {
      // segue tentando — não trava o tour por uma falha pontual de rede
    } finally {
      setSavingCat(false);
    }
  };

  const submitWeight = async () => {
    const weightNum = parseFloat(String(weightValue).replace(',', '.'));
    if (!weightNum || weightNum <= 0 || savingWeight || !cat?.id) return;
    touch();
    setSavingWeight(true);
    try {
      await api.patch(`/pets/${cat.id}`, { weight: weightNum });
      await api.post('/health-records', {
        petId: cat.id,
        type: 'EXAM',
        title: `Check-in de Peso: ${weightNum}kg`,
        date: new Date(),
        notes: 'Peso registrado no tour de boas-vindas.',
      });
      await advance(3);
      setWizardStep(4);
    } catch {
      // idem — segue, não bloqueia o tour
    } finally {
      setSavingWeight(false);
    }
  };

  const goHealthDone = async () => {
    touch();
    await advance(4);
    setWizardStep(5);
  };

  const finishTour = async () => {
    touch();
    track('tour_completed');
    if (user?.id) await api.post(`/users/${user.id}/onboarding/complete`).catch(() => {});
    navigate('/home', { state: { startFeatureTour: true } });
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gatedo-light-bg)]">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#8B4AFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] flex flex-col">
      <TopBar step={wizardStep} onClose={exitTour} />

      <div className="flex-1 flex flex-col px-6 pb-10">
        <AnimatePresence mode="wait">
          {wizardStep === 1 && (
            <motion.div key="s1" {...screenMotion} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-[26px] flex items-center justify-center mb-6 shadow-lg" style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
                <span className="text-4xl">🐾</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-3">Bem-vindo(a) ao GATEDO</h1>
              <p className="text-[14px] font-medium text-gray-500 leading-relaxed max-w-xs mb-10">
                O GATEDO te ajuda a acompanhar a saúde do seu gato de perto — pra você perceber cedo o que ele não consegue te contar.
              </p>
              <button
                onClick={async () => { touch(); await advance(1); setWizardStep(2); }}
                className="w-full max-w-xs px-5 py-3.5 rounded-2xl font-black text-white text-sm"
                style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
              >
                Começar
              </button>
            </motion.div>
          )}

          {wizardStep === 2 && (
            <motion.div key="s2" {...screenMotion} className="flex-1 flex flex-col pt-4">
              <h2 className="text-xl font-black text-gray-900 mb-1">Cadastre seu gato</h2>
              <p className="text-[13px] font-medium text-gray-500 mb-6">Só o essencial agora — o resto da ficha fica pra depois.</p>

              <div className="flex justify-center mb-6">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-full bg-white border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                  {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" alt="" /> : <Camera size={22} className="text-gray-300" />}
                </button>
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do gato"
                className="w-full bg-white rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-800 outline-none border border-gray-100 mb-4"
              />

              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wide mb-2">Sexo</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { touch('light'); setGender(opt.value); }}
                    className={`py-2.5 rounded-xl text-[11px] font-black border ${gender === opt.value ? 'text-white border-transparent' : 'text-gray-500 border-gray-100 bg-white'}`}
                    style={gender === opt.value ? { background: C.purple } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wide mb-2">Raça</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[{ v: 'SRD', label: 'SRD' }, { v: 'CUSTOM', label: 'Tenho a raça' }].map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => { touch('light'); setBreedMode(opt.v); }}
                    className={`py-2.5 rounded-xl text-[12px] font-black border ${breedMode === opt.v ? 'text-white border-transparent' : 'text-gray-500 border-gray-100 bg-white'}`}
                    style={breedMode === opt.v ? { background: C.purple } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {breedMode === 'CUSTOM' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-2 max-h-52 overflow-y-auto grid grid-cols-2 gap-2 pr-1"
                >
                  {CAT_BREEDS.filter((b) => b !== '(SRD) Sem raça definida').map((b) => (
                    <button
                      key={b}
                      onClick={() => { touch('light'); setBreedValue(b); }}
                      className={`py-2.5 px-3 rounded-xl text-[11px] font-bold border text-left ${breedValue === b ? 'text-white border-transparent' : 'text-gray-500 border-gray-100 bg-white'}`}
                      style={breedValue === b ? { background: C.purple } : undefined}
                    >
                      {b}
                    </button>
                  ))}
                </motion.div>
              )}
              <div className="mb-4" />

              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wide mb-2">Castrado?</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[{ v: true, label: 'Sim' }, { v: false, label: 'Não' }].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => { touch('light'); setNeutered(opt.v); }}
                    className={`py-2.5 rounded-xl text-[12px] font-black border ${neutered === opt.v ? 'text-white border-transparent' : 'text-gray-500 border-gray-100 bg-white'}`}
                    style={neutered === opt.v ? { background: C.purple } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wide mb-2">Idade</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[{ v: 'NOW', label: 'Prefiro agora' }, { v: 'LATER', label: 'Deixo pra depois' }].map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => { touch('light'); setAgeChoice(opt.v); if (opt.v === 'LATER') setAgeMethod(null); }}
                    className={`py-2.5 rounded-xl text-[12px] font-black border ${ageChoice === opt.v ? 'text-white border-transparent' : 'text-gray-500 border-gray-100 bg-white'}`}
                    style={ageChoice === opt.v ? { background: C.purple } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {ageChoice === 'NOW' && (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { v: 'APPROX', label: 'Idade aprox.' },
                      { v: 'BIRTH', label: 'Nascimento' },
                      { v: 'ADOPTION', label: 'Adoção' },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => { touch('light'); setAgeMethod(opt.v); }}
                        className={`py-2 rounded-xl text-[10px] font-black border ${ageMethod === opt.v ? 'text-white border-transparent' : 'text-gray-500 border-gray-100 bg-white'}`}
                        style={ageMethod === opt.v ? { background: C.purple } : undefined}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {ageMethod === 'APPROX' && (
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 flex items-center gap-1.5 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={approxYears}
                          onChange={(e) => setApproxYears(e.target.value)}
                          placeholder="3"
                          className="flex-1 w-full bg-transparent text-sm font-black text-gray-800 outline-none"
                        />
                        <span className="text-[11px] font-black text-gray-400 shrink-0">anos</span>
                      </div>
                      <div className="flex-1 flex items-center gap-1.5 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={approxMonths}
                          onChange={(e) => setApproxMonths(e.target.value)}
                          placeholder="0"
                          className="flex-1 w-full bg-transparent text-sm font-black text-gray-800 outline-none"
                        />
                        <span className="text-[11px] font-black text-gray-400 shrink-0">meses</span>
                      </div>
                    </div>
                  )}

                  {(ageMethod === 'BIRTH' || ageMethod === 'ADOPTION') && (
                    <input
                      type="date"
                      value={dateValue}
                      onChange={(e) => setDateValue(e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none border border-gray-100 mb-4"
                    />
                  )}
                </>
              )}

              <div className="mb-4" />

              <button
                onClick={submitCat}
                disabled={!name.trim() || savingCat}
                className="w-full mt-auto px-5 py-3.5 rounded-2xl font-black text-white text-sm disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
              >
                {savingCat ? 'Salvando...' : 'Continuar'}
              </button>
            </motion.div>
          )}

          {wizardStep === 3 && (
            <motion.div key="s3" {...screenMotion} className="flex-1 flex flex-col pt-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#F5F1FF' }}>
                <Scale size={24} style={{ color: C.purple }} />
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Primeira pesagem</h2>
              <p className="text-[13px] font-bold text-gray-700 leading-relaxed mb-1">
                Gato esconde quando está doente; o peso não esconde.
              </p>
              <p className="text-[12px] font-medium text-gray-400 leading-relaxed mb-6">
                Como pesar em casa: suba na balança com {cat?.name || 'seu gato'} no colo e desconte o seu peso.
              </p>

              <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 mb-8">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-2xl font-black text-gray-800 outline-none"
                />
                <span className="font-black text-gray-400 text-sm">kg</span>
              </div>

              <button
                onClick={submitWeight}
                disabled={!weightValue || savingWeight}
                className="w-full mt-auto px-5 py-3.5 rounded-2xl font-black text-white text-sm disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
              >
                {savingWeight ? 'Salvando...' : 'Registrar pesagem'}
              </button>
            </motion.div>
          )}

          {wizardStep === 4 && (
            <motion.div key="s4" {...screenMotion} className="flex-1 flex flex-col pt-4">
              <h2 className="text-xl font-black text-gray-900 mb-2">Essa é a aba Saúde</h2>
              <p className="text-[13px] font-medium text-gray-500 leading-relaxed mb-6">
                É aqui que o peso de {cat?.name || 'seu gato'} vai virar uma curva ao longo do tempo.
              </p>

              <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm text-center mb-6">
                <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF] mb-3">Curva de peso</p>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#F5F1FF] flex items-center justify-center">
                    <Scale size={18} style={{ color: C.purple }} />
                  </div>
                  <p className="text-2xl font-black text-gray-800">{weightValue || cat?.weight} kg</p>
                </div>
                <p className="text-[12px] font-medium text-gray-400">
                  Com a próxima pesagem, daqui a 15 dias, a curva do {cat?.name || 'seu gato'} começa.
                </p>
              </div>

              <button
                onClick={goHealthDone}
                className="w-full mt-auto px-5 py-3.5 rounded-2xl font-black text-white text-sm"
                style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
              >
                Continuar
              </button>
            </motion.div>
          )}

          {wizardStep === 5 && (
            <motion.div key="s5" {...screenMotion} className="flex-1 flex flex-col items-center text-center pt-6">
              <OnboardingBadgeCard cat={cat} />

              <button
                onClick={finishTour}
                className="w-full max-w-xs mt-8 px-5 py-3.5 rounded-2xl font-black text-[#4B2AAF] text-sm"
                style={{ background: '#ebfc66' }}
              >
                Ir para o GATEDO
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
