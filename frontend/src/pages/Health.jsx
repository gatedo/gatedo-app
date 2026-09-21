import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon, Scale, Stethoscope, Syringe, Bug, CalendarClock,
  Download, HeartPulse,
} from 'lucide-react';
import api from '../services/api';
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
            <span className="text-[11px] font-black">{cat.name}</span>
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
        <DetailCard icon={Stethoscope} label="Última consulta" value={latestConsultation ? formatDate(new Date(latestConsultation.date)) : 'Sem registro'} />
        <DetailCard icon={CalendarClock} label="Próximo preventivo" value={nextPreventive ? formatDate(new Date(nextPreventive.nextDueDate)) : 'Sem previsão'} />
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
                {r.latest ? `Aplicado em ${formatDate(new Date(r.latest.date))}` : 'Sem registro'}
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
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  let y = 56;

  const line = (text, size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const parts = doc.splitTextToSize(String(text || ''), 500);
    parts.forEach((p) => {
      if (y > 780) { doc.addPage(); y = 56; }
      doc.text(p, margin, y);
      y += size + 6;
    });
  };

  line(`Relatório de saúde — ${cat.name}`, 16, true);
  line(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 9);
  y += 8;

  line('Score de saúde', 12, true);
  line(`${status.score}/100 · ${status.label}`);
  y += 6;

  line('Peso', 12, true);
  if (weightSeries.length >= 2) {
    const d = formatWeightDelta(weightSeries);
    line(`Peso atual: ${weightSeries[weightSeries.length - 1].weight} kg (${d.deltaLabel} em ${d.periodLabel})`);
  } else if (cat.weight) {
    line(`Peso atual: ${cat.weight} kg (histórico insuficiente para variação)`);
  } else {
    line('Sem pesagens registradas.');
  }
  y += 6;

  line('Marcos recentes', 12, true);
  if (marcos.length === 0) {
    line('Nenhum marco registrado.');
  } else {
    marcos.slice(0, 15).forEach((m) => line(`${formatDate(m.date)} — ${m.text}`, 9));
  }
  y += 6;

  line('Leitura de padrão', 12, true);
  if (alerts.length === 0) {
    line('Nenhum padrão fora do esperado nas pesagens registradas.');
  } else {
    alerts.forEach((a) => line(`${a.message} (${a.rule})`, 9));
    line('Isso não é diagnóstico — vale comentar com o veterinário.', 8);
  }
  y += 6;

  line('Cobertura preventiva', 12, true);
  coverageRows.forEach((r) => {
    line(`${r.label}: ${r.latest ? `aplicado em ${formatDate(new Date(r.latest.date))}` : 'sem registro'} — ${r.status.label}`, 9);
  });

  doc.save(`saude-${(cat.name || 'gato').toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal — Saúde
// ─────────────────────────────────────────────────────────────────────────────
export default function Health() {
  const navigate = useNavigate();
  const touch = useSensory();

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

        <h1 className="text-xl font-black text-gray-800 tracking-tighter">Saúde</h1>

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
                          className="mt-3 px-4 py-2 rounded-2xl font-black text-[11px] text-white"
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

      {/* 8 — PDF, fixo no rodapé, acima do ícone central da bottom nav */}
      {selectedCat && !loadingDetail && (
        <div className="fixed bottom-[122px] left-0 right-0 px-4 z-40 pointer-events-none">
          <div className="max-w-[560px] mx-auto pointer-events-auto">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handlePdf}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-[12px] uppercase tracking-wide shadow-lg"
              style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', color: '#fff', boxShadow: '0 8px 22px rgba(22,163,74,0.4)' }}
            >
              <Download size={16} /> Gerar PDF para o veterinário
            </motion.button>
          </div>
        </div>
      )}

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
