import React, { useState } from 'react';
import {
  DollarSign, Target, Flag, ShoppingBag, Mail,
  ChevronRight, ChevronDown, CheckCircle2, Copy,
  Zap, Star, Crown, Award, Users, Heart,
  TrendingUp, AlertTriangle, RefreshCw, Sparkles,
  Package, Gift, BookOpen, ExternalLink
} from 'lucide-react';
import { FOUNDER_LAUNCH_PHASES } from '../../utils/founderLaunchConfig';

const P = '#8B4AFF';
const A = '#ebfc66';
const ORG = '#FF6B2B';

function useCopy() {
  const [copied, setCopied] = useState('');
  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(''), 1600);
  };
  return [copied, copy];
}

function Tab({ id, label, icon: Icon, active, onClick }) {
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${active ? 'text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
      style={active ? { backgroundColor: P } : {}}>
      <Icon size={12} />{label}
    </button>
  );
}

function Insight({ text, color = P }) {
  return (
    <div className="rounded-xl p-3.5 border-l-4 text-xs leading-relaxed text-gray-700 mb-4"
      style={{ borderColor: color, backgroundColor: `${color}08` }}>{text}</div>
  );
}

function STitle({ children, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-black text-gray-900">{children}</h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed max-w-2xl">{sub}</p>}
    </div>
  );
}

// ── FUNIL MAP ─────────────────────────────────────────────────────────────────
function FunnelMap() {
  const steps = [
    { n:'1', label:'TRÁFEGO', color:'#6b7280', icon:'📣',
      items:['Meta Ads (conversão)','Instagram/TikTok orgânico','Indicação clínica vet','WhatsApp communities'] },
    { n:'2', label:'LANDING PAGE', color:'#6366f1', icon:'🖥️',
      items:['Fase atual + countdown vagas','Prova social (tutores reais)','Benefícios claros e diretos','CTA único'] },
    { n:'3', label:'CHECKOUT KIWIFY', color:ORG, icon:'🛒',
      items:['Produto principal (fase atual)','ORDER BUMP visível (1 produto)','Resumo do pedido','Dados de pagamento'] },
    { n:'4', label:'PÓS-COMPRA', color:P, icon:'✅',
      items:['UPSELL — 1 clique (pág. dedicada)','Se recusar → DOWNSELL','Confirmação + acesso','Email de boas-vindas imediato'] },
    { n:'5', label:'DENTRO DO APP', color:'#10b981', icon:'📱',
      items:['Onboarding guiado','GPTS consumidos → recarga','Engagement + hábito','Upgrade de plano in-app'] },
    { n:'6', label:'RENOVAÇÃO', color:'#f59e0b', icon:'🔄',
      items:['Email 30 dias antes','GPTS extras como incentivo','Upgrade para plano superior','Ciclo anual consolidado'] },
  ];

  return (
    <div className="space-y-5">
      <Insight color={P}
        text="🧠 Modelo mental correto: o Gatedo é um produto PAGO desde o início. O tráfego vai para a landing page de fase → checkout Kiwify com order bump → upsell pós-compra → app (onde os GPTS criam outra camada de receita recorrente). São 3 momentos distintos de receita sem nenhum lead adicional." />

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm overflow-x-auto">
        <STitle>🗺️ Mapa Completo — Do Clique ao Fundador Recorrente</STitle>
        <div className="flex items-stretch gap-2 min-w-[860px]">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex-1 rounded-2xl border-2 p-3 flex flex-col"
                style={{ borderColor:`${s.color}35`, backgroundColor:`${s.color}08` }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">{s.icon}</span>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
                    style={{ backgroundColor:s.color }}>{s.n}</div>
                </div>
                <p className="text-[9px] font-black mb-2" style={{ color:s.color }}>{s.label}</p>
                <div className="space-y-1 mt-auto">
                  {s.items.map(item => (
                    <div key={item} className="flex items-start gap-1">
                      <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor:s.color }} />
                      <p className="text-[9px] text-gray-600 leading-tight">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              {i < steps.length-1 && <div className="flex items-center flex-shrink-0"><ChevronRight size={14} className="text-gray-300"/></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <STitle sub="Impacto do funil completo vs apenas o produto principal">💰 Receita por Lead — Com e Sem Funil</STitle>
        <div className="space-y-2.5">
          {[
            { label:'Produto principal (Fase 1)', rev:'R$47', color:'#6b7280', pct:24 },
            { label:'+ Order Bump 35% conv. × R$9,90', rev:'+R$3,46', color:'#6366f1', pct:40 },
            { label:'+ Upsell 23% conv. × R$80', rev:'+R$18,40', color:P, pct:63 },
            { label:'+ Downsell 25% × R$4,90', rev:'+R$1,85', color:'#10b981', pct:70 },
            { label:'+ Recarga GPTS 30% base em 60 dias', rev:'+R$5,37', color:'#f59e0b', pct:85 },
            { label:'TOTAL por lead — funil completo', rev:'~R$76', color:ORG, pct:100 },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor:r.color }}/>
              <p className="text-xs text-gray-700 flex-1">{r.label}</p>
              <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                <div className="h-full rounded-full transition-all" style={{ width:`${r.pct}%`, backgroundColor:r.color }}/>
              </div>
              <p className="text-sm font-black w-20 text-right flex-shrink-0" style={{ color:r.color }}>{r.rev}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-100">
          <p className="text-xs font-black text-green-800">💡 300 vagas × R$76 (funil) = R$22.800 vs 300 × R$47 (sem funil) = R$14.100. O funil gera +R$8.700 sem um lead a mais.</p>
        </div>
      </div>
    </div>
  );
}

// ── FASES ────────────────────────────────────────────────────────────────────
function LaunchPhases() {
  const [open, setOpen] = useState(null);
  const phases = FOUNDER_LAUNCH_PHASES.map((phase) => ({
    ...phase,
    id: phase.n,
    label: `Lote ${phase.n}`,
  }));

  const totalMin = phases.reduce((acc, p) => {
    const main = p.spots * p.price;
    const ob = p.spots * p.ob.price * (parseFloat(p.ob.conv) / 100);
    const us = p.spots * p.us.price * (parseFloat(p.us.conv) / 100);
    return acc + main + ob + us;
  }, 0);

  return (
    <div className="space-y-5">
      <Insight color={P}
        text="🎯 A estrutura de lançamento em 3 lotes cria urgência REAL: o preço sobe de verdade e as vagas são limitadas de verdade. Os 300 fundadores são os defensores mais valiosos do produto. Nunca abandone essa base: acesso antecipado a features, badge permanente e comunicação especial." />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {phases.map(p => (
          <div key={p.id} className="bg-white border-2 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            style={{ borderColor:`${p.color}40` }}>
            <div className="p-4 relative overflow-hidden" style={{ background:`linear-gradient(135deg, ${p.color}20, ${p.color}08)` }}>
              <img src={p.badge} alt="" className="absolute -right-4 -top-4 w-24 h-24 object-contain opacity-20 pointer-events-none" />
              <div className="flex items-center justify-between mb-2 relative">
                <span className="text-[10px] font-black px-2 py-1 rounded-full text-white" style={{ backgroundColor:p.color }}>
                  {p.label} — {p.spots} vagas
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border text-gray-500"
                  style={{ borderColor:`${p.color}40` }}>{p.tag}</span>
              </div>
              <p className="text-sm font-black text-gray-900">{p.name}</p>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-3xl font-black" style={{ color:p.color }}>R${p.price}</span>
                <span className="text-xs text-gray-400 mb-1">/12 meses + Selo vitalício</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{p.desc}</p>
              <p className="text-[10px] font-black mt-2 italic" style={{ color:p.color }}>{p.urgency}</p>
            </div>
            <button className="w-full flex items-center justify-between px-4 py-2.5 border-t text-xs font-bold text-gray-500 hover:bg-gray-50"
              onClick={() => setOpen(open === p.id ? null : p.id)}>
              Ver funil desta fase
              <ChevronDown size={13} className={`transition-transform ${open===p.id?'rotate-180':''}`}/>
            </button>
            {open === p.id && (
              <div className="p-4 border-t border-gray-50 space-y-2.5 bg-gray-50/40">
                {[
                  { label:'🛒 Order Bump (checkout)', d:p.ob, color:'#6366f1' },
                  { label:'⬆️ Upsell (pós-compra 1 clique)', d:p.us, color:P },
                  { label:'⬇️ Downsell (recusou upsell)', d:p.ds, color:'#10b981' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3 bg-white border border-gray-100">
                    <p className="text-[9px] font-black mb-1" style={{ color:item.color }}>{item.label}</p>
                    <p className="text-xs font-bold text-gray-800">{item.d.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-black" style={{ color:item.color }}>R${item.d.price}</span>
                      <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">conv. {item.d.conv}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm overflow-x-auto">
        <STitle sub="Estimativa conservadora com conversões mínimas de order bump e upsell">📊 Projeção de Receita — 300 Vagas Fundadoras</STitle>
        <table className="w-full text-xs min-w-[540px]">
          <thead>
            <tr className="border-b border-gray-100">
              {['Fase','Vagas','Principal','+ OB est.','+ Upsell est.','Total'].map(h => (
                <th key={h} className="text-left py-2 pr-3 text-gray-400 font-bold text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phases.map(p => {
              const main = p.spots * p.price;
              const ob = Math.round(p.spots * p.ob.price * parseFloat(p.ob.conv) / 100);
              const us = Math.round(p.spots * p.us.price * parseFloat(p.us.conv) / 100);
              return (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-2.5 pr-3 font-black" style={{ color:p.color }}>{p.name}</td>
                  <td className="py-2.5 pr-3 text-gray-600">{p.spots}×</td>
                  <td className="py-2.5 pr-3 font-bold text-gray-900">R${main.toLocaleString('pt-BR')}</td>
                  <td className="py-2.5 pr-3 text-green-600">+R${ob.toLocaleString('pt-BR')}</td>
                  <td className="py-2.5 pr-3 text-blue-600">+R${us.toLocaleString('pt-BR')}</td>
                  <td className="py-2.5 font-black" style={{ color:P }}>R${(main+ob+us).toLocaleString('pt-BR')}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-gray-200">
              <td colSpan={5} className="pt-3 font-black text-gray-900">TOTAL ESTIMADO (conservador)</td>
              <td className="pt-3 text-lg font-black" style={{ color:P }}>R${Math.round(totalMin).toLocaleString('pt-BR')}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-gray-400 mt-2">* Com bom aquecimento e funil otimizado, a projeção real pode ser 1,5–2× maior.</p>
      </div>
    </div>
  );
}

// ── KIWIFY ───────────────────────────────────────────────────────────────────
function KiwifyPanel() {
  const [copied, copy] = useCopy();
  const [openId, setOpenId] = useState(null);

  const OBS = [
    {
      id:'ob1', icon:'⚡', name:'Pack 100 GPTS Bônus', price:'R$9,90', conv:'35–45%', type:'Order Bump',
      color:'#6366f1', timing:'Mesma tela do checkout — abaixo do resumo do pedido',
      why:'O tutor acabou de pagar e está no pico do entusiasmo. GPTS extras removem a ansiedade de "vou acabar os créditos". É o order bump mais óbvio e maior conversão.',
      headline:'"Antes de finalizar: leve 100 GPTS extras por R$9,90"',
      copy:'Adicione 100 Gatedo Points ao seu plano agora e explore a IA veterinária, o Studio e todos os recursos premium sem se preocupar. Sem expiração enquanto o plano estiver ativo. ≈ R$0,099/pt — desconto exclusivo no checkout.',
      note:'Criar produto separado no Kiwify → ativar como Order Bump no produto principal.',
    },
    {
      id:'ob2', icon:'📖', name:'Guia do Tutor Consciente (PDF 50 páginas)', price:'R$14,90', conv:'28–38%', type:'Order Bump',
      color:'#ec4899', timing:'Checkout — checkbox acima do botão de finalizar',
      why:'Produto de informação com custo zero de entrega. Complementa o app: o tutor que acabou de pagar por gestão de saúde quer aprender mais sobre saúde felina.',
      headline:'"Complete com o Guia: 50 páginas de saúde felina preventiva por R$14,90"',
      copy:'O Guia do Tutor Consciente contém os sinais precoces das 5 doenças mais comuns em gatos, checklist de vacinas por raça e idade, protocolo de primeiros socorros felinos e calendário de saúde mensal. Entrega imediata por PDF.',
      note:'Criar como produto digital (PDF) no Kiwify → entrega automática por email configurada na plataforma.',
    },
    {
      id:'ob3', icon:'🔬', name:'Relatório de Saúde Personalizado (IA)', price:'R$19,90', conv:'25–35%', type:'Order Bump',
      color:P, timing:'Checkout — após campo de CPF/dados',
      why:'Transforma o app em serviço. Alto valor percebido, custo quase zero. O tutor paga e recebe relatório com análise do gato por raça, idade e riscos genéticos.',
      headline:'"Adicione: Relatório IA do seu gato — análise personalizada por R$19,90"',
      copy:'Com base no perfil do seu gato (raça, idade), a IA do Gatedo gera um relatório completo de saúde preventiva: riscos específicos por raça, protocolo de vacinação ideal, recomendações nutricionais e alertas. Entregue em PDF em até 24h após o cadastro no app.',
      note:'Criar como serviço no Kiwify. Entrega manual via PDF gerado pelo app nas primeiras semanas.',
    },
    {
      id:'ob4', icon:'🔥', name:'Pack 300 GPTS com Desconto (Fase 1 e 2)', price:'R$37,00', conv:'20–30%', type:'Order Bump ou Upsell',
      color:ORG, timing:'Order Bump na Fase 1. Upsell pós-compra nas Fases 2 e 3.',
      why:'Para quem quer explorar o app ao máximo desde o dia 1. Desconto visível (R$0,123/pt vs R$0,179 no app = economia de R$16,70) que justifica a decisão imediata.',
      headline:'"Aproveite: 300 GPTS por R$37 — você economiza R$16,70 vs compra avulsa"',
      copy:'300 Gatedo Points para usar como quiser — IA veterinária, Studio, recursos premium. Sem expiração enquanto o plano estiver ativo. Esse preço só aparece agora: R$0,123/pt vs R$0,179/pt no app.',
      note:'Na Fase 1: configurar como Order Bump. Nas Fases 2 e 3: configurar como Upsell pós-compra no Kiwify.',
    },
  ];

  const UPSELLS = [
    {
      id:'us1', icon:'👑', name:'Upgrade Tutor Master (+gatos ilimitados)', price:'R$50–80', conv:'18–28%',
      color:P, timing:'Imediatamente após confirmação de pagamento',
      why:'A decisão de compra já foi tomada. Ampliar é mais fácil que iniciar. Frame: "você acabou de virar fundador — com 1 clique você vai para o Master com gatos ilimitados + memorial."',
      copy:'Parabéns! Seu acesso Fundador está garantido.\n\nMas antes de continuar, uma atualização especial: o Tutor Master por apenas R$[X] a mais — com 1 clique, sem preencher nada.\n\nCom o Master:\n✅ Gatos ilimitados (sem limite de 3)\n✅ Memorial sem consumir vaga do plano\n✅ Prioridade máxima em novas features\n\nClique em SIM para adicionar agora.',
    },
    {
      id:'us2', icon:'⚡', name:'Pack 500 GPTS — Oferta Única Pós-Compra', price:'R$49,90', conv:'20–28%',
      color:'#f59e0b', timing:'Pós-compra para quem não comprou GPTS no Order Bump',
      why:'Pós-compra é o 2º melhor momento depois do checkout. Frame de "oferta única agora — some quando fechar a página". E é verdade: GPTS avulsos no app custam mais.',
      copy:'Essa oferta aparece apenas uma vez — quando você fechar essa página, ela some.\n\n500 Gatedo Points por R$49,90 (R$0,099/pt vs R$0,119/pt no app).\n\n→ ~50 consultas completas com a IA veterinária\n→ ~100 criações no Studio premium\n→ Créditos para o ano inteiro\n\nClique em SIM para adicionar com 1 clique.',
    },
    {
      id:'us3', icon:'👫', name:'Segundo tutor (cônjuge/familiar)', price:'R$47', conv:'12–18%',
      color:'#10b981', timing:'Pós-compra — após recusar upsell de GPTS',
      why:'Muitos gatos têm dois tutores. "Seu parceiro(a) também cuida do gato? Adicione por R$47 — metade do valor." Alta relevância, justificativa emocional clara.',
      copy:'Dois tutores cuidam melhor de um gato quando os dois têm as mesmas informações.\n\nAdicione seu parceiro(a) por apenas R$47 — metade do valor do plano.\n\nEles vão poder ver o histórico, receber alertas e acompanhar tudo junto com você. 1 clique. Sem novo preenchimento.',
    },
  ];

  const DOWNSELLS = [
    {
      id:'ds1', icon:'🔄', name:'Pack 50 GPTS por R$4,90', conv:'22–30%', color:'#6b7280',
      why:'Para quem recusou qualquer GPTS. Ticket mínimo — quase todo mundo diz sim para R$4,90. O objetivo é criar um comprador multi-produto (LTV 3× maior).',
      copy:'Tudo bem! Mas antes de continuar, uma última oferta:\n\n50 Gatedo Points por apenas R$4,90.\n\nSuficiente para começar a explorar a IA e o Studio. Se gostar, você recarrega dentro do app a qualquer momento.',
    },
    {
      id:'ds2', icon:'📄', name:'Checklist Essencial por R$9,90 (downsell do Guia R$14,90)', conv:'20–28%', color:'#0ea5e9',
      why:'Para quem recusou o Guia completo a R$14,90. Versão enxuta de 20 páginas com os pontos mais críticos. Preço menor, entrega menor, mesma relevância.',
      copy:'Que tal a versão essencial por R$9,90?\n\nO Checklist do Tutor Consciente: 20 páginas com os pontos mais críticos de saúde felina, o calendário de vacinas por raça e o protocolo de primeiros socorros. Direto ao ponto.',
    },
  ];

  const OTHER = [
    { name:'Mini-curso: Alimentação Natural para Gatos', price:'R$47–97', color:'#f59e0b', icon:'🥩', desc:'5 módulos em vídeo sobre dieta B.A.R.F. e alimentação caseira. Alto interesse do público gateiro.' },
    { name:'Mini-curso: Comportamento Felino', price:'R$47', color:P, icon:'🧠', desc:'Por que gatos fazem o que fazem. Arranhões, estresse, marcações. Complementa o diário comportamental do app.' },
    { name:'Plano Nutricional Personalizado', price:'R$97', color:'#10b981', icon:'📋', desc:'Formulário → PDF com cardápio mensal personalizado. Alto valor percebido, entrega digital.' },
    { name:'Ebook: Primeiros Socorros Felinos', price:'R$14,90', color:'#ef4444', icon:'🚑', desc:'O que fazer antes de chegar ao vet. Engasgo, convulsão, intoxicação. Alta urgência percebida.' },
    { name:'Pack de Stickers Gatedo (WhatsApp)', price:'R$9,90', color:'#ec4899', icon:'🎨', desc:'50 stickers digitais. Zero custo de produção, alta viralidade — cada uso expõe a marca.' },
    { name:'Comunidade VIP Telegram', price:'R$19,90/mês', color:'#6366f1', icon:'💬', desc:'Grupo fechado + lives mensais com vet + early access. Pode estar incluído no Tutor Master.' },
  ];

  return (
    <div className="space-y-6">

      <div>
        <STitle sub="Produtos no checkout Kiwify — mesma tela, 1 checkbox, alta conversão. Teste 1 por vez.">🛒 Order Bumps — Checkout Kiwify</STitle>
        <Insight color="#6366f1"
          text="💡 Regra: 1 order bump por vez. Preço ≤ 30% do produto principal. Headline começa com 'Antes de finalizar' ou 'Adicione agora'. Teste os 4 e mantenha o de maior conversão por 2 semanas antes de trocar." />
        <div className="space-y-3">
          {OBS.map(ob => (
            <div key={ob.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setOpenId(openId===ob.id?null:ob.id)}>
                <span className="text-xl flex-shrink-0">{ob.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-black text-gray-900">{ob.name}</p>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor:ob.color }}>{ob.type}</span>
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">conv. {ob.conv}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{ob.timing}</p>
                </div>
                <p className="text-lg font-black flex-shrink-0" style={{ color:ob.color }}>{ob.price}</p>
                <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${openId===ob.id?'rotate-180':''}`}/>
              </button>
              {openId===ob.id && (
                <div className="border-t border-gray-50 p-4 space-y-3 bg-gray-50/40">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 mb-1">POR QUE FUNCIONA</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{ob.why}</p>
                    </div>
                    <div className="rounded-xl p-3 border" style={{ backgroundColor:`${ob.color}08`, borderColor:`${ob.color}25` }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] font-black" style={{ color:ob.color }}>HEADLINE + COPY</p>
                        <button onClick={() => copy(ob.headline+'\n\n'+ob.copy, ob.id)}
                          className="text-gray-300 hover:text-purple-500">
                          {copied===ob.id ? <CheckCircle2 size={12} className="text-green-500"/> : <Copy size={12}/>}
                        </button>
                      </div>
                      <p className="text-xs font-bold text-gray-800 mb-2">{ob.headline}</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed">{ob.copy.substring(0,140)}...</p>
                    </div>
                  </div>
                  <div className="rounded-xl p-2.5 bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-700">⚙️ Kiwify: {ob.note}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <STitle sub="Páginas pós-pagamento — 1 clique, sem novo preenchimento, maior taxa de aceite">⬆️ Upsells — Pós-Pagamento (1 Clique)</STitle>
        <Insight color={P}
          text="💡 O upsell pós-compra é o momento de maior confiança do funil. O tutor acabou de pagar e está no pico do entusiasmo. Mostre 1 upsell. Se recusar, downsell imediato na mesma sequência. Nunca redirecione para home sem mostrar pelo menos 1 alternativa." />
        <div className="space-y-3">
          {UPSELLS.map(us => (
            <div key={us.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setOpenId(openId===us.id?null:us.id)}>
                <span className="text-xl flex-shrink-0">{us.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-black text-gray-900">{us.name}</p>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor:us.color }}>Upsell 1-clique</span>
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">conv. {us.conv}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{us.timing}</p>
                </div>
                <p className="text-lg font-black flex-shrink-0" style={{ color:us.color }}>{us.price}</p>
                <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${openId===us.id?'rotate-180':''}`}/>
              </button>
              {openId===us.id && (
                <div className="border-t border-gray-50 p-4 space-y-3 bg-gray-50/40">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 mb-1">POR QUE AGORA</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{us.why}</p>
                    </div>
                    <div className="rounded-xl p-3 border" style={{ backgroundColor:`${us.color}08`, borderColor:`${us.color}25` }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] font-black" style={{ color:us.color }}>COPY DA PÁGINA</p>
                        <button onClick={() => copy(us.copy, us.id)}
                          className="text-gray-300 hover:text-purple-500">
                          {copied===us.id ? <CheckCircle2 size={12} className="text-green-500"/> : <Copy size={12}/>}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">{us.copy}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <STitle sub="Para quem recusa o upsell — nunca deixe sair sem 1 alternativa menor">⬇️ Downsells — Sempre Mostrar, Nunca Deixar Ir</STitle>
        <Insight color="#10b981"
          text="💡 Preço do downsell = 50–60% do upsell recusado. Começar com 'Tudo bem!' e oferecer algo menor imediatamente. Conversão esperada: 20–30% de quem recusou o upsell. Não mostrar = receita que sai pela porta sem motivo." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOWNSELLS.map(ds => (
            <div key={ds.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{ds.icon}</span>
                <div>
                  <p className="text-xs font-black text-gray-900">{ds.name}</p>
                  <span className="text-[9px] font-bold text-green-600">conv. {ds.conv}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{ds.why}</p>
              <div className="rounded-xl p-3 bg-gray-50 border border-gray-100 relative">
                <button onClick={() => copy(ds.copy, ds.id)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-purple-500">
                  {copied===ds.id ? <CheckCircle2 size={12} className="text-green-500"/> : <Copy size={12}/>}
                </button>
                <p className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed pr-4">{ds.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <STitle sub="Produtos digitais para o mesmo público vendidos via Kiwify independentemente ou como cross-sell">🎯 Outros Produtos para o Público Gatedo</STitle>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {OTHER.map(p => (
            <div key={p.name} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.icon}</span>
                </div>
                <p className="text-sm font-black" style={{ color:p.color }}>{p.price}</p>
              </div>
              <p className="text-sm font-black text-gray-900 mb-2">{p.name}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PLANOS ───────────────────────────────────────────────────────────────────
function PlansPanel() {
  const plans = [
    { name:'Tutor Plus', period:'Semestral', color:ORG, price:'R$69,00', gpts:'100 GPTS · 6 meses', tag:null,
      feats:['Até 3 gatos ativos no catálogo','100 GPTS incluídos','IA e Studio sob consumo de GPTS','Histórico completo de saúde','Alertas de vacina e consulta'] },
    { name:'Tutor Plus', period:'Anual', color:ORG, price:'R$129,00', gpts:'300 GPTS · 12 meses', tag:'MAIS POPULAR',
      feats:['Até 3 gatos ativos no catálogo','300 GPTS incluídos no ano','Consultas IA sob consumo de GPTS','Studio e recursos premium sob demanda','Renovação anual — melhor custo-benefício'] },
    { name:'Tutor Master', period:'Semestral', color:P, price:'R$119,90', gpts:'100 GPTS · 6 meses', tag:null,
      feats:['Gatos ilimitados no catálogo','100 GPTS incluídos','Memorial sem consumir vaga','IA e Studio premium sob demanda','Prioridade em novas features'] },
    { name:'Tutor Master', period:'Anual', color:P, price:'R$199,90', gpts:'300 GPTS · 12 meses', tag:'MELHOR OFERTA',
      feats:['Gatos ilimitados no catálogo','300 GPTS incluídos no ano','Memorial sem consumir vaga do plano','Consultas IA e Studio premium','Renovação anual — máximo custo-benefício'] },
  ];

  const gpts = [
    { pts:50, price:'R$9,90', per:'R$0,198/pt', icon:'⭐', tag:null },
    { pts:100, price:'R$17,90', per:'R$0,179/pt', icon:'⚡', tag:'Popular' },
    { pts:500, price:'R$59,90', per:'R$0,119/pt', icon:'🔥', tag:'MUITO POPULAR' },
    { pts:1000, price:'R$99,90', per:'R$0,099/pt', icon:'👑', tag:'MELHOR OFERTA' },
  ];

  return (
    <div className="space-y-6">
      <STitle sub="Receita recorrente in-app após o encerramento das fases fundadoras">📦 Planos Recorrentes — Tutor Plus & Tutor Master</STitle>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map(p => (
          <div key={p.name+p.period} className={`rounded-2xl border-2 p-4 flex flex-col gap-3 hover:shadow-lg transition-all`}
            style={{ borderColor:`${p.color}40`, backgroundColor: p.tag ? `${p.color}06` : 'white' }}>
            <div>
              {p.tag && <span className="text-[9px] font-black px-2.5 py-1 rounded-full text-white inline-block mb-2" style={{ backgroundColor:p.color }}>{p.tag}</span>}
              <p className="text-sm font-black text-gray-900">{p.name} <span className="font-bold" style={{ color:p.color }}>{p.period.toUpperCase()}</span></p>
              <p className="text-[10px] text-gray-400">{p.gpts}</p>
              <p className="text-2xl font-black mt-1" style={{ color:p.color }}>{p.price}</p>
            </div>
            <div className="space-y-1.5 flex-1">
              {p.feats.map(f => (
                <div key={f} className="flex items-start gap-1.5">
                  <CheckCircle2 size={11} className="flex-shrink-0 mt-0.5" style={{ color:p.color }}/>
                  <p className="text-[11px] text-gray-600">{f}</p>
                </div>
              ))}
            </div>
            <button className="w-full py-2.5 rounded-xl text-xs font-black text-white" style={{ backgroundColor:p.color }}>
              Assinar agora
            </button>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
        🐱 <strong>Tutor Plus</strong> — até 3 gatos ativos. <strong>Tutor Master</strong> — gatos ilimitados + memorial sem consumir vaga.
      </div>

      <STitle sub="Sistema de créditos consumidos sob demanda por IA, Studio e recursos premium">🔋 Gatedo Points (GPTS) — Recargas</STitle>
      <Insight color="#f59e0b"
        text="💡 O sistema GPTS é uma fonte de receita recorrente que não depende do ciclo de assinatura. Tutores que ficam sem créditos recarregam imediatamente porque já estão no app e querem continuar usando. Idêntico ao modelo de créditos do ChatGPT Plus e Midjourney — comprovadamente funciona." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {gpts.map(g => (
          <div key={g.pts} className={`rounded-2xl p-4 border-2 text-center hover:shadow-md transition-all ${g.tag?'shadow-md':''}`}
            style={{ borderColor:g.tag?`${P}50`:'#f0f0f0', backgroundColor:g.tag?`${P}06`:'white' }}>
            <span className="text-2xl">{g.icon}</span>
            {g.tag && <div className="text-[9px] font-black px-2 py-0.5 rounded-full text-white inline-block mt-1 mb-1" style={{ backgroundColor:P }}>{g.tag}</div>}
            <p className="text-xl font-black text-gray-900 mt-1">{g.pts}</p>
            <p className="text-[10px] text-gray-400 mb-2">Gatedo Points</p>
            <p className="text-base font-black" style={{ color:P }}>{g.price}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">≈ {g.per}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EMAILS ───────────────────────────────────────────────────────────────────
function EmailsPanel() {
  const [copied, copy] = useCopy();
  const [active, setActive] = useState('launch');

  const seqs = {
    launch: {
      label:'🚀 Lançamento (Aquecimento)', color:'#ec4899',
      emails:[
        { seq:'L1', days:'D-7', subj:'Algo grande está chegando para tutores de gatos... 🔒', goal:'Curiosidade',
          body:'Oi [Nome]!\n\nEm 7 dias vou abrir algo que nunca fizemos no Gatedo.\n\nNão posso contar tudo ainda. Mas posso dizer:\n→ Nunca mais haverá esse preço\n→ Inclui acesso completo + Selo Fundador vitalício\n→ Exatamente 300 vagas — nem uma a mais\n\nFica de olho. Semana que vem você será o primeiro a saber.\n\nTime Gatedo 🐾' },
        { seq:'L2', days:'D-1', subj:'Amanhã abre às 10h. O que está incluso (spoiler completo) 👇', goal:'Antecipação',
          body:'Oi [Nome]!\n\nAmanhã às 10h abre a Fase 1 Fundadora. 50 vagas. R$47. Acesso completo por 12 meses + Selo Fundador vitalício.\n\nO que está incluído:\n✅ Todos os gatos sem limite de número\n✅ IA veterinária para dúvidas a qualquer hora\n✅ Studio premium para criar conteúdo do gato\n✅ Alertas automáticos de vacinas e consultas\n✅ Comunigato — o perfil social do seu gato\n\nAmanhã às 10h. Fique atento.\n\nTime Gatedo 🐾' },
        { seq:'L3', days:'D0 (10h)', subj:'🟢 ABERTO: Fase 1 — 50 vagas a R$47 (menos de 24h)', goal:'Conversão',
          body:'Oi [Nome]!\n\nA Fase 1 Fundadora está ABERTA agora.\n50 vagas · R$47 · 12 meses + Selo Fundador vitalício\n\n[BOTÃO: Garantir minha vaga — R$47]\n\nEssa é a única vez que o Gatedo vai ter esse preço.\nDepois das 50 vagas: Fase 2 a R$67.\n\nTime Gatedo 🐾' },
        { seq:'L4', days:'D0 (21h)', subj:'X vagas restantes na Fase 1 — último aviso desta noite', goal:'Urgência',
          body:'Oi [Nome]!\n\nAté agora, X vagas da Fase 1 já foram garantidas.\nRestam apenas Y vagas a R$47.\n\nQuando as 50 acabarem, o preço vai para R$67 sem aviso.\n\n[BOTÃO: Garantir antes que acabe]\n\nTime Gatedo 🐾' },
        { seq:'L5', days:'D1 (fase virar)', subj:'Fase 1 encerrou. A Fase 2 está aberta agora.', goal:'Continuidade',
          body:'Oi [Nome]!\n\nAs 50 vagas da Fase 1 foram preenchidas.\n\nA Fase 2 está aberta agora — 100 vagas a R$67.\n\nAinda é condição de fundador, ainda com acesso completo e Selo vitalício. Mas R$47 não volta nunca mais.\n\n[BOTÃO: Garantir minha vaga Fase 2 — R$67]\n\nTime Gatedo 🐾' },
      ],
    },
    welcome: {
      label:'📩 Boas-vindas (pós-compra)', color:P,
      emails:[
        { seq:'W1', days:'Imediato', subj:'🐾 Bem-vindo(a), Fundador! Seu acesso está ativo.', goal:'Ativação',
          body:'Oi [Nome], Fundador [Raiz/Base/Histórico]!\n\nSeu acesso ao Gatedo está ativo agora.\n\n→ Baixe o app: [link iOS] | [link Android]\n→ Crie o perfil do seu gato\n→ Registre a primeira vacina (leva 2 minutos)\n\nVocê está entre os [X] primeiros tutores a acreditar no Gatedo. Isso tem um significado real para nós.\n\nBem-vindo à família.\n\nTime Gatedo 🐾' },
        { seq:'W2', days:'D3', subj:'Como usar seus GPTS desde o primeiro dia', goal:'Educação',
          body:'Oi [Nome]!\n\nSeu plano inclui [100/300] GPTS para usar ao longo do [semestre/ano].\n\n⚡ IA Veterinária: cada consulta usa créditos. Use antes de ir ao vet — economiza tempo.\n🎨 Studio: criações premium consomem GPTS — para stickers e retratos do gato.\n💊 Análises: relatórios de saúde também consomem créditos.\n\nSe precisar de mais GPTS, recarregue a qualquer momento no app.\n\nTime Gatedo 🐾' },
        { seq:'W7', days:'D7', subj:'Uma semana como Fundador — você está usando o Gatedo?', goal:'Retenção',
          body:'Oi [Nome]!\n\nFaz uma semana desde que você se tornou Fundador.\n\nJá cadastrou seu gato? Já registrou a primeira vacina?\n\nSe ainda não, a melhor hora é agora. O valor do Gatedo aparece quando você começa a usar.\n\n[BOTÃO: Abrir o Gatedo]\n\nQualquer dúvida, responde esse email. Eu mesmo leio.\n\nTime Gatedo 🐾' },
      ],
    },
  };

  const current = seqs[active];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(seqs).map(([id, s]) => (
          <button key={id} onClick={() => setActive(id)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${active===id?'text-white border-transparent shadow-md':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={active===id?{backgroundColor:s.color}:{}}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {current.emails.map(e => (
          <div key={e.seq} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg text-[10px] font-black text-white flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor:current.color }}>{e.seq}</div>
                <div>
                  <p className="text-xs font-black text-gray-900">{e.subj}</p>
                  <p className="text-[10px] text-gray-400">{e.days} · {e.goal}</p>
                </div>
              </div>
              <button onClick={() => copy(e.body, e.seq)} className="text-gray-300 hover:text-purple-500 flex-shrink-0">
                {copied===e.seq ? <CheckCircle2 size={14} className="text-green-500"/> : <Copy size={14}/>}
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{e.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminFunnelBuilder() {
  const [activeTab, setActiveTab] = useState('funnel');
  const tabs = [
    { id:'funnel',  label:'Funil Completo',   icon:Target },
    { id:'phases',  label:'Fases Fundadoras',  icon:Flag },
    { id:'kiwify',  label:'Kiwify OB/UP/DS',   icon:ShoppingBag },
    { id:'plans',   label:'Planos & GPTS',      icon:DollarSign },
    { id:'emails',  label:'Sequências Email',   icon:Mail },
  ];
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-7"
        style={{ background:'linear-gradient(135deg, #0f0a1e 0%, #1e0638 100%)' }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage:`radial-gradient(ellipse at 8% 60%, ${P} 0%, transparent 50%), radial-gradient(ellipse at 92% 25%, ${A}80 0%, transparent 50%)` }}/>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor:A }}>
                <DollarSign size={14} style={{ color:P }}/>
              </div>
              <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color:A }}>
                Gatedo · Funil de Vendas & Monetização
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">Checkout Kiwify, Fases, Upsells e Escada de Valor</h1>
            <p className="text-white/50 text-xs mt-1 max-w-lg">
              App pago via Kiwify — fases fundadoras, GPTS, order bumps, upsells e downsells.
              Tudo para maximizar receita por lead desde o primeiro checkout.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[{l:'Fases de lançamento',v:'3'},{l:'Order bumps',v:'4'},{l:'Receita/lead c/ funil',v:'~R$76'}].map(k => (
              <div key={k.l} className="rounded-2xl px-4 py-2.5 border border-white/10 text-center"
                style={{ backgroundColor:'rgba(255,255,255,0.06)' }}>
                <p className="text-xl font-black text-white">{k.v}</p>
                <p className="text-[9px] text-white/40 font-medium mt-0.5">{k.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-1 flex-wrap shadow-sm">
        {tabs.map(t => <Tab key={t.id} {...t} active={activeTab===t.id} onClick={setActiveTab}/>)}
      </div>
      {activeTab==='funnel'  && <FunnelMap/>}
      {activeTab==='phases'  && <LaunchPhases/>}
      {activeTab==='kiwify'  && <KiwifyPanel/>}
      {activeTab==='plans'   && <PlansPanel/>}
      {activeTab==='emails'  && <EmailsPanel/>}
    </div>
  );
}
