import React, { useState, useCallback, useEffect } from 'react';
import {
  Target, BarChart2, BookOpen, CheckSquare, RefreshCw,
  Plus, Trash2, Edit3, ChevronDown, CheckCircle2, Clock,
  AlertTriangle, TrendingUp, TrendingDown, Minus,
  Star, Zap, Users, DollarSign, Heart, Eye,
  Calendar, Archive, Award, Flag, Save, X,
  ArrowUpRight, ArrowDownRight, Activity, Layers, Search
} from 'lucide-react';
import api from '../../services/api';

const P = '#8B4AFF';
const A = '#ebfc66';

function migratePlanningYear(value) {
  if (typeof value === 'string') return value.replaceAll('2025', '2026').replaceAll('/25', '/26');
  if (Array.isArray(value)) return value.map(migratePlanningYear);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, migratePlanningYear(item)]));
  }
  return value;
}

// ─── localStorage hook ────────────────────────────────────────────────────────
function useLS(key, init) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      const parsed = s ? JSON.parse(s) : init;
      if (!String(key).startsWith('gatedo_')) return parsed;
      const migrated = migratePlanningYear(parsed);
      if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
        localStorage.setItem(key, JSON.stringify(migrated));
      }
      return migrated;
    } catch { return init; }
  });
  const set = useCallback(fn => setV(prev => {
    const next = typeof fn === 'function' ? fn(prev) : fn;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    return next;
  }), [key]);
  return [v, set];
}

// ─── Colors & helpers ────────────────────────────────────────────────────────
const STATUS_CFG = {
  'No prazo':   { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
  'Em risco':   { bg: '#fffbeb', text: '#d97706', border: '#fde68a', dot: '#f59e0b' },
  'Atrasado':   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', dot: '#ef4444' },
  'Concluído':  { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', dot: P },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG['Em risco'];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {status}
    </span>
  );
}

function ProgressBar({ value, max = 100, color = P, size = 'md' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className={`w-full ${h} bg-gray-100 rounded-full overflow-hidden`}>
      <div className={`${h} rounded-full transition-all duration-700`}
        style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────

const INIT_OKRS = [
  {
    id: 1, quarter: 'Q2 2026', status: 'Em risco',
    objective: 'Estabelecer o Gatedo como a referência de saúde felina no Brasil',
    owner: 'Fundador', color: P,
    krs: [
      { id: 11, text: 'Atingir 30.000 gatos cadastrados com perfil completo', current: 23000, target: 30000, unit: 'gatos' },
      { id: 12, text: 'D30 retention acima de 35%', current: 28, target: 35, unit: '%' },
      { id: 13, text: 'NPS dos tutores acima de 55', current: 48, target: 55, unit: 'pts' },
    ],
  },
  {
    id: 2, quarter: 'Q2 2026', status: 'No prazo',
    objective: 'Construir o canal de distribuição via clínicas veterinárias',
    owner: 'Comercial', color: '#10b981',
    krs: [
      { id: 21, text: 'Ativar 20 clínicas veterinárias no painel', current: 3, target: 20, unit: 'clínicas' },
      { id: 22, text: 'Gerar 300 novos tutores via canal vet', current: 49, target: 300, unit: 'tutores' },
      { id: 23, text: 'Taxa de indicação por clínica ≥ 15 tutores/mês', current: 16.5, target: 15, unit: 'tutores/mês' },
    ],
  },
  {
    id: 3, quarter: 'Q2 2026', status: 'Atrasado',
    objective: 'Lançar e validar o primeiro modelo de monetização recorrente',
    owner: 'Produto', color: '#f59e0b',
    krs: [
      { id: 31, text: 'Lançar Gatedo Premium com 3 planos', current: 0, target: 1, unit: 'lançamento' },
      { id: 32, text: 'Converter 3% da base ativa em Premium', current: 0, target: 3, unit: '%' },
      { id: 33, text: 'MRR de R$ 5.000 até fim do trimestre', current: 0, target: 5000, unit: 'R$' },
    ],
  },
  {
    id: 4, quarter: 'Q3 2026', status: 'No prazo',
    objective: 'Tornar o Studio o principal motor de aquisição orgânica',
    owner: 'Marketing', color: '#6366f1',
    krs: [
      { id: 41, text: 'Atingir 5.000 outputs do Studio compartilhados/semana', current: 847, target: 5000, unit: 'outputs/sem' },
      { id: 42, text: 'Viral coefficient K acima de 0,4', current: 0.21, target: 0.4, unit: 'K' },
      { id: 43, text: 'Lançar Desafio Studio semanal com +2k participantes', current: 0, target: 2000, unit: 'participantes' },
    ],
  },
];

const INIT_KPIS = [
  { id: 1,  label: 'Gatos cadastrados',      icon: 'cat',     category: 'Produto',    current: 23000, target: 30000, unit: '',    trend: 'up',   delta: '+1.200/mês',  color: P },
  { id: 2,  label: 'MAU (usuários ativos)',   icon: 'users',   category: 'Produto',    current: 8400,  target: 15000, unit: '',    trend: 'up',   delta: '+340 vs mês ant', color: '#6366f1' },
  { id: 3,  label: 'D30 Retention',           icon: 'heart',   category: 'Produto',    current: 28,    target: 35,    unit: '%',   trend: 'flat', delta: '= mês ant',   color: '#ec4899' },
  { id: 4,  label: 'NPS de Tutores',          icon: 'star',    category: 'Produto',    current: 48,    target: 55,    unit: 'pts', trend: 'up',   delta: '+3 vs mês ant', color: '#f59e0b' },
  { id: 5,  label: 'MRR',                     icon: 'dollar',  category: 'Financeiro', current: 0,     target: 5000,  unit: 'R$',  trend: 'flat', delta: 'Pré-lançamento', color: '#10b981' },
  { id: 6,  label: 'CAC (custo aquisição)',   icon: 'target',  category: 'Financeiro', current: 8.5,   target: 3,     unit: 'R$',  trend: 'down', delta: '-R$2 vs mês ant', color: '#ef4444' },
  { id: 7,  label: 'Clínicas ativas',         icon: 'build',   category: 'B2B',        current: 3,     target: 20,    unit: '',    trend: 'up',   delta: '+1 essa semana', color: '#0ea5e9' },
  { id: 8,  label: 'Studio outputs/semana',   icon: 'zap',     category: 'Marketing',  current: 847,   target: 5000,  unit: '',    trend: 'up',   delta: '+212 vs sem ant', color: '#f97316' },
  { id: 9,  label: 'Viral Coefficient (K)',   icon: 'trend',   category: 'Marketing',  current: 0.21,  target: 0.4,   unit: '',    trend: 'flat', delta: 'Estável',     color: '#7c3aed' },
  { id: 10, label: 'Influencers parceiros',   icon: 'star',    category: 'Marketing',  current: 2,     target: 10,    unit: '',    trend: 'up',   delta: '+1 esse mês', color: '#db2777' },
];

const KPI_API_MAP = {
  1: 'catsRegistered',
  2: 'mau',
  3: 'd30Retention',
  5: 'mrr',
  7: 'vetClinics',
  8: 'studioOutputsWeek',
  9: 'viralCoefficient',
};

const KR_API_MAP = {
  11: 'catsRegistered',
  12: 'd30Retention',
  21: 'vetClinics',
  31: 'mrr',
  41: 'studioOutputsWeek',
  42: 'viralCoefficient',
};

function useOpsMetrics() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/intelligence/ops/metrics');
      setSnapshot(data);
      return data;
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Nao foi possivel carregar metricas reais.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { snapshot, loading, error, refresh };
}

const INIT_DECISIONS = [
  { id: 1, date: '2026-05-01', category: 'Produto', title: 'Priorizar Painel Vet antes do Premium', context: 'O canal vet tem CAC próximo de zero e valida o modelo B2B antes de cobrar do usuário final.', alternatives: 'Lançar Premium primeiro para gerar MRR imediato.', decision: 'Painel Vet em junho, Premium em julho.', owner: 'Fundador', outcome: 'Em andamento' },
  { id: 2, date: '2026-04-20', category: 'Marketing', title: 'Não expandir para cães', context: 'Pressão de mercado para atender cães e aumentar TAM. Análise mostrou que diluiria posicionamento felino que é o diferencial.', alternatives: 'Expandir para pets em geral como Budz.', decision: '100% gatos para sempre. Posicionamento é o moat.', owner: 'Fundador', outcome: 'Definido' },
  { id: 3, date: '2026-04-10', category: 'Produto', title: 'Studio com watermark + QR code em todos os outputs', context: 'Cada output compartilhado é mídia paga zero. Watermark sutil + QR do perfil do gato fecha o loop de aquisição.', alternatives: 'Studio sem watermark para melhor UX.', decision: 'Watermark elegante + QR no rodapé de todos os criativos.', owner: 'Produto', outcome: 'Implementado' },
];

const CATEGORIES_DEC = ['Produto', 'Marketing', 'B2B', 'Financeiro', 'Operacional', 'Estratégico'];

const INIT_SOPS = [
  {
    id: 1, title: 'Onboarding de Clínica Veterinária Parceira', category: 'B2B', icon: '🏥',
    steps: [
      { id: 's1', text: 'Enviar email de boas-vindas com link de acesso ao painel', done: false },
      { id: 's2', text: 'Fazer videochamada de 15min para apresentar o painel', done: false },
      { id: 's3', text: 'Enviar QR code personalizado para a recepção da clínica', done: false },
      { id: 's4', text: 'Configurar perfil da clínica no sistema com nome e endereço', done: false },
      { id: 's5', text: 'Fazer check-in em 2 semanas para medir tutores indicados', done: false },
      { id: 's6', text: 'Incluir no ranking de clínicas parceiras ativas', done: false },
    ],
  },
  {
    id: 2, title: 'Briefing e Ativação de Influencer', category: 'Marketing', icon: '⭐',
    steps: [
      { id: 'i1', text: 'Confirmar alinhamento de valores e autenticidade com o Gatedo', done: false },
      { id: 'i2', text: 'Enviar proposta com formato, entregáveis e prazo', done: false },
      { id: 'i3', text: 'Fornecer acesso ao Studio + conta Premium para teste real', done: false },
      { id: 'i4', text: 'Aprovar roteiro ou concept criativo antes da gravação', done: false },
      { id: 'i5', text: 'Confirmar CTA, link rastreável e nomenclatura UTM', done: false },
      { id: 'i6', text: 'Monitorar métricas 48h após publicação e registrar no Network Ops', done: false },
    ],
  },
  {
    id: 3, title: 'Publicação de Campanha no Meta Ads', category: 'Mídia Paga', icon: '📣',
    steps: [
      { id: 'm1', text: 'Definir objetivo, público e budget no Campaign Studio', done: false },
      { id: 'm2', text: 'Gerar nomenclatura no Meta Tools (campanha / conjunto / anúncio)', done: false },
      { id: 'm3', text: 'Subir criativos no Ads Manager com nomenclatura padronizada', done: false },
      { id: 'm4', text: 'Verificar pixel de conversão configurado para evento correto', done: false },
      { id: 'm5', text: 'Ativar campanha e registrar data de início no Campaign Studio', done: false },
      { id: 'm6', text: 'Fazer revisão de performance em 48h e pausar criativos ruins', done: false },
      { id: 'm7', text: 'Registrar resultados finais no Campaign Studio ao encerrar', done: false },
    ],
  },
  {
    id: 4, title: 'Weekly Review — Revisão Semanal do Negócio', category: 'Operacional', icon: '📊',
    steps: [
      { id: 'w1', text: 'Atualizar KPIs do OpsCenter com os números reais da semana', done: false },
      { id: 'w2', text: 'Revisar status dos OKRs — algum Key Result mudou de status?', done: false },
      { id: 'w3', text: 'Verificar pipeline de clínicas, influencers e marcas no Network Ops', done: false },
      { id: 'w4', text: 'Revisar kanban do Campaign Studio — há tarefas travadas?', done: false },
      { id: 'w5', text: 'Checar experimentos em andamento e registrar resultados parciais', done: false },
      { id: 'w6', text: 'Decidir 1 coisa para fazer diferente na próxima semana', done: false },
    ],
  },
  {
    id: 5, title: 'Atendimento e Resposta a DMs Estratégicos', category: 'Operacional', icon: '💬',
    steps: [
      { id: 'd1', text: 'Classificar DM: parceria / suporte / imprensa / cliente', done: false },
      { id: 'd2', text: 'Responder em até 24h em dias úteis', done: false },
      { id: 'd3', text: 'Se parceria: abrir card no Network Ops e agendar call', done: false },
      { id: 'd4', text: 'Se imprensa: enviar press kit e agendar entrevista', done: false },
      { id: 'd5', text: 'Registrar no Decision Log se gerou decisão estratégica', done: false },
    ],
  },
];

const RITUAL_PERIODS = ['Diário', 'Semanal', 'Mensal'];

const INIT_RITUALS = {
  'Diário': [
    { id: 'r1', text: 'Checar métricas principais (MAU, novos cadastros, Studio outputs)' },
    { id: 'r2', text: 'Responder DMs e mensagens de parceiros' },
    { id: 'r3', text: 'Publicar ou agendar 1 conteúdo orgânico' },
    { id: 'r4', text: 'Revisar o kanban de tarefas e mover cards' },
    { id: 'r5', text: '10 min no Meta Ad Library observando concorrentes' },
  ],
  'Semanal': [
    { id: 'r6', text: 'Weekly Review (seguir SOP de revisão semanal)' },
    { id: 'r7', text: 'Contato com 2 clínicas novas para o painel vet' },
    { id: 'r8', text: 'Atualizar Network Ops com status das negociações' },
    { id: 'r9', text: 'Revisar e pausar anúncios com CPI acima do target' },
    { id: 'r10', text: 'Escrever ou revisar 1 copy novo para a biblioteca' },
    { id: 'r11', text: 'Checar NPS e ler pelo menos 5 feedbacks de tutores' },
  ],
  'Mensal': [
    { id: 'r12', text: 'Atualizar progresso de todos os Key Results dos OKRs' },
    { id: 'r13', text: 'Escrever 1 insight estratégico no Decision Log' },
    { id: 'r14', text: 'Revisar a pirâmide de monetização — ativei algum tier novo?' },
    { id: 'r15', text: 'Entrevistar 3 tutores ativos para feedback qualitativo' },
    { id: 'r16', text: 'Retrospectiva: o que funcionou / o que mudar / o que parar' },
    { id: 'r17', text: 'Atualizar o Expansion Radar com novas oportunidades mapeadas' },
  ],
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Tab({ id, label, icon: Icon, active, onClick, badge }) {
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all relative
        ${active ? 'text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
      style={active ? { backgroundColor: P } : {}}>
      <Icon size={12} />{label}
      {badge && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center text-white bg-red-500">{badge}</span>}
    </button>
  );
}

// ─── OKRs ────────────────────────────────────────────────────────────────────
function OKRsPanel() {
  const [okrs, setOkrs] = useLS('gatedo_okrs', INIT_OKRS);
  const [editing, setEditing] = useState(null);
  const [activeQ, setActiveQ] = useState('Q2 2026');
  const { snapshot, loading, error, refresh } = useOpsMetrics();

  const quarters = [...new Set(okrs.map(o => o.quarter))];

  const updateKR = (okrId, krId, field, val) => {
    setOkrs(prev => prev.map(o => o.id !== okrId ? o : {
      ...o, krs: o.krs.map(kr => kr.id !== krId ? kr : { ...kr, [field]: val })
    }));
  };

  const updateStatus = (id, status) =>
    setOkrs(prev => prev.map(o => o.id === id ? { ...o, status } : o));

  const syncFromApi = async () => {
    const data = snapshot || await refresh();
    const metrics = data?.metrics || {};
    setOkrs(prev => prev.map(okr => ({
      ...okr,
      krs: okr.krs.map(kr => {
        const key = KR_API_MAP[kr.id];
        const metric = key ? metrics[key] : null;
        return metric ? { ...kr, current: Number(metric.current || 0) } : kr;
      }),
    })));
  };

  const filtered = okrs.filter(o => o.quarter === activeQ);

  return (
    <div className="space-y-5">
      {/* Quarter tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {quarters.map(q => (
          <button key={q} onClick={() => setActiveQ(q)}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all border
              ${activeQ === q ? 'text-white border-transparent shadow-md' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            style={activeQ === q ? { backgroundColor: P } : {}}>
            {q}
          </button>
        ))}
        <button onClick={syncFromApi} disabled={loading}
          className="ml-auto px-4 py-1.5 rounded-xl text-xs font-black border border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100 disabled:opacity-60">
          {loading ? 'Sincronizando...' : 'Sincronizar dados reais'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {['No prazo','Em risco','Atrasado','Concluído'].map(s => {
          const n = filtered.filter(o => o.status === s).length;
          const c = STATUS_CFG[s];
          return (
            <div key={s} className="rounded-xl p-3 text-center border" style={{ backgroundColor: c.bg, borderColor: c.border }}>
              <p className="text-xl font-black" style={{ color: c.text }}>{n}</p>
              <p className="text-[10px] font-bold" style={{ color: c.text }}>{s}</p>
            </div>
          );
        })}
      </div>

      {/* OKR Cards */}
      <div className="space-y-4">
        {filtered.map(okr => {
          const avgProgress = Math.round(
            okr.krs.reduce((acc, kr) => acc + Math.min(100, (kr.current / kr.target) * 100), 0) / okr.krs.length
          );
          return (
            <div key={okr.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: okr.color }} />
                    <p className="text-sm font-black text-gray-900 leading-tight">{okr.objective}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 pl-5">👤 {okr.owner} · {okr.quarter}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select value={okr.status} onChange={e => updateStatus(okr.id, e.target.value)}
                    className="text-[10px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                    style={{ color: STATUS_CFG[okr.status]?.text }}>
                    {Object.keys(STATUS_CFG).map(s => <option key={s}>{s}</option>)}
                  </select>
                  <div className="text-right">
                    <p className="text-lg font-black" style={{ color: okr.color }}>{avgProgress}%</p>
                  </div>
                </div>
              </div>
              <ProgressBar value={avgProgress} color={okr.color} />
              <div className="mt-4 space-y-3">
                {okr.krs.map(kr => {
                  const pct = Math.min(100, Math.round((kr.current / kr.target) * 100));
                  const isEditing = editing === kr.id;
                  return (
                    <div key={kr.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs text-gray-700 font-medium flex-1 leading-relaxed">{kr.text}</p>
                        <button onClick={() => setEditing(isEditing ? null : kr.id)}
                          className="text-gray-300 hover:text-purple-500 flex-shrink-0">
                          <Edit3 size={12} />
                        </button>
                      </div>
                      {isEditing ? (
                        <div className="flex gap-2 items-center">
                          <label className="text-[10px] text-gray-500">Atual:</label>
                          <input type="number" value={kr.current}
                            onChange={e => updateKR(okr.id, kr.id, 'current', parseFloat(e.target.value) || 0)}
                            className="w-24 text-xs border border-purple-300 rounded-lg px-2 py-1 focus:outline-none" />
                          <label className="text-[10px] text-gray-500">/ Meta: {kr.target} {kr.unit}</label>
                          <button onClick={() => setEditing(null)}
                            className="ml-auto text-xs font-bold text-green-600">Salvar</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ProgressBar value={kr.current} max={kr.target} color={okr.color} size="sm" />
                          <span className="text-[10px] font-black flex-shrink-0 w-10 text-right" style={{ color: okr.color }}>{pct}%</span>
                        </div>
                      )}
                      <p className="text-[9px] text-gray-400 mt-1">
                        {kr.current.toLocaleString('pt-BR')} {kr.unit} de {kr.target.toLocaleString('pt-BR')} {kr.unit}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KPIs ────────────────────────────────────────────────────────────────────
const ICON_MAP = { cat: Heart, users: Users, heart: Heart, star: Star, dollar: DollarSign, target: Target, build: BookOpen, zap: Zap, trend: TrendingUp };

function KPIPanel() {
  const [kpis, setKpis] = useLS('gatedo_kpis', INIT_KPIS);
  const [editing, setEditing] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const { snapshot, loading, error, refresh } = useOpsMetrics();

  const categories = ['Todos', ...new Set(INIT_KPIS.map(k => k.category))];

  const update = (id, field, val) =>
    setKpis(prev => prev.map(k => k.id === id ? { ...k, [field]: val } : k));

  const syncFromApi = async () => {
    const data = snapshot || await refresh();
    const metrics = data?.metrics || {};
    setKpis(prev => prev.map(kpi => {
      const key = KPI_API_MAP[kpi.id];
      const metric = key ? metrics[key] : null;
      return metric
        ? {
            ...kpi,
            current: Number(metric.current || 0),
            trend: metric.trend || kpi.trend,
            delta: metric.delta || kpi.delta,
            source: 'api',
            syncedAt: data.generatedAt,
          }
        : kpi;
    }));
  };

  const filtered = kpis.filter(k => activeCategory === 'Todos' || k.category === activeCategory);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-purple-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-gray-900">Motor de métricas conectado</p>
          <p className="text-xs text-gray-500">
            Sincroniza gatos, MAU, D30, MRR, clínicas, Studio e viralidade direto da API.
          </p>
          {snapshot?.generatedAt && (
            <p className="text-[10px] text-gray-400 mt-1">
              Última leitura: {new Date(snapshot.generatedAt).toLocaleString('pt-BR')}
            </p>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <button onClick={syncFromApi} disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-60"
          style={{ backgroundColor: P }}>
          {loading ? 'Sincronizando...' : 'Sincronizar KPIs reais'}
        </button>
      </div>

      {snapshot?.monetization && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Webhook Kiwify', value: snapshot.monetization.kiwifyWebhookUrl },
            { label: 'Compras Kiwify', value: snapshot.monetization.purchaseInvites },
            { label: 'Founders', value: snapshot.monetization.founderInvites },
            { label: 'Assinaturas ativas', value: snapshot.monetization.activeSubscriptions },
          ].map(item => (
            <div key={item.label} className="bg-white border border-gray-100 rounded-2xl p-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-sm font-black text-gray-900 truncate mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all
              ${activeCategory === c ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
            style={activeCategory === c ? { backgroundColor: P } : {}}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(kpi => {
          const Icon = ICON_MAP[kpi.icon] || Activity;
          const pct = Math.min(100, Math.round((kpi.current / kpi.target) * 100));
          const isOk = pct >= 80;
          const isWarn = pct >= 50 && pct < 80;
          const isEditing = editing === kpi.id;

          const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : kpi.trend === 'down' ? ArrowDownRight : Minus;
          const trendColor = kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#ef4444' : '#6b7280';

          return (
            <div key={kpi.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${kpi.color}15` }}>
                    <Icon size={15} style={{ color: kpi.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800">{kpi.label}</p>
                    <p className="text-[9px] text-gray-400">{kpi.category}</p>
                  </div>
                </div>
                <button onClick={() => setEditing(isEditing ? null : kpi.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-purple-500">
                  <Edit3 size={12} />
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-2 mb-3">
                  <div className="flex gap-2 items-center">
                    <label className="text-[10px] text-gray-500 w-12">Atual:</label>
                    <input type="number" value={kpi.current}
                      onChange={e => update(kpi.id, 'current', parseFloat(e.target.value) || 0)}
                      className="flex-1 text-xs border border-purple-300 rounded-lg px-2 py-1 focus:outline-none" />
                    <span className="text-[10px] text-gray-400">{kpi.unit}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-[10px] text-gray-500 w-12">Delta:</label>
                    <input value={kpi.delta}
                      onChange={e => update(kpi.id, 'delta', e.target.value)}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-[10px] text-gray-500 w-12">Trend:</label>
                    <select value={kpi.trend} onChange={e => update(kpi.id, 'trend', e.target.value)}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                      <option value="up">↑ Subindo</option>
                      <option value="down">↓ Caindo</option>
                      <option value="flat">→ Estável</option>
                    </select>
                  </div>
                  <button onClick={() => setEditing(null)}
                    className="w-full text-xs font-black py-1.5 rounded-xl text-white" style={{ backgroundColor: P }}>
                    Salvar
                  </button>
                </div>
              ) : (
                <div className="mb-3">
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-black text-gray-900">
                      {typeof kpi.current === 'number' && kpi.current > 999
                        ? kpi.current.toLocaleString('pt-BR')
                        : kpi.current}
                      <span className="text-sm text-gray-400 ml-1">{kpi.unit}</span>
                    </p>
                    <div className="flex items-center gap-1 mb-0.5">
                      <TrendIcon size={13} style={{ color: trendColor }} />
                      <span className="text-[10px] font-bold" style={{ color: trendColor }}>{kpi.delta}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Meta: {kpi.target.toLocaleString('pt-BR')} {kpi.unit}
                  </p>
                </div>
              )}

              <ProgressBar value={kpi.current} max={kpi.target} color={isOk ? '#10b981' : isWarn ? '#f59e0b' : kpi.color} size="sm" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px]" style={{ color: isOk ? '#10b981' : isWarn ? '#f59e0b' : '#ef4444' }}>
                  {pct}% da meta
                </span>
                <span className={`text-[9px] font-bold ${isOk ? 'text-green-500' : isWarn ? 'text-amber-500' : 'text-red-400'}`}>
                  {isOk ? '✅ No alvo' : isWarn ? '⚠️ Atenção' : '🔴 Abaixo'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Decision Log ─────────────────────────────────────────────────────────────
function DecisionLog() {
  const [decisions, setDecisions] = useLS('gatedo_decisions', INIT_DECISIONS);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ category: 'Produto', title: '', context: '', alternatives: '', decision: '', owner: 'Fundador', outcome: 'Em andamento' });

  const addDecision = () => {
    if (!form.title.trim() || !form.decision.trim()) return;
    setDecisions(prev => [{ ...form, id: Date.now(), date: new Date().toISOString().split('T')[0] }, ...prev]);
    setForm({ category: 'Produto', title: '', context: '', alternatives: '', decision: '', owner: 'Fundador', outcome: 'Em andamento' });
    setAdding(false);
  };

  const CAT_COLORS = { Produto: P, Marketing: '#ec4899', B2B: '#10b981', Financeiro: '#f59e0b', Operacional: '#6366f1', Estratégico: '#0ea5e9' };
  const OUTCOMES = ['Em andamento', 'Validado', 'Revertido', 'Definido'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{decisions.length} decisões registradas</p>
        <button onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-white"
          style={{ backgroundColor: P }}>
          <Plus size={13} /> Nova decisão
        </button>
      </div>

      {adding && (
        <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-md space-y-3">
          <p className="text-sm font-black text-gray-900">Registrar nova decisão</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 block mb-1">CATEGORIA</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-purple-300">
                {CATEGORIES_DEC.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 block mb-1">RESPONSÁVEL</label>
              <input value={form.owner} onChange={e => setForm(f => ({...f, owner: e.target.value}))}
                className="w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-purple-300" />
            </div>
          </div>
          {[
            { key: 'title', label: 'DECISÃO (título)', placeholder: 'Ex: Priorizar painel vet antes do premium' },
            { key: 'context', label: 'CONTEXTO', placeholder: 'Por que essa decisão foi necessária?' },
            { key: 'alternatives', label: 'ALTERNATIVAS CONSIDERADAS', placeholder: 'O que mais foi cogitado?' },
            { key: 'decision', label: 'DECISÃO TOMADA', placeholder: 'O que foi decidido e por quê?' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-black text-gray-400 block mb-1">{f.label}</label>
              <textarea value={form[f.key]} onChange={e => setForm(ff => ({...ff, [f.key]: e.target.value}))}
                placeholder={f.placeholder} rows={2}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-purple-300" />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={addDecision}
              className="px-4 py-2 rounded-xl text-xs font-black text-white" style={{ backgroundColor: P }}>
              Salvar decisão
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-xl text-xs text-gray-500 bg-gray-100">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {decisions.map(d => {
          const color = CAT_COLORS[d.category] || P;
          const isOpen = expanded === d.id;
          return (
            <div key={d.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
              <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(isOpen ? null : d.id)}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}15` }}>
                  <Flag size={14} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>{d.category}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border
                      ${d.outcome === 'Validado' || d.outcome === 'Definido' ? 'bg-green-50 text-green-700 border-green-100' :
                        d.outcome === 'Revertido' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {d.outcome}
                    </span>
                  </div>
                  <p className="text-sm font-black text-gray-900 truncate">{d.title}</p>
                  <p className="text-[10px] text-gray-400">📅 {d.date} · 👤 {d.owner}</p>
                </div>
                <ChevronDown size={15} className={`text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="border-t border-gray-50 p-4 space-y-3 bg-gray-50/50">
                  {[
                    { label: '🔍 Contexto', val: d.context },
                    { label: '🔀 Alternativas', val: d.alternatives },
                    { label: '✅ Decisão', val: d.decision, highlight: true },
                  ].filter(x => x.val).map(x => (
                    <div key={x.label} className={`rounded-xl p-3 ${x.highlight ? 'border-l-4' : 'bg-white border border-gray-100'}`}
                      style={x.highlight ? { borderColor: color, backgroundColor: `${color}08` } : {}}>
                      <p className="text-[10px] font-black text-gray-500 mb-1">{x.label}</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{x.val}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    {OUTCOMES.map(o => (
                      <button key={o} onClick={() => setDecisions(prev => prev.map(dd => dd.id === d.id ? {...dd, outcome: o} : dd))}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all border
                          ${d.outcome === o ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                        style={d.outcome === o ? { backgroundColor: color } : {}}>
                        {o}
                      </button>
                    ))}
                    <button onClick={() => setDecisions(prev => prev.filter(dd => dd.id !== d.id))}
                      className="ml-auto text-[10px] text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SOPs ────────────────────────────────────────────────────────────────────
function SOPsPanel() {
  const [sops, setSops] = useLS('gatedo_sops', INIT_SOPS);
  const [activeSOPId, setActiveSOPId] = useState(null);

  const toggleStep = (sopId, stepId) => {
    setSops(prev => prev.map(s => s.id !== sopId ? s : {
      ...s, steps: s.steps.map(st => st.id === stepId ? {...st, done: !st.done} : st)
    }));
  };

  const resetSOP = (sopId) => {
    setSops(prev => prev.map(s => s.id !== sopId ? s : {
      ...s, steps: s.steps.map(st => ({...st, done: false}))
    }));
  };

  const CAT_COLORS = { 'B2B': '#10b981', 'Marketing': P, 'Mídia Paga': '#3b82f6', 'Operacional': '#f59e0b' };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sops.map(sop => {
        const done = sop.steps.filter(s => s.done).length;
        const total = sop.steps.length;
        const pct = Math.round((done / total) * 100);
        const color = CAT_COLORS[sop.category] || P;
        const isActive = activeSOPId === sop.id;

        return (
          <div key={sop.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sop.icon}</span>
                  <div>
                    <p className="text-sm font-black text-gray-900 leading-tight">{sop.title}</p>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: color }}>{sop.category}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black" style={{ color }}>{pct}%</p>
                  <p className="text-[9px] text-gray-400">{done}/{total}</p>
                </div>
              </div>
              <ProgressBar value={done} max={total} color={color} size="sm" />
            </div>

            <div className="p-4 space-y-2">
              {sop.steps.slice(0, isActive ? undefined : 3).map(step => (
                <label key={step.id} className="flex items-start gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                    ${step.done ? 'border-transparent' : 'border-gray-200 group-hover:border-purple-300'}`}
                    style={step.done ? { backgroundColor: color } : {}}
                    onClick={() => toggleStep(sop.id, step.id)}>
                    {step.done && <CheckCircle2 size={12} color="white" />}
                  </div>
                  <p className={`text-xs leading-relaxed transition-all ${step.done ? 'line-through text-gray-300' : 'text-gray-700'}`}
                    onClick={() => toggleStep(sop.id, step.id)}>
                    {step.text}
                  </p>
                </label>
              ))}
              {!isActive && sop.steps.length > 3 && (
                <p className="text-[10px] text-gray-400 pl-7">+{sop.steps.length - 3} passos...</p>
              )}
            </div>

            <div className="px-4 pb-3 flex gap-2">
              <button onClick={() => setActiveSOPId(isActive ? null : sop.id)}
                className="flex-1 text-[10px] font-black py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                {isActive ? 'Recolher' : 'Ver todos os passos'}
              </button>
              <button onClick={() => resetSOP(sop.id)}
                className="px-2 py-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-orange-400 hover:border-orange-200 transition-colors">
                <RefreshCw size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Rituals ─────────────────────────────────────────────────────────────────
function RitualsPanel() {
  const today = new Date().toISOString().split('T')[0];
  const weekNum = Math.ceil(new Date().getDate() / 7);
  const monthKey = new Date().toISOString().slice(0, 7);

  const [dailyChecks, setDailyChecks]   = useLS(`gatedo_ritual_daily_${today}`, {});
  const [weeklyChecks, setWeeklyChecks] = useLS(`gatedo_ritual_weekly_${monthKey}_w${weekNum}`, {});
  const [monthlyChecks, setMonthlyChecks] = useLS(`gatedo_ritual_monthly_${monthKey}`, {});
  const [activePeriod, setActivePeriod]  = useState('Diário');

  const getChecks = p => p === 'Diário' ? dailyChecks : p === 'Semanal' ? weeklyChecks : monthlyChecks;
  const setChecks = p => p === 'Diário' ? setDailyChecks : p === 'Semanal' ? setWeeklyChecks : setMonthlyChecks;

  const toggle = (period, id) => {
    setChecks(period)(prev => ({...prev, [id]: !prev[id]}));
  };

  const PERIOD_COLORS = { Diário: P, Semanal: '#10b981', Mensal: '#f59e0b' };
  const PERIOD_ICONS  = { Diário: Calendar, Semanal: RefreshCw, Mensal: Award };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {RITUAL_PERIODS.map(p => {
          const checks = getChecks(p);
          const items = INIT_RITUALS[p];
          const done = items.filter(i => checks[i.id]).length;
          const Icon = PERIOD_ICONS[p];
          const color = PERIOD_COLORS[p];
          return (
            <button key={p} onClick={() => setActivePeriod(p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all border
                ${activePeriod === p ? 'text-white border-transparent shadow-md' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={activePeriod === p ? { backgroundColor: color } : {}}>
              <Icon size={12} />
              {p}
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activePeriod === p ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {done}/{items.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-black text-gray-900">Ritual {activePeriod}</p>
            <p className="text-[10px] text-gray-400">
              {activePeriod === 'Diário' ? `Hoje — ${new Date().toLocaleDateString('pt-BR')}` :
               activePeriod === 'Semanal' ? `Semana ${weekNum} de ${monthKey}` :
               `Mês de ${monthKey}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black" style={{ color: PERIOD_COLORS[activePeriod] }}>
              {Math.round((Object.values(getChecks(activePeriod)).filter(Boolean).length / INIT_RITUALS[activePeriod].length) * 100)}%
            </p>
            <p className="text-[10px] text-gray-400">completo</p>
          </div>
        </div>
        <ProgressBar
          value={Object.values(getChecks(activePeriod)).filter(Boolean).length}
          max={INIT_RITUALS[activePeriod].length}
          color={PERIOD_COLORS[activePeriod]} />
        <div className="space-y-2 mt-4">
          {INIT_RITUALS[activePeriod].map((item, i) => {
            const checks = getChecks(activePeriod);
            const done = !!checks[item.id];
            return (
              <label key={item.id} className="flex items-start gap-3 cursor-pointer group p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                  ${done ? 'border-transparent' : 'border-gray-200 group-hover:border-purple-300'}`}
                  style={done ? { backgroundColor: PERIOD_COLORS[activePeriod] } : {}}
                  onClick={() => toggle(activePeriod, item.id)}>
                  {done && <CheckCircle2 size={12} color="white" />}
                </div>
                <div className="flex items-center gap-2 flex-1" onClick={() => toggle(activePeriod, item.id)}>
                  <span className="text-[10px] font-black text-gray-300">{String(i + 1).padStart(2, '0')}</span>
                  <p className={`text-xs leading-relaxed transition-all ${done ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                    {item.text}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Integrations suggestions panel ─────────────────────────────────────────
function IntegrationsPanel() {
  const integrations = [
    { name: 'Stripe Dashboard', desc: 'MRR, churn e novos assinantes em tempo real. Embed do Stripe Customer Portal direto no admin.', status: 'Recomendado', color: '#635bff', icon: DollarSign, url: 'https://dashboard.stripe.com' },
    { name: 'Google Analytics 4', desc: 'Tráfego da landing page, fonte de instalações e funil de onboarding. Embed do GA4 reports.', status: 'Recomendado', color: '#f59e0b', icon: BarChart2, url: 'https://analytics.google.com' },
    { name: 'Cal.com / Calendly', desc: 'Link de agendamento de demo para clínicas e parceiros. Sem troca de email para marcar reunião.', status: 'Quick win', color: '#10b981', icon: Calendar, url: 'https://cal.com' },
    { name: 'Make (Integromat)', desc: 'Automações: tutor cadastra → email personalizado. Vacina vence → push. KPI muda → alerta Slack.', status: 'Recomendado', color: P, icon: Zap, url: 'https://make.com' },
    { name: 'Resend / Loops', desc: 'Emails transacionais e de nutrição. Integra com eventos do app. Templates de onboarding, reativação e retenção.', status: 'Quick win', color: '#0ea5e9', icon: RefreshCw, url: 'https://resend.com' },
    { name: 'Typeform / Tally', desc: 'Pesquisas de NPS e feedback de tutores. Resultados aparecem automaticamente no admin.', status: 'Quick win', color: '#262627', icon: CheckSquare, url: 'https://tally.so' },
    { name: 'Loom', desc: 'Gravar video demos para onboarding de clínicas. Enviar apresentação do painel vet em 3 minutos.', status: 'Útil', color: '#625DF5', icon: Eye, url: 'https://loom.com' },
    { name: 'Linear / GitHub', desc: 'Roadmap de produto e sprints de desenvolvimento. Conectar tickets de bug a OKRs do admin.', status: 'Útil', color: '#5e6ad2', icon: Layers, url: 'https://linear.app' },
  ];

  const STATUS_STYLE = {
    'Recomendado': { bg: '#f5f3ff', text: P, border: '#ddd6fe' },
    'Quick win':   { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    'Útil':        { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' },
  };

  const automations = [
    { trigger: 'Tutor cadastra o primeiro gato', action: 'Email de boas-vindas personalizado com nome do gato', tool: 'Make + Resend' },
    { trigger: 'Vacina vence em 15 dias', action: 'Push notification + email de lembrete automático', tool: 'Make + Firebase' },
    { trigger: 'Tutor inativo há 7 dias', action: 'Sequência de reativação (3 emails + 1 push)', tool: 'Make + Resend' },
    { trigger: 'Gato completa aniversário no app', action: 'Push de parabéns personalizado + badge especial', tool: 'Firebase Functions' },
    { trigger: 'Clínica se cadastra no painel vet', action: 'Sequência B2B de onboarding (email + WhatsApp)', tool: 'Make + Zapi' },
    { trigger: 'Output do Studio compartilhado', action: 'Registrar evento de viral no analytics', tool: 'Firebase + Mixpanel' },
    { trigger: 'MRR atinge milestone (R$5k, R$10k)', action: 'Notificação Slack para o time + log automático', tool: 'Make + Slack' },
    { trigger: 'NPS abaixo de 40 por 2 semanas', action: 'Alerta para o fundador + agenda review de produto', tool: 'Make + Cal.com' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {integrations.map(int => {
          const Icon = int.icon;
          const sc = STATUS_STYLE[int.status];
          return (
            <a key={int.name} href={int.url} target="_blank" rel="noopener noreferrer"
              className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-purple-100 transition-all group flex gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${int.color}15` }}>
                <Icon size={16} style={{ color: int.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black text-gray-900">{int.name}</p>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full border"
                    style={{ backgroundColor: sc.bg, color: sc.text, borderColor: sc.border }}>
                    {int.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{int.desc}</p>
              </div>
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-purple-400 transition-colors flex-shrink-0 mt-0.5" />
            </a>
          );
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p className="text-sm font-black text-gray-900 mb-1">⚡ Automações de Alto Impacto</p>
        <p className="text-xs text-gray-400 mb-4">Flows prontos para implementar via Make ou Firebase Functions. Prioridade: topo da lista primeiro.</p>
        <div className="space-y-2">
          {automations.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="w-5 h-5 rounded-lg text-[10px] font-black text-white flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: P }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-[10px] font-black text-gray-500">SE:</p>
                  <p className="text-xs text-gray-800 font-medium">{a.trigger}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[10px] font-black" style={{ color: P }}>ENTÃO:</p>
                  <p className="text-xs text-gray-600">{a.action}</p>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-500 flex-shrink-0 whitespace-nowrap">
                {a.tool}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const GLOSSARY_TERMS = [
  { term: 'OKR', category: 'Gestao', meaning: 'Objectives and Key Results. Objetivo qualitativo + resultados-chave numericos para medir progresso.', example: 'Objetivo: virar referencia felina. KR: 30.000 gatos cadastrados.' },
  { term: 'KPI', category: 'Gestao', meaning: 'Key Performance Indicator. Metrica principal que mostra se uma area esta saudável.', example: 'MAU, MRR, CAC, D30 e NPS.' },
  { term: 'SOP', category: 'Operacao', meaning: 'Standard Operating Procedure. Procedimento padrao repetivel, em checklist, para reduzir caos e depender menos da memoria.', example: 'SOP de onboarding de clinica veterinaria.' },
  { term: 'MAU', category: 'Produto', meaning: 'Monthly Active Users. Usuarios ativos nos ultimos 30 dias.', example: 'Tutor que criou post, usou Studio, leu comunicado ou gerou evento.' },
  { term: 'DAU', category: 'Produto', meaning: 'Daily Active Users. Usuarios ativos no dia.', example: 'Bom para medir habito diario.' },
  { term: 'D30', category: 'Produto', meaning: 'Retencao no dia 30. Percentual de usuarios que voltam/continuam ativos cerca de 30 dias apos cadastro.', example: 'Se 100 entraram e 28 voltaram, D30 = 28%.' },
  { term: 'Retention', category: 'Produto', meaning: 'Retencao. Capacidade do app de fazer usuarios voltarem ao longo do tempo.', example: 'D7, D30 e cohorts por mes.' },
  { term: 'Churn', category: 'Produto', meaning: 'Perda de usuarios ou assinantes em um periodo.', example: 'Cancelamentos do Premium no mes.' },
  { term: 'Cohort', category: 'Produto', meaning: 'Grupo de usuarios analisado por data ou origem comum.', example: 'Usuarios cadastrados em maio via Instagram.' },
  { term: 'NPS', category: 'Produto', meaning: 'Net Promoter Score. Medida de recomendacao da marca em escala de -100 a 100.', example: 'Pergunta: quanto voce indicaria o Gatedo?' },
  { term: 'MRR', category: 'Financeiro', meaning: 'Monthly Recurring Revenue. Receita recorrente mensal normalizada.', example: 'Plano anual de R$199,90 conta como R$16,66 de MRR.' },
  { term: 'ARR', category: 'Financeiro', meaning: 'Annual Recurring Revenue. Receita recorrente anualizada.', example: 'MRR x 12.' },
  { term: 'CAC', category: 'Financeiro', meaning: 'Customer Acquisition Cost. Custo para adquirir um cliente.', example: 'Gasto em ads / novos clientes pagos.' },
  { term: 'LTV', category: 'Financeiro', meaning: 'Lifetime Value. Valor esperado que um cliente gera enquanto permanece ativo.', example: 'Ticket medio mensal x meses de permanencia.' },
  { term: 'ARPU', category: 'Financeiro', meaning: 'Average Revenue per User. Receita media por usuario.', example: 'Receita total / usuarios ativos.' },
  { term: 'Payback', category: 'Financeiro', meaning: 'Tempo para recuperar o CAC.', example: 'CAC de R$20 e margem mensal de R$10 = payback de 2 meses.' },
  { term: 'CTR', category: 'Meta Ads', meaning: 'Click Through Rate. Percentual de pessoas que clicaram apos ver o anuncio.', example: 'Cliques / impressoes.' },
  { term: 'CPC', category: 'Meta Ads', meaning: 'Cost per Click. Custo medio por clique.', example: 'R$100 gastos / 200 cliques = R$0,50 CPC.' },
  { term: 'CPM', category: 'Meta Ads', meaning: 'Cost per Mille. Custo por mil impressoes.', example: 'Usado para medir custo de alcance.' },
  { term: 'CPA', category: 'Meta Ads', meaning: 'Cost per Acquisition. Custo por cadastro, compra ou outra conversao definida.', example: 'R$300 / 30 cadastros = R$10 CPA.' },
  { term: 'ROAS', category: 'Meta Ads', meaning: 'Return on Ad Spend. Retorno sobre investimento em anuncios.', example: 'R$500 receita / R$100 ads = 5x ROAS.' },
  { term: 'Pixel', category: 'Meta Ads', meaning: 'Script/evento de rastreamento instalado para medir comportamento e conversoes.', example: 'Evento Purchase disparado apos checkout aprovado.' },
  { term: 'UTM', category: 'Marketing', meaning: 'Parametros no link para identificar origem, campanha e criativo.', example: '?utm_source=instagram&utm_campaign=founder.' },
  { term: 'Funil', category: 'Marketing', meaning: 'Caminho da pessoa ate virar usuario ou cliente.', example: 'Post > landing > cadastro > checkout > ativacao.' },
  { term: 'Lead', category: 'Marketing', meaning: 'Pessoa ou contato com potencial de virar usuario, parceiro ou cliente.', example: 'Tutor que respondeu DM pedindo link.' },
  { term: 'MQL', category: 'Marketing', meaning: 'Marketing Qualified Lead. Lead com sinais de interesse suficientes para nutrir.', example: 'Baixou material, comentou e clicou no link.' },
  { term: 'SQL', category: 'Vendas', meaning: 'Sales Qualified Lead. Lead pronto para abordagem comercial.', example: 'Clinica que pediu demo do painel vet.' },
  { term: 'Conversion Rate', category: 'Marketing', meaning: 'Taxa de conversao de uma etapa para outra.', example: 'Cadastros / visitas da pagina Clube.' },
  { term: 'A/B Test', category: 'Marketing', meaning: 'Teste comparando duas versoes para descobrir qual performa melhor.', example: 'Headline com urgencia vs headline emocional.' },
  { term: 'Webhook', category: 'Tecnologia', meaning: 'Aviso automatico enviado de um sistema para outro quando um evento acontece.', example: 'Kiwify chama /api/kiwify/webhook quando uma compra e aprovada.' },
  { term: 'API', category: 'Tecnologia', meaning: 'Interface para sistemas conversarem com dados e regras.', example: 'Ops Center busca KPIs em /api/admin/intelligence/ops/metrics.' },
  { term: 'Moat', category: 'Estrategia', meaning: 'Defesa competitiva dificil de copiar.', example: 'Ser 100% felino + comunidade + dados historicos dos gatos.' },
  { term: 'TAM / SAM / SOM', category: 'Estrategia', meaning: 'Tamanho de mercado total, mercado servivel e fatia realisticamente capturavel.', example: 'TAM pet, SAM gatos urbanos, SOM tutores premium iniciais.' },
];

function GlossaryPanel() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const categories = ['Todos', ...new Set(GLOSSARY_TERMS.map(item => item.category))];
  const q = query.trim().toLowerCase();
  const filtered = GLOSSARY_TERMS.filter(item => {
    const matchesCategory = category === 'Todos' || item.category === category;
    const matchesQuery = !q || [item.term, item.meaning, item.example, item.category].some(value => String(value).toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-gray-900">Guia rapido de termos do Gatedo</p>
            <p className="text-xs text-gray-500 mt-1">
              Um dicionario operacional para reduzir atrito mental: sigla, significado e exemplo pratico no nosso contexto.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar termo, sigla ou area..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(item => (
          <button key={item} onClick={() => setCategory(item)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all
              ${category === item ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
            style={category === item ? { backgroundColor: P } : {}}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(item => (
          <div key={`${item.category}-${item.term}`} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-lg font-black text-gray-900">{item.term}</p>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                {item.category}
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{item.meaning}</p>
            <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Exemplo Gatedo</p>
              <p className="text-xs text-gray-700 leading-relaxed">{item.example}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminOpsCenter() {
  const [activeTab, setActiveTab] = useState('okrs');

  const tabs = [
    { id: 'okrs',      label: 'OKRs',          icon: Target },
    { id: 'kpis',      label: 'KPIs',           icon: BarChart2 },
    { id: 'decisions', label: 'Decisões',        icon: BookOpen },
    { id: 'sops',      label: 'SOPs',           icon: CheckSquare },
    { id: 'rituals',   label: 'Rituais',        icon: RefreshCw },
    { id: 'integrations', label: 'Integrações', icon: Zap },
    { id: 'glossary',  label: 'Glossario',      icon: BookOpen },
  ];

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-7"
        style={{ background: `linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 100%)` }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(ellipse at 5% 60%, ${P} 0%, transparent 50%), radial-gradient(ellipse at 95% 25%, ${A}70 0%, transparent 50%)` }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: A }}>
                <Activity size={14} style={{ color: P }} />
              </div>
              <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: A }}>
                Gatedo · Centro de Operações
              </span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Ops Center</h1>
            <p className="text-white/50 text-xs mt-1 max-w-lg">
              OKRs, KPIs, decisões, SOPs, rituais e integrações — o núcleo operacional
              que transforma estratégia em execução mensurável. Tudo persistido localmente.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'OKRs ativos', value: INIT_OKRS.length },
              { label: 'KPIs monitorados', value: INIT_KPIS.length },
              { label: 'SOPs prontos', value: INIT_SOPS.length },
            ].map(k => (
              <div key={k.label} className="rounded-2xl px-4 py-2.5 border border-white/10 text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-xl font-black text-white">{k.value}</p>
                <p className="text-[9px] text-white/40 font-medium mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-1 flex-wrap shadow-sm">
        {tabs.map(t => <Tab key={t.id} {...t} active={activeTab === t.id} onClick={setActiveTab} />)}
      </div>

      {/* Content */}
      {activeTab === 'okrs'         && <OKRsPanel />}
      {activeTab === 'kpis'         && <KPIPanel />}
      {activeTab === 'decisions'    && <DecisionLog />}
      {activeTab === 'sops'         && <SOPsPanel />}
      {activeTab === 'rituals'      && <RitualsPanel />}
      {activeTab === 'integrations' && <IntegrationsPanel />}
      {activeTab === 'glossary'     && <GlossaryPanel />}

    </div>
  );
}
