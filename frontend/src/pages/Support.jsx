import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, MessageCircle, HelpCircle, 
  ChevronDown, Mail, Instagram, ChevronRight 
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

const FAQ = [
  { q: "Como instalo o Gatedo no iPhone?", a: "Abra no Safari, toque no ícone de compartilhar e selecione 'Adicionar à Tela de Início'." },
  { q: "Onde encontro o Studio?", a: "O Studio está localizado na sua Home, logo abaixo do Header principal." },
  { q: "Como atualizar meus dados?", a: "Vá em Perfil > Editar Dados para alterar seu nome, cidade ou foto de tutor." },
  { q: "O app funciona offline?", a: "Algumas funções de consulta ficam salvas em cache, mas para sincronizar dados é necessária conexão." },
  { q: "O que é o selo de Fundador?", a: "É um badge exclusivo para os primeiros usuários que apoiaram o ecossistema Gatedo." },
  { q: "Como limpar o cache do app?", a: "Vá em Configurações e clique no botão 'Limpar Cache' para forçar o download da versão mais nova." },
  { q: "Meus dados estão seguros?", a: "Sim, utilizamos criptografia e o banco de dados Neon para garantir a segurança total das informações." },
  { q: "Como adicionar um novo gato?", a: "Na Home, role até a seção 'Meu Gatedo' e clique no botão tracejado 'Adicionar Novo Gato'." },
  { q: "Como entrar em contato com um vet?", a: "O Gatedo oferece suporte informativo. Para emergências, procure a clínica mais próxima via Wiki." },
  { q: "Onde vejo minhas conquistas?", a: "No seu Perfil, clique no contador de 'Selas' para abrir a página de Conquistas." }
];

export default function Support() {
  const navigate = useNavigate();
  const touch = useSensory();
  const [openIdx, setOpenIdx] = useState(null);

  const openWhatsApp = () => {
    touch();
    window.open("https://wa.me/5551985125219", "_blank");
  };

  const openEmail = () => {
    touch();
    window.location.href = "mailto:gatedoapp@gmail.com";
  };

  const openInstagram = () => {
    touch();
    window.open("https://instagram.com/gatedoapp", "_blank"); // Altere o final se o @ for diferente
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] px-6 pt-12 pb-32 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-2xl shadow-sm text-gray-400 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-gray-800 tracking-tight">Ajuda & Suporte</h1>
      </div>

      {/* CANAIS DE CONTATO RÁPIDO */}
      <div className="flex gap-3 mb-6">
        <button onClick={openWhatsApp} className="flex-1 bg-white p-5 rounded-[28px] shadow-sm border border-gray-50 flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center"><MessageCircle size={24} /></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">WhatsApp</p>
        </button>
        <button onClick={openEmail} className="flex-1 bg-white p-5 rounded-[28px] shadow-sm border border-gray-50 flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center"><Mail size={24} /></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">E-mail</p>
        </button>
      </div>

      {/* INSTAGRAM DESTAQUE */}
      <button 
        onClick={openInstagram}
        className="w-full mb-10 p-5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-[28px] text-white flex items-center justify-between shadow-lg active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-xl">
            <Instagram size={20} />
          </div>
          <div className="text-left">
            <p className="font-black text-sm leading-none">Siga nosso Instagram</p>
            <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-1">Dicas diárias e novidades</p>
          </div>
        </div>
        <ChevronRight size={18} className="opacity-60" />
      </button>

      {/* FAQ EXPANDIDO */}
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 ml-2">Perguntas Comuns (FAQ)</p>
      <div className="space-y-3">
        {FAQ.map((item, i) => (
          <div key={i} className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
            <button 
              onClick={() => { touch(); setOpenIdx(openIdx === i ? null : i); }} 
              className="w-full p-5 flex items-center justify-between text-left"
            >
              <span className="text-xs font-black text-gray-700 leading-tight pr-4">{item.q}</span>
              <ChevronDown size={16} className={`text-gray-300 transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openIdx === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-5 pb-5 text-[11px] font-bold text-gray-400 leading-relaxed border-t border-gray-50 pt-3">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <p className="text-center mt-12 text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">
        Gatedo Support Center • 2026
      </p>
    </div>
  );
}