import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Clock,
  CheckCircle2,
  CheckSquare,
  Square,
  AlertOctagon,
  ShieldAlert,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Download,
} from 'lucide-react';
import api from '../../services/api';
import useSensory from '../../hooks/useSensory';
import { AuthContext } from '../../context/AuthContext';
import MiniMarkdown from '../../utils/MiniMarkdown';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', bg: '#F4F3FF', green: '#10B981', red: '#DC2626', amber: '#F59E0B' };

function Screen({ children }) {
  return <div className="min-h-screen pb-32" style={{ background: C.bg }}>{children}</div>;
}

function Header({ title, subtitle, onBack }) {
  return (
    <div className="px-5 pt-8 pb-4">
      <button
        onClick={onBack}
        className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm mb-4"
        style={{ color: C.purple }}
      >
        <ArrowLeft size={18} />
      </button>
      {subtitle && <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 mb-1">{subtitle}</p>}
      <h1 className="text-xl font-black text-gray-900 leading-tight">{title}</h1>
    </div>
  );
}

function CatPicker({ cats, onSelect }) {
  return (
    <div className="px-5 space-y-2">
      <p className="text-[12px] font-bold text-gray-500 mb-2">Para qual gato é este protocolo?</p>
      {cats.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat)}
          className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm"
        >
          <img src={cat.photoUrl || '/placeholder-cat.png'} className="w-10 h-10 rounded-xl object-cover" />
          <span className="text-[13px] font-black text-gray-800">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Campo dinâmico do registro ──────────────────────────────────────────────
function CampoInput({ campo, value, onChange }) {
  const base = 'w-full text-[13px] font-medium bg-gray-50 rounded-xl px-3 py-2.5 outline-none';

  if (campo.tipo === 'texto') {
    return (
      <input
        type="text"
        value={value || ''}
        placeholder={campo.placeholder || ''}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      />
    );
  }
  if (campo.tipo === 'texto_longo') {
    return (
      <textarea
        rows={3}
        value={value || ''}
        placeholder={campo.placeholder || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} resize-none`}
      />
    );
  }
  if (campo.tipo === 'numero') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className={base}
      />
    );
  }
  if (campo.tipo === 'hora') {
    return <input type="time" value={value || ''} onChange={(e) => onChange(e.target.value)} className={base} />;
  }
  if (campo.tipo === 'booleano') {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="w-full flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5"
      >
        {value ? <CheckSquare size={18} style={{ color: C.purple }} /> : <Square size={18} className="text-gray-300" />}
        <span className="text-[13px] font-bold text-gray-700">{value ? 'Sim' : 'Não'}</span>
      </button>
    );
  }
  if (campo.tipo === 'enum') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {(campo.opcoes || []).map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => onChange(op)}
            className="px-3 py-1.5 rounded-full text-[11px] font-black"
            style={value === op ? { background: C.purple, color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
          >
            {op}
          </button>
        ))}
      </div>
    );
  }
  return null;
}

function RegistroForm({ registro, onSubmit, submitting }) {
  const [values, setValues] = useState({});
  const setField = (id, v) => setValues((prev) => ({ ...prev, [id]: v }));

  const handleSubmit = () => {
    onSubmit(values);
    if (registro.repetivel) setValues({});
  };

  return (
    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1">Registro</p>
      <p className="text-[12px] font-medium text-gray-500 mb-3">{registro.instrucao}</p>
      <div className="space-y-3 mb-4">
        {(registro.campos || []).map((campo) => (
          <div key={campo.id}>
            <p className="text-[11px] font-bold text-gray-600 mb-1.5">{campo.rotulo}</p>
            <CampoInput campo={campo} value={values[campo.id]} onChange={(v) => setField(campo.id, v)} />
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-2xl font-black text-white text-[13px]"
        style={{ background: submitting ? '#9ca3af' : C.purple }}
      >
        {registro.repetivel ? 'Adicionar registro' : 'Salvar'}
      </button>
    </div>
  );
}

// ─── Modal de emergência (triagem + atalho do lembrete_permanente) ──────────
function EmergencyChecklist({ itens, onConfirmNone, onFlagged, submitting }) {
  const [marcados, setMarcados] = useState([]);
  const toggle = (id) => setMarcados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
      <p className="text-[13px] font-black text-gray-800 mb-3">Algum destes está acontecendo agora?</p>
      <div className="space-y-2 mb-4">
        {itens.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle(item.id)}
            className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-2xl border"
            style={{ borderColor: '#FECACA', background: '#FEF2F2' }}
          >
            {marcados.includes(item.id) ? (
              <CheckSquare size={18} style={{ color: C.red }} className="shrink-0 mt-0.5" />
            ) : (
              <Square size={18} className="text-gray-300 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-[13px] font-bold text-gray-800">{item.rotulo}</p>
              <p className="text-[11px] font-medium text-gray-400 mt-0.5">{item.detalhe}</p>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => (marcados.length > 0 ? onFlagged(marcados) : onConfirmNone())}
        disabled={submitting}
        className="w-full py-3.5 rounded-2xl font-black text-white text-sm"
        style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
      >
        Continuar
      </button>
    </div>
  );
}

function EmergencyScreen({ telaUrgencia, catId, navigate, onVoltar }) {
  return (
    <div className="px-5">
      <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: C.red }}>
          <AlertOctagon size={26} className="text-white" />
        </div>
        <p className="text-[16px] font-black text-gray-900 mb-2">{telaUrgencia?.titulo}</p>
        <p className="text-[13px] font-medium text-gray-500 leading-relaxed whitespace-pre-line mb-5">{telaUrgencia?.corpo}</p>
        <div className="flex flex-col gap-2">
          {(telaUrgencia?.acoes || []).map((acao) => (
            <button
              key={acao.id}
              onClick={() => {
                if (acao.destino === 'registro_rapido_consulta' && catId) {
                  navigate(`/cat/${catId}/health-new?type=consultation`);
                } else {
                  onVoltar();
                }
              }}
              className="w-full py-3.5 rounded-2xl font-black text-sm"
              style={
                acao.id === 'registrar_consulta'
                  ? { background: C.red, color: '#fff' }
                  : { background: '#F3F4F6', color: '#6B7280' }
              }
            >
              {acao.rotulo}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProtocolSpecPlayer({ slug, initialCatId, onBack }) {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);

  const [catId, setCatId] = useState(initialCatId || null);
  const [cats, setCats] = useState([]);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emergencyOverride, setEmergencyOverride] = useState(null); // telaUrgencia via atalho do lembrete
  const [closing, setClosing] = useState(null);

  const load = () => {
    if (!catId) return;
    setLoading(true);
    api
      .get(`/content/protocol-spec/${slug}`, { params: { userId: user?.id, petId: catId } })
      .then((r) => setState(r.data))
      .catch(() => setState(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [slug, catId, user?.id]); // eslint-disable-line

  useEffect(() => {
    if (catId) return;
    api.get('/pets').then((r) => setCats(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [catId]);

  useEffect(() => {
    if (state?.enrollment?.status === 'CONCLUIDO') {
      api
        .get(`/content/protocol-spec/${slug}/closing`, { params: { enrollmentId: state.enrollment.id } })
        .then((r) => setClosing(r.data))
        .catch(() => {});
    }
  }, [state?.enrollment?.status, state?.enrollment?.id, slug]);

  if (!catId) {
    return (
      <Screen>
        <Header title="Protocolo" subtitle="Passo a passo" onBack={onBack} />
        <CatPicker cats={cats} onSelect={(cat) => setCatId(cat.id)} />
      </Screen>
    );
  }

  if (loading || !state) {
    return <Screen><p className="text-center text-[12px] font-medium text-gray-400 py-16">Carregando...</p></Screen>;
  }

  const { protocol, locked, preview, spec, enrollment } = state;

  // ── Trancado: apresentação + botão de compra externa ──────────────────────
  if (locked) {
    const priceLabel = preview?.preco_centavos ? `R$ ${(preview.preco_centavos / 100).toFixed(2).replace('.', ',')}` : null;
    const checkoutUrl = preview?.produto_externo_id && preview.produto_externo_id !== 'DEFINIR_ID_KIWIFY'
      ? `https://pay.kiwify.com.br/${preview.produto_externo_id}`
      : null;
    return (
      <Screen>
        <Header title={preview?.titulo || protocol.title} subtitle="Passo a passo" onBack={onBack} />
        <div className="px-5">
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-center">
            <Lock size={28} className="mx-auto mb-3 text-gray-300" />
            {preview?.subtitulo && <p className="text-[13px] font-bold text-gray-500 mb-2">{preview.subtitulo}</p>}
            <p className="text-[13px] font-medium text-gray-600 leading-relaxed mb-4">{preview?.promessa}</p>
            {priceLabel && <p className="text-2xl font-black text-gray-900 mb-4">{priceLabel}</p>}
            <button
              onClick={() => { touch(); if (checkoutUrl) window.open(checkoutUrl, '_blank'); }}
              disabled={!checkoutUrl}
              className="w-full px-5 py-3.5 rounded-2xl font-black text-white text-sm"
              style={{ background: checkoutUrl ? `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` : '#9ca3af' }}
            >
              {checkoutUrl ? 'Comprar acesso' : 'Em breve'}
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  // ── Sem inscrição ativa: introdução ────────────────────────────────────────
  if (!enrollment) {
    const start = async () => {
      touch();
      setSubmitting(true);
      try {
        await api.post(`/content/protocol-spec/${slug}/start`, { userId: user.id, petId: catId });
        load();
      } finally {
        setSubmitting(false);
      }
    };
    return (
      <Screen>
        <Header title={spec.titulo} subtitle={spec.subtitulo} onBack={onBack} />
        <div className="px-5">
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm mb-4">
            <p className="text-[13px] font-medium text-gray-600 leading-relaxed mb-3">{spec.abertura}</p>
            <p className="text-[11px] font-bold text-gray-400">{spec.escopo_nota}</p>
          </div>
          <button
            onClick={start}
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-black text-white text-sm"
            style={{ background: submitting ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
          >
            {submitting ? 'Iniciando...' : 'Começar'}
          </button>
        </div>
      </Screen>
    );
  }

  // ── Interrompido por emergência ────────────────────────────────────────────
  if (enrollment.status === 'INTERROMPIDO_EMERGENCIA' && !emergencyOverride) {
    const blocoEmergencia = (spec.triagem?.blocos || []).find((b) => b.id === 'emergencia');
    return (
      <Screen>
        <Header title={spec.titulo} subtitle="Interrompido por segurança" onBack={onBack} />
        <EmergencyScreen
          telaUrgencia={blocoEmergencia?.tela_urgencia}
          catId={catId}
          navigate={navigate}
          onVoltar={onBack}
        />
      </Screen>
    );
  }

  // ── Atalho de emergência disparado a partir de um dia (lembrete_permanente) ──
  if (emergencyOverride) {
    return (
      <Screen>
        <Header title={spec.titulo} subtitle="Emergência" onBack={onBack} />
        <EmergencyScreen telaUrgencia={emergencyOverride} catId={catId} navigate={navigate} onVoltar={onBack} />
      </Screen>
    );
  }

  const triggerEmergency = async () => {
    touch();
    const res = await api.post(`/content/protocol-spec/${slug}/interrupt`, { enrollmentId: enrollment.id }).catch(() => null);
    if (res?.data?.telaUrgencia) setEmergencyOverride(res.data.telaUrgencia);
  };

  // ── Concluído: fechamento ───────────────────────────────────────────────────
  if (enrollment.status === 'CONCLUIDO') {
    if (!closing) return <Screen><p className="text-center text-[12px] font-medium text-gray-400 py-16">Carregando fechamento...</p></Screen>;
    return (
      <ClosingScreen
        spec={spec}
        closing={closing}
        catId={catId}
        navigate={navigate}
        onBack={onBack}
        touch={touch}
      />
    );
  }

  // ── Triagem ainda não respondida ────────────────────────────────────────────
  if (!enrollment.triageAnswers) {
    return (
      <TriageFlow
        spec={spec}
        submitting={submitting}
        setSubmitting={setSubmitting}
        onInterrupted={(telaUrgencia) => setEmergencyOverride(telaUrgencia)}
        onDone={load}
        enrollmentId={enrollment.id}
        slug={slug}
        onBack={onBack}
      />
    );
  }

  // ── Dia atual ───────────────────────────────────────────────────────────────
  return (
    <DayFlow
      spec={spec}
      enrollment={enrollment}
      slug={slug}
      onReload={load}
      onBack={onBack}
      onTriggerEmergency={triggerEmergency}
      touch={touch}
    />
  );
}

// ─── Fluxo de triagem (2 blocos) ─────────────────────────────────────────────
function TriageFlow({ spec, enrollmentId, slug, onInterrupted, onDone, submitting, setSubmitting, onBack }) {
  const [step, setStep] = useState('emergencia'); // emergencia -> veterinario
  const blocoEmergencia = (spec.triagem?.blocos || []).find((b) => b.id === 'emergencia');
  const blocoVet = (spec.triagem?.blocos || []).find((b) => b.id === 'veterinario');

  const submit = async (emergenciaMarcados, veterinarioOpcaoId) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/content/protocol-spec/${slug}/triage`, {
        enrollmentId,
        emergenciaMarcados,
        veterinarioOpcaoId,
      });
      if (res.data.interrupted) onInterrupted(res.data.telaUrgencia);
      else onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title={spec.triagem?.titulo || 'Antes de começar'} subtitle="Triagem" onBack={onBack} />
      <div className="px-5">
        {step === 'emergencia' && (
          <EmergencyChecklist
            itens={blocoEmergencia?.itens || []}
            submitting={submitting}
            onConfirmNone={() => setStep('veterinario')}
            onFlagged={(marcados) => submit(marcados, null)}
          />
        )}
        {step === 'veterinario' && (
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[13px] font-black text-gray-800 mb-3">{blocoVet?.pergunta}</p>
            <div className="space-y-2">
              {(blocoVet?.opcoes || []).map((op) => (
                <button
                  key={op.id}
                  disabled={submitting}
                  onClick={() => submit([], op.id)}
                  className="w-full text-left px-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50"
                >
                  <p className="text-[13px] font-bold text-gray-800">{op.rotulo}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}

// ─── Fluxo do dia (checklist + registro + hábitos herdados) ─────────────────
function DayFlow({ spec, enrollment, slug, onReload, onBack, onTriggerEmergency, touch }) {
  const [submitting, setSubmitting] = useState(false);
  const dayNumber = enrollment.currentDay;
  const dia = (spec.dias || []).find((d) => d.numero === dayNumber);
  const log = enrollment.logs.find((l) => l.dayNumber === dayNumber);
  const unlocked = log ? new Date(log.unlockedAt).getTime() <= Date.now() : false;

  // Hábitos herdados: dias anteriores com vira_habito_diario aparecem também aqui.
  const habitosHerdados = (spec.dias || []).filter(
    (d) => d.numero < dayNumber && d.registro?.vira_habito_diario,
  );

  const tarefaFixa = useMemo(() => {
    const opcaoId = enrollment.triageAnswers?.veterinario;
    const blocoVet = (spec.triagem?.blocos || []).find((b) => b.id === 'veterinario');
    const opcao = (blocoVet?.opcoes || []).find((o) => o.id === opcaoId);
    return opcao?.consequencia === 'seguir_com_tarefa_fixa' ? opcao.tarefa_fixa : null;
  }, [spec, enrollment.triageAnswers]);

  if (!dia) {
    return (
      <Screen>
        <Header title={spec.titulo} onBack={onBack} />
        <p className="text-center text-[12px] font-medium text-gray-400 py-10">Dia não encontrado.</p>
      </Screen>
    );
  }

  if (!unlocked) {
    const advance = async () => {
      touch();
      await api.post(`/content/protocol-spec/${slug}/advance`, { enrollmentId: enrollment.id }).catch(() => {});
      onReload();
    };
    const unlockDate = new Date(log.unlockedAt);
    return (
      <Screen>
        <Header title={spec.titulo} subtitle={`Dia ${dayNumber}`} onBack={onBack} />
        <div className="px-5">
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-center">
            <Clock size={26} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[14px] font-black text-gray-800 mb-1.5">Este dia abre em breve</p>
            <p className="text-[12px] font-medium text-gray-500 mb-4">
              Libera em {unlockDate.toLocaleDateString('pt-BR')}.
            </p>
            <button onClick={advance} className="px-5 py-3 rounded-2xl font-black text-[13px]" style={{ background: '#F4F3FF', color: C.purple }}>
              Adiantar e abrir agora
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  const toggleChecklistItem = async (itemId, checked) => {
    touch();
    await api.post(`/content/protocol-spec/${slug}/checklist`, { enrollmentId: enrollment.id, dayNumber, itemId, checked });
    onReload();
  };

  const submitRegistro = async (values) => {
    setSubmitting(true);
    try {
      await api.post(`/content/protocol-spec/${slug}/registro`, { enrollmentId: enrollment.id, dayNumber, data: values });
      onReload();
    } finally {
      setSubmitting(false);
    }
  };

  const submitHabito = async (_habitoDia, values) => {
    // O hábito herdado é salvo como parte do registro do dia atual.
    await api.post(`/content/protocol-spec/${slug}/registro`, { enrollmentId: enrollment.id, dayNumber, data: values });
    onReload();
  };

  const completeDay = async () => {
    touch('success');
    setSubmitting(true);
    try {
      await api.post(`/content/protocol-spec/${slug}/complete-day`, { enrollmentId: enrollment.id, dayNumber });
      onReload();
    } finally {
      setSubmitting(false);
    }
  };

  const checklist = log?.checklist || {};
  const entriesToday = log?.entries || [];

  return (
    <Screen>
      <Header title={dia.titulo} subtitle={`Dia ${dayNumber} de ${spec.duracao_dias}`} onBack={onBack} />
      <div className="px-5 space-y-3">
        {tarefaFixa && !enrollment.fixedTaskDone && (
          <div className="rounded-[20px] p-4 flex items-start gap-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <ShieldAlert size={16} className="shrink-0 mt-0.5" style={{ color: C.amber }} />
            <div className="flex-1">
              <p className="text-[12px] font-black text-gray-800">{tarefaFixa.titulo}</p>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">{tarefaFixa.descricao}</p>
              <button
                onClick={async () => {
                  await api.post(`/content/protocol-spec/${slug}/fixed-task/complete`, { enrollmentId: enrollment.id });
                  onReload();
                }}
                className="mt-2 text-[11px] font-black"
                style={{ color: C.purple }}
              >
                Marcar como feita
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Tarefa de hoje</p>
          <p className="text-[14px] font-black text-gray-800 mb-3">{dia.tarefa}</p>
          <MiniMarkdown text={dia.corpo} className="text-[13px] font-medium text-gray-600 leading-relaxed" />
        </div>

        {dia.porque && (
          <div className="rounded-[20px] p-4" style={{ background: '#F1E9FF' }}>
            <p className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color: C.purple }}>Por quê</p>
            <p className="text-[12px] font-medium leading-relaxed" style={{ color: C.purpleDark }}>{dia.porque}</p>
          </div>
        )}

        {dia.checklist?.length > 0 && (
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">Checklist</p>
            <div className="space-y-1.5">
              {dia.checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id, !checklist[item.id])}
                  className="w-full flex items-center gap-2.5 text-left py-1.5"
                >
                  {checklist[item.id] ? (
                    <CheckSquare size={18} style={{ color: C.purple }} className="shrink-0" />
                  ) : (
                    <Square size={18} className="text-gray-300 shrink-0" />
                  )}
                  <span className="text-[12px] font-bold text-gray-700">{item.rotulo}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {dia.registro && <RegistroForm registro={dia.registro} onSubmit={submitRegistro} submitting={submitting} />}

        {entriesToday.length > 0 && dia.registro?.repetivel && (
          <div className="bg-white rounded-[20px] p-4 border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">
              Registrado hoje ({entriesToday.length})
            </p>
            <div className="space-y-1.5">
              {entriesToday.map((e) => (
                <p key={e.id} className="text-[11px] font-medium text-gray-500">
                  {Object.entries(e.data)
                    .filter(([k]) => k !== '__marco')
                    .map(([, v]) => v)
                    .join(' · ')}
                </p>
              ))}
            </div>
          </div>
        )}

        {habitosHerdados.length > 0 && (
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">Hábito diário</p>
            {habitosHerdados.map((h) => (
              <RegistroForm key={h.numero} registro={h.registro} onSubmit={(v) => submitHabito(h, v)} submitting={submitting} />
            ))}
          </div>
        )}

        <button
          onClick={completeDay}
          disabled={submitting || Boolean(log?.completedAt)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm"
          style={{ background: log?.completedAt ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
        >
          <CheckCircle2 size={18} /> {log?.completedAt ? 'Dia concluído' : 'Marcar dia como feito'}
        </button>

        {spec.lembrete_permanente && (
          <button
            onClick={onTriggerEmergency}
            className="w-full text-left rounded-[18px] p-3.5 flex items-center gap-2.5"
            style={{ background: '#FEF2F2' }}
          >
            <AlertOctagon size={16} style={{ color: C.red }} className="shrink-0" />
            <span className="text-[11px] font-bold text-gray-600 flex-1">{spec.lembrete_permanente.texto}</span>
          </button>
        )}
      </div>
    </Screen>
  );
}

// ─── Fechamento ───────────────────────────────────────────────────────────────
function ClosingScreen({ spec, closing, catId, navigate, onBack, touch }) {
  const goToConsultation = () => catId && navigate(`/cat/${catId}/health-new?type=consultation`);

  const exportPdf = async () => {
    touch();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 44;
    let y = 56;
    const line = (text, size = 10, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const parts = doc.splitTextToSize(String(text || ''), 500);
      parts.forEach((p) => { doc.text(p, margin, y); y += size + 6; });
    };

    line((closing.geraPdf?.titulo || 'Relatório do protocolo').replace('{nome_do_gato}', closing.pet?.name || ''), 16, true);
    y += 8;

    const sections = closing.geraPdf?.conteudo || [];
    if (sections.includes('respostas_triagem')) {
      line('Triagem', 12, true);
      line(`Veterinário já avaliou: ${closing.triageAnswers?.veterinario || '-'}`);
      y += 6;
    }
    if (sections.includes('mapa_ocorrencias')) {
      line('Mapa de ocorrências', 12, true);
      line(`Dia 1: ${closing.comparativo.dia1} ocorrência(s)`);
      line(`Dias seguintes: ${closing.comparativo.ultimosDias} ocorrência(s)`);
      if (closing.comparativo.locaisRepetidos.length) line(`Locais repetidos: ${closing.comparativo.locaisRepetidos.join(', ')}`);
      y += 6;
    }
    if (sections.includes('mudancas_por_dia')) {
      line('Mudanças por dia', 12, true);
      closing.logs.forEach((l) => {
        (l.entries || []).forEach((e) => {
          const resumo = Object.entries(e.data).filter(([k]) => k !== '__marco').map(([k, v]) => `${k}: ${v}`).join(', ');
          line(`Dia ${l.dayNumber} — ${resumo}`, 9);
        });
      });
      y += 6;
    }
    if (sections.includes('curva_peso_periodo')) {
      line('Peso no período', 12, true);
      line(`Peso atual registrado: ${closing.pet?.weight ? `${closing.pet.weight} kg` : 'sem registro'}`);
      y += 6;
    }
    if (sections.includes('aviso_global')) {
      line(closing.avisoGlobal || spec.aviso_global || '', 8);
    }

    doc.save(`protocolo-${spec.id || 'relatorio'}.pdf`);
  };

  return (
    <Screen>
      <Header title={closing.titulo || 'Fechamento'} subtitle={spec.titulo} onBack={onBack} />
      <div className="px-5 space-y-3">
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-3">Início x fim</p>
          <div className="flex items-center justify-between mb-2">
            <div className="text-center">
              <p className="text-2xl font-black text-gray-800">{closing.comparativo.dia1}</p>
              <p className="text-[10px] font-bold text-gray-400">dia 1</p>
            </div>
            {closing.comparativo.ultimosDias < closing.comparativo.dia1 ? (
              <TrendingDown size={22} className="text-emerald-500" />
            ) : closing.comparativo.ultimosDias > closing.comparativo.dia1 ? (
              <TrendingUp size={22} className="text-red-500" />
            ) : (
              <Minus size={22} className="text-gray-400" />
            )}
            <div className="text-center">
              <p className="text-2xl font-black text-gray-800">{closing.comparativo.ultimosDias}</p>
              <p className="text-[10px] font-bold text-gray-400">dias seguintes</p>
            </div>
          </div>
          {closing.comparativo.locaisRepetidos.length > 0 && (
            <p className="text-[11px] font-medium text-gray-500">
              Locais que se repetiram: {closing.comparativo.locaisRepetidos.join(', ')}
            </p>
          )}
        </div>

        {closing.cenario && (
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[14px] font-black text-gray-800 mb-1.5">{closing.cenario.titulo}</p>
            <MiniMarkdown text={closing.cenario.corpo} className="text-[12px] font-medium text-gray-600 leading-relaxed" />
          </div>
        )}

        <button onClick={exportPdf} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-[13px]" style={{ background: '#F4F3FF', color: C.purple }}>
          <Download size={16} /> Baixar PDF do relatório
        </button>

        {closing.cenario?.id === 'igual' && (
          <button
            onClick={goToConsultation}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm"
            style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
          >
            <Stethoscope size={18} /> Registrar consulta com este histórico
          </button>
        )}

        {closing.upsell && (
          <div className="rounded-[20px] p-4 flex items-start gap-2.5" style={{ background: '#FFF7ED' }}>
            <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: '#F97316' }} />
            <p className="text-[11px] font-medium text-gray-600 leading-relaxed">{closing.upsell.texto}</p>
          </div>
        )}
      </div>
    </Screen>
  );
}
