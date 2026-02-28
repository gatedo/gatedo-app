import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, ShieldCheck, BookOpen,
  AlertTriangle, CheckCircle, Brain, Stethoscope,
  Eye, Droplets, Activity, Pill, Heart, Zap,
  MessageSquare, Clock, ChevronDown, ChevronUp,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSensory from '../hooks/useSensory';

const C = {
  purple:    '#6158ca',
  purpleDark:'#4B40C6',
  accent:    '#DFFF40',
  bg:        '#F4F3FF',
};

// ─── DADOS REAIS DO SISTEMA ────────────────────────────────────────────────────
const SINTOMAS = [
  {
    id: 'skin',      emoji: '✨', label: 'Pele & Pelo',
    especialidade: 'Dermatologia felina',
    descricao: 'Analisa dermatite alérgica, dermatofitose (micose — possível zoonose), acne felina, alopecia e parasitas externos. Verifica se há mudança de ração ou produto no ambiente.',
    exemplos: ['Coceira intensa', 'Peladas/manchas', 'Crostas ou feridas', 'Excesso de descamação'],
    alerta: null,
  },
  {
    id: 'eyes',      emoji: '👁', label: 'Olhos',
    especialidade: 'Oftalmologia felina',
    descricao: 'Avalia herpesvírus felino (FHV-1), conjuntivite, úlcera de córnea, sequestro corneal (Persa/Himalaia) e uveíte. Cruza com histórico vacinal e raça.',
    exemplos: ['Olho fechado ou semicerrado', 'Secreção amarela ou verde', 'Mancha na córnea', 'Olho vermelho'],
    alerta: 'URGENTE se olho completamente fechado com blefarospasmo.',
  },
  {
    id: 'ears',      emoji: '👂', label: 'Orelhas',
    especialidade: 'Otologia felina',
    descricao: 'Detecta otocariose (ácaros), otite bacteriana, por Malassezia ou mista. Avalia se há inclinação de cabeça (possível otite interna — neurologicamente relevante).',
    exemplos: ['Coçar a orelha constantemente', 'Secreção escura ou amarela', 'Odor forte', 'Cabeça inclinada'],
    alerta: 'URGENTE se cabeça inclinada com perda de equilíbrio.',
  },
  {
    id: 'behavior',  emoji: '🧠', label: 'Comportamento',
    especialidade: 'Comportamento e neurologia felina',
    descricao: 'Avalia mudanças comportamentais cruzando com fatores ambientais. Identifica estresse, cistite idiopática (FLUTD/estresse), ansiedade, hiperestesia e possíveis causas de dor oculta.',
    exemplos: ['Agressividade repentina', 'Parou de usar a areia', 'Escondendo-se', 'Vocalização noturna'],
    alerta: 'URGENTE se convulsão, ataxia ou agressividade extrema sem causa.',
  },
  {
    id: 'digestion', emoji: '🤢', label: 'Vômito & Diarreia',
    especialidade: 'Gastroenterologia felina',
    descricao: 'Diferencia gastroenterite aguda de IBD, pancreatite e obstrução. Alerta para lipidose hepática em gatos obesos que pararam de comer há mais de 24h.',
    exemplos: ['Vômito repetido', 'Diarreia com ou sem sangue', 'Recusa de comida', 'Distensão abdominal'],
    alerta: 'URGENTE se vômito/diarreia com sangue ou gato obeso sem comer.',
  },
  {
    id: 'urinary',   emoji: '💧', label: 'Xixi & Cocô',
    especialidade: 'Urologia e nefrologia felina',
    descricao: 'Triagem de FLUTD, obstrução uretral, DRC e infecção urinária. Macho com tentativas repetidas sem urinar é emergência absoluta.',
    exemplos: ['Entrando na areia sem urinar', 'Urina com sangue', 'Xixi fora da caixa', 'Bebendo muito mais'],
    alerta: 'EMERGÊNCIA: macho que não consegue urinar — vá ao vet imediatamente.',
  },
  {
    id: 'mobility',  emoji: '🦴', label: 'Dor & Mancando',
    especialidade: 'Ortopedia e medicina da dor felina',
    descricao: 'Avalia trauma, artrite (subdiagnosticada em felinos), tromboembolismo aórtico (TEA — paralisia súbita) e fraturas. Considera raça para displasia e predisposições.',
    exemplos: ['Mancando', 'Não apoia o membro', 'Dificuldade para pular', 'Paralisia súbita'],
    alerta: 'EMERGÊNCIA: paralisia súbita de membros posteriores (suspeita de TEA).',
  },
  {
    id: 'other',     emoji: '🚨', label: 'Emergência',
    especialidade: 'Medicina de emergência felina',
    descricao: 'Protocolo de triagem rápida. Avalia respiração, cor das mucosas (gengivas) e nível de consciência. Pesquisa exposição a toxinas (paracetamol, lírios, permetrina são mortais para gatos).',
    exemplos: ['Dificuldade para respirar', 'Gengivas pálidas ou azuis', 'Colapso ou desmaio', 'Intoxicação'],
    alerta: 'EMERGÊNCIA: a maioria dos casos nesta categoria requer atendimento imediato.',
  },
];

const RACAS_DESTAQUE = [
  { raca: 'Persa & Himalaia', riscos: 'Sequestro corneal, dermatofitose, PKD renal, problemas respiratórios por braquicefalia' },
  { raca: 'Maine Coon', riscos: 'Cardiomiopatia hipertrófica (HCM), displasia de quadril, descolamento de retina por hipertensão' },
  { raca: 'Ragdoll', riscos: 'HCM, doença renal policística, sensibilidade gastrointestinal' },
  { raca: 'Siamês', riscos: 'IBD/linfoma intestinal, ansiedade, alopecia psicogênica' },
  { raca: 'Bengal', riscos: 'Displasia de quadril, comportamentos compulsivos, doença cardíaca' },
  { raca: 'Scottish Fold', riscos: 'Osteocondrodisplasia — artrite grave e dolorosa em toda a coluna' },
  { raca: 'Sphynx', riscos: 'Cardiomiopatia hipertrófica, acne felina, dermatite seborreica' },
  { raca: 'SRD (vira-lata)', riscos: 'Menor predisposição genética, mas suscetível a FLUTD, parasitas e obesidade' },
];

const COMO_DESCREVER = [
  { icon: Clock, cor: '#6158ca', titulo: 'Quando começou?', dica: '"Há 2 dias", "desde ontem à noite", "semana passada" — tempo preciso ajuda a definir urgência.' },
  { icon: Activity, cor: '#16A34A', titulo: 'Frequência e intensidade', dica: '"Vomitou 5 vezes hoje", "coça o ouvido a cada 10 minutos", "manca só quando sobe escadas".' },
  { icon: Sparkles, cor: '#D97706', titulo: 'O que mudou?', dica: 'Nova ração, areia, produto de limpeza, novo animal, obra em casa, viagem — contexto ambiental é diagnóstico.' },
  { icon: Heart, cor: '#DC2626', titulo: 'Comportamento geral', dica: '"Continua comendo normalmente", "parou de comer ontem", "escondido embaixo da cama" — estado geral é crucial.' },
];

// ─── ACCORDION ────────────────────────────────────────────────────────────────
function Accordion({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-[20px] overflow-hidden bg-white shadow-sm">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="font-black text-gray-800 text-sm">{label}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CARD DE SINTOMA ──────────────────────────────────────────────────────────
function SintomaCard({ s }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      className="rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden"
    >
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <span className="text-xl flex-shrink-0">{s.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-800 text-sm">{s.label}</p>
          <p className="text-[10px] font-bold mt-0.5" style={{ color: C.purple }}>{s.especialidade}</p>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" />
               : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3">

              {/* Descrição */}
              <p className="text-xs text-gray-600 leading-relaxed">{s.descricao}</p>

              {/* Exemplos */}
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Exemplos de queixa</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.exemplos.map((e, i) => (
                    <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                      style={{ background: `${C.purple}08`, borderColor: `${C.purple}20`, color: C.purple }}>
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {/* Alerta */}
              {s.alerta && (
                <div className="flex items-start gap-2 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-black text-red-700 leading-snug">{s.alerta}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'sintomas', label: 'Sintomas', icon: Stethoscope },
  { key: 'racas',    label: 'Raças',    icon: Brain },
  { key: 'dicas',    label: 'Como usar', icon: BookOpen },
  { key: 'legal',    label: 'Legal',    icon: ShieldCheck },
];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function IGentHelp() {
  const navigate  = useNavigate();
  const touch     = useSensory();
  const [tab, setTab] = useState('sintomas');

  return (
    <div className="min-h-screen pb-28" style={{ background: C.bg, fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Header ── */}
      <div className="pt-10 pb-8 px-5 relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}>
        {/* Orbs */}
        <div className="absolute top-[-40px] right-[-30px] w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${C.accent} 0%, transparent 70%)` }} />

        <div className="relative z-10 max-w-[800px] mx-auto">
          <button onClick={() => { touch(); navigate(-1); }}
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center mb-5">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[4px] mb-1">Manual</p>
              <h1 className="text-3xl font-black text-white leading-none">iGentVet</h1>
              <p className="text-sm text-white/60 mt-1.5 font-bold">Como a IA analisa seu gato</p>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: C.accent }}>
              <Brain size={28} style={{ color: C.purple }} />
            </div>
          </div>

          {/* Chips de contexto */}
          <div className="flex gap-2 mt-5 flex-wrap">
            {['8 categorias clínicas', 'Contexto de raça', 'Histórico integrado'].map(c => (
              <span key={c} className="text-[9px] font-black px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-4 -mt-4 relative z-10 max-w-[800px] mx-auto">
        <div className="bg-white rounded-[22px] shadow-lg p-1.5 flex gap-1">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => { touch(); setTab(t.key); }}
                className="flex-1 flex flex-col items-center py-2.5 rounded-[16px] transition-all"
                style={active ? { background: C.purple, color: 'white' } : { color: '#9CA3AF' }}>
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[9px] font-black uppercase tracking-wide mt-1">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="px-4 mt-5 max-w-[800px] mx-auto">
        <AnimatePresence mode="wait">

          {/* ═══ SINTOMAS ═══ */}
          {tab === 'sintomas' && (
            <motion.div key="sintomas"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-2.5">

              {/* Intro */}
              <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${C.purple}12` }}>
                  <Info size={16} style={{ color: C.purple }} />
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm">Como funciona a triagem</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Cada categoria ativa uma especialidade clínica diferente. A IA cruza o sintoma com o histórico completo do gato — vacinas, medicações, raça, dieta e ambiente — antes de responder.
                  </p>
                </div>
              </div>

              {/* Cards dos 8 sintomas */}
              {SINTOMAS.map(s => <SintomaCard key={s.id} s={s} />)}
            </motion.div>
          )}

          {/* ═══ RAÇAS ═══ */}
          {tab === 'racas' && (
            <motion.div key="racas"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">

              <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 flex items-start gap-3 mb-1">
                <span className="text-xl">🧬</span>
                <div>
                  <p className="font-black text-gray-800 text-sm">Risco genético integrado</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    O iGentVet conhece as predisposições de cada raça. Ao analisar um sintoma, ele automaticamente cruza com riscos específicos do seu gato e alerta quando a raça é fator determinante.
                  </p>
                </div>
              </div>

              {RACAS_DESTAQUE.map((r, i) => (
                <div key={i} className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-black text-gray-800 text-sm">{r.raca}</p>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${C.purple}10`, color: C.purple }}>Risco mapeado</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.riscos}</p>
                </div>
              ))}

              <div className="rounded-[20px] px-4 py-3 border"
                style={{ background: `${C.accent}20`, borderColor: `${C.accent}60` }}>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#5A7000' }}>Dica</p>
                <p className="text-xs font-bold text-gray-700">
                  Se sua raça não está listada, o iGentVet ainda analisa normalmente — ele usa o contexto clínico individual do seu gato como referência principal.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ COMO USAR ═══ */}
          {tab === 'dicas' && (
            <motion.div key="dicas"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">

              {/* Como descrever */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">Como descrever bem o sintoma</p>
                <div className="space-y-4">
                  {COMO_DESCREVER.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${item.cor}12` }}>
                          <Icon size={15} style={{ color: item.cor }} />
                        </div>
                        <div>
                          <p className="font-black text-sm text-gray-800">{item.titulo}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.dica}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exemplo real */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Exemplo de resposta ideal</p>
                <div className="bg-[#F4F3FF] rounded-[16px] px-4 py-3 border-l-4 mb-2"
                  style={{ borderColor: C.purple }}>
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    "Ele está vomitando desde ontem — foram umas 4 vezes. Come normalmente mas hoje de manhã recusou. Não tem sangue no vômito. A ração não mudou mas comprei um tapete novo na semana passada."
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle size={13} className="text-green-500" />
                  <p className="text-[10px] font-black text-green-700">Tempo + frequência + contexto ambiental + estado geral ✅</p>
                </div>
              </div>

              {/* O que o iGentVet cruza automaticamente */}
              <Accordion label="O que a IA cruza automaticamente?" defaultOpen>
                <div className="space-y-2.5 pt-1">
                  {[
                    { icon: '💉', label: 'Vacinação', desc: 'Verifica quais vacinas estão em dia e quais estão vencidas — pode ser causa do problema.' },
                    { icon: '💊', label: 'Medicações ativas', desc: 'Medicamentos em uso podem causar ou mascarar sintomas — a IA considera isso na análise.' },
                    { icon: '🍽', label: 'Dieta e ambiente', desc: 'Tipo de ração, acesso à rua, com outros animais — tudo integrado ao diagnóstico diferencial.' },
                    { icon: '📋', label: 'Histórico clínico', desc: 'Consultas anteriores, padrões de recorrência e evolução do quadro ao longo do tempo.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <div>
                        <p className="font-black text-sm text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion>

              {/* Dica sobre o chat */}
              <div className="rounded-[20px] px-4 py-4 flex items-start gap-3"
                style={{ background: `${C.accent}25`, border: `1px solid ${C.accent}60` }}>
                <MessageSquare size={18} style={{ color: '#5A7000' }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: '#5A7000' }}>Durante o chat</p>
                  <p className="text-sm font-bold text-gray-700 leading-snug">
                    Responda as perguntas de triagem com detalhes. Quanto mais contexto você der, mais precisa e personalizada será a análise para o seu gato.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ LEGAL ═══ */}
          {tab === 'legal' && (
            <motion.div key="legal"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">

              {/* Aviso principal */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border-l-4 border-red-400">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="font-black text-gray-800">Aviso Importante</p>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Leia antes de usar</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <p className="font-black">O iGentVet é uma ferramenta de triagem e auxílio — não substitui o veterinário.</p>
                  <div className="space-y-2">
                    {[
                      'Em emergências com risco de vida, vá ao veterinário ou plantão 24h imediatamente.',
                      'A IA pode cometer erros de interpretação — sempre confirme com profissional.',
                      'Não use a análise para alterar ou suspender tratamentos prescritos.',
                      'Sintomas urgentes identificados pela IA devem ser avaliados presencialmente.',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-red-400 font-black flex-shrink-0">•</span>
                        <p className="text-xs text-gray-600 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* O que o iGentVet É */}
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">O iGentVet É:</p>
                <div className="space-y-2">
                  {[
                    { icon: CheckCircle, cor: '#16A34A', txt: 'Triagem inteligente para avaliar urgência' },
                    { icon: CheckCircle, cor: '#16A34A', txt: 'Orientação de primeiros cuidados em casa' },
                    { icon: CheckCircle, cor: '#16A34A', txt: 'Prontuário digital com histórico clínico' },
                    { icon: CheckCircle, cor: '#16A34A', txt: 'Alerta de vacinas vencidas e medicações' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <Icon size={14} style={{ color: item.cor }} className="flex-shrink-0" />
                        <p className="text-sm text-gray-700 font-medium">{item.txt}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Privacidade */}
              <Accordion label="Privacidade e dados">
                <div className="space-y-2 pt-1 text-xs text-gray-500 leading-relaxed">
                  <p>Os dados do seu gato (histórico, vacinas, consultas) são usados exclusivamente para personalizar as análises do iGentVet.</p>
                  <p>Nenhuma informação pessoal é compartilhada com terceiros ou usada para publicidade.</p>
                  <p>As conversas com o iGentVet são armazenadas no seu prontuário para permitir análise de evolução clínica ao longo do tempo.</p>
                </div>
              </Accordion>

              {/* Versão */}
              <div className="flex items-center gap-3 bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-[#F4F3FF] flex items-center justify-center">
                  <ShieldCheck size={16} style={{ color: C.purple }} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800">iGentVet — Biblioteca de Prompts v2.0</p>
                  <p className="text-[10px] text-gray-400 font-bold">8 especialidades · Raças integradas · Triagem clínica ativa</p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}