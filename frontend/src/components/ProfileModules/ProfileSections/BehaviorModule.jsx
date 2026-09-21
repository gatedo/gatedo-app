import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Activity,
  ShieldAlert,
  HeartHandshake,
  Brain,
  Zap,
  Star,
  Smile,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import api from '../../../services/api';

const C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  accent: '#DFFF40',
  pink: '#EC4899',
  blue: '#3B82F6',
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#EF4444',
};

const SKILL_DEFS = [
  { id: 'skillSocial', label: 'Social', icon: HeartHandshake, hex: '#FB7185', fallback: 80 },
  { id: 'skillDocile', label: 'Dócil', icon: Smile, hex: '#F472B6', fallback: 95 },
  { id: 'skillCuriosity', label: 'Curioso', icon: Star, hex: '#FBBF24', fallback: 90 },
  { id: 'skillIndep', label: 'Indep.', icon: Shield, hex: '#FB923C', fallback: 60 },
  { id: 'skillEnergy', label: 'Energia', icon: Zap, hex: '#818CF8', fallback: 75 },
  { id: 'skillAgility', label: 'Agilidade', icon: Target, hex: '#A78BFA', fallback: 85 },
];

const PERSONALITY_TRAITS = [
  { label: 'Carinhoso', aliases: ['carinhoso', 'carinhosa'], icon: HeartHandshake, hex: '#FB7185', bg: '#FFF1F2' },
  { label: 'Brincalhão', aliases: ['brincalhao', 'brincalhão', 'brincalhona'], icon: Sparkles, hex: '#A78BFA', bg: '#F5F3FF' },
  { label: 'Curioso', aliases: ['curioso', 'curiosa'], icon: Star, hex: '#FBBF24', bg: '#FFFBEB' },
  { label: 'Calmo', aliases: ['calmo', 'calma', 'calminho', 'calminha'], icon: Smile, hex: '#38BDF8', bg: '#EFF6FF' },
  { label: 'Independente', aliases: ['independente'], icon: Shield, hex: '#FB923C', bg: '#FFF7ED' },
  { label: 'Arisco', aliases: ['arisco', 'arisca', 'medroso', 'medrosa'], icon: ShieldAlert, hex: '#EF4444', bg: '#FEF2F2' },
  { label: 'Sociável', aliases: ['sociavel', 'sociável'], icon: HeartHandshake, hex: '#16A34A', bg: '#F0FDF4' },
  { label: 'Territorial', aliases: ['territorial'], icon: Target, hex: '#64748B', bg: '#F8FAFC' },
  { label: 'Observador', aliases: ['observador', 'observadora'], icon: Brain, hex: '#6366F1', bg: '#EEF2FF' },
  { label: 'Dorminhoco', aliases: ['dorminhoco', 'dorminhoca'], icon: Zap, hex: '#8B5CF6', bg: '#F5F3FF' },
];

const COEXISTENCE_OPTIONS = ['Outros gatos', 'Cachorros', 'Crianças', 'Idosos', 'Adultos', 'Vive sozinho'];

function keyOf(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getTraitMeta(value) {
  const key = keyOf(value);
  return PERSONALITY_TRAITS.find((trait) => trait.aliases.some((alias) => keyOf(alias) === key)) || {
    label: value,
    icon: Sparkles,
    hex: C.purple,
    bg: '#F4F3FF',
  };
}

function toArray(value) {
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

function normalizeActivityLevel(value) {
  if (!value) return 'Não informado';

  const map = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    very_high: 'Muito alta',
  };

  return map[String(value).toLowerCase()] || value;
}

function SectionTitle({ icon: Icon, title, subtitle, color = C.purple }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-10 h-10 rounded-[16px] flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}14` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-700 leading-none">
          {title}
        </h3>
        {subtitle ? (
          <p className="text-[10px] font-bold text-gray-400 mt-1">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function ChipList({ title, items, color = C.purple }) {
  if (!items?.length) return null;
  if (keyOf(title) === 'tracos de personalidade') return null;

  return (
    <div className="rounded-[24px] bg-white border border-gray-100 p-4 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
        {title}
      </p>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="text-[10px] font-black px-3 py-1.5 rounded-full"
            style={{
              background: `${color}12`,
              color,
              border: `1px solid ${color}22`,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function PersonalityTraitList({ items }) {
  if (!items?.length) return null;

  return (
    <div className="rounded-[24px] bg-white border border-gray-100 p-4 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
        Traços de personalidade
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item) => {
          const meta = getTraitMeta(item);
          const Icon = meta.icon;

          return (
            <div
              key={item}
              className="min-h-[48px] rounded-[18px] border px-3 py-2 flex items-center gap-2"
              style={{
                background: meta.bg,
                borderColor: `${meta.hex}28`,
                color: meta.hex,
              }}
            >
              <span
                className="w-8 h-8 rounded-[12px] flex items-center justify-center bg-white/80 shadow-sm"
                style={{ color: meta.hex }}
              >
                <Icon size={15} />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.08em] leading-tight">
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, color = C.purple }) {
  return (
    <div className="rounded-[22px] border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        {Icon ? <Icon size={12} style={{ color }} /> : null}
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
          {label}
        </p>
      </div>
      <p className="text-sm font-black text-gray-800 leading-snug">{value || 'Não informado'}</p>
    </div>
  );
}

function ExpandCard({ title, text, tone = 'purple', icon: Icon = Brain }) {
  const [open, setOpen] = useState(true);

  const tones = {
    purple: { bg: '#F4F3FF', border: '#8B4AFF20', color: C.purple },
    amber: { bg: '#FFF7ED', border: '#FDBA7425', color: C.amber },
    red: { bg: '#FEF2F2', border: '#FCA5A525', color: C.red },
    green: { bg: '#F0FDF4', border: '#86EFAC25', color: C.green },
  };

  const t = tones[tone] || tones.purple;

  if (!text) return null;

  return (
    <div
      className="rounded-[24px] border overflow-hidden"
      style={{ background: t.bg, borderColor: t.border }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <div
          className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${t.color}14` }}
        >
          <Icon size={18} style={{ color: t.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-black uppercase tracking-[0.18em]"
            style={{ color: t.color }}
          >
            {title}
          </p>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5">
            Toque para {open ? 'recolher' : 'expandir'}
          </p>
        </div>

        {open ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-700 leading-relaxed font-medium">{text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SkillBar({ skill, value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || skill.fallback)));

  return (
    <div className="rounded-[18px] border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <skill.icon size={13} style={{ color: skill.hex }} />
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-600">
            {skill.label}
          </span>
        </div>

        <span className="text-[11px] font-black" style={{ color: skill.hex }}>
          {safeValue}%
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          transition={{ duration: 0.6 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${skill.hex}90, ${skill.hex})` }}
        />
      </div>
    </div>
  );
}

function TogglePill({ active, children, onClick, color = C.purple }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-full text-[11px] font-black border transition-all"
      style={{
        background: active ? color : '#F8FAFC',
        borderColor: active ? 'transparent' : '#EEF2F7',
        color: active ? '#fff' : '#64748B',
        boxShadow: active ? `0 10px 24px ${color}24` : 'none',
      }}
    >
      {children}
    </button>
  );
}

function SkillEditor({ skill, value, onChange }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || skill.fallback)));

  return (
    <div className="rounded-[18px] border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <skill.icon size={14} style={{ color: skill.hex }} />
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-600">
            {skill.label}
          </span>
        </div>
        <span className="text-[11px] font-black" style={{ color: skill.hex }}>
          {safeValue}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={safeValue}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

function BehaviorEditModal({ isOpen, onClose, cat, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    personality: toArray(cat?.personality),
    coexistsWith: toArray(cat?.coexistsWith),
    activityLevel: cat?.activityLevel || '',
    hasBehaviorIssues: Boolean(cat?.hasBehaviorIssues),
    behaviorIssues: cat?.behaviorIssues || '',
    hasTraumaHistory: Boolean(cat?.hasTraumaHistory),
    traumaHistory: cat?.traumaHistory || '',
    skillSocial: Number(cat?.skillSocial ?? 80),
    skillDocile: Number(cat?.skillDocile ?? 95),
    skillCuriosity: Number(cat?.skillCuriosity ?? 90),
    skillIndep: Number(cat?.skillIndep ?? 60),
    skillEnergy: Number(cat?.skillEnergy ?? 75),
    skillAgility: Number(cat?.skillAgility ?? 85),
  }));

  React.useEffect(() => {
    if (!isOpen) return;
    setForm({
      personality: toArray(cat?.personality),
      coexistsWith: toArray(cat?.coexistsWith),
      activityLevel: cat?.activityLevel || '',
      hasBehaviorIssues: Boolean(cat?.hasBehaviorIssues),
      behaviorIssues: cat?.behaviorIssues || '',
      hasTraumaHistory: Boolean(cat?.hasTraumaHistory),
      traumaHistory: cat?.traumaHistory || '',
      skillSocial: Number(cat?.skillSocial ?? 80),
      skillDocile: Number(cat?.skillDocile ?? 95),
      skillCuriosity: Number(cat?.skillCuriosity ?? 90),
      skillIndep: Number(cat?.skillIndep ?? 60),
      skillEnergy: Number(cat?.skillEnergy ?? 75),
      skillAgility: Number(cat?.skillAgility ?? 85),
    });
  }, [cat, isOpen]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleArray = (field, value) => {
    setForm((prev) => {
      const list = Array.isArray(prev[field]) ? prev[field] : [];
      return {
        ...prev,
        [field]: list.includes(value)
          ? list.filter((item) => item !== value)
          : [...list, value],
      };
    });
  };

  const save = async () => {
    if (!cat?.id || saving) return;

    setSaving(true);
    try {
      await api.patch(`/pets/${cat.id}`, form);
      await onSaved?.();
      onClose?.();
    } catch (error) {
      console.error('Erro ao salvar comportamento:', error);
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[2400] w-screen h-dvh min-h-screen bg-[#210B46]/72 backdrop-blur-md flex items-end sm:items-center justify-center p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[640px] max-h-[86vh] bg-[#F7F8FF] rounded-t-[30px] sm:rounded-[30px] shadow-2xl overflow-hidden border border-white/80"
          >
            <div className="sticky top-0 z-10 bg-white/92 backdrop-blur-xl border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B4AFF]">
                  Comportamento
                </p>
                <h2 className="text-lg font-black text-gray-900">Editar atributos</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(86vh-144px)] px-5 py-5 space-y-5">
              <div className="rounded-[26px] bg-white p-4 border border-gray-100 shadow-sm">
                <SectionTitle
                  icon={Brain}
                  title="Atributos do gato"
                  subtitle="Mesmos indicadores usados no perfil social"
                  color={C.purpleDark}
                />
                <div className="space-y-3">
                  {SKILL_DEFS.map((skill) => (
                    <SkillEditor
                      key={skill.id}
                      skill={skill}
                      value={form[skill.id]}
                      onChange={(value) => setField(skill.id, value)}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] bg-white p-4 border border-gray-100 shadow-sm space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 mb-2">
                    Traços de personalidade
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PERSONALITY_TRAITS.map((trait) => (
                      <TogglePill
                        key={trait.label}
                        active={form.personality.includes(trait.label)}
                        color={trait.hex}
                        onClick={() => toggleArray('personality', trait.label)}
                      >
                        {trait.label}
                      </TogglePill>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                      Nível de atividade
                    </span>
                    <select
                      value={form.activityLevel}
                      onChange={(event) => setField('activityLevel', event.target.value)}
                      className="w-full h-12 rounded-2xl bg-gray-50 border border-gray-100 px-4 text-sm font-bold text-gray-700 outline-none focus:border-[#8B4AFF]"
                    >
                      <option value="">Não informado</option>
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="very_high">Muito alta</option>
                    </select>
                  </label>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 mb-2">
                    Convivência
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {COEXISTENCE_OPTIONS.map((option) => (
                      <TogglePill
                        key={option}
                        active={form.coexistsWith.includes(option)}
                        color={C.green}
                        onClick={() => toggleArray('coexistsWith', option)}
                      >
                        {option}
                      </TogglePill>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] bg-white p-4 border border-gray-100 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <TogglePill
                    active={form.hasBehaviorIssues}
                    color={C.amber}
                    onClick={() => setField('hasBehaviorIssues', !form.hasBehaviorIssues)}
                  >
                    Problemas de comportamento
                  </TogglePill>
                  <TogglePill
                    active={form.hasTraumaHistory}
                    color={C.red}
                    onClick={() => setField('hasTraumaHistory', !form.hasTraumaHistory)}
                  >
                    Histórico emocional
                  </TogglePill>
                </div>

                {form.hasBehaviorIssues ? (
                  <textarea
                    value={form.behaviorIssues}
                    onChange={(event) => setField('behaviorIssues', event.target.value)}
                    placeholder="Descreva sinais como marcação, agressividade, vocalização, medo ou fuga."
                    className="w-full min-h-[88px] rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 outline-none resize-none focus:border-[#8B4AFF]"
                  />
                ) : null}

                {form.hasTraumaHistory ? (
                  <textarea
                    value={form.traumaHistory}
                    onChange={(event) => setField('traumaHistory', event.target.value)}
                    placeholder="Registre histórico de resgate, medo, adaptação ou eventos importantes."
                    className="w-full min-h-[88px] rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 outline-none resize-none focus:border-[#8B4AFF]"
                  />
                ) : null}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/92 backdrop-blur-xl border-t border-gray-100 p-4">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="w-full h-12 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #8B4AFF, #6B30E0)' }}
              >
                <Save size={17} />
                {saving ? 'Salvando...' : 'Salvar comportamento'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return modal;
  return createPortal(modal, document.body);
}

export default function BehaviorModule({ cat, refreshCat }) {
  const [editing, setEditing] = useState(false);
  const personality = useMemo(() => toArray(cat?.personality), [cat?.personality]);
  const coexistence = useMemo(() => toArray(cat?.coexistsWith), [cat?.coexistsWith]);

  const behaviorSummary = useMemo(() => {
    const pieces = [];

    if (personality.length > 0) {
      pieces.push(`${cat?.name || 'O gato'} demonstra um perfil ${personality.slice(0, 3).join(', ').toLowerCase()}.`);
    }

    if (cat?.activityLevel) {
      pieces.push(`O nível de atividade atual é ${normalizeActivityLevel(cat.activityLevel).toLowerCase()}.`);
    }

    if (coexistence.length > 0) {
      pieces.push(`Convive com ${coexistence.join(', ').toLowerCase()}.`);
    }

    if (cat?.hasBehaviorIssues) {
      pieces.push('Existem pontos de atenção comportamental registrados.');
    }

    if (cat?.hasTraumaHistory) {
      pieces.push('Há histórico emocional relevante no perfil.');
    }

    if (pieces.length === 0) {
      return 'Ainda não há dados suficientes para montar uma leitura comportamental consistente.';
    }

    return pieces.join(' ');
  }, [cat, personality, coexistence]);

  const topSkill = useMemo(() => {
    return SKILL_DEFS.reduce((best, current) => {
      const currentValue = Number(cat?.[current.id] ?? current.fallback);
      const bestValue = Number(cat?.[best.id] ?? best.fallback);
      return currentValue > bestValue ? current : best;
    }, SKILL_DEFS[0]);
  }, [cat]);

  const topSkillValue = Number(cat?.[topSkill.id] ?? topSkill.fallback);

  return (
    <div className="space-y-6 pb-28">
      <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-50">
        <div className="flex items-start justify-between gap-3 mb-3">
        <SectionTitle
          icon={Sparkles}
          title="Leitura Comportamental"
          subtitle="Resumo vivo da personalidade e dinâmica do gato"
          color={C.purple}
        />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-10 px-3 rounded-full bg-[#8B4AFF]/10 text-[#8B4AFF] border border-[#8B4AFF]/15 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] shadow-sm"
          >
            <Edit3 size={14} />
            Editar
          </button>
        </div>

        <div className="rounded-[24px] bg-[#F4F3FF] border border-[#8B4AFF18] px-4 py-4">
          <p className="text-[11px] font-bold text-gray-700 leading-relaxed">
            {behaviorSummary}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoCard
          label="Nível de atividade"
          value={normalizeActivityLevel(cat?.activityLevel)}
          icon={Activity}
          color={C.blue}
        />
        <InfoCard
          label="Ponto forte"
          value={`${topSkill.label} · ${topSkillValue}%`}
          icon={topSkill.icon}
          color={topSkill.hex}
        />
      </div>

      <PersonalityTraitList items={personality} />

      <ChipList
        title="Traços de personalidade"
        items={personality}
        color={C.pink}
      />

      <ChipList
        title="Convivência"
        items={coexistence}
        color={C.green}
      />

      <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-50">
        <SectionTitle
          icon={Brain}
          title="Atributos"
          subtitle="Skills do perfil comportamental"
          color={C.purpleDark}
        />

        <div className="space-y-3">
          {SKILL_DEFS.map((skill) => (
            <SkillBar
              key={skill.id}
              skill={skill}
              value={cat?.[skill.id]}
            />
          ))}
        </div>
      </div>

      <ExpandCard
        title="Problemas de comportamento"
        text={cat?.hasBehaviorIssues ? cat?.behaviorIssues || 'Há um marcador ativo, mas sem detalhes preenchidos.' : 'Nenhum problema de comportamento registrado no momento.'}
        tone={cat?.hasBehaviorIssues ? 'amber' : 'green'}
        icon={cat?.hasBehaviorIssues ? AlertTriangle : CheckCircle2}
      />

      <ExpandCard
        title="Histórico de trauma"
        text={cat?.hasTraumaHistory ? cat?.traumaHistory || 'Há um marcador ativo, mas sem detalhes preenchidos.' : 'Nenhum trauma registrado no perfil até o momento.'}
        tone={cat?.hasTraumaHistory ? 'red' : 'green'}
        icon={cat?.hasTraumaHistory ? ShieldAlert : CheckCircle2}
      />

      <BehaviorEditModal
        isOpen={editing}
        onClose={() => setEditing(false)}
        cat={cat}
        onSaved={refreshCat}
      />
    </div>
  );
}
