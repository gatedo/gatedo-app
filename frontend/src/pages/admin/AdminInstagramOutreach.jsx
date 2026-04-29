import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
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

function leadLabel(lead) {
  if (!lead) return 'Lead';
  return lead.username ? `@${lead.username}` : `ID ${lead.instagramUserId || lead.id}`;
}

function leadSubLabel(lead) {
  if (!lead) return '';
  if (lead.fullName) return lead.fullName;
  if (lead.username) return lead.source;
  return 'A Meta ainda nao retornou o @usuario para este lead';
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

  const copyPreview = async () => {
    if (!preview?.text) return;
    await navigator.clipboard.writeText(preview.text);
    setNotice({ type: 'success', text: 'Mensagem copiada. Cole no Direct do Instagram se estiver operando em modo manual.' });
  };

  const openInstagram = () => {
    if (!selectedLead?.username && !selectedLead?.profileUrl) return;
    const url = selectedLead.profileUrl || `https://instagram.com/${selectedLead.username}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
                      <p className="font-black text-slate-950">{leadLabel(lead)}</p>
                      <p className="text-xs font-bold text-slate-400">{leadSubLabel(lead)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${status[1]}`}>{status[0]}</span>
                      <Badge color={allowed ? 'green' : 'amber'}>{allowed ? 'Janela ativa' : 'Manual/campanha'}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">{lead.policy?.reason}</p>
                  {lead.messages?.[0]?.body && (
                    <p className="mt-2 line-clamp-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600">
                      Ultima mensagem: {lead.messages[0].body}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] font-bold text-slate-400">Janela ate: {formatDate(lead.conversationWindowUntil)}</p>
                </button>
              );
            })}
            {!leads.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Nenhum lead ainda. Cadastre um manualmente ou conecte webhooks/interacoes.</p>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-black text-slate-950">Lead selecionado</h2>
            {selectedLead ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  {selectedLead.avatarUrl ? (
                    <img src={selectedLead.avatarUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600">
                      <Instagram size={22} />
                    </div>
                  )}
                  <div>
                    <p className="font-black text-slate-950">{leadLabel(selectedLead)}</p>
                    <p className="text-xs font-bold text-slate-400">{leadSubLabel(selectedLead)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={openInstagram}
                    disabled={!selectedLead.username && !selectedLead.profileUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ExternalLink size={14} /> Abrir perfil
                  </button>
                  <Badge color={selectedLead.policy?.allowed ? 'green' : 'amber'}>
                    {selectedLead.policy?.allowed ? 'Pode responder' : 'Manual/campanha'}
                  </Badge>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Historico recente</p>
                  <div className="space-y-2">
                    {(selectedLead.messages || []).slice(0, 3).map((message) => (
                      <div key={message.id} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                        <span className="font-black text-violet-600">{message.direction === 'in' ? 'Lead' : 'Gatedo'}:</span> {message.body}
                      </div>
                    ))}
                    {!(selectedLead.messages || []).length && (
                      <p className="text-xs font-semibold text-slate-400">Sem mensagens salvas ainda. Novas DMs reais entram aqui via webhook.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm font-bold text-slate-500">Selecione um lead para operar.</p>
            )}
          </Card>

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
                {leads.map((lead) => <option key={lead.id} value={lead.id}>{leadLabel(lead)}</option>)}
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
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge color={preview.policy?.allowed ? 'green' : 'amber'}>{preview.policy?.reason}</Badge>
                    <button onClick={copyPreview} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                      <Copy size={12} /> Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
