import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Heart,
  Star,
  Zap,
  Shield,
  Target,
  Smile,
  PawPrint,
  MapPin,
  ShieldAlert,
  Utensils,
  Home,
  Sparkles,
} from 'lucide-react';
import api from '../../../services/api';

const PRIMARY_GRADIENT = 'linear-gradient(135deg, rgb(139, 74, 255), rgb(107, 48, 224))';

const INPUT =
  'w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#8B4AFF] focus:ring-2 focus:ring-[#8B4AFF]/10 transition-all';

const TEXTAREA =
  'w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none min-h-[96px] resize-none focus:border-[#8B4AFF] focus:ring-2 focus:ring-[#8B4AFF]/10 transition-all';

const SELECT = INPUT;

const SHEET_EASE = [0.22, 1, 0.36, 1];

const CHIP_OPTIONS = {
  personality: [
    'Carinhoso',
    'Brincalhão',
    'Curioso',
    'Calmo',
    'Independente',
    'Arisco',
    'Sociável',
    'Territorial',
    'Observador',
    'Dorminhoco',
  ],
  preExistingConditions: [
    'Alergia',
    'Asma felina',
    'Doença renal',
    'Diabetes',
    'Cardiopatia',
    'Sensibilidade alimentar',
    'Problemas intestinais',
    'FIV',
    'FeLV',
  ],
  coexistsWith: [
    'Outros gatos',
    'Cachorros',
    'Crianças',
    'Idosos',
    'Adultos',
    'Vive sozinho',
  ],
};

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeNicknames(cat) {
  if (Array.isArray(cat?.nicknames)) return cat.nicknames.filter(Boolean).join(', ');
  if (typeof cat?.nicknames === 'string') return cat.nicknames;
  if (typeof cat?.cuteNicknames === 'string') return cat.cuteNicknames;
  return '';
}

function normalizeBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;
  return false;
}

function normalizeString(value) {
  return value ?? '';
}

function NumberOnly(value) {
  return String(value || '').replace(/\D+/g, '');
}

function formatCatRegistry(cat) {
  const base =
    cat?.gatedoId ||
    cat?.identityId ||
    cat?.registryId ||
    cat?.publicId ||
    cat?.id ||
    '';

  const clean = String(base).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!clean) return 'GTD-SEMID';
  return `GTD-${clean.slice(-8)}`;
}

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-[#8B4AFF]/10 flex items-center justify-center">
            <Icon size={18} className="text-[#8B4AFF]" />
          </div>
          <div>
            <h3 className="text-[13px] font-black uppercase tracking-[1.5px] text-gray-800">
              {title}
            </h3>
            {subtitle ? (
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-[1.4px] text-gray-500">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[10px] text-gray-400 font-medium">{hint}</p> : null}
    </div>
  );
}

function Toggle({ active, onClick, label, activeLabel = 'Sim', inactiveLabel = 'Não' }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[1.4px] text-gray-500">{label}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onClick(true)}
          className={`flex-1 h-11 rounded-2xl font-black text-sm transition-all border ${
            active
              ? 'text-white border-transparent shadow-[0_10px_24px_rgba(107,48,224,0.18)]'
              : 'bg-gray-50 text-gray-500 border-gray-100'
          }`}
          style={active ? { background: PRIMARY_GRADIENT } : undefined}
        >
          {activeLabel}
        </button>
        <button
          type="button"
          onClick={() => onClick(false)}
          className={`flex-1 h-11 rounded-2xl font-black text-sm transition-all border ${
            !active
              ? 'text-white border-transparent shadow-[0_10px_24px_rgba(107,48,224,0.18)]'
              : 'bg-gray-50 text-gray-500 border-gray-100'
          }`}
          style={!active ? { background: PRIMARY_GRADIENT } : undefined}
        >
          {inactiveLabel}
        </button>
      </div>
    </div>
  );
}

function ChipSelector({ label, options = [], values = [], onChange }) {
  const safeValues = Array.isArray(values) ? values : [];

  const toggle = (option) => {
    if (safeValues.includes(option)) {
      onChange(safeValues.filter((item) => item !== option));
      return;
    }
    onChange([...safeValues, option]);
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[1.4px] text-gray-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = safeValues.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`px-3 py-2 rounded-full text-[11px] font-black border transition-all ${
                active
                  ? 'text-white border-transparent shadow-[0_8px_20px_rgba(107,48,224,0.18)]'
                  : 'bg-gray-50 text-gray-600 border-gray-100'
              }`}
              style={active ? { background: PRIMARY_GRADIENT } : undefined}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SkillSlider({ label, icon: Icon, value, onChange, hex }) {
  return (
    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2 text-gray-500">
          <Icon size={14} style={{ color: hex }} />
          <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
        </div>
        <span className="text-xs font-black" style={{ color: hex }}>
          {value}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(String(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

export default function EditBioModal({ isOpen, onClose, cat, onSave }) {
  const [loading, setLoading] = useState(false);

  const initialData = useMemo(
    () => ({
      bio: normalizeString(cat?.bio),
      nicknames: normalizeNicknames(cat),
      breed: normalizeString(cat?.breed),
      coatType: normalizeString(cat?.coatType),
      gender: normalizeString(cat?.gender),
      originCity: normalizeString(cat?.originCity || cat?.cityOfOrigin || cat?.birthCity),
      microchip: NumberOnly(cat?.microchip),
      arrivalType: normalizeString(cat?.arrivalType),
      arrivalNotes: normalizeString(cat?.arrivalNotes),
      preExistingConditions: normalizeArray(cat?.preExistingConditions),
      healthSummary: normalizeString(cat?.healthSummary),
      neutered: normalizeBoolean(cat?.neutered),
      intendToNeuter: normalizeBoolean(cat?.intendToNeuter),
      weight: normalizeString(cat?.weight),
      foodBrand: normalizeString(cat?.foodBrand),
      foodType: normalizeString(cat?.foodType),
      feedFrequencyMode: normalizeString(cat?.feedFrequencyMode),
      feedFrequencyNotes: normalizeString(cat?.feedFrequencyNotes),
      personality: normalizeArray(cat?.personality),
      activityLevel: normalizeString(cat?.activityLevel),
      hasBehaviorIssues: normalizeBoolean(cat?.hasBehaviorIssues),
      behaviorIssues: normalizeString(cat?.behaviorIssues),
      hasTraumaHistory: normalizeBoolean(cat?.hasTraumaHistory),
      traumaHistory: normalizeString(cat?.traumaHistory),
      coexistsWith: normalizeArray(cat?.coexistsWith),
      habitat: normalizeString(cat?.habitat),
      housingType: normalizeString(cat?.housingType),
      streetAccess: normalizeBoolean(cat?.streetAccess),
      riskAreaAccess: normalizeBoolean(cat?.riskAreaAccess),
      skillSocial: String(cat?.skillSocial || '80'),
      skillDocile: String(cat?.skillDocile || '95'),
      skillCuriosity: String(cat?.skillCuriosity || '90'),
      skillIndep: String(cat?.skillIndep || '60'),
      skillEnergy: String(cat?.skillEnergy || '75'),
      skillAgility: String(cat?.skillAgility || '85'),
    }),
    [cat]
  );

  const [formData, setFormData] = useState(initialData);
  const catRegistry = useMemo(() => formatCatRegistry(cat), [cat]);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const nav = document.querySelector('[data-bottom-nav="true"]');
    if (!nav) return undefined;

    const previous = {
      opacity: nav.style.opacity,
      pointerEvents: nav.style.pointerEvents,
      transform: nav.style.transform,
      transition: nav.style.transition,
    };

    nav.style.transition = 'opacity 220ms ease, transform 220ms ease';
    nav.style.opacity = '0';
    nav.style.pointerEvents = 'none';
    nav.style.transform = 'translateY(24px)';

    return () => {
      nav.style.opacity = previous.opacity || '1';
      nav.style.pointerEvents = previous.pointerEvents || 'auto';
      nav.style.transform = previous.transform || 'translateY(0)';
      nav.style.transition = previous.transition || '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const payload = {
        bio: formData.bio.trim(),
        nicknames: formData.nicknames
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        breed: formData.breed.trim(),
        coatType: formData.coatType.trim(),
        gender: formData.gender,
        originCity: formData.originCity.trim(),
        microchip: NumberOnly(formData.microchip),
        arrivalType: formData.arrivalType,
        arrivalNotes: formData.arrivalNotes.trim(),
        preExistingConditions: formData.preExistingConditions,
        healthSummary: formData.healthSummary.trim(),
        neutered: !!formData.neutered,
        intendToNeuter: !!formData.intendToNeuter,
        weight: formData.weight === '' ? null : Number(formData.weight),
        foodBrand: formData.foodBrand.trim(),
        foodType: formData.foodType,
        feedFrequencyMode: formData.feedFrequencyMode,
        feedFrequencyNotes: formData.feedFrequencyNotes.trim(),
        personality: formData.personality,
        activityLevel: formData.activityLevel,
        hasBehaviorIssues: !!formData.hasBehaviorIssues,
        behaviorIssues: formData.hasBehaviorIssues ? formData.behaviorIssues.trim() : '',
        hasTraumaHistory: !!formData.hasTraumaHistory,
        traumaHistory: formData.hasTraumaHistory ? formData.traumaHistory.trim() : '',
        coexistsWith: formData.coexistsWith,
        habitat: formData.habitat,
        housingType: formData.housingType,
        streetAccess: !!formData.streetAccess,
        riskAreaAccess: !!formData.riskAreaAccess,
        skillSocial: formData.skillSocial,
        skillDocile: formData.skillDocile,
        skillCuriosity: formData.skillCuriosity,
        skillIndep: formData.skillIndep,
        skillEnergy: formData.skillEnergy,
        skillAgility: formData.skillAgility,
      };

      await api.patch(`/pets/${cat.id}`, payload);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar perfil do gato:', error);
      alert('Não foi possível salvar agora. Verifique os campos e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2200] flex items-end justify-center bg-black/38 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 56, opacity: 0.96 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 56, opacity: 0.96 }}
          transition={{ duration: 0.28, ease: SHEET_EASE }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl rounded-t-[34px] bg-[#F8F9FE] shadow-[0_-12px_40px_rgba(33,16,72,0.16)] max-h-[92vh] flex flex-col overflow-hidden"
        >
          <div className="sticky top-0 z-10 bg-white/96 backdrop-blur border-b border-gray-100 px-5 py-4">
            <div className="flex justify-between items-center gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[1.6px] text-[#8B4AFF]">{catRegistry}</p>
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">
                  Editar Bio Profile
                </h2>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                  Ajuste os dados principais do perfil do gato
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 bg-gray-50 rounded-full border border-gray-100 text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto px-4 pt-4 pb-28 sm:px-5 space-y-4">
            <Section icon={PawPrint} title="Identidade" subtitle="Dados principais e apresentação">
              <Field label="Bio / descrição afetiva">
                <textarea
                  className={TEXTAREA}
                  value={formData.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="Descreva a essência do seu gato..."
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Apelidos carinhosos" hint="Separe por vírgula">
                  <input
                    className={INPUT}
                    value={formData.nicknames}
                    onChange={(e) => setField('nicknames', e.target.value)}
                    placeholder="Mimi, Neném, Bolinha..."
                  />
                </Field>

                <Field label="Raça">
                  <input
                    className={INPUT}
                    value={formData.breed}
                    onChange={(e) => setField('breed', e.target.value)}
                    placeholder="Ex.: SRD, Siamês, Persa..."
                  />
                </Field>

                <Field label="Pelagem">
                  <input
                    className={INPUT}
                    value={formData.coatType}
                    onChange={(e) => setField('coatType', e.target.value)}
                    placeholder="Ex.: Rajado curto"
                  />
                </Field>

                <Field label="Sexo">
                  <select className={SELECT} value={formData.gender} onChange={(e) => setField('gender', e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="male">Macho</option>
                    <option value="female">Fêmea</option>
                  </select>
                </Field>

                <Field label="Cidade de origem">
                  <input
                    className={INPUT}
                    value={formData.originCity}
                    onChange={(e) => setField('originCity', e.target.value)}
                    placeholder="Ex.: Porto Alegre"
                  />
                </Field>

                <Field label="Microchip" hint="Somente números">
                  <input
                    className={INPUT}
                    value={formData.microchip}
                    onChange={(e) => setField('microchip', NumberOnly(e.target.value))}
                    placeholder="Ex.: 123456789"
                    inputMode="numeric"
                  />
                </Field>
              </div>
            </Section>

            <Section icon={MapPin} title="Origem" subtitle="Como chegou até você">
              <Field label="Tipo de chegada">
                <select className={SELECT} value={formData.arrivalType} onChange={(e) => setField('arrivalType', e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="adopted">Adotado</option>
                  <option value="rescued">Resgatado</option>
                  <option value="found">Encontrado</option>
                  <option value="gift">Presente</option>
                  <option value="born_at_home">Nasceu em casa</option>
                  <option value="foster">Lar temporário</option>
                  <option value="bought">Comprado</option>
                  <option value="from_street">Veio da rua</option>
                </select>
              </Field>

              <Field label="História de chegada">
                <textarea
                  className={TEXTAREA}
                  value={formData.arrivalNotes}
                  onChange={(e) => setField('arrivalNotes', e.target.value)}
                  placeholder="Conte brevemente como esse gato entrou na sua vida..."
                />
              </Field>
            </Section>

            <Section icon={ShieldAlert} title="Saúde" subtitle="Condição geral e histórico">
              <ChipSelector
                label="Doenças pré-existentes"
                options={CHIP_OPTIONS.preExistingConditions}
                values={formData.preExistingConditions}
                onChange={(values) => setField('preExistingConditions', values)}
              />

              <Field label="Resumo de saúde">
                <textarea
                  className={TEXTAREA}
                  value={formData.healthSummary}
                  onChange={(e) => setField('healthSummary', e.target.value)}
                  placeholder="Observações relevantes sobre a saúde..."
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Toggle label="Castrado" active={formData.neutered} onClick={(value) => setField('neutered', value)} />
                <Toggle label="Pretende castrar" active={formData.intendToNeuter} onClick={(value) => setField('intendToNeuter', value)} />
              </div>

              <Field label="Peso (kg)">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className={INPUT}
                  value={formData.weight}
                  onChange={(e) => setField('weight', e.target.value)}
                  placeholder="Ex.: 4.3"
                />
              </Field>
            </Section>

            <Section icon={Utensils} title="Nutrição" subtitle="Rotina alimentar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Marca da alimentação">
                  <input className={INPUT} value={formData.foodBrand} onChange={(e) => setField('foodBrand', e.target.value)} placeholder="Ex.: Golden, Premier..." />
                </Field>

                <Field label="Tipo de alimentação">
                  <select className={SELECT} value={formData.foodType} onChange={(e) => setField('foodType', e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="dry">Ração seca</option>
                    <option value="wet">Ração úmida</option>
                    <option value="mixed">Mista</option>
                    <option value="natural">Natural</option>
                    <option value="homemade">Caseira</option>
                    <option value="prescription">Prescrição veterinária</option>
                  </select>
                </Field>

                <Field label="Frequência de alimentação">
                  <select className={SELECT} value={formData.feedFrequencyMode} onChange={(e) => setField('feedFrequencyMode', e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="free">Livre demanda</option>
                    <option value="scheduled">Horários definidos</option>
                    <option value="mixed">Misto</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </Field>
              </div>

              <Field label="Observações da alimentação">
                <textarea
                  className={TEXTAREA}
                  value={formData.feedFrequencyNotes}
                  onChange={(e) => setField('feedFrequencyNotes', e.target.value)}
                  placeholder="Ex.: come 3x ao dia, mistura sachê à noite..."
                />
              </Field>
            </Section>

            <Section icon={Sparkles} title="Comportamento" subtitle="Temperamento e convivência">
              <ChipSelector
                label="Personalidade"
                options={CHIP_OPTIONS.personality}
                values={formData.personality}
                onChange={(values) => setField('personality', values)}
              />

              <ChipSelector
                label="Convive com"
                options={CHIP_OPTIONS.coexistsWith}
                values={formData.coexistsWith}
                onChange={(values) => setField('coexistsWith', values)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nível de atividade">
                  <select className={SELECT} value={formData.activityLevel} onChange={(e) => setField('activityLevel', e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="very_high">Muito alta</option>
                  </select>
                </Field>
              </div>

              <Toggle
                label="Possui problemas de comportamento"
                active={formData.hasBehaviorIssues}
                onClick={(value) => setField('hasBehaviorIssues', value)}
              />

              {formData.hasBehaviorIssues && (
                <Field label="Detalhes dos problemas de comportamento">
                  <textarea
                    className={TEXTAREA}
                    value={formData.behaviorIssues}
                    onChange={(e) => setField('behaviorIssues', e.target.value)}
                    placeholder="Ex.: agressividade, marcação, ansiedade..."
                  />
                </Field>
              )}

              <Toggle
                label="Possui histórico de trauma"
                active={formData.hasTraumaHistory}
                onClick={(value) => setField('hasTraumaHistory', value)}
              />

              {formData.hasTraumaHistory && (
                <Field label="Detalhes do trauma">
                  <textarea
                    className={TEXTAREA}
                    value={formData.traumaHistory}
                    onChange={(e) => setField('traumaHistory', e.target.value)}
                    placeholder="Ex.: resgate difícil, maus-tratos, medo de pessoas..."
                  />
                </Field>
              )}
            </Section>

            <Section icon={Home} title="Ambiente" subtitle="Habitat e exposição">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Habitat">
                  <select className={SELECT} value={formData.habitat} onChange={(e) => setField('habitat', e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="indoor">Interno</option>
                    <option value="outdoor">Externo</option>
                    <option value="mixed">Misto</option>
                    <option value="sheltered">Abrigado</option>
                  </select>
                </Field>

                <Field label="Tipo de moradia">
                  <select className={SELECT} value={formData.housingType} onChange={(e) => setField('housingType', e.target.value)}>
                    <option value="">Selecione</option>
                    <option value="apartment">Apartamento</option>
                    <option value="house">Casa</option>
                    <option value="farm">Sítio / Chácara</option>
                    <option value="indoor_only">Ambiente interno</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Toggle
                  label="Tem acesso à rua"
                  active={formData.streetAccess}
                  onClick={(value) => setField('streetAccess', value)}
                  activeLabel="Tem acesso"
                  inactiveLabel="Sem acesso"
                />

                <Toggle
                  label="Tem acesso à área de risco"
                  active={formData.riskAreaAccess}
                  onClick={(value) => setField('riskAreaAccess', value)}
                  activeLabel="Tem acesso"
                  inactiveLabel="Sem acesso"
                />
              </div>
            </Section>

            <Section icon={Star} title="Atributos RPG" subtitle="Forças do perfil">
              <div className="grid grid-cols-1 gap-3">
                <SkillSlider label="Social" icon={Heart} value={formData.skillSocial} onChange={(v) => setField('skillSocial', v)} hex="#FB7185" />
                <SkillSlider label="Dócil" icon={Smile} value={formData.skillDocile} onChange={(v) => setField('skillDocile', v)} hex="#F472B6" />
                <SkillSlider label="Curioso" icon={Star} value={formData.skillCuriosity} onChange={(v) => setField('skillCuriosity', v)} hex="#FBBF24" />
                <SkillSlider label="Indep." icon={Shield} value={formData.skillIndep} onChange={(v) => setField('skillIndep', v)} hex="#FB923C" />
                <SkillSlider label="Energia" icon={Zap} value={formData.skillEnergy} onChange={(v) => setField('skillEnergy', v)} hex="#818CF8" />
                <SkillSlider label="Agilidade" icon={Target} value={formData.skillAgility} onChange={(v) => setField('skillAgility', v)} hex="#A78BFA" />
              </div>
            </Section>
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-[#F8F9FE] border-t border-gray-100 px-4 pt-3 pb-4 sm:px-5">
            <button
              disabled={loading}
              onClick={handleSave}
              className="w-full text-white h-14 rounded-[22px] font-black text-base shadow-[0_10px_24px_rgba(107,48,224,0.22)] flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: PRIMARY_GRADIENT }}
            >
              {loading ? 'Gravando...' : (<><Save size={18} /> Salvar Alterações</>)}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
