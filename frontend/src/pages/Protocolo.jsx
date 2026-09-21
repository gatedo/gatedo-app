import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Clock,
  CheckCircle2,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import ProtocolSpecPlayer from '../components/protocol/ProtocolSpecPlayer';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6', bg: '#F4F3FF', green: '#10B981', red: '#EF4444' };

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

// ─── Seletor simples de gato (quando não veio de um painel de gato) ────────
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

export default function Protocolo() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const touch = useSensory();
  const { user } = useContext(AuthContext);

  const [catId, setCatId] = useState(location.state?.catId || null);
  const [cats, setCats] = useState([]);
  const [protocol, setProtocol] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [severity, setSeverity] = useState(5);
  const [resolved, setResolved] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Carrega o protocolo
  useEffect(() => {
    api
      .get(`/content/protocols/${slug}`, { params: { userId: user?.id } })
      .then((r) => setProtocol(r.data))
      .catch(() => setProtocol(null))
      .finally(() => setLoading(false));
  }, [slug, user?.id]);

  // Se não veio com gato, busca a lista pra escolher — gato falecido
  // (memorial/arquivado) não recebe protocolo novo.
  useEffect(() => {
    if (catId) return;
    api.get('/pets')
      .then((r) => setCats(Array.isArray(r.data) ? r.data.filter((c) => !c.isMemorial && !c.isArchived) : []))
      .catch(() => {});
  }, [catId]);

  // Verifica se já existe uma inscrição ativa deste protocolo pra este gato
  useEffect(() => {
    if (!catId || !protocol?.id || !user?.id) return;
    api
      .get('/content/protocols/enrollments/mine', { params: { userId: user.id, petId: catId } })
      .then((r) => {
        const match = (r.data || []).find((e) => e.protocolId === protocol.id && e.status === 'EM_ANDAMENTO');
        if (match) loadEnrollment(match.id);
      })
      .catch(() => {});
  }, [catId, protocol?.id, user?.id]);

  const loadEnrollment = (id) => {
    api.get(`/content/protocols/enrollments/${id}`).then((r) => setEnrollment(r.data)).catch(() => {});
  };

  const startProtocol = async () => {
    if (!catId || !user?.id) return;
    touch();
    setSubmitting(true);
    try {
      const res = await api.post(`/content/protocols/${slug}/enroll`, { userId: user.id, petId: catId });
      setEnrollment(res.data);
    } catch (err) {
      alert(err?.response?.data?.message || 'Não foi possível iniciar o protocolo.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitDay = async () => {
    if (!enrollment) return;
    touch('success');
    setSubmitting(true);
    try {
      const isClosing = enrollment.currentStep?.kind === 'CLOSING';
      const res = await api.post(`/content/protocols/enrollments/${enrollment.id}/complete-day`, {
        note: note.trim() || null,
        severityScore: enrollment.currentStep?.asksRating ? severity : null,
        ...(isClosing ? { resolved } : {}),
      });
      setEnrollment(res.data);
      setNote('');
    } catch (err) {
      alert(err?.response?.data?.message || 'Não foi possível salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  const advanceDay = async () => {
    if (!enrollment) return;
    touch();
    const res = await api.post(`/content/protocols/enrollments/${enrollment.id}/advance`).catch(() => null);
    if (res) setEnrollment(res.data);
  };

  const exportSummary = () => {
    if (!enrollment) return;
    const lines = [
      `Protocolo: ${protocol.title}`,
      `Gato: ${enrollment.pet?.name || ''}`,
      `Início: ${new Date(enrollment.startedAt).toLocaleDateString('pt-BR')}`,
      '',
      ...enrollment.logs
        .filter((l) => l.completedAt)
        .map((l) => `Dia ${l.dayNumber}${l.severityScore != null ? ` (gravidade ${l.severityScore}/10)` : ''}: ${l.note || '(sem observação)'}`),
    ];
    if (enrollment.comparison) {
      lines.push('', `Comparativo: início ${enrollment.comparison.before}/10 → fim ${enrollment.comparison.after}/10`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `protocolo-${protocol.slug}-${enrollment.pet?.name || 'gato'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const goToConsultation = () => {
    if (!catId) return;
    navigate(`/cat/${catId}/health-new?type=consultation`);
  };

  if (loading) {
    return <Screen><p className="text-center text-[12px] font-medium text-gray-400 py-16">Carregando...</p></Screen>;
  }

  if (!protocol) {
    return (
      <Screen>
        <Header title="Protocolo não encontrado" onBack={() => navigate('/protocolos')} />
      </Screen>
    );
  }

  // Protocolo "rico" (com spec: triagem, dias com registro tipado, fechamento
  // com cenários) usa um motor totalmente à parte — este aqui só despacha.
  if (protocol.isRich) {
    return <ProtocolSpecPlayer slug={slug} initialCatId={catId} onBack={() => navigate(-1)} />;
  }

  if (protocol.locked) {
    return (
      <Screen>
        <Header title={protocol.title} subtitle="Passo a passo" onBack={() => navigate(-1)} />
        <div className="px-5">
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-center">
            <Lock size={28} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[14px] font-black text-gray-800 mb-1.5">Protocolo exclusivo Founder/Pro</p>
            <p className="text-[12px] font-medium text-gray-500 leading-relaxed mb-4">
              Programas guiados como este fazem parte de quem já apoiou o Gatedo.
            </p>
            <button
              onClick={() => navigate('/clube')}
              className="px-5 py-3 rounded-2xl font-black text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
            >
              Ver meu selo
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  if (!catId) {
    return (
      <Screen>
        <Header title={protocol.title} subtitle="Passo a passo" onBack={() => navigate(-1)} />
        <CatPicker cats={cats} onSelect={(cat) => setCatId(cat.id)} />
      </Screen>
    );
  }

  // ── Ainda não inscrito: tela de introdução ──────────────────────────────
  if (!enrollment) {
    return (
      <Screen>
        <Header title={protocol.title} subtitle="Passo a passo" onBack={() => navigate(-1)} />
        <div className="px-5">
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm mb-4">
            <p className="text-[13px] font-medium text-gray-600 leading-relaxed mb-3">{protocol.summary}</p>
            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">
              {protocol.totalDays} dias · triagem inicial + fechamento
            </p>
          </div>
          <button
            onClick={startProtocol}
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-black text-white text-sm"
            style={{ background: submitting ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
          >
            {submitting ? 'Iniciando...' : 'Começar protocolo'}
          </button>
        </div>
      </Screen>
    );
  }

  // ── Protocolo concluído: fechamento ──────────────────────────────────────
  if (enrollment.status === 'CONCLUIDO') {
    const comp = enrollment.comparison;
    return (
      <Screen>
        <Header title="Protocolo concluído" subtitle={protocol.title} onBack={() => navigate('/protocolos')} />
        <div className="px-5 space-y-3">
          {comp && (
            <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-3">Início x fim</p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-800">{comp.before}</p>
                  <p className="text-[10px] font-bold text-gray-400">início</p>
                </div>
                {comp.after < comp.before ? (
                  <TrendingDown size={22} className="text-emerald-500" />
                ) : comp.after > comp.before ? (
                  <TrendingUp size={22} className="text-red-500" />
                ) : (
                  <Minus size={22} className="text-gray-400" />
                )}
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-800">{comp.after}</p>
                  <p className="text-[10px] font-bold text-gray-400">fim</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[13px] font-black text-gray-800 mb-1">
              {enrollment.resolved ? 'Resolvido 🎉' : 'Ainda não resolveu'}
            </p>
            {!enrollment.resolved && (
              <p className="text-[12px] font-medium text-gray-500 leading-relaxed">
                Vale levar esse histórico numa consulta presencial.
              </p>
            )}
          </div>

          <button onClick={exportSummary} className="w-full py-3.5 rounded-2xl font-black text-[13px]" style={{ background: '#F4F3FF', color: C.purple }}>
            Baixar resumo do protocolo
          </button>

          {!enrollment.resolved && (
            <button
              onClick={goToConsultation}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
            >
              <Stethoscope size={18} /> Registrar consulta com este histórico
            </button>
          )}
        </div>
      </Screen>
    );
  }

  // ── Dia aguardando abrir ────────────────────────────────────────────────
  if (!enrollment.currentUnlocked) {
    const unlockDate = new Date(enrollment.currentLog?.unlockedAt);
    return (
      <Screen>
        <Header title={protocol.title} subtitle={`Dia ${enrollment.currentDay}`} onBack={() => navigate('/protocolos')} />
        <div className="px-5">
          <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm text-center">
            <Clock size={28} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[14px] font-black text-gray-800 mb-1.5">Este dia abre em breve</p>
            <p className="text-[12px] font-medium text-gray-500 mb-4">
              Libera em {unlockDate.toLocaleDateString('pt-BR')} às {unlockDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
            </p>
            <button onClick={advanceDay} className="px-5 py-3 rounded-2xl font-black text-[13px]" style={{ background: '#F4F3FF', color: C.purple }}>
              Adiantar e abrir agora
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  // ── Dia ativo (inclui triagem D0 e fechamento) ───────────────────────────
  const step = enrollment.currentStep;
  const isClosing = step?.kind === 'CLOSING';

  return (
    <Screen>
      <Header
        title={step?.title || `Dia ${enrollment.currentDay}`}
        subtitle={isClosing ? 'Fechamento' : step?.kind === 'TRIAGE' ? 'Triagem inicial' : `Dia ${enrollment.currentDay} de ${protocol.totalDays}`}
        onBack={() => navigate('/protocolos')}
      />
      <div className="px-5 space-y-3">
        {step?.taskShort && (
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-1.5">Tarefa de hoje</p>
            <p className="text-[14px] font-black text-gray-800">{step.taskShort}</p>
          </div>
        )}

        {step?.whyText && (
          <div className="rounded-[20px] p-4" style={{ background: '#F1E9FF' }}>
            <p className="text-[12px] font-medium leading-relaxed" style={{ color: C.purpleDark }}>{step.whyText}</p>
          </div>
        )}

        {step?.asksRating && (
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-3">
              De 0 a 10, quão grave está agora?
            </p>
            <input
              type="range"
              min={0}
              max={10}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-center text-2xl font-black mt-1" style={{ color: C.purple }}>{severity}</p>
          </div>
        )}

        <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">Observação do tutor</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="O que você observou hoje?"
            className="w-full text-[13px] font-medium outline-none resize-none bg-gray-50 rounded-xl p-3"
          />
        </div>

        {isClosing && (
          <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-3">O problema resolveu?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setResolved(true)}
                className="flex-1 py-3 rounded-2xl font-black text-[13px]"
                style={resolved === true ? { background: C.green, color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
              >
                Sim
              </button>
              <button
                onClick={() => setResolved(false)}
                className="flex-1 py-3 rounded-2xl font-black text-[13px]"
                style={resolved === false ? { background: C.red, color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
              >
                Não
              </button>
            </div>
          </div>
        )}

        <button
          onClick={submitDay}
          disabled={submitting || (isClosing && resolved === null)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-sm"
          style={{ background: submitting ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
        >
          <CheckCircle2 size={18} /> {isClosing ? 'Concluir protocolo' : 'Marcar como feito'}
        </button>
      </div>
    </Screen>
  );
}
