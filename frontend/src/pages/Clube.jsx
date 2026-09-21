import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  PawPrint,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import {
  countActivePets,
  formatDateBR,
  formatTutorBadgeLabel,
  getMembershipMeta,
  getPrimaryTutorBadge,
  normalizeBadges,
  TUTOR_BADGE_META,
} from '../utils/membershipMeta';

// ── StatTile ──────────────────────────────────────────────────────────────

function StatTile({ icon: Icon, label, value, accent, bg }) {
  return (
    <div className="rounded-[22px] px-3 py-4 text-center" style={{ backgroundColor: bg }}>
      <Icon size={16} className="mx-auto mb-2" style={{ color: accent }} />
      <p className="text-lg font-black text-gray-800">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-[2px] text-gray-400">{label}</p>
    </div>
  );
}

// ── SeloChip ──────────────────────────────────────────────────────────────

function SeloChip({ code, user }) {
  const meta = TUTOR_BADGE_META[code];
  const [failed, setFailed] = useState(false);

  if (!meta) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-[1px]">
        {code}
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full border"
      style={{ background: `${meta.color}12`, borderColor: `${meta.color}40` }}
    >
      <span className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden bg-white shrink-0">
        {meta.launchBadge && !failed ? (
          <img
            src={meta.asset}
            alt=""
            className="w-full h-full object-contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="text-sm" style={{ color: meta.color }}>{meta.emoji}</span>
        )}
      </span>
      <span className="text-[11px] font-black uppercase tracking-[1px]" style={{ color: meta.color }}>
        {formatTutorBadgeLabel(meta, user)}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function Clube() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);
  const { streak, gpts, xpt, level, nextLevel, progress } = useGamification();
  const [searchParams] = useSearchParams();
  const highlightPoints = searchParams.get('reason') === 'points';

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/users/${user.id}/profile`)
      .then((r) => setProfile(r.data || null))
      .catch(() => {});
  }, [user?.id]);

  const effectiveUser = profile || user || {};

  const membership = useMemo(
    () => getMembershipMeta(effectiveUser),
    [effectiveUser],
  );

  const primaryBadge = useMemo(
    () => getPrimaryTutorBadge(effectiveUser),
    [effectiveUser],
  );

  const ownedBadgeCodes = useMemo(
    () => normalizeBadges(effectiveUser.badges).filter((code) => code !== primaryBadge?.key),
    [effectiveUser.badges, primaryBadge],
  );

  const activePetsCount = countActivePets(profile?.pets || []);

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-28">

      {/* ── Top nav ── */}
      <div className="px-5 pt-8 pb-1">
        <button
          type="button"
          onClick={() => { touch(); navigate(-1); }}
          className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm text-[#8B4AFF]"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="px-5 pt-4 space-y-4">

        {/* ── Hero: nível ── */}
        <div className="rounded-[32px] overflow-hidden bg-gradient-to-br from-[#8B4AFF] via-[#7A4CFF] to-[#5E2DDB] p-6 text-white relative">
          <img
            src="/assets/logo-fundo1.svg"
            alt=""
            aria-hidden="true"
            className="absolute -right-10 -bottom-10 w-44 opacity-100 pointer-events-none select-none"
          />

          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-white/50">
              Clube Gatedo
            </p>
            <h1 className="text-[28px] leading-none font-black mt-3">
              {level?.emoji} {level?.name || 'Gateiro Iniciante'}
            </h1>
            <p className="text-[13px] font-medium text-white/70 mt-3">
              {Number(xpt || 0).toLocaleString('pt-BR')} XPT acumulado
            </p>

            {nextLevel ? (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-[10px] font-bold text-white/70">
                    Próximo: {nextLevel.emoji} {nextLevel.name}
                  </p>
                  <p className="text-[10px] font-black text-white">{progress}%</p>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2">
                <Sparkles size={13} className="text-white" />
                <p className="text-xs font-black text-white">Nível máximo atingido!</p>
              </div>
            )}

            {user && (
              <div className="mt-5 inline-flex flex-wrap items-center gap-2.5 rounded-[20px] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <Trophy size={14} className="text-[#edff61]" />
                <span className="text-[11px] font-black uppercase tracking-[2px] text-white/70">
                  Status
                </span>
                <span className="text-[13px] font-black text-[#edff61]">
                  {primaryBadge?.label || membership.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={Zap} label="XPT" value={Number(xpt || 0).toLocaleString('pt-BR')} accent="#8B4AFF" bg="#F5F1FF" />
            <StatTile icon={PawPrint} label="GPTS" value={Number(gpts || 0).toLocaleString('pt-BR')} accent="#D48000" bg="#FFF8E8" />
            <StatTile icon={Flame} label="Streak" value={`${streak || 0} dias`} accent="#F59E0B" bg="#FFFBEB" />
            <StatTile icon={PawPrint} label="Gatos ativos" value={activePetsCount} accent="#10B981" bg="#F0FDF4" />
          </div>
        </div>

        {/* ── Selos ── */}
        <div className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[4px] text-[#FF7C42] mb-1">
            Selos
          </p>
          <h2 className="text-[22px] leading-none font-black text-gray-900 mb-5">
            Suas conquistas
          </h2>

          {primaryBadge ? (
            <div
              className="rounded-[24px] p-4 flex items-center gap-3.5 mb-3"
              style={{ background: `${primaryBadge.color}10`, border: `1px solid ${primaryBadge.color}30` }}
            >
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden bg-white shrink-0">
                {primaryBadge.launchBadge ? (
                  <img src={primaryBadge.asset} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl" style={{ color: primaryBadge.color }}>{primaryBadge.emoji}</span>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-black" style={{ color: primaryBadge.color }}>
                  {primaryBadge.label}
                </p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
                  {primaryBadge.title}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[13px] font-medium text-gray-500 mb-3">
              Continue usando o Gatedo para desbloquear seus primeiros selos.
            </p>
          )}

          {ownedBadgeCodes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {ownedBadgeCodes.map((code) => (
                <SeloChip key={code} code={code} user={effectiveUser} />
              ))}
            </div>
          )}
        </div>

        {/* ── Gatedo Points ── */}
        <div className={`bg-white rounded-[32px] p-5 border shadow-sm ${highlightPoints ? 'border-[#edff61]' : 'border-gray-100'}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[4px] text-[#8B4AFF]">
                Gatedo Points
              </p>
              <h2 className="text-[24px] leading-none font-black text-gray-900 mt-2">
                {Number(gpts || 0).toLocaleString('pt-BR')} GPTS
              </h2>
            </div>
            <div className="shrink-0 ml-3 relative w-16 h-16">
              <div
                className="absolute inset-0 rounded-full opacity-20 blur-lg"
                style={{ background: 'radial-gradient(circle, #FFD700, #FF8C00)' }}
              />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFE066] to-[#FF9900] flex items-center justify-center shadow-lg shadow-yellow-200">
                <PawPrint size={24} className="text-white drop-shadow" />
              </div>
            </div>
          </div>
          <p className="text-[13px] font-medium text-gray-500 mt-1 leading-relaxed">
            GPTS são usados em consultas com IA, Studio e outros recursos que consomem pontos sob demanda. Você ganha GPTS usando o app.
          </p>
        </div>

        {/* ── Selo fundador (apenas quem já pagou) ── */}
        {membership.plan !== 'FREE' && (
          <div className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-[#8B4AFF] mb-1">
              Seu histórico
            </p>
            <h2 className="text-[18px] leading-none font-black text-gray-900 mb-3">
              {primaryBadge?.label || membership.label}
            </h2>
            <p className="text-[13px] font-medium text-gray-500 leading-relaxed">
              Ativado em {formatDateBR(profile?.subscription?.startedAt || profile?.createdAt)}.
              Seu selo e seus benefícios continuam valendo para sempre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
