import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  ShieldCheck,
  Syringe,
  Sparkles,
  Scale,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Cat,
  Trophy,
  BrainCircuit,
  ChevronDown,
} from 'lucide-react';
import { normalizeHealthHistory } from '../../utils/healthHistoryAdapter';
import { calculateHealthScore } from '../../utils/healthScore';
import { formatCatAge, getCatLifeStage, LIFE_STAGE_META } from '../../utils/catAge';

/* ══════════════════════════════════════════════════
   PALETA — 4 estados de saúde mapeados pelo score
   green  ≥ 75   saudável
   blue   55–74  bom, pode melhorar
   amber  35–54  requer atenção
   red    < 35   cuidados críticos pendentes
══════════════════════════════════════════════════ */
const TONES = {
  green: {
    headerBg:     '#1f8a4c',
    ecgBg:        '#1d9651',
    darkBase:     '#0d4a27',
    glow:         'rgba(22,163,74,0.18)',
    ring:         '#86EFAC',
    ringBorder:   'rgba(134,239,172,0.85)',
    soft:         'rgba(134,239,172,0.20)',
    pulse:        'rgba(134,239,172,0.45)',
    badgeBg:      'rgba(255,255,255,0.15)',
    badgeColor:   '#DCFCE7',
    pillBg:       'rgba(0,0,0,0.22)',
    tintBg:       '#f0fdf4',
    tintBorder:   '#bbf7d0',
    accentText:   '#15803d',
    accentSolid:  '#22c55e',
    chartA:       '#86EFAC',
    chartB:       '#4ADE80',
  },
   blue: {
    headerBg:     '#5b85ff',
    ecgBg:       '#5b85ff',
    glow:        'rgba(97, 139, 255, 0.18)',
    ring:        '#93C5FD',
    ringBorder:  'rgba(147,197,253,0.85)',
    soft:        'rgba(147,197,253,0.20)',
    pulse:       'rgba(147,197,253,0.45)',
    badgeBg:     'rgba(255,255,255,0.14)',
    badgeColor:  '#DBEAFE',
    orb1:        'rgba(96,165,250,0.12)',
    orb2:        'rgba(29,78,216,0.09)',
    tintBg:      '#eff6ff',
    tintBorder:  '#bfdbfe',
    accentText:  '#1d4ed8',
    accentSolid: '#3b82f6',
    chartA:      '#93C5FD',
    chartB:      '#60A5FA',
  },
  amber: {
    headerBg:     '#c7771a',
    ecgBg:        '#B45309',
    darkBase:     '#8a3e06',
    glow:         'rgba(180,83,9,0.18)',
    ring:         '#FCD34D',
    ringBorder:   'rgba(252,211,77,0.85)',
    soft:         'rgba(252,211,77,0.20)',
    pulse:        'rgba(252,211,77,0.45)',
    badgeBg:      'rgba(255,255,255,0.15)',
    badgeColor:   '#FEF3C7',
    pillBg:       'rgba(0,0,0,0.22)',
    tintBg:       '#fffbeb',
    tintBorder:   '#fde68a',
    accentText:   '#b45309',
    accentSolid:  '#f59e0b',
    chartA:       '#FCD34D',
    chartB:       '#FBBF24',
  },
  red: {
    headerBg:     '#d64b4b',
    ecgBg:        '#bc0000',
    darkBase:     '#8c0000',
    glow:         'rgba(185,28,28,0.18)',
    ring:         '#FCA5A5',
    ringBorder:   'rgba(252,165,165,0.85)',
    soft:         'rgba(252,165,165,0.18)',
    pulse:        'rgba(252,165,165,0.42)',
    badgeBg:      'rgba(255,255,255,0.14)',
    badgeColor:   '#FEE2E2',
    pillBg:       'rgba(0,0,0,0.22)',
    tintBg:       '#fef2f2',
    tintBorder:   '#fecaca',
    accentText:   '#b91c1c',
    accentSolid:  '#ef4444',
    chartA:       '#FCA5A5',
    chartB:       '#F87171',
  },
};

function resolveToneKey(score) {
  if (score >= 75) return 'green';
  if (score >= 55) return 'blue';
  if (score >= 35) return 'amber';
  return 'red';
}

/* ══════════════════════════════════════════════════
   CSS GLOBAL — keyframes injetados 1× no DOM
══════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @keyframes phbPulse {
    0%   { transform:scale(1);    opacity:.65; }
    100% { transform:scale(1.32); opacity:0;   }
  }
  .phb-r1 { animation:phbPulse 2.2s ease-out infinite 0s;    }
  .phb-r2 { animation:phbPulse 2.2s ease-out infinite .72s;  }
  .phb-r3 { animation:phbPulse 2.2s ease-out infinite 1.44s; }
  @keyframes ecgIn  { 0%{width:100%} 100%{width:0}  }
  @keyframes ecgOut { 0%{left:-120%} 100%{left:0}   }
`;

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const NUN = { fontFamily: 'Nunito, sans-serif' };

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
};

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function calcCareScore(history, cat) {
  let s = 0;
  if (cat?.weight)            s += 18;
  if (cat?.healthSummary)     s += 16;
  if (cat?.foodType)          s += 12;
  if (cat?.feedFrequencyMode) s += 12;
  if (cat?.microchip)         s += 8;
  if (Array.isArray(history?.vaccines)      && history.vaccines.length      > 0) s += 14;
  if (Array.isArray(history?.consultations) && history.consultations.length > 0) s += 12;
  if (Array.isArray(cat?.preExistingConditions) && cat.preExistingConditions.length > 0) s += 8;
  return clamp(s);
}

const resolveCatXpg   = (c) => Number(c?.xpg   ?? c?.petXp ?? c?.xp    ?? 0);
const resolveCatLevel = (c) => Number(c?.petLevel ?? c?.level ?? 1);
const resolveCatPhoto = (c) =>
  c?.photoURL ?? c?.photo ?? c?.avatar ?? c?.image ?? c?.profilePhoto ?? null;

function formatGender(value) {
  const v = String(value || '').toLowerCase();
  if (['female', 'femea', 'feminino'].includes(v)) return 'Femea';
  if (['male', 'macho', 'masculino'].includes(v)) return 'Macho';
  return 'Sexo N/I';
}

function getDisplayBreed(cat) {
  const breed = String(cat?.breed || '').trim();
  if (!breed) return 'Raca N/I';
  if (breed.toLowerCase() === 'srd') return cat?.coatType ? `SRD · ${cat.coatType}` : 'SRD';
  return breed;
}

/* ══════════════════════════════════════════════════
   AVATAR — obrigatório, com fallback Cat icon
   Tamanho fixo 76 px, sangra -12 px pela esquerda.
   3 anéis de pulse CSS ao redor do círculo.
══════════════════════════════════════════════════ */
function CatAvatar({ cat, tone }) {
  const [failed, setFailed] = useState(false);
  const photo = resolveCatPhoto(cat);
  const showPhoto = photo && !failed;
  const SIZE = 76;

  return (
    <div style={{
      position: 'relative', flexShrink: 0,
      width: SIZE, height: SIZE,
      marginLeft: -12,
    }}>
      {[{ cls:'phb-r1', ins:-5 }, { cls:'phb-r2', ins:-11 }, { cls:'phb-r3', ins:-17 }].map(({ cls, ins }) => (
        <div key={cls} className={cls} style={{
          position: 'absolute', inset: ins,
          border: `1.5px solid ${tone.ring}`,
          borderRadius: '50%', opacity: 0.45, pointerEvents: 'none',
        }} />
      ))}

      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        borderRadius: '50%', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `3px solid ${tone.ringBorder}`,
        background: showPhoto ? '#000' : 'rgba(255,255,255,0.14)',
        boxShadow: `0 0 0 2px rgba(0,0,0,0.14), 0 8px 18px rgba(0,0,0,0.10)`,
      }}>
        {showPhoto ? (
          <img
            src={photo}
            alt={cat?.name || 'Gato'}
            onError={() => setFailed(true)}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
              display: 'block',
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cat size={26} color="rgba(255,255,255,0.84)" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SCORE RING — 54 px
══════════════════════════════════════════════════ */
function ScoreRing({ score, ring, soft }) {
  const sz = 54, sw = 5;
  const r  = (sz - sw) / 2;
  const c  = 2 * Math.PI * r;
  const offset = c * (1 - clamp(score) / 100);
  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, width:sz, height:sz }}>
      <svg width={sz} height={sz} style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={sw} />
        <motion.circle
          cx={sz/2} cy={sz/2} r={r} fill="none" stroke={ring} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', boxShadow:`0 0 0 5px ${soft}` }} />
      <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
        <p style={{ ...NUN, fontSize:16, fontWeight:900, color:'#fff', lineHeight:1 }}>{score}</p>
        <p style={{ ...NUN, fontSize:6, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,255,255,0.60)', marginTop:1 }}>
          Score
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ECG WAVE — DS_29 técnica, fundo sólido ecgBg
══════════════════════════════════════════════════ */
const ECG_PTS = `
  0,16 24,16 28,13.5 32,11 35,16 37,21 40,1.5 43,30 46,16
  54,16 57.5,12 64,8 70.5,12 74,16
  112,16 116,13.5 120,11 123,16 125,21 128,1.5 131,30 134,16
  142,16 145.5,12 152,8 158.5,12 162,16
  200,16 204,13.5 208,11 211,16 213,21 216,1.5 219,30 222,16
  230,16 233.5,12 240,8 246.5,12 250,16
  288,16 292,13.5 296,11 299,16 301,21 304,1.5 307,30 310,16
  318,16 321.5,12 328,8 334.5,12 338,16
  376,16 380,13.5 384,11 387,16 389,21 392,1.5 395,30 398,16
  406,16 409.5,12 416,8 422.5,12 426,16
  464,16 468,13.5 472,11 475,16 477,21 480,1.5 483,30 486,16
  494,16 497.5,12 504,8 510.5,12 514,16
  560,16
`;

function EcgWave({ color, ecgBg }) {
  return (
    <div style={{ position:'relative', width:'100%', height:32, overflow:'hidden', background: ecgBg }}>
      <svg viewBox="0 0 560 32" preserveAspectRatio="none" width="100%" height="32" style={{ display:'block' }}>
        <polyline fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.20" points={ECG_PTS} />
        <polyline fill="none" stroke={color} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" points={ECG_PTS} />
      </svg>
      <div style={{
        position:'absolute', top:0, right:0, width:'100%', height:'100%',
        background: ecgBg, animation:'ecgIn 2.5s linear infinite',
      }} />
      <div style={{
        position:'absolute', top:0, left:'-120%', width:'120%', height:'100%',
        background:`linear-gradient(to right,${ecgBg} 0%,${ecgBg} 80%,transparent 100%)`,
        animation:'ecgOut 2.5s linear infinite',
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   DETAIL CARD — painel branco expandido
══════════════════════════════════════════════════ */
function DetailCard({ icon: Icon, label, value, accent }) {
  return (
    <div style={{
      ...NUN, borderRadius:14, background:'#fff',
      border:'1px solid #F0F0F0', borderLeft:`3px solid ${accent}`,
      padding:'10px 12px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
        <Icon size={10} style={{ color:accent, flexShrink:0 }} />
        <span style={{ fontSize:7, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'#9CA3AF' }}>{label}</span>
      </div>
      <p style={{ fontSize:12, fontWeight:800, color:'#1F2937', lineHeight:1.3 }}>{value}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PROGRESS TRACK — painel branco expandido
══════════════════════════════════════════════════ */
function ProgressTrack({ label, value, colorA, colorB, icon: Icon, accent }) {
  const safe = clamp(value);
  return (
    <div style={NUN}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <Icon size={10} style={{ color:accent }} />
          <span style={{ fontSize:7.5, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'#6B7280' }}>{label}</span>
        </div>
        <span style={{ fontSize:9, fontWeight:800, color:'#374151' }}>{safe}%</span>
      </div>
      <div style={{ height:5, borderRadius:99, background:'#F3F4F6', overflow:'hidden' }}>
        <motion.div
          initial={{ width:0 }}
          animate={{ width:`${safe}%` }}
          transition={{ duration:1, ease:'easeOut' }}
          style={{ height:'100%', borderRadius:99, background:`linear-gradient(90deg,${colorA},${colorB})` }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════ */
export default function ProfileHealthBar({ cat }) {
  const [expanded, setExpanded] = useState(false);

  const history    = useMemo(() => normalizeHealthHistory(cat), [cat]);
  const scoreData  = useMemo(() => calculateHealthScore(history), [history]);

  const healthScore = clamp(scoreData.score || 0);
  const tone        = TONES[resolveToneKey(healthScore)];
  const careScore   = useMemo(() => calcCareScore(history, cat), [history, cat]);

  const latestVaccine      = history.vaccines?.[0]      || null;
  const latestConsultation = history.consultations?.[0] || null;
  const latestWeight       = history.weightLogs?.[0]    || null;
  const xpg      = resolveCatXpg(cat);
  const petLevel = resolveCatLevel(cat);
  const ageLabel = formatCatAge(cat, { fallback: 'Idade N/I' });
  const lifeStage = getCatLifeStage(cat);
  const lifeStageLabel = lifeStage ? LIFE_STAGE_META[lifeStage]?.label : null;
  const identityBadges = [
    formatGender(cat?.gender),
    ageLabel,
    getDisplayBreed(cat),
    lifeStageLabel,
  ].filter(Boolean);

  const statusText =
    healthScore >= 75 ? 'Saúde bem acompanhada e rotina preventiva consistente.'
    : healthScore >= 55 ? 'Perfil saudável — alguns pontos podem ser fortalecidos.'
    : healthScore >= 35 ? 'A base está boa, mas ainda existem pontos a fortalecer.'
    : 'O perfil clínico ainda apresenta lacunas importantes de cuidado.';

  return (
    /*
     * Wrapper com padding-bottom = 18px para o pill-chevron
     * que fica FORA do card, centralizado na borda inferior.
     */
    <div
      id="health-predictive"
      className="gatedo-scroll-target"
      style={{ ...NUN, width:'100%', maxWidth:560, margin:'0 auto 24px', position:'relative' }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* ════════════════════════════════════════════
          CARD — overflow:hidden nos dois sentidos,
          altura recolhida controlada pelo conteúdo
          (≤ 160 px via tamanhos calibrados abaixo).
         ════════════════════════════════════════════ */}
      <div style={{
        borderRadius:28, overflow:'hidden', position:'relative',
        boxShadow:`0 10px 24px ${tone.glow}, 0 3px 10px rgba(0,0,0,0.12)`,
      }}>

        {/* ── HEADER BUTTON ─────────────────────── */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            display:'block', width:'100%', textAlign:'left',
            background:tone.headerBg, border:'none', cursor:'pointer', padding:0,
            position:'relative',
          }}
        >
          {/* dots texture */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
            backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)',
            backgroundSize:'14px 14px',
          }} />

          {/* ── Pill "PAINEL PREDITIVO" — centralizado no topo ── */}
          <div style={{
            position:'relative', zIndex:2,
            display:'flex', justifyContent:'center',
            paddingTop:10, paddingBottom:6,
          }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(0,0,0,0.28)',
              border:'1px solid rgba(255,255,255,0.14)',
              borderRadius:99, padding:'4px 14px',
            }}>
              {/* small dot accent */}
              <div style={{ width:5, height:5, borderRadius:'50%', background:tone.ring, flexShrink:0 }} />
              <span style={{
                ...NUN, fontSize:7.5, fontWeight:800,
                letterSpacing:'0.24em', textTransform:'uppercase',
                color:'rgba(255,255,255,0.80)',
              }}>
                Painel Preditivo
              </span>
            </div>
          </div>

          {/* ── Main row: avatar | info | status | score ── */}
          <div style={{
            position:'relative', zIndex:2,
            display:'flex', alignItems:'center', gap:10,
            padding:'0 14px 0 0',
          }}>
            {/* Avatar — 76 px, sangra -12 px esquerda */}
            <CatAvatar cat={cat} tone={tone} />

            {/* Info block */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center', marginBottom:5 }}>
                {[formatGender(cat?.gender), getDisplayBreed(cat), ageLabel].map(lbl => (
                  <span key={lbl} style={{
                    ...NUN, padding:'2px 8px', borderRadius:99,
                    fontSize:6.5, fontWeight:900, letterSpacing:'0.10em',
                    textTransform:'uppercase',
                    background:'rgba(255,255,255,0.22)', color:'#fff',
                    border:'1px solid rgba(255,255,255,0.18)',
                  }}>{lbl}</span>
                ))}
                {lifeStageLabel ? (
                  <span style={{
                    ...NUN, padding:'2px 7px', borderRadius:99,
                    fontSize:6, fontWeight:950, letterSpacing:'0.12em',
                    textTransform:'uppercase',
                    background:tone.ring, color:tone.darkBase || '#064e3b',
                    boxShadow:`0 0 12px ${tone.pulse}`,
                  }}>{lifeStageLabel}</span>
                ) : null}
              </div>
              {/* Eyebrow com nome */}
              <p style={{ display:'none',
                ...NUN, fontSize:6.5, fontWeight:800, letterSpacing:'0.18em',
                textTransform:'uppercase', color:'rgba(255,255,255,0.50)',
                marginBottom:2,
              }}>
                Painel Preditivo · {cat?.name}
              </p>
              {/* Nome grande */}
              <p style={{
                ...NUN, fontSize:22, fontWeight:900, letterSpacing:'-0.01em',
                color:'#fff', lineHeight:1, marginBottom:6,
              }}>
                {cat?.name}
              </p>
              {/* Badges */}
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {[].map(lbl => (
                  <span key={lbl} style={{
                    ...NUN, padding:'2px 9px', borderRadius:99,
                    fontSize:6.5, fontWeight:900, letterSpacing:'0.10em',
                    textTransform:'uppercase',
                    background:'rgba(255,255,255,0.22)', color:'#fff',
                    border:'1px solid rgba(255,255,255,0.18)',
                  }}>{lbl}</span>
                ))}
                {[`Saúde ${healthScore}/100`, `Cuidado ${careScore}/100`].map(lbl => (
                  <span key={lbl} style={{
                    ...NUN, padding:'2px 9px', borderRadius:99,
                    fontSize:6.5, fontWeight:800, letterSpacing:'0.10em',
                    textTransform:'uppercase',
                    background:tone.badgeBg, color:tone.badgeColor,
                    border:'1px solid rgba(255,255,255,0.12)',
                  }}>{lbl}</span>
                ))}
              </div>
            </div>

            {/* Status */}
            <p style={{
              ...NUN, flexShrink:0, fontSize:14, fontWeight:900,
              letterSpacing:'0.03em', color:'rgba(255,255,255,0.90)',
              textShadow:`0 0 14px ${tone.pulse}`, paddingRight:6,
            }}>
              {scoreData.status}
            </p>

            {/* Score ring */}
            <ScoreRing score={healthScore} ring={tone.ring} soft={tone.soft} />
          </div>

          {/* ── ECG strip — fundo sólido (ecgBg) sem vazamento ── */}
          <div style={{ position:'relative', zIndex:2, padding:'8px 0 0' }}>
            <EcgWave color={tone.ring} ecgBg={tone.ecgBg} />
          </div>

          {/* ── Darker bottom band (detalhe de fundo mais escuro) ── */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:18, zIndex:1,
            background:`linear-gradient(to bottom, transparent, ${tone.darkBase})`,
            pointerEvents:'none',
          }} />

          {/* Spacer so bottom band shows */}
          <div style={{ height:10 }} />
        </button>

        {/* ════════════════════════════════════════════
            PAINEL EXPANDIDO — branco limpo
           ════════════════════════════════════════════ */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height:0, opacity:0 }}
              animate={{ height:'auto', opacity:1 }}
              exit={{ height:0, opacity:0 }}
              transition={{ duration:0.30, ease:'easeOut' }}
              style={{ overflow:'hidden' }}
            >
              <div style={{
                ...NUN, background:'#ffffff',
                borderTop:`3px solid ${tone.accentSolid}`,
                padding:'16px 16px 20px',
                display:'flex', flexDirection:'column', gap:12,
              }}>

                {/* Status text */}
                <div style={{
                  borderRadius:14, padding:'10px 14px',
                  background:tone.tintBg,
                  border:`1px solid ${tone.tintBorder}`,
                  borderLeft:`4px solid ${tone.accentSolid}`,
                }}>
                  <p style={{ ...NUN, fontSize:11, fontWeight:700, color:tone.accentText, lineHeight:1.5 }}>
                    {statusText}
                  </p>
                </div>

                {/* Cards 2×2 */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <DetailCard icon={Scale} label="Peso" accent={tone.accentSolid}
                    value={latestWeight ? `${latestWeight.value} ${latestWeight.unit}` : cat?.weight ? `${cat.weight} kg` : 'Pendente'} />
                  <DetailCard icon={CalendarClock} label="Última consulta" accent={tone.accentSolid}
                    value={latestConsultation ? fmtDate(latestConsultation.date) : 'Sem registro'} />
                  <DetailCard icon={Syringe} label="Vacina" accent={tone.accentSolid}
                    value={latestVaccine ? fmtDate(latestVaccine.date) : 'Sem registro'} />
                  <DetailCard icon={Trophy} label="XPG do gato" accent={tone.accentSolid}
                    value={`Lv ${petLevel} · ${xpg} XPG`} />
                </div>

                {/* Leitura Preditiva */}
                <div style={{
                  borderRadius:16, padding:'12px 14px',
                  background:'#fafafa', border:'1px solid #EBEBEB',
                  display:'flex', flexDirection:'column', gap:12,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <BrainCircuit size={12} style={{ color:tone.accentSolid }} />
                    <span style={{ ...NUN, fontSize:7.5, fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase', color:'#9CA3AF' }}>
                      Leitura Preditiva
                    </span>
                  </div>
                  <ProgressTrack label="Saúde clínica" value={healthScore}
                    colorA={tone.chartA} colorB={tone.chartB}
                    icon={Stethoscope} accent={tone.accentSolid} />
                  <ProgressTrack label="Cuidado e completude" value={careScore}
                    colorA="#86EFAC" colorB="#4ADE80"
                    icon={ShieldCheck} accent={tone.accentSolid} />
                  <ProgressTrack
                    label="Organização preventiva"
                    value={clamp(100 - (scoreData.summary?.pendingAlertsCount || 0) * 15)}
                    colorA="#C4B5FD" colorB="#818CF8"
                    icon={Sparkles} accent={tone.accentSolid} />
                </div>

                {/* Alertas */}
                {scoreData.alerts?.length > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {scoreData.alerts.slice(0, 3).map((alert, i) => {
                      const isDanger  = alert.type === 'danger';
                      const isWarning = alert.type === 'warning';
                      const bg  = isDanger ? '#fff5f5' : isWarning ? '#fffbf0' : '#f9fafb';
                      const brd = isDanger ? '#fecaca' : isWarning ? '#fde68a' : '#e5e7eb';
                      const acc = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : tone.accentSolid;
                      const txt = isDanger ? '#991b1b' : isWarning ? '#92400e' : '#374151';
                      return (
                        <div key={`${alert.key}-${i}`} style={{
                          borderRadius:13, padding:'10px 12px',
                          display:'flex', alignItems:'flex-start', gap:8,
                          background:bg, border:`1px solid ${brd}`, borderLeft:`3px solid ${acc}`,
                        }}>
                          <div style={{ marginTop:1, flexShrink:0 }}>
                            {isDanger  ? <AlertTriangle size={12} style={{ color:acc }} />
                            : isWarning ? <ShieldCheck  size={12} style={{ color:acc }} />
                            :             <Sparkles     size={12} style={{ color:acc }} />}
                          </div>
                          <div>
                            <p style={{ ...NUN, fontSize:10, fontWeight:800, color:txt, lineHeight:1.3 }}>{alert.title}</p>
                            <p style={{ ...NUN, fontSize:9, color:'#6B7280', lineHeight:1.4, marginTop:2 }}>{alert.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    borderRadius:13, padding:'10px 12px',
                    display:'flex', alignItems:'center', gap:8,
                    background:tone.tintBg, border:`1px solid ${tone.tintBorder}`, borderLeft:`3px solid ${tone.accentSolid}`,
                  }}>
                    <CheckCircle2 size={13} style={{ color:tone.accentSolid }} />
                    <p style={{ ...NUN, fontSize:10, fontWeight:700, color:tone.accentText }}>
                      Nenhuma pendência relevante detectada no momento.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════════
          CHEVRON PILL — fora do card, centralizado
          na borda inferior. Formato alongado.
         ════════════════════════════════════════════ */}
      <div style={{
        position:'absolute', bottom:-14, left:'50%',
        transform:'translateX(-50%)',
        zIndex:10,
      }}>
        <motion.button
          onClick={() => setExpanded(v => !v)}
          style={{
            ...NUN,
            display:'flex', alignItems:'center', justifyContent:'center', gap:4,
            padding:'5px 22px',
            background:'rgba(255,255,255,0.18)',
            backdropFilter:'blur(8px)',
            WebkitBackdropFilter:'blur(8px)',
            border:`1.5px solid rgba(255,255,255,0.30)`,
            borderRadius:99,
            cursor:'pointer',
            boxShadow:`0 6px 18px rgba(0,0,0,0.10)`,
          }}
          animate={{ y:[0,3,0], opacity:[0.82,1,0.82] }}
          transition={{ duration:1.5, repeat:Infinity, ease:'easeInOut' }}
          aria-label={expanded ? 'Recolher' : 'Expandir'}
        >
          <ChevronDown size={13} style={{ color:'rgba(255,255,255,0.92)', display:'block' }} />
        </motion.button>
      </div>
    </div>
  );
}

