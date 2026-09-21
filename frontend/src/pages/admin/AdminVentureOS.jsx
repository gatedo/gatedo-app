import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Heart,
  Home,
  Layers,
  Leaf,
  LineChart,
  MapPin,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  fetchAdminVentures,
  patchAdminVenture,
  syncAdminVentures,
} from '../../services/adminIntelligenceStore';

const P = '#8B4AFF';
const A = '#ebfc66';
const DARK = '#0f0a1e';
const VENTURE_STORAGE_KEY = 'gatedo_admin_venture_os_v1';
const STAGES = ['Ideia', 'Discovery', 'Piloto', 'Receita'];

const OPPORTUNITIES = [
  {
    id: 'memorial',
    title: 'Gatedo Memorial',
    subtitle: 'Produto emocional de alta margem',
    stage: 'MVP imediato',
    horizon: '15 dias',
    owner: 'Produto + Parcerias',
    icon: Heart,
    color: '#ec4899',
    score: 94,
    impact: 98,
    complexity: 32,
    revenue: 'R$49-299 + comissao',
    model: 'B2C + parceiros',
    thesis:
      'Transformar o perfil do gato em memorial elegante no momento de maior vinculo emocional entre tutor e marca.',
    revenueLines: ['Photobook', 'Retrato artistico', 'Cremacao parceira', 'Joia de patinha', 'Certificado de vida'],
    kpis: ['Memoriais criados', 'Conversao para produto', 'Ticket medio', 'NPS pos-luto'],
    partners: ['Crematorios pet', 'Graficas premium', 'Artistas', 'Joalherias afetivas'],
    nextMoves: [
      'Criar modo memorial em perfil falecido',
      'Definir tom de UX sem abordagem agressiva',
      'Fechar 1 parceiro de cremacao e 1 de photobook',
      'Rodar piloto com tutores que ja perderam gatos',
    ],
    risk: 'Comunicacao precisa ser impecavel para acolher sem parecer oportunista.',
  },
  {
    id: 'cat-friendly',
    title: 'Cat-Friendly Certified',
    subtitle: 'Selo para moradia, PR e imobiliarias',
    stage: 'Discovery PR',
    horizon: '30 dias',
    owner: 'Marca + Parcerias',
    icon: Home,
    color: '#10b981',
    score: 88,
    impact: 92,
    complexity: 48,
    revenue: 'Selo + lead fee',
    model: 'B2B2C',
    thesis:
      'Criar um selo reconhecivel para apartamentos que aceitam gatos, resolvendo uma dor real e gerando midia espontanea.',
    revenueLines: ['Selo anual', 'Lead fee', 'Pacote para imobiliarias', 'Midia patrocinada'],
    kpis: ['Imoveis certificados', 'Leads gerados', 'Parceiros ativos', 'Citacoes na midia'],
    partners: ['QuintoAndar', 'ZAP', 'Imobiliarias locais', 'Administradoras'],
    nextMoves: [
      'Definir checklist Cat-Friendly',
      'Criar landing de certificacao',
      'Montar pitch para 3 imobiliarias',
      'Preparar press release com dados da dor',
    ],
    risk: 'Precisa de criterio juridico claro para o selo nao virar promessa fragil.',
  },
  {
    id: 'breeders',
    title: 'Breeders B2B',
    subtitle: 'SaaS para criadores de raca',
    stage: 'SaaS piloto',
    horizon: '45 dias',
    owner: 'Produto B2B',
    icon: ShieldCheck,
    color: '#f59e0b',
    score: 91,
    impact: 94,
    complexity: 58,
    revenue: 'R$200-800/mes',
    model: 'B2B SaaS',
    thesis:
      'Criadores faturam bem, sofrem com planilhas e pagam por uma ferramenta que organize ninhadas, pedigree e compradores.',
    revenueLines: ['Assinatura mensal', 'Certificados digitais', 'CRM de compradores', 'Relatorios de ninhada'],
    kpis: ['Criadores ativos', 'MRR B2B', 'Ninhadas cadastradas', 'Churn mensal'],
    partners: ['Gatis premium', 'Clubes de raca', 'Veterinarios reprodutivos', 'Assessorias juridicas'],
    nextMoves: [
      'Entrevistar 10 criadores',
      'Mapear fluxo de ninhada do nascimento a venda',
      'Prototipar CRM + pedigree simples',
      'Fechar 3 pilotos pagos',
    ],
    risk: 'Publico exigente: MVP precisa resolver uma dor central, nao ser apenas bonito.',
  },
  {
    id: 'tnr',
    title: 'Gestao de Colonias TNR',
    subtitle: 'Infraestrutura publica do universo felino',
    stage: 'Institucional',
    horizon: '60 dias',
    owner: 'Impacto + Gov',
    icon: Leaf,
    color: '#14b8a6',
    score: 84,
    impact: 90,
    complexity: 72,
    revenue: 'Contratos + ESG',
    model: 'Gov/ONG/B2B',
    thesis:
      'Quando ONGs e prefeituras usam o Gatedo para gerir colonias, a marca vira infraestrutura social felina.',
    revenueLines: ['Licenca municipal', 'Patrocinio ESG', 'Dashboard ONG', 'Campanhas de castracao'],
    kpis: ['Colonias mapeadas', 'Castrações', 'Voluntarios', 'Gatos monitorados'],
    partners: ['Prefeituras', 'ONGs', 'Clinicas populares', 'Empresas ESG'],
    nextMoves: [
      'Desenhar mapa de colonias',
      'Criar cadastro de cuidador e ponto TNR',
      'Escolher uma ONG piloto',
      'Montar proposta institucional simples',
    ],
    risk: 'Operacao depende de governanca e dados confiaveis em campo.',
  },
];

const PIPELINE_META = [
  { label: 'Ideia', color: '#94a3b8' },
  { label: 'Discovery', color: '#60a5fa' },
  { label: 'Piloto', color: '#f59e0b' },
  { label: 'Receita', color: '#10b981' },
];

function mergeSavedOpportunities(savedItems) {
  if (!Array.isArray(savedItems)) return OPPORTUNITIES;

  return OPPORTUNITIES.map((item) => {
    const saved = savedItems.find((entry) => entry.id === item.id);
    return saved ? { ...item, ...saved, icon: item.icon, color: item.color } : item;
  });
}

function loadOpportunities() {
  if (typeof window === 'undefined') return OPPORTUNITIES;

  try {
    const raw = window.localStorage.getItem(VENTURE_STORAGE_KEY);
    return mergeSavedOpportunities(raw ? JSON.parse(raw) : null);
  } catch {
    return OPPORTUNITIES;
  }
}

function saveOpportunities(items) {
  if (typeof window === 'undefined') return;
  const serializable = items.map(({ icon, ...item }) => item);
  window.localStorage.setItem(VENTURE_STORAGE_KEY, JSON.stringify(serializable));
}

function ProgressBar({ value, color }) {
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, desc, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}16` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <ArrowRight size={16} className="text-gray-300" />
      </div>
      <p className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 mt-4">{label}</p>
      <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mt-2">{desc}</p>
    </div>
  );
}

function OpportunityCard({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-3xl p-5 border transition-all group relative overflow-hidden ${
        active ? 'bg-white shadow-xl border-transparent -translate-y-1' : 'bg-white/80 border-gray-100 hover:bg-white hover:shadow-md'
      }`}
    >
      <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-10 group-hover:scale-125 transition-transform" style={{ backgroundColor: item.color }} />
      <div className="flex items-start justify-between gap-4 relative">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}18` }}>
            <Icon size={22} style={{ color: item.color }} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{item.stage}</p>
            <h3 className="text-sm font-black text-gray-900 mt-1 leading-tight">{item.title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: item.color }}>{item.score}</p>
          <p className="text-[9px] font-black text-gray-300 uppercase">score</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5 relative">
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-1">
            <span>Impacto</span><span>{item.impact}%</span>
          </div>
          <ProgressBar value={item.impact} color={item.color} />
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-1">
            <span>Complex.</span><span>{item.complexity}%</span>
          </div>
          <ProgressBar value={item.complexity} color="#94a3b8" />
        </div>
      </div>
    </button>
  );
}

function Matrix({ items, selectedId, onSelect }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Priorizacao</p>
          <h3 className="text-lg font-black text-gray-900">Impacto x Complexidade</h3>
        </div>
        <Target size={20} style={{ color: P }} />
      </div>

      <div className="relative h-72 rounded-3xl overflow-hidden border border-gray-100 bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="absolute left-4 top-4 text-[10px] font-black text-gray-300 uppercase">Alto impacto</div>
        <div className="absolute right-4 bottom-4 text-[10px] font-black text-gray-300 uppercase">Alta complexidade</div>
        <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-gray-200" />
        {items.map((item) => {
          const x = Math.min(88, Math.max(10, item.complexity));
          const y = 100 - Math.min(88, Math.max(12, item.impact));
          const Icon = item.icon;
          const active = selectedId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl flex items-center gap-2 px-3 py-2 shadow-lg border transition-all ${
                active ? 'scale-110 bg-gray-950 text-white border-gray-950 z-20' : 'bg-white text-gray-700 border-white hover:scale-105 z-10'
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <Icon size={14} style={{ color: active ? A : item.color }} />
              <span className="text-[10px] font-black whitespace-nowrap">{item.title.replace('Gatedo ', '')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailPanel({ item, onStageChange, onToggleMove, onNoteChange }) {
  const Icon = item.icon;
  const doneMoves = item.doneMoves || [];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 relative overflow-hidden" style={{ backgroundColor: DARK }}>
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-25" style={{ backgroundColor: item.color }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-3xl flex items-center justify-center" style={{ backgroundColor: A }}>
              <Icon size={26} style={{ color: P }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: A }}>{item.model}</p>
              <h2 className="text-2xl font-black text-white mt-1">{item.title}</h2>
              <p className="text-sm text-white/60 leading-relaxed mt-2 max-w-2xl">{item.thesis}</p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-4xl font-black" style={{ color: A }}>{item.score}</p>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Venture Score</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Clock, label: 'Horizonte', value: item.horizon },
              { icon: DollarSign, label: 'Receita', value: item.revenue },
              { icon: Users, label: 'Dono', value: item.owner },
            ].map((metric) => {
              const MetricIcon = metric.icon;
              return (
                <div key={metric.label} className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
                  <MetricIcon size={16} style={{ color: item.color }} />
                  <p className="text-[10px] font-black uppercase text-gray-400 mt-3">{metric.label}</p>
                  <p className="text-sm font-black text-gray-900 mt-1">{metric.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoList title="Linhas de receita" items={item.revenueLines} icon={DollarSign} color={item.color} />
            <InfoList title="KPIs que importam" items={item.kpis} icon={BarChart3} color={item.color} />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 p-5 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <Rocket size={18} style={{ color: item.color }} />
            <h3 className="font-black text-gray-900">Proximos movimentos</h3>
          </div>
          <div className="space-y-3">
            {item.nextMoves.map((move, index) => (
              <button key={move} onClick={() => onToggleMove(item.id, index)} className="w-full flex gap-3 text-left group">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white transition-transform group-hover:scale-105" style={{ backgroundColor: doneMoves.includes(index) ? '#10b981' : item.color }}>
                  {doneMoves.includes(index) ? <CheckCircle2 size={13} /> : index + 1}
                </div>
                <p className={`text-xs leading-relaxed ${doneMoves.includes(index) ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{move}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-2xl bg-white border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 mb-2">Estagio operacional</p>
            <select
              value={item.pipelineStage || 'Ideia'}
              onChange={(event) => onStageChange(item.id, event.target.value)}
              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-purple-300"
            >
              {STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </div>
          <div className="mt-3 p-4 rounded-2xl bg-white border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 mb-2">Nota executiva</p>
            <textarea
              value={item.note || ''}
              onChange={(event) => onNoteChange(item.id, event.target.value)}
              placeholder="Registre aprendizados, decisoes e proximos sinais de validacao..."
              className="w-full min-h-24 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-700 leading-relaxed focus:outline-none focus:border-purple-300"
            />
          </div>
          <div className="mt-5 p-4 rounded-2xl bg-white border border-gray-100">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 mb-1">Risco principal</p>
            <p className="text-xs text-gray-600 leading-relaxed">{item.risk}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoList({ title, items, icon: Icon, color }) {
  return (
    <div className="rounded-3xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={17} style={{ color }} />
        <h3 className="font-black text-gray-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle2 size={14} style={{ color }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminVentureOS() {
  const [opportunities, setOpportunities] = useState(() => loadOpportunities());
  const [selectedId, setSelectedId] = useState('memorial');
  const [syncState, setSyncState] = useState('local');
  const selected = opportunities.find((item) => item.id === selectedId) || opportunities[0];

  useEffect(() => {
    saveOpportunities(opportunities);
  }, [opportunities]);

  useEffect(() => {
    let alive = true;

    async function hydrate() {
      try {
        setSyncState('syncing');
        const remote = await fetchAdminVentures();
        if (!alive) return;

        if (remote.length > 0) {
          setOpportunities(mergeSavedOpportunities(remote));
        } else {
          const seeded = await syncAdminVentures(OPPORTUNITIES);
          if (alive && seeded.length > 0) setOpportunities(mergeSavedOpportunities(seeded));
        }
        if (alive) setSyncState('cloud');
      } catch {
        if (alive) setSyncState('local');
      }
    }

    hydrate();
    return () => { alive = false; };
  }, []);

  const totals = useMemo(() => {
    const avgImpact = Math.round(opportunities.reduce((sum, item) => sum + item.impact, 0) / opportunities.length);
    const avgComplexity = Math.round(opportunities.reduce((sum, item) => sum + item.complexity, 0) / opportunities.length);
    const quickWins = opportunities.filter((item) => item.impact >= 88 && item.complexity <= 50).length;
    const completedMoves = opportunities.reduce((sum, item) => sum + (item.doneMoves?.length || 0), 0);

    return { avgImpact, avgComplexity, quickWins, completedMoves };
  }, [opportunities]);

  const pipeline = useMemo(() => (
    PIPELINE_META.map((step) => ({
      ...step,
      count: opportunities.filter((item) => (item.pipelineStage || 'Ideia') === step.label).length,
    }))
  ), [opportunities]);

  const updateOpportunity = (id, patch) => {
    setOpportunities((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));
    patchAdminVenture(id, patch).catch(() => setSyncState('local'));
  };

  const toggleMove = (id, index) => {
    let patch = null;
    setOpportunities((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const doneMoves = item.doneMoves || [];
      const nextDone = doneMoves.includes(index)
        ? doneMoves.filter((entry) => entry !== index)
        : [...doneMoves, index];

      patch = { doneMoves: nextDone };
      return { ...item, doneMoves: nextDone };
    }));
    if (patch) patchAdminVenture(id, patch).catch(() => setSyncState('local'));
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem]" style={{ background: DARK }}>
        <div className="absolute inset-0 opacity-80" style={{ backgroundImage: `radial-gradient(circle at 15% 20%, ${P}55, transparent 34%), radial-gradient(circle at 85% 0%, ${A}35, transparent 32%)` }} />
        <div className="relative z-10 p-7 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: A }}>
              <Rocket size={20} style={{ color: P }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: A }}>Gatedo Venture OS</p>
              <p className="text-xs text-white/40">Central de expansao, pilotos e teses de negocio.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-end">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                O cerebro para escalar o Gatedo alem do app.
              </h1>
              <p className="text-sm md:text-base text-white/60 leading-relaxed mt-4 max-w-3xl">
                Organize oportunidades, donos, KPIs, parceiros e proximos movimentos em uma camada de inteligencia que pode virar produto B2B depois.
              </p>
              <span className="inline-flex mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{ backgroundColor: syncState === 'cloud' ? '#10b98122' : '#ffffff14', color: syncState === 'cloud' ? '#86efac' : '#fff' }}>
                {syncState === 'cloud' ? 'Sincronizado no banco' : syncState === 'syncing' ? 'Sincronizando...' : 'Modo local'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {pipeline.map((step) => (
                <div key={step.label} className="rounded-3xl border border-white/10 p-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{step.label}</p>
                  <p className="text-3xl font-black text-white mt-1">{step.count}</p>
                  <div className="h-1.5 rounded-full mt-3" style={{ backgroundColor: `${step.color}55` }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, step.count * 25)}%`, backgroundColor: step.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard icon={Layers} label="Oportunidades" value={opportunities.length} color={P} desc="Teses priorizadas para virar piloto, receita ou produto paralelo." />
        <MetricCard icon={TrendingUp} label="Impacto medio" value={`${totals.avgImpact}%`} color="#10b981" desc="Potencial de marca, receita, defensabilidade e distribuicao." />
        <MetricCard icon={LineChart} label="Complexidade" value={`${totals.avgComplexity}%`} color="#f59e0b" desc="Quanto menor, mais rapido o teste comercial e operacional." />
        <MetricCard icon={Sparkles} label="Acoes concluidas" value={totals.completedMoves} color="#ec4899" desc={`${totals.quickWins} quick wins com alto impacto e baixa friccao inicial.`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <div className="space-y-4">
          {opportunities.map((item) => (
            <OpportunityCard
              key={item.id}
              item={item}
              active={selectedId === item.id}
              onClick={() => setSelectedId(item.id)}
            />
          ))}
        </div>
        <Matrix items={opportunities} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <DetailPanel
        item={selected}
        onStageChange={(id, pipelineStage) => updateOpportunity(id, { pipelineStage })}
        onToggleMove={toggleMove}
        onNoteChange={(id, note) => updateOpportunity(id, { note })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <MapPin size={20} style={{ color: P }} />
            <div>
              <h3 className="font-black text-gray-900">Arquitetura de escala sugerida</h3>
              <p className="text-xs text-gray-500">Comeca dentro do admin, vira produto separado quando houver usuarios externos.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              ['1', 'Admin interno', 'Teses, KPIs e decisao'],
              ['2', 'Piloto operacional', 'Parceiros e usuarios reais'],
              ['3', 'Modulo B2B', 'Login externo e fluxo dedicado'],
              ['4', 'Suite paralela', 'Produto separado por vertical'],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-2xl p-4 bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: P }}>{step}</div>
                <h4 className="font-black text-gray-900 text-sm mt-4">{title}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 p-6 shadow-sm" style={{ backgroundColor: A }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: P }}>Proxima pagina</p>
          <h3 className="text-xl font-black mt-2" style={{ color: DARK }}>Investor Deck em tempo real</h3>
          <p className="text-xs leading-relaxed mt-3" style={{ color: `${DARK}bb` }}>
            Consolidar MRR, tutores ativos, gatos cadastrados, crescimento, retenção, NPS e pipeline de expansao em formato de pitch.
          </p>
          <button className="mt-5 w-full py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2" style={{ backgroundColor: DARK }}>
            Planejar Investor Deck <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
