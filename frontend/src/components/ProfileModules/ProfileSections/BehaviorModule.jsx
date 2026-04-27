import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';

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

export default function BehaviorModule({ cat }) {
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
        <SectionTitle
          icon={Sparkles}
          title="Leitura Comportamental"
          subtitle="Resumo vivo da personalidade e dinâmica do gato"
          color={C.purple}
        />

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
    </div>
  );
}