import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, ChevronLeft, ChevronRight, Sparkles, Eye, Ear, Brain,
  Activity, Droplets, Utensils, AlertCircle, MapPin, Search,
  Mic, MicOff, HelpCircle, FileText, Phone, Download, Clock, Share2,
  CheckCircle, X, Heart, Stethoscope, History, ChevronDown,
  TrendingUp, ShieldCheck, Zap, Camera, ImagePlus, StopCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSensory from '../hooks/useSensory';
import api from '../services/api';
import OfferCard from '../components/offers/OfferCard';
import { brandAssets } from '../brand/assets';
import {
  buildIgentAlmanacContext,
  IGENT_ALMANAC_SCOPE,
  IGENT_VISUAL_ATLAS_SCOPE,
  syncIgentAlmanacFromApi,
} from '../services/igentAlmanacStore';

// ─── // ─── SONS (Web Audio API — zero dependência) ──────────────────────────────────
const SFX = (() => {
  let ctx = null;
  let lastPlayed = 0; // ← guard anti-overlap

  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };

  const tone = (freq, dur, vol = 0.025, type = 'sine', delay = 0) => {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.frequency.value = freq; o.type = type;
      const t = c.currentTime + delay;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch {}
  };

  const play = (fn) => {
    const now = Date.now();
    if (now - lastPlayed < 150) return; // ← ignora se < 150ms do último
    lastPlayed = now;
    fn();
  };

  return {
    keyTap:  () => play(() => tone(960, 0.05, 0.014, 'sine')),
    send:    () => play(() => { tone(880, 0.08, 0.016); tone(1240, 0.09, 0.014, 'sine', 0.045); }),
    receive: () => play(() => { tone(1040, 0.08, 0.014); tone(1320, 0.1, 0.012, 'sine', 0.055); }),
    confirm: () => play(() => { tone(880, 0.08, 0.017); tone(1180, 0.1, 0.015, 'sine', 0.055); tone(1460, 0.11, 0.012, 'sine', 0.11); }),
    error:   () => play(() => tone(360, 0.12, 0.014, 'triangle')),
    select:  () => play(() => { tone(920, 0.06, 0.014); tone(1260, 0.08, 0.011, 'sine', 0.04); }),
  };
})();

// ─── BRAND ───────────────────────────────────────────────────────────────────
const C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  purpleDeep: '#2D2657',
  accent: '#ebfc66',
  accentDim: '#ebfc66',
  bg: '#F4F3FF',
  white: '#ffffff',
};

// ─── FASES DE LOADING ─────────────────────────────────────────────────────────
const PHASES = [
  '🔬 Analisando histórico clínico...',
  '🧬 Cruzando padrões da raça...',
  '💾 Consultando banco de dados...',
  '🤖 Processando com IA preditiva...',
  '📋 Gerando pré-diagnóstico...',
];

// ─── CATEGORIAS DE SINTOMAS ───────────────────────────────────────────────────
const SYMPTOMS = [
  { id: 'skin',      label: 'Pele & Pelo',      emoji: '✨', icon: Sparkles,    bg: '#FFF9C4', fg: '#7B6F00', urgent: false },
  { id: 'eyes',      label: 'Olhos',             emoji: '👁',  icon: Eye,         bg: '#E0F7FA', fg: '#006064', urgent: false },
  { id: 'ears',      label: 'Orelhas',           emoji: '👂', icon: Ear,         bg: '#EDE7F6', fg: '#4527A0', urgent: false },
  { id: 'behavior',  label: 'Comportamento',     emoji: '🧠', icon: Brain,       bg: '#FFF3E0', fg: '#E65100', urgent: false },
  { id: 'digestion', label: 'Vômito / Diarreia', emoji: '🤢', icon: Utensils,    bg: '#FCE4EC', fg: '#880E4F', urgent: true  },
  { id: 'urinary',   label: 'Xixi & Cocô',       emoji: '💧', icon: Droplets,    bg: '#F1F8E9', fg: '#33691E', urgent: true  },
  { id: 'mobility',  label: 'Dor / Mancando',    emoji: '🦴', icon: Activity,    bg: '#FBE9E7', fg: '#BF360C', urgent: true  },
  { id: 'other',     label: 'Emergência',        emoji: '🚨', icon: AlertCircle, bg: '#FFEBEE', fg: '#B71C1C', urgent: true  },
];

// ─── HELPERS DE GÊNERO ────────────────────────────────────────────────────────
const art  = (cat) => cat?.gender === 'FEMALE' ? 'a' : 'o';
const pron = (cat) => cat?.gender === 'FEMALE' ? 'ela' : 'ele';
const adj  = (cat, w) => (cat?.gender === 'FEMALE' && w.endsWith('o')) ? w.slice(0,-1)+'a' : w;

// ─── AVATAR HELPER ────────────────────────────────────────────────────────────
const catAvatar = (cat) => cat?.photoUrl || cat?.image || '/assets/cat-placeholder.png';

const cleanPlainText = (value = '') =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildTutorContextPrompt = ({ cat, ownerName, symptom }) => {
  const owner = ownerName || 'Tutor';
  const catName = cat?.name || 'seu gato';
  const prep = art(cat);
  const pronoun = pron(cat);
  const age = cat?.ageYears ? `${cat.ageYears} ano${Number(cat.ageYears) === 1 ? '' : 's'}` : 'a idade atual';
  const neutered = cat?.neutered ? 'ja castrad' + (cat?.gender === 'FEMALE' ? 'a' : 'o') : 'ainda nao castrad' + (cat?.gender === 'FEMALE' ? 'a' : 'o');
  const base = `${owner}, quero entender com calma o contexto d${prep} <b>${catName}</b>.`;
  const theme = symptom?.id || 'other';

  if (theme === 'behavior') {
    return {
      text:
        `${base} Pelo perfil d${prep} <b>${catName}</b>, com ${age} e ${neutered}, alguns comportamentos podem ter relacao com fase de vida, hormonios, territorio, rotina ou algum desconforto fisico. ` +
        `Mas para eu nao te dar uma resposta fria ou generica, me conta o que de fato esta acontecendo com ${pronoun}: escolha uma opcao abaixo ou descreva do teu ponto de vista.`,
      replies: [
        { label: 'Agressividade', text: `${catName} esta mostrando agressividade.` },
        { label: 'Miando muito', text: `${catName} esta miando muito.` },
        { label: 'Tentando fugir', text: `${catName} esta tentando fugir.` },
        { label: 'Marcacao de territorio', text: `${catName} esta marcando territorio.` },
        { label: 'Urinando fora da caixa', text: `${catName} esta urinando fora da caixa.` },
        { label: 'Vou explicar melhor', text: 'Vou explicar melhor com minhas palavras.' },
      ],
    };
  }

  if (theme === 'skin') {
    return {
      text:
        `${base} Em pele e pelo, foto e detalhes mudam muito a leitura: coceira, lambedura, ferida, falha de pelo, crosta ou secrecao apontam caminhos diferentes. ` +
        `Se voce enviou imagem, eu vou considerar o achado visual no laudo; agora me diga o que mais chama atencao.`,
      replies: [
        { label: 'Cocando muito', text: `${catName} esta se cocando muito.` },
        { label: 'Ferida ou crosta', text: `${catName} tem ferida ou crosta.` },
        { label: 'Falha de pelo', text: `${catName} esta com falha de pelo.` },
        { label: 'Lambendo a area', text: `${catName} esta lambendo a area.` },
        { label: 'Tem secrecao', text: 'Notei secrecao ou pus.' },
      ],
    };
  }

  if (theme === 'eyes') {
    return {
      text:
        `${base} Nos olhos eu preciso ser mais cuidadoso, porque dor, olho fechado, opacidade ou secrecao intensa podem pedir avaliacao presencial rapida. ` +
        `Se voce mandou foto, ela entra como referencia visual no laudo. Qual detalhe descreve melhor o que voce esta vendo?`,
      replies: [
        { label: 'Olho fechado', text: 'O olho esta quase totalmente fechado.' },
        { label: 'Secrecao', text: 'Percebi secrecao no olho.' },
        { label: 'Olho opaco', text: 'O olho parece opaco ou esbranquicado.' },
        { label: 'Vermelhidao', text: 'Tem vermelhidao ou inchaco.' },
        { label: 'So um olho', text: 'A alteracao aparece em apenas um olho.' },
      ],
    };
  }

  if (theme === 'urinary') {
    return {
      text:
        `${base} Quando envolve xixi ou caixa de areia, eu preciso separar comportamento de dor urinaria, porque esforco para urinar, sangue ou idas repetidas a caixa podem ser urgencia em gatos. ` +
        `Me diga qual sinal esta mais presente agora.`,
      replies: [
        { label: 'Faz forca', text: `${catName} faz forca para urinar.` },
        { label: 'Pouco xixi', text: `${catName} faz pouco xixi.` },
        { label: 'Sangue no xixi', text: 'Percebi sangue no xixi.' },
        { label: 'Fora da caixa', text: `${catName} esta urinando fora da caixa.` },
        { label: 'Vai muitas vezes', text: `${catName} vai muitas vezes a caixa.` },
      ],
    };
  }

  return {
    text:
      `${base} Para transformar isso em uma orientacao realmente util, preciso de mais um detalhe do que voce esta vendo agora: quando comecou, se esta piorando, e se ${pronoun} ainda esta comendo, bebendo agua e usando a caixinha normalmente.`,
    replies: [
      { label: 'Comecou hoje', text: 'Comecou hoje.' },
      { label: 'Esta piorando', text: 'Esta piorando.' },
      { label: 'Esta comendo', text: `${catName} ainda esta comendo.` },
      { label: 'Nao quer comer', text: `${catName} nao quer comer.` },
      { label: 'Vou explicar melhor', text: 'Vou explicar melhor com minhas palavras.' },
    ],
  };
};

const TRIAGE_OPTION_SETS = {
  behavior: [
    ['Comecou hoje', 'Esta acontecendo ha dias', 'Piorou de repente', 'Acontece em horarios especificos', 'Nao sei quando comecou'],
    ['Agressividade', 'Miando muito', 'Tentando fugir', 'Marcando territorio', 'Urinando fora da caixa', 'Se escondendo'],
    ['Nao castrado', 'Mudanca de rotina', 'Novo animal/pessoa', 'Caixa de areia mudou', 'Menos brincadeira', 'Pode ter dor'],
  ],
  skin: [
    ['Cocando muito', 'Lambendo a area', 'Mordendo o local', 'Nao percebi coceira', 'Piora a noite'],
    ['Ferida/crosta', 'Falha de pelo', 'Vermelhidao', 'Secrecao/pus', 'Descamacao', 'Caroço/inchaco'],
    ['Mudou racao', 'Mudou areia', 'Pulgas/carrapatos', 'Produto novo', 'Outro animal com lesao', 'Nada mudou'],
  ],
  eyes: [
    ['Olho aberto', 'Olho semicerrado', 'Olho fechado', 'Parece dor', 'Incomoda com luz'],
    ['Sem secrecao', 'Secrecao transparente', 'Secrecao amarela/verde', 'Olho opaco', 'Vermelhidao/inchaco'],
    ['Um olho', 'Dois olhos', 'Comecou hoje', 'Ja vem de dias', 'Teve trauma/briga'],
  ],
  urinary: [
    ['Faz forca', 'Vai muitas vezes', 'Sai pouco xixi', 'Sangue no xixi', 'Nao consegue urinar'],
    ['Fora da caixa', 'Caixa normal', 'Mudou areia', 'Mais sede', 'Dor/miado na caixa'],
    ['Macho', 'Nao castrado', 'Estressado', 'Come normal', 'Nao quer comer', 'Apatia'],
  ],
  digestion: [
    ['Vomitou uma vez', 'Vomitou varias vezes', 'Diarreia', 'Fezes com sangue', 'Nausea/baba'],
    ['Come normal', 'Comeu menos', 'Nao quer comer', 'Bebe agua', 'Nao bebe agua'],
    ['Mudou racao', 'Comeu algo diferente', 'Plantas/produtos', 'Vermifugo atrasado', 'Outro animal igual'],
  ],
  ears: [
    ['Coca a orelha', 'Sacode a cabeca', 'Cabeca inclinada', 'Parece dor', 'Perde equilibrio'],
    ['Cera escura', 'Cera amarela', 'Mau cheiro', 'Vermelhidao', 'Ferida/crosta'],
    ['Um ouvido', 'Dois ouvidos', 'Outro gato com coceira', 'Comecou hoje', 'Ja vem de dias'],
  ],
  mobility: [
    ['Mancando', 'Nao pula', 'Evita andar', 'Chora ao tocar', 'Fica escondido'],
    ['Queda/trauma', 'Brigou', 'Pata inchada', 'Sem ferida visivel', 'Ferida aparente'],
    ['Come normal', 'Nao quer comer', 'Usa caixa normal', 'Dificuldade na caixa', 'Apatia'],
  ],
  other: [
    ['Comecou hoje', 'Piorou rapido', 'Vai e volta', 'Esta estavel', 'Nao sei dizer'],
    ['Come normal', 'Comeu menos', 'Nao quer comer', 'Bebe agua', 'Mudou caixinha'],
    ['Apatia', 'Dor aparente', 'Respiracao diferente', 'Febre suspeita', 'Vou explicar melhor'],
  ],
};

const getThemeTriageOptions = (symptomId = 'other', question = '', index = 0) => {
  const normalized = String(question).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const themeOptions = TRIAGE_OPTION_SETS[symptomId] || TRIAGE_OPTION_SETS.other;
  if (symptomId === 'behavior') return themeOptions[Math.min(index, themeOptions.length - 1)];
  if (/(come|comendo|apetite|agua|caixinha|urina|fezes)/.test(normalized)) {
    return ['Come normal', 'Comeu menos', 'Nao quer comer', 'Bebe agua normal', 'Mudou xixi/fezes', 'Usa caixinha normal'];
  }
  return themeOptions[Math.min(index, themeOptions.length - 1)];
};

const buildThemeTriageQuestions = ({ symptomId = 'other', cat }) => {
  const name = cat?.name || 'seu gato';
  const prep = art(cat);
  const sets = {
    behavior: [
      `${name} começou a mudar o comportamento quando? Foi algo súbito ou veio aumentando aos poucos?`,
      `Qual comportamento está mais presente em ${name}: agressividade, miados, tentativa de fuga, marcação de território ou xixi fora da caixa?`,
      `Teve alguma mudança no ambiente d${prep} ${name}, na rotina, caixa de areia, presença de pessoas/animais ou sinais de dor ao tocar?`,
    ],
    skin: [
      `O que você vê na pele ou pelo d${prep} ${name}: coceira, lambedura, ferida, crosta, falha de pelo ou secreção?`,
      `A alteração está em qual região e está aumentando, espalhando ou ficando mais dolorida?`,
      `Mudou ração, areia, produto de limpeza, antipulgas ou apareceu pulga/outro animal com lesão?`,
    ],
    eyes: [
      `O olho d${prep} ${name} está aberto, semicerrado ou fechado? Parece doer ou incomodar com luz?`,
      `Tem secreção, vermelhidão, inchaço ou opacidade? É em um olho ou nos dois?`,
      `Começou hoje, veio piorando há dias ou aconteceu depois de trauma, briga ou contato com produto?`,
    ],
    urinary: [
      `${name} está fazendo força, indo muitas vezes à caixa, fazendo pouco xixi ou vocalizando ao urinar?`,
      `Você viu sangue, urina fora da caixa ou mudança forte no cheiro/cor do xixi?`,
      `${name} está comendo, bebendo água e ativo normalmente ou ficou apático/escondido?`,
    ],
    digestion: [
      `${name} vomitou quantas vezes ou teve diarreia nas últimas 24 horas?`,
      `${name} ainda está comendo e bebendo água ou recusou alimento?`,
      `Teve troca de ração, petisco novo, planta/produto acessível ou vermífugo atrasado?`,
    ],
    ears: [
      `${name} está coçando a orelha, sacudindo a cabeça ou mantendo a cabeça inclinada?`,
      `Você percebe cera escura/amarela, mau cheiro, vermelhidão ou feridas na orelha?`,
      `É em um ouvido ou nos dois? Outros gatos da casa também estão coçando?`,
    ],
    mobility: [
      `${name} está mancando, evitando pular, escondido ou reclamando quando toca?`,
      `Teve queda, briga, trauma, pata inchada ou ferida aparente?`,
      `${name} consegue comer, beber água e usar a caixa normalmente?`,
    ],
  };
  return sets[symptomId] || null;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const urlToDataUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return blobToDataUrl(blob);
};

// ─── CSS INLINE ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');

  .igent-root { font-family: 'Nunito', sans-serif; }

  /* Fundo degradê vivo da tela de seleção */
  .igent-hero-bg {
    background: linear-gradient(180deg, #8B4AFF 0%, #7E46E1 56%, #592BB6 100%) !important;
  }
    
  /* Card do gato no carrossel */
  .cat-card {
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(12px);
    border: 2px solid rgba(255,255,255,0.3);
    transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  .cat-card.active {
    background: rgba(255,255,255,0.25);
    border-color: ${C.accent};
    box-shadow: 0 0 0 3px ${C.accent}40, 0 24px 48px rgba(0,0,0,0.25);
  }

  /* Chip de sintoma */
  .symptom-chip {
    transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
  }
  .symptom-chip:active { transform: scale(0.93); }

  /* Typing dots */
  @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
  .dot1 { animation: blink 1.2s infinite 0s; }
  .dot2 { animation: blink 1.2s infinite 0.2s; }
  .dot3 { animation: blink 1.2s infinite 0.4s; }

  /* Neon bar */
  @keyframes neonSlide {
    0%   { transform: translateX(-120%) scaleX(0.5); opacity: 0.6; }
    50%  { transform: translateX(0%)    scaleX(1);   opacity: 1;   }
    100% { transform: translateX(120%)  scaleX(0.5); opacity: 0.6; }
  }
  .neon-bar { animation: neonSlide 1.6s ease-in-out infinite; }

  /* Pulse vivo */
  @keyframes aliveRing {
    0%,100% { box-shadow: 0 0 0 0 ${C.accent}60; }
    50%     { box-shadow: 0 0 0 10px ${C.accent}00; }
  }
  .alive-ring { animation: aliveRing 2s ease-in-out infinite; }

  /* Chip de histórico */
  .history-chip {
    background: rgba(97,88,202,0.08);
    border: 1px solid rgba(97,88,202,0.18);
  }

  /* Scroll suave */
  .smooth-scroll { scroll-behavior: smooth; }
  .smooth-scroll::-webkit-scrollbar { width: 0; }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 0 — Seleção de Gato com busca
// ═══════════════════════════════════════════════════════════════════════════════
function StepSelect({ cats, activeIdx, setActiveIdx, onConfirm, onBack }) {
  const [query, setQuery] = useState('');
  const touch    = useSensory();
  const navigate = useNavigate();

  const filtered = cats.filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase())
  );

  const selCat = filtered[activeIdx] || filtered[0];

  const go = (dir) => {
    touch('nav');
    setActiveIdx(i => (i + dir + filtered.length) % filtered.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: -60, opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="igent-hero-bg flex flex-col overflow-hidden"
      style={{ height: '100svh', position: 'relative' }}
    >
      {/* Orbs decorativos */}
      <div className="absolute top-[-80px] right-[-60px] w-72 h-72 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
      <div className="absolute bottom-[80px] left-[-40px] w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #DFFF40 0%, transparent 70%)' }} />

      {/* Header fixo no topo */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 relative z-10 flex-shrink-0 w-full max-w-[920px] mx-auto">
        <button onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
          <ChevronLeft size={22} className="text-white" />
        </button>
        <div className="flex flex-col items-center">
          <img src={brandAssets.igentvetWordmark} alt="iGentVet" className="h-7 object-contain" />
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-0.5">Agente Veterinário IA</span>
        </div>
        <button onClick={() => navigate('/igent-help')}
          className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
          <HelpCircle size={18} className="text-white" />
        </button>
      </div>

      {/* Título compacto */}
      <div className="text-center px-6 pb-2 relative z-10 flex-shrink-0 w-full max-w-[920px] mx-auto">
        <h1 className="text-2xl font-black text-white leading-tight">
          Qual gatinho{' '}
          <span style={{ color: C.accent }}>vamos analisar</span>?
        </h1>
      </div>

      {/* Busca — só se > 3 gatos */}
      {cats.length > 3 && (
        <div className="px-6 pb-3 relative z-10 flex-shrink-0 w-full max-w-[920px] mx-auto">
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/25">
            <Search size={15} className="text-white/60" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
              placeholder="Buscar por nome..."
              className="flex-1 bg-transparent outline-none text-white placeholder-white/40 text-sm font-bold"
            />
            {query && <button onClick={() => setQuery('')}><X size={13} className="text-white/50" /></button>}
          </div>
        </div>
      )}

      {/* Carrossel — ocupa o espaço restante */}
      <div className="relative flex-1 flex flex-col items-center justify-center z-10 overflow-hidden w-full max-w-[920px] mx-auto"
        style={{ transform: 'translateY(-18px)' }}>
        {filtered.length === 0 ? (
          <div className="text-white/60 text-center">
            <p className="text-4xl mb-2">🐱</p>
            <p className="font-bold">Nenhum gato encontrado</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-full relative" style={{ height: '280px' }}>
              {/* Ghost anterior */}
              {filtered.length > 1 && (
                <motion.button
                  key={`prev-${activeIdx}`}
                  className="absolute z-0 cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 0.45, x: 0, scale: 0.68 }}
                  style={{ filter: 'blur(2px)', left: '0%', transformOrigin: 'center' }}
                  onClick={() => go(-1)}>
                  <MiniCatCard cat={filtered[(activeIdx - 1 + filtered.length) % filtered.length]} />
                </motion.button>
              )}

              {/* Card principal — botão "Analisar" embutido */}
              <motion.div
                key={`main-${selCat?.id}`}
                className="z-10 relative"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                <MainCatCard
                  cat={selCat}
                  onConfirm={() => { touch('nav'); onConfirm(selCat); }}
                />
              </motion.div>

              {/* Ghost próximo */}
              {filtered.length > 1 && (
                <motion.button
                  key={`next-${activeIdx}`}
                  className="absolute z-0 cursor-pointer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 0.45, x: 0, scale: 0.68 }}
                  style={{ filter: 'blur(2px)', right: '0%', transformOrigin: 'center' }}
                  onClick={() => go(1)}>
                  <MiniCatCard cat={filtered[(activeIdx + 1) % filtered.length]} />
                </motion.button>
              )}
            </div>

            {/* Setas */}
            {filtered.length > 1 && (
              <>
                <button onClick={() => go(-1)}
                  className="absolute left-3 z-20 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                  <ChevronLeft size={22} className="text-white" />
                </button>
                <button onClick={() => go(1)}
                  className="absolute right-3 z-20 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                  <ChevronRight size={22} className="text-white" />
                </button>
              </>
            )}

            {/* Dots */}
            {filtered.length > 1 && (
              <div className="flex gap-1.5 mt-3">
                {filtered.map((_, i) => (
                  <button key={i} onClick={() => { touch('nav'); setActiveIdx(i); }}
                    className="rounded-full transition-all"
                    style={{ width: i === activeIdx ? 20 : 6, height: 6,
                      background: i === activeIdx ? C.accent : 'rgba(255,255,255,0.35)' }} />
                ))}
              </div>
            )}

            {/* Contador */}
            <p className="text-center text-white/35 text-[10px] font-bold mt-2 uppercase tracking-widest">
              {cats.length} {cats.length === 1 ? 'gato cadastrado' : 'gatos cadastrados'}
            </p>

            <button
              onClick={() => { touch('nav'); navigate('/cats'); }}
              className="mt-3 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white text-xs font-black uppercase tracking-wider backdrop-blur-sm">
              Ver todos os gatos
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Card grande — botão "Analisar" embutido no card
function MainCatCard({ cat, onConfirm }) {
  const theme = cat?.themeColor || C.purple;
  const lastConsult = cat?.healthRecords?.length > 0
    ? new Date(cat.healthRecords.sort((a,b)=>new Date(b.date)-new Date(a.date))[0].date).toLocaleDateString('pt-BR')
    : null;
  const records = cat?.healthRecords || [];
  const isMemorial = cat?.isMemorial || cat?.isArchived;
  return (
    <div className="rounded-[32px] w-60 flex flex-col items-center pt-3 pb-4 px-4 bg-white shadow-2xl"
      style={{ border: `3px solid ${theme}`, boxShadow: `0 0 0 3px ${theme}30, 0 20px 48px rgba(0,0,0,0.22)` }}>
      {/* Faixa topo */}
      <div className="w-full h-11 rounded-[18px] mb-2 relative overflow-hidden flex items-center justify-between px-3"
        style={{ background: `linear-gradient(135deg, ${theme}22 0%, ${theme}44 100%)` }}>
        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: theme }}>Prontuário</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isMemorial ? '#999' : theme }} />
          <span className="text-[8px] font-black" style={{ color: theme }}>{isMemorial ? 'Em Memória' : 'Ativo'}</span>
        </div>
      </div>
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mb-2 -mt-1"
        style={{ border: `3px solid ${theme}` }}>
        <img src={catAvatar(cat)} className="w-full h-full object-cover"
          onError={e => e.target.src = 'https://cdn-icons-png.flaticon.com/512/1998/1998627.png'} />
      </div>
      <h3 className="font-black text-gray-800 text-lg leading-none">{cat?.name}</h3>
      <p className="text-gray-400 text-[11px] font-bold mt-0.5">{cat?.breed || 'SRD'}</p>
      <div className="mt-2 flex flex-wrap gap-1 justify-center">
        {cat?.neutered && (
          <span className="text-[8px] font-black rounded-full px-2 py-0.5"
            style={{ background: `${theme}18`, color: theme }}>✂ Castrad{cat.gender==='FEMALE'?'a':'o'}</span>
        )}
        {records.length > 0 && (
          <span className="text-[8px] font-black rounded-full px-2 py-0.5"
            style={{ background: `${theme}18`, color: theme }}>{records.length} registros</span>
        )}
        {lastConsult && (
          <span className="text-[8px] font-black rounded-full px-2 py-0.5 bg-gray-100 text-gray-500">
            vet: {lastConsult}
          </span>
        )}
      </div>
      {/* Botão de ação embutido */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onConfirm}
        className="alive-ring w-full mt-3 py-2.5 rounded-[18px] font-black text-sm flex items-center justify-center gap-2 shadow-lg"
        style={isMemorial
          ? { background: 'linear-gradient(135deg,#4a4a6a,#2D2657)', color: 'rgba(255,255,255,0.8)' }
          : { background: C.accent, color: C.purpleDeep }
        }>
        {isMemorial
          ? <><Heart size={14} className="text-rose-300" /> Recordar</>
          : <><Sparkles size={14} /> Analisar {cat?.name}</>
        }
      </motion.button>
    </div>
  );
}

// Card mini (adjacente no carrossel)
function MiniCatCard({ cat }) {
  const theme = cat?.themeColor || C.purple;
  return (
    <div className="rounded-[22px] w-34 flex flex-col items-center pt-2 pb-3 px-3 bg-white shadow-lg"
      style={{ border: `2px solid ${theme}55` }}>
      <div className="w-14 h-14 rounded-full overflow-hidden mb-1.5"
        style={{ border: `2.5px solid ${theme}` }}>
        <img src={catAvatar(cat)} className="w-full h-full object-cover"
          onError={e => e.target.src = 'https://cdn-icons-png.flaticon.com/512/1998/1998627.png'} />
      </div>
      <p className="font-black text-gray-700 text-xs leading-none">{cat?.name}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Triagem de sintomas
// ═══════════════════════════════════════════════════════════════════════════════
function StepSymptoms({ cat, onSelect, onBack }) {
  const touch = useSensory();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="flex flex-col h-full w-full mx-auto"
      style={{ background: C.bg }}
    >
      {/* Header */}
      <div className="pt-10 pb-6 px-5 rounded-b-[36px] shadow-md relative"
        style={{ background: 'linear-gradient(180deg, #8B4AFF 0%, #7E46E1 58%, #592BB6 100%)' }}>
        <div className="w-full max-w-[920px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <button onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <ChevronLeft size={22} className="text-white" />
          </button>
          <img src={brandAssets.igentvetWordmark} alt="iGentVet" className="h-6 object-contain" />
          <div className="w-10" />
        </div>

        {/* Mini cat info */}
        <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl p-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0"
            style={{ borderColor: C.accent }}>
            <img src={catAvatar(cat)} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm leading-none truncate">{cat?.name}</p>
            <p className="text-white/60 text-[10px] font-bold mt-0.5 truncate">{cat?.breed || 'SRD'} · {cat?.gender === 'MALE' ? 'Macho' : 'Fêmea'}</p>
          </div>
          <div className="flex items-center gap-1 bg-green-400/20 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] text-green-300 font-black">Prontuário ativo</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-white font-black text-lg">O que está acontecendo?</h2>
          <p className="text-white/50 text-xs mt-0.5">Selecione a área de maior preocupação</p>
        </div>
        </div>
      </div>

      {/* Grid de sintomas */}
      <div className="flex-1 overflow-y-auto px-4 py-5" style={{ background: C.bg }}>
        <div className="grid grid-cols-2 gap-3 pb-28 w-full max-w-[920px] mx-auto">
          {SYMPTOMS.map((s) => (
            <motion.button
              key={s.id}
              className="symptom-chip rounded-[22px] p-4 flex flex-col items-start gap-2 shadow-sm relative overflow-hidden"
              style={{ background: s.bg }}
              whileTap={{ scale: 0.94 }}
              onClick={() => { touch('nav'); onSelect(s); }}
            >
              {/* Badge urgente */}
              {s.urgent && (
                <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-400" />
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${s.fg}18` }}>
                <span className="text-xl">{s.emoji}</span>
              </div>
              <div>
                <p className="font-black text-sm leading-tight" style={{ color: s.fg }}>{s.label}</p>
                {s.urgent && (
                  <p className="text-[9px] font-bold mt-0.5 opacity-60" style={{ color: s.fg }}>Requer atenção</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-gray-400 text-[10px] font-bold px-4 pb-4">
          🔒 As informações são analisadas por IA e não substituem consulta veterinária presencial.
        </p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Chat IA
// ═══════════════════════════════════════════════════════════════════════════════
function StepChat({ cat, symptom, historyCtx, onBack, onSaveHistory, skipAutoStart, initialInput }) {
  const touch = useSensory();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const inputRef  = useRef(null);

  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [isTyping, setIsTyping]         = useState(false);
  const [phase, setPhase]               = useState(0);
  const [consultDone, setConsultDone]   = useState(false);
  const [awaitingMoreQ, setAwaitingMoreQ] = useState(false); // TRUE só quando card "mais dúvidas?" está na tela aguardando
  const [sessionClosed, setSessionClosed] = useState(false); // TRUE quando tutor disse "não tenho mais dúvidas"
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [reportData, setReportData]     = useState(null);
  const [mediaFile, setMediaFile]       = useState(null);   // { type:'image'|'audio', url, file }
  const [recording, setRecording]       = useState(false);
  const mediaRecRef                     = useRef(null);
  const fileInputRef                    = useRef(null);
  const [medAlertModal, setMedAlertModal] = useState(null);
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== 'undefined' && Notification?.permission === 'granted'
  );
  const [credits, setCredits] = useState(null);
  const [notifyingReset, setNotifyingReset] = useState(false);
  const [resetNotified, setResetNotified] = useState(false);
  const [painOffer, setPainOffer] = useState(null);
  const painOfferCheckedRef = useRef(null);

  // Saldo de perguntas do mês — buscado uma vez e atualizado a cada resposta da IA
  useEffect(() => {
    api.get('/igent/credits', { params: { petId: cat.id } })
      .then(r => setCredits(r.data))
      .catch(() => {});
  }, [cat.id]);

  const handleNotifyReset = async () => {
    if (notifyingReset || resetNotified) return;
    setNotifyingReset(true);
    try {
      await api.post('/igent/credits/notify-reset', { petId: cat.id });
      setResetNotified(true);
    } catch {
      // silencioso — não é crítico
    } finally {
      setNotifyingReset(false);
    }
  };

  const creditsResetLabel = credits?.resetsAt
    ? new Date(credits.resetsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    : null;

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 80);
  }, [messages, isTyping]);

  // Contexto de dor — pergunta sobre xixi/caixa/marcação: pergunta ao módulo
  // único de decisão se cabe o card do Protocolo, depois da resposta.
  useEffect(() => {
    if (isTyping) return;
    const last = messages[messages.length - 1];
    if (!last || last.sender !== 'bot' || last.type !== 'text') return;
    if (painOfferCheckedRef.current === last.id) return;

    const lastUser = [...messages].reverse().find((m) => m.sender === 'user' && m.type === 'text');
    if (!lastUser?.text) return;
    if (!/xixi|urin|caixa de areia|areia|marca(ç|c)[aã]o|marcando|marcou/i.test(lastUser.text)) return;

    painOfferCheckedRef.current = last.id;
    api.get('/offers/decide', { params: { surface: 'PAIN_IGENT', petId: cat.id } })
      .then((r) => { if (r.data?.offer) setPainOffer(r.data.offer); })
      .catch(() => {});
  }, [messages, isTyping, cat.id]);

// ─── FASE DE LOADING — só visual, zero áudio ────────────────────────────
useEffect(() => {
  if (!isTyping) return;
  const t = setInterval(() => {
    setPhase(p => (p + 1) % PHASES.length);
    // ← SEM SFX aqui — o som vem do useEffect abaixo
  }, 1400);
  return () => clearInterval(t);
}, [isTyping]);

// ─── SOM SEMÂNTICO — 1 ping quando bot começa, 1 receive quando termina ─
const prevTyping = useRef(false);
useEffect(() => {
  if (isTyping && !prevTyping.current) {
    // Bot começou a "digitar" → ping suave único
    SFX.keyTap();
  }
  if (!isTyping && prevTyping.current) {
    // Bot terminou e entregou mensagem → receive
    SFX.receive();
  }
  prevTyping.current = isTyping;
}, [isTyping]);

  const addMsg = useCallback((msg) =>
    setMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]), []);

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Inicia análise ao montar — ref guard evita dupla chamada no StrictMode.
  // Vindo do Guia (skipAutoStart), pula a análise automática e só deixa a
  // pergunta pronta no campo de texto pro tutor revisar e enviar.
  const analysisStarted = useRef(false);
  useEffect(() => {
    if (analysisStarted.current) return;
    analysisStarted.current = true;
    if (skipAutoStart) {
      if (initialInput) setInput(initialInput);
      return;
    }
    startAnalysis();
  }, []); // eslint-disable-line

  const startAnalysis = async () => {
    // Mensagem inicial do usuário
    addMsg({
      sender: 'user', type: 'symptom_tag',
      emoji: symptom.emoji, label: symptom.label,
      text: `Quero analisar: ${symptom.label}`
    });

    setIsTyping(true);
    await wait(500);

    try {
      // Busca histórico completo PRIMEIRO para enviar contexto rico à IA
      const localData = await fetchHistory(cat.id);
      await syncIgentAlmanacFromApi(IGENT_ALMANAC_SCOPE);

      const aiRes = await api.post('/igent/analyze', {
        petId: cat.id,
        symptom: symptom.label,
        symptomId: symptom.id,
        clinicalContext: {
          ...localData.clinicalContext,
          adminAlmanacContext: buildIgentAlmanacContext({ symptom: symptom.label, breed: cat.breed, scope: IGENT_ALMANAC_SCOPE }),
        }, // contexto clínico completo + almanaque admin
      });

      await wait(1800);
      setIsTyping(false);

      const ai = aiRes.data;

      if (ai.blocked) {
        setCredits(ai);
        return;
      }
      if (ai.credits) setCredits(ai.credits);

      // Saudação personalizada com contexto clínico completo
      addMsg({
        sender: 'bot', type: 'greeting',
        catName: cat.name,
        ownerName: localData.ownerName,
        hasHistory: localData.records.length > 0,
        recordCount: localData.records.length,
        lastConsult: localData.lastConsult,
        lastVet: localData.lastVet,
        ongoingTreatments: localData.ongoingTreatments,
        medications: localData.medications,
        vaccines: localData.vaccines,
      });

      // Se há medicamentos ativos, mostra chips de alerta antes da análise
      if (localData.medications && localData.medications.length > 0) {
        addMsg({
          sender: 'bot', type: 'med_chips',
          medications: localData.medications,
          ownerName: localData.ownerName,
          catName: cat.name,
        });
      }

      await wait(1200);
      setIsTyping(true);
      await wait(2000);
      setIsTyping(false);

      // Análise IA
      addMsg({
        sender: 'bot', type: 'analysis',
        text: ai.analysisText,
        symptomLabel: symptom.label,
      });

      await wait(1400);
      setIsTyping(true);
      await wait(2200);
      setIsTyping(false);

      // Perguntas de triagem personalizadas (da biblioteca de prompts)
      const triageQs = buildThemeTriageQuestions({ symptomId: symptom.id, cat }) || ai.triageQuestions || [];
      if (triageQs.length > 0) {
        addMsg({
          sender: 'bot', type: 'triage_questions',
          questions: triageQs,
          catName: cat.name,
          ownerName: localData.ownerName,
          symptomId: symptom.id,
          symptomLabel: symptom.label,
        });
      } else {
        // Fallback genérico se não vieram perguntas
        addMsg({
          sender: 'bot', type: 'text',
          text: `${localData.ownerName ? `${localData.ownerName}, uma` : 'Uma'} pergunta importante: ${pron(cat)} está ${adj(cat, 'apático')} e sem comer, ou ainda interage normalmente?`
        });
      }

      // Red flags se houver
      if (ai.redFlags && ai.redFlags.length > 0) {
        await wait(1500);
        addMsg({
          sender: 'bot', type: 'red_flags',
          flags: ai.redFlags,
          catName: cat.name,
        });
      }

      // Nota de raça se houver
      if (ai.breedNote) {
        await wait(1200);
        addMsg({ sender: 'bot', type: 'breed_note', text: ai.breedNote, breed: cat.breed });
      }

      await wait(3500);
      setIsTyping(true);
      await wait(2000);
      setIsTyping(false);

      // Laudo final
      const rd = {
        symptom: symptom.label,
        isUrgent: ai.isUrgent,
        urgentReason: ai.urgentReason,
        care: ai.care || [],
        probabilities: ai.probabilities || [],
        vetName: localData.lastVet,
        analysisText: ai.analysisText,
        ownerName: localData.ownerName,
        catName: cat.name,
        whenToVet: ai.whenToVet,
        breedNote: ai.breedNote,
      };
      setReportData(rd);

      await wait(900);
      const contextualPrompt = buildTutorContextPrompt({
        cat,
        ownerName: localData.ownerName,
        symptom,
      });
      addMsg({
        sender: 'bot',
        type: 'guided_followup',
        catName: cat.name,
        ownerName: localData.ownerName,
        text: contextualPrompt.text,
        replies: contextualPrompt.replies,
      });

      setConsultDone(true);
      touch('nav');
      // Input fica aberto — o "mais dúvidas?" aparece após a primeira resposta do usuário

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      addMsg({
        sender: 'bot', type: 'text',
        text: '⚠️ Houve uma falha na conexão com a rede neural. Tente novamente em instantes.'
      });
    }
  };

  const fetchHistory = async (petId) => {
    try {
      // GET /pets/:id já inclui healthRecords + documents (pets.controller.ts)
      // e owner + diaryEntries (pets.service.ts findOne)
      const petRes = await api.get(`/pets/${petId}`);
      const fullPet = petRes.data;
      const records = fullPet?.healthRecords || [];
      const diary   = fullPet?.diaryEntries  || [];

      // Última consulta veterinária
      const consultations = records
        .filter(r => r.type === 'CONSULTATION')
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastConsult = consultations[0];

      // Tratamentos em andamento
      const ongoingTreatments = records
        .filter(r => r.type === 'TREATMENT' && r.ongoing)
        .map(r => r.description || r.notes);

      // Vacinas recentes
      const vaccines = records
        .filter(r => r.type === 'VACCINE')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3)
        .map(r => ({ name: r.vaccine || r.description, date: new Date(r.date).toLocaleDateString('pt-BR') }));

      // Medicamentos ativos
      const medications = records
        .filter(r => r.type === 'MEDICATION' || r.type === 'MEDICINE')
        .filter(r => r.ongoing || r.active)
        .map(r => r.name || r.description);

      // Alergias e condições crónicas
      const allergies = fullPet?.allergies || [];
      const chronicConditions = records
        .filter(r => r.type === 'CHRONIC' || r.tags?.includes('crônico'))
        .map(r => r.description);

      // Peso atual e histórico
      const weightHistory = records
        .filter(r => r.weight)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(r => ({ w: r.weight, date: new Date(r.date).toLocaleDateString('pt-BR') }));

      // Monta sumário clínico rico para enviar ao backend /igent/analyze
      const clinicalContext = {
        petId,
        name: fullPet?.name,
        breed: fullPet?.breed,
        gender: fullPet?.gender,
        birthDate: fullPet?.birthDate,
        ageYears: fullPet?.ageYears,
        ageMonths: fullPet?.ageMonths,
        neutered: fullPet?.neutered,
        weight: fullPet?.weight,
        healthSummary: fullPet?.healthSummary,
        personality: fullPet?.personality || [],
        foodType: fullPet?.foodType || [],
        foodBrand: fullPet?.foodBrand,
        activityLevel: fullPet?.activityLevel,
        streetAccess: fullPet?.streetAccess,
        ongoingTreatments,
        medications,
        vaccines,
        allergies,
        chronicConditions,
        lastConsultDate: lastConsult ? new Date(lastConsult.date).toLocaleDateString('pt-BR') : null,
        lastConsultVet: lastConsult?.veterinarian,
        lastConsultNotes: lastConsult?.notes,
        totalConsults: consultations.length,
        weightHistory,
        diaryCount: diary.length,
        traumaHistory: fullPet?.traumaHistory,
        behaviorIssues: fullPet?.behaviorIssues,
        // ── Contexto memorial / óbito ──────────────────────────────────────
        // Permite à IA entender se este gato faleceu e por qual causa,
        // cruzando com outros gatos da mesma raça para IA preditiva populacional
        isMemorial: fullPet?.isMemorial || false,
        isArchived: fullPet?.isArchived || false,
        deathDate: fullPet?.deathDate || null,
        deathCause: fullPet?.deathCause || null, // campo adicionado no EditProfileModal
      };

      return {
        records,
        clinicalContext,
        lastConsult: lastConsult ? new Date(lastConsult.date).toLocaleDateString('pt-BR') : null,
        lastVet: lastConsult?.veterinarian || 'Clínica Veterinária',
        ownerName: fullPet?.owner?.name?.split(' ')[0] || '',
        ownerFullName: fullPet?.owner?.name || '',
        ongoingTreatments,
        medications,
        vaccines,
      };
    } catch (err) {
      console.error('fetchHistory error:', err);
      return {
        records: [], clinicalContext: {}, lastConsult: null,
        lastVet: 'Clínica Veterinária', ownerName: '', ownerFullName: '',
        ongoingTreatments: [], medications: [], vaccines: [],
      };
    }
  };

  // ── "Mais dúvidas?" — injeta o card e ativa bloqueio ──────────────────────
  const buildConsultationSummary = useCallback(() => {
    const userText = messages
      .filter(m => m.sender === 'user' && m.text)
      .map(m => m.text)
      .join(' ')
      .toLowerCase();

    const findings = [];
    if (/secre[cç][aã]o transparente|secrecao transparente/.test(userText)) findings.push('secreção transparente relatada');
    if (/sem dor|nao sente dor|n[aã]o sente dor|aberto/.test(userText)) findings.push('sem dor aparente segundo o tutor');
    if (/semicerrado/.test(userText)) findings.push('olho semicerrado em algum momento');
    if (/fechado/.test(userText)) findings.push('olho fechado ou quase fechado em algum momento');
    if (/esbranqui|opac|azulad/.test(userText)) findings.push('opacidade/esbranquiçamento observado');
    if (/herpes/.test(userText)) findings.push('histórico ou suspeita prévia de herpes ocular');
    if (/vigamox|col[ií]rio|tratamento/.test(userText)) findings.push('tratamento ocular recente citado');
    if (/agress|miando|fugir|territ|marc|urina fora|caixa/.test(userText)) findings.push('mudança comportamental relatada pelo tutor');
    if (/co[cç]a|lamb|ferida|crosta|falha de pelo|pus|les[aã]o/.test(userText)) findings.push('alteração de pele/pelo descrita no atendimento');
    if (/vomit|diarre|fezes|apetite|nao quer comer|n[aã]o quer comer/.test(userText)) findings.push('sinal digestivo ou alteração de apetite relatado');
    if (/xixi|urina|sangue|faz for[cç]a|pouco xixi/.test(userText)) findings.push('sinal urinário ou alteração de caixa de areia relatado');

    const breedNote = cat?.breed && cat.breed !== 'SRD'
      ? `${cat.name} é ${cat.breed}; considerar predisposições da raça sem fechar diagnóstico por isso.`
      : `${cat?.name} é SRD; priorizar sinais atuais e histórico individual.`;

    const summaryByTheme = {
      behavior: {
        preDiagnosis: `Quadro compatível com alteração comportamental que precisa ser lida junto com rotina, ambiente, dor/desconforto físico, castração e gatilhos recentes. Não é diagnóstico fechado; é uma triagem para organizar os próximos passos.`,
        vetFocus: [
          'avaliar dor, desconforto físico e possíveis causas clínicas por trás do comportamento',
          'revisar castração, rotina, enriquecimento ambiental e caixa de areia',
          'mapear gatilhos: pessoas, animais, mudanças em casa, horários e território',
          'definir se o caso é comportamental, clínico ou misto',
        ],
      },
      skin: {
        preDiagnosis: `Quadro compatível com alteração dermatológica em triagem. Coceira, lambedura, feridas, crostas, secreção, parasitas, alergias e irritações entram no radar, mas precisam de exame físico quando persistem ou pioram.`,
        vetFocus: [
          'examinar pele, pelo e região afetada presencialmente',
          'avaliar parasitas, alergia, infecção, trauma ou lambedura por estresse/dor',
          'considerar citologia, raspado ou cultura se houver secreção, crosta ou recorrência',
          'revisar produtos, ração, areia, antipulgas e contato com outros animais',
        ],
      },
      eyes: {
        preDiagnosis: `Quadro compatível com alteração ocular que merece avaliação presencial, especialmente se houver dor, olho fechado, secreção intensa, opacidade ou piora. Diferenciais no radar incluem irritação/conjuntivite, lesão de córnea, ceratite e outras alterações oculares.`,
        vetFocus: [
          'examinar córnea e conjuntiva presencialmente',
          'avaliar necessidade de fluoresceína e pressão ocular',
          'revisar secreção, dor, opacidade, trauma e resposta a tratamentos anteriores',
          'checar sinais respiratórios associados',
        ],
      },
      urinary: {
        preDiagnosis: `Quadro urinário precisa de atenção porque esforço para urinar, pouco xixi, sangue ou idas repetidas à caixa podem ser urgência, principalmente em machos. A triagem ajuda a separar marcação/ambiente de dor urinária.`,
        vetFocus: [
          'avaliar se há obstrução, dor, sangue ou esforço para urinar',
          'revisar frequência de idas à caixa, volume de urina e ingestão de água',
          'considerar exame de urina e avaliação presencial se sinais persistirem',
          'checar estresse, caixa de areia, marcação territorial e rotina',
        ],
      },
      digestion: {
        preDiagnosis: `Quadro digestivo em triagem. Vômito, diarreia, alteração de apetite, hidratação e exposição a alimentos/produtos diferentes ajudam a definir se pode monitorar ou se precisa de atendimento rápido.`,
        vetFocus: [
          'avaliar hidratação, frequência de vômitos/diarreia e presença de sangue',
          'revisar apetite, ingestão de água e energia',
          'investigar mudança alimentar, plantas, produtos, vermífugo e contato com outros animais',
          'definir necessidade de exame físico e suporte clínico',
        ],
      },
      ears: {
        preDiagnosis: `Quadro compatível com alteração auricular em triagem. Coceira, dor, mau cheiro, cera escura, feridas ou cabeça inclinada podem indicar inflamação, ácaros, infecção ou desconforto que precisa ser avaliado.`,
        vetFocus: [
          'examinar ouvido externo e canal auditivo',
          'avaliar dor, secreção, odor, feridas e equilíbrio',
          'considerar citologia auricular quando houver secreção ou recorrência',
          'revisar contato com outros animais e histórico de coceira',
        ],
      },
      mobility: {
        preDiagnosis: `Quadro de mobilidade em triagem. Mancada, dor ao tocar, queda, dificuldade para pular ou apatia podem indicar trauma, dor articular, ferida ou outro desconforto que precisa de avaliação conforme intensidade.`,
        vetFocus: [
          'avaliar dor, apoio da pata, inchaço, ferida e amplitude de movimento',
          'investigar queda, briga, trauma ou início súbito',
          'checar apetite, caixa de areia e mobilidade dentro de casa',
          'definir necessidade de imagem ou analgesia prescrita por veterinário',
        ],
      },
      other: {
        preDiagnosis: `Triagem inicial registrada. O quadro ainda precisa ser interpretado com sinais atuais, evolução, apetite, hidratação, caixa de areia e comportamento geral para orientar os próximos passos com mais segurança.`,
        vetFocus: [
          'revisar início, evolução e intensidade dos sinais',
          'checar apetite, água, xixi, cocô, energia e dor aparente',
          'avaliar red flags que indiquem atendimento presencial rápido',
          'organizar histórico para o veterinário presencial',
        ],
      },
    };
    const themeSummary = summaryByTheme[symptom?.id] || summaryByTheme.other;

    return {
      title: `Pré-orientação para consulta presencial de ${cat?.name}`,
      symptom: symptom?.label || 'dúvida clínica',
      findings: findings.length ? findings : ['sinais relatados no chat ainda precisam ser detalhados na consulta'],
      preDiagnosis: themeSummary.preDiagnosis,
      vetFocus: themeSummary.vetFocus,
      breedNote,
    };
  }, [cat, messages, symptom]);

  const askMoreQuestions = useCallback(() => {
    const alreadyWaiting = messages.some(m => m.type === 'ask_more_questions' && !m.answered);
    if (alreadyWaiting || sessionClosed || saved) return;
    const msgId = Date.now() + Math.random();
    setAwaitingMoreQ(true);
    SFX.receive();
    setMessages(prev => {
      return [...prev, {
      id: msgId,
      sender: 'bot',
      type: 'ask_more_questions',
      catName: cat.name,
      answered: false,
      onYes: () => {
        const continuation = buildTutorContextPrompt({
          cat,
          ownerName: messages.find(m => m.type === 'greeting')?.ownerName || '',
          symptom,
        });
        setAwaitingMoreQ(false);
        setMessages(prev => [
          ...prev.map(m => m.id === msgId
            ? { ...m, answered: true, answeredYes: true, onYes: null, onNo: null }
            : m),
          {
            id: Date.now() + Math.random(),
            sender: 'bot',
            type: 'text',
            text: `${cat.name} ainda merece esse cuidado com calma. Me escolha uma opção abaixo ou me conte com suas palavras o próximo detalhe que quer investigar.`,
          },
          {
            id: Date.now() + Math.random(),
            sender: 'bot',
            type: 'quick_replies',
            replies: continuation.replies,
          },
        ]);
        setTimeout(() => inputRef.current?.focus(), 200);
        SFX.select();
      },
      onNo: () => {
        const summary = buildConsultationSummary();
        setAwaitingMoreQ(false);
        setSessionClosed(true);    // encerra — mostra botão salvar
        setMessages(prev => [
          ...prev.map(m => m.id === msgId
            ? { ...m, answered: true, answeredYes: false, onYes: null, onNo: null }
            : m),
          ...(reportData ? [{ id: Date.now() + Math.random(), sender: 'bot', type: 'report', data: reportData }] : []),
          { id: Date.now() + Math.random(), sender: 'bot', type: 'consultation_summary', ...summary },
        ]);
        SFX.confirm();
      },
    }];
    });
  }, [cat, messages, symptom, buildConsultationSummary, reportData, saved, sessionClosed]);

  // ── Enviar mensagem (texto + opcional mídia) ─────────────────────────────
  const buildTriageQuickReplies = (botText = '') => {
    const lower = `${botText} ${symptom?.label || ''}`.toLowerCase();
    if (!/[?]/.test(botText) && !/(secre|fechado|semicerrado|dor|opacidade|les[aã]o|ferida)/i.test(botText)) return [];

    const answered = messages
      .filter(m => m.sender === 'user' && m.text)
      .map(m => m.text)
      .join(' ')
      .toLowerCase();
    const hasAnswered = (pattern) => pattern.test(answered);

    const replies = [];
    const push = (label, text = label) => replies.push({ label, text });

    const normalizedLower = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/(comport|agress|miando|fugir|territ|demarc|marcacao|urina fora|caixa)/i.test(normalizedLower)) {
      push('Agressividade', `${cat?.name || 'Meu gato'} esta mostrando agressividade.`);
      push('Miando muito', `${cat?.name || 'Meu gato'} esta miando muito.`);
      push('Tentando fugir', `${cat?.name || 'Meu gato'} esta tentando fugir.`);
      push('Marcacao de territorio', `${cat?.name || 'Meu gato'} esta marcando territorio.`);
      push('Urinando fora da caixa', `${cat?.name || 'Meu gato'} esta urinando fora da caixa.`);
      push('Vou explicar melhor', 'Vou explicar melhor com minhas palavras.');
      return replies.slice(0, 7);
    }

    if (/(olho|ocular|cornea|secre|opacidade|fechado|semicerrado)/i.test(normalizedLower)) {
      const knowsPain = hasAnswered(/sem dor|nao sente dor|n[aã]o sente dor|semicerrado|fechado|olho esta aberto|olho est[aá] aberto/);
      const knowsSecretion = hasAnswered(/secre[cç][aã]o|secrecao|sem secre|transparente|amarela|esverdeada/);
      const knowsSide = hasAnswered(/um olho|olho direito|olho esquerdo|os dois olhos|ambos/);
      const knowsFrequency = hasAnswered(/tempo todo|constante|vai e volta|momentos|intermitente/);

      if (!knowsPain) {
        push('Olho aberto, sem dor aparente', 'O olho esta aberto e ela aparentemente nao sente dor.');
        push('Olho semicerrado', 'O olho esta semicerrado.');
        push('Olho fechado', 'O olho esta quase totalmente fechado.');
      }
      if (!knowsSecretion) {
        push('Sem secrecao', 'Nao percebi secrecao.');
        push('Secrecao transparente', 'Tem uma secrecao transparente.');
        push('Secrecao amarela/esverdeada', 'Tem secrecao amarela ou esverdeada.');
      } else {
        if (!knowsFrequency) {
          push('Secrecao constante', 'A secrecao aparece praticamente o tempo todo.');
          push('Vai e volta', 'A secrecao aparece em alguns momentos e depois reduz.');
        }
        push('Pouca quantidade', 'A secrecao e em pouca quantidade.');
        push('Muita quantidade', 'A secrecao esta em quantidade moderada ou alta.');
      }
      if (!knowsSide) {
        push('So um olho', 'A alteracao aparece em apenas um olho.');
        push('Os dois olhos', 'A alteracao aparece nos dois olhos.');
      }
      if (!hasAnswered(/vermelh|inchad|piscando|luz/)) {
        push('Tem vermelhidao', 'Tambem percebo vermelhidao ou inchaco.');
        push('Incomoda com luz', 'Ela parece incomodada com luz ou pisca bastante.');
      }
      push('Vou descrever melhor', 'Vou descrever melhor com minhas palavras.');
      return replies.slice(0, 7);
    }

    if (/(olho|ocular|c[oó]rnea|secre|opacidade|fechado|semicerrado)/i.test(lower)) {
      push('Olho aberto, sem dor aparente', 'O olho esta aberto e ela aparentemente nao sente dor.');
      push('Olho semicerrado', 'O olho esta semicerrado.');
      push('Olho fechado', 'O olho esta quase totalmente fechado.');
      push('Sem secrecao', 'Nao percebi secrecao.');
      push('Secrecao transparente', 'Tem uma secrecao transparente.');
      push('Secrecao amarela/esverdeada', 'Tem secrecao amarela ou esverdeada.');
    } else if (/(pele|les[aã]o|ferida|co[cç]a|crost|sangr|pus)/i.test(lower)) {
      push('Nao parece doer', 'A lesao nao parece dolorida ao toque leve.');
      push('Parece dolorido', 'Parece dolorido quando encosta.');
      push('Tem coceira', 'Ela esta cocando ou lambendo bastante.');
      push('Tem secrecao/pus', 'Notei secrecao ou pus na lesao.');
    } else if (/(vomit|diarre|fezes|apetite|comendo|bebendo)/i.test(lower)) {
      push('Esta comendo', 'Ela ainda esta comendo.');
      push('Nao quer comer', 'Ela nao quer comer.');
      push('Vomitou uma vez', 'Vomitou uma vez nas ultimas 24 horas.');
      push('Vomitou varias vezes', 'Vomitou varias vezes nas ultimas 24 horas.');
    }

    push('Vou descrever melhor', 'Vou descrever melhor com minhas palavras.');
    return replies.slice(0, 7);
  };

  const handleSend = async (forcedText = null) => {
    const text = (forcedText ?? input).trim();
    if (!text && !mediaFile) return;
    if (awaitingMoreQ || sessionClosed || credits?.blocked) return; // bloqueado

    if (!forcedText) setInput('');
    SFX.send();

    // Monta mensagem do usuário
    const userMsg = { sender: 'user', type: 'text', text, media: mediaFile || null };
    setMediaFile(null);
    addMsg(userMsg);

    setIsTyping(true);
    try {
      const hasVisualMedia = userMsg.media?.type === 'image' && userMsg.media?.url;
      await syncIgentAlmanacFromApi(IGENT_ALMANAC_SCOPE);
      if (hasVisualMedia) await syncIgentAlmanacFromApi(IGENT_VISUAL_ATLAS_SCOPE);
      const visualAtlasContext = hasVisualMedia
        ? buildIgentAlmanacContext({
            symptom: `${symptom.label} ${text}`,
            breed: cat.breed,
            visualFindings: text,
            scope: IGENT_VISUAL_ATLAS_SCOPE,
            limit: 6,
          })
        : [];
      const visualReferenceImages = visualAtlasContext
        .flatMap((section) => (section.referenceImages || []).map((image) => ({
          ...image,
          patternTitle: section.title,
        })))
        .filter((image) => image?.url)
        .slice(0, 6);
      const payload = {
        petId: cat.id,
        message: text,
        symptom: symptom.label,
        symptomId: symptom.id,
        clinicalContext: {
          ...historyCtx,
          adminAlmanacContext: buildIgentAlmanacContext({ symptom: symptom.label, breed: cat.breed, scope: IGENT_ALMANAC_SCOPE }),
          adminVisualAtlasContext: visualAtlasContext,
        },
        conversationContext: messages
          .filter(m => (m.sender === 'user' || m.sender === 'bot') && m.text)
          .slice(-8)
          .map(m => ({ sender: m.sender, type: m.type, text: m.text })),
      };
      // Se há imagem, envia como base64
      if (hasVisualMedia) {
        const match = userMsg.media.url.match(/^data:([^;]+);base64,(.+)$/);
        payload.imageBase64 = match?.[2] || userMsg.media.url.split(',')[1];
        payload.imageMimeType = match?.[1] || userMsg.media.mimeType || 'image/jpeg';
        payload.referenceImages = visualReferenceImages;
        payload.imageContext = 'Imagem enviada pelo tutor para análise visual';
      }
      if (userMsg.media?.type === 'audio') {
        payload.hasAudio = true;
        payload.audioTranscript = userMsg.media?.transcript || '[áudio enviado]';
      }

      const res = await api.post('/igent/chat', payload);
      setIsTyping(false);

      if (res.data.blocked) {
        setCredits(res.data);
        return;
      }
      if (res.data.credits) setCredits(res.data.credits);

      const botText = res.data.text;
      addMsg({ sender: 'bot', type: 'text', text: botText });
      const quickReplies = buildTriageQuickReplies(botText);
      if (quickReplies.length) {
        addMsg({ sender: 'bot', type: 'quick_replies', replies: quickReplies });
      }

      // Depois de cada resposta útil, oferece um fechamento humano:
      // continuar investigando ou encerrar salvando o prontuário.
      if (consultDone) {
        await new Promise(r => setTimeout(r, 800));
        askMoreQuestions();
      }
    } catch (err) {
      console.warn('[iGentVet] falha no chat:', err?.response?.status, err?.response?.data || err?.message);
      setIsTyping(false);
      SFX.error();
      addMsg({
        sender: 'bot',
        type: 'text',
        text: userMsg.media?.type === 'image'
          ? 'Nao consegui analisar a foto agora. Pode tentar reenviar a imagem ou me descrever o que voce percebeu nela?'
          : 'Desculpe, a conexao oscilou. Pode repetir?',
      });
    }
  };

  // ── Captura de foto/imagem ───────────────────────────────────────────────
  const prepareImageForVision = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          url: canvas.toDataURL('image/jpeg', 0.86),
          mimeType: 'image/jpeg',
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const prepared = await prepareImageForVision(file);
      setMediaFile({ type: 'image', url: prepared.url, mimeType: prepared.mimeType, file, name: file.name });
      SFX.select();
    } catch (err) {
      console.warn('[iGentVet] falha ao preparar imagem:', err);
      SFX.error();
    }
    e.target.value = '';
  };

  // ── Gravar áudio ────────────────────────────────────────────────────────
  const toggleRecording = async () => {
    if (recording) {
      mediaRecRef.current?.stop();
      setRecording(false);
      SFX.select();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setMediaFile({ type: 'audio', url, name: 'Áudio gravado', blob });
        stream.getTracks().forEach(t => t.stop());
        SFX.confirm();
      };
      mediaRecRef.current = rec;
      rec.start();
      setRecording(true);
      SFX.select();
    } catch {
      addMsg({ sender: 'bot', type: 'text', text: '⚠️ Permissão de microfone negada.' });
    }
  };

  const buildReportHtml = (report) => {
    const isUrgentStr = report.consultation.isUrgent ? '🔴 URGENTE' : '🟢 Monitoramento';
    const careList = (report.consultation.care || []).map(c => `<li style="margin:4px 0">${c}</li>`).join('');
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Laudo IA iGentVet — ${report.pet?.name}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #222; }
  h1 { color: #8B4AFF; font-size: 22px; margin-bottom: 4px; }
  .badge { display:inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${report.consultation.isUrgent ? '#fee2e2' : '#dcfce7'}; color: ${report.consultation.isUrgent ? '#b91c1c' : '#15803d'}; }
  .section { margin-top: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
  .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #9ca3af; letter-spacing: .1em; margin-bottom: 6px; }
  .footer { margin-top: 32px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
</style>
</head>
<body>
<h1>iGentVet — Laudo da IA</h1>
<p style="color:#6b7280;font-size:13px">${report.reportId || ''} · ${report.consultation.date} às ${report.consultation.time}</p>
<div class="section">
  <div class="label">Paciente</div>
  <b>${report.pet?.name}</b> · ${report.pet?.breed || 'SRD'} · ${report.pet?.gender === 'FEMALE' ? 'Fêmea' : 'Macho'} · ${report.pet?.ageYears || '?'} anos${report.pet?.weight ? ' · ' + report.pet.weight + 'kg' : ''}${report.pet?.neutered ? ' · Castrado(a)' : ''}
</div>
<div class="section">
  <div class="label">Consulta</div>
  <b>Sintoma:</b> ${report.consultation.symptom}<br/>
  <span class="badge">${isUrgentStr}</span>
</div>
<div class="section">
  <div class="label">Análise da IA</div>
  ${report.consultation.analysisText}
</div>
<div class="section">
  <div class="label">Recomendações</div>
  <ul style="margin:0;padding-left:20px">${careList}</ul>
</div>
${report.consultation.ownerResponse ? '<div class="section"><div class="label">Resposta do Tutor</div>' + report.consultation.ownerResponse + '</div>' : ''}
<div class="footer">
  Gerado por iGentVet IA — Gatedo · Este laudo é orientativo e não substitui consulta veterinária presencial.
</div>
</body></html>`;
  };

  const buildReportPdfDataUrl = async (report) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 44;
    let y = 48;
    const addPageIfNeeded = (height = 40) => {
      if (y + height > 780) {
        doc.addPage();
        y = 48;
      }
    };
    const line = (text, size = 10, color = '#374151', bold = false, maxWidth = pageWidth - margin * 2) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(color);
      const parts = doc.splitTextToSize(String(text || '-').replace(/\s+/g, ' ').trim(), maxWidth);
      parts.forEach((part) => {
        addPageIfNeeded(size + 8);
        doc.text(part, margin, y);
        y += size + 6;
      });
    };
    const section = (title) => {
      y += 10;
      doc.setFillColor(244, 243, 255);
      doc.roundedRect(margin, y - 15, pageWidth - margin * 2, 28, 8, 8, 'F');
      line(title, 10, '#8B4AFF', true);
      y += 4;
    };

    const qrValue = report.shareUrl || `${window.location.origin}/cat/${cat?.id || ''}#documents`;
    const [logoDataUrl, qrDataUrl] = await Promise.all([
      urlToDataUrl(brandAssets.igentvetWordmark).catch(() => null),
      urlToDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrValue)}&bgcolor=ffffff&color=2D2657&margin=8&format=png&ecc=H`).catch(() => null),
    ]);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 96, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, 96, pageWidth - margin, 96);
    if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', margin, 26, 92, 32);
    doc.setTextColor('#2D2657');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Laudo clinico iGentVet', margin + 112, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#6B7280');
    doc.text('Pre-triagem educativa para consulta presencial', margin + 112, 60);
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 56, 22, 56, 56);
      doc.setFontSize(7);
      doc.setTextColor('#8B4AFF');
      doc.text('QR do prontuario', pageWidth - margin - 58, 86);
    }
    y = 124;

    section('Paciente');
    line(`${report.pet?.name} | ${report.pet?.breed || 'SRD'} | ${report.pet?.gender === 'FEMALE' ? 'Femea' : 'Macho'} | ${report.pet?.ageYears || '?'} anos${report.pet?.weight ? ` | ${report.pet.weight}kg` : ''}${report.pet?.neutered ? ' | Castrado(a)' : ''}`);

    section('Consulta');
    line(`Data: ${report.consultation.date} as ${report.consultation.time}`, 10);
    line(`Sintoma: ${report.consultation.symptom}`, 10, '#111827', true);
    line(`Status: ${report.consultation.isUrgent ? 'URGENTE' : 'Monitoramento orientativo'}`, 10, report.consultation.isUrgent ? '#B91C1C' : '#15803D', true);

    section('Analise iGentVet');
    line(report.consultation.analysisText, 10);

    section('Respostas do tutor e triagem');
    line(report.consultation.ownerResponse || 'Sem resposta adicional registrada.', 10);

    section('Recomendacoes e pontos para o veterinario');
    (report.consultation.care || []).forEach((item) => line(`- ${item}`, 10));

    if (report.visualAttachments?.length) {
      section('Imagem enviada pelo tutor');
      report.visualAttachments.slice(0, 2).forEach((image, index) => {
        addPageIfNeeded(190);
        line(image.label || `Imagem ${index + 1}`, 9, '#6B7280', true);
        try {
          doc.addImage(image.url, 'JPEG', margin, y, 180, 135);
          y += 148;
        } catch {
          line('Imagem anexada ao atendimento, mas nao foi possivel inserir a pre-visualizacao no PDF.', 9, '#9CA3AF');
        }
      });
    }

    line('Este documento nao substitui consulta veterinaria presencial, exame fisico ou exames complementares.', 9, '#9CA3AF');

    return doc.output('datauristring');
  };

  // Salva histórico no perfil do gato + grava IgentSession para IA preditiva
  const handleSaveHistory = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      const reportMsg = messages.find(m => m.type === 'report');
      const analysisMsg = messages.find(m => m.type === 'analysis');
      const greetingMsg = messages.find(m => m.type === 'greeting');

      // Captura todas as respostas do tutor no chat para contexto
      const tutorResponses = messages
        .filter(m => m.sender === 'user' && m.type === 'text')
        .map(m => m.text);
      const visualAttachments = messages
        .filter(m => m.sender === 'user' && m.media?.type === 'image' && m.media?.url)
        .map((m, index) => ({
          url: m.media.url,
          label: m.media.name || `Imagem enviada ${index + 1}`,
          note: cleanPlainText(m.text),
        }));

      // 1. Grava no health-records (prontuário padrão)
      await api.post('/health-records', {
        petId: cat.id,
        title: `iGentVet — ${symptom.label}`,   // campo obrigatório no schema
        type: 'IACONSULT',
        date: new Date().toISOString(),
        notes: `[iGentVet] Sintoma: ${symptom.label}. ${reportMsg?.data?.analysisText || ''}`,
        recommendations: reportMsg?.data?.care || [],
        isUrgent: reportMsg?.data?.isUrgent || false,
        source: 'AI',
      });

      // 2. Grava IgentSession — não-bloqueante (falha silenciosa se endpoint não existir ainda)
      api.post('/igent/sessions', {
        petId: cat.id,
        symptomId: symptom.id,
        symptomLabel: symptom.label,
        isUrgent: reportMsg?.data?.isUrgent || false,
        analysisText: analysisMsg?.text || reportMsg?.data?.analysisText || '',
        recommendations: reportMsg?.data?.care || [],
        ownerResponse: tutorResponses.join(' | '),
        severity: reportMsg?.data?.isUrgent ? 'HIGH' : 'LOW',
        // clinicalSnapshot: foto do estado do gato NESTE MOMENTO
        // fundamental para IA comparar evolução ao longo do tempo
        clinicalSnapshot: {
          name: cat.name,
          breed: cat.breed,
          gender: cat.gender,
          ageYears: cat.ageYears,
          ageMonths: cat.ageMonths,
          weight: cat.weight,
          neutered: cat.neutered,
          healthSummary: cat.healthSummary,
          personality: cat.personality,
          foodType: cat.foodType,
          activityLevel: cat.activityLevel,
          streetAccess: cat.streetAccess,
          totalConsults: greetingMsg?.recordCount || 0,
          recordedAt: new Date().toISOString(),
        },
      }).catch(e => console.warn('[iGentVet] session nao salva (ignorado):', e?.response?.status));

      setSaved(true);
      touch('success');

      // Busca dados do prontuário para disponibilizar download
      try {
        const previewReport = {
          reportId: `IGV-PRE-${Date.now()}`,
          pet: {
            name: cat?.name,
            breed: cat?.breed || 'SRD',
            gender: cat?.gender,
            ageYears: cat?.ageYears,
            weight: cat?.weight,
            neutered: cat?.neutered,
          },
          consultation: {
            date: new Date().toLocaleDateString('pt-BR'),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            symptom: symptom.label,
            isUrgent: reportMsg?.data?.isUrgent || false,
            analysisText: reportMsg?.data?.analysisText || analysisMsg?.text || '',
            care: reportMsg?.data?.care || [],
            ownerResponse: tutorResponses.join(' | '),
          },
          shareUrl: `${window.location.origin}/cat/${cat.id}#documents`,
          visualAttachments,
        };

        const pdfBase64 = await buildReportPdfDataUrl(previewReport);

        const reportRes = await api.post('/igent/report', {
          petId: cat.id,
          symptomLabel: symptom.label,
          analysisText: reportMsg?.data?.analysisText || '',
          care: reportMsg?.data?.care || [],
          isUrgent: reportMsg?.data?.isUrgent || false,
          ownerResponse: tutorResponses.join(' | '),
          pdfBase64,
          pdfFilename: `prontuario-igentvet-${cat?.name?.toLowerCase().replace(/\s+/g, '-') || 'gato'}-${new Date().toISOString().split('T')[0]}.pdf`,
          pdfMimeType: 'application/pdf',
          saveToDocuments: true,
        });
        setReportData(prev => ({ ...prev, _report: reportRes.data }));
      } catch (e) {
        console.warn('Laudo da IA não gerado/salvo:', e);
      }

      addMsg({
        sender: 'bot', type: 'saved_confirm',
        catName: cat.name,
        ownerName: messages.find(m => m.type === 'greeting')?.ownerName || '',
        consultCount: (messages.find(m => m.type === 'greeting')?.recordCount || 0) + 1,
        gender: cat.gender,
      });
      addMsg({
        sender: 'bot',
        type: 'feedback_rating',
        catName: cat.name,
        symptomLabel: symptom.label,
      });
    } catch (e) {
      console.error(e);
      addMsg({ sender: 'bot', type: 'text', text: '⚠️ Não consegui salvar no histórico agora. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  // Download laudo da IA como HTML
  const downloadProntuario = (report) => {
    if (report?.document?.fileUrl) {
      window.open(report.document.fileUrl, '_blank', 'noopener,noreferrer');
      touch('success');
      return;
    }
    const html = buildReportHtml(report);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laudo-ia-igentvet-${report.pet?.name?.toLowerCase().replace(/\s/g,'-')}-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    touch('success');
  };

  const handleFeedback = async (feedback) => {
    if (feedbackSent) return;
    const payload = {
      petId: cat.id,
      catName: cat.name,
      symptomId: symptom.id,
      symptomLabel: symptom.label,
      rating: feedback.rating,
      label: feedback.label,
      comment: feedback.comment || '',
      createdAt: new Date().toISOString(),
    };
    setFeedbackSent(true);
    try {
      await api.post('/igent/feedback', payload);
    } catch {
      try {
        const key = 'gatedo_igent_feedback_queue_v1';
        const current = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([...current, payload].slice(-50)));
      } catch {}
    }
    addMsg({
      sender: 'bot',
      type: 'text',
      text: `Obrigado. Essa nota ajuda a melhorar o atendimento do iGentVet para ${cat.name}.`,
    });
  };

  // Agenda notificação nativa do dispositivo para medicação
  const handleScheduleNotification = async ({ hours, medName, catName, ownerName }) => {
    try {
      // iOS Safari não suporta Notification API — sai silenciosamente
      if (typeof Notification === 'undefined') {
        console.warn('[iGentVet] Notifications não suportadas neste dispositivo');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifGranted(true);
        setTimeout(() => {
          new Notification(`💊 Medicação de ${catName}`, {
            body: `${ownerName ? ownerName + ', é' : 'É'} hora da dose de ${medName}!`,
            icon: brandAssets.igentvetWordmark,
          });
        }, hours * 60 * 60 * 1000);
        touch('success');
      }
    } catch (e) {
      console.warn('Notificação não suportada:', e);
    }
  };

  const shareWhatsApp = (data) => {
    const text = `*Relatório iGentVet - ${cat.name}*\n\nSintoma: ${data.symptom}\nStatus: ${data.isUrgent ? '🔴 URGENTE' : '🟢 Monitorar'}\n\nRecomendação: ${data.care?.[0] || '-'}\n\n_(Gerado pelo Gatedo App)_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col bg-[#F4F3FF] max-w-[920px] w-full mx-auto"
      style={{ height: '100svh' }}
    >
      {/* Header */}
      <div className="pt-10 pb-3 px-4 rounded-b-[32px] shadow-md z-30 shrink-0 relative"
        style={{ background: 'linear-gradient(180deg, #9F63FF 0%, #7E46E1 58%, #592BB6 100%)' }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <ChevronLeft size={22} className="text-white" />
          </button>
          <img src={brandAssets.igentvetWordmark} alt="iGentVet" className="h-6 object-contain" />
          <button
            onClick={() => navigate('/igent-vet/sobre')}
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
            aria-label="Sobre o iGentVet"
          >
            <HelpCircle size={20} className="text-white" />
          </button>
        </div>

        {/* Cat strip */}
        <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0"
            style={{ borderColor: C.accent }}>
            <img src={catAvatar(cat)} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm leading-none">{cat?.name}</p>
            <p className="text-white/50 text-[10px] font-bold">{cat?.breed || 'SRD'}</p>
          </div>
          {/* Loading / status */}
          <div className="flex flex-col items-end min-w-0 max-w-[140px]">
            <AnimatePresence mode="wait">
              {isTyping ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-end w-full">
                  <p className="text-[9px] font-black text-right leading-tight truncate w-full"
                    style={{ color: C.accent }}>{PHASES[phase]}</p>
                  <div className="mt-1 w-20 h-1 bg-white/15 rounded-full overflow-hidden">
                    <div className="neon-bar h-full w-10 rounded-full" style={{ background: C.accent }} />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-wider">Online</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Saldo de perguntas do mês */}
        {credits && credits.limit !== null && (
          <p className="text-center text-[9px] font-black uppercase tracking-[1.5px] mt-2"
            style={{ color: credits.blocked ? '#FFB4B4' : 'rgba(255,255,255,0.55)' }}>
            {credits.blocked
              ? 'Suas perguntas deste mês acabaram'
              : `Restam ${credits.remaining} de ${credits.limit} perguntas este mês`}
          </p>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 pb-[260px] smooth-scroll">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <MsgBubble
                msg={msg}
                cat={cat}
                onShare={shareWhatsApp}
                onSetMedAlert={(data) => setMedAlertModal({ ...data, hours: 8 })}
                onQuickReply={handleSend}
                onFeedback={handleFeedback}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {painOffer && !isTyping && (
          <OfferCard
            offer={painOffer}
            surface="PAIN_IGENT"
            petId={cat.id}
            onDismiss={() => setPainOffer(null)}
          />
        )}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white shadow-sm"
              style={{ background: C.purple }}>
              <img src={brandAssets.igentvetWordmark} className="w-full h-full object-contain p-0.5" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-300 dot1" />
                <div className="w-2 h-2 rounded-full bg-gray-300 dot2" />
                <div className="w-2 h-2 rounded-full bg-gray-300 dot3" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Botão download — após salvo */}
        {saved && reportData?._report && (
          <div className="text-center mt-3 mb-2 text-[11px] font-bold text-gray-400">Laudo da IA salvo nos documentos d{art(cat)} {cat.name}.</div>
        )}

        {saved && reportData?._report && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex justify-center py-1">
            <button onClick={() => downloadProntuario(reportData._report)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm border-2"
              style={{ borderColor: C.purple, color: C.purple, background: 'white' }}>
              <Download size={15} /> Baixar Laudo da IA
            </button>
          </motion.div>
        )}

        {/* Modal de alerta de medicação */}
        <AnimatePresence>
          {medAlertModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              onClick={() => setMedAlertModal(null)}
            >
              <motion.div
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#EDE7F6' }}>
                  <span className="text-2xl">💊</span>
                </div>
                <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Lembrete de Medicação
                </p>
                <h3 className="text-center font-black text-gray-800 text-base leading-snug mb-1">
                  {medAlertModal.ownerName || 'Tutor'}
                  <span className="text-gray-400 font-bold">, lembrete em </span>
                  <span style={{ color: C.purple }}>{medAlertModal.hours}h</span>
                </h3>
                <div className="bg-[#F4F3FF] rounded-2xl px-4 py-3 mb-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Medicamento</p>
                  <p className="text-sm font-bold text-gray-700">{medAlertModal.medName}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">para <span className="font-black" style={{ color: C.purple }}>{medAlertModal.catName}</span></p>
                </div>
                {!notifGranted && (
                  <p className="text-[10px] text-center text-orange-500 font-bold mb-3">
                    ⚠️ Ative as notificações para receber este alerta
                  </p>
                )}
                <button
                  onClick={() => {
                    handleScheduleNotification(medAlertModal);
                    setMedAlertModal(null);
                  }}
                  className="w-full py-4 rounded-[18px] font-black text-white text-sm shadow-lg mb-2"
                  style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
                  ✓ Ativar Lembrete
                </button>
                <button onClick={() => setMedAlertModal(null)}
                  className="w-full py-2 text-gray-400 font-bold text-xs">
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tela de saldo zerado — substitui o input, sem parecer erro ── */}
      {credits?.blocked && (
        <div className="fixed left-0 right-0 px-4 z-40"
          style={{ maxWidth: 'min(920px, 100vw)', margin: '0 auto', bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="bg-white rounded-[26px] p-5 shadow-2xl border border-gray-100">
            <p className="text-center text-2xl mb-1">🐾</p>
            <p className="text-center font-black text-gray-800 text-sm mb-1.5">
              Suas perguntas ao iGentVet deste mês acabaram
            </p>
            <p className="text-center text-[12px] font-medium text-gray-500 leading-relaxed mb-4">
              Cada resposta do iGentVet usa uma consulta de IA de verdade, com custo real — por isso existe um teto mensal.
              {creditsResetLabel && <> Ele renova em <b>{creditsResetLabel}</b>.</>}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { touch(); navigate('/clube'); }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-[18px] font-black text-sm text-white"
                style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
                <Sparkles size={16} /> Ver como ganhar mais GPTS
              </button>
              <button
                onClick={handleNotifyReset}
                disabled={notifyingReset || resetNotified}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-[18px] font-black text-sm"
                style={{ background: '#F4F3FF', color: C.purple }}>
                <Clock size={16} />
                {resetNotified ? 'Vamos te avisar!' : notifyingReset ? 'Só um momento...' : 'Avisar quando renovar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Input — hidden quando sessão encerrada ou sem saldo ── */}
      {!sessionClosed && !credits?.blocked && (
        <div className="fixed left-0 right-0 px-3 z-40"
          style={{ maxWidth: 'min(920px, 100vw)', margin: '0 auto', bottom: 'calc(132px + env(safe-area-inset-bottom, 0px))' }}>

          {/* Preview de mídia anexada */}
          <AnimatePresence>
            {mediaFile && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mb-2 flex items-center gap-2 bg-white rounded-2xl px-3 py-2 shadow border border-gray-100">
                {mediaFile.type === 'image'
                  ? <img src={mediaFile.url} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Mic size={18} className="text-purple-500" />
                    </div>
                }
                <span className="flex-1 text-xs font-bold text-gray-600 truncate">{mediaFile.name}</span>
                <button onClick={() => setMediaFile(null)}>
                  <X size={14} className="text-gray-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint aguardando resposta ao "mais dúvidas?" */}
          {awaitingMoreQ && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-[10px] font-bold text-gray-400 mb-2">
              ↑ Responda acima antes de continuar
            </motion.p>
          )}

          <div className="flex items-center gap-2"
            style={{ opacity: awaitingMoreQ ? 0.35 : 1, pointerEvents: awaitingMoreQ ? 'none' : 'auto' }}>

            {/* Botão foto */}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handleImageSelect} />
            <button onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-100 bg-white shadow-sm"
              style={{ color: mediaFile?.type === 'image' ? C.purple : '#D1D5DB' }}>
              <ImagePlus size={18} />
            </button>

            {/* Campo de texto */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center pr-1 pl-4">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isTyping && handleSend()}
                placeholder={recording ? '🔴 Gravando...' : 'Responda ao agente...'}
                className="flex-1 bg-transparent outline-none text-gray-700 text-sm py-3.5"
              />
              {/* Botão mic / stop */}
              <button onClick={toggleRecording}
                className="p-2 transition-colors"
                style={{ color: recording ? '#ef4444' : '#D1D5DB' }}>
                {recording ? <StopCircle size={18} /> : <Mic size={18} />}
              </button>
            </div>

            {/* Enviar */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleSend}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-colors flex-shrink-0"
              style={{ background: (input.trim() || mediaFile) ? C.purple : '#D1D5DB' }}>
              <Send size={18} className="ml-0.5" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Botão salvar — só após tutor dizer "não tenho mais dúvidas" */}
      {sessionClosed && !saved && (
        <div className="fixed left-0 right-0 px-4 z-40"
          style={{ maxWidth: 'min(920px, 100vw)', margin: '0 auto', bottom: 'calc(168px + env(safe-area-inset-bottom, 0px))' }}>
          <motion.div initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
            <p className="text-center text-[11px] font-bold text-gray-400 mb-2">
              Registrar esta consulta na ficha médica d{art(cat)} {cat.name}?
            </p>
            <button onClick={handleSaveHistory} disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-[22px] font-black text-base shadow-2xl"
              style={{ background: saving ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)`, color: 'white',
                boxShadow: `0 8px 32px ${C.purple}55` }}>
              {saving
                ? <span className="animate-pulse">Salvando...</span>
                : <><FileText size={18} /> Encerrar e salvar laudo</>
              }
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// ─── BOLHA DE MENSAGEM ────────────────────────────────────────────────────────
function MsgBubble({ msg, cat, onShare, onSetMedAlert, onQuickReply, onFeedback }) {
  const [triageAnswers, setTriageAnswers] = useState({});
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackChoice, setFeedbackChoice] = useState(null);

  const triageOptionsFor = (question = '', index = 0) => {
    if (msg?.symptomId) return getThemeTriageOptions(msg.symptomId, question, index);
    const normalized = String(question).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/(parte do corpo|onde|local|lesao|lesoes|afetado|localizacao)/.test(normalized)) {
      return ['Rosto/olhos', 'Orelhas', 'Barriga', 'Costas', 'Patas', 'Pescoco'];
    }
    if (/(cocando|lambendo|mordendo|coceira|prurido)/.test(normalized)) {
      return ['Nao percebi coceira', 'Coceira leve', 'Lambe bastante', 'Morde o local', 'Piora a noite'];
    }
    if (/(mudanca|racao|areia|produto|ambiente|novo animal|ultimos 30 dias)/.test(normalized)) {
      return ['Nada mudou', 'Troquei a racao', 'Troquei a areia', 'Produto novo em casa', 'Novo animal/pessoa', 'Mudanca de rotina'];
    }
    if (/(olho|secrecao|secre|cor|fechado|semicerrado)/.test(normalized)) {
      return ['Olho aberto', 'Olho semicerrado', 'Sem secrecao', 'Secrecao transparente', 'Secrecao amarela/esverdeada'];
    }
    if (/(come|comendo|apetite|agua|caixinha|urina|fezes)/.test(normalized)) {
      return ['Come normal', 'Comeu menos', 'Nao quer comer', 'Bebe agua normal', 'Usa caixinha normal', 'Mudou xixi/fezes'];
    }
    return ['Nao sei dizer', 'Sim', 'Nao', 'Vou descrever melhor'];
  };

  const selectTriageChoice = (question, option, index) => {
    setTriageAnswers(prev => ({
      ...prev,
      [index]: { question, option },
    }));
  };

  const sendTriageChoices = () => {
    const ordered = Object.entries(triageAnswers)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([index, item]) => `Pergunta ${Number(index) + 1}: ${item.question} Resposta: ${item.option}.`);
    if (ordered.length) onQuickReply?.(ordered.join(' '));
  };

  // Mensagem de texto do usuário — pode ter mídia anexa
  if (msg.sender === 'user' && msg.type === 'text') return (
    <div className="flex flex-col items-end gap-1 max-w-[85%]">
      {msg.media?.type === 'image' && (
        <img src={msg.media.url} className="w-40 h-32 object-cover rounded-2xl rounded-tr-sm border-2 border-white shadow-md" />
      )}
      {msg.media?.type === 'audio' && (
        <div className="flex items-center gap-2 bg-white rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm border border-gray-100">
          <Mic size={14} className="text-purple-400" />
          <audio src={msg.media.url} controls className="h-7 w-32" style={{ accentColor: C.purple }} />
        </div>
      )}
      {msg.text && (
        <div className="bg-[#8B4AFF] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm text-sm font-medium">
          {msg.text}
        </div>
      )}
    </div>
  );

  if (msg.type === 'symptom_tag') return (
    <div className="flex items-center gap-2 bg-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm border border-gray-100 max-w-[85%]">
      <span className="text-2xl">{msg.emoji}</span>
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Sintoma selecionado</p>
        <p className="font-black text-gray-800 text-sm">{msg.label}</p>
      </div>
    </div>
  );

  if (msg.type === 'greeting') return (
    <div className="w-full bg-white rounded-[20px] p-4 shadow-sm border border-indigo-50">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full overflow-hidden" style={{ background: C.purple }}>
          <img src={brandAssets.igentvetWordmark} className="w-full h-full object-contain p-0.5" />
        </div>
        <div>
          <p className="font-black text-gray-800 text-sm leading-none">iGentVet</p>
          <p className="text-[9px] text-gray-400 font-bold">Agente IA Veterinário</p>
        </div>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html:
          `Olá${msg.ownerName ? `, <b>${msg.ownerName}</b>` : ''}! Carreguei o prontuário d${art(cat)} <b>${msg.catName}</b>. ` +
          (msg.hasHistory
            ? `Encontrei <b>${msg.recordCount} registros</b>${msg.lastConsult ? ` — última consulta em <b>${msg.lastConsult}</b> (${msg.lastVet})` : ''}.`
            : 'Ainda não há registros anteriores. Vamos criar o primeiro agora.')
        }} />
      {/* Tratamentos em andamento */}
      {msg.ongoingTreatments?.length > 0 && (
        <div className="mt-2 p-2.5 bg-orange-50 rounded-xl border border-orange-100">
          <p className="text-[9px] font-black text-orange-500 uppercase tracking-wider mb-1">⚕ Tratamentos em andamento</p>
          {msg.ongoingTreatments.map((t, i) => (
            <p key={i} className="text-xs text-orange-700 font-bold leading-tight">• {t}</p>
          ))}
        </div>
      )}
      {/* Medicamentos ativos */}
      {msg.medications?.length > 0 && (
        <div className="mt-2 p-2.5 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider mb-1">💊 Medicamentos ativos</p>
          {msg.medications.map((m, i) => (
            <p key={i} className="text-xs text-blue-700 font-bold leading-tight">• {m}</p>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2 flex-wrap">
        <div className="history-chip rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <TrendingUp size={12} className="text-[#8B4AFF]" />
          <span className="text-[10px] font-black text-[#8B4AFF]">IA Preditiva</span>
        </div>
        <div className="history-chip rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-[#8B4AFF]" />
          <span className="text-[10px] font-black text-[#8B4AFF]">{msg.hasHistory ? `${msg.recordCount} registros` : 'Novo prontuário'}</span>
        </div>
      </div>
    </div>
  );

  if (msg.type === 'analysis') return (
    <div className="w-full bg-white rounded-[20px] p-4 shadow-sm border border-indigo-50">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={14} className="text-[#8B4AFF]" />
        <p className="text-[9px] font-black uppercase tracking-wider text-[#8B4AFF]">Análise iGentVet · {msg.symptomLabel}</p>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: msg.text?.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
      {msg.replies?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {msg.replies.map((reply, i) => (
            <button
              key={`${reply.label}-${i}`}
              onClick={() => onQuickReply?.(reply.text || reply.label)}
              className="px-3 py-2 rounded-2xl text-xs font-black transition-all active:scale-95 border"
              style={{
                background: i % 3 === 0 ? '#FFF7ED' : i % 3 === 1 ? '#FDF2F8' : '#F4F3FF',
                color: i % 3 === 0 ? '#F97316' : i % 3 === 1 ? '#DB2777' : C.purple,
                borderColor: i % 3 === 0 ? '#FDBA74' : i % 3 === 1 ? '#F9A8D4' : `${C.purple}35`,
              }}
            >
              {reply.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Perguntas de triagem clínica ─────────────────────────────────────────
  if (msg.type === 'triage_questions') return (
    <div className="w-full bg-white rounded-[20px] p-4 shadow-sm border border-[#8B4AFF20]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ background: C.purple }}>
          <img src={brandAssets.igentvetWordmark} className="w-full h-full object-contain p-0.5" />
        </div>
        <div>
          <p className="font-black text-gray-800 text-sm leading-none">iGentVet</p>
          <p className="text-[9px] text-[#8B4AFF] font-black uppercase tracking-wider">Triagem Clínica</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        {msg.ownerName ? `${msg.ownerName}, preciso` : 'Preciso'} de mais detalhes para analisar{' '}
        <b>{msg.catName}</b> com precisão:
      </p>
      <div className="space-y-2">
        {msg.questions.map((q, i) => (
          <div key={i} className="flex items-start gap-2.5 bg-[#F4F3FF] rounded-xl px-3 py-2.5">
            <span className="text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: C.purple, color: 'white' }}>{i + 1}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium leading-snug">{q}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {triageOptionsFor(q, i).map((option, j) => (
                  <button
                    key={`${i}-${option}`}
                    onClick={() => selectTriageChoice(q, option, i)}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-black active:scale-95 transition-all"
                    style={{
                      background: triageAnswers[i]?.option === option ? C.purple : j % 3 === 0 ? '#FFF7ED' : j % 3 === 1 ? '#FDF2F8' : '#FFFFFF',
                      color: triageAnswers[i]?.option === option ? '#FFFFFF' : j % 3 === 0 ? '#F97316' : j % 3 === 1 ? '#DB2777' : C.purple,
                      border: `1px solid ${j % 3 === 0 ? '#FDBA74' : j % 3 === 1 ? '#F9A8D4' : `${C.purple}35`}`,
                    }}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 font-bold mt-3">
        Escolha as opções que mais parecem com o que está acontecendo ou descreva no campo abaixo.
      </p>
      {Object.keys(triageAnswers).length > 0 && (
        <button
          onClick={sendTriageChoices}
          className="w-full mt-3 py-3 rounded-2xl text-sm font-black text-white shadow-sm active:scale-[0.98] transition-all"
          style={{ background: C.purple }}>
          Enviar respostas da triagem
        </button>
      )}
    </div>
  );

  // ── Red flags de alerta ────────────────────────────────────────────────────
  if (msg.type === 'red_flags') return (
    <div className="w-full bg-red-50 rounded-[20px] p-4 shadow-sm border border-red-100">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
        <p className="text-[10px] font-black text-red-500 uppercase tracking-wider">
          Sinais de Alerta — Observe {msg.catName}
        </p>
      </div>
      <div className="space-y-1.5">
        {msg.flags.map((f, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5 flex-shrink-0">⚠</span>
            <p className="text-sm text-red-700 font-medium leading-snug">{f}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-red-400 font-bold mt-2.5 border-t border-red-100 pt-2">
        Se observar qualquer um desses sinais, busque veterinário imediatamente.
      </p>
    </div>
  );

  // ── Nota de raça ──────────────────────────────────────────────────────────
  if (msg.type === 'breed_note') return (
    <div className="w-full bg-amber-50 rounded-[20px] p-3.5 shadow-sm border border-amber-100">
      <div className="flex items-start gap-2.5">
        <span className="text-lg flex-shrink-0">🧬</span>
        <div>
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider mb-0.5">
            Nota Genética · {msg.breed}
          </p>
          <p className="text-sm text-amber-800 font-medium leading-snug">{msg.text}</p>
        </div>
      </div>
    </div>
  );

  if (msg.type === 'text') {
    if (msg.sender === 'user') return (
      <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm text-white text-sm"
        style={{ background: C.purple }}>
        {msg.text}
      </div>
    );
    return (
      <div className="flex items-end gap-2 max-w-[90%]">
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white shadow-sm"
          style={{ background: C.purple }}>
          <img src={brandAssets.igentvetWordmark} className="w-full h-full object-contain p-0.5" />
        </div>
        <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: msg.text?.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
      </div>
    );
  }

  if (msg.type === 'report') {
    const d = msg.data;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [alertModal, setAlertModal] = useState(null); // { hours, care }
    return (
      <div className={`w-full rounded-[22px] overflow-hidden shadow-md border ${d.isUrgent ? 'border-red-200' : 'border-green-200'}`}>
        {/* Cabeçalho colorido */}
        <div className={`px-4 py-3 flex items-center gap-2 ${d.isUrgent ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${d.isUrgent ? 'bg-red-100' : 'bg-green-100'}`}>
            {d.isUrgent ? <AlertCircle size={16} className="text-red-600" /> : <CheckCircle size={16} className="text-green-600" />}
          </div>
          <div>
            <p className="font-black text-sm text-gray-800">{d.isUrgent ? '🔴 Atenção Necessária' : '🟢 Monitorar em Casa'}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Laudo Preliminar · iGentVet</p>
          </div>
        </div>

        <div className="bg-white px-4 py-4">
          {/* Recomendações */}
          {d.care?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Recomendações</p>
              <ul className="space-y-1.5">
                {d.care.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-[#8B4AFF] font-black mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quando ir ao vet */}
          {d.whenToVet && (
            <div className="mb-4 bg-[#F4F3FF] rounded-xl px-3 py-2.5 border border-[#8B4AFF15]">
              <p className="text-[9px] font-black text-[#8B4AFF] uppercase tracking-wider mb-1">
                🏥 Consulta Presencial
              </p>
              <p className="text-xs text-gray-700 font-medium leading-snug">{d.whenToVet}</p>
            </div>
          )}

          {/* Nota de raça no laudo */}
          {d.breedNote && (
            <div className="mb-4 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider mb-1">🧬 Predisposição da Raça</p>
              <p className="text-xs text-amber-800 font-medium leading-snug">{d.breedNote}</p>
            </div>
          )}

          {/* Alarmes */}
          {!d.isUrgent && (
            <div className="mb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Agendar Reavaliação</p>
              <div className="flex gap-2">
                {[4, 8, 12, 24].map(h => (
                  <button key={h}
                    onClick={() => setAlertModal({ hours: h, care: d.care?.[0] || 'cuidados indicados' })}
                    className="flex-1 py-2 rounded-xl text-[10px] font-black flex flex-col items-center gap-0.5 transition-all active:scale-95"
                    style={{ background: '#F4F3FF', color: C.purple }}>
                    <Clock size={12} />
                    {h}h
                  </button>
                ))}
                {/* Mini Modal de Alerta */}
                <AnimatePresence>
                  {alertModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
                      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
                      onClick={() => setAlertModal(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.8, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.85, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl"
                      >
                        {/* Ícone */}
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                          style={{ background: `${C.purple}15` }}>
                          <Clock size={28} style={{ color: C.purple }} />
                        </div>
                        {/* Texto */}
                        <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
                          Confirmação de Alerta
                        </p>
                        <h3 className="text-center font-black text-gray-800 text-base leading-snug mb-3">
                          {d.ownerName || 'Tutor'}
                          <span className="text-gray-400 font-bold">, você receberá</span><br/>
                          um lembrete em <span style={{ color: C.purple }}>{alertModal.hours} horas</span>
                        </h3>
                        <div className="bg-[#F4F3FF] rounded-2xl px-4 py-3 mb-5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Cuidado programado</p>
                          <p className="text-sm font-bold text-gray-700 leading-snug">{alertModal.care}</p>
                          <p className="text-[10px] text-gray-400 mt-1 font-bold">para <span className="font-black" style={{ color: C.purple }}>{cat.name}</span></p>
                        </div>
                        <button
                          onClick={() => { setAlertModal(null); }}
                          className="w-full py-4 rounded-[18px] font-black text-white text-sm shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
                          ✓ Confirmar Alerta
                        </button>
                        <button onClick={() => setAlertModal(null)}
                          className="w-full mt-2 py-2 text-gray-400 font-bold text-xs">
                          Cancelar
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="space-y-2">
            <div className="rounded-[16px] px-3 py-2 border border-[#8B4AFF15]" style={{ background: '#FAF8FF' }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: C.purple }}>
                Próximo passo sugerido
              </p>
              <p className="text-xs text-gray-600 leading-snug">
                Responda no chat com <b>mais 1 detalhe importante</b> para eu refinar a orientação antes de salvar o laudo da IA.
              </p>
            </div>
            <a href="https://www.google.com/maps/search/veterinario/" target="_blank" rel="noreferrer"
              className="w-full py-3 rounded-[16px] font-black text-sm flex items-center justify-center gap-2"
              style={{ background: '#F4F3FF', color: C.purple }}>
              <MapPin size={15} /> Vets Próximos
            </a>
            <button onClick={() => onShare(d)}
              className="w-full py-3 rounded-[16px] font-black text-sm flex items-center justify-center gap-2 border"
              style={{ background: '#ffffff', color: '#25D366', borderColor: '#25D36633' }}>
              <Share2 size={15} /> Compartilhar Resumo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'guided_followup') return (
    <div className="w-full bg-white rounded-[22px] p-4 shadow-sm border"
      style={{ borderColor: `${C.purple}18`, background: '#FCFBFF' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: C.purple }}>
          <img src={brandAssets.igentvetWordmark} className="w-full h-full object-contain p-0.5" />
        </div>
        <div>
          <p className="font-black text-gray-800 text-sm leading-none">iGentVet</p>
          <p className="text-[9px] text-gray-400 font-bold">Refinando a análise</p>
        </div>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: msg.text?.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
      {msg.replies?.length > 0 && (
        <>
          <p className="text-[10px] font-black uppercase tracking-wider mt-3 mb-2" style={{ color: C.purple }}>
            Toque em uma opção para continuar
          </p>
          <div className="flex flex-wrap gap-2">
            {msg.replies.map((reply, i) => (
              <button
                key={`${reply.label}-${i}`}
                onClick={() => onQuickReply?.(reply.text || reply.label)}
                className="px-3 py-2 rounded-2xl text-xs font-black transition-all active:scale-95 border"
                style={{
                  background: i % 3 === 0 ? '#FFF7ED' : i % 3 === 1 ? '#FDF2F8' : '#F4F3FF',
                  color: i % 3 === 0 ? '#F97316' : i % 3 === 1 ? '#DB2777' : C.purple,
                  borderColor: i % 3 === 0 ? '#FDBA74' : i % 3 === 1 ? '#F9A8D4' : `${C.purple}35`,
                }}
              >
                {reply.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (msg.type === 'consultation_summary') return (
    <div className="w-full bg-white rounded-[22px] p-4 shadow-sm border"
      style={{ borderColor: `${C.purple}24`, background: '#FCFBFF' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: C.purple }}>
          <img src={brandAssets.igentvetWordmark} className="w-full h-full object-contain p-0.5" />
        </div>
        <div>
          <p className="font-black text-gray-800 text-sm leading-none">Resumo para o veterinario</p>
          <p className="text-[9px] text-gray-400 font-bold">Pre-orientacao iGentVet</p>
        </div>
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{msg.symptom}</p>
      <h4 className="font-black text-gray-800 text-sm mb-2">{msg.title}</h4>
      <div className="space-y-2">
        <div className="rounded-2xl p-3" style={{ background: '#F4F3FF' }}>
          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: C.purple }}>Pontos observados</p>
          <ul className="space-y-1">
            {(msg.findings || []).map((item, i) => <li key={i} className="text-xs text-gray-700 font-bold">- {item}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl p-3 bg-amber-50 border border-amber-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1">Pre-diagnostico orientativo</p>
          <p className="text-xs text-gray-700 leading-relaxed">{msg.preDiagnosis}</p>
        </div>
        <div className="rounded-2xl p-3 bg-white border border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Levar para a consulta</p>
          {(msg.vetFocus || []).map((item, i) => <p key={i} className="text-xs text-gray-700 font-bold leading-relaxed">- {item}</p>)}
          <p className="text-[10px] text-gray-400 mt-2">{msg.breedNote}</p>
        </div>
      </div>
    </div>
  );

  if (msg.type === 'med_chips') {
    return (
      <div className="w-full bg-white rounded-[20px] p-4 shadow-sm border border-indigo-50">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-3">
          💊 Medicamentos ativos — ativar lembrete de dose
        </p>
        <div className="flex flex-col gap-2">
          {(msg.medications || []).map((med, i) => (
            <button key={i}
              onClick={() => onSetMedAlert({ medName: med, ownerName: msg.ownerName, catName: msg.catName })}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all active:scale-95"
              style={{ background: '#F4F3FF', border: '1.5px solid #8B4AFF30' }}>
              <div className="flex items-center gap-2">
                <span className="text-base">💊</span>
                <span className="text-sm font-bold text-gray-700">{med}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-[#8B4AFF]" />
                <span className="text-[10px] font-black text-[#8B4AFF]">Agendar</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-[9px] text-gray-400 mt-2 text-center">
          Toque para ativar notificação no dispositivo
        </p>
      </div>
    );
  }

  if (msg.type === 'quick_replies') {
    return (
      <div className="w-full bg-white rounded-[22px] p-3.5 shadow-sm border"
        style={{ borderColor: `${C.purple}18`, background: '#FCFBFF' }}>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">
          Respostas rapidas para continuar
        </p>
        <div className="flex flex-wrap gap-2">
          {(msg.replies || []).map((reply, i) => (
            <button
              key={`${reply.label}-${i}`}
              onClick={() => onQuickReply?.(reply.text || reply.label)}
              className="px-3 py-2 rounded-2xl text-xs font-black transition-all active:scale-95"
              style={{
                background: i % 3 === 0 ? '#FFF7ED' : i % 3 === 1 ? '#FDF2F8' : '#F4F3FF',
                color: i % 3 === 0 ? '#F97316' : i % 3 === 1 ? '#DB2777' : C.purple,
                border: `1.5px solid ${i % 3 === 0 ? '#FDBA74' : i % 3 === 1 ? '#F9A8D4' : `${C.purple}35`}`,
              }}>
              {reply.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (msg.type === 'ask_more_questions') return (
    <div className="w-full bg-white rounded-[22px] p-4 shadow-sm border"
      style={{ borderColor: `${C.purple}20` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: C.purple }}>
          <img src={brandAssets.igentvetWordmark} className="w-full h-full object-contain p-0.5" />
        </div>
        <p className="font-black text-gray-800 text-sm leading-none">iGentVet</p>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        Você tem mais alguma dúvida sobre <b>{msg.catName}</b>? Se quiser, seguimos investigando com calma. Se não, eu preparo o prontuário deste atendimento para salvar nos documentos d{art(cat)} <b>{msg.catName}</b>.
      </p>
      {!msg.answered && (
        <div className="flex gap-2">
          <button
            onClick={() => msg.onYes?.()}
            className="flex-1 py-3 rounded-[16px] font-black text-sm border-2 transition-all active:scale-95"
            style={{ borderColor: C.purple, color: C.purple, background: `${C.purple}08` }}>
            Sim, tenho dúvida
          </button>
          <button
            onClick={() => msg.onNo?.()}
            className="flex-1 py-3 rounded-[16px] font-black text-sm text-white transition-all active:scale-95"
            style={{ background: C.purple }}>
            Não, salvar laudo
          </button>
        </div>
      )}
      {msg.answered && (
        <p className="text-[11px] font-bold text-gray-400 text-center">
          {msg.answeredYes ? 'Perfeito, escolha uma opção ou me conte com suas palavras.' : 'Prontuário preparado. Confirme abaixo para salvar nos documentos.'}
        </p>
      )}
    </div>
  );

  if (msg.type === 'saved_confirm') {
    const name  = msg.ownerName || 'Tutor';
    const cat   = msg.catName;
    const n     = msg.consultCount || 1;
    const artG  = msg.gender === 'FEMALE' ? 'a' : 'o';

    // Mensagens personalizadas por número de consulta
    const closing = n === 1
      ? {
          emoji: '🌟',
          title: `${name}, obrigado pela primeira consulta!`,
          body: `Cuidar d${artG} <b>${cat}</b> começa com atenção e amor — e você acabou de dar um passo incrível. Este histórico agora faz parte do prontuário inteligente e vai ajudar a iGentVet a evoluir junto com <b>${cat}</b>. Seja bem-vindo à comunidade <b>Gatedo</b>! 🐱`,
          badge: '✨ Primeira consulta registrada',
          badgeColor: '#7C3AED',
          badgeBg: '#F5F3FF',
        }
      : n === 2
      ? {
          emoji: '💜',
          title: `${name}, você está construindo algo especial!`,
          body: `Com a segunda consulta registrada, o iGentVet já começa a cruzar padrões no histórico d${artG} <b>${cat}</b>. Quanto mais você consulta, mais precisa e preditiva fica a análise. Continue assim — tutores atentos fazem toda a diferença! 🏆`,
          badge: '📈 IA preditiva se fortalecendo',
          badgeColor: '#0369A1',
          badgeBg: '#F0F9FF',
        }
      : n <= 5
      ? {
          emoji: '🧠',
          title: `${name}, o prontuário d${artG} ${cat} está crescendo!`,
          body: `Já são <b>${n} consultas</b> registradas! A cada sessão, a iGentVet aprende mais sobre o perfil único d${artG} <b>${cat}</b> — raça, comportamento, histórico clínico. Se notar algo preocupante, nada substitui o olhar atento de um veterinário de confiança, mas você já tem dados inteligentes do seu lado. 🩺`,
          badge: `🔬 ${n} consultas · IA aprendendo`,
          badgeColor: '#065F46',
          badgeBg: '#F0FDF4',
        }
      : {
          emoji: '🏅',
          title: `${name}, você é um tutor de referência!`,
          body: `<b>${n} consultas</b> registradas para <b>${cat}</b>! O histórico preditivo que você construiu é raro e valioso — tanto para cuidar do seu gato hoje, quanto para contribuir com a inteligência coletiva da comunidade <b>Gatedo</b>. Muito obrigado por fazer parte disso. 🌎`,
          badge: `⭐ Tutor avançado · ${n} consultas`,
          badgeColor: '#92400E',
          badgeBg: '#FFFBEB',
        };

    return (
      <div className="w-full rounded-[24px] overflow-hidden shadow-md"
        style={{ border: `1.5px solid ${closing.badgeColor}25` }}>
        {/* Faixa de topo colorida */}
        <div className="px-4 py-2.5 flex items-center gap-2"
          style={{ background: closing.badgeBg }}>
          <span className="text-base">{closing.emoji}</span>
          <span className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: closing.badgeColor }}>{closing.badge}</span>
        </div>
        {/* Corpo */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
              style={{ background: C.purple }}>
              <img src={brandAssets.igentvetWordmark} className="w-full h-full object-contain p-0.5" />
            </div>
            <div className="flex-1">
              <p className="font-black text-gray-800 text-sm leading-snug mb-0.5">{closing.title}</p>
              <p className="text-gray-500 text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: closing.body }} />
            </div>
          </div>
          {/* Rodapé */}
          <div className="flex items-center gap-1.5 pt-2.5 border-t border-gray-50">
            <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
            <span className="text-[10px] font-bold text-gray-400">
              Consulta salva na ficha médica d{artG} <b className="text-gray-600">{cat}</b>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (msg.type === 'feedback_rating') {
    const options = [
      { rating: 5, label: 'Muito útil' },
      { rating: 4, label: 'Ajudou' },
      { rating: 3, label: 'Faltou detalhe' },
      { rating: 2, label: 'Confuso' },
    ];
    const submit = (option) => {
      setFeedbackChoice(option);
      onFeedback?.({ ...option, comment: feedbackComment });
    };
    return (
      <div className="w-full bg-white rounded-[22px] p-4 shadow-sm border border-[#8B4AFF20]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: C.purple }}>
            <img src={brandAssets.igentvetWordmark} className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <p className="font-black text-gray-800 text-sm leading-none">Como foi este atendimento?</p>
            <p className="text-[9px] text-gray-400 font-bold">Sua nota melhora o iGentVet</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {options.map((option) => (
            <button
              key={option.rating}
              onClick={() => submit(option)}
              disabled={Boolean(feedbackChoice)}
              className="px-3 py-2 rounded-2xl text-xs font-black border active:scale-95 transition-all disabled:opacity-70"
              style={{
                background: feedbackChoice?.rating === option.rating ? C.purple : '#F4F3FF',
                color: feedbackChoice?.rating === option.rating ? '#FFFFFF' : C.purple,
                borderColor: `${C.purple}35`,
              }}
            >
              {option.rating}/5 · {option.label}
            </button>
          ))}
        </div>
        {!feedbackChoice ? (
          <input
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Opcional: o que poderia melhorar?"
            className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-[#8B4AFF]"
          />
        ) : (
          <p className="text-xs font-bold text-green-600 bg-green-50 border border-green-100 rounded-2xl px-3 py-2">
            Nota registrada. Obrigado por ajudar a deixar o atendimento mais humano.
          </p>
        )}
      </div>
    );
  }

  return null;
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEP MEMORIAL — Gato falecido: homenagem + dados para IA preditiva
// ═══════════════════════════════════════════════════════════════════════════════
function StepMemorial({ cat, onBack }) {
  const ownerName = cat?.owner?.name?.split(' ')[0] || 'Tutor';
  const deathCauseLabel = {
    IRC: 'Insuficiência Renal Crônica',
    FIV: 'Imunodeficiência Felina (FIV)',
    FELV: 'Leucemia Felina (FeLV)',
    LINFOMA: 'Linfoma / Câncer',
    PIF: 'Peritonite Infecciosa Felina',
    TRAUMA: 'Trauma / Acidente',
    INFECCAO: 'Infecção Grave',
    CARDIACO: 'Problema Cardíaco',
    VELHICE: 'Velhice Natural',
    DESCONHECIDO: 'Causa Desconhecida',
    OUTRO: 'Outra causa',
  }[cat?.deathCause] || null;

  const deathDate = cat?.deathDate
    ? new Date(cat.deathDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col min-h-screen"
      style={{ background: 'linear-gradient(160deg, #1a1428 0%, #2D2657 50%, #1a1428 100%)' }}
    >
      {/* Estrelas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(18)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: (i % 3) + 1,
              height: (i % 3) + 1,
              top: `${(i * 17) % 70}%`,
              left: `${(i * 23) % 100}%`,
              opacity: 0.15 + (i % 4) * 0.08,
            }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 py-12 max-w-[920px] mx-auto w-full">
        {/* Botao voltar */}
        <button onClick={onBack}
          className="self-start mb-8 flex items-center gap-2 text-white/50 font-bold text-sm hover:text-white/80 transition-colors">
          <ChevronLeft size={18} />
          Voltar
        </button>

        {/* Avatar grayscale */}
        <div className="relative mb-5">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 shadow-2xl"
            style={{ borderColor: 'rgba(255,255,255,0.12)', filter: 'grayscale(65%)' }}>
            <img
              src={cat?.photoUrl || '/assets/cat-placeholder.png'}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/1998/1998627.png'; }}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#1a1428', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Heart size={16} className="text-rose-400 fill-rose-400" />
          </div>
        </div>

        {/* Nome + data */}
        <h2 className="font-black text-3xl text-white tracking-tight mb-1">{cat?.name}</h2>
        {deathDate && <p className="text-white/40 text-sm font-bold mb-6">{deathDate}</p>}

        {/* Mensagem acolhedora */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[28px] p-6 mb-4 text-center w-full">
          <p className="text-white/80 text-base leading-relaxed font-medium">
            {ownerName ? `${ownerName}, s` : 'S'}abemos o quanto{' '}
            <span className="text-white font-black">{cat?.name}</span>{' '}
            foi importante para você. ❤️
          </p>
          <p className="text-white/50 text-sm leading-relaxed mt-3">
            A Gatedo aprende com cada história. As informações de {cat?.name} ajudarão
            a cuidar de outros felinos —{' '}
            {cat?.breed && cat.breed !== 'SRD'
              ? `especialmente outros ${cat.breed} que precisam de atenção especial.`
              : 'de outros gatinhos que precisam de cuidado.'
            }
          </p>
        </div>

        {/* Causa mortis */}
        {deathCauseLabel && (
          <div className="w-full bg-white/5 border border-white/10 rounded-[22px] px-5 py-4 mb-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
              <Brain size={16} className="text-purple-300" />
            </div>
            <div>
              <p className="text-[9px] font-black text-purple-300/70 uppercase tracking-wider mb-0.5">Causa registrada</p>
              <p className="text-white/80 text-sm font-bold">{deathCauseLabel}</p>
              <p className="text-white/35 text-[10px] mt-0.5">Dados cruzados na IA preditiva da Gatedo</p>
            </div>
          </div>
        )}

        {/* Impacto na raça */}
        {cat?.breed && cat.breed !== 'SRD' && (
          <div className="w-full bg-white/5 border border-white/10 rounded-[22px] px-5 py-4 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} className="text-indigo-300" />
            </div>
            <div>
              <p className="text-[9px] font-black text-indigo-300/70 uppercase tracking-wider mb-0.5">Impacto na comunidade</p>
              <p className="text-white/70 text-sm leading-snug">
                O histórico de {cat?.name} agora protege outros{' '}
                <span className="text-white font-bold">{cat.breed}</span> no sistema.
              </p>
            </div>
          </div>
        )}

        {/* Botao voltar */}
        <button onClick={onBack}
          className="w-full py-4 rounded-[22px] font-black text-white/60 text-sm border border-white/12 hover:border-white/30 transition-all"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          Voltar aos meus gatos
        </button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE RAIZ
// ═══════════════════════════════════════════════════════════════════════════════
export default function IGentVet() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectCatId = location.state?.catId || null;
  // Vem do Guia (botão "Perguntar ao iGentVet sobre isso"): pula a seleção de
  // sintoma e a análise automática, abre direto no chat com a pergunta pronta
  // (já com os placeholders trocados) no campo de texto, editável.
  const prefillMessage = location.state?.prefillMessage || null;
  const [cats, setCats]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [step, setStep]           = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selCat, setSelCat]       = useState(null);
  const [selSymptom, setSelSymptom] = useState(null);

  const enterChatFromGuia = (cat) => {
    setSelCat(cat);
    setSelSymptom({ id: 'guia', label: 'Dúvida do Guia', emoji: '📖' });
    setStep(2);
  };

  useEffect(() => {
    api.get('/pets')
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        setCats(list);

        if (preselectCatId) {
          const match = list.find(c => c.id === preselectCatId);
          if (match && !match.isMemorial && !match.isArchived) {
            if (prefillMessage) {
              enterChatFromGuia(match);
            } else {
              setSelCat(match);
              setStep(1);
            }
          }
        }
      })
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) return (
    <div className="h-screen igent-hero-bg flex flex-col items-center justify-center igent-root">
      <img src={brandAssets.igentvetWordmark} className="h-12 mb-4 animate-pulse" />
      <p className="text-white/60 font-bold text-sm">Carregando prontuários...</p>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      {/* Fundo roxo estendido — cobre tudo inclusive atrás da BottomNav */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg,#9F63FF 0%,#7E46E1 58%,#592BB6 100%)', zIndex: -1 }} />
      <div className="flex flex-col igent-root"
        style={{ height: '100svh', overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">

          {/* PASSO 0 — Seleção */}
          {step === 0 && (
            <StepSelect
              key="select"
              cats={cats}
              activeIdx={activeIdx}
              setActiveIdx={setActiveIdx}
              onConfirm={(cat) => {
                if (cat.isMemorial || cat.isArchived) { setSelCat(cat); setStep('memorial'); return; }
                if (prefillMessage) { enterChatFromGuia(cat); return; }
                setSelCat(cat);
                setStep(1);
              }}
              onBack={() => navigate(-1)}
            />
          )}

          {/* PASSO MEMORIAL */}
          {step === 'memorial' && selCat && (
            <StepMemorial key="memorial" cat={selCat} onBack={() => setStep(0)} />
          )}

          {/* PASSO 1 — Sintomas */}
          {step === 1 && selCat && (
            <StepSymptoms
              key="symptoms"
              cat={selCat}
              onSelect={(s) => { setSelSymptom(s); setStep(2); }}
              onBack={() => setStep(0)}
            />
          )}

          {/* PASSO 2 — Chat IA */}
          {step === 2 && selCat && selSymptom && (
            <StepChat
              key="chat"
              cat={selCat}
              symptom={selSymptom}
              onBack={() => setStep(1)}
              onSaveHistory={() => {}}
              skipAutoStart={Boolean(prefillMessage)}
              initialInput={prefillMessage || ''}
            />
          )}

        </AnimatePresence>
      </div>
    </>
  );
}

