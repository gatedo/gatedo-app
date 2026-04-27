import React, { useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { ChevronDown, RefreshCcw, Palette, UserRound } from 'lucide-react';
import { calculateAgeParts, formatCatAge, formatDateOnlyBR, getCatLifeStage } from '../../../utils/catAge';

const NUNITO_STACK = "'Nunito', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const THEME_MAP = {
  violet: { primary: '#823fff', secondary: '#e7ff60', surface: '#ffffff', line: '#e7eef7', ink: '#0F172A', soft: '#E0E7FF' },
  purple: { primary: '#a352ff', secondary: '#F97316', surface: '#FAF5FF', line: '#DDD6FE', ink: '#1F2937', soft: '#F3E8FF' },
  indigo: { primary: '#3B82F6', secondary: '#FBBF24', surface: '#EFF6FF', line: '#BFDBFE', ink: '#111827', soft: '#DBEAFE' },
  emerald: { primary: '#059669', secondary: '#F59E0B', surface: '#ECFDF5', line: '#A7F3D0', ink: '#064E3B', soft: '#D1FAE5' },
  rose: { primary: '#E11D48', secondary: '#F59E0B', surface: '#FFF1F2', line: '#FDA4AF', ink: '#4C0519', soft: '#FFE4E6' },
  slate: { primary: '#475569', secondary: '#F59E0B', surface: '#F8FAFC', line: '#CBD5E1', ink: '#0F172A', soft: '#E2E8F0' },
  amber: { primary: '#CA8A04', secondary: '#2563EB', surface: '#FFFBEB', line: '#FDE68A', ink: '#422006', soft: '#FEF3C7' },
  sky: { primary: '#0284C7', secondary: '#F59E0B', surface: '#F0F9FF', line: '#BAE6FD', ink: '#082F49', soft: '#E0F2FE' },
};

function resolveTheme(themeColor) {
  if (!themeColor) return THEME_MAP.violet;
  if (THEME_MAP[themeColor]) return THEME_MAP[themeColor];
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(themeColor)) {
    return { primary: themeColor, secondary: '#F59E0B', surface: '#FFFFFF', line: '#E5E7EB', ink: '#111827', soft: '#F3F4F6' };
  }
  return THEME_MAP.violet;
}

function formatGender(value) {
  const v = String(value || '').toLowerCase();
  if (['female', 'fêmea', 'femea', 'feminino'].includes(v)) return 'Fêmea';
  if (['male', 'macho', 'masculino'].includes(v)) return 'Macho';
  return 'Não informado';
}

function getDisplayBreed(cat) {
  const breed = String(cat?.breed || '').trim();
  if (!breed || breed.toLowerCase() === 'srd') return cat?.coatType ? `SRD · ${cat.coatType}` : 'SRD';
  return breed;
}

function formatDate(value) {
  if (!value) return 'Não informado';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return value;
  }
}

function getAgeLabel(cat) {
  const age = formatCatAge(cat, { fallback: '' });
  const stage = getCatLifeStage(cat);
  if (age && stage) return `${age} · ${stage}`;
  if (age) return age;
  return cat?.ageLabel || cat?.age || cat?.ageText || 'Não informado';
}

function getIdentityAgeLabel(cat) {
  const parts = calculateAgeParts(cat);
  const age = parts ? `${parts.years}.${parts.months} A` : formatCatAge(cat, { fallback: '' });
  const birth = cat?.birthDate ? formatDateOnlyBR(cat.birthDate, { fallback: '' }) : '';
  if (birth && age) return `${birth} · ${age}`;
  return age || cat?.ageLabel || cat?.age || cat?.ageText || 'NÃ£o informado';
}

function getNeuteredLabel(value) {
  return value ? 'Sim' : 'NÃ£o informado';
}

function getPhoto(cat) {
  return cat?.avatarUrl || cat?.avatar || cat?.avatarPreview || cat?.photoUrl || cat?.imageUrl || null;
}

function getProfileUrl(cat) {
  if (!cat?.id) return '';
  if (typeof window === 'undefined') return `/gato/${cat.id}`;
  return `${window.location.origin}/gato/${cat.id}`;
}

function Badge({ children, tone }) {
  return (
    <span
      className="inline-flex items-center rounded-full whitespace-nowrap px-2.5 py-1 text-[9px] font-black uppercase tracking-[1.3px]"
      style={{ background: tone, color: '#0F172A' }}
    >
      {children}
    </span>
  );
}

function FrontDecor({ theme }) {
  return (
    <div
      className="absolute left-0 top-0 h-full w-[28px] overflow-hidden rounded-l-[24px]"
      style={{ background: theme.primary }}
    >
      <img
        src="/assets/App_gatedo_logo.svg"
        alt=""
        aria-hidden="true"
        className="absolute select-none pointer-events-none max-w-none"
        style={{
          height: '410px',
          width: '410px',
          top: '50%',
          left: '-146px',
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  );
}

function BackDecor({ theme }) {
  return (
    <>
      <div className="absolute inset-x-0 top-0 h-[26px]" style={{ background: theme.primary }} />
    </>
  );
}

function FelineIDFace({ cat, tutor, theme, side = 'front' }) {
  const photo = getPhoto(cat);
  const qrValue = getProfileUrl(cat);
  const owner = tutor?.name || cat?.owner?.name || 'Tutor responsável';
  const contact = tutor?.phone || tutor?.whatsapp || cat?.owner?.phone || cat?.owner?.whatsapp || 'Não informado';
  const microchip = cat?.microchip || 'Não informado';
  const city = cat?.city || cat?.originCity || cat?.cityOfOrigin || 'Não informado';
  const idLabel = `GTD-${String(cat?.id || '').slice(0, 8).toUpperCase()}`;

  if (side === 'front') {
    return (
      <div className="relative h-full overflow-hidden rounded-[24px] border shadow-[0_18px_40px_rgba(15,23,42,0.16)]" style={{ background: theme.surface, borderColor: theme.line }}>
        <FrontDecor theme={theme} />
        <div className="relative z-10 flex h-full flex-col px-4 pt-4 pb-5" style={{ fontFamily: NUNITO_STACK }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pl-5">
              <p className="text-[8px] font-black uppercase tracking-[1.8px]" style={{ color: theme.primary }}>Identidade Animal GATEDO</p>
              <h3 className="mt-1 text-[18px] font-extrabold leading-none" style={{ color: theme.ink }}>Carteira Felina</h3>
              <p className="mt-1 text-[10px] font-bold text-slate-500">Documento oficial perfil GATEDO</p>
            </div>
            <img src="/assets/App_gatedo_logo.svg" alt="GATEDO" className="h-16 w-16 rounded-full" />
          </div>

          <div className="mt-3 grid flex-1 grid-cols-[98px_1fr] gap-3 pl-5 pb-2">
            <div className="flex flex-col gap-2">
              <div className="h-[122px] overflow-hidden rounded-[16px] border bg-white shadow-sm" style={{ borderColor: theme.line }}>
                {photo ? (
                  <img src={photo} alt={cat?.name || 'Gato'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400"><UserRound size={34} /></div>
                )}
              </div>
              <div className="flex items-center justify-center">
                <Badge tone={theme.soft}>{idLabel}</Badge>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-1.5 self-start pt-0.5">
              <div className="col-span-2">
                <p className="text-[9px] font-black uppercase tracking-[1.4px] text-slate-400">Nome do animal</p>
                <p className="mt-0.5 text-[18px] font-extrabold leading-none" style={{ color: theme.ink }}>{cat?.name || 'Sem nome'}</p>
              </div>
              <Info label="Registro" value={idLabel} noWrap />
              <Info label="Microchip" value={microchip} />
              <Info label="Especie - Raca" value={`Felina / ${getDisplayBreed(cat)}`} />
              <Info label="Sexo" value={formatGender(cat?.gender)} />
              <Info label="Pelagem" value={cat?.coatType || 'Não informado'} />
              <Info label="Nasc. / Idade Aprox." value={getIdentityAgeLabel(cat)} />
              <Info label="Castrado(a)" value={getNeuteredLabel(cat?.neutered)} />
              <Info label="Naturalidade" value={city} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-[24px] border shadow-[0_18px_40px_rgba(15,23,42,0.16)]" style={{ background: '#FFFEFB', borderColor: theme.line }}>
      <BackDecor theme={theme} />
      <div className="relative z-10 flex h-full flex-col px-4 pt-4 pb-5" style={{ fontFamily: NUNITO_STACK }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[1.8px]" style={{ color: theme.primary }}>Verso · Perfil social e responsável</p>
            <p className="mt-1 text-[11px] font-bold text-slate-500">QR real do perfil social do gato no GATEDO.</p>
          </div>
          <img src="/assets/App_gatedo_logo.svg" alt="GATEDO" className="h-12 w-12 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-black/5" />
        </div>

        <div className="mt-3 grid flex-1 grid-cols-[108px_1fr] gap-4 pb-2">
          <div className="rounded-[18px] bg-white p-2.5 shadow-sm ring-1 ring-slate-100">
            {qrValue ? <QRCode value={qrValue} size={92} bgColor="transparent" fgColor="#111827" /> : null}
            <p className="mt-2 text-center text-[8px] font-black uppercase tracking-[1.3px] text-slate-400">Perfil social</p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 self-start pt-0.5">
            <div className="col-span-2">
              <p className="text-[8px] font-black uppercase tracking-[1.2px] text-slate-400">Responsável legal / cuidador</p>
              <p className="mt-0.5 text-[15px] font-extrabold leading-tight" style={{ color: theme.ink }}>{owner}</p>
            </div>
            <Info label="Contato" value={contact} />
            <Info label="Cidade" value={city} />
            <Info label="Emissão" value={formatDate(cat?.createdAt || cat?.birthDate || new Date())} />
            <Info label="Chegada" value={cat?.arrivalType || 'Não informado'} />
            <Info label="Habitat" value={cat?.habitat || 'Não informado'} />
            <Info label="Moradia" value={cat?.housingType || 'Não informado'} />
            <div className="col-span-2">
              <p className="text-[9px] font-black uppercase tracking-[1.4px] text-slate-400">Observações</p>
              <p className="mt-0.5 text-[11px] font-bold leading-snug text-slate-600">Apelidos: {cat?.nicknames || cat?.cuteNicknames || 'Não informado'} · Castrado: {cat?.neutered ? 'Sim' : 'Não informado'}.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, noWrap = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[8px] font-black uppercase tracking-[1.2px] text-slate-400">{label}</p>
      <p className={`mt-0.5 text-[11px] font-extrabold leading-[1.15] text-slate-700 ${noWrap ? 'whitespace-nowrap' : 'break-words'}`}>{value || 'Não informado'}</p>
    </div>
  );
}

export default function FelineID({ cat, tutor }) {
  const [flipped, setFlipped] = useState(false);
  const [showEditHint, setShowEditHint] = useState(false);
  const theme = useMemo(() => resolveTheme(cat?.themeColor), [cat?.themeColor]);

  if (!cat) return null;

  return (
    <div className="w-full" style={{ fontFamily: NUNITO_STACK }}>
      <div className="mx-auto w-full max-w-[430px]">
        <div className="[perspective:1600px]">
          <button
            type="button"
            onClick={() => setFlipped((s) => !s)}
            className="group relative block h-[300px] w-full rounded-[24px] text-left outline-none"
            aria-label={flipped ? 'Ver frente da carteira felina' : 'Ver verso da carteira felina'}
          >
            <div className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]" style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              <div className="absolute inset-0 [backface-visibility:hidden]">
                <FelineIDFace cat={cat} tutor={tutor} theme={theme} side="front" />
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <FelineIDFace cat={cat} tutor={tutor} theme={theme} side="back" />
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 pt-3">
          <button
            type="button"
            onClick={() => setFlipped((s) => !s)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-extrabold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
          >
            <RefreshCcw size={14} />
            <span>{flipped ? 'Ver frente' : 'Ver verso'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowEditHint((s) => !s)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-extrabold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
          >
            <Palette size={14} />
            <span>Editar tema</span>
            <ChevronDown size={14} className={`transition ${showEditHint ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showEditHint ? (
          <div className="mx-auto mt-3 max-w-[400px] rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-[1.5px] text-slate-400">Coleção GATEDO</p>
            <p className="mt-1 text-[13px] font-semibold leading-relaxed text-slate-600">
              Aqui entra o seletor dos seus 6 temas colecionáveis. Estrutura pronta, sem poluir a Bio agora.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
