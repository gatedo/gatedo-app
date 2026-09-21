import React, { useState } from 'react';
import {
  Zap, Globe2, TrendingUp, Users, Heart, Star, Shield,
  Target, Layers, DollarSign, Cpu, Megaphone, Building2,
  ArrowRight, CheckCircle2, Lock, Sparkles, BarChart2,
  FlaskConical, Cat, Rocket, Crown, Eye, RefreshCw, Award, ShoppingBag
} from 'lucide-react';

const P = '#8B4AFF';
const A = '#ebfc66';
const DARK = '#0f0a1e';

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ label, title, sub, light }) {
  return (
    <div className="mb-6">
      <span className="text-[10px] font-black tracking-[3px] uppercase px-3 py-1 rounded-full"
        style={{ backgroundColor: light ? `${P}18` : `${A}25`, color: light ? P : A }}>
        {label}
      </span>
      <h2 className={`text-2xl font-black mt-3 leading-tight ${light ? 'text-gray-900' : 'text-white'}`}>
        {title}
      </h2>
      {sub && <p className={`text-sm mt-2 leading-relaxed max-w-2xl ${light ? 'text-gray-500' : 'text-white/60'}`}>{sub}</p>}
    </div>
  );
}

function PillarCard({ icon: Icon, title, desc, color = P, tag }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {tag && <span className="text-[9px] font-black px-2 py-1 rounded-full"
          style={{ backgroundColor: A, color: P }}>{tag}</span>}
      </div>
      <p className="text-sm font-black text-gray-900 mb-2">{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function IdeaCard({ number, title, desc, tags = [], priority, effort }) {
  const pColors = { Alta: 'bg-red-50 text-red-600 border-red-100', Média: 'bg-amber-50 text-amber-600 border-amber-100', 'Alta+': 'bg-purple-50 text-purple-700 border-purple-100' };
  const eColors = { Baixo: 'bg-green-50 text-green-600 border-green-100', Médio: 'bg-blue-50 text-blue-600 border-blue-100', Alto: 'bg-orange-50 text-orange-600 border-orange-100' };
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-purple-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs text-white"
          style={{ backgroundColor: P }}>{number}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900 mb-1">{title}</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{desc}</p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100 font-medium">{t}</span>
            ))}
            {priority && <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${pColors[priority] || ''}`}>🎯 {priority} impacto</span>}
            {effort && <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${eColors[effort] || ''}`}>⚡ esforço {effort}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoadmapItem({ phase, title, items = [], color, done }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ backgroundColor: done ? '#10b981' : color }}>
          {done ? <CheckCircle2 size={16} /> : phase}
        </div>
        <div className="w-0.5 flex-1 mt-2" style={{ backgroundColor: `${color}30` }} />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <p className="text-sm font-black text-gray-900 mb-2">{title}</p>
        <div className="space-y-1.5">
          {items.map(item => (
            <div key={item} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
              <p className="text-xs text-gray-500 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonetizationTier({ tier, title, price, targets, features = [], color, icon: Icon }) {
  return (
    <div className="bg-white border-2 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow"
      style={{ borderColor: `${color}30` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-widest uppercase" style={{ color }}>{tier}</p>
            <p className="text-sm font-black text-gray-900">{title}</p>
          </div>
        </div>
        <p className="text-right">
          <span className="text-lg font-black" style={{ color }}>{price}</span>
        </p>
      </div>
      <p className="text-[10px] text-gray-400 font-medium">{targets}</p>
      <div className="space-y-1.5 border-t border-gray-50 pt-3">
        {features.map(f => (
          <div key={f} className="flex items-start gap-2">
            <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" style={{ color }} />
            <p className="text-xs text-gray-600">{f}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnerCard({ type, title, value, mechanic, examples, icon: Icon, color }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div>
          <p className="text-[9px] font-black tracking-widest uppercase text-gray-400">{type}</p>
          <p className="text-xs font-black text-gray-900">{title}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] font-black text-gray-700 mb-0.5">💰 Valor</p>
          <p className="text-[11px] text-gray-500">{value}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] font-black text-gray-700 mb-0.5">⚙️ Mecânica</p>
          <p className="text-[11px] text-gray-500">{mechanic}</p>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {examples.map(e => (
            <span key={e} className="text-[9px] px-2 py-0.5 rounded-full border border-gray-100 text-gray-400 font-medium">{e}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutiveSignal({ icon: Icon, label, value, desc, color }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group">
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: color }} />
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 leading-relaxed mt-2">{desc}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${color}15` }}>
          <Icon size={21} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function FlywheelStep({ icon: Icon, title, detail, color }) {
  return (
    <div className="min-w-[160px] flex-1 rounded-2xl border border-white/10 p-4" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}25` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-sm font-black text-white">{title}</p>
      <p className="text-[11px] text-white/55 leading-relaxed mt-1">{detail}</p>
    </div>
  );
}

function BusinessModelInfographic() {
  const revenueBars = [
    { label: 'B2C Premium', value: 72, color: P },
    { label: 'SaaS Vet', value: 58, color: '#10b981' },
    { label: 'Marketplace', value: 46, color: '#f59e0b' },
    { label: 'Dados B2B', value: 68, color: '#0ea5e9' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5">
      <div className="relative overflow-hidden rounded-3xl p-6" style={{ background: DARK }}>
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: `radial-gradient(circle at 18% 20%, ${P}45 0%, transparent 34%), radial-gradient(circle at 85% 70%, ${A}22 0%, transparent 32%)` }} />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: A }}>Modelo operacional</p>
              <h3 className="text-2xl font-black text-white mt-2">Ciclo de inteligencia e gestao</h3>
              <p className="text-sm text-white/55 mt-1 max-w-xl">Cada usuario alimenta dados, os dados melhoram produto, o produto gera retenção e a retenção cria receita defensável.</p>
            </div>
            <span className="text-[10px] font-black px-3 py-1 rounded-full" style={{ backgroundColor: `${A}25`, color: A }}>Loop composto</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <FlywheelStep icon={Cat} title="Perfis" detail="Gatos, raça, idade, peso, comportamento e rotina." color={A} />
            <FlywheelStep icon={Cpu} title="IA" detail="Triagem, risco preditivo, recomendações e Studio." color="#60a5fa" />
            <FlywheelStep icon={Heart} title="Retencao" detail="Alertas, timeline, saúde e comunidade." color="#fb7185" />
            <FlywheelStep icon={DollarSign} title="Receita" detail="Premium, vets, parceiros, loja e dados B2B." color="#34d399" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Mapa de receita</p>
            <h3 className="text-xl font-black text-gray-900 mt-1">Potencial por camada</h3>
          </div>
          <BarChart2 size={24} style={{ color: P }} />
        </div>
        <div className="space-y-4">
          {revenueBars.map((bar) => (
            <div key={bar.label}>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-gray-600">{bar.label}</span>
                <span style={{ color: bar.color }}>{bar.value}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${bar.value}%`, backgroundColor: bar.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: `${P}0D` }}>
          <p className="text-xs font-black" style={{ color: P }}>Leitura executiva</p>
          <p className="text-xs text-gray-500 leading-relaxed mt-1">O Gatedo não depende de uma única receita. O valor nasce da combinação entre cuidado recorrente, dados proprietários e distribuição orgânica.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminStrategicPlan() {
  const [activeSection, setActiveSection] = useState('vision');

  const sections = [
    { id: 'vision',    label: 'Visão de Marca',    icon: Crown },
    { id: 'moat',      label: 'Ativos Estratégicos', icon: Shield },
    { id: 'flywheel',  label: 'Growth Flywheel',   icon: RefreshCw },
    { id: 'ideas',     label: 'Ideias & Features',  icon: Sparkles },
    { id: 'partners',  label: 'Parcerias',          icon: Building2 },
    { id: 'monetize',  label: 'Monetização',        icon: DollarSign },
    { id: 'roadmap',   label: 'Roadmap',            icon: Rocket },
  ];

  return (
    <div className="space-y-6">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl" style={{ background: DARK }}>
        <div className="absolute inset-0"
          style={{ backgroundImage: `radial-gradient(ellipse at 10% 50%, ${P}40 0%, transparent 60%), radial-gradient(ellipse at 90% 20%, ${A}20 0%, transparent 50%)` }} />
        <div className="relative z-10 p-7 md:p-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: A }}>
              <Crown size={16} style={{ color: P }} />
            </div>
            <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: A }}>
              Gatedo · Plano Estratégico de Marca 2026–2028
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
            De App para<br />
            <span style={{ color: A }}>Ativo Cobiçado.</span>
          </h1>
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
            Framework estratégico para transformar o Gatedo no maior ativo do universo felino brasileiro —
            uma marca que usuários defendem, parceiros buscam e investidores querem ter.
            Cada seção é acionável: não é visão vaga, é execução priorizada.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Horizonte', value: '2026–2028' },
              { label: 'Mercado alvo BR', value: 'R$ 77bi' },
              { label: 'TAM gatos BR', value: '30mi felinos' },
              { label: 'CAGR cat tech', value: '15,18%/ano' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-3 border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] text-white/40 font-medium">{s.label}</p>
                <p className="text-lg font-black text-white mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <ExecutiveSignal
          icon={Users}
          label="Aquisicao"
          value="CAC Zero"
          color="#10b981"
          desc="Studio, QR em outputs, clinicas e comunidade como canais compostos."
        />
        <ExecutiveSignal
          icon={Cpu}
          label="Moat"
          value="Dados + IA"
          color={P}
          desc="Historico felino proprietario vira inteligencia preditiva e personalizacao."
        />
        <ExecutiveSignal
          icon={Megaphone}
          label="Distribuicao"
          value="B2B2C"
          color="#f59e0b"
          desc="Vets, marcas, seguradoras e RH levam o app ate tutores qualificados."
        />
        <ExecutiveSignal
          icon={DollarSign}
          label="Receita"
          value="7 camadas"
          color="#0ea5e9"
          desc="Premium, vets, afiliados, branded content, seguros e analytics."
        />
      </div>

      <BusinessModelInfographic />

      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-1 flex-wrap shadow-sm sticky top-2 z-10">
        {sections.map(s => {
          const Icon = s.icon;
          const active = activeSection === s.id;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap
                ${active ? 'text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
              style={active ? { backgroundColor: P } : {}}>
              <Icon size={12} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VISÃO DE MARCA                                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeSection === 'vision' && (
        <div className="space-y-6">

          {/* Manifesto */}
          <div className="relative overflow-hidden rounded-3xl p-7" style={{ background: `linear-gradient(135deg, ${P} 0%, #4B1FA8 100%)` }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: A }} />
            <div className="relative z-10">
              <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: A }}>
                Manifesto de Marca
              </span>
              <blockquote className="text-xl md:text-2xl font-black text-white leading-tight mt-3 max-w-2xl">
                "Gato não é pet. É família, identidade e estilo de vida. O Gatedo não é um app de pet —
                é o lugar onde essa relação vive, cresce e é celebrada."
              </blockquote>
              <p className="text-white/60 text-sm mt-4 max-w-xl leading-relaxed">
                A marca se posiciona como a Apple do universo felino brasileiro: não vende funcionalidade,
                vende pertencimento. Quem usa Gatedo não gerencia um pet — cuida de uma parte da família
                com a melhor tecnologia que existe.
              </p>
            </div>
          </div>

          {/* Território de marca */}
          <SectionHeader label="Identidade" title="Os 4 Territórios Inegociáveis da Marca"
            sub="Esses pilares definem O QUE o Gatedo é e, igualmente importante, o que ele NUNCA será." light />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Crown, title: '100% Felino — Para Sempre', color: P, tag: 'Não negociável',
                desc: 'Nunca expandir para cães. O que parece limitação é o maior diferencial. Ser A referência dos gatos vale mais que ser mais um app de pets. O nicho bem dominado cria liderança defensável que um app generalista nunca consegue tirar.' },
              { icon: FlaskConical, title: 'Ciência + Emoção', color: '#10b981', tag: 'Tom de voz',
                desc: 'O Gatedo fala com tutores com a seriedade que o animal merece e o afeto que a relação exige. Dados de saúde são apresentados com clareza clínica; a experiência emocional é celebrada com identidade criativa forte.' },
              { icon: Eye, title: 'Liderança de Dados Felinos', color: '#f59e0b', tag: 'Moat técnico',
                desc: 'Nenhuma empresa no Brasil tem o dataset de saúde felina que o Gatedo vai construir. Esse ativo — longitudinal, em português, por raça e região — é o que transforma o app em plataforma e a plataforma em empresa de dados.' },
              { icon: Heart, title: 'Comunidade como Produto', color: '#ef4444', tag: 'Retenção',
                desc: 'O Comunigato não é feature — é o coração da retenção. Tutores não ficam por planilha de vacinas; ficam porque o gato deles tem uma história sendo contada, celebrada e vista por outras pessoas que entendem essa relação.' },
            ].map(p => <PillarCard key={p.title} {...p} />)}
          </div>

          {/* Posicionamento vs. concorrentes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm overflow-x-auto">
            <SectionHeader label="Posicionamento" title="Mapa Competitivo — Onde o Gatedo Vence" light />
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-400 font-bold">Dimensão</th>
                  {['Gatedo', 'Budz', 'Petlove', 'PETKIT', 'Player global'].map(c => (
                    <th key={c} className={`text-center py-2 px-3 font-black text-xs ${c === 'Gatedo' ? 'text-purple-700' : 'text-gray-400'}`}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { dim: '100% focado em gatos', vals: ['✅', '❌', '❌', '❌', '❌'] },
                  { dim: 'IA de saúde felina', vals: ['🔜', '⚠️', '❌', '⚠️', '⚠️'] },
                  { dim: 'Comunidade + social', vals: ['✅', '❌', '❌', '❌', '⚠️'] },
                  { dim: 'Studio criativo', vals: ['✅', '❌', '❌', '❌', '⚠️'] },
                  { dim: 'Dados longitudinais BR', vals: ['✅', '⚠️', '⚠️', '❌', '❌'] },
                  { dim: 'Integração vet/clínicas', vals: ['🔜', '✅', '⚠️', '❌', '⚠️'] },
                  { dim: 'Produto próprio D2C', vals: ['🔜', '❌', '✅', '✅', '⚠️'] },
                  { dim: 'Em português BR', vals: ['✅', '✅', '✅', '❌', '❌'] },
                ].map(row => (
                  <tr key={row.dim} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 pr-4 text-gray-600 font-medium">{row.dim}</td>
                    {row.vals.map((v, i) => (
                      <td key={i} className={`text-center py-2.5 px-3 text-base ${i === 0 ? 'font-black' : ''}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-gray-400 mt-3">✅ Possui | 🔜 Em desenvolvimento | ⚠️ Parcial | ❌ Não tem</p>
          </div>

          {/* A frase que define */}
          <div className="rounded-2xl p-5 border-2" style={{ borderColor: A, backgroundColor: `${A}15` }}>
            <p className="text-xs font-black text-gray-600 mb-2">🎯 O posicionamento em uma frase:</p>
            <p className="text-xl font-black text-gray-900">
              "O Gatedo é o único lugar no Brasil onde a saúde, a história e a personalidade do seu gato vivem juntas — com a tecnologia que ele merece."
            </p>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ATIVOS ESTRATÉGICOS (MOAT)                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeSection === 'moat' && (
        <div className="space-y-6">
          <SectionHeader label="Moat Estratégico" title="Os 5 Ativos que Ninguém Pode Copiar Rápido"
            sub="Um moat é o que faz sua empresa difícil de atacar. O Gatedo tem 5 camadas em construção. Cada uma se reforça." light />

          <div className="space-y-4">
            {[
              {
                num: '01', icon: Cpu, color: P, title: 'Base de Dados de Saúde Felina em Português',
                why: 'Por que é um moat?',
                whyText: 'Dados longitudinais de gatos brasileiros — raça, região, peso, histórico de saúde — não existem em escala em nenhum lugar. Cada tutor que usa o Gatedo hoje está construindo um dataset que vale mais do que o app em si.',
                how: 'Como monetizar?',
                howText: 'Insights anonimizados para marcas de ração, laboratórios de diagnóstico, seguradoras pet, pesquisa veterinária acadêmica e governo (controle de zoonoses). Opt-in consciente do tutor, com retorno em benefícios.',
                actions: ['Criar módulo de opt-in de dados com benefício claro para o tutor', 'Estruturar data warehouse desde agora (custo é baixo, arrependimento é caro)', 'Primeiro acordo de dados: oferecer relatório gratuito para uma escola de medicina veterinária'],
              },
              {
                num: '02', icon: Sparkles, color: '#f59e0b', title: 'Studio de Conteúdo Criativo — Mecanismo de Aquisição Orgânica',
                why: 'Por que é um moat?',
                whyText: 'Cada output do Studio (sticker, retrato, carteirinha, dança) que vai para o Instagram ou TikTok de um tutor é uma peça de mídia que você não pagou. Nenhum outro app cria esse ciclo porque nenhum outro tem assets criativos + identidade de gato integrados.',
                how: 'Como amplificar?',
                howText: 'Watermark "feito no Gatedo" + QR code para o perfil do gato = cada post vira aquisição. 1.000 tutores ativos no Studio podem gerar 10.000 impressões orgânicas por semana sem custo.',
                actions: ['Watermark sutil e elegante em todos os outputs (nunca intrusivo)', 'QR code do perfil do gato em carteirinhas e retratos', 'Desafios semanais no Studio (ex: "Maine Coon Monday") para criar conteúdo em série', 'Parceria com 3 influencers gateiros para usar o Studio publicamente'],
              },
              {
                num: '03', icon: Users, color: '#10b981', title: 'Comunidade Gatedo — O Perfil de Vida do Gato',
                why: 'Por que é um moat?',
                whyText: 'Redes sociais de pets morreram porque não tinham razão diária para abrir. O Gatedo une saúde (âncora funcional) + social (âncora emocional). Quando o perfil do gato tem 3 anos de histórico, fotos, saúde e memórias — nenhum tutor migra. O custo de troca é emocional.',
                how: 'O loop que falta criar:',
                howText: 'Todo registro de saúde vira uma "memória" no timeline público do gato. A linha do tempo de vida do animal — da primeira vacina à última consulta — cresce automaticamente. O tutor tem razão de abrir todo dia.',
                actions: ['Timeline automática: cada evento de saúde = post no perfil do gato', 'Marcos celebrados (1 ano, primeiro aniversário, 100 dias de saúde em dia)', 'Feed de "gatos perto de mim" — hiperlocal, para criar conexões reais', 'Insígnias de longevidade: gatos saudáveis ganham "selos" que os tutores exibem com orgulho'],
              },
              {
                num: '04', icon: Building2, color: '#ef4444', title: 'Rede de Clínicas Veterinárias como Canal de Distribuição',
                why: 'Por que é um moat?',
                whyText: 'Clínicas têm a confiança que nenhum app consegue comprar com anúncio. Quando um veterinário indica o Gatedo na saída da consulta, a taxa de ativação é 5x maior que qualquer campanha digital. E clínicas que adotam o painel veterinário criam dependência de dados.',
                how: 'Mecânica de parceria:',
                howText: 'Clínica ganha painel gratuito para ver histórico dos pacientes. Em troca, distribui o Gatedo no pós-consulta. Modelo idêntico ao que a Totvs fez com distribuição via parceiros no Brasil nos anos 2000.',
                actions: ['MVP do painel veterinário: apenas leitura do histórico do paciente (baixo esforço, alto valor)', 'Programa "Clínica Gatedo Certificada" com selo e material de vitrine', 'QR code na recepção: "Registre a consulta de hoje no Gatedo"', 'Meta: 50 clínicas parceiras até o final de 2026'],
              },
              {
                num: '05', icon: Award, color: '#6366f1', title: 'Marca como Identidade Cultural — Ser a Cultura dos Gatos no BR',
                why: 'Por que é um moat?',
                whyText: 'A Nike não vende tênis — vende identidade atlética. O Gatedo não vende app — vende pertencimento à cultura gateira. Quando tutores usam o Gatedo como identidade ("meu gato tem perfil no Gatedo") a marca vira moat cultural. Isso é impossível de copiar com dinheiro.',
                how: 'Como construir cultura:',
                howText: 'Presença editorial (não publicitária) nos espaços onde gateiros vivem. O Gatedo não anuncia — cria conteúdo que o gateiro compartilha porque faz ele parecer mais inteligente sobre o gato dele.',
                actions: ['Newsletter semanal "O que seu gato está tentando te dizer" — educação felina como conteúdo de marca', 'Parceria com universidades vet para publicar pesquisas com branding Gatedo', 'Gatedo como produtor de conteúdo (documentários de gatos adotados, casos clínicos reais)', 'Evento anual "Cat Day BR" — o Gatedo produz, a mídia cobre'],
              },
            ].map(moat => {
              const Icon = moat.icon;
              return (
                <div key={moat.num} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${moat.color}15` }}>
                        <Icon size={22} style={{ color: moat.color }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black text-gray-400">ATIVO #{moat.num}</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${moat.color}15`, color: moat.color }}>Moat</span>
                      </div>
                      <p className="text-base font-black text-gray-900 mb-4">{moat.title}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-gray-500 mb-1">{moat.why}</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{moat.whyText}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ backgroundColor: `${moat.color}08` }}>
                          <p className="text-[10px] font-black mb-1" style={{ color: moat.color }}>{moat.how}</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{moat.howText}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 mb-2">PRÓXIMAS AÇÕES</p>
                        <div className="space-y-1.5">
                          {moat.actions.map(a => (
                            <div key={a} className="flex items-start gap-2">
                              <ArrowRight size={12} className="mt-0.5 flex-shrink-0" style={{ color: moat.color }} />
                              <p className="text-xs text-gray-500">{a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* GROWTH FLYWHEEL                                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeSection === 'flywheel' && (
        <div className="space-y-6">
          <SectionHeader label="Motor de Crescimento" title="O Flywheel do Gatedo"
            sub="Um flywheel é um ciclo que se auto-acelera. Quanto mais gira, mais rápido fica. Esse é o motor que faz o Gatedo crescer sem precisar de mais dinheiro em mídia paga." light />

          {/* Flywheel visual */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 items-center">
              {[
                { step: '1', label: 'Tutor descobre', detail: 'via vet, Studio viral ou boca a boca de comunidade', color: P },
                { step: '→', label: '', detail: '', color: '#ddd', arrow: true },
                { step: '2', label: 'Cria perfil do gato', detail: 'Cadastra histórico, saúde, fotos. Investe 10min = dono', color: '#6366f1' },
                { step: '→', label: '', detail: '', color: '#ddd', arrow: true },
                { step: '3', label: 'Usa o Studio', detail: 'Cria conteúdo com o gato. Compartilha nas redes', color: '#f59e0b' },
              ].map((s, i) => s.arrow ? (
                <div key={i} className="hidden md:flex justify-center text-gray-300 text-2xl font-black">→</div>
              ) : (
                <div key={i} className="flex flex-col items-center text-center p-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm mb-2"
                    style={{ backgroundColor: s.color }}>{s.step}</div>
                  <p className="text-xs font-black text-gray-900">{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">{s.detail}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center my-2 text-gray-300 font-black text-xl md:hidden">↓</div>
            <div className="flex justify-center my-1 text-gray-200 font-black text-2xl hidden md:block text-center">↓ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ↑</div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 items-center">
              {[
                { step: '6', label: 'Flywheel acelera', detail: 'Dados melhores → IA melhor → produto mais valioso → mais tutores', color: P },
                { step: '←', label: '', detail: '', color: '#ddd', arrow: true },
                { step: '5', label: 'Parceiros entram', detail: 'Vets, marcas, seguradoras encontram audiência qualificada', color: '#10b981' },
                { step: '←', label: '', detail: '', color: '#ddd', arrow: true },
                { step: '4', label: 'Novos tutores chegam', detail: 'Post viral → novo tutor descobre pelo gato de outra pessoa', color: '#ef4444' },
              ].map((s, i) => s.arrow ? (
                <div key={i} className="hidden md:flex justify-center text-gray-300 text-2xl font-black">←</div>
              ) : (
                <div key={i} className="flex flex-col items-center text-center p-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm mb-2"
                    style={{ backgroundColor: s.color }}>{s.step}</div>
                  <p className="text-xs font-black text-gray-900">{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">{s.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas do flywheel */}
          <SectionHeader label="Métricas-chave" title="Os Números que Indicam se o Flywheel Está Girando" light />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { metric: 'D30 Retention', target: '>45%', current: 'Medir agora', desc: 'Se 45% dos tutores voltam em 30 dias, o flywheel está acelerado. Abaixo de 25% = produto com problema de loop.', color: P },
              { metric: 'Viral Coefficient (K)', target: '>0.3', current: 'Medir agora', desc: 'Cada tutor traz quantos outros por conteúdo orgânico? K > 1 é crescimento viral. K > 0.3 já complementa mídia paga.', color: '#f59e0b' },
              { metric: 'Studio Shares/Week', target: '5.000', current: 'Definir baseline', desc: 'Outputs do Studio compartilhados por semana. Esse número é o seu spend em mídia paga que você não fez.', color: '#10b981' },
              { metric: 'Gatos com perfil completo', target: '>60%', current: 'Medir agora', desc: 'Perfis completos (foto + raça + 1 vacina) têm retenção 3x maior. É o proxy de "dono comprometido".', color: '#6366f1' },
              { metric: 'Clínicas parceiras ativas', target: '50 em 2026', current: '0 → meta', desc: 'Cada clínica parceira traz em média 15–40 novos tutores por mês. CAC próximo de zero.', color: '#ef4444' },
              { metric: 'NPS de Tutores', target: '>60', current: 'Medir agora', desc: 'NPS > 60 significa que a base defende a marca. Abaixo de 40 = melhorar produto antes de escalar marketing.', color: '#ec4899' },
            ].map(m => (
              <div key={m.metric} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-black text-gray-900">{m.metric}</p>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${m.color}15`, color: m.color }}>Meta: {m.target}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 mb-2">Atual: {m.current}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* IDEIAS & FEATURES                                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeSection === 'ideas' && (
        <div className="space-y-6">
          <SectionHeader label="Pipeline de Ideias" title="Features & Iniciativas Priorizadas por Impacto"
            sub="Organizadas por valor estratégico, não por facilidade de execução. Faça as certas na ordem certa." light />

          <div className="p-4 rounded-2xl border-l-4 text-sm text-gray-600 leading-relaxed bg-purple-50" style={{ borderColor: P }}>
            🧭 <strong>Princípio de priorização:</strong> Alta impacto + Baixo esforço primeiro. Mas nunca deixe um item de Alto impacto + Alto esforço fora do roadmap — eles constroem o moat.
          </div>

          <div className="space-y-3">
            {[
              { number: '01', title: 'Timeline de Vida do Gato — "Diário Automático"', priority: 'Alta+', effort: 'Médio',
                desc: 'Todo evento de saúde, vacina, peso ou check-in vira automaticamente uma memória no perfil público do gato. A linha do tempo de vida cresce sozinha. Nenhum tutor abandona 3 anos de história. Retenção de longo prazo garantida.',
                tags: ['Retenção', 'Comunigato', 'Saúde', 'Social'] },
              { number: '02', title: 'Watermark + QR do Gato em todos os outputs do Studio', priority: 'Alta', effort: 'Baixo',
                desc: 'Cada sticker, retrato ou carteirinha sai com "feito no Gatedo" + QR que leva ao perfil. 1.000 posts no Instagram = 10k impressões sem custo. É o canal de aquisição mais barato que existe.',
                tags: ['Studio', 'Aquisição orgânica', 'Viral', 'Zero custo'] },
              { number: '03', title: 'Painel Veterinário — MVP de Leitura', priority: 'Alta+', effort: 'Médio',
                desc: 'Clínica acessa histórico do paciente (apenas leitura). Em troca, distribui o Gatedo no pós-consulta. Não precisa ser perfeito — precisa existir. 50 clínicas ativas = 750–2.000 novos tutores/mês a custo zero.',
                tags: ['B2B', 'Clínicas', 'Distribuição', 'CAC zero'] },
              { number: '04', title: 'Análise de Risco por IA — "Seu gato está saudável?"', priority: 'Alta+', effort: 'Alto',
                desc: 'Com os dados do perfil (raça, idade, peso, histórico), o app avalia em tempo real o risco do gato para as 5 doenças mais comuns da raça. Output: semáforo de saúde + sugestão de consulta preventiva. Isso é o que transforma o Gatedo de "caderneta digital" para "sistema de saúde felina".',
                tags: ['IA', 'Saúde preditiva', 'Moat técnico', 'Premium'] },
              { number: '05', title: 'Newsletter Educacional "O que seu gato está tentando te dizer"', priority: 'Alta', effort: 'Baixo',
                desc: 'Semanal. Conteúdo editorial de verdade sobre comportamento e saúde felina. Sem propaganda. O Gatedo como autoridade de informação — não de produto. Newsletters de nicho com conteúdo real têm open rate de 40–60%.',
                tags: ['Marca', 'Conteúdo', 'Autoridade', 'SEO'] },
              { number: '06', title: 'Desafios Semanais no Studio — UGC Estruturado', priority: 'Alta', effort: 'Baixo',
                desc: '"Maine Coon Monday", "Gato Artista da Semana", "Antes e depois do adote não compre". Cada desafio cria um pico de conteúdo nos stories e feed do Instagram. Tutores participam porque querem mostrar o gato deles — não porque a marca pediu.',
                tags: ['Studio', 'UGC', 'Engajamento', 'Comunidade'] },
              { number: '07', title: 'Seguro Pet com Gatedo Inside — Parceria com Seguradora', priority: 'Alta', effort: 'Alto',
                desc: 'O histórico de saúde no Gatedo vira redução de prêmio no seguro. "Gatos com histórico completo no Gatedo pagam X% menos." Cria razão de uso contínuo, monetiza dados e posiciona o app como infraestrutura financeira do universo felino.',
                tags: ['Fintech', 'Seguro', 'Dados', 'B2B2C'] },
              { number: '08', title: '"Ranking da Saúde" — Gamificação de Cuidado', priority: 'Média', effort: 'Baixo',
                desc: 'Pontuação de saúde do gato (0–100) baseada em vacinas em dia, visitas ao vet, peso dentro do ideal. Selos públicos no perfil ("Gato Nota 10", "1 ano sem faltar ao vet"). Tutores competem em ser o melhor cuidador — o gato vence, o app fica.',
                tags: ['Gamificação', 'Retenção', 'Comunidade', 'Saúde'] },
              { number: '09', title: 'Loja D2C de Produtos Gatedo — White Label Selecionado', priority: 'Média', effort: 'Alto',
                desc: 'Curadoria de produtos que o Gatedo endossa (não apenas afiliados). Ração, areia, enriquecimento ambiental com o selo "Gatedo Recomenda". Começa com afiliados, evolui para margem própria em itens de alto giro.',
                tags: ['Revenue', 'Loja', 'Curadoria', 'Marca'] },
              { number: '10', title: 'Dados Anonimizados — B2B Analytics', priority: 'Alta+', effort: 'Alto',
                desc: 'Dashboard para marcas: "gatos da raça X na região Y preferem ração Z". Vendido como relatório de pesquisa ou acesso a API. Royal Canin, Hills, Nestlé Purina pagam R$ 50–200k por esse tipo de insight. Precisa de opt-in claro do tutor.',
                tags: ['Data', 'B2B', 'Receita passiva', 'Longo prazo'] },
            ].map(i => <IdeaCard key={i.number} {...i} />)}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* PARCERIAS                                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeSection === 'partners' && (
        <div className="space-y-6">
          <SectionHeader label="Ecossistema B2B" title="Os 6 Tipos de Parceiros que Fazem o Gatedo Crescer"
            sub="Parcerias certas reduzem CAC, aumentam receita e constroem moat. Cada tipo tem uma mecânica diferente." light />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PartnerCard type="Canal" title="Clínicas & Hospitais Veterinários" color={P} icon={Heart}
              value="CAC próximo de zero. Cada clínica ativa traz 15–40 tutores/mês de alta qualidade (já vacinados com cultura de cuidado)"
              mechanic="Painel gratuito de leitura do histórico do paciente. Em troca: QR code na recepção + recomendação no pós-consulta. Modelo SaaS freemium → paid com funcionalidades clínicas."
              examples={['Hospitais universitários vet', 'Redes de clínicas (Vetcenter, Vet+)', 'Clínicas independentes premium']} />
            <PartnerCard type="Revenue" title="Marcas de Ração e Nutrição Felina" color="#f59e0b" icon={ShoppingBag}
              value="Patrocínio de conteúdo, sampling direcionado, relatórios de dados anonimizados (R$30–200k/ano). Acesso à audiência mais qualificada de tutores felinos do Brasil."
              mechanic="Branded content no app ('Dica Royal Canin para o dia a dia do seu Bengal'), sampling via loja, acesso a dados segmentados por raça/região/idade com opt-in do tutor."
              examples={['Royal Canin', 'Hills Science', 'Nestlé Purina', 'Guabi/Magnus', 'KatKin (UK)']} />
            <PartnerCard type="Distribuição" title="Pet Shops & E-commerce" color="#10b981" icon={Building2}
              value="Comissão de afiliado (5–15%), listagem prioritária na loja do Gatedo, acesso a tutores da região via geolocalização."
              mechanic="Integração na loja do app com comissão automática. Pet shop local aparece para tutores num raio de 5km. Gatedo como 'vitrine digital' do pet shop de bairro."
              examples={['Petz', 'Cobasi', 'Pet shops independentes', 'Woof Marketplace', 'Shopee/Amazon pet']} />
            <PartnerCard type="Credibilidade" title="Universidades & Institutos Veterinários" color="#6366f1" icon={FlaskConical}
              value="Zero financeiro — mas valor de credibilidade imensurável. Pesquisa publicada com branding Gatedo = autoridade que nenhuma campanha compra."
              mechanic="Compartilhar dataset anonimizado com laboratórios veterinários para pesquisa. Em troca: co-autoria, validação científica das features de saúde, validação de conteúdo do wiki."
              examples={['USP/FMVZ', 'UFV', 'UNESP Botucatu', 'CFMV (Conselho Federal)']} />
            <PartnerCard type="Seguros" title="Seguradoras Pet" color="#ef4444" icon={Shield}
              value="Revenue share em cada apólice vendida via app. Potencial R$ 50–300 por conversão. Mercado de seguro pet no BR: R$ 200mi e crescendo 40%/ano."
              mechanic="'Gatos com histórico completo no Gatedo têm desconto no seguro.' Gatedo como canal de aquisição da seguradora. Histórico de saúde = scoring de risco = produto melhor para todos."
              examples={['Porto Seguro Pet', 'Petz Seguros', 'Bidu', 'Seguros novos entrantes 2026']} />
            <PartnerCard type="Corporativo" title="Empresas — Benefício Pet para RH" color="#ec4899" icon={Users}
              value="B2B direto: assinatura Gatedo Premium paga pela empresa como benefício. Ticket R$ 15–50/funcionário/mês. Modelo testado pelo Budz com sucesso."
              mechanic="Gatedo oferece plano corporativo: empresa paga assinatura premium para funcionários com gatos. RH usa como diferencial de employer branding. CAC quase zero — venda via RH/consultor."
              examples={['Empresas tech (alto % de funcionários com gatos)', 'Pet-friendly offices', 'Corretoras de benefícios (Flash, Caju)']} />
          </div>

          {/* Prioridade de execução */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-black text-gray-900 mb-4">📋 Sequência de Execução das Parcerias</p>
            <div className="space-y-3">
              {[
                { fase: 'Agora', title: 'Clínicas (5 pilotos)', why: 'Custo zero, impacto direto em aquisição, valida o modelo antes de escalar. Abordagem pessoal.', color: '#10b981' },
                { fase: 'Q3 2026', title: 'Marca de ração premium (1 parceiro)', why: 'Branded content + sampling gera receita rápida e valida monetização de audiência.', color: P },
                { fase: 'Q4 2026', title: 'Seguradora pet (acordo de distribuição)', why: 'Revenue share contínuo. Alta margem. Posiciona dados de saúde como diferencial.', color: '#f59e0b' },
                { fase: '2026', title: 'Corporativo via corretoras de benefício', why: 'Canal escalável sem força de vendas própria. A corretora vende, o Gatedo recebe.', color: '#6366f1' },
              ].map(p => (
                <div key={p.title} className="flex items-start gap-3 p-3 rounded-xl border border-gray-50 hover:bg-gray-50">
                  <span className="text-[10px] font-black px-2 py-1 rounded-full text-white flex-shrink-0"
                    style={{ backgroundColor: p.color }}>{p.fase}</span>
                  <div>
                    <p className="text-xs font-black text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MONETIZAÇÃO                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeSection === 'monetize' && (
        <div className="space-y-6">
          <SectionHeader label="Modelo Financeiro" title="A Pirâmide de Monetização do Gatedo"
            sub="7 camadas de receita. Cada uma se apoia na anterior. Não tente todas ao mesmo tempo — construa na ordem certa." light />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MonetizationTier tier="Tier 1 — Base" title="Assinatura Premium B2C" price="R$19,90/mês"
              targets="Tutores individuais. Meta: 5% dos usuários ativos. 10k usuários premium = R$ 2mi/ano ARR."
              color={P} icon={Star}
              features={['IA de análise de saúde personalizada', 'Studio sem marca d\'água e com templates premium', 'Alertas antecipados de doenças', 'Histórico de saúde ilimitado', 'Suporte prioritário via chat']} />
            <MonetizationTier tier="Tier 2 — Canal" title="Painel Veterinário SaaS" price="R$149–399/mês"
              targets="Clínicas e veterinários. 200 clínicas ativas = R$ 600k/ano ARR. Canal de distribuição embutido."
              color="#10b981" icon={Building2}
              features={['Dashboard completo do paciente', 'Alertas de próximas vacinas', 'Exportação de histórico para prontuário', 'Lista de pacientes ativos na área', 'Widget de agendamento integrado ao app']} />
            <MonetizationTier tier="Tier 3 — Revenue Share" title="Loja & Afiliados" price="5–18% comissão"
              targets="Rações, acessórios, areia, serviços. Receita passiva crescendo com a base de tutores."
              color="#f59e0b" icon={ShoppingBag}
              features={['Curadoria editorial (não apenas catálogo)', '"Gatedo Recomenda" como selo de confiança', 'Entrega por pet shops parceiros locais', 'Assinatura de produtos recorrentes (ração mensal)', 'White label de produtos selecionados']} />
            <MonetizationTier tier="Tier 4 — B2B" title="Branded Content & Sampling" price="R$5k–50k/campanha"
              targets="Royal Canin, Hills, Nestlé Purina, startups de pet food. Acesso à audiência felina mais qualificada do BR."
              color="#6366f1" icon={Megaphone}
              features={['Newsletter patrocinada (40–60% open rate)', 'Push notification segmentada por raça/região', 'Amostras enviadas via loja (tutor recebe, marca paga)', 'Conteúdo editorial co-branded no wiki/studio', 'Desafios e concursos patrocinados']} />
            <MonetizationTier tier="Tier 5 — Insurance" title="Seguro Pet (Revenue Share)" price="R$50–300/apólice"
              targets="Parceria com 1 seguradora. 2.000 apólices/ano = R$ 100–600k. Cresce automaticamente com a base."
              color="#ef4444" icon={Shield}
              features={['Histórico do Gatedo como scoring de risco', 'Desconto para tutores com perfil completo', 'Oferta in-app no momento de registro', 'Renovação automática via Gatedo']} />
            <MonetizationTier tier="Tier 6 — Data" title="B2B Data & Analytics" price="R$30k–200k/contrato"
              targets="Laboratoriais, marcas, pesquisa acadêmica, agropecuária. Receita de alto valor, baixo volume, escalável."
              color="#0ea5e9" icon={BarChart2}
              features={['Relatório de tendências felinas por região', 'Dataset por raça (saúde, comportamento, dieta)', 'API de acesso para pesquisadores', 'Painéis customizados para clientes enterprise', 'Publicações co-branded com universidades']} />
          </div>

          <div className="rounded-2xl p-5 border-2" style={{ borderColor: P, backgroundColor: `${P}08` }}>
            <p className="text-xs font-black mb-2" style={{ color: P }}>💡 Sequência recomendada de ativação das camadas:</p>
            <div className="flex flex-wrap gap-2 items-center">
              {['Assinatura B2C', '→', 'Loja afiliados', '→', 'Painel vet', '→', 'Branded content', '→', 'Seguro', '→', 'Data B2B'].map((s, i) => (
                s === '→'
                  ? <ArrowRight key={i} size={14} className="text-gray-300" />
                  : <span key={i} className="text-xs font-black px-3 py-1 rounded-full text-white" style={{ backgroundColor: P }}>{s}</span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Não ative todas ao mesmo tempo. Cada tier validado é um argumento de captação para o próximo.</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ROADMAP                                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeSection === 'roadmap' && (
        <div className="space-y-6">
          <SectionHeader label="Execução" title="Roadmap Estratégico 2026–2027"
            sub="Dividido por objetivo, não por trimestre. O que importa é a lógica da sequência — cada fase habilita a próxima." light />

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="space-y-0">
              <RoadmapItem phase="1" color={P} title="Fase 1 — Fundação do Moat (2026 S1)"
                items={[
                  'Watermark + QR code em todos os outputs do Studio (aquisição orgânica gratuita)',
                  'Timeline automática do gato: todo evento de saúde vira uma memória pública',
                  'MVP do Painel Veterinário (somente leitura) — 5 clínicas pilotas',
                  'Módulo de opt-in de dados com benefício claro para o tutor',
                  'Medir NPS, D30 retention e viral coefficient pela primeira vez',
                ]} />
              <RoadmapItem phase="2" color="#10b981" title="Fase 2 — Aceleração da Comunidade (2026 S2)"
                items={[
                  'Desafios semanais no Studio com mecânica de UGC e trending',
                  'Insígnias de saúde no perfil do gato (gamificação pública)',
                  'Newsletter "O que seu gato está tentando te dizer" — autoridade editorial',
                  '50 clínicas veterinárias parceiras (painel + distribuição)',
                  'Primeiro acordo de branded content com marca de ração premium',
                ]} />
              <RoadmapItem phase="3" color="#f59e0b" title="Fase 3 — Monetização em Escala (2026)"
                items={[
                  'Lançamento da assinatura Premium B2C com IA de saúde',
                  'Painel veterinário com funcionalidades SaaS pagas',
                  'Acordo com seguradora pet (primeiro produto de seguro pelo app)',
                  'Loja D2C com curadoria editorial e "Gatedo Recomenda"',
                  'Primeiro relatório de dados B2B vendido para marca nacional',
                ]} />
              <RoadmapItem phase="4" color="#6366f1" title="Fase 4 — Liderança de Mercado (2027)"
                items={[
                  'IA preditiva de saúde felina (detecção precoce baseada em dados próprios)',
                  'Parceria corporativa via corretoras de benefício RH',
                  'Expansão regional: SP → Rio → outras capitais com estratégia hiper-local',
                  'Publicação de pesquisa co-branded com universidade veterinária',
                  '"Cat Day BR" — evento anual de cultura felina produzido pelo Gatedo',
                ]} />
              <RoadmapItem phase="5" color={P} title="Fase 5 — Ativo de M&A ou Série A (2027–2028)"
                items={[
                  '100k+ tutores ativos com gatos com perfil completo',
                  'ARR de R$ 5–15mi entre B2C, SaaS vet e B2B data',
                  'Dataset mais completo de saúde felina da América Latina',
                  'Posicionamento como plataforma — não apenas app',
                  'Conversa com fundos especializados em pet tech ou healthtech',
                ]} />
            </div>
          </div>

          {/* Princípios de execução */}
          <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: DARK }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 80% 50%, ${P} 0%, transparent 60%)` }} />
            <div className="relative z-10">
              <p className="text-[10px] font-black tracking-[3px] uppercase mb-4" style={{ color: A }}>
                Princípios de Execução
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: '🎯', title: 'Profundidade antes de largura', desc: 'Domine São Paulo antes de pensar em escala nacional. O líder de nicho regional tem mais valor que o player genérico nacional.' },
                  { icon: '📊', title: 'Meça antes de escalar', desc: 'NPS, D30 e viral coefficient precisam estar saudáveis antes de qualquer investimento em marketing pago. Escalar produto ruim é destruir dinheiro.' },
                  { icon: '🔗', title: 'Cada feature, um loop', desc: 'Não adicione funcionalidade que não fecha um ciclo de retenção ou aquisição. Se não há loop, não está pronto para produção.' },
                  { icon: '🏆', title: 'Seja a referência, não o líder de vendas', desc: 'A marca mais citada em artigos, conversas e pesquisas vira ativo mais rápido que a que mais converte. Conteúdo de autoridade constrói o negócio de longo prazo.' },
                ].map(p => (
                  <div key={p.title} className="rounded-2xl p-4 border border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <p className="text-sm font-black text-white mb-1">{p.icon} {p.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
