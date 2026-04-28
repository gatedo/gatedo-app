import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Instagram,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Send,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import api from '../../services/api';

const C = {
  purple: '#7c3aed',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  bg: '#eeeeff',
};

const STATUS = {
  new: ['Novo', 'bg-blue-50 text-blue-700 border-blue-100'],
  qualified: ['Qualificado', 'bg-emerald-50 text-emerald-700 border-emerald-100'],
  replied: ['Respondeu', 'bg-violet-50 text-violet-700 border-violet-100'],
  interested: ['Interessado', 'bg-orange-50 text-orange-700 border-orange-100'],
  converted: ['Convertido', 'bg-green-50 text-green-700 border-green-100'],
  lost: ['Perdido', 'bg-red-50 text-red-700 border-red-100'],
};

function Badge({ children, color = 'slate' }) {
  const map = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    purple: 'bg-violet-50 text-violet-700 border-violet-100',
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${map[color] || map.slate}`}>{children}</span>;
}

function Card({ children, className = '' }) {
  return <section className={`rounded-[18px] border border-white/70 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

function Stat({ label, value, icon: Icon, color }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value ?? 0}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${color}18`, color }}>
          <Icon size={22} />
        </div>
      </div>
    </Card>
  );
}

function formatDate(value) {
  if (!value) return 'Sem janela ativa';
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminInstagramOutreach() {
  const [config, setConfig] = useState(null);
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leadForm, setLeadForm] = useState({ username: '', fullName: '', source: 'manual', notes: '' });

  const selectedLead = useMemo(() => leads.find((lead) => lead.id === selectedLeadId), [leads, selectedLeadId]);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [configRes, healthRes, summaryRes, leadsRes, templatesRes] = await Promise.all([
        api.get('/prospects/instagram/config'),
        api.get('/prospects/instagram/health'),
        api.get('/prospects/instagram/summary'),
        api.get('/prospects/instagram/leads'),
        api.get('/prospects/instagram/templates'),
      ]);
      setConfig(configRes.data);
      setHealth(healthRes.data);
      setSummary(summaryRes.data);
      setLeads(leadsRes.data?.data || []);
      setTemplates(templatesRes.data?.data || []);
      setSelectedLeadId((current) => current || leadsRes.data?.data?.[0]?.id || '');
      setSelectedTemplateId((current) => current || templatesRes.data?.data?.[0]?.id || '');
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.error || 'Nao foi possivel carregar Instagram Outreach.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createLead = async (event) => {
    event.preventDefault();
    if (!leadForm.username.trim()) return;
    await api.post('/prospects/instagram/leads', leadForm);
    setLeadForm({ username: '', fullName: '', source: 'manual', notes: '' });
    await load();
  };

  const addSafeInteraction = async () => {
    if (!selectedLead) return;
    await api.post('/prospects/instagram/interactions', {
      leadId: selectedLead.id,
      type: 'dm_received',
      source: 'inbox',
      text: 'Interacao registrada manualmente no admin',
    });
    await load();
  };

  const buildPreview = async () => {
    if (!selectedLeadId || !selectedTemplateId) return;
    const response = await api.post('/prospects/instagram/preview', {
      leadId: selectedLeadId,
      templateId: selectedTemplateId,
    });
    setPreview(response.data);
  };

  const sendMessage = async () => {
    if (!selectedLeadId || !selectedTemplateId) return;
    setNotice(null);
    try {
      const response = await api.post('/prospects/instagram/send', {
        leadId: selectedLeadId,
        templateId: selectedTemplateId,
      });
      setNotice({
        type: response.data?.status === 'ready_manual' ? 'info' : 'success',
        text:
          response.data?.status === 'ready_manual'
            ? 'Mensagem aprovada pela regra, mas envio real esta desativado. Use como tarefa manual ou ative INSTAGRAM_SEND_ENABLED apos revisao.'
            : 'Mensagem enviada dentro das regras.',
      });
      await load();
    } catch (err) {
      const data = err.response?.data;
      setNotice({
        type: 'error',
        text: data?.recommendation ? `${data.error} ${data.recommendation}` : data?.error || 'Envio bloqueado pela politica.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 shadow-sm">
            <Instagram size={14} /> Instagram Outreach
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Prospecção ética por Instagram</h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Capte leads por interações, inbox e campanhas de mensagem. O módulo bloqueia DM frio e registra decisões de compliance.
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg active:scale-95">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {notice && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${notice.type === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
          {notice.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Leads IG" value={summary?.total} icon={UserPlus} color={C.purple} />
        <Stat label="Novos" value={summary?.new} icon={Sparkles} color={C.blue} />
        <Stat label="Quentes" value={summary?.warm} icon={MessageCircle} color={C.green} />
        <Stat label="Bloqueios corretos" value={summary?.blocked} icon={ShieldCheck} color={C.amber} />
      </div>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">Conexao e regras</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {health?.ok ? `Conectado em @${health.account?.username || 'instagram'}` : health?.reason || 'Aguardando configuracao.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge color={health?.ok ? 'green' : 'amber'}>{health?.ok ? 'API conectada' : 'Configurar API'}</Badge>
            <Badge color={config?.sendEnabled ? 'green' : 'purple'}>{config?.sendEnabled ? 'Envio real ativo' : 'Modo seguro/manual'}</Badge>
            <Badge color="slate">{config?.graphVersion || 'Graph API'}</Badge>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(config?.guardrails || []).map((rule) => (
            <div key={rule} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold leading-relaxed text-slate-600">
              {rule}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Leads captados</h2>
            <Badge color="purple">{leads.length} visiveis</Badge>
          </div>
          <div className="space-y-3">
            {leads.map((lead) => {
              const status = STATUS[lead.status] || STATUS.new;
              const allowed = lead.policy?.allowed;
              return (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selectedLeadId === lead.id ? 'border-violet-300 bg-violet-50/60' : 'border-slate-100 bg-white'}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black text-slate-950">@{lead.username || lead.instagramUserId || 'lead'}</p>
                      <p className="text-xs font-bold text-slate-400">{lead.fullName || lead.source}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${status[1]}`}>{status[0]}</span>
                      <Badge color={allowed ? 'green' : 'amber'}>{allowed ? 'Janela ativa' : 'Manual/campanha'}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">{lead.policy?.reason}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-400">Janela ate: {formatDate(lead.conversationWindowUntil)}</p>
                </button>
              );
            })}
            {!leads.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Nenhum lead ainda. Cadastre um manualmente ou conecte webhooks/interacoes.</p>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-black text-slate-950">Adicionar lead seguro</h2>
            <form onSubmit={createLead} className="mt-4 space-y-3">
              <input value={leadForm.username} onChange={(e) => setLeadForm({ ...leadForm, username: e.target.value })} placeholder="@perfil" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" />
              <input value={leadForm.fullName} onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })} placeholder="Nome ou observacao" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" />
              <textarea value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} placeholder="Contexto da interacao" rows={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-violet-400" />
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white active:scale-95">
                <Plus size={16} /> Adicionar lead
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="text-lg font-black text-slate-950">Mensagem assistida</h2>
            <div className="mt-4 space-y-3">
              <select value={selectedLeadId} onChange={(e) => setSelectedLeadId(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none">
                {leads.map((lead) => <option key={lead.id} value={lead.id}>@{lead.username || lead.instagramUserId}</option>)}
              </select>
              <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none">
                {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={buildPreview} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 active:scale-95">Prever</button>
                <button onClick={sendMessage} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white active:scale-95">
                  <Send size={15} /> Enviar
                </button>
              </div>
              <button onClick={addSafeInteraction} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 active:scale-95">
                <CheckCircle2 size={16} /> Registrar DM recebida
              </button>
              {preview && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    {preview.policy?.allowed ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />} Previa
                  </div>
                  <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700">{preview.text}</p>
                  <Badge color={preview.policy?.allowed ? 'green' : 'amber'}>{preview.policy?.reason}</Badge>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
