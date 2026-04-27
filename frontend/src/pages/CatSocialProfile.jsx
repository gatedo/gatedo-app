import React, { useState, useEffect, useMemo, useContext } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  ArrowLeft, Share2, QrCode, UserPlus, Check, Camera, Grid,
  Award, Activity, Users, Sparkles, HeartPulse, Brain, PawPrint,
  Shield, ChevronRight, MoreHorizontal, Heart, Zap, Star, Calendar,
} from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { resolveThemeHex } from '../components/ProfileModules/CatIdentityCard';
import EditProfileModal from '../components/ProfileModules/ProfileSections/EditProfileModal';
import { buildSocialHealthSummary } from '../utils/socialHealthAdapter';
import SocialPostComposerModal from '../components/social/SocialPostComposerModal';
import { pruneSocialGallerySelection } from '../utils/socialGallerySelection';
import { formatCatAge, getCatLifeStage, LIFE_STAGE_META } from '../utils/catAge';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCatRg(cat) {
  const base = String(cat?.uniqueId || cat?.id || cat?.slug || cat?.name || 'gatedo')
    .replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-8);
  return `GTD-${base.padEnd(8, '0')}`;
}
function socialProfileUrl(cat) {
  const slug = cat?.slug || cat?.id || cat?.name?.toLowerCase?.()?.replace(/\s+/g, '-');
  return `${window.location.origin}/gato/${slug}`;
}
function getPhoto(cat) { return cat?.photoUrl || cat?.photo || '/assets/cat-avatar-default.png'; }
function getTutor(cat, authUser) { return cat?.tutor || cat?.owner || cat?.user || authUser || null; }
function getTutorAvatar(cat, authUser) {
  const t = getTutor(cat, authUser);
  return t?.avatarUrl || t?.photoUrl || t?.image || '/assets/App_gatedo_logo.svg';
}
function deriveBehavior(cat) {
  const p = cat?.personality || {};
  const s = cat?.stats || {};
  return {
    sociability:  Number(p.sociability  ?? s.sociability  ?? 78),
    curiosity:    Number(p.curiosity    ?? s.curiosity    ?? 84),
    energy:       Number(p.energy       ?? s.energy       ?? 71),
    independence: Number(p.independence ?? s.independence ?? 63),
  };
}
function scoreTone(score) {
  if (score >= 90) return { label: 'Excelente', color: '#22c55e' };
  if (score >= 75) return { label: 'Saudável',  color: '#16a34a' };
  if (score >= 55) return { label: 'Atenção',   color: '#f59e0b' };
  return               { label: 'Sensível',  color: '#ef4444' };
}

function getLifeStageStyle(stage, themeHex) {
  const base = LIFE_STAGE_META[stage];
  if (!base) return null;
  return {
    ...base,
    style: {
      background: `${themeHex}14`,
      color: themeHex,
      borderColor: `${themeHex}30`,
    },
  };
}

// ─── Animation presets ────────────────────────────────────────────────────────
const HEALTH_C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  accent: '#DFFF40',
};

function normalizeGalleryUrls(gallery) {
  if (!Array.isArray(gallery)) return [];

  return [...new Set(
    gallery
      .map((item) => {
        if (typeof item === 'string') return item;
        return item?.url || item?.img || item?.photoUrl || item?.imageUrl || null;
      })
      .filter(Boolean)
  )];
}

function uniqueItems(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeRecordType(type) {
  return String(type || '').toUpperCase();
}

function fmtDate(dateInput) {
  if (!dateInput) return '—';

  try {
    return new Date(dateInput).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

function daysSince(dateInput) {
  if (!dateInput) return '—';

  const diff = Date.now() - new Date(dateInput).getTime();
  const days = Math.floor(diff / 86400000);

  if (!Number.isFinite(days)) return '—';
  if (days <= 0) return 'Hoje';
  if (days === 1) return '1 dia';
  if (days < 30) return `${days} dias`;
  if (days < 365) return `${Math.floor(days / 30)} meses`;
  return `${Math.floor(days / 365)} ano(s)`;
}

function getSocialHealthCollections(cat, healthData) {
  const rawRecords =
    (Array.isArray(healthData?.records) && healthData.records) ||
    (Array.isArray(healthData?.healthRecords) && healthData.healthRecords) ||
    (Array.isArray(cat?.healthRecords) && cat.healthRecords) ||
    [];

  const treatments =
    (Array.isArray(healthData?.treatments) && healthData.treatments) ||
    (Array.isArray(cat?.treatments) && cat.treatments) ||
    [];

  const documents =
    (Array.isArray(healthData?.documents) && healthData.documents) ||
    (Array.isArray(healthData?.files) && healthData.files) ||
    [];

  const igentSessions =
    (Array.isArray(healthData?.igentSessions) && healthData.igentSessions) ||
    (Array.isArray(healthData?.igentRecords) && healthData.igentRecords) ||
    [];

  const igentFromSessions = igentSessions.map((session) => ({
    ...session,
    notes: session?.notes || `Sintoma: ${session?.symptomLabel || session?.title || 'Consulta IA'}. ${session?.analysisText || session?.summary || ''}`,
    date: session?.date || session?.createdAt || null,
    isUrgent: Boolean(session?.isUrgent),
  }));

  const igentFromRecords = rawRecords
    .filter((record) => normalizeRecordType(record?.type) === 'IACONSULT')
    .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));

  return {
    records: rawRecords.filter((record) => normalizeRecordType(record?.type) !== 'IACONSULT'),
    treatments,
    documents,
    igentRecords: igentFromSessions.length > 0 ? igentFromSessions : igentFromRecords,
  };
}

const spring = { type: 'spring', stiffness: 340, damping: 30 };
const fadeSlide = (delay = 0) => ({
  initial:    { opacity: 0, y: 18 },
  animate:    { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 280, damping: 26, delay },
});

// ─────────────────────────────────────────────────────────────────────────────
// SVG Ring — Apple Watch style, compact
// ─────────────────────────────────────────────────────────────────────────────
function Ring({ value, color, size = 64, stroke = 6 }) {
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const pct   = Math.max(0, Math.min(100, Number(value)));
  const dash  = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BehaviorCard — horizontal compact behavior strip
// ─────────────────────────────────────────────────────────────────────────────
function BehaviorCard({ behavior }) {
  const items = [
    { label: 'Energia',       value: behavior.energy,       color: '#6366f1', icon: Zap    },
    { label: 'Curiosidade',   value: behavior.curiosity,    color: '#ff8640', icon: Brain  },
    { label: 'Social',        value: behavior.sociability,  color: '#10b981', icon: Users  },
    { label: 'Independência', value: behavior.independence, color: '#8b5cf6', icon: Shield },
  ];
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {items.map(({ label, value, color, icon: Icon }) => (
        <div key={label} className="flex flex-col items-center gap-2 bg-white rounded-[20px] py-3 px-1 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-50">
          <div className="relative">
            <Ring value={value} color={color} size={52} stroke={5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon size={13} style={{ color }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-black text-gray-900 leading-none">{value}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5 leading-tight">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HealthScorePanel
// ─────────────────────────────────────────────────────────────────────────────
function formatGender(value) {
  if (!value) return 'Não informado';
  const v = String(value).toLowerCase();
  if (['male', 'macho', 'masculino'].includes(v)) return 'Macho';
  if (['female', 'fêmea', 'femea', 'feminino'].includes(v)) return 'Fêmea';
  return value;
}

function formatArrivalType(value) {
  if (!value) return null;
  const map = {
    adopted: 'Adotado', adoption: 'Adoção', rescued: 'Resgatado', rescue: 'Resgate', found: 'Encontrado',
    gift: 'Presente', born_at_home: 'Nasceu em casa', born_home: 'Nasceu em casa', foster: 'Lar temporário',
    bought: 'Comprado', from_street: 'Veio da rua',
  };
  return map[String(value).toLowerCase()] || value;
}

function formatHousingType(value) {
  if (!value) return null;
  const map = { apartment: 'Apartamento', house: 'Casa', farm: 'Sítio / Chácara', indoor_only: 'Ambiente interno' };
  return map[String(value).toLowerCase()] || value;
}

function formatHabitat(value) {
  if (!value) return null;
  const map = { indoor: 'Interno', outdoor: 'Externo', mixed: 'Misto', sheltered: 'Abrigado' };
  return map[String(value).toLowerCase()] || value;
}

function getNicknames(cat) {
  const raw = cat?.cuteNicknames ?? cat?.nicknames ?? [];
  if (Array.isArray(raw)) return raw.filter(Boolean).slice(0, 6);
  if (typeof raw === 'string') return raw.split(',').map(x => x.trim()).filter(Boolean).slice(0, 6);
  return [];
}

function resolveLastHealthUpdate(summary, cat) {
  const candidates = [
    summary?.updatedAt,
    summary?.lastUpdated,
    summary?.lastRecordDate,
    cat?.lastHealthUpdate,
    cat?.updatedAt,
  ].filter(Boolean);
  return candidates[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SocialHealthBanner — usa somente a leitura principal do ProfileHealthBar
// score + status + foto + última atualização, sem trazer o painel inteiro.
// ─────────────────────────────────────────────────────────────────────────────
function SocialHealthBanner({ cat, summary, themeHex }) {
  const score = Number(summary?.score || summary?.overallScore || cat?.healthScore || 88);
  const tone = scoreTone(score);
  const updated = resolveLastHealthUpdate(summary, cat);
  const headline = summary?.headline || summary?.statusText || 'Leitura preventiva baseada nos registros do perfil.';
  const ageLabel = formatCatAge(cat, { fallback: 'Idade nao informada' });
  const stageInfo = getLifeStageStyle(getCatLifeStage(cat), themeHex || tone.color);

  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-4 shadow-[0_8px_26px_rgba(15,12,35,0.08)] border border-white bg-white"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: tone.color }} />
      <div className="flex items-center gap-3 pt-1">
        <div className="relative shrink-0">
          <img
            src={getPhoto(cat)}
            alt={cat?.name}
            className="w-[74px] h-[74px] rounded-[24px] object-cover shadow-[0_10px_24px_rgba(15,12,35,0.12)] border-[3px] border-white"
          />
          <div
            className="absolute -right-1 -bottom-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
            style={{ background: 'rgba(255, 255, 255, 0.82)', color: tone.color }}
          >
            <HeartPulse size={14} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">Score de Saúde</p>
              <h3 className="text-[19px] font-black text-gray-950 leading-tight truncate">{cat?.name}</h3>
              <div className="flex items-center gap-1.5 my-1 flex-wrap">
                <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-[9px] font-black text-gray-600">
                  {ageLabel}
                </span>
                {stageInfo && (
                  <span
                    className="inline-flex px-2 py-0.5 rounded-full border text-[9px] font-black tracking-wider"
                    style={stageInfo.style}
                  >
                    {stageInfo.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-gray-400 truncate">
                {cat?.breed || 'SRD'} {cat?.weight ? `• ${cat.weight} kg` : ''}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-end justify-end gap-0.5">
                <span className="text-[34px] font-black leading-none" style={{ color: tone.color }}>{score}</span>
                <span className="text-[12px] font-black text-gray-300 mb-1">/100</span>
              </div>
              <span
                className="inline-flex mt-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                style={{ background: `${tone.color}14`, color: tone.color }}
              >
                {tone.label}
              </span>
            </div>
          </div>

          <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-gray-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: tone.color }}
            />
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <p className="text-[10px] font-bold text-gray-500 leading-snug line-clamp-2">{headline}</p>
            {updated ? (
              <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 shrink-0">
                {new Date(updated).toLocaleDateString('pt-BR')}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BioProfileInsights({ cat, themeHex }) {
  const nicknames = getNicknames(cat);
  const items = [
    { label: 'Idade', value: formatCatAge(cat, { fallback: 'Nao informado' }), icon: Calendar },
    { label: 'Sexo', value: formatGender(cat?.gender), icon: PawPrint },
    { label: 'Habitat', value: formatHabitat(cat?.habitat), icon: Shield },
    { label: 'Moradia', value: formatHousingType(cat?.housingType), icon: Heart },
    { label: 'Origem', value: formatArrivalType(cat?.arrivalType), icon: Sparkles },
  ].filter(x => x.value && x.value !== 'Não informado');

  return (
    <div className="bg-white rounded-[26px] p-4 shadow-[0_6px_22px_rgba(15,12,35,0.06)] border border-gray-50">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.22em]">Perfil e comportamento</p>
          <h3 className="text-[16px] font-black text-gray-950 leading-tight">Traços do {cat?.name}</h3>
        </div>
        <div className="w-9 h-9 rounded-[14px] flex items-center justify-center" style={{ background: `${themeHex}12`, color: themeHex }}>
          <Brain size={17} />
        </div>
      </div>

      {cat?.bio ? (
        <p className="text-[12px] text-gray-500 font-medium leading-relaxed mb-3 line-clamp-3">“{cat.bio}”</p>
      ) : (
        <p className="text-[12px] text-gray-400 font-medium leading-relaxed mb-3">
          Complete a bio para deixar o perfil social mais vivo e ajudar outros tutores a conhecerem melhor o comportamento do gato.
        </p>
      )}

      {!!nicknames.length && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {nicknames.map(n => (
            <span key={n} className="px-2.5 py-1 rounded-full text-[9px] font-black" style={{ background: `${themeHex}12`, color: themeHex }}>
              {n}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-[18px] bg-[var(--gatedo-light-bg)] border border-gray-100 px-3 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={12} style={{ color: themeHex }} />
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-[12px] font-black text-gray-800 leading-tight truncate">{value}</p>
          </div>
        ))}
      </div>

      {cat?.arrivalNotes ? (
        <div className="mt-3 rounded-[18px] bg-[var(--gatedo-light-bg)] border border-gray-100 px-3.5 py-3">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">História de chegada</p>
          <p className="text-[11px] font-medium text-gray-500 leading-relaxed line-clamp-3">{cat.arrivalNotes}</p>
        </div>
      ) : null}
    </div>
  );
}

function SocialOverview({ cat, summary, behavior, themeHex, galleryImages, socialGalleryCount }) {
  return (
    <div className="space-y-4">
      <SocialHealthBanner cat={cat} summary={summary} themeHex={themeHex} />
      <BehaviorCard behavior={behavior} />
      <BioProfileInsights cat={cat} themeHex={themeHex} />
      <PhotoGrid images={galleryImages} socialGalleryCount={socialGalleryCount} />
    </div>
  );
}

function HealthStatChip({ label, value, tone = 'default' }) {
  const palette =
    tone === 'alert'
      ? { fg: '#DC2626' }
      : tone === 'good'
        ? { fg: '#16A34A' }
        : { fg: HEALTH_C.purple };

  return (
    <div className="rounded-[20px] px-4 py-3 border border-gray-100 bg-white shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-black" style={{ color: palette.fg }}>{value}</p>
    </div>
  );
}

function SocialHealthInsightCard({ cat, igentRecords = [], summary }) {
  const totalSessions = igentRecords.length;
  const urgentCount = igentRecords.filter((item) => item?.isUrgent).length;
  const lastSession = igentRecords[0];

  const symptomFreq = {};
  igentRecords.forEach((record) => {
    const match = record?.notes?.match(/Sintoma:\s*([^.]+)/);
    if (!match?.[1]) return;
    const label = match[1].trim();
    symptomFreq[label] = (symptomFreq[label] || 0) + 1;
  });

  const topSymptom = Object.entries(symptomFreq).sort((a, b) => b[1] - a[1])[0];

  const insightText =
    totalSessions === 0
      ? `${cat?.name} ainda não tem análises iGentVet registradas. Assim que novos registros entrarem, o painel preditivo começa a ganhar contexto.`
      : topSymptom && topSymptom[1] > 1
        ? `${cat?.name} já teve ${totalSessions} análises. "${topSymptom[0]}" apareceu ${topSymptom[1]} vez(es), então vale manter essa frente em observação.${urgentCount > 0 ? ` ${urgentCount} análise(s) vieram com urgência.` : ''}`
        : summary?.summaryText || `${cat?.name} tem ${totalSessions} análise${totalSessions > 1 ? 's' : ''} registrada${totalSessions > 1 ? 's' : ''} no iGentVet.`;

  return (
    <div
      className="rounded-[28px] p-5 text-white shadow-lg relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${HEALTH_C.purple} 0%, ${HEALTH_C.purpleDark} 100%)` }}
    >
      <div className="absolute -right-6 -bottom-6 opacity-[0.07]">
        <Brain size={110} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: HEALTH_C.accent }}
          >
            <Zap size={12} className="text-[#2D2657]" />
          </div>
          <h3 className="text-[9px] font-black uppercase tracking-widest text-white/80">
            iGentVet · Insight Preditivo
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-white/90 italic mb-4">
          "{insightText}"
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-2xl px-3 py-2 text-center">
            <p className="text-lg font-black" style={{ color: HEALTH_C.accent }}>{totalSessions}</p>
            <p className="text-[8px] font-black uppercase tracking-wider text-white/60">Análises</p>
          </div>
          <div className="bg-white/10 rounded-2xl px-3 py-2 text-center">
            <p className="text-lg font-black text-red-300">{urgentCount}</p>
            <p className="text-[8px] font-black uppercase tracking-wider text-white/60">Urgentes</p>
          </div>
          <div className="bg-white/10 rounded-2xl px-3 py-2 text-center">
            <p className="text-[10px] font-black" style={{ color: HEALTH_C.accent }}>
              {lastSession ? daysSince(lastSession?.date) : 'Hoje'}
            </p>
            <p className="text-[8px] font-black uppercase tracking-wider text-white/60">Última</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialClinicalPanel({ records = [], treatments = [], documents = [], igentRecords = [] }) {
  const consultations = records.filter((record) => normalizeRecordType(record?.type) === 'CONSULTATION');
  const activeTreatments = treatments.filter((item) => item?.active !== false && item?.status !== 'completed' && !item?.completed);
  const prescriptions = documents.filter((doc) => String(doc?.category || '').toUpperCase() === 'RECEITA');
  const lastVisit = [...consultations].sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))[0];
  const nextAlert = activeTreatments
    .flatMap((item) => (Array.isArray(item?.doses) ? item.doses : []))
    .filter((dose) => !dose?.takenAt && !dose?.skipped)
    .sort((a, b) => new Date(a?.scheduledAt || 0) - new Date(b?.scheduledAt || 0))[0];

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Painel Clínico
        </h3>
        <span
          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: `${HEALTH_C.purple}10`, color: HEALTH_C.purple }}
        >
          Saúde conectada
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <HealthStatChip label="Consultas" value={consultations.length} />
        <HealthStatChip label="Tratamentos" value={activeTreatments.length} tone={activeTreatments.length ? 'good' : 'default'} />
        <HealthStatChip label="Receitas" value={prescriptions.length} />
        <HealthStatChip label="Análises IA" value={igentRecords.length} tone={igentRecords.some((item) => item?.isUrgent) ? 'alert' : 'default'} />
      </div>

      <div className="grid grid-cols-1 gap-3 mt-3">
        <div className="rounded-[20px] border border-gray-100 p-4 bg-[#FCFCFF]">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Último atendimento</p>
          <p className="text-sm font-black text-gray-800">
            {lastVisit?.title || 'Ainda não há consulta presencial registrada'}
          </p>
          <p className="text-[11px] font-bold text-gray-500 mt-1">
            {lastVisit ? `${lastVisit.veterinarian || lastVisit.clinicName || 'Sem profissional'} · ${fmtDate(lastVisit.date)}` : 'Quando novas consultas entrarem, o painel clínico passa a resumir aqui.'}
          </p>
        </div>

        <div className="rounded-[20px] border border-gray-100 p-4 bg-[#FCFCFF]">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Próximo alerta terapêutico</p>
          <p className="text-sm font-black text-gray-800">
            {nextAlert ? fmtDate(nextAlert.scheduledAt) : 'Nenhuma dose futura programada'}
          </p>
          <p className="text-[11px] font-bold text-gray-500 mt-1">
            {nextAlert ? `Dose prevista para ${new Date(nextAlert.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Os próximos lembretes de tratamento aparecem aqui quando houver agenda ativa.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function SocialHealthTab({ cat, healthData, summary }) {
  const { records, treatments, documents, igentRecords } = useMemo(
    () => getSocialHealthCollections(cat, healthData),
    [cat, healthData]
  );

  return (
    <div className="space-y-4">
      <SocialHealthInsightCard cat={cat} igentRecords={igentRecords} summary={summary} />
      <SocialClinicalPanel
        records={records}
        treatments={treatments}
        documents={documents}
        igentRecords={igentRecords}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PhotoGrid
// ─────────────────────────────────────────────────────────────────────────────
function PhotoGrid({ images, socialGalleryCount }) {
  if (!images.length) return (
    <div className="rounded-[22px] bg-white border border-gray-50 p-8 flex flex-col items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
        <Grid size={22} className="text-gray-300" />
      </div>
      <p className="text-[12px] font-bold text-gray-400 text-center">Nenhuma foto publicada ainda</p>
    </div>
  );
  return (
    <div className="bg-white rounded-[26px] p-4 shadow-[0_6px_22px_rgba(15,12,35,0.06)] border border-gray-50">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.22em]">Galeria social</p>
          <h3 className="text-[16px] font-black text-gray-950 leading-tight">Momentos públicos do perfil</h3>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[9px] font-black" style={{ background: '#F4F3FF', color: HEALTH_C.purple }}>
          {socialGalleryCount > 0 ? `${socialGalleryCount} destaque${socialGalleryCount > 1 ? 's' : ''} da bio` : 'Posts e destaques'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {images.map((img, i) => (
          <motion.div key={`${img}-${i}`}
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className={`aspect-square rounded-[16px] overflow-hidden bg-gray-100 ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
            <img src={img} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TimelineList
// ─────────────────────────────────────────────────────────────────────────────
function TimelineList({ timeline }) {
  if (!timeline?.length) return (
    <div className="rounded-[22px] bg-white border border-gray-50 p-8 flex flex-col items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <Activity size={22} className="text-gray-300" />
      <p className="text-[12px] font-bold text-gray-400 text-center">Sem eventos para mostrar ainda</p>
    </div>
  );
  return (
    <div className="space-y-0">
      {timeline.slice(0, 8).map((item, i) => (
        <motion.div key={`${item?.date || i}-${i}`} {...fadeSlide(i * 0.04)}
          className="flex gap-4 relative">
          {/* Timeline spine */}
          <div className="flex flex-col items-center shrink-0 pt-1">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#8b4aff' }} />
            {i < Math.min(timeline.length, 8) - 1 && (
              <div className="w-[1.5px] flex-1 my-1" style={{ background: 'linear-gradient(to bottom,#FFF,transparent)' }} />
            )}
          </div>
          {/* Content */}
          <div className="pb-5 min-w-0 flex-1">
            <div className="bg-white rounded-[18px] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-gray-50">
              <p className="text-[13px] font-black text-gray-900 leading-tight">{item?.title || item?.label || 'Registro'}</p>
              {(item?.description || item?.summary) && (
                <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">{item?.description || item?.summary}</p>
              )}
              {item?.date && (
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">
                  {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AchievementsPanel
// ─────────────────────────────────────────────────────────────────────────────
function AchievementsPanel({ cat, themeHex }) {
  const achievements = cat?.achievements || [];
  const xpg   = Number(cat?.stats?.xpg || 0);
  const level = Math.max(1, Math.ceil(xpg / 120));
  const xpPct = Math.min(((xpg % 120) / 120) * 100, 100);
  const stage = getCatLifeStage(cat);
  const stageInfo = stage ? LIFE_STAGE_META[stage] : null;
  const displayAchievements = stageInfo
    ? [{ name: stageInfo.label, desc: `${stageInfo.description} · ${formatCatAge(cat)}`, emoji: 'A' }, ...achievements]
    : achievements;

  return (
    <div className="space-y-4">
      {/* XPG header */}
      <div className="bg-white rounded-[26px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.07)] border border-gray-50 relative overflow-hidden">
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-[0.06]"
          style={{ background: themeHex, filter: 'blur(20px)' }} />
        <div className="relative z-10">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Gamificação do gato</p>
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-end gap-1.5">
                <span className="text-[40px] font-black text-gray-900 leading-none">{xpg.toLocaleString('pt-BR')}</span>
                <span className="text-[14px] font-bold text-gray-400 mb-1.5">XPG</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full text-white"
                  style={{ background: themeHex }}>Nível {level}</span>
                <span className="text-[10px] font-bold text-gray-400">{displayAchievements.length} conquistas</span>
              </div>
            </div>
            <div className="relative shrink-0">
              <Ring value={xpPct} color={themeHex} size={72} stroke={6} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Star size={18} style={{ color: themeHex }} />
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1 }}
              className="h-full rounded-full" style={{ background: themeHex }} />
          </div>
        </div>
      </div>

      {/* Badges grid */}
      {displayAchievements.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {displayAchievements.slice(0, 8).map((a, i) => (
            <motion.div key={`${a?.name || i}-${i}`} {...fadeSlide(i * 0.05)}
              className="bg-white rounded-[20px] p-3.5 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-gray-50">
              <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${themeHex}10` }}>
                {a?.emoji || '🏅'}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-gray-900 truncate">{a?.name || 'Conquista'}</p>
                {a?.desc && <p className="text-[9px] font-medium text-gray-400 truncate mt-0.5">{a.desc}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[22px] p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-gray-50">
          <p className="text-[12px] font-bold text-gray-400">Ainda sem badges para mostrar</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShareSheet & QRModal — bottom sheets
// ─────────────────────────────────────────────────────────────────────────────
function BottomSheet({ open, onClose, children }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[3000] bg-black/40 backdrop-blur-sm flex items-end justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 48, opacity: 0 }}
          transition={spring}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.22)] overflow-hidden">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-gray-200" />
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ShareSheet({ open, onClose, cat, themeHex }) {
  const url = socialProfileUrl(cat);
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  const nativeShare = async () => {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title: `${cat?.name} no GATEDO`, url });
    } catch {
      await copyLink();
    }
  };
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="p-6 pt-3">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Compartilhar perfil</p>
        <p className="text-[22px] font-black text-gray-900 mb-5">{cat?.name}</p>
        <p className="text-[11px] text-gray-400 font-medium mb-4 break-all bg-gray-50 rounded-2xl p-3">{url}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={nativeShare}
            className="h-14 rounded-[18px] text-white font-black text-[13px]"
            style={{ background: `linear-gradient(135deg, ${themeHex}, ${themeHex}cc)`, boxShadow: `0 8px 24px ${themeHex}40` }}>
            Compartilhar
          </button>
          <button onClick={copyLink}
            className="h-14 rounded-[18px] font-black text-[13px] text-gray-700 border border-gray-200 bg-gray-50">
            {copied ? '✓ Copiado' : 'Copiar link'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

function QRModal({ open, onClose, cat }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const url = socialProfileUrl(cat);
  useEffect(() => {
    if (!open) return;
    let m = true;
    import('qrcode').then(QRC => QRC.toDataURL(url, { width: 240, margin: 1, color: { dark: '#0f0c1e', light: '#ffffff' } }))
      .then(d => m && setQrDataUrl(d)).catch(() => m && setQrDataUrl(null));
    return () => { m = false; };
  }, [open, url]);
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="p-6 pt-3">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">QR do perfil</p>
        <p className="text-[22px] font-black text-gray-900 mb-5">{cat?.name}</p>
        <div className="rounded-[24px] bg-gray-50 p-4 flex flex-col items-center">
          <div className="w-56 h-56 rounded-[20px] bg-white overflow-hidden p-2 shadow-sm">
            {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" /> : <div className="w-full h-full bg-gray-100 rounded-[16px] animate-pulse" />}
          </div>
          <p className="mt-3 text-[10px] font-medium text-gray-400 break-all text-center">{url}</p>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function CatSocialProfile() {
  const { catId }  = useParams();
  const navigate   = useNavigate();
  const touch      = useSensory();
  const { user: authUser } = useContext(AuthContext);

  const [cat, setCat]               = useState(null);
  const [catPosts, setCatPosts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [following, setFollowing]   = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [showShare, setShowShare]   = useState(false);
  const [showQR, setShowQR]         = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [activeTab, setActiveTab]   = useState('galeria');
  const [healthData, setHealthData] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);
  const [socialGallerySelection, setSocialGallerySelection] = useState([]);

  // Parallax scroll for hero
  const { scrollY } = useScroll();
  const heroY       = useTransform(scrollY, [0, 220], [0, -36]);
  const heroOpacity = useTransform(scrollY, [0, 180], [1, 0.35]);
  const cardY       = useTransform(scrollY, [0, 100], [0, 4]);

  const loadCat = React.useCallback(async () => {
    if (!catId) return;
    setLoading(true);
    try {
      const [petRes, postsRes, healthRes] = await Promise.allSettled([
        api.get(`/pets/${catId}`),
        api.get(`/social/posts/pet/${catId}`),
        api.get(`/health/pet/${catId}`),
      ]);
      if (petRes.status !== 'fulfilled' || !petRes.value?.data) throw new Error();
      const pet      = petRes.value.data;
      const posts    = postsRes.status === 'fulfilled' && Array.isArray(postsRes.value?.data) ? postsRes.value.data : [];
      const hData    = healthRes.status === 'fulfilled' ? healthRes.value?.data : null;
      setCat(pet);
      setCatPosts(posts);
      setHealthData(hData);
      setHealthSummary(buildSocialHealthSummary(hData, pet));
      setFollowCount(Number(pet?.followersCount ?? pet?.stats?.followers ?? 0));
      setFollowing(Boolean(pet?.isFollowing));
    } catch {
      setCat(null);
      setHealthData(null);
    }
    finally { setLoading(false); }
  }, [catId]);

  useEffect(() => { loadCat(); }, [loadCat]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [catId]);

  const themeHex = resolveThemeHex(cat?.themeColor) || '#8b4aff';
  const catRg    = formatCatRg(cat);
  const tutor    = getTutor(cat, authUser);
  const tutorName   = tutor?.name || 'Tutor';
  const tutorAvatar = getTutorAvatar(cat, authUser);
  const behavior = deriveBehavior(cat);
  const galleryUrls = useMemo(
    () => normalizeGalleryUrls(cat?.gallery || cat?.galleryPhotos || cat?.photos || []),
    [cat?.gallery, cat?.galleryPhotos, cat?.photos]
  );
  const postImages = useMemo(
    () => uniqueItems(catPosts.map((post) => post?.imageUrl || post?.mediaUrl || post?.coverImage || null)),
    [catPosts]
  );

  useEffect(() => {
    if (!cat?.id) {
      setSocialGallerySelection([]);
      return;
    }

    setSocialGallerySelection(pruneSocialGallerySelection(cat.id, galleryUrls));
  }, [cat?.id, galleryUrls]);

  const socialGalleryImages = useMemo(() => {
    if (socialGallerySelection.length > 0) {
      return uniqueItems([...socialGallerySelection, ...postImages, ...galleryUrls]).slice(0, 9);
    }

    if (postImages.length > 0) {
      return uniqueItems([...postImages, ...galleryUrls]).slice(0, 9);
    }

    return galleryUrls.slice(0, 9);
  }, [socialGallerySelection, postImages, galleryUrls]);

  const ownerIds = useMemo(() =>
    [cat?.ownerId, cat?.userId, cat?.owner?.id, cat?.user?.id, cat?.tutor?.userId, cat?.tutor?.id]
      .filter(Boolean).map(String), [cat]);

  const viewerIsOwner = useMemo(() =>
    authUser?.id ? ownerIds.includes(String(authUser.id)) : false, [authUser?.id, ownerIds]);

  const score    = Number(healthSummary?.score || healthSummary?.overallScore || 88);
  const xpg      = Number(cat?.stats?.xpg || 0);
  const level    = Math.max(1, Math.ceil(xpg / 120));
  const ageLabel = formatCatAge(cat, { fallback: 'N/I' });

  const handleFollow = async () => {
    if (viewerIsOwner) return;
    touch?.('success');
    setFollowing(p => !p);
    setFollowCount(p => p + (following ? -1 : 1));
  };

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] flex flex-col">
      <div className="h-[340px] bg-gray-200 animate-pulse" />
      <div className="flex-1 px-4 pt-5 space-y-4">
        <div className="h-28 rounded-[24px] bg-white animate-pulse" />
        <div className="h-48 rounded-[24px] bg-white animate-pulse" />
      </div>
    </div>
  );

  if (!cat) return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] flex flex-col items-center justify-center gap-4">
      <PawPrint size={40} className="text-gray-300" />
      <p className="text-[14px] font-bold text-gray-400">Perfil não encontrado</p>
      <button onClick={() => navigate(-1)} className="text-[13px] font-black text-gray-600 px-5 py-2.5 bg-white rounded-full shadow-sm">
        Voltar
      </button>
    </div>
  );

  const TABS = [
    { key: 'galeria',    label: 'Galeria',    icon: Grid     },
    { key: 'conquistas', label: 'Conquistas', icon: Award    },
    { key: 'saude',      label: 'Saúde',      icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)]"
      style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ── HERO PHOTO — full bleed, parallax ── */}
      <div className="relative overflow-hidden" style={{ height: 236 }}>
        <motion.img
          src={getPhoto(cat)}
          alt={cat?.name}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ y: heroY, opacity: heroOpacity, objectPosition: 'center 38%' }}
          draggable="false"
          loading="eager"
        />

        {/* Bottom fade to page background — pure neutral, NO color wash */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(40, 0, 78, 0.17) 35%, rgba(53, 5, 99, 0.4) 60%, rgb(25, 4, 49) 100%)' }} />

        {/* themeColor accent: ONE thin line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${themeHex} 40%, ${themeHex} 60%, transparent 50%)` }} />

        {/* Top controls */}
        <div
          className="absolute top-0 left-0 right-0 px-4 flex items-center justify-between z-10"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
        >
          <motion.button initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <ArrowLeft size={18} className="text-white" />
          </motion.button>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-2">
            {[
              { icon: Share2, action: () => setShowShare(true) },
              { icon: QrCode, action: () => setShowQR(true)    },
            ].map(({ icon: Icon, action }, i) => (
              <button key={i} onClick={action}
                className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
                style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Icon size={17} className="text-white" />
              </button>
            ))}
          </motion.div>
        </div>

        {/* Cat name overlay on photo — bottom left */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="absolute bottom-12 left-5 right-5">
          <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.22em] mb-1">Perfil Social</p>
          <h1 className="text-[38px] font-black text-white leading-none drop-shadow-sm">{cat.name}</h1>
        </motion.div>
      </div>

      {/* ── IDENTITY CARD — floats over hero ── */}
      <motion.div style={{ y: cardY }} className="relative -mt-5 px-4 z-10">
        <motion.div {...fadeSlide(0.1)}
          className="bg-white rounded-[28px] shadow-[0_4px_32px_rgba(0,0,0,0.1)] overflow-hidden border-[2px]"
          style={{ borderColor: `${themeHex}22` }}>

         

          <div className="p-4 pb-3">
            {/* Cat RG + breed row */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full text-white"
                    style={{ background: themeHex }}>{catRg}</span>
                  <span className="text-[10px] font-bold text-gray-500">{cat.breed || 'SRD'}</span>
                  {cat.neutered && <span className="text-[10px] font-bold text-gray-400">· Castrado</span>}
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[
                { value: followCount,             label: 'Seguidores' },
                { value: catPosts.length,          label: 'Posts'      },
                { value: ageLabel,                 label: 'Idade'      },
                { value: score,                    label: 'Saúde'      },
                { value: `Lv ${level}`,            label: 'Nível'      },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="text-center py-2 rounded-[15px]"
                  style={{ background: 'var(--gatedo-light-bg)', border: `1px solid ${themeHex}14` }}
                >
                  <p className="text-[16px] font-black text-gray-900 leading-none">{value}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Tutor + CTA row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <img src={tutorAvatar} alt={tutorName}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-gray-100" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Tutor</p>
                  <p className="text-[13px] font-black text-gray-900 truncate leading-tight">{tutorName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {viewerIsOwner ? (
                  <>
                    <button onClick={() => setShowEdit(true)}
                      className="h-9 px-3 rounded-full font-black text-[11px] border border-gray-200 text-gray-600 bg-gray-50">
                      Editar
                    </button>
                    <button onClick={() => setShowComposer(true)}
                      className="h-9 px-4 rounded-full font-black text-[11px] text-white shadow-sm"
                      style={{ background: themeHex, boxShadow: `0 4px 16px ${themeHex}50` }}>
                      + Post
                    </button>
                  </>
                ) : (
                  <motion.button onClick={handleFollow} whileTap={{ scale: 0.94 }}
                    className="h-9 px-5 rounded-full font-black text-[12px] flex items-center gap-1.5"
                    style={following
                      ? { background: 'var(--gatedo-light-bg)', color: '#666', border: '1.5px solid #e5e5e5' }
                      : { background: themeHex, color: '#fff', boxShadow: `0 4px 16px ${themeHex}50` }}>
                    {following ? <><Check size={13} /> Seguindo</> : <><UserPlus size={13} /> Seguir</>}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Bio */}
            {cat.bio && (
              <p className="mt-3 text-[12px] text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-3">
                {cat.bio}
              </p>
            )}
          </div>

          {/* ── Tab bar ── */}
          <div className="flex border-t border-gray-50">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = activeTab === key;
              return (
                <button key={key} onClick={() => setActiveTab(key)}
                  className="relative flex-1 h-12 flex items-center justify-center gap-1.5 text-[11px] font-black transition-colors"
                  style={{ color: active ? themeHex : '#9ca3af' }}>
                  <Icon size={14} />
                  {label}
                  {active && (
                    <motion.div layoutId="tab-indicator"
                      className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                      style={{ background: themeHex }} />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Tab content ── */}
        <div className="mt-4 pb-24">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}>

              {activeTab === 'galeria' && (
                <SocialOverview
                  cat={cat}
                  summary={healthSummary}
                  behavior={behavior}
                  themeHex={themeHex}
                  galleryImages={socialGalleryImages}
                  socialGalleryCount={socialGallerySelection.length}
                />
              )}

              {activeTab === 'conquistas' && (
                <AchievementsPanel cat={cat} themeHex={themeHex} />
              )}

              {activeTab === 'saude' && (
                <SocialHealthTab
                  cat={cat}
                  healthData={healthData}
                  summary={healthSummary}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Bottom sheets ── */}
      <ShareSheet open={showShare} onClose={() => setShowShare(false)} cat={cat} themeHex={themeHex} />
      <QRModal open={showQR} onClose={() => setShowQR(false)} cat={cat} />

      {showEdit && viewerIsOwner && (
        <EditProfileModal isOpen={showEdit} onClose={() => setShowEdit(false)} cat={cat} onSave={loadCat} />
      )}
      {showComposer && viewerIsOwner && (
        <SocialPostComposerModal isOpen={showComposer} onClose={() => setShowComposer(false)} cat={cat} onPublished={loadCat} />
      )}
    </div>
  );
}
