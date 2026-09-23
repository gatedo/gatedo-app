import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from 'lucide-react';
import api from '../../services/api';
import OfferCard from '../offers/OfferCard';
import useSensory from '../../hooks/useSensory';
import { AuthContext } from '../../context/AuthContext';
import MiniMarkdown from '../../utils/MiniMarkdown';
import BlockRenderer from '../content/BlockRenderer';
import RegistroAvulsoModal from './RegistroAvulsoModal';

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

// ─── Registro por toque (v1.1) ───────────────────────────────────────────────

// perguntas_toque (dia 2) — sim/não por pergunta; "não" revela o se_nao ali mesmo.
function PerguntasToqueBlock({ perguntas, respostas, onToggle }) {
  return (
    <div className="space-y-2.5">
      {perguntas.map((q) => {
        const val = respostas[q.id]; // true | false | undefined
        return (
          <div key={q.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-[13px] font-bold text-gray-800 mb-0.5">{q.pergunta}</p>
            {q.exemplo && <p className="text-[11px] font-medium text-gray-400 mb-2">{q.exemplo}</p>}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onToggle(q.id, true)}
                className="flex-1 py-2 rounded-xl text-[12px] font-black"
                style={val === true ? { background: C.purple, color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
              >
                Sim
              </button>
              <button
                onClick={() => onToggle(q.id, false)}
                className="flex-1 py-2 rounded-xl text-[12px] font-black"
                style={val === false ? { background: C.red, color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
              >
                Não
              </button>
            </div>
            {val === false && q.se_nao && (
              <p className="text-[11px] font-medium mt-2 p-2.5 rounded-xl" style={{ background: '#FFFBEB', color: '#92400E' }}>
                {q.se_nao}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// pergunta_final_toque / pergunta_areia_toque (dias 3, 5, 7) — uma pergunta, botões.
function PerguntaToqueUnica({ pergunta, opcoes, value, onPick, submitting }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <p className="text-[13px] font-bold text-gray-800 mb-3">{pergunta}</p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((op) => (
          <button
            key={op}
            disabled={submitting}
            onClick={() => onPick(op)}
            className="px-4 py-2.5 rounded-full text-[12px] font-black"
            style={value === op ? { background: C.purple, color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}

// habito_diario (dias 4-7) — um toque por dia.
function HabitoDiarioBlock({ habito, checked, onToggle }) {
  return (
    <button
      onClick={() => onToggle(!checked)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left"
    >
      {checked ? <CheckSquare size={20} style={{ color: C.purple }} className="shrink-0" /> : <Square size={20} className="text-gray-300 shrink-0" />}
      <span className="text-[13px] font-bold text-gray-800">{habito.rotulo}</span>
    </button>
  );
}

// escolha_multipla (dia 6) — várias opções; marcar revela a dica daquela opção.
function EscolhaMultiplaBlock({ escolha, respostas, onToggle }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <p className="text-[13px] font-bold text-gray-800 mb-3">{escolha.pergunta}</p>
      <div className="space-y-2">
        {escolha.opcoes.map((op) => {
          const checked = Boolean(respostas[op.id]);
          return (
            <div key={op.id}>
              <button
                onClick={() => onToggle(op.id, !checked)}
                className="w-full flex items-center gap-2.5 bg-gray-50 rounded-xl p-3 text-left"
              >
                {checked ? <CheckSquare size={17} style={{ color: C.purple }} className="shrink-0" /> : <Square size={17} className="text-gray-300 shrink-0" />}
                <span className="text-[12px] font-bold text-gray-700 flex-1">{op.rotulo}</span>
              </button>
              {checked && op.dica && (
                <p className="text-[11px] font-medium mt-1.5 px-3.5 py-2 rounded-xl" style={{ background: '#F1E9FF', color: C.purpleDark }}>
                  {op.dica}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// explicacao + porque recolhidos atrás de "Entender melhor".
function EntenderMelhor({ explicacao, porque, petId }) {
  const [open, setOpen] = useState(false);
  if (!explicacao && !porque) return null;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-1.5 text-[11px] font-black"
        style={{ color: C.purple }}
      >
        <span>Entender melhor</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-1 space-y-3">
              {explicacao && (
                Array.isArray(explicacao)
                  ? <BlockRenderer blocks={explicacao} petId={petId} />
                  : <MiniMarkdown text={explicacao} className="text-[12px] font-medium text-gray-600 leading-relaxed" />
              )}
              {porque && (
                <div className="rounded-[16px] p-3.5" style={{ background: '#F1E9FF' }}>
                  <p className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color: C.purple }}>Por quê</p>
                  <p className="text-[11px] font-medium leading-relaxed" style={{ color: C.purpleDark }}>{porque}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
              {item.detalhe && <p className="text-[11px] font-medium text-gray-400 mt-0.5">{item.detalhe}</p>}
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

// ─── "Como funciona" (bloco apresentacao) — só na primeira vez ──────────────
const APRESENTACAO_EMOJI = { calendario: '📅', relogio: '⏰', toque: '👆', documento: '📄' };

function PresentationScreen({ spec, onDone, onBack, submitting }) {
  const apresentacao = spec.apresentacao;
  return (
    <Screen>
      <Header title={spec.titulo} subtitle={apresentacao?.titulo || 'Como funciona'} onBack={onBack} />
      <div className="px-5">
        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm mb-5 space-y-4">
          {(apresentacao?.passos || []).map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{ background: '#F1E9FF' }}>
                {APRESENTACAO_EMOJI[p.icone] || '✨'}
              </div>
              <p className="text-[13px] font-medium text-gray-700 leading-relaxed pt-1.5">{p.texto}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onDone}
          disabled={submitting}
          className="w-full py-4 rounded-2xl font-black text-white text-sm"
          style={{ background: submitting ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
        >
          {apresentacao?.botao || 'Começar'}
        </button>
      </div>
    </Screen>
  );
}

function EmergencyScreen({ telaUrgencia, catId, navigate, onVoltar, onReconsider, reconsidering }) {
  const handleReconsiderClick = () => {
    if (reconsidering) return;
    const ok = window.confirm('Marcou esse item sem querer? Isso destrava o protocolo de novo, sem cancelar nenhum progresso.');
    if (ok) onReconsider?.();
  };

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
        {onReconsider && (
          <button
            onClick={handleReconsiderClick}
            disabled={reconsidering}
            className="w-full mt-4 pt-4 border-t border-gray-100 text-[11px] font-bold text-gray-400"
          >
            {reconsidering ? 'Reconsiderando...' : 'Marquei sem querer — reconsiderar'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProtocolSpecPlayer({ slug, initialCatId, onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const touch = useSensory();
  const { user } = useContext(AuthContext);

  // Veio de um card de oferta (contexto de dor / slot da home)? Guarda pra
  // registrar a conversão de verdade quando a inscrição acontecer.
  const offerContext = location.state?.offerContext || null;

  const [catId, setCatId] = useState(initialCatId || null);
  const [cats, setCats] = useState([]);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emergencyOverride, setEmergencyOverride] = useState(null); // telaUrgencia via atalho do lembrete
  const [reconsidering, setReconsidering] = useState(false);
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
    // Gato falecido (memorial/arquivado) não recebe protocolo novo — só
    // aparece em listas de memória, com overlay, como já é feito alhures.
    api.get('/pets')
      .then((r) => setCats(Array.isArray(r.data) ? r.data.filter((c) => !c.isMemorial && !c.isArchived) : []))
      .catch(() => {});
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

        // Conversão de verdade — o tutor veio de um card de oferta e agora
        // começou o protocolo mesmo (não só clicou).
        if (offerContext?.offerKey) {
          api.post('/offers/event', {
            surface: offerContext.surface,
            petId: catId,
            offerKey: offerContext.offerKey,
            action: 'CONVERT',
          }).catch(() => {});
        }
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

  // "Marquei errado" — só some da tela de emergência se o tutor confirmar de
  // novo que reconsiderou; não é um botão de dispensar alerta com 1 toque.
  const handleReconsider = async () => {
    touch();
    setReconsidering(true);
    try {
      await api.post(`/content/protocol-spec/${slug}/reconsider`, { enrollmentId: enrollment.id }).catch(() => null);
      setEmergencyOverride(null);
      load();
    } finally {
      setReconsidering(false);
    }
  };

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
          onReconsider={handleReconsider}
          reconsidering={reconsidering}
        />
      </Screen>
    );
  }

  // ── Atalho de emergência disparado a partir de um dia (lembrete_permanente) ──
  if (emergencyOverride) {
    return (
      <Screen>
        <Header title={spec.titulo} subtitle="Emergência" onBack={onBack} />
        <EmergencyScreen
          telaUrgencia={emergencyOverride}
          catId={catId}
          navigate={navigate}
          onVoltar={onBack}
          onReconsider={handleReconsider}
          reconsidering={reconsidering}
        />
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

  // ── "Como funciona" — só na primeira vez, antes da triagem ──────────────────
  if (!enrollment.presentationSeenAt && !enrollment.triageAnswers && spec.apresentacao) {
    const donePresentation = async () => {
      touch();
      setSubmitting(true);
      try {
        await api.post(`/content/protocol-spec/${slug}/presentation-seen`, { enrollmentId: enrollment.id }).catch(() => null);
        load();
      } finally {
        setSubmitting(false);
      }
    };
    return <PresentationScreen spec={spec} onDone={donePresentation} onBack={onBack} submitting={submitting} />;
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
  const [postOffer, setPostOffer] = useState(null);
  const [avulsoOpen, setAvulsoOpen] = useState(false);
  const [comparativo, setComparativo] = useState(null);
  const dayNumber = enrollment.currentDay;
  const dia = (spec.dias || []).find((d) => d.numero === dayNumber);
  const log = enrollment.logs.find((l) => l.dayNumber === dayNumber);
  const unlocked = log ? new Date(log.unlockedAt).getTime() <= Date.now() : false;

  // habito_diario é definido uma vez (dia 4) mas aparece em todo dia dentro
  // da janela a_partir_do_dia..ate_o_dia — inclusive nos dias 5, 6 e 7.
  const habitoAtivo = useMemo(() => {
    const dono = (spec.dias || []).find(
      (d) => d.habito_diario && dayNumber >= d.habito_diario.a_partir_do_dia && dayNumber <= d.habito_diario.ate_o_dia,
    );
    return dono?.habito_diario || null;
  }, [spec, dayNumber]);

  const tarefaFixa = useMemo(() => {
    const opcaoId = enrollment.triageAnswers?.veterinario;
    const blocoVet = (spec.triagem?.blocos || []).find((b) => b.id === 'veterinario');
    const opcao = (blocoVet?.opcoes || []).find((o) => o.id === opcaoId);
    return opcao?.consequencia === 'seguir_com_tarefa_fixa' ? opcao.tarefa_fixa : null;
  }, [spec, enrollment.triageAnswers]);

  useEffect(() => {
    if (!dia?.mostra_comparativo) return;
    api.get(`/content/protocol-spec/${slug}/comparativo`, { params: { enrollmentId: enrollment.id } })
      .then((r) => setComparativo(r.data))
      .catch(() => {});
  }, [dia?.mostra_comparativo, enrollment.id, slug]);

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

  const submitDayAnswer = async (fieldId, value) => {
    touch();
    setSubmitting(true);
    try {
      await api.post(`/content/protocol-spec/${slug}/day-answer`, { enrollmentId: enrollment.id, dayNumber, fieldId, value });
      onReload();
    } finally {
      setSubmitting(false);
    }
  };

  const completeDay = async () => {
    touch('success');
    setSubmitting(true);
    try {
      await api.post(`/content/protocol-spec/${slug}/complete-day`, { enrollmentId: enrollment.id, dayNumber });
      onReload();

      // Pós-sucesso — dia concluído: card leve, nunca modal, se o módulo
      // único de decisão devolver alguma coisa pra esse contexto.
      api.get('/offers/decide', { params: { surface: 'POST_SUCCESS', petId: enrollment.petId, trigger: 'protocol_day' } })
        .then((r) => { if (r.data?.offer) setPostOffer(r.data.offer); })
        .catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  const checklist = log?.checklist || {};
  const entriesToday = log?.entries || [];
  const resp = entriesToday[0]?.data || {};

  return (
    <Screen>
      <Header
        title={dia.titulo_curto || dia.titulo}
        subtitle={`Dia ${dayNumber} de ${spec.duracao_dias}${dia.tempo_estimado ? ` · ${dia.tempo_estimado}` : ''}`}
        onBack={onBack}
      />
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

        {/* Ação do dia — a única coisa que precisa ser lida */}
        <div className="rounded-[24px] p-5" style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
          <p className="text-[10px] font-black uppercase tracking-wide text-white/70 mb-1.5">O que fazer hoje</p>
          <p className="text-[16px] font-black text-white leading-snug">{dia.acao_do_dia || dia.tarefa}</p>
        </div>

        {/* Registro por toque do dia */}
        {dia.usa_registro_avulso && (
          <p className="text-[12px] font-medium text-gray-500 px-1">
            Quando acontecer, toque em "{spec.registro_avulso?.nome || 'Aconteceu de novo'}" abaixo.
          </p>
        )}

        {dia.perguntas_toque && (
          <PerguntasToqueBlock perguntas={dia.perguntas_toque} respostas={checklist} onToggle={toggleChecklistItem} />
        )}

        {dia.pergunta_final_toque && (
          <PerguntaToqueUnica
            pergunta={dia.pergunta_final_toque.pergunta}
            opcoes={dia.pergunta_final_toque.opcoes}
            value={resp[dia.pergunta_final_toque.id]}
            onPick={(op) => submitDayAnswer(dia.pergunta_final_toque.id, op)}
            submitting={submitting}
          />
        )}

        {dia.pergunta_areia_toque && (
          <PerguntaToqueUnica
            pergunta={dia.pergunta_areia_toque.pergunta}
            opcoes={dia.pergunta_areia_toque.opcoes}
            value={resp[dia.pergunta_areia_toque.id]}
            onPick={(op) => submitDayAnswer(dia.pergunta_areia_toque.id, op)}
            submitting={submitting}
          />
        )}

        {dia.escolha_multipla && (
          <EscolhaMultiplaBlock escolha={dia.escolha_multipla} respostas={checklist} onToggle={toggleChecklistItem} />
        )}

        {habitoAtivo && (
          <HabitoDiarioBlock
            habito={habitoAtivo}
            checked={Boolean(resp[habitoAtivo.id])}
            onToggle={(v) => submitDayAnswer(habitoAtivo.id, v)}
          />
        )}

        {dia.dica_fixa && (
          <div className="rounded-[18px] p-3.5" style={{ background: '#ECFDF5' }}>
            <p className="text-[11px] font-medium leading-relaxed" style={{ color: '#065F46' }}>{dia.dica_fixa}</p>
          </div>
        )}

        {dia.mostra_comparativo && (
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">Comparativo da semana</p>
            {comparativo ? (
              <p className="text-[13px] font-bold text-gray-800 leading-relaxed">
                {(dia.comparativo_texto || '')
                  .replace('{ocorrencias_inicio}', comparativo.ocorrenciasInicio)
                  .replace('{ocorrencias_fim}', comparativo.ocorrenciasFim)}
              </p>
            ) : (
              <p className="text-[12px] font-medium text-gray-400">Carregando...</p>
            )}
          </div>
        )}

        {/* "Aconteceu de novo" — disponível em qualquer dia dos 7 */}
        <button
          onClick={() => { touch(); setAvulsoOpen(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[12px]"
          style={{ background: '#FEF2F2', color: C.red }}
        >
          <PlusCircle size={15} /> {spec.registro_avulso?.nome || 'Aconteceu de novo'}
        </button>

        <EntenderMelhor explicacao={dia.explicacao} porque={dia.porque} petId={enrollment.petId} />

        <button
          onClick={completeDay}
          disabled={submitting || Boolean(log?.completedAt)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm"
          style={{ background: log?.completedAt ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
        >
          <CheckCircle2 size={18} /> {log?.completedAt ? 'Dia concluído' : (dia.concluir || 'Pronto por hoje')}
        </button>

        {postOffer && (
          <OfferCard
            offer={postOffer}
            surface="POST_SUCCESS"
            petId={enrollment.petId}
            onDismiss={() => setPostOffer(null)}
          />
        )}

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

      <AnimatePresence>
        {avulsoOpen && (
          <RegistroAvulsoModal
            spec={spec}
            slug={slug}
            enrollmentId={enrollment.id}
            onClose={() => setAvulsoOpen(false)}
            onSaved={onReload}
          />
        )}
      </AnimatePresence>
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
    // "mapa_ocorrencias" (v1.0) e "ocorrencias_por_dia"/"ocorrencias_por_lugar" (v1.1) cobrem o mesmo bloco.
    if (sections.includes('mapa_ocorrencias') || sections.includes('ocorrencias_por_dia') || sections.includes('ocorrencias_por_lugar')) {
      line('Ocorrências na semana', 12, true);
      line(`Início (dias 1-2): ${closing.comparativo.ocorrenciasInicio} ocorrência(s)`);
      line(`Fim (dias 6-7): ${closing.comparativo.ocorrenciasFim} ocorrência(s)`);
      if (closing.comparativo.locaisRepetidos.length) line(`Locais repetidos: ${closing.comparativo.locaisRepetidos.join(', ')}`);
      y += 6;
    }
    // "mudancas_por_dia" (v1.0) e "o_que_foi_ajustado" (v1.1).
    if (sections.includes('mudancas_por_dia') || sections.includes('o_que_foi_ajustado')) {
      line('Mudanças por dia', 12, true);
      closing.logs.forEach((l) => {
        (l.entries || []).forEach((e) => {
          const resumo = Object.entries(e.data).filter(([k]) => k !== '__marco' && k !== 'tipo').map(([k, v]) => `${k}: ${v}`).join(', ');
          if (resumo) line(`Dia ${l.dayNumber} — ${resumo}`, 9);
        });
      });
      y += 6;
    }
    if (sections.includes('areia_preferida')) {
      const areia = closing.logs.flatMap((l) => l.entries || []).find((e) => e.data?.areia_vencedora)?.data?.areia_vencedora;
      line('Areia preferida', 12, true);
      line(areia || 'Não respondido');
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
              <p className="text-2xl font-black text-gray-800">{closing.comparativo.ocorrenciasInicio}</p>
              <p className="text-[10px] font-bold text-gray-400">início</p>
            </div>
            {closing.comparativo.ocorrenciasFim < closing.comparativo.ocorrenciasInicio ? (
              <TrendingDown size={22} className="text-emerald-500" />
            ) : closing.comparativo.ocorrenciasFim > closing.comparativo.ocorrenciasInicio ? (
              <TrendingUp size={22} className="text-red-500" />
            ) : (
              <Minus size={22} className="text-gray-400" />
            )}
            <div className="text-center">
              <p className="text-2xl font-black text-gray-800">{closing.comparativo.ocorrenciasFim}</p>
              <p className="text-[10px] font-bold text-gray-400">fim</p>
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
