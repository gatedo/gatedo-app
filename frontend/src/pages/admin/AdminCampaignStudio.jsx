import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Megaphone, Plus, X, Copy, CheckCircle2, Clock, Edit3,
  Trash2, Star, Link2, Lightbulb, Search, ExternalLink,
  Target, TrendingUp, AlertTriangle, Zap, BarChart2,
  ChevronRight, ChevronDown, Save, RefreshCw, Hash,
  Sparkles, BookOpen, Archive, Move, GripVertical,
  DollarSign, Eye, MousePointer, Download, Heart,
  PlayCircle, Tag, Filter, Image, FolderOpen, Send,
  Calendar, Instagram, MessageCircle, Mail, Smartphone,
  Video, Cloud, Wand2, Share2, Layers
} from 'lucide-react';

const P = '#8B4AFF';
const A = '#ebfc66';

// ─── localStorage hook ───────────────────────────────────────────────────────
function useLS(key, initial) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; }
    catch { return initial; }
  });
  const set = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === 'function' ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);
  return [val, set];
}

// ─── Meta Naming Convention ──────────────────────────────────────────────────
const META_OBJECTIVES = ['Conversao','Trafego','Awareness','Cadastros','Visualizacoes','Alcance','Engajamento'];
const META_AUDIENCES   = ['Frio-Amplo','Frio-Raca','Retargeting-Instalou','Retargeting-Visitou','Lookalike-Tutores','Lookalike-Compradores','Remarketing-App'];
const META_PLACEMENTS  = ['Feed','Stories','Reels','Audience-Network','Todos'];
const META_FORMATS     = ['Video','Carrossel','Static','UGC','DynamicCreative'];

function MetaNaming() {
  const [obj, setObj]    = useState('Conversao');
  const [aud, setAud]    = useState('Frio-Amplo');
  const [plac, setPlac]  = useState('Reels');
  const [fmt, setFmt]    = useState('Video');
  const [hook, setHook]  = useState('');
  const [version, setVersion] = useState('v1');
  const [copied, setCopied]   = useState('');

  const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const campaign = `GATEDO_${obj}_${today}`;
  const adset    = `AS_${aud}_${plac}`;
  const ad       = `AD_${fmt}_${hook ? hook.slice(0,20).replace(/\s/g,'_').toUpperCase() : 'HOOK'}_${version}`;

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).catch(()=>{});
    setCopied(key); setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Objetivo', val: obj, set: setObj, opts: META_OBJECTIVES },
          { label: 'Público', val: aud, set: setAud, opts: META_AUDIENCES },
          { label: 'Placement', val: plac, set: setPlac, opts: META_PLACEMENTS },
          { label: 'Formato', val: fmt, set: setFmt, opts: META_FORMATS },
        ].map(f => (
          <div key={f.label}>
            <p className="text-[10px] font-black text-gray-400 mb-1">{f.label}</p>
            <select value={f.val} onChange={e => f.set(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:border-purple-300">
              {f.opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <p className="text-[10px] font-black text-gray-400 mb-1">Hook (resumo)</p>
          <input value={hook} onChange={e => setHook(e.target.value)} placeholder="ex: DorRenal, FotoGato..."
            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:border-purple-300" />
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 mb-1">Versão</p>
          <input value={version} onChange={e => setVersion(e.target.value)} placeholder="v1"
            className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:border-purple-300" />
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: '📁 Campanha', val: campaign, key: 'camp' },
          { label: '👥 Conjunto de Anúncios', val: adset, key: 'adset' },
          { label: '🖼️ Anúncio', val: ad, key: 'ad' },
        ].map(row => (
          <div key={row.key} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-gray-400 mb-0.5">{row.label}</p>
              <p className="text-xs font-mono font-bold text-gray-800 truncate">{row.val}</p>
            </div>
            <button onClick={() => copy(row.val, row.key)}
              className="p-1.5 rounded-lg hover:bg-purple-100 flex-shrink-0 transition-colors"
              style={{ color: P }}>
              {copied === row.key ? <CheckCircle2 size={13}/> : <Copy size={13}/>}
            </button>
          </div>
        ))}
        <button onClick={() => copy(`${campaign}\n${adset}\n${ad}`, 'all')}
          className="w-full py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95"
          style={{ backgroundColor: P }}>
          {copied === 'all' ? '✅ Copiado!' : 'Copiar nomenclatura completa'}
        </button>
      </div>
    </div>
  );
}

// ─── Kanban Board ────────────────────────────────────────────────────────────
const KANBAN_COLS = [
  { id: 'todo',     label: 'A Fazer',     color: '#6b7280' },
  { id: 'doing',    label: 'Em Progresso',color: P },
  { id: 'review',   label: 'Revisão',     color: '#f59e0b' },
  { id: 'done',     label: 'Concluído',   color: '#10b981' },
];

const INIT_TASKS = [
  { id: 1, col: 'todo',   text: 'Gravar Reels — hook "3 sinais de doença renal"', tag: 'Criativo', priority: 'Alta' },
  { id: 2, col: 'todo',   text: 'Configurar campanha Meta Ads — Aquisição Frio', tag: 'Mídia paga', priority: 'Alta' },
  { id: 3, col: 'doing',  text: 'Briefar influencer @dra.renata.felinos', tag: 'Influencer', priority: 'Média' },
  { id: 4, col: 'doing',  text: 'Escrever copy do email de reativação', tag: 'Copy', priority: 'Alta' },
  { id: 5, col: 'review', text: 'Revisar carrossel "5 cuidados de inverno"', tag: 'Criativo', priority: 'Média' },
  { id: 6, col: 'done',   text: 'Publicar desafio Studio #MeuGatoArtista', tag: 'UGC', priority: 'Alta' },
];

const TAG_COLORS = { 'Criativo':'#8B4AFF', 'Mídia paga':'#3b82f6', 'Influencer':'#ec4899', 'Copy':'#f59e0b', 'UGC':'#f97316', 'B2B':'#10b981', 'Outros':'#6b7280' };
const PRIORITIES = ['Alta','Média','Baixa'];
const TAGS = Object.keys(TAG_COLORS);

function KanbanBoard() {
  const [tasks, setTasks] = useLS('gatedo_kanban', INIT_TASKS);
  const [newText, setNewText] = useState('');
  const [newTag, setNewTag]   = useState('Criativo');
  const [newPrio, setNewPrio] = useState('Média');
  const [newCol, setNewCol]   = useState('todo');
  const [adding, setAdding]   = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const addTask = () => {
    if (!newText.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), col: newCol, text: newText.trim(), tag: newTag, priority: newPrio }]);
    setNewText(''); setAdding(false);
  };

  const moveTask = (id, col) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, col } : t));

  const deleteTask = (id) =>
    setTasks(prev => prev.filter(t => t.id !== id));

  const onDragStart = (e, id) => { setDragging(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver  = (e, col) => { e.preventDefault(); setDragOver(col); };
  const onDrop      = (e, col) => { e.preventDefault(); if (dragging) { moveTask(dragging, col); } setDragging(null); setDragOver(null); };

  const totalByCol = col => tasks.filter(t => t.col === col).length;

  return (
    <div className="space-y-4">
      {/* Add task bar */}
      {!adding ? (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all active:scale-95"
          style={{ backgroundColor: P }}>
          <Plus size={14} /> Nova tarefa
        </button>
      ) : (
        <div className="bg-white border border-purple-200 rounded-2xl p-4 space-y-3 shadow-md">
          <textarea value={newText} onChange={e => setNewText(e.target.value)}
            placeholder="Descreva a tarefa..."
            className="w-full text-xs border border-gray-200 rounded-xl p-2.5 resize-none focus:outline-none focus:border-purple-300 min-h-[60px]" />
          <div className="flex gap-2 flex-wrap">
            <select value={newCol} onChange={e => setNewCol(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none">
              {KANBAN_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={newTag} onChange={e => setNewTag(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none">
              {TAGS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={newPrio} onChange={e => setNewPrio(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none">
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <button onClick={addTask}
              className="px-3 py-1.5 rounded-xl text-xs font-black text-white" style={{ backgroundColor: P }}>
              Adicionar
            </button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-xl text-xs text-gray-500 bg-gray-100">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {KANBAN_COLS.map(col => (
          <div key={col.id}
            onDragOver={e => onDragOver(e, col.id)}
            onDrop={e => onDrop(e, col.id)}
            className={`rounded-2xl p-3 min-h-[200px] transition-colors ${dragOver === col.id ? 'bg-purple-50' : 'bg-gray-50/70'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <p className="text-xs font-black text-gray-700">{col.label}</p>
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded-full">
                {totalByCol(col.id)}
              </span>
            </div>
            <div className="space-y-2">
              {tasks.filter(t => t.col === col.id).map(task => (
                <div key={task.id} draggable
                  onDragStart={e => onDragStart(e, task.id)}
                  className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-purple-100 transition-all cursor-grab active:cursor-grabbing group">
                  <p className="text-xs text-gray-800 font-medium leading-relaxed mb-2">{task.text}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md text-white"
                        style={{ backgroundColor: TAG_COLORS[task.tag] || '#6b7280' }}>{task.tag}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md
                        ${task.priority === 'Alta' ? 'bg-red-50 text-red-500' : task.priority === 'Média' ? 'bg-amber-50 text-amber-500' : 'bg-gray-100 text-gray-400'}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {KANBAN_COLS.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} onClick={() => moveTask(task.id, c.id)} title={`Mover para ${c.label}`}
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[8px] font-black hover:scale-110 transition-transform"
                          style={{ backgroundColor: c.color }}>
                          {c.label[0]}
                        </button>
                      ))}
                      <button onClick={() => deleteTask(task.id)}
                        className="w-5 h-5 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors">
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {dragOver === col.id && (
                <div className="border-2 border-dashed rounded-xl h-12 flex items-center justify-center text-[10px] text-purple-300 font-bold"
                  style={{ borderColor: P }}>Soltar aqui</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Copy Editor ─────────────────────────────────────────────────────────────
const EDITOR_TEMPLATES = [
  { id: 'hook', label: '🎣 Hook', placeholder: 'Os primeiros 3 segundos que param o scroll...' },
  { id: 'headline', label: '📢 Headline', placeholder: 'Título principal do anúncio...' },
  { id: 'body', label: '📝 Body Copy', placeholder: 'Texto principal do anúncio ou legenda...' },
  { id: 'cta', label: '👉 CTA', placeholder: 'Call to action...' },
  { id: 'script', label: '🎬 Roteiro', placeholder: 'Roteiro completo do vídeo...' },
  { id: 'email', label: '📧 E-mail', placeholder: 'Assunto + corpo do email...' },
];

function CopyEditor() {
  const [docs, setDocs] = useLS('gatedo_copies', {});
  const [active, setActive] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);

  const docList = Object.keys(docs);

  const createDoc = () => {
    if (!newName.trim()) return;
    const id = `doc_${Date.now()}`;
    setDocs(prev => ({ ...prev, [id]: { name: newName.trim(), fields: {}, drive: '', updatedAt: new Date().toISOString() } }));
    setActive(id); setNewName(''); setCreating(false);
  };

  const updateField = (docId, fieldId, val) => {
    setDocs(prev => ({
      ...prev,
      [docId]: { ...prev[docId], fields: { ...prev[docId].fields, [fieldId]: val }, updatedAt: new Date().toISOString() }
    }));
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setSaved(true); setTimeout(() => setSaved(false), 1500); }, 600);
  };

  const updateDrive = (docId, val) => {
    setDocs(prev => ({ ...prev, [docId]: { ...prev[docId], drive: val } }));
  };

  const deleteDoc = (id) => {
    setDocs(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (active === id) setActive(null);
  };

  const currentDoc = active ? docs[active] : null;

  return (
    <div className="flex gap-4 min-h-[500px]">
      {/* Sidebar */}
      <div className="w-48 flex-shrink-0 space-y-2">
        <button onClick={() => setCreating(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-white"
          style={{ backgroundColor: P }}>
          <Plus size={12} /> Novo copy
        </button>
        {creating && (
          <div className="space-y-1.5">
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createDoc()}
              placeholder="Nome do copy..."
              className="w-full text-xs border border-purple-300 rounded-xl px-2 py-1.5 focus:outline-none" />
            <div className="flex gap-1">
              <button onClick={createDoc} className="flex-1 text-[10px] py-1 rounded-lg text-white font-black" style={{ backgroundColor: P }}>Criar</button>
              <button onClick={() => setCreating(false)} className="flex-1 text-[10px] py-1 rounded-lg bg-gray-100 text-gray-500">✕</button>
            </div>
          </div>
        )}
        {docList.map(id => (
          <div key={id}
            className={`flex items-center gap-1.5 px-2 py-2 rounded-xl cursor-pointer transition-all group
              ${active === id ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            style={active === id ? { backgroundColor: P } : {}}
            onClick={() => setActive(id)}>
            <Edit3 size={11} className="flex-shrink-0" />
            <span className="text-[11px] font-bold truncate flex-1">{docs[id].name}</span>
            <button onClick={e => { e.stopPropagation(); deleteDoc(id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
              <Trash2 size={10} />
            </button>
          </div>
        ))}
        {docList.length === 0 && !creating && (
          <p className="text-[10px] text-gray-400 text-center py-4">Nenhum copy salvo</p>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        {!currentDoc ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <Edit3 size={32} className="text-gray-200 mb-3" />
            <p className="text-sm font-black text-gray-400">Selecione ou crie um copy</p>
            <p className="text-xs text-gray-300 mt-1">Todos os textos são salvos automaticamente</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-gray-900">{currentDoc.name}</p>
              <div className="flex items-center gap-2">
                {saved && <span className="text-[10px] text-green-500 font-bold flex items-center gap-1"><CheckCircle2 size={11} /> Salvo</span>}
                <span className="text-[9px] text-gray-400">
                  {currentDoc.updatedAt ? `Atualizado ${new Date(currentDoc.updatedAt).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}` : ''}
                </span>
              </div>
            </div>

            {/* Drive link */}
            <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <FolderOpen size={13} className="text-blue-500 flex-shrink-0" />
              <input value={currentDoc.drive || ''} onChange={e => updateDrive(active, e.target.value)}
                placeholder="Cole o link do Google Drive (pasta ou arquivo do criativo)..."
                className="flex-1 text-xs bg-transparent focus:outline-none text-blue-700 placeholder-blue-300" />
              {currentDoc.drive && (
                <a href={currentDoc.drive} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 text-blue-500 hover:text-blue-700">
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Fields */}
            {EDITOR_TEMPLATES.map(tmpl => {
              const val = currentDoc.fields?.[tmpl.id] || '';
              const isScript = tmpl.id === 'script' || tmpl.id === 'email' || tmpl.id === 'body';
              return (
                <div key={tmpl.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-500">{tmpl.label}</p>
                    <span className={`text-[9px] font-bold ${val.length > 280 ? 'text-red-400' : 'text-gray-300'}`}>
                      {val.length} chars
                    </span>
                  </div>
                  <textarea value={val}
                    onChange={e => updateField(active, tmpl.id, e.target.value)}
                    placeholder={tmpl.placeholder}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-purple-300 leading-relaxed"
                    rows={isScript ? 5 : 2} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Brainstorm Bank ─────────────────────────────────────────────────────────
const NOTE_COLORS = ['#fffbeb','#f0fdf4','#eff6ff','#fdf4ff','#fff1f2','#f0fdfa'];

function BrainstormBank() {
  const [ideas, setIdeas]   = useLS('gatedo_ideas', []);
  const [links, setLinks]   = useLS('gatedo_links', []);
  const [tab, setTab]       = useState('ideas');
  const [newIdea, setNewIdea] = useState('');
  const [newIdeaTag, setNewIdeaTag] = useState('Criativo');
  const [newUrl, setNewUrl]   = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLinkCat, setNewLinkCat] = useState('Referência');

  const LINK_CATS = ['Referência','Concorrente','Inspiração','Ad Spy','Parceiro','Ferramenta'];

  const addIdea = () => {
    if (!newIdea.trim()) return;
    setIdeas(prev => [{ id: Date.now(), text: newIdea.trim(), tag: newIdeaTag,
      color: NOTE_COLORS[Math.floor(Math.random()*NOTE_COLORS.length)],
      starred: false, createdAt: new Date().toLocaleDateString('pt-BR') }, ...prev]);
    setNewIdea('');
  };

  const addLink = () => {
    if (!newUrl.trim()) return;
    setLinks(prev => [{ id: Date.now(), url: newUrl.trim(), title: newTitle.trim() || newUrl,
      category: newLinkCat, starred: false, createdAt: new Date().toLocaleDateString('pt-BR') }, ...prev]);
    setNewUrl(''); setNewTitle('');
  };

  const toggleStar = (list, setList, id) =>
    setList(prev => prev.map(i => i.id === id ? { ...i, starred: !i.starred } : i));

  const deleteItem = (list, setList, id) =>
    setList(prev => prev.filter(i => i.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm w-fit">
        {[{ id:'ideas', label:'💡 Ideias' },{ id:'links', label:'🔗 Links' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${tab === t.id ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
            style={tab === t.id ? { backgroundColor: P } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ideas' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-start">
            <textarea value={newIdea} onChange={e => setNewIdea(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && addIdea()}
              placeholder="Nova ideia, insight ou referência... (Ctrl+Enter para salvar)"
              className="flex-1 min-w-[200px] text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-purple-300"
              rows={2} />
            <div className="flex flex-col gap-1.5">
              <select value={newIdeaTag} onChange={e => setNewIdeaTag(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none">
                {TAGS.map(t => <option key={t}>{t}</option>)}
              </select>
              <button onClick={addIdea}
                className="px-4 py-1.5 rounded-xl text-xs font-black text-white" style={{ backgroundColor: P }}>
                Salvar
              </button>
            </div>
          </div>

          {/* Starred first */}
          {[...ideas.filter(i => i.starred), ...ideas.filter(i => !i.starred)].map(idea => (
            <div key={idea.id} className="rounded-2xl p-4 border group relative"
              style={{ backgroundColor: idea.color, borderColor: `${idea.color}ee` }}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-800 leading-relaxed flex-1 whitespace-pre-wrap">{idea.text}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggleStar(ideas, setIdeas, idea.id)}
                    className={`p-1 rounded-lg transition-colors ${idea.starred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}>
                    <Star size={13} fill={idea.starred ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => deleteItem(ideas, setIdeas, idea.id)}
                    className="p-1 rounded-lg text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: TAG_COLORS[idea.tag] || '#6b7280' }}>{idea.tag}</span>
                <span className="text-[9px] text-gray-400">{idea.createdAt}</span>
              </div>
            </div>
          ))}
          {ideas.length === 0 && (
            <div className="text-center py-10 text-gray-300">
              <Lightbulb size={28} className="mx-auto mb-2" />
              <p className="text-xs">Nenhuma ideia salva ainda</p>
            </div>
          )}
        </div>
      )}

      {tab === 'links' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap items-start">
            <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
              placeholder="URL do link..."
              className="flex-1 min-w-[200px] text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-300" />
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="Título (opcional)"
              className="w-40 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-300" />
            <select value={newLinkCat} onChange={e => setNewLinkCat(e.target.value)}
              className="text-xs border border-gray-200 rounded-xl px-2 py-2 focus:outline-none">
              {LINK_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={addLink}
              className="px-4 py-2 rounded-xl text-xs font-black text-white" style={{ backgroundColor: P }}>
              Salvar
            </button>
          </div>

          <div className="space-y-2">
            {[...links.filter(l => l.starred), ...links.filter(l => !l.starred)].map(link => (
              <div key={link.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-purple-100 group transition-all">
                <Link2 size={14} className="text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{link.title}</p>
                  <p className="text-[10px] text-gray-400 truncate">{link.url}</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">{link.category}</span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggleStar(links, setLinks, link.id)}
                    className={link.starred ? 'text-amber-400' : 'text-gray-200 hover:text-amber-400'}>
                    <Star size={12} fill={link.starred ? 'currentColor' : 'none'} />
                  </button>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="text-gray-300 hover:text-purple-500 transition-colors">
                    <ExternalLink size={12} />
                  </a>
                  <button onClick={() => deleteItem(links, setLinks, link.id)}
                    className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {links.length === 0 && (
              <div className="text-center py-10 text-gray-300">
                <Link2 size={28} className="mx-auto mb-2" />
                <p className="text-xs">Nenhum link salvo ainda</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sales Diagnosis ─────────────────────────────────────────────────────────
const FUNNEL_STEPS = [
  { id:'impressao', label:'Impressão', icon: Eye,          color:'#6366f1', desc:'Alcance dos criativos', benchmark:'CPM < R$8 = eficiente' },
  { id:'clique',    label:'Clique',    icon: MousePointer, color:'#3b82f6', desc:'CTR do anúncio',        benchmark:'CTR > 1,5% = bom' },
  { id:'download',  label:'Download',  icon: Download,     color: P,        desc:'CPI do app',            benchmark:'CPI < R$3 = eficiente' },
  { id:'ativacao',  label:'Ativação',  icon: Zap,          color:'#f59e0b', desc:'1º gato cadastrado',    benchmark:'Ativação > 40% = saudável' },
  { id:'habito',    label:'Hábito',    icon: Heart,        color:'#10b981', desc:'D7 retention',          benchmark:'D7 > 25% = ótimo' },
];

const SALES_CHECKLIST = [
  { cat: 'Criativos de Conversão', items: [
    { id:'c1', text:'Tenho pelo menos 3 hooks diferentes testados (dor, curiosidade, transformação)', hard: true },
    { id:'c2', text:'Meus vídeos mostram o produto em uso real nos primeiros 3 segundos', hard: true },
    { id:'c3', text:'Tenho UGC (usuário real usando o app) como anúncio', hard: true },
    { id:'c4', text:'Tenho creative com prova social (número de tutores/gatos)', hard: false },
    { id:'c5', text:'Tenho creative de resposta direta (problema + solução + CTA direto)', hard: true },
  ]},
  { cat: 'Configuração de Mídia Paga', items: [
    { id:'m1', text:'Campanha de conversão configurada para evento "Cadastro de gato" (não apenas "instalou")', hard: true },
    { id:'m2', text:'Estou testando pelo menos 3 audiências em paralelo', hard: false },
    { id:'m3', text:'Tenho retargeting de quem visitou a AppStore/Play Store mas não instalou', hard: false },
    { id:'m4', text:'Budget mínimo de R$30/dia por conjunto de anúncios para sair da fase de aprendizado', hard: true },
    { id:'m5', text:'Estou usando Advantage+ Audience ou CBO para otimizar automaticamente', hard: false },
  ]},
  { cat: 'Onboarding e Ativação', items: [
    { id:'o1', text:'O primeiro passo do onboarding é cadastrar o gato (não criar conta)', hard: true },
    { id:'o2', text:'Tenho uma notificação de "bem-vindo" que incentiva completar o perfil do gato', hard: false },
    { id:'o3', text:'Meço a taxa de ativação (% que cadastra o primeiro gato) separadamente do download', hard: true },
    { id:'o4', text:'O valor do app é sentido antes de criar conta (preview de funcionalidades)', hard: false },
    { id:'o5', text:'Tenho email/push para quem baixou mas não completou o perfil em 24h', hard: true },
  ]},
];

function SalesDiagnosis() {
  const [checks, setChecks] = useLS('gatedo_diagnosis', {});
  const [metrics, setMetrics] = useLS('gatedo_metrics', { cpm:'', ctr:'', cpi:'', ativacao:'', d7:'' });

  const toggle = id => setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  const totalItems = SALES_CHECKLIST.reduce((a, c) => a + c.items.length, 0);
  const totalChecked = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((totalChecked / totalItems) * 100);

  const hardMissing = SALES_CHECKLIST.flatMap(c => c.items).filter(i => i.hard && !checks[i.id]);

  const diag = (val, good, warn) => {
    const n = parseFloat(val);
    if (!val || isNaN(n)) return null;
    if (n <= good) return { color: '#10b981', label: '✅ Bom' };
    if (n <= warn) return { color: '#f59e0b', label: '⚠️ Atenção' };
    return { color: '#ef4444', label: '🔴 Melhorar' };
  };

  const metricDiags = {
    cpm:      diag(metrics.cpm, 8, 15),
    ctr:      metrics.ctr ? (parseFloat(metrics.ctr) >= 1.5 ? { color:'#10b981', label:'✅ Bom' } : parseFloat(metrics.ctr) >= 0.8 ? { color:'#f59e0b', label:'⚠️ Atenção' } : { color:'#ef4444', label:'🔴 Melhorar' }) : null,
    cpi:      diag(metrics.cpi, 3, 7),
    ativacao: metrics.ativacao ? (parseFloat(metrics.ativacao) >= 40 ? { color:'#10b981', label:'✅ Bom' } : parseFloat(metrics.ativacao) >= 20 ? { color:'#f59e0b', label:'⚠️ Atenção' } : { color:'#ef4444', label:'🔴 Melhorar' }) : null,
    d7:       metrics.d7 ? (parseFloat(metrics.d7) >= 25 ? { color:'#10b981', label:'✅ Bom' } : parseFloat(metrics.d7) >= 12 ? { color:'#f59e0b', label:'⚠️ Atenção' } : { color:'#ef4444', label:'🔴 Melhorar' }) : null,
  };

  return (
    <div className="space-y-6">

      {/* Funil de diagnóstico */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm font-black text-gray-900 mb-1">🔍 Onde está o gargalo do seu funil?</p>
        <p className="text-xs text-gray-400 mb-4">Preencha seus números reais e veja onde está o bloqueio.</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {FUNNEL_STEPS.map((step, i) => {
            const Icon = step.icon;
            const metricKey = Object.keys(metrics)[i];
            const d = metricDiags[metricKey];
            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${step.color}15` }}>
                  <Icon size={18} style={{ color: step.color }} />
                </div>
                <p className="text-[10px] font-black text-gray-700">{step.label}</p>
                <p className="text-[9px] text-gray-400 mb-2">{step.desc}</p>
                <input value={Object.values(metrics)[i] || ''}
                  onChange={e => setMetrics(prev => { const keys = Object.keys(prev); const upd = {...prev}; upd[keys[i]] = e.target.value; return upd; })}
                  placeholder="valor"
                  className="w-full text-center text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-300" />
                {d && <span className="mt-1 text-[9px] font-bold" style={{ color: d.color }}>{d.label}</span>}
                <p className="text-[8px] text-gray-300 mt-0.5 leading-tight">{step.benchmark}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical missing */}
      {hardMissing.length > 0 && (
        <div className="rounded-2xl p-4 border-l-4 bg-red-50" style={{ borderColor: '#ef4444' }}>
          <p className="text-xs font-black text-red-700 mb-2">🚨 {hardMissing.length} ações críticas em falta que estão bloqueando vendas:</p>
          <div className="space-y-1.5">
            {hardMissing.slice(0,4).map(item => (
              <div key={item.id} className="flex items-start gap-2">
                <AlertTriangle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-gray-900">Score de Prontidão para Vendas</p>
          <span className="text-2xl font-black" style={{ color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }} />
        </div>
        <p className="text-[10px] text-gray-400">{totalChecked}/{totalItems} itens concluídos</p>
      </div>

      {/* Checklist */}
      {SALES_CHECKLIST.map(cat => (
        <div key={cat.cat} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-black text-gray-900 mb-3">{cat.cat}</p>
          <div className="space-y-2">
            {cat.items.map(item => (
              <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                  ${checks[item.id] ? 'border-transparent' : 'border-gray-200 group-hover:border-purple-300'}`}
                  style={checks[item.id] ? { backgroundColor: P } : {}}
                  onClick={() => toggle(item.id)}>
                  {checks[item.id] && <CheckCircle2 size={12} color="white" />}
                </div>
                <div className="flex-1 min-w-0" onClick={() => toggle(item.id)}>
                  <p className={`text-xs leading-relaxed transition-all ${checks[item.id] ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                    {item.text}
                  </p>
                  {item.hard && !checks[item.id] && (
                    <span className="text-[9px] font-black text-red-400">🔑 Crítico para vendas</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Ad Spy ──────────────────────────────────────────────────────────────────
const SPY_RESOURCES = [
  { name: 'Meta Ad Library — Pet BR', url: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=gato&search_type=keyword_unordered', desc: 'Anúncios ativos de "gato" no Brasil agora mesmo. Veja o que está rodando.', tag: 'Essencial', color: '#1877F2' },
  { name: 'Meta Ad Library — Concorrentes', url: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=app+gato&search_type=keyword_unordered', desc: 'Busca específica por "app gato" — veja anúncios de apps concorrentes.', tag: 'Essencial', color: '#1877F2' },
  { name: 'Meta Ad Library — Pet Food', url: 'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=ração+gato&search_type=keyword_unordered', desc: 'Criativos de marcas de ração para gatos. Estude o que elas usam de hook.', tag: 'Referência', color: '#1877F2' },
  { name: 'TikTok Creative Center', url: 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en', desc: 'Top anúncios de performance no TikTok por categoria. Filtre por pet.', tag: 'TikTok', color: '#010101' },
  { name: 'Swipe-Worthy (Swipe Files)', url: 'https://swiped.co/?s=pet', desc: 'Banco de anúncios de alta performance que profissionais de marketing salvam. Busque "pet" e "cat".', tag: 'Swipe File', color: '#f59e0b' },
  { name: 'Foreplay.co', url: 'https://foreplay.co', desc: 'Plataforma de swipe file colaborativo. Salve anúncios do Meta Ad Library e organize por campanha.', tag: 'Ferramenta', color: '#6366f1' },
  { name: 'Atria (ex-Marpipe)', url: 'https://www.atria.ai', desc: 'Analytics de criativos de concorrentes. Veja quais formatos e hooks geram mais performance.', tag: 'Ferramenta', color: '#10b981' },
  { name: 'BigSpy — Categoria Pet', url: 'https://bigspy.com/adspy/?platform=facebook&type=image&country=BR&q=gato', desc: 'Spy tool gratuita com filtro por país. Veja anúncios de pet no BR.', tag: 'Spy Tool', color: '#ef4444' },
];

const CREATIVE_FRAMEWORKS = [
  { name: 'Hook → Problema → Solução → Prova → CTA', type: 'Conversão Direta', example: '"Seu gato está doente e você nem sabe. [3 sinais] O Gatedo detecta antes do vet. 50k tutores já usam. Baixe grátis."' },
  { name: 'Antes vs. Depois', type: 'Transformação', example: '"Antes: caderneta de papel perdida, vacinas esquecidas. Depois: tudo no app, alertas automáticos, histórico completo."' },
  { name: 'Pergunta de Qualificação', type: 'Filtro de público', example: '"Você tem gato em casa? [Sim / Não] Se sim, isso é pra você..."' },
  { name: 'Prova Social Específica', type: 'Credibilidade', example: '"23.000 tutores registraram o gato no Gatedo esse mês. O que eles sabem que você ainda não sabe?"' },
  { name: 'UGC Autêntico', type: 'Confiança', example: '"Texto do storytelling de um tutor real usando o app. Filmado no celular, sem produção."' },
  { name: 'Educação + Pitch', type: 'Warm audience', example: '"5 sinais de doença renal em gatos [carrossel educativo] + slide final: monitore isso tudo no Gatedo."' },
];

function AdSpy() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-4 border-l-4 bg-purple-50" style={{ borderColor: P }}>
        <p className="text-xs font-black mb-1" style={{ color: P }}>🧭 Como usar o Ad Spy para desbloquear criativos</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Abra o Meta Ad Library todo dia por 10 minutos. Busque: "gato", "app gato", "saúde do gato", marcas como "Petlove", "Cobasi". 
          Anúncio rodando há mais de 30 dias = está performando. Copie a <strong>estrutura</strong>, não o texto. 
          Adapte para o contexto do Gatedo. Esse é o processo de todo time de marketing que escala.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SPY_RESOURCES.map(r => (
          <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-md transition-all group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${r.color}15` }}>
              <Search size={16} style={{ color: r.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-black text-gray-900">{r.name}</p>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: r.color }}>{r.tag}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
            </div>
            <ExternalLink size={14} className="flex-shrink-0 text-gray-300 group-hover:text-purple-400 transition-colors mt-0.5" />
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm font-black text-gray-900 mb-4">🎬 Frameworks de Criativos que Convertem</p>
        <div className="space-y-3">
          {CREATIVE_FRAMEWORKS.map((f, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-lg text-[10px] font-black text-white flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: P }}>{i+1}</span>
                <p className="text-xs font-black text-gray-900">{f.name}</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${P}15`, color: P }}>{f.type}</span>
              </div>
              <p className="text-[11px] text-gray-500 italic leading-relaxed pl-7">"{f.example}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
const CHANNELS = [
  { id: 'meta', label: 'Meta Ads', icon: Hash, color: '#1877F2', path: '/admin/meta-ads' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C', path: '/admin/instagram-outreach' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366', path: '/admin/prospects' },
  { id: 'tiktok', label: 'TikTok Ads', icon: Video, color: '#010101', path: 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en' },
  { id: 'push', label: 'Push/In-App', icon: Smartphone, color: P, path: '/admin/notices' },
  { id: 'email', label: 'E-mail', icon: Mail, color: '#10b981', path: '/admin/prospects' },
  { id: 'studio', label: 'Studio', icon: Sparkles, color: '#f59e0b', path: '/studio' },
];

const DEFAULT_SCHEDULE = [
  { id: 1, title: 'Hook saude renal + CTA iGentVet', date: '2026-05-10', time: '09:00', channel: 'instagram', status: 'Brief', objective: 'Atrair tutores de gatos senior', drive: '', thumbnail: '', sequence: 'Saude preventiva', copy: '3 sinais silenciosos que seu gato pode estar dando hoje.', kpi: 'Saves + cadastros' },
  { id: 2, title: 'Studio Challenge #MeuGatoArtista', date: '2026-05-11', time: '18:30', channel: 'tiktok', status: 'Producao', objective: 'Gerar UGC e compartilhamentos', drive: '', thumbnail: '', sequence: 'UGC Studio', copy: 'Mostrei meu gato para o Studio do Gatedo e o resultado...', kpi: 'Outputs Studio' },
  { id: 3, title: 'WhatsApp para vets parceiros', date: '2026-05-12', time: '10:00', channel: 'whatsapp', status: 'Aprovado', objective: 'Ativar clinicas no painel', drive: '', thumbnail: '', sequence: 'B2B Vet', copy: 'Seus pacientes felinos ja podem chegar com historico organizado.', kpi: 'Respostas + demos' },
];

const SEQUENCE_TEMPLATES = [
  { id: 'launch', name: 'Lancamento de feature', items: [['Teaser dor principal', 'instagram'], ['Prova visual da feature', 'meta'], ['Tutorial curto', 'tiktok'], ['Push de ativacao', 'push'], ['Follow-up WhatsApp/Email', 'whatsapp']] },
  { id: 'studio', name: 'UGC Studio', items: [['Antes/depois do Studio', 'instagram'], ['Desafio com hashtag', 'tiktok'], ['Repost de tutor', 'instagram'], ['Retargeting para quem viu', 'meta'], ['Push para criar output', 'push']] },
  { id: 'memorial', name: 'Campanha emocional', items: [['Storytelling de vida do gato', 'instagram'], ['Carrossel educativo acolhedor', 'meta'], ['Email sensivel para tutores antigos', 'email'], ['Conteudo de parceiros', 'whatsapp']] },
];

const APP_SIGNALS = [
  { module: 'iGentVet', angle: 'Saude preventiva', hook: 'Seu gato pode esconder dor por semanas.', audience: 'Gatos senior' },
  { module: 'Studio', angle: 'UGC / viral', hook: 'Transforme seu gato em personagem de campanha.', audience: 'Tutores ativos' },
  { module: 'Gatedopedia', angle: 'Educacional SEO', hook: 'Cada raca tem um cuidado que quase ninguem conta.', audience: 'Busca organica' },
  { module: 'Comunigato', angle: 'Comunidade', hook: 'Gatos parecidos vivem desafios parecidos.', audience: 'SRD e racas' },
  { module: 'Loja', angle: 'Afiliados', hook: 'Itens certos para cada fase da vida felina.', audience: 'Compradores' },
  { module: 'Memorial', angle: 'Marca emocional', hook: 'Uma vida felina merece ser lembrada com beleza.', audience: 'Tutores em luto' },
];

function addDays(date, days) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function getChannel(channelId) {
  return CHANNELS.find((item) => item.id === channelId) || CHANNELS[0];
}

function ContentCalendar() {
  const today = new Date().toISOString().slice(0, 10);
  const [items, setItems] = useLS('gatedo_marketing_calendar_v1', DEFAULT_SCHEDULE);
  const [form, setForm] = useState({ title: '', date: today, time: '09:00', channel: 'instagram', status: 'Brief', objective: '', drive: '', thumbnail: '', sequence: 'Avulso', copy: '', kpi: '' });
  const [sequenceBase, setSequenceBase] = useState(today);
  const [sequenceTemplate, setSequenceTemplate] = useState('launch');
  const [channelFilter, setChannelFilter] = useState('all');

  const filteredItems = [...items]
    .filter((item) => channelFilter === 'all' || item.channel === channelFilter)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const groupedByDate = filteredItems.reduce((acc, item) => {
    acc[item.date] = acc[item.date] || [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const addItem = () => {
    if (!form.title.trim()) return;
    setItems((prev) => [{ ...form, id: Date.now(), title: form.title.trim() }, ...prev]);
    setForm((prev) => ({ ...prev, title: '', objective: '', drive: '', thumbnail: '', copy: '', kpi: '' }));
  };

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));

  const deleteItem = (id) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const generateSequence = () => {
    const template = SEQUENCE_TEMPLATES.find((item) => item.id === sequenceTemplate) || SEQUENCE_TEMPLATES[0];
    const created = template.items.map(([title, channel], index) => ({
      id: Date.now() + index,
      title,
      date: addDays(sequenceBase, index * 2),
      time: index % 2 === 0 ? '09:00' : '18:30',
      channel,
      status: 'Brief',
      objective: `Sequencia: ${template.name}`,
      drive: '',
      thumbnail: '',
      sequence: template.name,
      copy: '',
      kpi: channel === 'meta' ? 'CTR / CPA' : channel === 'tiktok' ? 'Retencao / shares' : 'Engajamento qualificado',
    }));
    setItems((prev) => [...created, ...prev]);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-4">
          <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: P }}>Calendario editorial</p>
                <h3 className="text-lg font-black text-gray-900">Programacao multicanal</h3>
                <p className="text-xs text-gray-500 mt-1">Planeje posts, sequencias, miniaturas e Drive em um so lugar.</p>
              </div>
              <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}
                className="text-xs border border-purple-100 rounded-xl bg-white px-3 py-2 font-bold text-gray-600 focus:outline-none">
                <option value="all">Todos canais</option>
                {CHANNELS.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedByDate).map(([date, dayItems]) => (
              <div key={date} className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} style={{ color: P }} />
                  <p className="text-xs font-black text-gray-700">{new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}</p>
                  <span className="text-[10px] font-bold text-gray-400">({dayItems.length})</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {dayItems.map((item) => {
                    const channel = getChannel(item.channel);
                    const Icon = channel.icon;
                    return (
                      <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm group">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                            {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Image size={22} className="text-gray-300" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: channel.color }}>
                                <Icon size={9} /> {channel.label}
                              </span>
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{item.status}</span>
                              <span className="text-[9px] font-bold text-gray-400">{item.time}</span>
                            </div>
                            <p className="text-sm font-black text-gray-900 leading-tight">{item.title}</p>
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{item.objective || item.copy}</p>
                            <div className="flex gap-1.5 mt-2 flex-wrap">
                              {item.drive && <a href={item.drive} target="_blank" rel="noreferrer" className="text-[9px] font-black px-2 py-1 rounded-lg bg-blue-50 text-blue-600 inline-flex items-center gap-1"><Cloud size={10} /> Drive</a>}
                              {channel.path && <a href={channel.path} target={channel.path.startsWith('http') ? '_blank' : '_self'} rel="noreferrer" className="text-[9px] font-black px-2 py-1 rounded-lg bg-purple-50 text-purple-600 inline-flex items-center gap-1"><ExternalLink size={10} /> Canal</a>}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <input value={item.thumbnail || ''} onChange={(event) => updateItem(item.id, { thumbnail: event.target.value })} placeholder="URL miniatura" className="text-[10px] border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-200" />
                          <input value={item.drive || ''} onChange={(event) => updateItem(item.id, { drive: event.target.value })} placeholder="Link Google Drive" className="text-[10px] border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-200" />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <select value={item.status} onChange={(event) => updateItem(item.id, { status: event.target.value })} className="text-[10px] border border-gray-100 rounded-lg px-2 py-1.5 bg-white">
                            {['Brief','Producao','Revisao','Aprovado','Publicado'].map((status) => <option key={status}>{status}</option>)}
                          </select>
                          <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-gray-900 mb-3">Novo post programado</p>
            <div className="space-y-2">
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Titulo do post/campanha" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-300" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="text-xs border border-gray-200 rounded-xl px-3 py-2" />
                <input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="text-xs border border-gray-200 rounded-xl px-3 py-2" />
              </div>
              <select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white">
                {CHANNELS.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}
              </select>
              <textarea value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} placeholder="Objetivo e publico-alvo" rows={2} className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-purple-300" />
              <input value={form.thumbnail} onChange={(event) => setForm({ ...form, thumbnail: event.target.value })} placeholder="URL da miniatura" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2" />
              <input value={form.drive} onChange={(event) => setForm({ ...form, drive: event.target.value })} placeholder="Link Google Drive" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2" />
              <button onClick={addItem} className="w-full py-2 rounded-xl text-xs font-black text-white" style={{ backgroundColor: P }}>Adicionar ao calendario</button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-gray-900 mb-3">Gerar sequencia</p>
            <div className="grid grid-cols-1 gap-2">
              <select value={sequenceTemplate} onChange={(event) => setSequenceTemplate(event.target.value)} className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white">
                {SEQUENCE_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
              <input type="date" value={sequenceBase} onChange={(event) => setSequenceBase(event.target.value)} className="text-xs border border-gray-200 rounded-xl px-3 py-2" />
              <button onClick={generateSequence} className="w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2" style={{ backgroundColor: A, color: P }}>
                <Wand2 size={13} /> Criar agenda automatica
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-950 p-4 text-white">
            <p className="text-sm font-black mb-3">Canais conectados</p>
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                const count = items.filter((item) => item.channel === channel.id).length;
                return (
                  <a key={channel.id} href={channel.path} target={channel.path.startsWith('http') ? '_blank' : '_self'} rel="noreferrer" className="rounded-xl border border-white/10 p-3 hover:bg-white/10 transition-colors">
                    <Icon size={15} style={{ color: channel.color === '#010101' ? '#fff' : channel.color }} />
                    <p className="text-[10px] font-black mt-2">{channel.label}</p>
                    <p className="text-[9px] text-white/40">{count} itens</p>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketingIntelligence() {
  const [metrics] = useLS('gatedo_metrics', { cpm:'', ctr:'', cpi:'', ativacao:'', d7:'' });
  const [calendarItems] = useLS('gatedo_marketing_calendar_v1', DEFAULT_SCHEDULE);
  const [tasks] = useLS('gatedo_kanban', INIT_TASKS);
  const [ideas] = useLS('gatedo_ideas', []);
  const [links] = useLS('gatedo_links', []);

  const ctr = Number(String(metrics.ctr).replace(',', '.'));
  const ativacao = Number(String(metrics.ativacao).replace(',', '.'));
  const blockers = [
    ctr > 0 && ctr < 1.5 ? 'CTR baixo: priorize hooks de dor/curiosidade e thumbnails com produto em uso.' : null,
    ativacao > 0 && ativacao < 40 ? 'Ativacao baixa: campanhas devem vender o primeiro gato cadastrado, nao apenas o app.' : null,
    tasks.filter((task) => task.priority === 'Alta' && task.col !== 'done').length > 3 ? 'Muitas tarefas altas abertas: reduza escopo e publique sequencias menores.' : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Posts agendados', value: calendarItems.length, icon: Calendar, color: P },
          { label: 'Tarefas abertas', value: tasks.filter((task) => task.col !== 'done').length, icon: BarChart2, color: '#f59e0b' },
          { label: 'Ideias salvas', value: ideas.length, icon: Lightbulb, color: '#10b981' },
          { label: 'Referencias', value: links.length, icon: Link2, color: '#3b82f6' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <Icon size={18} style={{ color: card.color }} />
              <p className="text-[10px] font-black uppercase text-gray-400 mt-3">{card.label}</p>
              <p className="text-2xl font-black text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} style={{ color: P }} />
            <h3 className="text-sm font-black text-gray-900">Angulos do sistema Gatedo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {APP_SIGNALS.map((signal) => (
              <div key={signal.module} className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: P }}>{signal.module}</p>
                <h4 className="text-sm font-black text-gray-900 mt-1">{signal.angle}</h4>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{signal.hook}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-2">Publico: {signal.audience}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-950 text-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} style={{ color: A }} />
            <h3 className="text-sm font-black">Recomendacoes agora</h3>
          </div>
          <div className="space-y-3">
            {(blockers.length ? blockers : [
              'Use Studio + Comunigato como motor de UGC antes de aumentar verba paga.',
              'Toda campanha de Meta deve ter uma versao de retargeting para quem viu Studio/Loja.',
              'WhatsApp deve receber leads quentes: vets, parceiros e tutores que interagiram com saude.',
            ]).map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 p-3 bg-white/5">
                <p className="text-xs text-white/75 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href="/admin/meta-ads" className="rounded-xl px-3 py-2 text-[10px] font-black text-center" style={{ backgroundColor: A, color: P }}>Meta Ads</a>
            <a href="/admin/instagram-outreach" className="rounded-xl px-3 py-2 text-[10px] font-black text-center bg-white/10">Instagram</a>
            <a href="/admin/prospects" className="rounded-xl px-3 py-2 text-[10px] font-black text-center bg-white/10">WhatsApp</a>
            <a href="https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en" target="_blank" rel="noreferrer" className="rounded-xl px-3 py-2 text-[10px] font-black text-center bg-white/10">TikTok Ads</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCampaignStudio() {
  const [activeTab, setActiveTab] = useState('diagnosis');

  const tabs = [
    { id: 'diagnosis', label: '🚨 Destravar Vendas', icon: Target },
    { id: 'calendar',  label: 'Calendario',          icon: Calendar },
    { id: 'kanban',    label: 'Kanban',              icon: BarChart2 },
    { id: 'editor',    label: 'Editor de Copy',       icon: Edit3 },
    { id: 'intel',     label: 'Inteligencia',         icon: Sparkles },
    { id: 'meta',      label: 'Meta Tools',           icon: Hash },
    { id: 'brain',     label: 'Brainstorm',           icon: Lightbulb },
    { id: 'spy',       label: 'Ad Spy',               icon: Search },
  ];

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6"
        style={{ background: `linear-gradient(135deg, #0f0a1e 0%, #1e0638 100%)` }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(ellipse at 8% 60%, ${P} 0%, transparent 50%), radial-gradient(ellipse at 92% 25%, ${A}80 0%, transparent 50%)` }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: A }}>
                <Megaphone size={14} style={{ color: P }} />
              </div>
              <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: A }}>
                Gatedo · Campaign Studio v2
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              Central de Criativos & Conversão
            </h1>
            <p className="text-white/50 text-xs mt-1 max-w-lg">
              Diagnóstico de vendas, kanban persistente, editor de copy, nomeação Meta,
              brainstorm, banco de links e espião de anúncios. Tudo salvo localmente.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Dados salvos localmente', icon: Save },
              { label: 'IA integrada no brief', icon: Sparkles },
              { label: 'Meta naming gerado', icon: Hash },
            ].map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="flex items-center gap-1.5 rounded-xl px-3 py-2 border border-white/10"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <Icon size={12} style={{ color: A }} />
                  <p className="text-[10px] text-white/60 font-medium">{k.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-1 flex-wrap shadow-sm">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          const isUrgent = t.id === 'diagnosis';
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap relative
                ${isActive ? 'text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
              style={isActive ? { backgroundColor: isUrgent ? '#ef4444' : P } : {}}>
              <Icon size={12} />
              {t.label}
              {isUrgent && !isActive && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm min-h-[400px]">
        {activeTab === 'diagnosis' && <SalesDiagnosis />}
        {activeTab === 'calendar'  && <ContentCalendar />}
        {activeTab === 'kanban'    && <KanbanBoard />}
        {activeTab === 'editor'    && <CopyEditor />}
        {activeTab === 'intel'     && <MarketingIntelligence />}
        {activeTab === 'meta'      && (
          <div className="space-y-4">
            <p className="text-sm font-black text-gray-900">🔖 Gerador de Nomenclatura Meta Ads</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Nomenclatura padronizada é essencial para organizar dezenas de campanhas, fazer relatórios e entender o que está performando. Use esse gerador para criar nomes consistentes.
            </p>
            <MetaNaming />
          </div>
        )}
        {activeTab === 'brain' && <BrainstormBank />}
        {activeTab === 'spy'   && <AdSpy />}
      </div>

    </div>
  );
}
