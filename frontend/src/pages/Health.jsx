import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon, Scale, Stethoscope, Syringe, Bug, CalendarClock,
  Download, HeartPulse,
} from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import useSensory from '../hooks/useSensory';
import useEmergencyCheck from '../hooks/useEmergencyCheck';
import EmergencyCheckModal from '../components/ProfileModules/EmergencyCheckModal';
import EmergencyCatPicker from '../components/EmergencyCatPicker';
import { getCatHealthStatus } from '../utils/catHealthStatus';
import { extractWeightSeries, computeWeightAlerts } from '../utils/weightAlerts';
import { daysUntil, getPreventiveStatus } from '../utils/preventiveStatus';
import {
  WeightChart, MarcosBlock, PatternBlock, QuickWeightModal,
  buildMarcos, formatWeightDelta, formatDate,
} from '../components/ProfileModules/ProfileSections/TimelineModule';
import UpcomingCareBlock from '../components/UpcomingCareBlock';
import { track } from '../utils/track';
import { formatRecordDate } from '../utils/dates';
import { PLATFORM, createBrandedPdf, deliverPdf, formatPetLine, vetShareUrl } from '../utils/reportDocument';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', green: '#10B981', amber: '#F59E0B', red: '#EF4444' };

// ─────────────────────────────────────────────────────────────────────────────
// 2 — Semáforo geral: uma linha por gato
// ─────────────────────────────────────────────────────────────────────────────
function StatusRow({ cat, selected, onSelect }) {
  const status = getCatHealthStatus(cat);
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 bg-white rounded-[18px] px-3.5 py-3 text-left transition-all"
      style={{ border: selected ? `2px solid ${status.tone}` : '1px solid #F3F4F6' }}
    >
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${status.tone}40` }}>
        {cat.photoUrl
          ? <img src={cat.photoUrl} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: `${C.purple}10` }}>🐱</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black text-gray-800 truncate">{cat.name}</p>
        <p className="text-[10px] font-bold text-gray-400">Score {status.score}/100</p>
      </div>
      <span
        className="shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide"
        style={{ background: `${status.tone}16`, color: status.tone }}
      >
        {status.label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 — Chips do seletor de gato
// ─────────────────────────────────────────────────────────────────────────────
function CatChips({ cats, selectedId, onSelect }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {cats.map((cat) => {
        const active = cat.id === selectedId;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex items-center gap-2 shrink-0 pl-1.5 pr-3.5 py-1.5 rounded-full transition-all"
            style={active
              ? { background: C.purple, color: '#fff' }
              : { background: '#F4F3FF', color: C.purple }}
          >
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ border: '2px solid rgba(255,255,255,0.6)' }}>
              {cat.photoUrl
                ? <img src={cat.photoUrl} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-xs bg-white">🐱</div>}
            </div>
            <span className="text-[12px] font-black">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 — Cartão do gato: score, peso + variação, última consulta, próximo preventivo
// ─────────────────────────────────────────────────────────────────────────────
function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[16px] bg-gray-50 border border-gray-100 px-3.5 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} style={{ color: C.purple }} />
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <p className="text-[13px] font-black text-gray-800 leading-snug">{value}</p>
    </div>
  );
}

function CatSummaryCard({ cat, weightSeries }) {
  const status = getCatHealthStatus(cat);

  const weightValue = weightSeries.length >= 2
    ? `${weightSeries[weightSeries.length - 1].weight} kg`
    : cat.weight ? `${cat.weight} kg` : 'Sem registro';

  const weightDeltaLabel = weightSeries.length >= 2
    ? (() => { const d = formatWeightDelta(weightSeries); return `${d.deltaLabel} em ${d.periodLabel}`; })()
    : '—';

  const records = cat.healthRecords || [];
  const latestConsultation = records
    .filter((r) => r.type === 'CONSULTATION' || r.type === 'IACONSULT')
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

  const nextPreventive = records
    .filter((r) => ['VACCINE', 'VERMIFUGE', 'PARASITE'].includes(r.type) && r.nextDueDate)
    .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0] || null;

  return (
    <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF]">{cat.name}</p>
        <span className="px-3 py-1 rounded-full text-[10px] font-black" style={{ background: `${status.tone}16`, color: status.tone }}>
          Score {status.score}/100 · {status.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <DetailCard icon={Scale} label="Peso atual" value={weightValue} />
        <DetailCard icon={Scale} label="Variação" value={weightDeltaLabel} />
        <DetailCard icon={Stethoscope} label="Última consulta" value={latestConsultation ? formatRecordDate(latestConsultation.date) : 'Sem registro'} />
        <DetailCard icon={CalendarClock} label="Próximo preventivo" value={nextPreventive ? formatRecordDate(nextPreventive.nextDueDate) : 'Sem previsão'} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7 — Cobertura preventiva: vacina, vermífugo, antipulgas
// ─────────────────────────────────────────────────────────────────────────────
const COVERAGE_TYPES = [
  { type: 'VACCINE',   label: 'Vacina',     icon: Syringe },
  { type: 'VERMIFUGE', label: 'Vermífugo',  icon: Bug },
  { type: 'PARASITE',  label: 'Antipulgas', icon: Bug },
];

function CoverageBlock({ cat }) {
  const records = cat.healthRecords || [];

  const rows = COVERAGE_TYPES.map((c) => {
    const latest = records
      .filter((r) => r.type === c.type)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
    const days = latest ? daysUntil(latest.nextDueDate) : null;
    const status = getPreventiveStatus(days);
    return { ...c, latest, status };
  });

  return (
    <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF] mb-3">Cobertura preventiva</p>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.type} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${C.purple}10` }}>
              <r.icon size={16} style={{ color: C.purple }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-700">{r.label}</p>
              <p className="text-[10px] font-bold text-gray-400">
                {r.latest ? `Aplicado em ${formatRecordDate(r.latest.date)}` : 'Sem registro'}
              </p>
            </div>
            <span
              className="shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black"
              style={{ background: r.status.bg, color: r.status.color, border: `1px solid ${r.status.border}` }}
            >
              {r.status.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8 — Gerar PDF para o veterinário
// ─────────────────────────────────────────────────────────────────────────────
async function generateVetPdf({ cat, status, weightSeries, marcos, alerts, coverageRows }) {
  // Se o tutor já tem link ativo da Pasta do Vet, o QR leva direto pra ela.
  let qr = { url: PLATFORM.siteUrl, caption: PLATFORM.site };
  try {
    const { data } = await api.get(`/vet-share/pet/${cat.id}`);
    if (data?.link?.token) qr = { url: vetShareUrl(data.link.token), caption: 'Escaneie para abrir a Pasta do Vet' };
  } catch { /* sem link: QR vai pro site */ }

  const pdf = await createBrandedPdf({
    qrUrl: qr.url,
    qrCaption: qr.caption,
    footerNote: 'Resumo gerado a partir dos registros do tutor no Gatedo. Não substitui avaliação veterinária.',
  });

  const tone = status.score >= 75 ? 'green' : status.score >= 50 ? 'amber' : 'red';
  pdf.title({
    text: `Relatório de saúde`,
    subtitle: `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
    badge: { label: `Score ${status.score}/100 · ${status.label}`, tone },
  });

  pdf.section('Paciente');
  pdf.text(cat.name, { size: 12, color: '#111827', bold: true });
  pdf.text(formatPetLine(cat));

  pdf.section('Peso');
  if (weightSeries.length >= 2) {
    const d = formatWeightDelta(weightSeries);
    pdf.rows([
      ['Peso atual', `${weightSeries[weightSeries.length - 1].weight} kg`],
      ['Variação', `${d.deltaLabel} em ${d.periodLabel}`],
      ['Pesagens', String(weightSeries.length)],
    ]);
  } else {
    pdf.text(cat.weight ? `Peso atual: ${cat.weight} kg (histórico insuficiente para variação)` : 'Sem pesagens registradas.');
  }

  pdf.section('Cobertura preventiva');
  pdf.rows(coverageRows.map((r) => [
    r.label,
    `${r.latest ? `aplicado em ${formatRecordDate(r.latest.date)}` : 'sem registro'} · ${r.status.label}`,
  ]));

  pdf.section('Leitura de padrão');
  if (alerts.length === 0) {
    pdf.text('Nenhum padrão fora do esperado nas pesagens registradas.');
  } else {
    alerts.forEach((a) => pdf.text(`- ${a.message} (${a.rule})`));
    pdf.text('Isso não é diagnóstico — vale comentar com o veterinário.', { size: 8.5, color: '#9CA3AF' });
  }

  pdf.section('Marcos recentes');
  if (marcos.length === 0) {
    pdf.text('Nenhum marco registrado.');
  } else {
    pdf.rows(marcos.slice(0, 20).map((m) => [formatDate(m.date), m.text]), { labelWidth: 90 });
  }

  const slug = (cat.name || 'gato').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  await deliverPdf(pdf.finish(), `relatorio-saude-${slug}.pdf`, { title: `Relatório de saúde — ${cat.name}` });
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal — Saúde
// ─────────────────────────────────────────────────────────────────────────────
export default function Health() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);

  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [quickWeightOpen, setQuickWeightOpen] = useState(false);

  const emergency = useEmergencyCheck({ navigate, touch });

  useEffect(() => {
    api.get('/pets').then((r) => {
      const active = (r.data || []).filter((c) => !c.isMemorial && !c.isArchived);
      setCats(active);
      if (active.length > 0) setSelectedCatId(active[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get('src');
    if (src === 'push_reminder' || src === 'email_reminder') {
      track('reminder_opened', { channel: src === 'push_reminder' ? 'push' : 'email' });
    }
  }, []);

  const loadDetail = useCallback(() => {
    if (!selectedCatId) return;
    setLoadingDetail(true);
    return api.get(`/pets/${selectedCatId}`)
      .then((r) => setSelectedCat(r.data))
      .finally(() => setLoadingDetail(false));
  }, [selectedCatId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const weightSeries = useMemo(() => extractWeightSeries(selectedCat?.healthRecords), [selectedCat]);
  const marcos = useMemo(
    () => buildMarcos(selectedCat?.healthRecords, weightSeries, selectedCat?.protocolEnrollments),
    [selectedCat, weightSeries],
  );
  const alerts = useMemo(() => computeWeightAlerts(weightSeries), [weightSeries]);
  const coverageRows = useMemo(() => {
    if (!selectedCat) return [];
    const records = selectedCat.healthRecords || [];
    return COVERAGE_TYPES.map((c) => {
      const latest = records.filter((r) => r.type === c.type).sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
      const days = latest ? daysUntil(latest.nextDueDate) : null;
      return { ...c, latest, status: getPreventiveStatus(days) };
    });
  }, [selectedCat]);

  const openTab = (tab) => {
    if (!selectedCat) return;
    navigate(`/cat/${selectedCat.id}`, { state: { restoreTab: tab } });
  };

  const handlePdf = () => {
    if (!selectedCat) return;
    touch();
    const status = getCatHealthStatus(selectedCat);
    generateVetPdf({ cat: selectedCat, status, weightSeries, marcos, alerts, coverageRows });

    // Nada aparece aqui (regra dura: nunca oferta/doação na aba Saúde) — só
    // arma uma notificação chamando pro Perfil, onde o bloco de apoio mora.
    if (user?.id) api.post(`/users/${user.id}/donation/pdf-generated`).catch(() => {});
  };

  if (!loading && cats.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--gatedo-light-bg)' }}>
        <HeartPulse size={28} style={{ color: C.purple }} className="mb-3" />
        <p className="text-[13px] font-black text-gray-700 mb-1">Cadastre um gato pra ver a saúde dele aqui</p>
        <button onClick={() => navigate('/cat-new')} className="mt-3 px-5 py-2.5 rounded-2xl font-black text-xs text-white" style={{ background: C.purple }}>
          Cadastrar gato
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--gatedo-light-bg)' }}>
      <div className="px-4 pt-6 space-y-4 max-w-[560px] mx-auto">

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-black text-gray-800 tracking-tighter">Saúde</h1>

          {/* 8 — PDF pro veterinário, no topo */}
          {selectedCat && !loadingDetail && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handlePdf}
              className="w-1/2 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-black text-[12px] uppercase tracking-wide shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', color: '#fff', boxShadow: '0 8px 22px rgba(22,163,74,0.4)' }}
            >
              <Download size={14} /> PDF pro vet
            </motion.button>
          )}
        </div>

        {/* 1 — Emergência, fixo no topo */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => emergency.trigger(selectedCatId)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-white text-[12px] uppercase tracking-wide"
          style={{ background: '#DC2626', boxShadow: '0 6px 20px rgba(220,38,38,0.35)' }}
        >
          <AlertOctagon size={16} /> Meu gato está estranho agora
        </motion.button>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-16 rounded-[18px] bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* 2 — Semáforo geral */}
            <div className="space-y-2">
              {cats.map((cat) => (
                <StatusRow
                  key={cat.id}
                  cat={cat}
                  selected={cat.id === selectedCatId}
                  onSelect={() => setSelectedCatId(cat.id)}
                />
              ))}
            </div>

            {/* 3 — Chips do seletor */}
            {cats.length > 1 && (
              <CatChips cats={cats} selectedId={selectedCatId} onSelect={setSelectedCatId} />
            )}

            {loadingDetail || !selectedCat ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-[28px] bg-gray-100 animate-pulse" />)}
              </div>
            ) : (
              <>
                {/* 4 — Cartão do gato */}
                <CatSummaryCard cat={selectedCat} weightSeries={weightSeries} />

                <UpcomingCareBlock catId={selectedCat.id} onWeightFeito={() => setQuickWeightOpen(true)} />

                {/* 5 — Linha do tempo */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF] mb-2 px-1">Linha do tempo</p>
                  <div className="space-y-3">
                    {weightSeries.length < 2 ? (
                      <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm text-center">
                        <Scale size={24} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-[12px] font-medium text-gray-400">
                          {weightSeries.length === 0 ? 'Ainda não há pesagens' : 'Só uma pesagem registrada'} — pese de novo em 15 dias pra curva aparecer.
                        </p>
                        <button
                          onClick={() => { touch(); setQuickWeightOpen(true); }}
                          className="mt-3 px-4 py-2 rounded-2xl font-black text-[12px] text-white"
                          style={{ background: C.purple }}
                        >
                          Registrar peso agora
                        </button>
                      </div>
                    ) : (
                      <WeightChart series={weightSeries} />
                    )}
                    <MarcosBlock marcos={marcos} onOpenTab={openTab} />
                  </div>
                </div>

                {/* 6 — Alertas preditivos */}
                <PatternBlock alerts={alerts} />

                {/* 7 — Cobertura preventiva */}
                <CoverageBlock cat={selectedCat} />
              </>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {quickWeightOpen && selectedCat && (
          <QuickWeightModal
            cat={selectedCat}
            onClose={() => setQuickWeightOpen(false)}
            onSaved={loadDetail}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {emergency.open && (
          <EmergencyCheckModal cat={emergency.cat} navigate={navigate} onClose={emergency.close} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {emergency.pickerOpen && (
          <EmergencyCatPicker cats={emergency.pickerCats} onPick={emergency.pickCat} onClose={emergency.closePicker} />
        )}
      </AnimatePresence>
    </div>
  );
}
