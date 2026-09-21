import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Sparkles, ShoppingBag, Stethoscope, LifeBuoy,
  UserRound, Settings, ChevronRight,
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

const C = { purple: '#8B4AFF' };

const ITEMS = [
  { label: 'Biblioteca',      subtitle: 'Guia e protocolos',      icon: BookOpen,     path: '/guia',          color: '#0EA5E9', bg: '#E0F2FE' },
  { label: 'GATEDOLAND',      subtitle: 'Studio, jogos e wiki',   icon: Sparkles,     path: '/gatedoland',    color: '#8B4AFF', bg: '#F1E9FF' },
  { label: 'Loja',            subtitle: 'Produtos para o gato',   icon: ShoppingBag,  path: '/store',         color: '#F59E0B', bg: '#FFFBEB' },
  { label: 'Vets',            subtitle: 'Voluntários e parceiros',icon: Stethoscope,  path: '/vets',          color: '#10B981', bg: '#F0FDF4' },
  { label: 'Ajuda',           subtitle: 'Suporte Gatedo',         icon: LifeBuoy,     path: '/support',       color: '#EC4899', bg: '#FDF2F8' },
  { label: 'Perfil',          subtitle: 'Seus dados de tutor',    icon: UserRound,    path: '/tutor-profile', color: '#6366F1', bg: '#EEF2FF' },
  { label: 'Configurações',   subtitle: 'Preferências do app',    icon: Settings,     path: '/settings',      color: '#64748B', bg: '#F1F5F9' },
];

export default function More() {
  const navigate = useNavigate();
  const touch    = useSensory();

  return (
    <div className="min-h-screen pb-28 px-4 pt-6" style={{ background: 'var(--gatedo-light-bg)' }}>
      <h1 className="text-xl font-black text-gray-800 tracking-tighter mb-4">Mais</h1>

      <motion.div
        className="space-y-2.5 max-w-[560px] mx-auto"
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      >
        {ITEMS.map((item) => (
          <motion.button
            key={item.path}
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { touch(); navigate(item.path); }}
            className="w-full flex items-center gap-3.5 bg-white rounded-[22px] px-4 py-3.5 border border-gray-50 shadow-sm text-left"
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: item.bg }}>
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-800 text-sm leading-tight">{item.label}</p>
              <p className="text-[10px] text-gray-400 font-bold truncate">{item.subtitle}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
