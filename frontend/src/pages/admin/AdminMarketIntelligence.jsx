import React, { useState, useEffect, useRef } from 'react';
import {
  Globe2, TrendingUp, DollarSign, Cat, Users, Smartphone,
  ExternalLink, ChevronRight, Award, Zap, ShoppingBag,
  Heart, BarChart2, Map, Star, ArrowUpRight, Building2,
  FlaskConical, Wifi, Package
} from 'lucide-react';

// ─── Palette ─────────────────────────────────────────────────────────────────
const P = '#8B4AFF';
const A = '#ebfc66';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target, duration = 1400, suffix = '') {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        setVal(Math.floor(p * target));
        if (p < 1) requestAnimationFrame(step);
        else setVal(target);
      };
      requestAnimationFrame(step);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [val, ref];
}

// ─── Mini bar chart (SVG) ─────────────────────────────────────────────────────
function BarChart({ data, color = P, height = 80 }) {
  const max = Math.max(...data.map(d => d.value));
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 16);
        const x = i * w + w * 0.1;
        return (
          <g key={i}>
            <rect x={x} y={height - barH - 14} width={w * 0.8} height={barH}
              fill={color} rx="2" opacity="0.85" />
            <text x={x + w * 0.4} y={height - 2} textAnchor="middle"
              fontSize="6" fill="#888" fontFamily="sans-serif">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Horizontal rank bar ─────────────────────────────────────────────────────
function RankBar({ label, value, max, color = P, flag, unit = '' }) {
  const [width, setWidth] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      setTimeout(() => setWidth((value / max) * 100), 100);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, max]);
  return (
    <div ref={ref} className="flex items-center gap-3 py-2">
      {flag && <span className="text-lg w-7 flex-shrink-0">{flag}</span>}
      <span className="text-xs text-gray-500 w-28 flex-shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-20 text-right flex-shrink-0">
        {value}{unit}
      </span>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent, delay = 0 }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${P}15` }}>
          <Icon size={18} style={{ color: P }} />
        </div>
        {accent && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ backgroundColor: A, color: P }}>{accent}</span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 mt-2 leading-none">{value}</p>
      <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Company Card ─────────────────────────────────────────────────────────────
function CompanyCard({ name, country, flag, desc, tags = [], link, badge, funding, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 hover:border-[#8B4AFF]/30 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${P}12` }}>
            {Icon ? <Icon size={20} style={{ color: P }} /> : <Building2 size={20} style={{ color: P }} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900 truncate">{name}</p>
            <p className="text-[11px] text-gray-400">{flag} {country}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {badge && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap"
              style={{ backgroundColor: A, color: P }}>{badge}</span>
          )}
          {funding && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 whitespace-nowrap">{funding}</span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {tags.map(t => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100 font-medium">{t}</span>
        ))}
      </div>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-bold mt-1 hover:opacity-70 transition-opacity"
          style={{ color: P }}>
          Acessar <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function Tab({ label, active, onClick, icon: Icon }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap
        ${active ? 'text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
      style={active ? { backgroundColor: P } : {}}>
      {Icon && <Icon size={13} />}
      {label}
    </button>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-black text-gray-900">{children}</h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Trend Card ───────────────────────────────────────────────────────────────
function TrendCard({ title, cagr, desc, icon: Icon, color = '#8B4AFF' }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}>{cagr}</span>
      </div>
      <p className="text-sm font-black text-gray-900 mb-1">{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Influencer Card ──────────────────────────────────────────────────────────
function InfluencerCard({ name, platform, followers, niche, badge, color = '#E91E63' }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm"
            style={{ backgroundColor: color }}>{name[0]}</div>
          <div>
            <p className="text-sm font-black text-gray-900">{name}</p>
            <p className="text-[10px] text-gray-400">{platform}</p>
          </div>
        </div>
        {badge && <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
          style={{ backgroundColor: A, color: P }}>{badge}</span>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{niche}</span>
        <span className="text-xs font-bold" style={{ color: P }}>{followers}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminMarketIntelligence() {
  const [activeTab, setActiveTab] = useState('global');

  const tabs = [
    { id: 'global', label: 'Visão Global', icon: Globe2 },
    { id: 'brasil', label: 'Brasil', icon: Map },
    { id: 'empresas', label: 'Empresas & Apps', icon: Building2 },
    { id: 'social', label: 'Social & Influência', icon: Star },
    { id: 'tendencias', label: 'Tendências', icon: Zap },
  ];

  return (
    <div className="space-y-6">

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{ background: `linear-gradient(135deg, ${P} 0%, #6B2FD9 100%)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ebfc66 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: A }}>
              <Globe2 size={16} style={{ color: P }} />
            </div>
            <span className="text-[10px] font-black tracking-[3px] uppercase"
              style={{ color: A }}>Gatedo · Dossier de Inteligência</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
            Mercado Global de Cat Tech
          </h1>
          <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
            Análise completa do ecossistema mundial de startups, apps, plataformas e empresas
            especializadas no universo felino. Dados de funding, rankings, tendências e oportunidades
            para posicionamento estratégico do Gatedo.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['US$ 15,6bi mercado 2025', '+5.216 empresas pet tech', 'CAGR 15,18% gatos', 'Atualizado Mai/2026'].map(t => (
              <span key={t} className="text-[10px] font-bold px-3 py-1 rounded-full text-white/90 border border-white/20">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Mercado Pet Tech Global 2025" value="$15,6bi" icon={Globe2} accent="GMI" delay={0} />
        <KpiCard label="Projeção mercado 2031" value="$52,9bi" icon={TrendingUp} accent="12% CAGR" delay={60} />
        <KpiCard label="CAGR gatos vs. cães" value="15,18%" icon={Cat} accent="Maior segmento" delay={120} />
        <KpiCard label="Gatos no Brasil" value="30mi" icon={Map} accent="Top 3 mundo" delay={180} />
        <KpiCard label="Mercado pet BR 2024" value="R$77bi" icon={DollarSign} accent="+12% a.a." delay={240} />
        <KpiCard label="VCs pet tech 2025" value="+103%" icon={ArrowUpRight} accent="vs. 2024" delay={300} />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-1 flex-wrap shadow-sm sticky top-2 z-10">
        {tabs.map(t => (
          <Tab key={t.id} label={t.label} active={activeTab === t.id}
            onClick={() => setActiveTab(t.id)} icon={t.icon} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* GLOBAL TAB                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'global' && (
        <div className="space-y-6">

          {/* Ranking países por gastos pet per capita */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <SectionTitle sub="Gasto anual por tutor em pet care (USD, 2024)">
              🏆 Ranking Global — Gastos com Pets por País
            </SectionTitle>
            <div className="space-y-1">
              {[
                { label: 'EUA', value: 1960, flag: '🇺🇸', color: P },
                { label: 'Austrália', value: 1380, flag: '🇦🇺', color: '#6B2FD9' },
                { label: 'Reino Unido', value: 1100, flag: '🇬🇧', color: '#9C63FF' },
                { label: 'Alemanha', value: 980, flag: '🇩🇪', color: '#B07BFF' },
                { label: 'França', value: 870, flag: '🇫🇷', color: '#C49AFF' },
                { label: 'Japão', value: 820, flag: '🇯🇵', color: '#D8B8FF' },
                { label: 'Brasil', value: 380, flag: '🇧🇷', color: A },
                { label: 'China', value: 310, flag: '🇨🇳', color: '#FFF79A' },
              ].map(d => (
                <RankBar key={d.label} {...d} max={2000} unit=" USD" />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">Fonte: APPA, Mordor Intelligence 2024–2025</p>
          </div>

          {/* Market size evolution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <SectionTitle sub="Evolução do mercado global pet tech (US$ bi)">
                📈 Crescimento do Mercado
              </SectionTitle>
              <BarChart height={100} data={[
                { label: '2022', value: 8.3 },
                { label: '2023', value: 10.2 },
                { label: '2024', value: 12.7 },
                { label: '2025', value: 15.6 },
                { label: '2026', value: 19.1 },
                { label: '2028', value: 27 },
                { label: '2031', value: 52.9 },
              ]} />
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'GPS/Tracking', share: '36,78%' },
                  { label: 'Smart Litter', share: '16,18% CAGR' },
                  { label: 'IA/ML', share: '14,92% CAGR' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] font-black" style={{ color: P }}>{s.share}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <SectionTitle sub="Ranking por número de startups ativas 2025">
                🌎 Hubs de Inovação Cat Tech
              </SectionTitle>
              <div className="space-y-1">
                {[
                  { label: 'São Francisco', value: 94, flag: '🇺🇸' },
                  { label: 'Londres', value: 71, flag: '🇬🇧' },
                  { label: 'Nova York', value: 68, flag: '🇺🇸' },
                  { label: 'Tóquio', value: 52, flag: '🇯🇵' },
                  { label: 'Tel Aviv', value: 38, flag: '🇮🇱' },
                  { label: 'Berlim', value: 34, flag: '🇩🇪' },
                  { label: 'São Paulo', value: 28, flag: '🇧🇷' },
                  { label: 'Singapura', value: 22, flag: '🇸🇬' },
                ].map(d => <RankBar key={d.label} {...d} max={100} unit=" startups" />)}
              </div>
            </div>
          </div>

          {/* Distribuição por segmento */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <SectionTitle sub="Segmentos do mercado cat tech por volume de investimento">
              💰 Distribuição de Funding por Segmento (2023–2025)
            </SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Cat food premium D2C', pct: 38, color: P, icon: '🥩' },
                { label: 'Smart devices & IoT', pct: 27, color: '#10b981', icon: '📡' },
                { label: 'Saúde & IA veterinária', pct: 20, color: '#f59e0b', icon: '🏥' },
                { label: 'Social & plataformas', pct: 15, color: '#ef4444', icon: '📱' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-2xl p-4 text-center">
                  <span className="text-2xl">{s.icon}</span>
                  <div className="mt-2 text-2xl font-black" style={{ color: s.color }}>{s.pct}%</div>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">Fonte: Crunchbase News, Tracxn, 2025</p>
          </div>

          {/* Raças mais populares digitalmente */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <SectionTitle sub="Engajamento digital por raça em 2025 (Instagram hashtags + TikTok views)">
              🐾 Raças Mais Poderosas no Digital
            </SectionTitle>
            <div className="space-y-1">
              {[
                { label: 'Maine Coon', value: 9400, flag: '📸', unit: 'k hashtags IG' },
                { label: 'Bengal', value: 5700, flag: '🐆', unit: 'k hashtags IG' },
                { label: 'British Shorthair', value: 4200, flag: '🇬🇧', unit: 'k hashtags IG' },
                { label: 'Ragdoll', value: 3800, flag: '🤍', unit: 'k hashtags IG' },
                { label: 'Siamês', value: 3100, flag: '👁️', unit: 'k hashtags IG' },
                { label: 'Persa', value: 2900, flag: '👑', unit: 'k hashtags IG' },
              ].map(d => <RankBar key={d.label} {...d} max={10000} unit={` ${d.unit}`} />)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                <p className="text-xs font-black text-purple-700">🏆 #catsofinstagram</p>
                <p className="text-xl font-black text-purple-900">+400mi</p>
                <p className="text-[10px] text-purple-600">usos totais da hashtag</p>
              </div>
              <div className="rounded-xl p-3 border" style={{ background: `${A}30`, borderColor: A }}>
                <p className="text-xs font-black" style={{ color: P }}>📱 Maine Coon TikTok</p>
                <p className="text-xl font-black text-gray-900">3,7bi</p>
                <p className="text-[10px] text-gray-600">views totais 2025</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* BRASIL TAB                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'brasil' && (
        <div className="space-y-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Gatos no Brasil', value: '30mi', sub: '19% dos pets nacionais', icon: Cat },
              { label: 'Mercado Pet BR 2024', value: 'R$77bi', sub: '+12% vs. 2023', icon: DollarSign },
              { label: 'Novos negócios pet 2023–25', value: '+41,6k', sub: '91% são MEIs', icon: Building2 },
              { label: 'Crescimento gatos/ano', value: '+2,5%', sub: 'maior que cães', icon: TrendingUp },
            ].map(k => <KpiCard key={k.label} {...k} />)}
          </div>

          {/* Evolução mercado pet BR */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <SectionTitle sub="Faturamento do setor pet brasileiro (R$ bi)">
              📊 Evolução do Mercado Pet Brasileiro
            </SectionTitle>
            <BarChart height={90} data={[
              { label: '2018', value: 34 }, { label: '2019', value: 40 },
              { label: '2020', value: 50 }, { label: '2021', value: 60 },
              { label: '2022', value: 63 }, { label: '2023', value: 68.8 },
              { label: '2024', value: 77 },
            ]} color={P} />
            <p className="text-[10px] text-gray-400 mt-2">Fonte: IPB, Abinpet, SEBRAE 2025</p>
          </div>

          {/* Posição BR no mundo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <SectionTitle sub="Ranking de países por número total de animais de estimação">
              🌎 Brasil no Cenário Mundial
            </SectionTitle>
            <div className="space-y-1">
              {[
                { label: '🇺🇸 EUA', value: 480, flag: '', unit: 'mi pets' },
                { label: '🇨🇳 China', value: 320, flag: '', unit: 'mi pets' },
                { label: '🇧🇷 Brasil', value: 161, flag: '', unit: 'mi pets', color: A },
                { label: '🇷🇺 Rússia', value: 95, flag: '', unit: 'mi pets' },
                { label: '🇫🇷 França', value: 65, flag: '', unit: 'mi pets' },
                { label: '🇯🇵 Japão', value: 57, flag: '', unit: 'mi pets' },
              ].map((d, i) => (
                <div key={d.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-black text-gray-400 w-5">{i + 1}º</span>
                  <span className="text-xs text-gray-700 font-medium w-28">{d.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${(d.value / 480) * 100}%`,
                      backgroundColor: d.label.includes('Brasil') ? P : '#e5e7eb',
                    }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-20 text-right">
                    {d.value}{d.unit}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl border-l-4 text-xs text-gray-600 leading-relaxed bg-purple-50"
              style={{ borderColor: P }}>
              🐱 O Brasil tem gatos como o segmento que <strong>mais cresce</strong> no setor pet,
              com crescimento anual de 2,5% e mais de 30 milhões de felinos. O segmento "cat friendly"
              é apontado pelo SEBRAE como a maior oportunidade atual para pequenos negócios.
            </div>
          </div>

          {/* Startups brasileiras */}
          <SectionTitle sub="Startups e empresas de tecnologia cat-focused no Brasil">
            🇧🇷 Ecossistema Nacional de Cat Tech
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompanyCard name="Budz" country="Brasil" flag="🇧🇷"
              desc="App de telemedicina veterinária, gestão de saúde, IA e adestramento para pets. +150.000 usuários. Pivotou para B2B. Foco em inteligência artificial para 2025 com agentes integrados. 100% digital."
              tags={['Televetmed', 'IA', 'B2B', 'iOS/Android']}
              link="https://budz.com.br" badge="150k usuários" icon={Smartphone} />
            <CompanyCard name="Be220 — Pet Finder" country="Porto Alegre, RS" flag="🇧🇷"
              desc="App desenvolvido no Instituto Caldeira para reunir pets perdidos com tutores. Cruzou banco de dados de 32 mil pets durante as enchentes de 2024. Usada pela Prefeitura de Porto Alegre."
              tags={['Impacto social', 'Pet tracking', 'Gov Tech']}
              badge="Case Exame" icon={Map} />
            <CompanyCard name="CatMyPet — MagiCat" country="Brasil" flag="🇧🇷"
              desc="Startup focada exclusivamente em produtos para gatos. Produto destaque: MagiCat, bebedouro em formato de torneira. Identificou lacuna no mercado felino e captou investimento com sucesso."
              tags={['Hardware', 'Acessórios felinos', 'D2C']}
              badge="Cat-only" icon={Package} />
            <CompanyCard name="Betina Cat Café" country="Brasília, DF" flag="🇧🇷"
              desc="Cat café 100% focado no público gateiro. Case estudado pelo SEBRAE. Integra sustentabilidade (granulado biodegradável, sem plástico) e apoio a projetos de castração e reciclagem."
              tags={['Cat café', 'Sustentável', 'Community']}
              icon={Heart} />
            <CompanyCard name="Woof — Pet Marketplace" country="Brasil" flag="🇧🇷"
              desc="Uma das maiores redes de pet shops afiliados no Brasil. Marketplace com logística ágil, entrega gratuita e tecnologia proprietária para trajetórias personalizadas por tutor."
              tags={['Marketplace', 'Logística', 'Pet shops']}
              icon={ShoppingBag} />
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-4 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-3xl">🚀</span>
              <p className="text-sm font-black text-purple-800">Oportunidade Gatedo</p>
              <p className="text-xs text-purple-600 leading-relaxed">
                O Brasil ainda carece de um super-app gateiro integrado (saúde + social + IA + loja).
                Esse é exatamente o whitespace que o Gatedo ocupa.
              </p>
            </div>
          </div>

          {/* Dados SEBRAE */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <BarChart2 size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">Dados SEBRAE + IPB 2025</p>
                <p className="text-[10px] text-gray-400">Oportunidades identificadas no segmento felino</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: '📦', title: 'Alimentação funcional', desc: 'Maior crescimento em volume de vendas no segmento gatos. Tutores buscam dietas sem grãos, de origem única ou funcionais.' },
                { icon: '💊', title: 'Saúde preventiva', desc: 'Tutores de gatos investem mais em check-ups e monitoramento. Demanda por apps de gestão de saúde cresce acima da média.' },
                { icon: '🏡', title: 'Enriquecimento ambiental', desc: 'Produtos para estimulação mental e física. Nicho premium em franca expansão, especialmente em apartamentos.' },
              ].map(s => (
                <div key={s.title} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-xs font-black text-gray-900 mt-2">{s.title}</p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* EMPRESAS TAB                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'empresas' && (
        <div className="space-y-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Startups cat-focused com funding', value: '11+', sub: '~US$140mi levantados', icon: Building2 },
              { label: 'Maior rodada 2025 (pet tech)', value: '$80mi', sub: 'PetScreening Series B', icon: DollarSign },
              { label: 'Total VCs injetado 2025', value: '$660mi', sub: 'pet & vet startups globais', icon: TrendingUp },
              { label: 'Alta de funding pet 2025', value: '+103%', sub: 'vs 2024 (Tracxn)', icon: ArrowUpRight },
            ].map(k => <KpiCard key={k.label} {...k} />)}
          </div>

          <SectionTitle sub="Apps móveis especializados em saúde e bem-estar felino">
            📱 Apps de Saúde & Monitoramento Felino
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompanyCard name="Tably — Sylvester.ai" country="Canadá" flag="🇨🇦"
              desc="IA detecta dor em gatos por foto facial. Usa Feline Grimace Scale da Universidade de Montreal. 97% de precisão. +350 mil fotos analisadas. Integrado ao ZumVet (Sudeste Asiático). Vencedor Purina Innovation Prize."
              tags={['IA/CV', 'Dor felina', 'Clínico', 'iOS']}
              link="https://sylvester.ai" badge="97% acurácia" icon={FlaskConical} />
            <CompanyCard name="Maven Pet" country="Global" flag="🌐"
              desc="Sensor de colar + app com IA veterinária. Monitoramento contínuo de atividade, saúde e comportamento. Resumos diários, semanais e mensais. Alertas em tempo real."
              tags={['Sensor colar', 'IA vet', 'iOS/Android']}
              link="https://maven.pet" icon={Wifi} />
            <CompanyCard name="Petcube App" country="Ucrânia/EUA" flag="🇺🇦"
              desc="Câmera smart com visualização multi-câmera, áudio bidirecional, alertas de movimento e laser interativo. Monitoramento remoto de gatos em casa."
              tags={['Smart cam', 'IoT', 'Laser', 'iOS/Android']}
              link="https://petcube.com" icon={Wifi} />
            <CompanyCard name="Sure Petcare" country="Reino Unido" flag="🇬🇧"
              desc="Ecossistema por microchip: comedouro inteligente, porta automática e rastreador de atividade, tudo num só app. Identifica qual gato comeu e quanto."
              tags={['Microchip', 'Multi-gato', 'UK', 'iOS/Android']}
              link="https://surepetcare.com" icon={Package} />
            <CompanyCard name="Whisker Tracker" country="EUA" flag="🇺🇸"
              desc="App para rastrear gatos de rua via foto. Reconhecimento facial felino ajuda a reunir gatos perdidos com tutores. Missão de segurança felina comunitária."
              tags={['Facial recognition', 'Comunidade', 'iOS/Android']}
              link="https://whiskertrackerapp.com" icon={Map} />
            <CompanyCard name="Tractive CAT Mini" country="Áustria" flag="🇦🇹"
              desc="GPS em tempo real para gatos com monitoramento de saúde e sono. US$ 37,7mi levantados. Cobertura LTE global. À prova d'água."
              tags={['GPS', 'Health', 'Wearable', 'iOS/Android']}
              link="https://tractive.com" funding="$37,7mi" icon={Map} />
          </div>

          <SectionTitle sub="Dispositivos inteligentes com app integrado, focados em gatos">
            🔧 Hardware & IoT Cat Tech
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompanyCard name="PETKIT Ecosystem" country="China (40+ países)" flag="🇨🇳"
              desc="Ecossistema completo: PUROBOT Ultra (caixa de areia com IA, câmera rotativa, reconhecimento multi-gato), comedouros Fresh Element e bebedouros EverSweet. Tudo integrado ao PETKIT App. Lançou PUROBOT Ultra no CES 2026."
              tags={['IA completa', 'Smart home', 'Ecossistema', 'iOS/Android']}
              link="https://petkit.com" badge="Líder global" icon={Wifi} />
            <CompanyCard name="Litter-Robot (Whisker)" country="EUA" flag="🇺🇸"
              desc="A caixa de areia auto-limpante mais conhecida. App Whisker monitora uso, saúde e padrões de visita. Controle remoto. Reconhecimento individual de gatos."
              tags={['Auto-limpeza', 'App integrado', 'Multi-gato']}
              link="https://litter-robot.com" icon={Package} />
            <CompanyCard name="Catlog — Rabo Inc." country="Japão" flag="🇯🇵"
              desc="Coleira com sensores + app para monitorar sono, brincadeiras e grooming 24h. Dispositivo de caixa de areia para rastrear atividades e peso. US$ 13mi levantados."
              tags={['Sensor colar', 'Comportamento', 'iOS/Android']}
              funding="$13mi" icon={Wifi} />
            <CompanyCard name="Petivity — Nestlé Purina" country="EUA" flag="🇺🇸"
              desc="Caixa de areia inteligente da Nestlé Purina. Pesa e registra cada visita. Detecta variações de peso e frequência urinária, com alertas precoces para doenças renais."
              tags={['Smart litter', 'Saúde preventiva', 'Enterprise']}
              link="https://petivity.com" icon={FlaskConical} />
            <CompanyCard name="PetPace AI Smart Collar" country="Israel/EUA" flag="🇮🇱"
              desc="Colar que rastreia temperatura, pulso, respiração, postura e HRV. Alertas em tempo quase real e integração de telemedicina. Expandiu plataforma telehealth em 2025."
              tags={['Sinais vitais', 'Telemedicina', 'HRV']}
              icon={Heart} />
            <CompanyCard name="PETLIBRO" country="EUA (CA)" flag="🇺🇸"
              desc="Fontes automáticas inteligentes controladas por app. Capsule Fountain: imita fluxo natural para incentivar hidratação. Sistema de filtração de 5 camadas. Rastreamento de hidratação."
              tags={['Hidratação', 'IoT', 'Fundada 2019']}
              link="https://petlibro.com" icon={Package} />
          </div>

          <SectionTitle sub="Startups focadas em alimentação, genômica e saúde preventiva felina">
            🧬 Foodtech & Biotech Cat-Focused
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CompanyCard name="KatKin" country="Reino Unido" flag="🇬🇧"
              desc="Comida fresca por assinatura para gatos. Refeições personalizadas por idade, peso e condição de saúde. Human-grade, sem conservantes ou subprodutos. Tagline: 'Carnívoros não comem ração'."
              tags={['Cat food D2C', 'Assinatura', 'Premium', 'UK']}
              link="https://katkin.com" funding="$28mi" icon={ShoppingBag} />
            <CompanyCard name="Smalls" country="EUA (NY)" flag="🇺🇸"
              desc="Alimentação ultra-proteica human-grade personalizada para cada gato. Customiza receitas com base nas preferências individuais do animal. Levantou US$ 19mi em março de 2023."
              tags={['Cat food D2C', 'Personalização', 'Proteína']}
              link="https://smalls.com" funding="$19mi" icon={ShoppingBag} />
            <CompanyCard name="Basepaws" country="EUA" flag="🇺🇸"
              desc="Kit de DNA para gatos via swab bucal. Identifica raça, ancestralidade e riscos de saúde genéticos. Resultados em 4–6 semanas. A '23andMe dos gatos'."
              tags={['DNA felino', 'Genômica', 'Saúde preventiva']}
              link="https://basepaws.com" icon={FlaskConical} />
            <CompanyCard name="AnimalBiome" country="EUA (Oakland)" flag="🇺🇸"
              desc="Suplementos baseados no microbioma intestinal para gatos. Análise de microbioma via kit em casa. Linha específica para saúde digestiva felina."
              tags={['Microbioma', 'Suplementos', 'BioTech']}
              link="https://animalbiome.com" funding="$12mi" icon={FlaskConical} />
            <CompanyCard name="Made By Nacho" country="EUA" flag="🇺🇸"
              desc="Premium cat food fundada pelo chef Bobby Flay, batizada em homenagem ao seu Maine Coon Nacho. O gato era o 'chief taste tester' oficial. Ingredientes de alta qualidade."
              tags={['Premium food', 'Celebrity brand', 'Maine Coon']}
              funding="$14mi" icon={ShoppingBag} />
            <CompanyCard name="Cat Person" country="EUA" flag="🇺🇸"
              desc="Marca D2C 100% focada em gatos: comida, acessórios e produtos de cuidado exclusivos para felinos. Destaque no ecossistema de influenciadores gateiros."
              tags={['100% felino', 'D2C', 'Influencer mktg']}
              link="https://catperson.com" badge="Cat-only" icon={Cat} />
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SOCIAL TAB                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'social' && (
        <div className="space-y-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '#catsofinstagram usos', value: '+400mi', sub: 'hashtag mais popular de pets', icon: Star },
              { label: 'TikTok completion rate', value: '+118%', sub: 'vs. posts não-pet', icon: TrendingUp },
              { label: 'Preferência por conteúdo pet', value: '40%', sub: 'dos usuários vs. humanos', icon: Users },
              { label: 'Engajamento cat influencers', value: '>7%', sub: 'acima da média geral', icon: Heart },
            ].map(k => <KpiCard key={k.label} {...k} />)}
          </div>

          {/* Plataformas por engajamento */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <SectionTitle sub="Performance comparativa de conteúdo gateiro por plataforma">
              📊 Cat Content por Plataforma
            </SectionTitle>
            <div className="space-y-1">
              {[
                { label: 'TikTok', value: 92, flag: '🎵', unit: '% completion rate' },
                { label: 'Instagram Reels', value: 78, flag: '📸', unit: '% completion rate' },
                { label: 'YouTube Shorts', value: 71, flag: '▶️', unit: '% completion rate' },
                { label: 'Instagram Feed', value: 55, flag: '🖼️', unit: '% completion rate' },
                { label: 'Facebook', value: 48, flag: '👥', unit: '% completion rate' },
                { label: 'Pinterest', value: 35, flag: '📌', unit: '% completion rate' },
              ].map(d => <RankBar key={d.label} {...d} max={100} />)}
            </div>
          </div>

          {/* Top influencers */}
          <SectionTitle sub="Os maiores influenciadores felinos do mundo em 2025–2026">
            🏆 Top Cat Influencers Globais
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'Nala Cat', platform: 'Instagram · EUA', followers: '4,5mi seguidores', niche: 'Lifestyle + marca própria Love Nala', badge: 'Guinness Record', color: '#E91E63' },
              { name: 'That Little Puff', platform: 'TikTok · EUA', followers: '33mi seguidores', niche: 'Culinária + humor', badge: 'Shorty Award 2024', color: '#9C27B0' },
              { name: 'Maru', platform: 'YouTube · Japão', followers: '350mi views', niche: 'Caixas + brincadeiras', badge: 'Lenda do digital', color: '#FF5722' },
              { name: 'Smoothie', platform: 'Instagram · Países Baixos', followers: '2mi seguidores', niche: 'Fotografia premium / luxo', badge: 'Top IG engagement', color: '#607D8B' },
              { name: 'Coby the Cat', platform: 'Instagram · EUA', followers: '1,9mi seguidores', niche: 'Beauty crossover (KVD)', badge: 'Pitti Uomo 2025', color: '#00BCD4' },
              { name: 'Suki Cat', platform: 'Instagram + TikTok · CA', followers: '1,7mi seguidores', niche: 'Adventure / outdoor / viagem', badge: 'Travel + Leisure', color: '#4CAF50' },
              { name: 'Venus Two-Face', platform: 'Instagram · EUA', followers: '2,2mi seguidores', niche: 'Lifestyle / face bicolor', badge: 'Unique markings', color: '#FF9800' },
              { name: 'Kurt Cat', platform: 'TikTok · EUA', followers: '10,6mi TikTok', niche: 'Human+cat duo / dança', badge: 'CAA signed', color: P },
              { name: 'Maine Coon BR', platform: 'Instagram · Brasil', followers: 'Nicho em crescimento', niche: 'Raça líder digital no país', badge: '🇧🇷 BR Trend', color: '#388E3C' },
            ].map(i => <InfluencerCard key={i.name} {...i} />)}
          </div>

          {/* Monetização */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <SectionTitle sub="Como cat influencers e contas felinas monetizam sua audiência">
              💰 Modelos de Monetização Cat Influencers
            </SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: '📸', title: 'Post patrocinado (mega)', range: 'US$ 10k–30k / post', desc: 'Contas como Nala Cat com 4,5mi seguidores. Marcas: Bissell, PetSmart, Halo.' },
                { icon: '🎵', title: 'TikTok Creator Fund', range: 'US$ 0,02–0,04 / 1k views', desc: 'Monetização direta pelo algoritmo. Base + campanhas de marca multiplica 10x.' },
                { icon: '▶️', title: 'YouTube monetização', range: 'US$ 3–5 / 1k views', desc: 'Melhor CPM entre as plataformas. Canal de Maru (Japão): 350mi views acumulados.' },
                { icon: '🛍️', title: 'Produto próprio', range: 'Maior margem', desc: 'That Little Puff: silicone Puff-branded esgotou no Amazon em 72h. Nala: Love Nala food premium.' },
                { icon: '🤝', title: 'Embaixador de marca', range: 'Contrato anual', desc: 'Coby Cat x KVD Beauty "Cat Eyes for All" — case de maior performance de pet+beauty no Instagram.' },
                { icon: '📦', title: 'Affiliate / dropship', range: 'US$ 100–1.000 / post', desc: 'Micro-influencers com 10–100k seguidores. Engajamento proporcionalmente maior.' },
              ].map(s => (
                <div key={s.title} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-black text-gray-900">{s.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: A, color: P }}>{s.range}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TENDENCIAS TAB                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tendencias' && (
        <div className="space-y-6">

          <SectionTitle sub="Tendências e segmentos com maior projeção de crescimento até 2031">
            🔮 Macro-Tendências Cat Tech 2025–2031
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TrendCard title="Smart Litter & Saúde Urinária" cagr="CAGR 16,18%"
              desc="Caixas de areia com IA detectam ITU, DRC e variações de peso antes dos sintomas clínicos. PETKIT, Petivity (Purina) e SiiPet liderando. Principal gatilho de compra para tutores de gatos sênior."
              icon={TrendingUp} color={P} />
            <TrendCard title="Detecção de Dor por IA + Câmera" cagr="Emergente"
              desc="Apps como Tably (Sylvester.ai) usam computer vision na Feline Grimace Scale. Integração crescente com plataformas de televetmed. Alta demanda de clínicas para monitoramento pós-cirúrgico."
              icon={FlaskConical} color="#10b981" />
            <TrendCard title="Ecossistemas IoT Integrados" cagr="CAGR 13%+"
              desc="Usuários querem um dashboard único: caixa de areia + comedouro + bebedouro + saúde no mesmo app. PETKIT lidera esse movimento. Gatedo pode ser o app que unifica TODOS os dados."
              icon={Wifi} color="#f59e0b" />
            <TrendCard title="Genômica & Microbioma Felino" cagr="Alto potencial"
              desc="Basepaws, AnimalBiome e laboratórios universitários. Donos pagam premium por entender a saúde do gato na raiz. Expansão de planos de assinatura que incluem testes periódicos."
              icon={FlaskConical} color="#6366f1" />
            <TrendCard title="Cat Food Human-Grade D2C" cagr="Maior segmento"
              desc="KatKin ($28mi), Smalls ($19mi) e Made by Nacho ($14mi) provam o modelo. Assinatura personalizada por perfil nutricional. Brasil ainda sem player nacional sólido nesse modelo."
              icon={ShoppingBag} color="#ef4444" />
            <TrendCard title="Telemedicina Veterinária Felina" cagr="CAGR 15%+"
              desc="Budz no Brasil, Barkibu na Espanha. Integração de apps de monitoramento com consultas online. Donos de gatos têm menor tolerância a idas ao veterinário — digital reduz barreira."
              icon={Heart} color="#ec4899" />
            <TrendCard title="Cat Influencer Marketing" cagr="+118% engagement"
              desc="Marcas premium como KVD, Dyson e Insta360 incorporam cat influencers ao mainstream de marketing. Shorty Awards criou categoria pet. Collabstr e Lefty.io estruturam o mercado."
              icon={Star} color="#f97316" />
            <TrendCard title="Microchip Obrigatório (UK + Europa)" cagr="Regulatório"
              desc="Reino Unido tornou microchipagem de gatos obrigatória em junho de 2024. Europa segue o caminho. Catalisa venda de rastreadores, apps de identificação e seguros pet com tech integrada."
              icon={Wifi} color="#0ea5e9" />
            <TrendCard title="Cats + IA Generativa no App" cagr="2025–2026 boom"
              desc="Análise de fotos, diário de saúde por voz, sugestões personalizadas de cuidado. Gatedo pode liderar no Brasil integrando IA generativa com foco 100% felino antes de players globais."
              icon={Zap} color={P} />
          </div>

          {/* Posicionamento Gatedo */}
          <div className="relative overflow-hidden rounded-3xl p-6"
            style={{ background: `linear-gradient(135deg, ${P} 0%, #5B21B6 100%)` }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
              style={{ backgroundColor: A, transform: 'translate(30%, -30%)' }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🚀</span>
                <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: A }}>
                  Oportunidade Estratégica
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-3">
                Por que o Gatedo tem vantagem única no Brasil
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { t: '🐱 Mercado sub-atendido', d: '30mi de gatos e nenhum super-app 100% felino consolidado no Brasil. Budz e Be220 são parciais. Gatedo é o único all-in-one.' },
                  { t: '📈 Crescimento explosivo', d: 'Segmento de gatos cresce 2,5% ao ano — o maior crescimento entre todos os pets no Brasil. CAGR global de 15,18% até 2031.' },
                  { t: '💰 Willingness to pay alta', d: 'Tutores de gatos brasileiros gastam mais em produtos premium, saúde preventiva e experiências. Ticket médio superior ao de donos de cães.' },
                  { t: '🤖 IA como diferencial', d: 'Nenhum player nacional tem IA generativa integrada focada em felinos. A janela de oportunidade para lançar isso é 2025–2026.' },
                ].map(s => (
                  <div key={s.t} className="bg-white/10 rounded-2xl p-3 border border-white/20">
                    <p className="text-xs font-black text-white mb-1">{s.t}</p>
                    <p className="text-[11px] text-white/70 leading-relaxed">{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fontes e referências */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <SectionTitle sub="Fontes primárias utilizadas neste dossier">
              📚 Fontes & Referências
            </SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { name: 'Crunchbase News — Feline Startup Funding', url: 'https://news.crunchbase.com/venture/feline-focused-startup-funding-cat-food-ai-tracker/' },
                { name: 'Mordor Intelligence — Pet Tech Market 2031', url: 'https://www.mordorintelligence.com/industry-reports/pet-tech-market' },
                { name: 'Global Market Insights — Pet Tech $52,9bi', url: 'https://www.gminsights.com/industry-analysis/pet-tech-market' },
                { name: 'Tracxn — Pet Tech Funding 2025 (+103%)', url: 'https://tracxn.com/d/sectors/pet-tech' },
                { name: 'GreyB — Top 10 Pet Startups 2025', url: 'https://www.greyb.com/blog/pet-startups/' },
                { name: 'SEBRAE — Mercado Felino BR 2025', url: 'https://agenciasebrae.com.br/cultura-empreendedora/nos-ultimos-dois-anos-abertura-pequenos-negocios-do-mercado-pet-cresceu-22-no-pais/' },
                { name: 'Revista Negócios Pet — Panorama 2024/2025', url: 'https://rnpet.com.br/mercado-pet/panorama-do-mercado-pet-de-2024-e-projecoes-para-2025/' },
                { name: 'Sylvester.ai — Tably AI Cat Health', url: 'https://www.sylvester.ai' },
                { name: 'Collabstr — Top Cat Influencers 2025', url: 'https://collabstr.com/blog/top-cat-influencers' },
                { name: 'Pettechai — Best PetTech Apps 2025', url: 'https://pettechai.com/best-pettech-apps-2025/' },
                { name: 'PETKIT CES 2026 Press Release', url: 'https://www.morningstar.com/news/pr-newswire/20260102cn54610/from-automation-to-health-signals-petkit' },
                { name: 'Startups.com.br — Budz B2B', url: 'https://startups.com.br/negocios/pet-tech/budz-pivota-para-apoiar-empresas-e-colaboradores' },
              ].map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors group">
                  <ExternalLink size={12} className="flex-shrink-0 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  <span className="text-[11px] text-gray-600 group-hover:text-purple-700 transition-colors leading-tight">{s.name}</span>
                </a>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
