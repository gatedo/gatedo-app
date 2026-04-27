import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Syringe,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Pill,
  Bug,
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

const VACCINE_PROTOCOL = [
  {
    title: '1ª Dose Múltipla',
    age: '9 semanas',
    tags: ['V3, V4 ou V5'],
    desc: 'Proteção contra Rinotraqueíte, Calicivirose e Panleucopenia. V4 inclui Clamídia e V5 inclui Leucemia Felina.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    title: '2ª Dose Múltipla',
    age: '+ 3 a 4 semanas',
    tags: ['V3, V4 ou V5'],
    desc: 'Reforço essencial para consolidar a imunidade inicial.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    title: '3ª Dose + Antirrábica',
    age: '+ 3 a 4 semanas',
    tags: ['V3, V4 ou V5', 'Antirrábica'],
    desc: 'Fecha o ciclo inicial e inclui proteção contra a raiva, quando indicada.',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  },
  {
    title: 'Reforço Semestral (Opcional)',
    age: '6 meses',
    tags: ['Múltipla'],
    desc: 'Pode ser recomendado em cenários de maior risco, conforme orientação veterinária.',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  {
    title: 'Reforço Anual',
    age: 'Todo ano',
    tags: ['Múltipla + Antirrábica'],
    desc: 'Mantém a proteção ativa ao longo da vida.',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
];

const PARASITE_PROTOCOL = [
  {
    title: 'Vermifugação inicial',
    age: 'Filhotes',
    tags: ['Vermífugo'],
    desc: 'O protocolo inicial costuma começar cedo e seguir reforços curtos até estabilização, sempre ajustado ao peso e orientação vet.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    title: 'Reforço preventivo',
    age: 'Conforme risco',
    tags: ['Vermífugo', 'Fezes / ambiente'],
    desc: 'A recorrência depende do estilo de vida, contato com rua, outros animais e achados clínicos.',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  },
  {
    title: 'Controle antipulgas',
    age: 'Uso contínuo ou sazonal',
    tags: ['Antiparasitário'],
    desc: 'Pulgas, ácaros e carrapatos exigem abordagem conforme produto, ambiente e reinfestações.',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  {
    title: 'Ambiente também conta',
    age: 'Sempre',
    tags: ['Higiene', 'Prevenção'],
    desc: 'Quando há infestação, só tratar o gato pode não bastar. Ambiente e contatos também precisam ser considerados.',
    color: 'bg-green-50 border-green-200 text-green-800',
  },
];

function StepCard({ step, idx }) {
  return (
    <div className="relative pl-12">
      <div className="absolute left-0 top-0 w-10 h-10 bg-white rounded-full border-4 border-[#F2F4F8] flex items-center justify-center shadow-sm z-10">
        <span className="text-[10px] font-black text-gray-400">{idx + 1}</span>
      </div>

      <div className={`p-4 rounded-[20px] border-2 ${step.color} shadow-sm relative`}>
        <div className="flex justify-between items-start gap-3 mb-2">
          <h4 className="font-black text-sm">{step.title}</h4>
          <span className="text-[10px] font-bold bg-white/60 px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap">
            <Clock size={10} />
            {step.age}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-2">
          {step.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-black bg-white px-2 py-1 rounded-md uppercase tracking-wide shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="text-xs opacity-85 font-medium leading-snug">{step.desc}</p>
      </div>
    </div>
  );
}

export default function WikiVaccines() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const touch = useSensory();

  const mode = searchParams.get('mode') === 'parasite' ? 'parasite' : 'vaccine';

  const content = useMemo(() => {
    if (mode === 'parasite') {
      return {
        title: 'Vermifugação & Antiparasitário',
        eyebrow: 'Guia Oficial Gatedo',
        introTitle: 'Proteção Preventiva',
        introText:
          'Vermífugos e antiparasitários devem respeitar fase de vida, peso, estilo de vida e orientação veterinária. O objetivo é prevenção inteligente, não uso automático.',
        icon: Shield,
        iconBg: 'from-blue-500 to-violet-600',
        protocol: PARASITE_PROTOCOL,
        alertTitle: 'Atenção ao uso contínuo',
        alertText:
          'Nem todo produto serve para todo gato. Evite repetir medicações sem avaliação de peso, idade, ambiente e histórico clínico.',
        accentIcon: Bug,
      };
    }

    return {
      title: 'Protocolo Vacinal',
      eyebrow: 'Guia Oficial Gatedo',
      introTitle: 'Imunização Felina',
      introText:
        'Seguir o calendário corretamente é uma das formas mais importantes de prevenir doenças graves. O protocolo final sempre deve respeitar a orientação veterinária.',
      icon: Syringe,
      iconBg: 'from-[#8B4AFF] to-[#8a84e2]',
      protocol: VACCINE_PROTOCOL,
      alertTitle: 'Atenção à V5 (FeLV)',
      alertText:
        'A vacina contra Leucemia Felina deve ser considerada com critério e, em geral, após avaliação adequada. Converse com o veterinário antes.',
      accentIcon: AlertCircle,
    };
  }, [mode]);

  const HeroIcon = content.icon;
  const AlertIcon = content.accentIcon;

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-10 pt-6 px-5 font-sans">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            touch();
            navigate(-1);
          }}
          className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h2 className="text-xl font-black text-gray-800 leading-none">{content.title}</h2>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wide">
            {content.eyebrow}
          </p>
        </div>
      </div>

      <div className={`bg-gradient-to-br ${content.iconBg} p-5 rounded-[24px] text-white shadow-lg mb-8 relative overflow-hidden`}>
        <div className="relative z-10">
          <h3 className="font-black text-lg mb-2 flex items-center gap-2">
            <HeroIcon size={20} />
            {content.introTitle}
          </h3>
          <p className="text-sm opacity-90 leading-relaxed max-w-[92%]">{content.introText}</p>

          <div className="mt-4 inline-flex items-center gap-2 bg-white/15 border border-white/15 rounded-full px-3 py-1.5">
            <CheckCircle size={13} />
            <span className="text-[10px] font-black uppercase tracking-wide">
              Leitura preventiva
            </span>
          </div>
        </div>

        <HeroIcon size={120} className="absolute -right-6 -bottom-6 opacity-10 rotate-[-15deg]" />
      </div>

      <div className="space-y-6 relative">
        <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-gray-200 rounded-full" />

        {content.protocol.map((step, idx) => (
          <StepCard key={idx} step={step} idx={idx} />
        ))}
      </div>

      <div className="mt-8 bg-orange-50 border border-orange-100 p-4 rounded-[20px] flex gap-3">
        <AlertIcon size={24} className="text-orange-500 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-orange-700 text-sm mb-1">{content.alertTitle}</h4>
          <p className="text-xs text-orange-600 leading-relaxed">{content.alertText}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] bg-white border border-gray-100 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4F3FF] flex items-center justify-center text-[#8B4AFF]">
            <Sparkles size={16} />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6D28D9]">
              Integração GATEDO
            </p>
            <p className="text-[12px] text-gray-600 leading-relaxed mt-1">
              Registrar vacina, vermífugo ou antiparasitário fortalece o histórico preventivo do gato,
              contribui para score clínico e melhora a leitura contextual do iGentVet.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => navigate('/wiki/vaccines?mode=vaccine')}
          className={`flex-1 rounded-[16px] px-4 py-3 text-[10px] font-black uppercase tracking-wide border ${
            mode === 'vaccine'
              ? 'bg-pink-600 text-white border-pink-600'
              : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Syringe size={12} />
            Vacinação
          </span>
        </button>

        <button
          onClick={() => navigate('/wiki/vaccines?mode=parasite')}
          className={`flex-1 rounded-[16px] px-4 py-3 text-[10px] font-black uppercase tracking-wide border ${
            mode === 'parasite'
              ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Pill size={12} />
            Vermifugação
          </span>
        </button>
      </div>
    </div>
  );
}
