import React, { useState, useMemo } from 'react';
import {
  Star, Building2, Megaphone, FlaskConical, Users,
  Instagram, MapPin, DollarSign, TrendingUp, Plus,
  ChevronDown, ExternalLink, Globe2, MessageCircle,
  Crown, Zap, Target, BarChart2, CheckCircle2,
  Clock, XCircle, ArrowRight, Filter, Search,
  Heart, RefreshCw, Award, Sparkles
} from 'lucide-react';

const P = '#8B4AFF';
const A = '#ebfc66';

// ─── Sample Data ─────────────────────────────────────────────────────────────

const INFLUENCERS = [
  { id: 1, name: 'Ana Lima • @mainecoonsdobrasil', platform: 'Instagram', followers: '287k', tier: 'Macro', niche: 'Maine Coon / Raça pura', city: 'São Paulo', status: 'Contatar', estRevenue: 'R$3.000–8.000/post', engRate: '6,8%', notes: 'Posts altíssima qualidade fotográfica. Não tem parceria de app ainda.' },
  { id: 2, name: 'Pedro Gatos • @gatoslindossp', platform: 'TikTok', followers: '98k', tier: 'Mid', niche: 'Humor / Lifestyle', city: 'São Paulo', status: 'Em contato', estRevenue: 'R$800–2.000/vídeo', engRate: '9,2%', notes: 'Respondeu DM. Aguardar proposta formal.' },
  { id: 3, name: 'Renata Vet • @dra.renata.felinos', platform: 'Instagram', followers: '64k', tier: 'Mid', niche: 'Saúde felina / Veterinária', city: 'Curitiba', status: 'Parceiro', estRevenue: 'Permuta / Indicação', engRate: '11,4%', notes: 'Veterinária felina. Indicações de autoridade. Alto valor para credibilidade.' },
  { id: 4, name: 'Gato Safado • @gatosafado_oficial', platform: 'TikTok', followers: '1,2mi', tier: 'Mega', niche: 'Humor / Viral', city: 'Rio de Janeiro', status: 'Pesquisar', estRevenue: 'R$15.000–40.000/post', engRate: '4,1%', notes: 'Conta de humor. Difícil alinhamento de marca. Avaliar caso a caso.' },
  { id: 5, name: 'Julia & Bengal • @bengal.life.br', platform: 'Instagram', followers: '43k', tier: 'Micro', niche: 'Bengal / Lifestyle premium', city: 'São Paulo', status: 'Contatar', estRevenue: 'R$400–1.200/post', engRate: '13,7%', notes: 'Micro-influencer com engajamento altíssimo. Audiência muito qualificada.' },
  { id: 6, name: 'Marcos SRD • @amordegatosrd', platform: 'YouTube', followers: '52k', tier: 'Mid', niche: 'SRD / Adoção / Resgate', city: 'BH', status: 'Em contato', estRevenue: 'R$600–1.500/vídeo', engRate: '8,3%', notes: 'Perfil de causas. Parceria de valor social + alcance.' },
  { id: 7, name: 'Camila Felinos • @felinosbr', platform: 'Instagram+TikTok', followers: '31k', tier: 'Micro', niche: 'Comportamento felino / Educação', city: 'Porto Alegre', status: 'Parceiro', estRevenue: 'Permuta Studio', engRate: '14,9%', notes: 'Primeira parceira Studio. Usa outputs para conteúdo semanal.' },
  { id: 8, name: 'Lara Persas • @persas_da_lara', platform: 'Instagram', followers: '19k', tier: 'Nano', niche: 'Persa / Raça pura', city: 'Recife', status: 'Contatar', estRevenue: 'R$200–500/post', engRate: '17,2%', notes: 'Nano-influencer com engajamento de comunidade. Nordeste sub-representado.' },
];

const CLINICS = [
  { id: 1, name: 'Clínica Felinos SP', city: 'São Paulo – Pinheiros', type: 'Especialista felinos', porte: 'Média', status: 'Piloto ativo', contact: 'Dra. Fernanda Costa', notes: 'Primeira clínica piloto. QR code na recepção. +22 tutores em 6 semanas.' },
  { id: 2, name: 'Hospital Vet USP – Ambulatório Felinos', city: 'São Paulo – Cidade Universitária', type: 'Universitário', porte: 'Grande', status: 'Negociando', contact: 'Prof. Dr. André Melo', notes: 'Parceria acadêmica + distribuição. Alta credibilidade. Processo lento.' },
  { id: 3, name: 'VetCat Clínica Exclusiva', city: 'Rio de Janeiro – Leblon', type: 'Especialista felinos', porte: 'Pequena', status: 'Contatar', contact: 'Via site', notes: 'Única clínica exclusiva de felinos no RJ. Audiência premium.' },
  { id: 4, name: 'Centro Veterinário Gatos BH', city: 'Belo Horizonte – Savassi', type: 'Mista / Foco felinos', porte: 'Média', status: 'Contatar', contact: 'Via Instagram @vetgatosbh', notes: 'Ativa no Instagram. Abordagem via DM pode funcionar.' },
  { id: 5, name: 'Clínica Miauvet', city: 'Curitiba – Batel', type: 'Especialista felinos', porte: 'Pequena', status: 'Piloto ativo', contact: 'Dra. Renata (parceira influencer)', notes: 'Conexão via Dra. Renata. Painel ativo. +11 tutores em 3 semanas.' },
  { id: 6, name: 'PetVet Rede – Unidades SP', city: 'São Paulo – múltiplas unidades', type: 'Rede', porte: 'Grande', status: 'Pesquisar', contact: 'Comercial da rede', notes: 'Abordagem institucional B2B. Maior esforço, maior escala.' },
];

const BRANDS = [
  { id: 1, name: 'Royal Canin Brasil', segment: 'Ração premium', type: 'Branded content + Dados', potentialRevenue: 'R$30k–120k/ano', status: 'Pesquisar', contact: 'Mktg Brasil – LinkedIn', notes: 'Maior interessada em dados por raça. Segmento Maine Coon e Bengal são prioridade deles.' },
  { id: 2, name: 'Hills Science Diet', segment: 'Ração terapêutica', type: 'Sampling + Conteúdo', potentialRevenue: 'R$15k–60k/ano', status: 'Contatar', contact: 'Via distribuidor Ceva', notes: 'Foco em saúde. Alinhamento altíssimo com posicionamento Gatedo.' },
  { id: 3, name: 'Litter Champ BR', segment: 'Acessórios / Areia', type: 'Afiliado + Review', potentialRevenue: 'R$5k–20k/ano', status: 'Em negociação', contact: 'Contato iniciado', notes: 'Menor ticket, alta conversão. Produto muito pesquisado pela base.' },
  { id: 4, name: 'Porto Seguro Pet', segment: 'Seguro pet', type: 'Revenue share apólice', potentialRevenue: 'R$50–300/apólice convertida', status: 'Pesquisar', contact: 'Canal parcerias PS', notes: 'Maior seguradora pet BR. Histórico Gatedo como scoring = proposta clara.' },
  { id: 5, name: 'KatKin (UK) – Expansão BR', segment: 'Cat food D2C premium', type: 'Distribuição + Co-branding', potentialRevenue: 'TBD – pioneirismo', status: 'Pesquisar', contact: 'partnerships@katkin.com', notes: 'KatKin ainda não está no Brasil. Ser o parceiro de entrada deles seria enorme.' },
  { id: 6, name: 'Guabi / Gourmet Cat', segment: 'Ração nacional premium', type: 'Sampling + Afiliado', potentialRevenue: 'R$8k–25k/ano', status: 'Contatar', contact: 'Trade mktg Guabi', notes: 'Marca nacional em expansão premium. Mais acessível que Royal Canin para iniciar.' },
  { id: 7, name: 'Flash Benefícios / Caju', segment: 'Benefícios RH', type: 'Canal B2B corporativo', potentialRevenue: 'R$15–50/funcionário/mês', status: 'Pesquisar', contact: 'Parcerias comerciais', notes: 'Distribuir Gatedo Premium via plataforma de benefícios. Escala sem força de venda.' },
];

const EXPERIMENTS = [
  { id: 1, name: 'QR code do gato em outputs do Studio', hypothesis: 'Cada conteúdo compartilhado gera ≥0,3 novos cadastros', category: 'Aquisição', status: 'Rodando', startDate: 'Mai 2026', result: null, priority: 'Alta' },
  { id: 2, name: 'WhatsApp grupo "Maine Coon SP"', hypothesis: '500 membros em 30 dias geram 50+ novos tutores ativos no app', category: 'Comunidade', status: 'Planejado', startDate: 'Jun 2026', result: null, priority: 'Alta' },
  { id: 3, name: 'Desafio semanal "#GatoDoMomento"', hypothesis: 'Desafio semanal gera +30% de uso do Studio e viral coefficient k>0,3', category: 'Engajamento', status: 'Rodando', startDate: 'Abr 2026', result: 'K = 0,21 na semana 1. Meta não atingida. Iterando formato.', priority: 'Alta' },
  { id: 4, name: '"Saúde em Dia" — Badge público no perfil', hypothesis: 'Badge visível aumenta D30 retention em ≥8 pontos percentuais', category: 'Retenção', status: 'Planejado', startDate: 'Jul 2026', result: null, priority: 'Média' },
  { id: 5, name: 'Newsletter "O que seu gato está tentando te dizer"', hypothesis: 'Open rate >35% e ≥5% clica para o app a cada edição', category: 'Marca', status: 'Planejado', startDate: 'Jun 2026', result: null, priority: 'Alta' },
  { id: 6, name: 'Push de aniversário do gato', hypothesis: 'Push personalizado no aniversário gera +15% de abertura do app', category: 'Retenção', status: 'Concluído', startDate: 'Mar 2026', result: '✅ Taxa de abertura: 41% vs 11% do push padrão. Implementar como padrão.', priority: 'Alta' },
  { id: 7, name: 'Painel vet MVP — 5 clínicas piloto', hypothesis: 'Cada clínica piloto gera ≥15 novos tutores ativos em 30 dias', category: 'B2B', status: 'Rodando', startDate: 'Mai 2026', result: 'Média atual: 16,5 tutores/clínica. Meta atingida.', priority: 'Alta' },
  { id: 8, name: '"Chapter" Maine Coon no Comunigato', hypothesis: 'Sub-grupo por raça aumenta posts/usuário em ≥40%', category: 'Comunidade', status: 'Planejado', startDate: 'Ago 2026', result: null, priority: 'Média' },
];

const CAMPAIGNS = [
  { id: 1, name: 'Dia do Gato BR 🐱', date: '08/08/2026', type: 'Branding / Cultural', channels: ['Instagram', 'TikTok', 'Studio', 'Push'], status: 'Planejando', goal: 'Tornar o Gatedo sinônimo do Dia do Gato no Brasil. Meta: 500k impressões orgânicas.', owner: 'Marketing' },
  { id: 2, name: 'Lançamento Painel Vet', date: 'Jun 2026', type: 'B2B Launch', channels: ['LinkedIn', 'Email', 'WhatsApp clínicas'], status: 'Em prep', goal: 'Ativar 20 novas clínicas em 30 dias.', owner: 'Comercial' },
  { id: 3, name: 'Studio Challenge #MeuGatoArtista', date: 'Mai 2026', type: 'UGC / Viral', channels: ['Instagram', 'TikTok', 'Studio'], status: 'Ao vivo', goal: '+2.000 outputs criados. K viral > 0,4.', owner: 'Marketing' },
  { id: 4, name: 'Back to School — Gatedo para universitários', date: 'Jul–Ago 2026', type: 'Segmentado', channels: ['TikTok', 'Instagram', 'Parceiros'], status: 'Planejando', goal: 'Atingir tutores 18–25 anos em repúblicas e apartamentos compartilhados.', owner: 'Growth' },
  { id: 5, name: 'Parceria Royal Canin — Maine Coon Week', date: 'Set 2026', type: 'Branded Content', channels: ['App', 'Email', 'Instagram'], status: 'Prospectando', goal: 'Primeira campanha paga. Validar modelo de branded content no app.', owner: 'Parcerias' },
  { id: 6, name: 'Newsletter "Felinos em Foco" — Launch', date: 'Jun 2026', type: 'Conteúdo / Marca', channels: ['Email', 'Instagram'], status: 'Em prep', goal: '2.000 inscritos na 1ª edição. Open rate >35%.', owner: 'Conteúdo' },
];

// ─── Status Badges ─────────────────────────────────────────────────────────
const statusConfig = {
  'Parceiro':     { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100', icon: CheckCircle2 },
  'Piloto ativo': { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100', icon: CheckCircle2 },
  'Concluído':    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100', icon: CheckCircle2 },
  'Ao vivo':      { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100', icon: Zap },
  'Em contato':   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',  icon: MessageCircle },
  'Em negociação':{ bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',  icon: MessageCircle },
  'Negociando':   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',  icon: MessageCircle },
  'Rodando':      { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',  icon: RefreshCw },
  'Em prep':      { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100', icon: Clock },
  'Planejando':   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100', icon: Clock },
  'Planejado':    { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100', icon: Clock },
  'Contatar':     { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-100',  icon: Target },
  'Pesquisar':    { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-100',  icon: Search },
  'Prospectando': { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-100',  icon: Target },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig['Pesquisar'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}>
      <Icon size={9} />{status}
    </span>
  );
}

function TierBadge({ tier }) {
  const map = { Mega: [P,'#fff'], Macro: ['#6366f1','#fff'], Mid: ['#f59e0b','#fff'], Micro: ['#10b981','#fff'], Nano: ['#6b7280','#fff'] };
  const [bg, fg] = map[tier] || ['#ccc','#333'];
  return <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: bg, color: fg }}>{tier}</span>;
}

function PriorityDot({ priority }) {
  const map = { Alta: '#ef4444', Média: '#f59e0b', Baixa: '#10b981' };
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: map[priority] || '#ccc' }} />;
}

// ─── Column Kanban-style list ───────────────────────────────────────────────
function PipelineColumn({ title, items, color, count }) {
  return (
    <div className="flex-1 min-w-[180px]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-xs font-black text-gray-700">{title}</p>
        <span className="text-[10px] font-bold text-gray-400 ml-auto">{count}</span>
      </div>
      <div className="space-y-2">{items}</div>
    </div>
  );
}

// ─── Tab Button ─────────────────────────────────────────────────────────────
function Tab({ id, label, icon: Icon, active, onClick, badge }) {
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap relative
        ${active ? 'text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
      style={active ? { backgroundColor: P } : {}}>
      <Icon size={12} />
      {label}
      {badge && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center text-white" style={{ backgroundColor: '#ef4444' }}>{badge}</span>}
    </button>
  );
}

// ─── KPI Strip ──────────────────────────────────────────────────────────────
function KpiStrip({ items }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {items.map(k => (
        <div key={k.label} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
          <p className="text-[10px] text-gray-400 font-medium">{k.label}</p>
          <p className="text-xl font-black mt-0.5" style={{ color: k.color || P }}>{k.value}</p>
          {k.sub && <p className="text-[10px] text-gray-400 mt-0.5">{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminNetworkOps() {
  const [activeTab, setActiveTab] = useState('influencers');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [expandedId, setExpandedId] = useState(null);

  const tabs = [
    { id: 'influencers', label: 'Influenciadores', icon: Star,        badge: null },
    { id: 'clinics',     label: 'Clínicas Vet',    icon: Heart,        badge: null },
    { id: 'brands',      label: 'Marcas & Deals',  icon: Building2,    badge: null },
    { id: 'experiments', label: 'Experimentos',    icon: FlaskConical, badge: 2 },
    { id: 'campaigns',   label: 'Campanhas',       icon: Megaphone,    badge: null },
    { id: 'ideas',       label: 'Oportunidades',   icon: Sparkles,     badge: null },
  ];

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const allStatuses = (data, key = 'status') => ['Todos', ...new Set(data.map(d => d[key]))];

  const filterData = (data, searchKeys) =>
    data.filter(d => {
      const matchSearch = !search || searchKeys.some(k => (d[k] || '').toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'Todos' || d.status === filterStatus;
      return matchSearch && matchStatus;
    });

  // ── Summary metrics ────────────────────────────────────────────────────────
  const influencerMetrics = {
    total: INFLUENCERS.length,
    partners: INFLUENCERS.filter(i => i.status === 'Parceiro').length,
    inContact: INFLUENCERS.filter(i => ['Em contato', 'Negociando'].includes(i.status)).length,
    totalReach: '1,9mi',
  };
  const clinicMetrics = {
    total: CLINICS.length,
    active: CLINICS.filter(c => c.status === 'Piloto ativo').length,
    tutorsMth: '+33',
    target: '50',
  };
  const brandMetrics = {
    total: BRANDS.length,
    inPipeline: BRANDS.filter(b => ['Em negociação', 'Em contato'].includes(b.status)).length,
    potentialArr: 'R$160k+',
  };

  const toggle = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-7"
        style={{ background: `linear-gradient(135deg, #0f0a1e 0%, #1a0f3a 100%)` }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `radial-gradient(ellipse at 15% 60%, ${P} 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, ${A}60 0%, transparent 50%)` }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: A }}>
                <Globe2 size={14} style={{ color: P }} />
              </div>
              <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: A }}>
                Gatedo · Network Ops Center
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">Central de Expansão de Rede</h1>
            <p className="text-white/50 text-xs mt-1 max-w-lg">
              Influenciadores, clínicas veterinárias, marcas parceiras, experimentos de crescimento e campanhas —
              tudo em um lugar operacional.
            </p>
          </div>
          <div className="flex gap-3">
            {[
              { label: 'Parceiros ativos', value: String(influencerMetrics.partners + clinicMetrics.active) },
              { label: 'Negoc. abertas', value: String(influencerMetrics.inContact + brandMetrics.inPipeline + 1) },
              { label: 'Experimentos vivos', value: String(EXPERIMENTS.filter(e => e.status === 'Rodando' || e.status === 'Ao vivo').length) },
            ].map(k => (
              <div key={k.label} className="rounded-2xl p-3 text-center border border-white/10 min-w-[80px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-xl font-black text-white">{k.value}</p>
                <p className="text-[9px] text-white/40 mt-0.5 font-medium">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-1 flex-wrap shadow-sm flex-1">
          {tabs.map(t => <Tab key={t.id} {...t} active={activeTab === t.id} onClick={setActiveTab} />)}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-100 rounded-xl bg-white shadow-sm focus:outline-none focus:border-purple-300 w-40" />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); }}
            className="text-xs border border-gray-100 rounded-xl bg-white shadow-sm px-2 py-2 focus:outline-none focus:border-purple-300">
            {allStatuses(
              activeTab === 'influencers' ? INFLUENCERS :
              activeTab === 'clinics' ? CLINICS :
              activeTab === 'brands' ? BRANDS :
              activeTab === 'experiments' ? EXPERIMENTS : CAMPAIGNS
            ).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── INFLUENCIADORES ─────────────────────────────────────────────── */}
      {activeTab === 'influencers' && (() => {
        const filtered = filterData(INFLUENCERS, ['name', 'niche', 'city', 'platform']);
        return (
          <div className="space-y-4">
            <KpiStrip items={[
              { label: 'Influenciadores mapeados', value: influencerMetrics.total, color: P },
              { label: 'Parceiros ativos', value: influencerMetrics.partners, color: '#10b981', sub: 'conteúdo ao vivo' },
              { label: 'Em contato / negociando', value: influencerMetrics.inContact, color: '#f59e0b' },
              { label: 'Alcance potencial total', value: influencerMetrics.totalReach, color: '#6366f1', sub: 'seguidores combinados' },
            ]} />

            <div className="space-y-2">
              {filtered.map(inf => (
                <div key={inf.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-purple-100 transition-all shadow-sm">
                  <button className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => toggle(inf.id)}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                      style={{ backgroundColor: P }}>{inf.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-gray-900 truncate">{inf.name}</p>
                        <TierBadge tier={inf.tier} />
                        <StatusBadge status={inf.status} />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{inf.platform} · {inf.followers} · {inf.city} · eng {inf.engRate}</p>
                    </div>
                    <div className="flex-shrink-0 text-right hidden md:block">
                      <p className="text-[10px] text-gray-400">receita est.</p>
                      <p className="text-xs font-black" style={{ color: P }}>{inf.estRevenue}</p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${expandedId === inf.id ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedId === inf.id && (
                    <div className="px-4 pb-4 border-t border-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-gray-500 mb-1">NICHO</p>
                          <p className="text-xs text-gray-700">{inf.niche}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-gray-500 mb-1">TIPO DE PARCERIA</p>
                          <p className="text-xs text-gray-700">{inf.estRevenue}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-gray-500 mb-1">ENGAJAMENTO</p>
                          <p className="text-xs font-black" style={{ color: '#10b981' }}>{inf.engRate}</p>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: `${P}08`, border: `0.5px solid ${P}20` }}>
                        <p className="text-[10px] font-black mb-1" style={{ color: P }}>NOTAS</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{inf.notes}</p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {inf.status === 'Contatar' && (
                          <button className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl text-white" style={{ backgroundColor: P }}>
                            <MessageCircle size={12} /> Iniciar contato
                          </button>
                        )}
                        <button className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600">
                          Ver perfil <ExternalLink size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Dica estratégica */}
            <div className="rounded-2xl p-4 border-l-4" style={{ borderColor: A, backgroundColor: `${A}15` }}>
              <p className="text-xs font-black text-gray-800 mb-1">💡 Estratégia de influencer para Gatedo</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Priorize <strong>micro e nano-influencers</strong> (10k–100k) antes de Mega. Engajamento 2–3x maior,
                custo 10x menor e audiência muito mais qualificada. Um nano com 17% de eng como @persas_da_lara
                converte mais do que um mega com 4%. Comece com permuta de Studio, evolua para fee após ROI comprovado.
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── CLÍNICAS ────────────────────────────────────────────────────── */}
      {activeTab === 'clinics' && (() => {
        const filtered = filterData(CLINICS, ['name', 'city', 'type', 'contact']);
        return (
          <div className="space-y-4">
            <KpiStrip items={[
              { label: 'Clínicas no pipeline', value: clinicMetrics.total, color: P },
              { label: 'Pilotos ativos', value: clinicMetrics.active, color: '#10b981', sub: '2 clínicas' },
              { label: 'Tutores via clínicas/mês', value: clinicMetrics.tutorsMth, color: '#f59e0b', sub: 'média dos pilotos' },
              { label: 'Meta 2026', value: clinicMetrics.target, color: '#6366f1', sub: 'clínicas ativas' },
            ]} />

            <div className="space-y-2">
              {filtered.map(c => (
                <div key={c.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-green-100 transition-all shadow-sm">
                  <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => toggle(c.id)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#10b98115' }}>
                      <Heart size={18} style={{ color: '#10b981' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-gray-900">{c.name}</p>
                        <StatusBadge status={c.status} />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{c.porte}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        <MapPin size={9} className="inline mr-0.5" />{c.city} · {c.type}
                      </p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedId === c.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 space-y-3 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-gray-500 mb-1">CONTATO</p>
                          <p className="text-xs text-gray-700">{c.contact}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-gray-500 mb-1">TIPO</p>
                          <p className="text-xs text-gray-700">{c.type} · {c.porte}</p>
                        </div>
                      </div>
                      <div className="rounded-xl p-3" style={{ backgroundColor: '#10b98108', border: '0.5px solid #10b98120' }}>
                        <p className="text-[10px] font-black text-green-700 mb-1">NOTAS</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{c.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-black text-gray-900 mb-3">🗺️ Mapa de prioridade geográfica</p>
              <div className="space-y-1">
                {[
                  { city: 'São Paulo', target: 20, current: 2, color: P },
                  { city: 'Rio de Janeiro', target: 8, current: 0, color: '#6366f1' },
                  { city: 'Belo Horizonte', target: 5, current: 0, color: '#f59e0b' },
                  { city: 'Curitiba', target: 4, current: 1, color: '#10b981' },
                  { city: 'Porto Alegre', target: 4, current: 0, color: '#ec4899' },
                  { city: 'Brasília + outras', target: 9, current: 0, color: '#0ea5e9' },
                ].map(g => (
                  <div key={g.city} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-28 flex-shrink-0">{g.city}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(g.current / g.target) * 100}%`, backgroundColor: g.color }} />
                    </div>
                    <span className="text-xs text-gray-400 w-16 text-right">{g.current}/{g.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MARCAS & DEALS ──────────────────────────────────────────────── */}
      {activeTab === 'brands' && (() => {
        const filtered = filterData(BRANDS, ['name', 'segment', 'type']);
        return (
          <div className="space-y-4">
            <KpiStrip items={[
              { label: 'Marcas no pipeline', value: brandMetrics.total, color: P },
              { label: 'Em negociação ativa', value: brandMetrics.inPipeline, color: '#f59e0b' },
              { label: 'ARR potencial total', value: brandMetrics.potentialArr, color: '#10b981', sub: 'se tudo fechar' },
              { label: 'Meta 2026', value: '1 deal', color: '#6366f1', sub: 'ração ou seguro' },
            ]} />
            <div className="space-y-2">
              {filtered.map(b => (
                <div key={b.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-amber-100 transition-all shadow-sm">
                  <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => toggle(b.id)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#f59e0b15' }}>
                      <Building2 size={18} style={{ color: '#f59e0b' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-gray-900">{b.name}</p>
                        <StatusBadge status={b.status} />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{b.segment}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{b.type} · {b.potentialRevenue}</p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${expandedId === b.id ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedId === b.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 space-y-3 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-gray-500 mb-1">CONTATO / ENTRADA</p>
                          <p className="text-xs text-gray-700">{b.contact}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ backgroundColor: '#f59e0b08' }}>
                          <p className="text-[10px] font-black text-amber-700 mb-1">RECEITA POTENCIAL</p>
                          <p className="text-sm font-black text-gray-900">{b.potentialRevenue}</p>
                        </div>
                      </div>
                      <div className="rounded-xl p-3 bg-gray-50">
                        <p className="text-[10px] font-black text-gray-500 mb-1">NOTAS ESTRATÉGICAS</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{b.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── EXPERIMENTOS ────────────────────────────────────────────────── */}
      {activeTab === 'experiments' && (() => {
        const filtered = filterData(EXPERIMENTS, ['name', 'hypothesis', 'category']);
        const running = filtered.filter(e => e.status === 'Rodando' || e.status === 'Ao vivo');
        const planned = filtered.filter(e => e.status === 'Planejado');
        const done = filtered.filter(e => e.status === 'Concluído');
        return (
          <div className="space-y-4">
            <KpiStrip items={[
              { label: 'Rodando agora', value: running.length, color: '#3b82f6', sub: 'hipóteses ativas' },
              { label: 'Planejados', value: planned.length, color: '#f59e0b' },
              { label: 'Concluídos', value: done.length, color: '#10b981', sub: 'com resultado' },
              { label: 'Vitórias confirmadas', value: done.filter(d => d.result?.includes('✅')).length, color: P, sub: 'hipóteses validadas' },
            ]} />

            <div className="space-y-2">
              {filtered.map(exp => (
                <div key={exp.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all
                  ${exp.status === 'Rodando' ? 'border-blue-100' : exp.status === 'Concluído' ? 'border-green-100' : 'border-gray-100'}`}>
                  <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => toggle(exp.id)}>
                    <PriorityDot priority={exp.priority} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-gray-900">{exp.name}</p>
                        <StatusBadge status={exp.status} />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{exp.category}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">Hipótese: {exp.hypothesis}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{exp.startDate}</span>
                    <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${expandedId === exp.id ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedId === exp.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 space-y-3 pt-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-black text-gray-500 mb-1">HIPÓTESE COMPLETA</p>
                        <p className="text-xs text-gray-700 leading-relaxed">"{exp.hypothesis}"</p>
                      </div>
                      {exp.result ? (
                        <div className="rounded-xl p-3"
                          style={{ backgroundColor: exp.result.includes('✅') ? '#10b98112' : '#f59e0b12',
                                   border: `0.5px solid ${exp.result.includes('✅') ? '#10b98130' : '#f59e0b30'}` }}>
                          <p className="text-[10px] font-black mb-1"
                            style={{ color: exp.result.includes('✅') ? '#10b981' : '#f59e0b' }}>RESULTADO</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{exp.result}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl p-3 bg-blue-50 border border-blue-100">
                          <p className="text-[10px] font-black text-blue-600 mb-1">STATUS</p>
                          <p className="text-xs text-blue-700">{exp.status === 'Planejado' ? '📋 Aguardando início. Definir data e responsável.' : '🔄 Em andamento. Coleta de dados em curso.'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── CAMPANHAS ───────────────────────────────────────────────────── */}
      {activeTab === 'campaigns' && (() => {
        const filtered = filterData(CAMPAIGNS, ['name', 'type', 'goal', 'owner']);
        return (
          <div className="space-y-4">
            <KpiStrip items={[
              { label: 'Campanhas ativas', value: CAMPAIGNS.filter(c => c.status === 'Ao vivo').length, color: '#10b981', sub: 'ao vivo agora' },
              { label: 'Em preparação', value: CAMPAIGNS.filter(c => c.status === 'Em prep').length, color: '#f59e0b' },
              { label: 'Planejadas', value: CAMPAIGNS.filter(c => c.status === 'Planejando').length, color: P },
              { label: 'Maior oportunidade', value: '8/ago', color: '#ef4444', sub: 'Dia do Gato BR' },
            ]} />
            <div className="space-y-2">
              {filtered.map(c => (
                <div key={c.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all shadow-sm">
                  <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => toggle(c.id)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${P}15` }}>
                      <Megaphone size={18} style={{ color: P }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-gray-900">{c.name}</p>
                        <StatusBadge status={c.status} />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{c.type}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">📅 {c.date} · 👤 {c.owner}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end max-w-[140px]">
                      {c.channels.slice(0,3).map(ch => (
                        <span key={ch} className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100 font-medium">{ch}</span>
                      ))}
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${expandedId === c.id ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedId === c.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 space-y-3 pt-3">
                      <div className="rounded-xl p-3" style={{ backgroundColor: `${P}08`, border: `0.5px solid ${P}20` }}>
                        <p className="text-[10px] font-black mb-1" style={{ color: P }}>OBJETIVO</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{c.goal}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-black text-gray-500 mb-2">CANAIS</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.channels.map(ch => (
                            <span key={ch} className="text-xs font-bold px-2 py-1 rounded-lg text-white"
                              style={{ backgroundColor: P }}>{ch}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── OPORTUNIDADES ───────────────────────────────────────────────── */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${P} 0%, #4B1FA8 100%)` }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 80% 50%, ${A} 0%, transparent 60%)` }} />
            <div className="relative z-10">
              <p className="text-[10px] font-black tracking-[3px] uppercase mb-2" style={{ color: A }}>Oportunidades Não Óbvias</p>
              <p className="text-lg font-black text-white mb-1">Movimentos que o mercado ainda não fez</p>
              <p className="text-white/60 text-xs">Cada um desses é um whitespace real no Brasil. O timing importa — quem chegar primeiro define o território.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '📱', color: '#25D366', title: 'WhatsApp Communities por Raça', urgency: 'Fazer agora', effort: 'Baixo',
                desc: 'Criar grupos "Maine Coon SP", "Bengal BR", "SRD Adoção SP" administrados pelo Gatedo. Brasil tem 147mi de usuários de WhatsApp. É onde tutores de gatos realmente vivem e trocam informação. Cada grupo é um canal de recrutamento ativo, gratuito e permanente.',
                actions: ['Criar 5 grupos por raça + 2 por causa (adoção, SRD)', 'Gatedo como admin + curador de conteúdo', 'Link de entrada no app e no Studio', 'Meta: 500 membros ativos por grupo em 90 dias'] },
              { icon: '🔍', color: '#EA4335', title: 'SEO de Long-tail Felino', urgency: 'Oportunidade imediata', effort: 'Baixo/Médio',
                desc: '"Quanto tempo Maine Coon vive", "sinais de insuficiência renal em gatos", "quando castrar gato Bengal" — são buscas com alto volume e baixa concorrência. Um blog técnico do Gatedo domina esse tráfego e converte em downloads. Custo: apenas tempo.',
                actions: ['Mapear 50 keywords com alto volume + baixa concorrência', 'Escrever 2 artigos/semana com autoridade clínica', 'Integrar CTA no final de cada artigo ("acompanhe no app")', 'Parceria com vets parceiros como co-autores'] },
              { icon: '📅', color: '#ef4444', title: 'Dia do Gato (8/ago) — Propriedade Gatedo', urgency: '⚡ Urgente', effort: 'Médio',
                desc: 'Nenhum player nacional "owns" este dia ainda. Campanha anual com trend no TikTok, desafio no Studio, badge especial e cobertura de mídia. Quem chegar primeiro, fica. Em 2–3 anos, o Dia do Gato no Brasil = Gatedo.',
                actions: ['Planejar campanha completa para 8/ago/2026', 'Criar hashtag proprietária #DiaDoGatoGatedo', 'Desafio Studio especial com badge exclusivo', 'Parcerias com clínicas e influencers para amplificar'] },
              { icon: '🐾', color: P, title: 'Chapters por Raça no Comunigato', urgency: 'Q3 2026', effort: 'Médio',
                desc: 'Sub-comunidades por raça dentro do Comunigato. Donos de Maine Coon querem falar COM outros donos de Maine Coon. Hiper-segmentação cria engajamento que rede genérica nunca alcança. Cada chapter vira uma comunidade com vida própria.',
                actions: ['Lançar 3 chapters: Maine Coon, Bengal, SRD', 'Moderadores voluntários (power users com benefícios)', 'Conteúdo específico por raça no wiki integrado', 'Expand para 10 chapters até final de 2026'] },
              { icon: '🎓', color: '#6366f1', title: 'Gatedo Academy — Educação Felina', urgency: 'Q4 2026', effort: 'Médio',
                desc: 'Mini-cursos gratuitos dentro do app: "Alimentação correta do Bengal", "Sinais de doença renal em gatos idosos", "Enriquecimento ambiental em apartamento". Co-produzido com vets parceiros. Posiciona o Gatedo como autoridade de conhecimento, não apenas ferramenta.',
                actions: ['Produzir 5 micro-cursos de 5–10min com vets parceiros', 'Certificado "Tutor Consciente" compartilhável no perfil', 'Integração com timeline de saúde do gato', 'Versão premium com cursos especializados por raça'] },
              { icon: '🤝', color: '#f59e0b', title: 'Programa Embaixadores Gatedo', urgency: 'Fazer agora', effort: 'Baixo',
                desc: 'Transformar os 500 tutores mais ativos em embaixadores com benefícios reais: Studio premium gratuito, badge exclusivo no perfil, acesso antecipado a features. Em troca: indicações, reviews, UGC. Custo quase zero, impacto direto em aquisição e retenção.',
                actions: ['Identificar top 500 usuários por atividade', 'Criar "Gatedo Ambassador Program" com ranking público', 'Benefícios: Studio Pro, badge, early access, swag', 'Meta: cada embaixador ativa 3+ novos tutores/mês'] },
              { icon: '📰', color: '#0ea5e9', title: 'Newsletter "Felinos em Foco"', urgency: 'Fazer agora', effort: 'Baixo',
                desc: 'Email semanal de autoridade sobre comportamento e saúde felina. Sem propaganda. Apenas conteúdo que faz o tutor parecer mais inteligente sobre o gato dele. Newsletters de nicho com conteúdo real têm open rate 40–60%. É marca, não canal.',
                actions: ['Lançar v1 com 2.000 inscritos do app', 'Formato: 1 tema clínico + 1 dica comportamental + 1 raça em destaque', 'Co-autores rotativos: vets parceiros', 'Vender patrocínio da newsletter depois de 5k inscritos'] },
              { icon: '🌐', color: '#10b981', title: 'API Gatedo para Software Veterinário', urgency: '2026', effort: 'Alto',
                desc: 'API que permite softwares de gestão de clínicas (Vetsoft, VetPlan, Memed) integrarem o histórico de saúde do Gatedo. Quando o veterinário abre o prontuário do paciente, já vê os dados do Gatedo. Isso transforma o app em infraestrutura — impossível de desativar.',
                actions: ['Documentar API pública de leitura de histórico', 'Parceria com 1 software veterinário para integração piloto', 'Criar programa de parceiros API com certificação', 'Cada integração é um canal de distribuição permanente'] },
            ].map(op => (
              <div key={op.title} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{op.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-gray-900">{op.title}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                      style={{ backgroundColor: op.color }}>{op.urgency}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">esforço {op.effort}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{op.desc}</p>
                <div className="border-t border-gray-50 pt-3 space-y-1.5">
                  {op.actions.map(a => (
                    <div key={a} className="flex items-start gap-2">
                      <ArrowRight size={11} className="mt-0.5 flex-shrink-0" style={{ color: op.color }} />
                      <p className="text-[11px] text-gray-500 leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
