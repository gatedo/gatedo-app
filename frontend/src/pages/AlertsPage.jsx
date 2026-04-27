// GATEDO — AlertsPage.jsx
// Central de novidades integrada com Studio e TutorProfile.

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, CheckCircle2, Sparkles, ChevronRight, Palette } from 'lucide-react';
import useSensory from '../hooks/useSensory';

const C = {
  purple: '#8B4AFF',
  accentDim: '#ebfc66',
  dark: '#0f0a1e',
};

const ALERT_KEYS = {
  subscriptions: 'gatedo_alert_subscriptions',
  reads: 'gatedo_alert_reads',
};

const ALL_ALERTABLE_MODULES = [
  { slug:'cat-voice', title:'Voz do Gato', subtitle:'Seu gato fala de verdade', emoji:'🎙️', gradient:'linear-gradient(135deg, #10b981 0%, #0d9488 100%)', category:'Vídeo IA' },
  { slug:'animated-story', title:'Histórias', subtitle:'Animação com o gato como protagonista', emoji:'📖', gradient:'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', category:'Storytelling' },
  { slug:'meme-maker', title:'Meme Maker', subtitle:'Memes gateiros automáticos', emoji:'😂', gradient:'linear-gradient(135deg, #facc15 0%, #f97316 100%)', category:'Humor' },
  { slug:'vogue-cat', title:'Vogue Cat', subtitle:'Seu gato na capa da revista', emoji:'📰', gradient:'linear-gradient(135deg, #ec4899 0%, #8B4AFF 100%)', category:'Editorial' },
];

function AlertCard({ item, isRead }) {
  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="rounded-[28px] overflow-hidden border" style={{ background:'rgba(255,255,255,0.04)', borderColor:isRead ? 'rgba(255,255,255,0.06)' : '#8B4AFF55' }}>
      <div className="p-5 relative overflow-hidden" style={{ background:item.gradient }}>
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <div className="text-3xl mb-2">{item.emoji}</div>
            <h3 className="text-white text-lg font-black tracking-tight leading-tight">{item.title}</h3>
            <p className="text-white/70 text-sm mt-1">{item.subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wider" style={{ background:isRead ? 'rgba(255,255,255,0.14)' : C.accentDim, color:isRead ? 'white' : '#1a1a00' }}>{isRead ? 'Lido' : 'Novo'}</span>
            <span className="text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider" style={{ background:'rgba(0,0,0,0.18)', color:'rgba(255,255,255,0.72)' }}>{item.category}</span>
          </div>
        </div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Status do aviso</p>
          <p className="text-sm font-bold text-white/75 mt-1">{isRead ? 'Você já visualizou esta novidade' : 'Nova novidade salva para você'}</p>
        </div>
        <div className="flex items-center gap-2 text-white/35">{isRead ? <CheckCircle2 size={16} /> : <Sparkles size={16} color={C.accentDim} />}</div>
      </div>
    </motion.div>
  );
}

export default function AlertsPage() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [subscriptions, setSubscriptions] = useState([]);
  const [reads, setReads] = useState([]);

  const loadAlerts = () => {
    try {
      const subs = JSON.parse(localStorage.getItem(ALERT_KEYS.subscriptions) || '[]');
      const readItems = JSON.parse(localStorage.getItem(ALERT_KEYS.reads) || '[]');
      setSubscriptions(Array.isArray(subs) ? subs : []);
      setReads(Array.isArray(readItems) ? readItems : []);
    } catch {
      setSubscriptions([]);
      setReads([]);
    }
  };

  useEffect(() => {
    loadAlerts();
    window.addEventListener('focus', loadAlerts);
    window.addEventListener('gatedo-alerts-updated', loadAlerts);
    return () => {
      window.removeEventListener('focus', loadAlerts);
      window.removeEventListener('gatedo-alerts-updated', loadAlerts);
    };
  }, []);

  const subscribedModules = useMemo(() => ALL_ALERTABLE_MODULES.filter((item) => subscriptions.includes(item.slug)), [subscriptions]);
  const unreadCount = useMemo(() => subscribedModules.filter((item) => !reads.includes(item.slug)).length, [subscribedModules, reads]);

  const handleMarkAllRead = () => {
    const allSlugs = subscribedModules.map((item) => item.slug);
    localStorage.setItem(ALERT_KEYS.reads, JSON.stringify(allSlugs));
    setReads(allSlugs);
    window.dispatchEvent(new Event('gatedo-alerts-updated'));
  };

  return (
    <div className="min-h-screen pb-28 pt-6 px-5 text-white overflow-x-hidden" style={{ background:C.dark }}>
      <div className="flex items-center justify-between mb-6">
        <button onClick={()=>{ touch(); navigate(-1); }} className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10" style={{ background:'rgba(255,255,255,0.06)' }}><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10" style={{ background:'rgba(255,255,255,0.06)' }}><Bell size={14} style={{ color:C.accentDim }} /><span className="text-sm font-black tracking-wide">NOVIDADES <span style={{ color:C.accentDim }}>GATEDO</span></span></div>
        <button onClick={()=>navigate('/studio')} className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10" style={{ background:'rgba(255,255,255,0.06)' }}><Palette size={16} /></button>
      </div>

      <div className="rounded-[32px] p-5 mb-5 border relative overflow-hidden" style={{ background:'linear-gradient(135deg, rgba(139,74,255,0.22), rgba(104,42,219,0.18))', borderColor:'rgba(139,74,255,0.28)' }}>
        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[3px] mb-2" style={{ color:C.accentDim }}>Central de lançamentos</p>
          <h1 className="text-2xl font-black tracking-tight leading-tight mb-2">Seus avisos e novidades do Studio</h1>
          <div className="flex gap-3 mt-4">
            <div className="rounded-2xl px-4 py-3 border" style={{ background:'rgba(255,255,255,0.05)', borderColor:'rgba(255,255,255,0.08)' }}><p className="text-[9px] uppercase font-black tracking-[2px] text-white/35">Assinados</p><p className="text-lg font-black text-white mt-1">{subscribedModules.length}</p></div>
            <div className="rounded-2xl px-4 py-3 border" style={{ background:'rgba(223,255,64,0.07)', borderColor:'rgba(223,255,64,0.14)' }}><p className="text-[9px] uppercase font-black tracking-[2px] text-white/35">Novos</p><p className="text-lg font-black mt-1" style={{ color:C.accentDim }}>{unreadCount}</p></div>
          </div>
        </div>
      </div>

      {subscribedModules.length > 0 && (
        <div className="flex gap-3 mb-5">
          <button onClick={handleMarkAllRead} className="flex-1 rounded-2xl py-3.5 font-black text-xs uppercase tracking-wider border" style={{ background:'rgba(255,255,255,0.05)', borderColor:'rgba(255,255,255,0.08)', color:'white' }}>Marcar tudo como lido</button>
          <button onClick={()=>navigate('/studio')} className="flex-1 rounded-2xl py-3.5 font-black text-xs uppercase tracking-wider" style={{ background:'linear-gradient(135deg,#936cff,#682adb)', color:'white' }}>Ir para o Studio</button>
        </div>
      )}

      <div className="space-y-4">
        {subscribedModules.length === 0 ? (
          <div className="rounded-[32px] p-6 text-center border" style={{ background:'rgba(255,255,255,0.05)', borderColor:'rgba(255,255,255,0.08)' }}>
            <div className="w-16 h-16 rounded-[22px] mx-auto mb-4 flex items-center justify-center" style={{ background:'#8B4AFF20' }}><Bell size={28} color={C.accentDim} /></div>
            <h3 className="text-white font-black text-lg tracking-tight mb-2">Nenhum aviso ativo ainda</h3>
            <button onClick={()=>navigate('/studio')} className="px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wider" style={{ background:'linear-gradient(135deg,#936cff,#682adb)', color:'white' }}>Ir para o Studio</button>
          </div>
        ) : (
          subscribedModules.map((item) => <AlertCard key={item.slug} item={item} isRead={reads.includes(item.slug)} />)
        )}
      </div>

      {subscribedModules.length > 0 && (
        <button onClick={()=>navigate('/studio')} className="w-full mt-6 p-4 rounded-[24px] flex items-center justify-between border" style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.07)' }}>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-white/35">Explorar mais</p>
            <p className="text-sm font-bold text-white/75 mt-1">Voltar ao Studio e descobrir novas ferramentas</p>
          </div>
          <ChevronRight size={18} className="text-white/30" />
        </button>
      )}
    </div>
  );
}
