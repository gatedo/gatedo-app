import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  HeartHandshake,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  buildAmbassadorLinks,
  deleteAmbassador,
  getAmbassadors,
  makeAmbassadorToken,
  normalizeAmbassadorToken,
  saveAmbassador,
} from '../../services/ambassadorProgramStore';

const EMPTY_FORM = {
  token: '',
  name: '',
  handle: '',
  city: '',
  audience: 0,
  tier: 'genese',
  status: 'active',
  color: '#8B4AFF',
  initials: '',
  avatarUrl: '',
  affiliateCode: '',
  commissionPercent: 20,
  storefrontTitle: '',
  storefrontIntro: '',
  headline: '',
  videoUrl: '',
  customMessage: '',
  highlightsText: '',
};

function toForm(item = null) {
  if (!item) return { ...EMPTY_FORM, token: makeAmbassadorToken('EMBAIXADORA') };
  return {
    ...EMPTY_FORM,
    ...item,
    highlightsText: (item.highlights || []).join('\n'),
  };
}

function fromForm(form) {
  return {
    ...form,
    token: normalizeAmbassadorToken(form.token),
    affiliateCode: normalizeAmbassadorToken(form.affiliateCode || form.token).replace(/-/g, ''),
    audience: Number(form.audience || 0),
    commissionPercent: Number(form.commissionPercent || 0),
    highlights: String(form.highlightsText || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

function CopyButton({ value, label = 'Copiar' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="h-9 px-3 rounded-xl border border-gray-100 text-[11px] font-black text-gray-500 flex items-center gap-1.5 hover:bg-gray-50"
    >
      {copied ? <CheckCircle2 size={13} className="text-green-500" /> : <Copy size={13} />}
      {copied ? 'Copiado' : label}
    </button>
  );
}

export default function AdminAmbassadors() {
  const [items, setItems] = useState(() => getAmbassadors());
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => toForm());

  const activeCount = useMemo(() => items.filter((item) => item.status === 'active').length, [items]);

  const refresh = () => setItems(getAmbassadors());

  const startNew = () => {
    setEditing(null);
    setForm(toForm());
  };

  const startEdit = (item) => {
    setEditing(item.token);
    setForm(toForm(item));
  };

  const save = (event) => {
    event.preventDefault();
    saveAmbassador(fromForm(form));
    refresh();
    startNew();
  };

  const remove = (token) => {
    if (!window.confirm('Remover este acesso de embaixador?')) return;
    deleteAmbassador(token);
    refresh();
    if (editing === token) startNew();
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #140B2E 0%, #28134b 100%)' }}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#ebfc66' }}>
              <HeartHandshake size={20} color="#8B4AFF" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ebfc66]">Growth & Parcerias</p>
            <h1 className="text-3xl font-black mt-2">Programa de Embaixadores Gatedo</h1>
            <p className="text-sm text-white/55 mt-2 max-w-2xl">
              Gere tokens nominais para influenciadores, personalize a proposta e entregue links com atribuicao para Store, cadastro e futura vitrine.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[300px]">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
              <p className="text-2xl font-black">{items.length}</p>
              <p className="text-[10px] text-white/45">acessos</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
              <p className="text-2xl font-black">{activeCount}</p>
              <p className="text-[10px] text-white/45">ativos</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
              <p className="text-2xl font-black">20%</p>
              <p className="text-[10px] text-white/45">padrao</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <form onSubmit={save} className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{editing ? 'Editando acesso' : 'Novo acesso'}</p>
              <h2 className="text-lg font-black text-gray-900">{editing || 'Token personalizado'}</h2>
            </div>
            <button type="button" onClick={startNew} className="h-10 px-3 rounded-xl bg-gray-50 text-xs font-black text-gray-500 flex items-center gap-1.5">
              <Plus size={14} /> Novo
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {[
              ['Nome', 'name'],
              ['Handle', 'handle'],
              ['Cidade', 'city'],
              ['Iniciais', 'initials'],
              ['Foto miniatura', 'avatarUrl'],
              ['Token', 'token'],
              ['Codigo afiliado', 'affiliateCode'],
            ].map(([label, key]) => (
              <label key={key} className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase">{label}</span>
                <input
                  value={form[key] || ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, [key]: key === 'token' || key === 'affiliateCode' ? normalizeAmbassadorToken(event.target.value) : event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]"
                />
              </label>
            ))}
            <label className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase">Audiencia</span>
              <input type="number" value={form.audience} onChange={(event) => setForm((prev) => ({ ...prev, audience: event.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase">Comissao %</span>
              <input type="number" value={form.commissionPercent} onChange={(event) => setForm((prev) => ({ ...prev, commissionPercent: event.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase">Modelo</span>
              <select value={form.tier} onChange={(event) => setForm((prev) => ({ ...prev, tier: event.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]">
                <option value="genese">Embaixadora Genese</option>
                <option value="curadora">Curadora Gatedo</option>
                <option value="oficial">Parceira Oficial</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase">Status</span>
              <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]">
                <option value="active">Ativo</option>
                <option value="draft">Rascunho</option>
                <option value="inactive">Inativo</option>
              </select>
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-[10px] font-black text-gray-400 uppercase">Headline nominal</span>
            <input value={form.headline} onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]" />
          </label>

          <label className="space-y-1 block">
            <span className="text-[10px] font-black text-gray-400 uppercase">Link da VSL personalizada</span>
            <input
              value={form.videoUrl || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
              placeholder="https://www.youtube.com/embed/... ou Vimeo embed"
              className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]"
            />
            <p className="text-[10px] text-gray-400 font-bold">Use preferencialmente link embed para aparecer direto no player da proposta.</p>
          </label>

          <label className="space-y-1 block">
            <span className="text-[10px] font-black text-gray-400 uppercase">Mensagem personalizada</span>
            <textarea value={form.customMessage} onChange={(event) => setForm((prev) => ({ ...prev, customMessage: event.target.value }))} rows={4} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]" />
          </label>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase">Titulo da vitrine</span>
              <input value={form.storefrontTitle} onChange={(event) => setForm((prev) => ({ ...prev, storefrontTitle: event.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase">Cor</span>
              <input type="color" value={form.color} onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))} className="w-full h-11 rounded-2xl border border-gray-200 px-2 py-1 bg-white" />
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-[10px] font-black text-gray-400 uppercase">Intro da vitrine</span>
            <textarea value={form.storefrontIntro} onChange={(event) => setForm((prev) => ({ ...prev, storefrontIntro: event.target.value }))} rows={2} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]" />
          </label>

          <label className="space-y-1 block">
            <span className="text-[10px] font-black text-gray-400 uppercase">Destaques, um por linha</span>
            <textarea value={form.highlightsText} onChange={(event) => setForm((prev) => ({ ...prev, highlightsText: event.target.value }))} rows={3} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8B4AFF]" />
          </label>

          <div className="flex gap-2">
            <button type="submit" className="h-11 px-5 rounded-2xl bg-[#8B4AFF] text-white text-sm font-black flex items-center gap-2">
              <Save size={15} /> Salvar acesso
            </button>
            {editing && (
              <button type="button" onClick={startNew} className="h-11 px-4 rounded-2xl bg-gray-100 text-gray-500 text-sm font-black flex items-center gap-2">
                <X size={15} /> Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          {items.map((item) => {
            const links = buildAmbassadorLinks(item.token);
            return (
              <div key={item.token} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shrink-0" style={{ background: item.color }}>
                    {item.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-gray-900">{item.name}</p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${item.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{item.handle} · {item.city}</p>
                    <p className="text-[10px] font-mono text-gray-400 mt-1">{item.token}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => remove(item.token)} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-2 mt-4">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <Users size={13} className="text-gray-400" />
                    <p className="text-sm font-black text-gray-900 mt-1">{Number(item.audience || 0).toLocaleString('pt-BR')}</p>
                    <p className="text-[9px] text-gray-400">seguidores</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-sm font-black text-gray-900">{item.commissionPercent}%</p>
                    <p className="text-[9px] text-gray-400">comissao base</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-sm font-black text-gray-900 truncate">{item.affiliateCode}</p>
                    <p className="text-[9px] text-gray-400">codigo afiliado</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <CopyButton value={links.portal} label="Portal" />
                  <CopyButton value={links.store} label="Vitrine" />
                  <button onClick={() => window.open(links.portal, '_blank', 'noopener,noreferrer')} className="h-9 px-3 rounded-xl bg-[#8B4AFF] text-white text-[11px] font-black flex items-center gap-1.5">
                    Abrir <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
