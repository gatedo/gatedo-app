/**
 * MundoGatedo.jsx — /mundo-gatedo
 * Página "zero ruído" sobre o propósito, fases e construção colaborativa do GATEDO.
 * ─ Manifesto + Fases do produto
 * ─ Caixa de sugestões (POST /feedback/suggestions → admin recebe no painel)
 * ─ Identidade visual escura, premium
 */
import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Crown, Globe2, Rocket, CheckCircle,
  Clock, Zap, PawPrint, Heart, Users, Send, Check,
  ChevronRight, Loader, X,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const C = {
  purple:    '#8B4AFF',
  purpleDark:'#682adb',
  accent:    '#DFFF40',
  accentDim: '#ebfc66',
  dark:      '#28134b',
  card:      '#140d28',
};

// ─── FASES DO PRODUTO ─────────────────────────────────────────────────────────
const PHASES = [
  {
    n: 1, label: 'Early Bird', status: 'active',
    title: 'Base & Comunidade',
    desc: 'Perfis de gatos, saúde, gamificação, IA veterinária e a rede social dos tutores felinos.',
    features: ['Perfis completos dos gatos','iGentVet — IA veterinária','ComuniGato — rede social','Gamificação & XP','Gatedo Studio (MVP)'],
    vagas: 50, price: 47,
    color: '#EF4444',
  },
  {
    n: 2, label: 'Fundador', status: 'upcoming',
    title: 'Studio & Moedas',
    desc: 'Expansão do Studio com todas as ferramentas criativas, Gatedo Points e integrações com parceiros.',
    features: ['Studio completo (6+ ferramentas)','Gatedo Points — loja de créditos','Cupons em petshops parceiros','Rede Vet conveniada','Desafios semanais de criação'],
    vagas: 100, price: 67,
    color: '#f59e0b',
  },
  {
    n: 3, label: 'Acesso Final', status: 'upcoming',
    title: 'Escala & Entretenimento',
    desc: 'Joguinhos para gatos, marketplace, app nativo iOS/Android e inteligência preditiva de saúde.',
    features: ['App nativo iOS & Android','Entretenimento interativo para gatos','Marketplace de produtos felinos','IA preditiva de saúde','Histórias animadas & Voz do Gato'],
    vagas: 200, price: 97,
    color: '#8B4AFF',
  },
];

// ─── VALORES ──────────────────────────────────────────────────────────────────
const VALUES = [
  { emoji:'🐾', title:'Amor pelos Gatos',  desc:'Cada decisão começa com: isso é bom para os gatos e seus tutores?' },
  { emoji:'🔬', title:'Tecnologia com Alma', desc:'IA como ferramenta de cuidado, não substituição do vínculo humano-felino.' },
  { emoji:'🤝', title:'Construído Junto',   desc:'Fundadores moldam o produto. Suas sugestões chegam direto no nosso painel.' },
  { emoji:'🌱', title:'Crescimento Real',   desc:'Lançamos devagar, testamos com cuidado, evoluímos com responsabilidade.' },
];

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function MundoGatedo() {
  const navigate     = useNavigate();
  const { user }     = useContext(AuthContext);

  const [suggText,   setSuggText]   = useState('');
  const [category,   setCategory]   = useState('feature');
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [error,      setError]      = useState('');

  const isFounder =
    user?.plan === 'FOUNDER_EARLY' ||
    user?.plan === 'FOUNDER' ||
    user?.badges?.includes('FOUNDER_EARLY') ||
    user?.badges?.includes('FOUNDER');

  const handleSend = async () => {
    if (!suggText.trim()) return;
    setSending(true);
    setError('');
    try {
      await api.post('/feedback/suggestions', {
        text:     suggText.trim(),
        category,
        userId:   user?.id,
        userName: user?.name,
        plan:     user?.plan,
      });
      setSent(true);
      setSuggText('');
    } catch {
      setError('Não foi possível enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const statusConfig = {
    active:   { label:'Em andamento', color:'#22c55e', bg:'rgba(34,197,94,0.12)',  border:'rgba(34,197,94,0.25)'  },
    upcoming: { label:'Em breve',     color:C.accentDim, bg:'rgba(223,255,64,0.08)', border:'rgba(223,255,64,0.2)'  },
    done:     { label:'Concluído',    color:'#a5b4fc', bg:'rgba(165,180,252,0.1)',  border:'rgba(165,180,252,0.2)' },
  };

  return (
    <div className="min-h-screen pb-20 font-sans text-white overflow-x-hidden"
      style={{ background:`radial-gradient(ellipse at 50% 0%, rgb(128, 55, 255) -11%, rgb(50, 23, 82) 85%)` }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 px-5 pt-12 pb-4 flex items-center gap-3"
        style={{ background:`rgba(130, 63, 255, 0.92)`, backdropFilter:'blur(16px)', borderBottom:'1px solid rgb(35, 18, 61)' }}>
        <button onClick={()=>navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10"
          style={{ background:'rgba(255,255,255,0.06)' }}>
          <ArrowLeft size={18}/>
        </button>
        <div className="flex items-center gap-2">
          <Globe2 size={16} style={{ color:C.accentDim }} />
          <span className="font-black text-sm tracking-wide">MUNDO <span style={{ color:C.accentDim }}>GATEDO</span></span>
        </div>
        {isFounder && (
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background:'rgba(223,255,64,0.1)', border:'1px solid rgba(223,255,64,0.2)' }}>
            <Crown size={9} color={C.accentDim} fill={C.accentDim}/>
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color:C.accentDim }}>Fundador</span>
          </div>
        )}
      </div>

      <div className="px-5 space-y-8 pt-2">

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5 }}
          className="pt-6 text-center space-y-4">

          {/* Logo animada */}
          <motion.div
            animate={{ boxShadow:['0 0 20px rgba(139,74,255,0.3)','0 0 40px rgba(139,74,255,0.6)','0 0 20px rgba(139,74,255,0.3)'] }}
            transition={{ duration:3, repeat:Infinity }}
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#936cff,#682adb)' }}>
            <img src="/assets/App_gatedo_logo1.webp" className="w-14 h-14 object-contain"
              alt="Gatedo" onError={e=>e.currentTarget.style.display='none'}/>
          </motion.div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[4px] mb-2" style={{ color:C.accentDim }}>
              Para tutores que amam gatos
            </p>
            <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
              Estamos construindo o<br />
              <span style={{ color:C.accentDim }}>GATEDO</span> com você
            </h1>
          </div>

          <p className="text-sm text-white/50 font-medium leading-relaxed max-w-[280px] mx-auto">
            Pessoas que amam gatos enxergam o mundo de forma diferente. Você chegou cedo — e isso importa.
          </p>
        </motion.div>

        {/* ── MANIFESTO ── */}
        <motion.div
          initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.1 }}
          className="rounded-[28px] p-6 relative overflow-hidden"
          style={{ background:'linear-gradient(145deg,#1a0d33,#2d1660,#1a0d33)', border:'1px solid rgba(255,255,255,0.06)' }}>

          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background:'linear-gradient(90deg, transparent, rgba(223,255,64,0.3), transparent)' }}/>

          <p className="text-[8px] font-black uppercase tracking-[3px] mb-3" style={{ color:'rgba(223,255,64,0.6)' }}>
            Nosso propósito
          </p>
          <p className="text-sm text-white/70 font-medium leading-relaxed">
            O GATEDO nasce da crença de que tecnologia pode aprofundar — não substituir — o vínculo entre tutores e seus gatos.
            Cada funcionalidade que construímos começa com uma pergunta simples:{' '}
            <span className="text-white font-black">isso cuida melhor?</span>
          </p>
        </motion.div>

        {/* ── VALORES ── */}
        <div>
          <p className="text-[9px] font-black text-white/35 uppercase tracking-[3px] mb-4">O que nos guia</p>
          <div className="grid grid-cols-2 gap-3">
            {VALUES.map((v, i) => (
              <motion.div key={i}
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                transition={{ delay:0.05+i*0.07 }}
                className="rounded-[22px] p-4"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-2xl mb-2 block">{v.emoji}</span>
                <p className="text-xs font-black text-white mb-1">{v.title}</p>
                <p className="text-[9px] text-white/40 font-medium leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── FASES ── */}
        <div>
          <p className="text-[9px] font-black text-white/35 uppercase tracking-[3px] mb-4">Roadmap das Fases</p>
          <div className="space-y-3">
            {PHASES.map((phase, i) => {
              const sc = statusConfig[phase.status];
              return (
                <motion.div key={phase.n}
                  initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:0.1+i*0.08 }}
                  className="rounded-[24px] overflow-hidden"
                  style={{ background:'rgba(255,255,255,0.04)', border:`1px solid rgba(255,255,255,0.07)` }}>

                  {/* Header da fase */}
                  <div className="px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-base"
                      style={{ background:`${phase.color}20`, border:`1.5px solid ${phase.color}40`, color:phase.color }}>
                      {phase.n}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-black text-white">{phase.label} · {phase.title}</p>
                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/40 font-medium leading-tight">{phase.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-black" style={{ color:phase.color }}>R${phase.price}</p>
                      <p className="text-[8px] text-white/30">{phase.vagas} vagas</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="px-5 pb-4 space-y-1.5">
                    {phase.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                          style={{ background:`${phase.color}15`, border:`1px solid ${phase.color}30` }}>
                          <Check size={9} style={{ color:phase.color }} strokeWidth={3}/>
                        </div>
                        <p className="text-[10px] text-white/50 font-medium">{f}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── CAIXA DE SUGESTÕES ── */}
        <motion.div
          initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.2 }}
          className="rounded-[28px] overflow-hidden"
          style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>

          {/* Header */}
          <div className="px-5 py-5 border-b border-white/05">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ background:`${C.purple}20`, border:`1.5px solid ${C.purple}30` }}>
                <Send size={15} style={{ color:C.purple }}/>
              </div>
              <div>
                <p className="text-sm font-black text-white">Sua Sugestão</p>
                <p className="text-[9px] text-white/40 font-bold">O admin recebe em tempo real no painel</p>
              </div>
            </div>
            <p className="text-[10px] text-white/40 font-medium leading-relaxed">
              Fundadores moldam o GATEDO. Sua ideia pode virar feature na próxima fase.
            </p>
          </div>

          <div className="p-5 space-y-4">
            {/* Categoria */}
            <div>
              <p className="text-[8px] font-black text-white/35 uppercase tracking-widest mb-2">Categoria</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id:'feature',  label:'💡 Feature',    },
                  { id:'bug',      label:'🐛 Bug',         },
                  { id:'design',   label:'🎨 Visual',      },
                  { id:'other',    label:'💬 Outro',       },
                ].map(cat => (
                  <button key={cat.id} onClick={()=>setCategory(cat.id)}
                    className="px-3 py-1.5 rounded-full text-[9px] font-black transition-all"
                    style={{
                      background: category===cat.id ? `${C.purple}25` : 'rgba(255,255,255,0.06)',
                      color:      category===cat.id ? '#cbb1ff' : 'rgba(255,255,255,0.45)',
                      border:     `1px solid ${category===cat.id ? `${C.purple}40` : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <p className="text-[8px] font-black text-white/35 uppercase tracking-widest mb-2">Sua ideia</p>
              <textarea
                value={suggText}
                onChange={e=>{ setSuggText(e.target.value); setSent(false); setError(''); }}
                placeholder="Conta pra gente: o que sente falta? O que adoraria ver no GATEDO?"
                maxLength={500}
                rows={4}
                className="w-full rounded-[18px] px-4 py-3 text-sm font-medium resize-none outline-none transition-all"
                style={{
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.1)',
                  color:'rgba(255,255,255,0.85)',
                  caretColor:C.accentDim,
                }}
              />
              <div className="flex justify-end mt-1">
                <span className="text-[8px] text-white/25 font-bold">{suggText.length}/500</span>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <p className="text-[10px] text-red-400 font-bold">{error}</p>
            )}

            {/* Botão enviar */}
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="sent"
                  initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                  className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
                  style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)' }}>
                  <CheckCircle size={16} color="#22c55e"/>
                  <span className="text-sm font-black text-green-400">Sugestão enviada! Obrigado 🐾</span>
                </motion.div>
              ) : (
                <motion.button key="send"
                  whileTap={{ scale:0.98 }}
                  disabled={!suggText.trim()||sending}
                  onClick={handleSend}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: !suggText.trim() ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#936cff,#682adb)',
                    color:      !suggText.trim() ? 'rgba(255,255,255,0.3)' : 'white',
                    boxShadow:  !suggText.trim() ? 'none' : '0 6px 20px rgba(139,74,255,0.35)',
                    cursor:     !suggText.trim() ? 'not-allowed' : 'pointer',
                  }}>
                  {sending
                    ? <><Loader size={15} className="animate-spin"/> Enviando...</>
                    : <><Send size={15}/> Enviar Sugestão</>
                  }
                </motion.button>
              )}
            </AnimatePresence>

            <p className="text-center text-[8px] text-white/25 font-bold">
              {user?.name ? `Enviando como ${user.name}` : 'Faça login para enviar com seu perfil'}{isFounder?' · Fundador 👑':''}
            </p>
          </div>
        </motion.div>

        {/* ── CTA FUNDADOR ── */}
        {!isFounder && (
          <motion.button
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            whileTap={{ scale:0.97 }}
            onClick={()=>navigate('/clube')}
            className="w-full rounded-[24px] p-5 flex items-center gap-4"
            style={{ background:'linear-gradient(135deg,#936cff,#682adb)', boxShadow:'0 8px 24px rgba(139,74,255,0.3)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background:'rgba(255,255,255,0.15)' }}>
              <Crown size={22} color={C.accentDim}/>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Vagas abertas</p>
              <p className="font-black text-white text-sm">Torne-se Fundador</p>
              <p className="text-[9px] text-white/50">Acesso por 12 meses · Selo permanente</p>
            </div>
            <ChevronRight size={18} className="text-white/50 shrink-0"/>
          </motion.button>
        )}

        <div className="h-6"/>
      </div>
    </div>
  );
}
