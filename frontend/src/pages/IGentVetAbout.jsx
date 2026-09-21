import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Camera,
  CheckCircle,
  FileText,
  HeartPulse,
  Microscope,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { brandAssets } from '../brand/assets';

const C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  accent: '#ebfc66',
  bg: '#F4F3FF',
  ink: '#16122A',
};

const differentials = [
  {
    icon: Brain,
    tone: '#8B4AFF',
    title: 'Contexto individual do gato',
    text: 'A resposta cruza idade, raca, historico, vacinas, medicacoes, dieta, ambiente e registros anteriores antes de orientar o tutor.',
  },
  {
    icon: Camera,
    tone: '#10B981',
    title: 'Atlas visual felino',
    text: 'Fotos de olhos, pele, pelo, feridas, boca e ouvidos sao comparadas com padroes cadastrados no Knowledge OS.',
  },
  {
    icon: Microscope,
    tone: '#F97316',
    title: 'Almanaque clinico estruturado',
    text: 'A base clinica organiza sinais de alerta, predisposicoes de raca, doencas, comportamento e perguntas de triagem.',
  },
  {
    icon: FileText,
    tone: '#DB2777',
    title: 'Prontuario inteligente',
    text: 'Ao encerrar a conversa, o atendimento pode virar documento organizado para a ficha de saude e consulta presencial.',
  },
];

const workflow = [
  'O tutor escolhe o gato e o sintoma principal.',
  'O iGentVet consulta o perfil, o historico de saude e o almanaque.',
  'Se houver foto, o Atlas Visual entra como referencia de padroes.',
  'O chat afunila perguntas com respostas rapidas e contexto acumulado.',
  'No fim, o atendimento vira resumo clinico para levar ao veterinario.',
];

const atlasItems = [
  { title: 'Olhos', desc: 'opacidade, secrecao, dor ocular, cornea e sinais de urgencia' },
  { title: 'Pele', desc: 'alergias, crostas, vermelhidao, lambedura e prurido' },
  { title: 'Pelo', desc: 'alopecia, falhas, descamacao e padroes de lambedura' },
  { title: 'Feridas', desc: 'pus, trauma, abscesso, sangramento e necrose' },
  { title: 'Boca', desc: 'gengiva, dente, ulcera, salivacao e dor oral' },
  { title: 'Ouvidos', desc: 'cera, otite, prurido, acaros e inclinacao da cabeca' },
];

export default function IGentVetAbout() {
  const navigate = useNavigate();
  const touch = useSensory();

  const go = (path) => {
    touch();
    navigate(path);
  };

  return (
    <main className="min-h-screen pb-28" style={{ background: C.bg }}>
      <section className="relative overflow-hidden text-white">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #241052 0%, #6432D4 46%, rgba(244,243,255,0.98) 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-16">
          <div className="flex items-center justify-between gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full bg-white/15 border border-white/15 flex items-center justify-center"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
            <img src={brandAssets.igentvetLogo} alt="iGentVet" className="h-9 object-contain" />
            <button
              onClick={() => go('/igent-help')}
              className="px-4 py-2 rounded-full bg-white/15 border border-white/15 text-xs font-black"
            >
              Manual
            </button>
          </div>

          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/15 text-[10px] font-black uppercase tracking-[2px] mb-5">
                <Sparkles size={14} style={{ color: C.accent }} />
                IA veterinaria focada em felinos
              </div>
              <h1 className="text-[38px] sm:text-5xl lg:text-6xl font-black leading-[1.02] tracking-normal">
                O iGentVet transforma sinais soltos em contexto clinico organizado.
              </h1>
              <p className="text-white/78 text-base sm:text-lg leading-relaxed mt-5 max-w-2xl">
                Ele nao substitui o veterinario. Ele prepara o tutor, identifica sinais de alerta, cruza o historico do gato e compila uma pre-triagem mais clara para a consulta presencial.
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <button
                  onClick={() => go('/igent-vet')}
                  className="px-5 py-3 rounded-2xl text-sm font-black text-[#2D2657] shadow-lg"
                  style={{ background: C.accent }}
                >
                  Abrir iGentVet
                </button>
                <button
                  onClick={() => go('/igent-help')}
                  className="px-5 py-3 rounded-2xl text-sm font-black bg-white/12 border border-white/18 text-white"
                >
                  Ver manual de uso
                </button>
              </div>
            </div>

            <div className="bg-white/12 border border-white/18 rounded-[28px] p-4 backdrop-blur-md">
              <div className="rounded-[24px] bg-[#130B2B] border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF6B6B]" />
                    <span className="w-3 h-3 rounded-full bg-[#FACC15]" />
                    <span className="w-3 h-3 rounded-full bg-[#22C55E]" />
                  </div>
                  <span className="text-[10px] font-black text-white/45 uppercase tracking-[2px]">Knowledge OS</span>
                </div>
                <div className="p-5 space-y-3">
                  <InsightCard icon={HeartPulse} title="Paciente" value="Jade | Persa | 4 anos" tone={C.accent} />
                  <InsightCard icon={Camera} title="Imagem enviada" value="olho com opacidade e secrecao" tone="#10B981" />
                  <InsightCard icon={ShieldAlert} title="Sinal de alerta" value="avaliar cornea presencialmente" tone="#F97316" />
                  <div className="rounded-2xl bg-white/7 border border-white/10 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-white/45 mb-2">Saida do agente</p>
                    <p className="text-sm text-white/82 leading-relaxed">
                      Orientacao acolhedora, pergunta de afunilamento e resumo para o veterinario com pontos observados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid sm:grid-cols-3 gap-3">
          <Metric value="8" label="categorias clinicas" />
          <Metric value="6" label="familias do Atlas Visual" />
          <Metric value="PDF" label="prontuario compilado" />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionHeader
          eyebrow="Diferencial"
          title="Por que ele e diferente de um chat generico?"
          text="O valor esta no cruzamento: IA, ficha do gato, almanaque felino, atlas visual e historico longitudinal."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {differentials.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-5 items-start">
          <div className="bg-white rounded-[26px] border border-gray-100 shadow-sm p-5">
            <SectionHeader
              align="left"
              eyebrow="Como funciona"
              title="Da queixa ao resumo clinico"
              text="O fluxo foi pensado para ajudar o tutor a observar melhor e chegar ao atendimento presencial com informacoes organizadas."
            />
            <div className="mt-5 space-y-3">
              {workflow.map((item, index) => (
                <div key={item} className="flex gap-3 items-start">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: `${C.purple}14`, color: C.purple }}
                  >
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-600 font-bold leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#16102E] rounded-[26px] border border-violet-100 shadow-sm p-5 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: C.accent }}>
                <Camera size={21} style={{ color: C.purple }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-white/45">Atlas Visual Felino</p>
                <h2 className="text-xl font-black">A foto vira triagem visual guiada</h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {atlasItems.map((item) => (
                <div key={item.title} className="rounded-2xl bg-white/7 border border-white/10 p-4">
                  <p className="text-sm font-black">{item.title}</p>
                  <p className="text-xs text-white/58 leading-relaxed mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/50 leading-relaxed mt-4">
              A analise por imagem e pre-orientativa: ela aponta achados visiveis, semelhancas com padroes e sinais de alerta, mas nao fecha diagnostico sem exame fisico.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 md:p-7">
          <SectionHeader
            eyebrow="Para o produto"
            title="Como explorar isso como diferencial"
            text="A narrativa mais forte e posicionar o iGentVet como uma ponte entre tutor e veterinario, nao como substituto de consulta."
          />
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <StrategyCard title="Para tutores" text="Menos ansiedade e mais clareza: o app ajuda a observar sinais, entender urgencia e organizar o que contar ao veterinario." />
            <StrategyCard title="Para veterinarios" text="Chegada com historico melhor: sintomas, respostas de triagem, imagem e resumo ficam documentados no perfil de saude." />
            <StrategyCard title="Para crescimento" text="O Atlas Visual e o Almanaque viram ativos proprietarios, editaveis no admin e cada vez mais fortes com curadoria." />
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <button
              onClick={() => go('/igent-vet')}
              className="px-5 py-3 rounded-2xl text-sm font-black text-white"
              style={{ background: C.purple }}
            >
              Testar uma consulta
            </button>
            <button
              onClick={() => go('/admin?tab=igent-almanac')}
              className="px-5 py-3 rounded-2xl text-sm font-black border border-gray-200 text-gray-600 bg-white"
            >
              Abrir Knowledge OS
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function InsightCard({ icon: Icon, title, value, tone }) {
  return (
    <div className="rounded-2xl bg-white/7 border border-white/10 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${tone}22`, color: tone }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[2px] text-white/40">{title}</p>
        <p className="text-sm font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="bg-white rounded-[22px] border border-gray-100 shadow-sm p-5">
      <p className="text-3xl font-black" style={{ color: C.purple }}>{value}</p>
      <p className="text-xs font-black uppercase tracking-[1.5px] text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text, align = 'center' }) {
  return (
    <div className={align === 'center' ? 'text-center max-w-2xl mx-auto' : ''}>
      <p className="text-[10px] font-black uppercase tracking-[2px]" style={{ color: C.purple }}>{eyebrow}</p>
      <h2 className="text-2xl md:text-3xl font-black tracking-normal mt-1" style={{ color: C.ink }}>{title}</h2>
      <p className="text-sm text-gray-500 leading-relaxed mt-2">{text}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text, tone }) {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${tone}14`, color: tone }}>
        <Icon size={21} />
      </div>
      <h3 className="font-black text-gray-900 text-base">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mt-2">{text}</p>
    </div>
  );
}

function StrategyCard({ title, text }) {
  return (
    <div className="rounded-2xl bg-[#F8F7FF] border border-violet-100 p-4">
      <CheckCircle size={18} style={{ color: C.purple }} />
      <h3 className="font-black text-gray-900 text-sm mt-3">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mt-1">{text}</p>
    </div>
  );
}
