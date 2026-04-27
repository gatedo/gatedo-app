/**
 * AdminProspects.jsx — Sistema Autônomo de Prospecção v4
 *
 * Melhorias nesta versão:
 * - Persistência total via API + localStorage como fallback
 * - Lista "Em Espera" — contatos fixos que não se perdem
 * - Templates com imagem (URL R2 ou upload direto)
 * - Ícones/emojis chegam corretamente no WA
 * - Imagem enviada via Gateway (não wa.me)
 * - Proteção contra reenvio duplo
 * - Editar número de contato
 * - Envio individual com texto + imagem corretos
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Phone, MessageCircle, Plus, X, Edit2, Trash2,
  Send, CheckCircle, XCircle, Clock, Search,
  Download, Upload, Users, Image as ImageIcon,
  Zap, Target, Copy, Check, Eye, Flame, Bot,
  SkipForward, MoreHorizontal, Wifi, WifiOff,
  QrCode, Radio, Bell, MessageSquare, RefreshCw,
  Save, Inbox, Archive, AlertTriangle, Link,
  ChevronRight, ChevronDown, Star, Layers
} from 'lucide-react';
import api from '../../services/api';

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  purple:  '#8B4AFF',
  accent:  '#DFFF40',
  emerald: '#10b981',
  blue:    '#3b82f6',
  amber:   '#f59e0b',
  red:     '#ef4444',
};

// ─── LEAD STATUS ──────────────────────────────────────────────────────────────
const LEAD_STATUS = {
  waiting:    { label: 'Em Espera',   emoji: 'S',  icon: Inbox,        color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   badge: 'bg-slate-100 text-slate-700' },
  pending:    { label: 'Pendente',    emoji: 'P',  icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700' },
  sent:       { label: 'Enviado',     emoji: 'E',  icon: Send,         color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-700' },
  replied:    { label: 'Respondeu',   emoji: 'R',  icon: MessageSquare,color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700' },
  interested: { label: 'Interessado', emoji: 'I',  icon: Flame,        color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700' },
  accepted:   { label: 'Convertido',  emoji: 'C',  icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  rejected:   { label: 'Recusou',     emoji: 'X',  icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     badge: 'bg-red-100 text-red-600' },
  followup:   { label: 'Follow-up',   emoji: 'F',  icon: Bell,         color: 'text-pink-600',    bg: 'bg-pink-50',    border: 'border-pink-200',    badge: 'bg-pink-100 text-pink-700' },
};

const KANBAN_COLS   = ['waiting','pending','sent','replied','interested','accepted','rejected','followup'];
const QUEUE_COLS    = ['waiting','pending']; // colunas da fila de disparo
const LS_KEY        = 'gatedo_prospects_v4';
const LS_TMPL_KEY   = 'gatedo_templates_v4';

// ─── DEFAULT TEMPLATES ────────────────────────────────────────────────────────
const DEFAULT_TEMPLATES = [
  {
    id: 'convite_fundador',
    name: 'Convite Fundador',
    category: 'Primeiro contato',
    color: '#8B4AFF',
    imageUrl: '',
    message: `Ola! 

Sou tutor(a) de gato e descobri uma plataforma incrivel chamada *GATEDO* - o primeiro ecossistema digital criado exclusivamente para quem tem gato!

Com ele voce organiza vacinas, consultas e o historico completo do seu felino, conta com IA veterinaria que conhece seu gato pelo nome, e muito mais.

Estao abrindo as *primeiras vagas de Fundador(a)* - o menor valor que esse app vai ter, para sempre.

Tem interesse em conhecer? Me responde aqui`,
  },
  {
    id: 'followup_24h',
    name: 'Follow-up 24h',
    category: 'Sem resposta',
    color: '#f59e0b',
    imageUrl: '',
    message: `Oi!

So passando para saber se voce viu minha mensagem sobre o *GATEDO*!

E uma oportunidade unica de entrar como Fundador(a) com o menor preco do app. As vagas sao limitadas!

Posso te mostrar como funciona em 2 minutinhos?`,
  },
  {
    id: 'interesse',
    name: 'Respondeu com Interesse',
    category: 'Lead quente',
    color: '#10b981',
    imageUrl: '',
    message: `Que otimo!

Deixa eu te contar o que o *GATEDO* oferece:

- Historico de saude completo do seu gato
- IA vet que conhece seu felino pelo nome
- Vacinas, consultas e lembretes automaticos
- Studio de imagens AI exclusivo
- Comunidade gateira nacional

Como *Fundador(a)*, voce garante o menor preco que o app vai ter - para sempre.

Quer garantir sua vaga? Me fala que te passo o link direto`,
  },
  {
    id: 'objecao',
    name: 'Objecao de Preco',
    category: 'Hesitante',
    color: '#3b82f6',
    imageUrl: '',
    message: `Entendo!

Mas olha so: o plano Fundador sai por menos de *R$ 1/dia* - e voce tem tudo isso:

- Saude do gatinho organizada
- App exclusivo de gatos no Brasil
- IA veterinaria 24h
- Studio de fotos AI exclusivo

E investimento no bem-estar do seu bichano! E o preco de Fundador nunca mais volta.

Quer garantir antes que as vagas acabem?`,
  },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function formatPhone(raw) {
  let d = raw.replace(/[^\d+]/g, '');
  if (d && !d.startsWith('+')) d = '+55' + d;
  const m = d.match(/^(\+\d{2})(\d{2})(\d{4,5})(\d{4})$/);
  if (m) return `${m[1]} ${m[2]} ${m[3]}-${m[4]}`;
  return d;
}

function normalizePhone(p) { 
  if (!p) return '';
  return p.replace(/[^\d]/g, '').slice(-11); 
}

function toWANum(p) {
  if (!p) return '';
  let num = p.replace(/[^\d]/g, '');
  
  // Regra do 9º dígito do WhatsApp no Brasil
  if (num.startsWith('55') && num.length === 13) {
    const ddd = parseInt(num.substring(2, 4));
    if (ddd > 30) {
      // Mantém o 55 e o DDD, pula o 9, e pega o restante do número
      num = num.substring(0, 4) + num.substring(5);
    }
  }
  
  return num;
}

function timeAgo(d) {
  if (!d) return null;
  const h = Math.floor((Date.now() - new Date(d)) / 3600000);
  if (h < 1) return 'agora';
  if (h < 24) return `${h}h`;
  return `${Math.floor(h/24)}d`;
}

function genId() { return `c_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveLocal(contacts) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(contacts)); } catch {}
}
function loadTemplatesLocal() {
  try {
    const t = JSON.parse(localStorage.getItem(LS_TMPL_KEY) || 'null');
    return t || DEFAULT_TEMPLATES;
  } catch { return DEFAULT_TEMPLATES; }
}
function saveTemplatesLocal(t) {
  try { localStorage.setItem(LS_TMPL_KEY, JSON.stringify(t)); } catch {}
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }) {
  const cfg = LEAD_STATUS[status] || LEAD_STATUS.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 font-black rounded-full border ${cfg.badge} ${cfg.border} ${size === 'xs' ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2 py-0.5'}`}>
      <Icon size={size === 'xs' ? 8 : 9} /> {cfg.label}
    </span>
  );
}

function ScoreBar({ score }) {
  const pct   = Math.min(100, Math.max(0, score || 0));
  const color = pct >= 70 ? C.emerald : pct >= 40 ? C.amber : C.purple;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:color }} />
      </div>
      <span className="text-[8px] font-black text-gray-400">{pct}</span>
    </div>
  );
}

// ─── WA STATUS BAR ────────────────────────────────────────────────────────────
function WaStatusBar({ onStatusChange }) {
  const [status,  setStatus]  = useState(null);
  const [qr,      setQr]      = useState(null);
  const [showQr,  setShowQr]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  const poll = useCallback(async () => {
    try {
      const r = await api.get('/prospects/wa-status');
      setStatus(r.data);
      onStatusChange?.(r.data.connected);
    } catch {}
  }, [onStatusChange]);

  const fetchQr = async () => {
    setLoading(true);
    setQr(null);
    setShowQr(true);
    try { const r = await api.get('/prospects/wa-qr'); setQr(r.data.qr); }
    catch (e) { alert('Erro ao buscar QR: ' + e.message); setShowQr(false); }
    finally { setLoading(false); }
  };

  const reconnect = async () => {
    setLoading(true);
    try { await api.post('/prospects/wa-reconnect'); await poll(); }
    finally { setLoading(false); }
  };

  // Poll a cada 8s
  useEffect(() => { poll(); const id = setInterval(poll, 8000); return () => clearInterval(id); }, [poll]);

  // Se QR aberto, atualiza a cada 20s
  useEffect(() => {
    if (!showQr) return;
    const id = setInterval(fetchQr, 20000);
    return () => clearInterval(id);
  }, [showQr]);

  return (
    <>
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 transition-all ${status?.connected ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        {status?.connected
          ? <><Wifi size={14} className="text-emerald-500 flex-shrink-0" /><span className="text-xs font-black text-emerald-700 flex-1">Gateway WA conectado</span></>
          : status
            ? <><WifiOff size={14} className="text-red-500 flex-shrink-0" /><span className="text-xs font-black text-red-700 flex-1">Gateway desconectado — clique em Conectar WA</span></>
            : <><RefreshCw size={14} className="text-gray-400 animate-spin flex-shrink-0" /><span className="text-xs font-black text-gray-400 flex-1">Verificando gateway...</span></>
        }
        {status?.queueSize > 0 && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            {status.queueSize} na fila
          </span>
        )}
        {/* Botão QR sempre visível */}
        <button onClick={fetchQr} disabled={loading}
          className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all ${status?.connected ? 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'bg-white border-red-200 text-red-600 hover:bg-red-50'}`}>
          <QrCode size={10} /> {loading ? '...' : status?.connected ? 'Ver QR' : 'Conectar WA'}
        </button>
        {status && !status.connected && (
          <button onClick={reconnect} disabled={loading}
            className="flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:border-gray-300">
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Reconectar
          </button>
        )}
      </div>

      {showQr && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-gray-800 text-lg">Conectar WhatsApp</h3>
                <p className="text-xs text-gray-400 mt-0.5">Escaneie com o WhatsApp Business</p>
              </div>
              <button onClick={() => setShowQr(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><X size={16} /></button>
            </div>
            {loading ? (
              <div className="py-10 text-gray-400">
                <RefreshCw size={24} className="mx-auto mb-3 animate-spin" />
                <p className="text-sm font-bold">Gerando QR...</p>
              </div>
            ) : qr ? (
              <>
                <img src={qr} alt="QR Code WA" className="w-56 h-56 mx-auto rounded-2xl border-4 border-gray-100 mb-4" />
                <div className="bg-gray-50 rounded-xl p-3 text-left">
                  <p className="text-[10px] font-black text-gray-500 mb-1">Como conectar:</p>
                  <ol className="text-[10px] text-gray-400 space-y-0.5 list-decimal list-inside">
                    <li>Abra o WhatsApp Business no celular</li>
                    <li>Menu (3 pontinhos) → Aparelhos conectados</li>
                    <li>Conectar aparelho → Escaneie este QR</li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="py-10 text-gray-300">
                <p className="text-sm font-bold">QR nao disponivel</p>
                <p className="text-xs mt-1">Verifique se o Gateway esta online</p>
                <button onClick={fetchQr} className="mt-3 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-black">
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── TEMPLATE MANAGER ─────────────────────────────────────────────────────────
function TemplateManager({ templates, onSave, onClose }) {
  const [list,   setList]   = useState(templates);
  const [active, setActive] = useState(list[0]);
  const [form,   setForm]   = useState({...list[0]});
  const [uploading, setUploading] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const fileRef = useRef();

  const select = (t) => { setActive(t); setForm({...t}); };

  const save = () => {
    const updated = list.map(t => t.id === form.id ? { ...form } : t);
    setList([...updated]);
    setActive({ ...form });
    onSave([...updated]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const addNew = () => {
    const t = { id: `tmpl_${Date.now()}`, name: 'Novo template', category: '', color: C.purple, imageUrl: '', message: '' };
    const updated = [...list, t];
    setList(updated);
    setActive(t);
    setForm({...t});
  };

  const remove = (id) => {
    const updated = list.filter(t => t.id !== id);
    setList(updated);
    onSave(updated);
    if (active.id === id) { setActive(updated[0]); setForm({...updated[0]}); }
  };

  const uploadImg = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await api.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
      const url = r.data?.url || r.data?.publicUrl || '';
      setForm(f => ({...f, imageUrl: url}));
    } catch (e) {
      alert('Erro no upload: ' + (e.response?.data?.message || e.message));
    } finally { setUploading(false); e.target.value = ''; }
  };

  const f = (field) => (e) => setForm(prev => ({...prev, [field]: e.target.value}));

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={18} style={{color:C.purple}} />
            <h3 className="font-black text-gray-800">Templates de Mensagem</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={addNew} className="flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-xl border-2 border-dashed border-purple-300 text-purple-500 hover:bg-purple-50">
              <Plus size={11} /> Novo
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><X size={16} /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Lista de templates */}
          <div className="w-52 border-r border-gray-100 p-3 space-y-1 overflow-y-auto">
            {list.map(t => (
              <button key={t.id} onClick={() => select(t)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group relative ${active.id === t.id ? 'bg-purple-50 border-2 border-purple-200' : 'hover:bg-gray-50 border-2 border-transparent'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: t.color || C.purple}} />
                  <p className="text-[11px] font-black text-gray-700 truncate flex-1">{t.name}</p>
                </div>
                <p className="text-[9px] text-gray-400 truncate mt-0.5 ml-4">{t.category || 'Sem categoria'}</p>
                {t.imageUrl && <span className="absolute top-2 right-6 text-[8px] text-blue-400">img</span>}
                <button onClick={e => { e.stopPropagation(); remove(t.id); }}
                  className="absolute top-2 right-2 p-0.5 opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500">
                  <X size={9} />
                </button>
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Nome</label>
                <input value={form.name || ''} onChange={f('name')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Categoria / Gatilho</label>
                <input value={form.category || ''} onChange={f('category')} placeholder="Ex: Primeiro contato"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-purple-400" />
              </div>
            </div>

            {/* Link com preview rico */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
                Link (preview rico — enviado separado)
              </label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Link size={11} className="text-gray-400 flex-shrink-0" />
                <input value={form.linkUrl || ''} onChange={f('linkUrl')} placeholder="https://gatedo.com"
                  className="flex-1 bg-transparent text-sm font-medium focus:outline-none" />
              </div>
              <p className="text-[9px] text-blue-500 mt-1">
                O link gera preview com imagem e titulo do site (igual ao print). Enviado como mensagem separada apos o texto.
              </p>
            </div>

            {/* Imagem do template */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Imagem (opcional)</label>
              <div className="flex gap-2">
                <input value={form.imageUrl || ''} onChange={f('imageUrl')} placeholder="https://... ou use o upload abaixo"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-purple-400" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-600 rounded-xl text-[10px] font-black hover:bg-purple-100 disabled:opacity-50">
                  {uploading ? <RefreshCw size={10} className="animate-spin" /> : <Upload size={10} />}
                  {uploading ? 'Subindo...' : 'Upload R2'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadImg} />
              </div>
              {form.imageUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 relative">
                  <img src={form.imageUrl} alt="" className="w-full max-h-32 object-cover" onError={e => e.target.style.display='none'} />
                  <button onClick={() => setForm(f => ({...f, imageUrl:''}))}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-red-500 hover:bg-white">
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>

            {/* Mensagem */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Mensagem</label>
                <span className="text-[9px] text-gray-300">{(form.message||'').length} chars · *negrito* _italico_</span>
              </div>
              <textarea value={form.message || ''} onChange={f('message')} rows={10}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-purple-400 resize-none" />
              <p className="text-[9px] text-amber-600 mt-1">
                Evite emojis e URLs diretas para nao quebrar no WA. Use *negrito* para destaque.
              </p>
            </div>

            {/* Preview WA */}
            <div className="bg-[#ECE5DD] rounded-2xl p-4">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">Preview WhatsApp</p>
              {form.imageUrl && (
                <div className="bg-white rounded-[14px] overflow-hidden shadow-sm mb-2">
                  <img src={form.imageUrl} alt="" className="w-full max-h-32 object-cover" onError={e => e.target.style.display='none'} />
                </div>
              )}
              <div className="bg-white rounded-[14px] rounded-tl-sm px-4 py-3 shadow-sm">
                <p className="text-[11px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {form.message || <span className="text-gray-300 italic">Mensagem aparece aqui...</span>}
                </p>
                <p className="text-[9px] text-gray-400 text-right mt-1">12:00 ok</p>
              </div>
              {form.linkUrl && (
                <div className="mt-2 bg-white rounded-[14px] rounded-tl-sm overflow-hidden shadow-sm border border-gray-100">
                  <div className="h-16 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <p className="text-xs text-purple-400 font-bold">Preview do link</p>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-[10px] font-black text-gray-700 truncate">{form.linkUrl}</p>
                    <p className="text-[9px] text-gray-400">Preview rico sera gerado pelo WA</p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={save}
              className="w-full py-3 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{background:`linear-gradient(135deg,${C.purple},#5046b0)`}}>
              {saved ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar template</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONTACT CARD ─────────────────────────────────────────────────────────────
function ContactCard({ contact, onMove, onEdit, onDelete, onSendWA, onOpenDetail, waConnected }) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneVal,    setPhoneVal]    = useState(contact.phone);
  const cfg = LEAD_STATUS[contact.column] || LEAD_STATUS.pending;
  const Icon = cfg.icon;
  const ddd = contact.phone.match(/\+55\s?(\d{2})/)?.[1] ?? contact.phone.slice(-4,-2);

  const savePhone = () => {
    const formatted = formatPhone(phoneVal);
    onEdit(contact.id, { phone: formatted });
    setPhoneVal(formatted);
    setEditingPhone(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all group cursor-pointer"
      draggable onDragStart={e => e.dataTransfer.setData('contactId', String(contact.id))}
      onClick={() => onOpenDetail(contact)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0"
          style={{background:`${C.purple}15`, color:C.purple}}>
          {contact.name ? contact.name[0].toUpperCase() : ddd}
        </div>
        <div className="flex-1 min-w-0">
          {contact.name && <p className="text-[11px] font-black text-gray-700 leading-none mb-0.5 truncate">{contact.name}</p>}
          {editingPhone ? (
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              <input value={phoneVal} onChange={e => setPhoneVal(formatPhone(e.target.value))}
                className="text-[10px] bg-gray-50 border border-purple-300 rounded-lg px-1.5 py-0.5 flex-1 outline-none"
                onKeyDown={e => e.key === 'Enter' && savePhone()} autoFocus />
              <button onClick={savePhone} className="text-emerald-500 p-0.5"><Check size={10} /></button>
              <button onClick={() => setEditingPhone(false)} className="text-red-400 p-0.5"><X size={10} /></button>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-gray-500">{contact.phone}</span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditingPhone(true)} className="p-1.5 rounded-lg text-gray-300 hover:text-purple-500 hover:bg-purple-50" title="Editar número">
            <Edit2 size={10} />
          </button>
          <button onClick={e => { e.stopPropagation(); onOpenDetail(contact); }}
            className="p-1.5 rounded-lg text-gray-300 hover:text-emerald-500 hover:bg-emerald-50">
            <Send size={10} />
          </button>
          <button onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50">
            <MoreHorizontal size={10} />
          </button>
        </div>
      </div>

      {contact.sentCount > 0 && (
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
            {contact.sentCount}x enviado
          </span>
          {contact.sentAt && <span className="text-[8px] text-gray-300">{timeAgo(contact.sentAt)}</span>}
        </div>
      )}

      {contact.score > 0 && <ScoreBar score={contact.score} />}
      {contact.note && <p className="text-[10px] text-gray-400 bg-gray-50 rounded-lg px-2 py-1 mt-1.5 italic truncate">{contact.note}</p>}
      {contact.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {contact.tags.map(t => (
            <span key={t} className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-500 border border-purple-100">#{t}</span>
          ))}
        </div>
      )}

      {menuOpen && (
        <div className="mt-2 border-t border-gray-50 pt-2" onClick={e => e.stopPropagation()}>
          <p className="text-[8px] font-black text-gray-300 uppercase tracking-wider mb-1.5">Mover para</p>
          <div className="flex flex-wrap gap-1">
            {KANBAN_COLS.filter(c => c !== contact.column).map(col => {
              const s = LEAD_STATUS[col];
              const Icon2 = s.icon;
              return (
                <button key={col} onClick={() => { onMove(contact.id, col); setMenuOpen(false); }}
                  className={`text-[8px] font-black px-2 py-1 rounded-lg border flex items-center gap-1 ${s.bg} ${s.color} ${s.border} hover:opacity-80`}>
                  <Icon2 size={8} /> {s.label}
                </button>
              );
            })}
          </div>
          <button onClick={() => { onDelete(contact.id); setMenuOpen(false); }}
            className="mt-1.5 w-full text-[9px] font-black text-red-400 bg-red-50 border border-red-100 rounded-lg px-2 py-1 flex items-center justify-center gap-1">
            <Trash2 size={9} /> Remover
          </button>
        </div>
      )}
    </div>
  );
}

// ─── KANBAN COLUMN ────────────────────────────────────────────────────────────
function KanbanColumn({ colId, contacts, onMove, onEdit, onDelete, onSendWA, onOpenDetail, waConnected }) {
  const [over, setOver] = useState(false);
  const cfg  = LEAD_STATUS[colId];
  const Icon = cfg.icon;

  return (
    <div className={`flex flex-col min-w-[210px] max-w-[230px] rounded-2xl border-2 transition-all ${cfg.border} ${over ? 'ring-2 ring-purple-300' : ''}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData('contactId'); if (id) onMove(id, colId); }}>
      <div className={`${cfg.bg} rounded-t-2xl px-3 py-2.5 flex items-center gap-2 border-b ${cfg.border}`}>
        <Icon size={13} className={cfg.color} />
        <span className={`text-[11px] font-black ${cfg.color} flex-1`}>{cfg.label}</span>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${cfg.badge} border ${cfg.border}`}>{contacts.length}</span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[480px]">
        {contacts.length === 0 && (
          <div className="text-center text-gray-200 text-xs py-8 flex flex-col items-center gap-2">
            <Icon size={14} className="opacity-20" />
            <span className="text-[9px]">Arraste aqui</span>
          </div>
        )}
        {contacts.map(c => (
          <ContactCard key={c.id} contact={c} onMove={onMove} onEdit={onEdit}
            onDelete={onDelete} onSendWA={onSendWA} onOpenDetail={onOpenDetail} waConnected={waConnected} />
        ))}
      </div>
    </div>
  );
}

// ─── LEAD DETAIL DRAWER ───────────────────────────────────────────────────────
function LeadDetailDrawer({ contact, onClose, onSendWA, onMove, onEdit, templates, activeTemplate, onSetActiveTemplate, waConnected, sending }) {
  const [note,   setNote]   = useState(contact.note  || '');
  const [name,   setName]   = useState(contact.name  || '');
  const [score,  setScore]  = useState(contact.score || 0);
  const [tags,   setTags]   = useState(contact.tags  || []);
  const [tagIn,  setTagIn]  = useState('');
  const [copied, setCopied] = useState(false);
  const [selTmpl, setSelTmpl] = useState(activeTemplate || templates[0]);
  const cfg = LEAD_STATUS[contact.column];

  // Alerta se já enviado
  const alreadySent = (contact.sentCount || 0) > 0;

  const handleSend = () => {
    onEdit(contact.id, { note, name, score, tags });
    onSendWA({ ...contact, name, note }, selTmpl);
    onSetActiveTemplate(selTmpl);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selTmpl?.message || '');
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const addTag = e => {
    if (e.key === 'Enter' && tagIn.trim()) {
      setTags(p => [...new Set([...p, tagIn.trim().toLowerCase()])]);
      setTagIn('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex justify-end backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-[460px] h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm"
              style={{background:`linear-gradient(135deg,${C.purple},#5046b0)`}}>
              {(name || contact.phone.slice(-4))[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm">{name || contact.phone}</p>
              <StatusBadge status={contact.column} size="xs" />
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Alerta reenvio */}
          {alreadySent && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
              <p className="text-[11px] font-black text-amber-700">
                Ja enviado {contact.sentCount}x — ultima vez {timeAgo(contact.sentAt)}. Confirme antes de reenviar.
              </p>
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Nome</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Telefone</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                <Phone size={11} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-600 truncate text-xs">{contact.phone}</span>
              </div>
            </div>
          </div>

          {/* Score */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Lead Score</label>
              <span className="text-[11px] font-black" style={{color: score>=70?C.emerald:score>=40?C.amber:C.purple}}>{score}</span>
            </div>
            <input type="range" min="0" max="100" value={score} onChange={e => setScore(+e.target.value)} className="w-full accent-purple-500" />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Status</label>
            <div className="grid grid-cols-4 gap-1">
              {KANBAN_COLS.map(col => {
                const s    = LEAD_STATUS[col];
                const Icon = s.icon;
                const isActive = col === contact.column;
                return (
                  <button key={col} onClick={() => onMove(contact.id, col)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all ${isActive ? `${s.bg} ${s.border} ring-2 ring-purple-200` : 'border-gray-100 hover:border-gray-200'}`}>
                    <Icon size={12} className={isActive ? s.color : 'text-gray-300'} />
                    <span className={`text-[7px] font-black leading-none ${isActive ? s.color : 'text-gray-300'}`}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template selector */}
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Template</label>
            <div className="space-y-1 mb-3">
              {templates.map(t => (
                <button key={t.id} onClick={() => setSelTmpl(t)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-left ${selTmpl?.id === t.id ? 'border-purple-300 bg-purple-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:t.color||C.purple}} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-gray-700 truncate">{t.name}</p>
                    <p className="text-[9px] text-gray-400 truncate">{t.category}</p>
                  </div>
                  {t.imageUrl && <ImageIcon size={9} className="text-blue-400 flex-shrink-0" />}
                  {selTmpl?.id === t.id && <Check size={11} className="text-purple-500 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* Preview */}
            {selTmpl && (
              <div className="bg-[#ECE5DD] rounded-2xl p-3">
                {selTmpl.imageUrl && (
                  <div className="bg-white rounded-[14px] overflow-hidden shadow-sm mb-2">
                    <img src={selTmpl.imageUrl} alt="" className="w-full object-cover max-h-32"
                      onError={e => e.target.style.display='none'} />
                    <div className="px-3 py-1"><p className="text-[8px] font-black text-gray-400">Imagem sera enviada junto</p></div>
                  </div>
                )}
                <div className="bg-white rounded-[14px] rounded-tl-sm px-3 py-2.5 shadow-sm">
                  <p className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-5">{selTmpl.message}</p>
                </div>
                <button onClick={handleCopy} className="mt-2 flex items-center gap-1 text-[9px] font-black text-gray-400 hover:text-purple-500">
                  {copied ? <><Check size={9} className="text-emerald-500" /> Copiado!</> : <><Copy size={9} /> Copiar texto</>}
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 border border-purple-100">
                  #{t} <button onClick={() => setTags(tags.filter(x => x !== t))}>×</button>
                </span>
              ))}
            </div>
            <input value={tagIn} onChange={e => setTagIn(e.target.value)} onKeyDown={addTag}
              placeholder="Tag + Enter..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-purple-400" />
          </div>

          {/* Note */}
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Nota interna</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Observacoes..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-purple-400 resize-none" />
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {waConnected ? (
              <button onClick={handleSend} disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white shadow-lg disabled:opacity-60"
                style={{background:'linear-gradient(135deg,#25D366,#128C7E)', boxShadow:'0 6px 20px rgba(37,211,102,0.35)'}}>
                {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Enviando...' : alreadySent ? `Reenviar (${(contact.sentCount||0)+1}a vez)` : 'Enviar via Gateway'}
              </button>
            ) : (
              <a href={`https://wa.me/${toWANum(contact.phone)}?text=${encodeURIComponent(selTmpl?.message||'')}`}
                target="_blank" rel="noreferrer"
                onClick={() => { onEdit(contact.id, { note, name, score, tags }); onMove(contact.id, 'sent'); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white"
                style={{background:'linear-gradient(135deg,#25D366,#128C7E)'}}>
                <MessageCircle size={15} /> Abrir WA (manual) + Marcar Enviado
              </a>
            )}
            <button onClick={() => { onEdit(contact.id, { note, name, score, tags }); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm border-2 border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-500">
              <Save size={13} /> Salvar sem enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SEQUENCE FIRE ────────────────────────────────────────────────────────────
function SequenceFire({ contacts, onSendWA, onClose, activeTemplate, waConnected }) {
  // Apenas pendentes (não waiting, não já enviados recentemente)
  const queue = contacts.filter(c => c.column === 'pending');
  const [idx,      setIdx]      = useState(0);
  const [fired,    setFired]    = useState(0);
  const [sending,  setSending]  = useState(false);
  const [batchSent,setBatchSent]= useState(false);
  const current = queue[idx];

  const handleBatch = async () => {
    setSending(true);
    try {
      const messages = queue.map(c => ({
        phone: toWANum(c.phone), // AQUI ESTÁ A CORREÇÃO
        text: activeTemplate?.message || '',
        imageUrl: activeTemplate?.imageUrl || undefined,
        prospectId: c.id, scriptId: activeTemplate?.id,
      }));
      await api.post('/prospects/send-batch', { messages });
      setBatchSent(true);
    } catch (e) {
      alert('Erro: ' + (e.response?.data?.error || e.message));
    } finally { setSending(false); }
  };

  const handleFire = () => {
    if (!current) return;
    onSendWA(current, activeTemplate);
    setFired(f => f + 1);
    setIdx(i => i + 1);
  };

  if (batchSent) return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">🚀</div>
        <h3 className="font-black text-gray-800 text-lg mb-2">Lote na fila!</h3>
        <p className="text-gray-500 text-sm mb-6">{queue.length} mensagens agendadas com delay humanizado.</p>
        <button onClick={onClose} className="w-full py-3 rounded-2xl font-black text-white"
          style={{background:`linear-gradient(135deg,${C.purple},#5046b0)`}}>Fechar</button>
      </div>
    </div>
  );

  if (!current) return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="font-black text-gray-800 text-lg mb-2">Sequencia concluida!</h3>
        <p className="text-gray-500 text-sm mb-6">{fired} mensagens {waConnected?'enviadas':'abertas'}.</p>
        <button onClick={onClose} className="w-full py-3 rounded-2xl font-black text-white"
          style={{background:`linear-gradient(135deg,${C.purple},#5046b0)`}}>Fechar</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gray-100">
          <div className="h-full bg-purple-500 transition-all" style={{width:`${(idx/queue.length)*100}%`}} />
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Sequencia de disparo</p>
              <p className="font-black text-gray-800">{idx+1} / {queue.length} pendentes</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50"><X size={15} /></button>
          </div>

          {waConnected && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-4">
              <p className="text-xs font-black text-emerald-700 mb-1">Gateway conectado — envio automatico</p>
              <p className="text-[10px] text-emerald-600 mb-3">Dispara todos os {queue.length} pendentes com delay humanizado (4-12s).</p>
              <button onClick={handleBatch} disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs text-white"
                style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
                {sending ? <><RefreshCw size={11} className="animate-spin" /> Enviando...</> : <><Zap size={11} /> Disparar {queue.length} de uma vez</>}
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3.5 mb-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white"
              style={{background:`linear-gradient(135deg,${C.purple},#5046b0)`}}>
              {current.phone.slice(-2)}
            </div>
            <div>
              {current.name && <p className="font-black text-gray-800 text-sm">{current.name}</p>}
              <p className="font-bold text-gray-600 text-sm">{current.phone}</p>
              {(current.sentCount||0) > 0 && (
                <p className="text-[9px] text-amber-500 font-black">Ja enviado {current.sentCount}x</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-24 overflow-y-auto">
            <p className="text-[10px] text-gray-600 leading-relaxed whitespace-pre-wrap">{activeTemplate?.message}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIdx(i => i+1)} className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl font-black text-sm border-2 border-gray-200 text-gray-400 flex-1">
              <SkipForward size={12} /> Pular
            </button>
            {waConnected ? (
              <button onClick={handleFire}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm text-white flex-[2]"
                style={{background:'linear-gradient(135deg,#25D366,#128C7E)'}}>
                <Send size={12} /> Enviar
              </button>
            ) : (
              <a href={`https://wa.me/${toWANum(current.phone)}?text=${encodeURIComponent(activeTemplate?.message||'')}`}
                target="_blank" rel="noreferrer" onClick={handleFire}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm text-white flex-[2]"
                style={{background:'linear-gradient(135deg,#25D366,#128C7E)'}}>
                <MessageCircle size={12} /> Abrir WA
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADD CONTACT MODAL ────────────────────────────────────────────────────────
function AddContactModal({ onClose, onAdd, existingContacts = [] }) {
  const [phone,    setPhone]    = useState('');
  const [note,     setNote]     = useState('');
  const [name,     setName]     = useState('');
  const [bulk,     setBulk]     = useState('');
  const [tab,      setTab]      = useState('single');
  const [skipDups, setSkipDups] = useState(true);
  const [target,   setTarget]   = useState('waiting'); // waiting ou pending

  const handlePhoneChange = e => setPhone(formatPhone(e.target.value));

  const handleAdd = () => {
    let items = [];
    if (tab === 'single') {
      if (!phone.trim()) return;
      items = [{ phone: phone.trim(), note, name }];
    } else if (tab === 'bulk') {
      items = bulk.split('\n').map(l => l.trim()).filter(Boolean)
        .map(p => ({ phone: formatPhone(p), note: '', name: '' }));
    } else {
      try {
        const arr = JSON.parse(bulk);
        if (Array.isArray(arr)) items = arr.map(item => ({
          phone: formatPhone(item.phone || item.numero || String(item)),
          note:  item.note || item.nota || '',
          name:  item.name || item.nome || '',
        }));
      } catch { alert('JSON invalido.'); return; }
    }

    if (skipDups) {
      const existing = new Set(existingContacts.map(c => normalizePhone(c.phone)));
      const before = items.length;
      items = items.filter(i => !existing.has(normalizePhone(i.phone)));
      if (items.length === 0) { alert(`Todos os ${before} numeros ja existem.`); return; }
      if (before > items.length) alert(`${before - items.length} duplicata(s) ignorada(s). Adicionando ${items.length}.`);
    }

    onAdd(items, target);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-800">Adicionar Contatos</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><X size={16} /></button>
        </div>
        <div className="p-5">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            {[['single','Um por vez'],['bulk','Lista'],['json','JSON']].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${tab===id?'bg-white text-purple-600 shadow-sm':'text-gray-400'}`}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'single' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nome (opcional)</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Numero</label>
                <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="+55 51 98512-5219"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-purple-400" />
                {phone && <p className="text-[10px] mt-1" style={{color: normalizePhone(phone).length>=10?'#10b981':'#f59e0b'}}>
                  {normalizePhone(phone).length>=10?'Valido':'Incompleto'}
                </p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nota</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Grupo X..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-purple-400" />
              </div>
            </div>
          )}
          {tab === 'bulk' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Um numero por linha (DDI opcional)</label>
              <textarea value={bulk} onChange={e => setBulk(e.target.value)} rows={7}
                placeholder={"51985125219\n+55 85 99999-9999\n21988887777"}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-purple-400 resize-none" />
            </div>
          )}
          {tab === 'json' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">JSON</label>
              <textarea value={bulk} onChange={e => setBulk(e.target.value)} rows={7}
                placeholder={'[\n  {"phone":"51985125219","name":"Maria","note":"Grupo A"}\n]'}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-xs focus:outline-none focus:border-purple-400 resize-none" />
            </div>
          )}

          {/* Destino */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-500 mb-2">Adicionar como</label>
            <div className="grid grid-cols-2 gap-2">
              {[['waiting','Em Espera','Fica na lista fixa, sem disparar'],['pending','Pendente','Ja entra na fila de disparo']].map(([val,lbl,desc]) => (
                <button key={val} onClick={() => setTarget(val)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${target===val?'border-purple-300 bg-purple-50':'border-gray-100 hover:border-gray-200'}`}>
                  <p className={`text-xs font-black ${target===val?'text-purple-600':'text-gray-600'}`}>{lbl}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Skip dups toggle */}
          <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer select-none"
            onClick={() => setSkipDups(v => !v)}>
            <div className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${skipDups?'bg-purple-500':'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${skipDups?'right-0.5':'left-0.5'}`} />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-700">Ignorar duplicatas</p>
              <p className="text-[9px] text-gray-400">Numeros ja existentes serao pulados</p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Cancelar</button>
            <button onClick={handleAdd} className="flex-1 py-3 rounded-xl font-black text-white"
              style={{background:`linear-gradient(135deg,${C.purple},#5046b0)`}}>Adicionar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────
function ProspectsStats({ contacts }) {
  const s = Object.fromEntries(
    KANBAN_COLS.map(col => [col, contacts.filter(c => c.column === col).length])
  );
  s.total = contacts.length;
  const conv = (s.sent||0) > 0 ? Math.round((s.accepted / ((s.accepted||0) + (s.rejected||1))) * 100) : 0;

  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
      {[
        { v: s.total,      l: 'Total',       c: 'text-gray-700',    bg: 'bg-gray-50',    b: 'border-gray-200' },
        { v: s.waiting,    l: 'Em Espera',   c: 'text-slate-600',   bg: 'bg-slate-50',   b: 'border-slate-200' },
        { v: s.pending,    l: 'Pendentes',   c: 'text-amber-600',   bg: 'bg-amber-50',   b: 'border-amber-200' },
        { v: s.sent,       l: 'Enviados',    c: 'text-blue-600',    bg: 'bg-blue-50',    b: 'border-blue-200' },
        { v: s.replied,    l: 'Responderam', c: 'text-violet-600',  bg: 'bg-violet-50',  b: 'border-violet-200' },
        { v: s.interested, l: 'Interessados',c: 'text-orange-600',  bg: 'bg-orange-50',  b: 'border-orange-200' },
        { v: s.accepted,   l: 'Convertidos', c: 'text-emerald-600', bg: 'bg-emerald-50', b: 'border-emerald-200' },
        { v: `${conv}%`,   l: 'Conversao',   c: 'text-purple-600',  bg: 'bg-purple-50',  b: 'border-purple-200' },
      ].map(({ v, l, c, bg, b }) => (
        <div key={l} className={`${bg} border ${b} rounded-2xl px-2 py-2.5 text-center`}>
          <p className={`text-lg font-black ${c} leading-none`}>{v}</p>
          <p className="text-[8px] font-bold text-gray-400 mt-0.5 leading-tight">{l}</p>
        </div>
      ))}
    </div>
  );
}

// ─── WAITING LIST ─────────────────────────────────────────────────────────────
function WaitingList({ contacts, onMoveToQueue, onDelete, onOpenDetail }) {
  const [selected, setSelected] = useState(new Set());
  const waiting = contacts.filter(c => c.column === 'waiting');

  const toggle = (id) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const selectAll = () => setSelected(selected.size === waiting.length ? new Set() : new Set(waiting.map(c => c.id)));

  const moveSelected = (col) => {
    selected.forEach(id => onMoveToQueue(id, col));
    setSelected(new Set());
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <Inbox size={14} style={{color:C.purple}} />
        <p className="text-sm font-black text-gray-700 flex-1">Em Espera <span className="text-gray-400 font-bold">({waiting.length})</span></p>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <button onClick={() => moveSelected('pending')}
              className="flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-xl text-white"
              style={{background:`linear-gradient(135deg,${C.purple},#5046b0)`}}>
              <Send size={9} /> Mover {selected.size} para Pendente
            </button>
            <button onClick={() => setSelected(new Set())} className="text-[9px] font-black text-gray-400 px-2 py-1.5 rounded-xl border border-gray-200">
              Limpar
            </button>
          </div>
        )}
        <button onClick={selectAll} className="text-[9px] font-black text-purple-500 hover:underline">
          {selected.size === waiting.length ? 'Desmarcar' : 'Selecionar todos'}
        </button>
      </div>

      {waiting.length === 0 ? (
        <div className="py-10 text-center text-gray-300">
          <Inbox size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-bold">Nenhum contato em espera</p>
          <p className="text-xs text-gray-300 mt-1">Adicione contatos como "Em Espera" para organizar antes de disparar</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
          {waiting.map(c => (
            <div key={c.id} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${selected.has(c.id)?'bg-purple-50':''}`}
              onClick={() => toggle(c.id)}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected.has(c.id)?'bg-purple-500 border-purple-500':'border-gray-300'}`}>
                {selected.has(c.id) && <Check size={9} className="text-white" />}
              </div>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0"
                style={{background:`${C.purple}15`, color:C.purple}}>
                {c.name?c.name[0].toUpperCase():c.phone.slice(-2)}
              </div>
              <div className="flex-1 min-w-0">
                {c.name && <p className="text-[11px] font-black text-gray-700 leading-none">{c.name}</p>}
                <p className="text-[11px] font-bold text-gray-500">{c.phone}</p>
                {c.note && <p className="text-[9px] text-gray-400 truncate italic">{c.note}</p>}
              </div>
              {(c.sentCount||0) > 0 && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-400 border border-blue-100 flex-shrink-0">
                  {c.sentCount}x env.
                </span>
              )}
              <div className="flex gap-1">
                <button onClick={e => { e.stopPropagation(); onOpenDetail(c); }}
                  className="p-1.5 text-gray-300 hover:text-purple-500 hover:bg-purple-50 rounded-lg">
                  <Eye size={11} />
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                  className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminProspects() {
  const [tab,          setTab]          = useState('kanban');
  const [contacts,     setContacts]     = useState(() => loadLocal());
  const [templates,    setTemplates]    = useState(() => loadTemplatesLocal());
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [search,       setSearch]       = useState('');
  const [filterCol,    setFilterCol]    = useState('all');
  const [detailContact,setDetailContact]= useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [showTemplates,setShowTemplates]= useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [waConnected,  setWaConnected]  = useState(false);
  const [sending,      setSending]      = useState(false);
  const [syncing,      setSyncing]      = useState(false);
  const fileRef = useRef();

  const activeTmpl = activeTemplate || templates[0];

  // Persiste no localStorage toda vez que contacts muda
  useEffect(() => { saveLocal(contacts); }, [contacts]);
  useEffect(() => { saveTemplatesLocal(templates); }, [templates]);

  // Tenta carregar da API na montagem
  useEffect(() => {
    api.get('/prospects').then(r => {
      if (Array.isArray(r.data) && r.data.length > 0) setContacts(r.data);
    }).catch(() => {/* usa localStorage */});
  }, []);

  // ── CONTACT ACTIONS ─────────────────────────────────────────────────────────
  const moveContact = useCallback(async (id, column) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, column } : c));
    api.patch(`/prospects/${id}/status`, { status: column }).catch(() => {});
  }, []);

  const editContact = useCallback((id, fields) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  }, []);

  const deleteContact = useCallback((id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    api.delete(`/prospects/${id}`).catch(() => {});
  }, []);

  const addContacts = useCallback((items, targetCol = 'waiting') => {
    const news = items.map(item => ({
      id:         genId(),
      phone:      item.phone,
      note:       item.note  || '',
      name:       item.name  || '',
      column:     targetCol,
      sentAt:     null,
      sentCount:  0,
      tags:       [],
      score:      0,
    }));
    setContacts(prev => [...prev, ...news]);
    // Salva na API
    news.forEach(c => api.post('/prospects', c).catch(() => {}));
  }, []);

 // Envio via Gateway ou fallback manual
  const sendWA = useCallback(async (contact, template) => {
    const tmpl   = template || activeTmpl;
    // Só envia URL pública — base64 não funciona no WA Gateway
    const imgUrl = (tmpl?.imageUrl && tmpl.imageUrl.startsWith('http')) ? tmpl.imageUrl : undefined;
    const text   = tmpl?.message || '';
    // Se tem link configurado no template, envia como mensagem separada após o texto
    const linkUrl = tmpl?.linkUrl || '';

    if (waConnected) {
      setSending(true);
      try {
        // AQUI ESTÁ A CORREÇÃO: Limpamos a formatação antes de enviar para a API
        const limpo = toWANum(contact.phone);

        // Envia imagem + texto (se tiver imagem)
        if (imgUrl) {
          await api.post('/prospects/send', {
            phone:      limpo,
            text,
            imageUrl:   imgUrl,
            prospectId: contact.id,
            scriptId:   tmpl?.id,
          });
        } else {
          await api.post('/prospects/send', {
            phone:      limpo,
            text,
            prospectId: contact.id,
            scriptId:   tmpl?.id,
          });
        }
        // Envia link separado (gera preview rico no WA)
        if (linkUrl) {
          await api.post('/prospects/send', {
            phone:      limpo,
            text:       linkUrl,
            prospectId: contact.id,
            scriptId:   `${tmpl?.id}_link`,
          });
        }
        setContacts(prev => prev.map(c => c.id === contact.id
          ? { ...c, column: 'sent', sentAt: new Date().toISOString(), sentCount: (c.sentCount || 0) + 1 }
          : c
        ));
      } catch (e) {
        alert('Erro ao enviar: ' + (e.response?.data?.error || e.message));
      } finally { setSending(false); }
    } else {
      // Fallback manual — abre WA com texto
      const fullText = linkUrl ? `${text}\n\n${linkUrl}` : text;
      window.open(`https://wa.me/${toWANum(contact.phone)}?text=${encodeURIComponent(fullText)}`, '_blank');
      setContacts(prev => prev.map(c => c.id === contact.id
        ? { ...c, column: 'sent', sentAt: new Date().toISOString(), sentCount: (c.sentCount || 0) + 1 }
        : c
      ));
      api.patch(`/prospects/${contact.id}/status`, { status: 'sent' }).catch(() => {});
    }
  }, [waConnected, activeTmpl]);

  const syncToAPI = async () => {
    setSyncing(true);
    try {
      await Promise.all(contacts.map(c => api.post('/prospects', c).catch(() => {})));
    } finally { setSyncing(false); }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: 'application/json' });
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `gatedo-prospects-${new Date().toISOString().slice(0,10)}.json`,
    }).click();
  };

  const importJSON = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const arr = JSON.parse(ev.target.result);
        if (Array.isArray(arr)) addContacts(arr.map(item => ({
          ...item,
          phone: formatPhone(item.phone || ''),
        })), 'waiting');
      } catch { alert('JSON invalido.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filtered = (col) => contacts
    .filter(c => col === 'all' ? true : c.column === col)
    .filter(c => !search || c.phone.includes(search) || c.name?.toLowerCase().includes(search.toLowerCase()));

  const pendingCount = contacts.filter(c => c.column === 'pending').length;
  const waitingCount = contacts.filter(c => c.column === 'waiting').length;

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Target size={20} style={{color:C.purple}} />
            Maquina de Prospeccao
          </h2>
          <p className="text-xs text-gray-400">CRM · Kanban · Gateway WA · Templates · Persistente</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowTemplates(true)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 text-xs font-black flex items-center gap-1.5 hover:border-purple-300 hover:text-purple-500">
            <Bot size={12} /> Templates
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 text-xs font-black flex items-center gap-1.5 hover:border-purple-300">
            <Upload size={12} /> Importar
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
          <button onClick={exportJSON}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 text-xs font-black flex items-center gap-1.5 hover:border-purple-300">
            <Download size={12} /> Exportar
          </button>
          <button onClick={syncToAPI} disabled={syncing}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 text-xs font-black flex items-center gap-1.5 hover:border-purple-300 disabled:opacity-50">
            <RefreshCw size={12} className={syncing?'animate-spin':''} /> Sync API
          </button>
          {pendingCount > 0 && (
            <button onClick={() => setShowSequence(true)}
              className="px-3 py-2.5 rounded-xl font-black text-xs text-white flex items-center gap-1.5"
              style={{background:'linear-gradient(135deg,#25D366,#128C7E)', boxShadow:'0 4px 16px rgba(37,211,102,0.3)'}}>
              <Zap size={12} /> Disparar {pendingCount}
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="px-3 py-2.5 rounded-xl font-black text-xs text-white flex items-center gap-1.5"
            style={{background:`linear-gradient(135deg,${C.purple},#5046b0)`, boxShadow:'0 4px 16px rgba(97,88,202,.3)'}}>
            <Plus size={12} /> Novo Lead
          </button>
        </div>
      </div>

      {/* WA STATUS + QR inline */}
      <WaStatusBar onStatusChange={setWaConnected} />

      {/* STATS */}
      <ProspectsStats contacts={contacts} />

      {/* TEMPLATE ATIVO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={13} style={{color:C.purple}} />
            <p className="text-xs font-black text-gray-600">Template Ativo</p>
          </div>
          <button onClick={() => setShowTemplates(true)} className="text-[9px] font-black text-purple-500 hover:underline">
            Gerenciar templates
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {templates.map(t => (
            <button key={t.id} onClick={() => setActiveTemplate(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-[10px] font-black transition-all ${activeTmpl?.id===t.id?'border-purple-300 bg-purple-50 text-purple-600':'border-gray-100 text-gray-400 hover:border-gray-200'}`}>
              <div className="w-1.5 h-1.5 rounded-full" style={{background:t.color||C.purple}} />
              {t.name}
              {t.imageUrl && <ImageIcon size={8} className="text-blue-400" />}
            </button>
          ))}
        </div>
        {activeTmpl && (
          <div className="mt-3 space-y-2">
            {activeTmpl.imageUrl && activeTmpl.imageUrl.startsWith('http') && (
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <img src={activeTmpl.imageUrl} alt="" className="w-full max-h-28 object-cover"
                  onError={e => e.target.parentElement.style.display='none'} />
              </div>
            )}
            <div className="bg-[#ECE5DD] rounded-xl p-3 max-h-24 overflow-y-auto">
              <div className="bg-white rounded-[12px] rounded-tl-sm px-3 py-2 shadow-sm">
                <p className="text-[10px] text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">{activeTmpl.message}</p>
              </div>
            </div>
            {activeTmpl.linkUrl && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                <Link size={10} className="text-blue-400 flex-shrink-0" />
                <span className="text-[9px] font-bold text-blue-500 truncate">{activeTmpl.linkUrl}</span>
                <span className="text-[8px] text-blue-300 flex-shrink-0">preview rico</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WAITING LIST */}
      {waitingCount > 0 && (
        <WaitingList contacts={contacts} onMoveToQueue={moveContact}
          onDelete={deleteContact} onOpenDetail={setDetailContact} />
      )}

      {/* TABS */}
      <div className="flex bg-white border border-gray-100 rounded-2xl p-1 shadow-sm w-fit">
        {[['kanban','Kanban'],['list','Lista']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${tab===id?'bg-purple-600 text-white shadow-md':'text-gray-400 hover:text-gray-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* KANBAN */}
      {tab === 'kanban' && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-sm w-fit">
            <Search size={13} className="text-gray-400" />
            <input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm font-bold text-gray-700 w-40" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {KANBAN_COLS.map(col => (
              <KanbanColumn key={col} colId={col}
                contacts={filtered(col)}
                onMove={moveContact} onEdit={editContact}
                onDelete={deleteContact} onSendWA={sendWA}
                onOpenDetail={setDetailContact} waConnected={waConnected} />
            ))}
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3">
              <Radio size={14} className="text-emerald-500 animate-pulse flex-shrink-0" />
              <p className="text-sm text-emerald-700 font-bold flex-1">{pendingCount} leads aguardando disparo</p>
              <button onClick={() => setShowSequence(true)}
                className="px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5">
                <Zap size={11} /> Iniciar
              </button>
            </div>
          )}
        </div>
      )}

      {/* LISTA */}
      {tab === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Search size={12} className="text-gray-400" />
              <input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                className="outline-none text-sm font-bold text-gray-700 w-36" />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setFilterCol('all')}
                className={`text-[9px] font-black px-2.5 py-1.5 rounded-xl border transition-all ${filterCol==='all'?'bg-purple-600 text-white border-purple-600':'border-gray-200 text-gray-500'}`}>
                Todos ({contacts.length})
              </button>
              {KANBAN_COLS.map(col => {
                const s = LEAD_STATUS[col];
                const Icon = s.icon;
                const cnt = contacts.filter(c => c.column === col).length;
                if (cnt === 0) return null;
                return (
                  <button key={col} onClick={() => setFilterCol(col)}
                    className={`text-[9px] font-black px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${filterCol===col?`${s.bg} ${s.color} ${s.border}`:'border-gray-200 text-gray-500'}`}>
                    <Icon size={8} /> {s.label} ({cnt})
                  </button>
                );
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left px-4 py-2">Lead</th>
                  <th className="text-left px-4 py-2">Telefone</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Score</th>
                  <th className="text-left px-4 py-2">Envios</th>
                  <th className="text-right px-4 py-2">Acao</th>
                </tr>
              </thead>
              <tbody>
                {filtered(filterCol).map((c, i) => (
                  <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i%2!==0?'bg-gray-50/30':''}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                          style={{background:`linear-gradient(135deg,${C.purple},#5046b0)`}}>
                          {(c.name||c.phone)[0]?.toUpperCase()}
                        </div>
                        <span className="text-[12px] font-bold text-gray-700">{c.name||'—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] font-bold text-gray-500">{c.phone}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={c.column} size="xs" /></td>
                    <td className="px-4 py-2.5 w-20"><ScoreBar score={c.score} /></td>
                    <td className="px-4 py-2.5">
                      {(c.sentCount||0) > 0
                        ? <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">{c.sentCount}x</span>
                        : <span className="text-[9px] text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetailContact(c)} className="p-1.5 rounded-lg text-gray-300 hover:text-purple-500 hover:bg-purple-50">
                          <Eye size={11} />
                        </button>
                        <button onClick={() => sendWA(c, activeTmpl)} className="p-1.5 rounded-lg text-gray-300 hover:text-emerald-500 hover:bg-emerald-50">
                          {waConnected ? <Send size={11} /> : <MessageCircle size={11} />}
                        </button>
                        <button onClick={() => deleteContact(c.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered(filterCol).length === 0 && (
              <div className="py-10 text-center text-gray-300">
                <Users size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">Nenhum lead encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAdd && (
        <AddContactModal onClose={() => setShowAdd(false)} onAdd={addContacts} existingContacts={contacts} />
      )}
      {showTemplates && (
        <TemplateManager templates={templates} onSave={setTemplates} onClose={() => setShowTemplates(false)} />
      )}
      {showSequence && (
        <SequenceFire contacts={contacts} onSendWA={sendWA} onClose={() => setShowSequence(false)}
          activeTemplate={activeTmpl} waConnected={waConnected} />
      )}
      {detailContact && (
        <LeadDetailDrawer
          contact={detailContact}
          onClose={() => setDetailContact(null)}
          onSendWA={sendWA}
          onMove={moveContact}
          onEdit={editContact}
          templates={templates}
          activeTemplate={activeTmpl}
          onSetActiveTemplate={setActiveTemplate}
          waConnected={waConnected}
          sending={sending}
        />
      )}
    </div>
  );
}