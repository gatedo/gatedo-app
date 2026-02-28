import React from 'react';
import { 
  LayoutDashboard, Users, Cat, BookOpen, ShoppingBag, 
  Settings, LogOut, ArrowLeft, HeartHandshake, TrendingUp 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Cores extraídas do Header.jsx para consistência total
const COLORS = {
  primary: "#6158ca",   // Roxo Principal
  accent: "#ebfc66",    // Amarelo Neon
  text: "#6158ca",      // Texto Escuro (Roxo)
  bg_hover: "#F8F9FE"   // Fundo Hover Suave
};

export default function AdminSidebar({ activeTab, setActiveTab, isOpen, onClose }) {
  const navigate = useNavigate();

  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'users', label: 'Tutores', icon: Users },
    { id: 'cats', label: 'Gatos', icon: Cat },
    { id: 'partners', label: 'Parceiros (Vets)', icon: HeartHandshake },
    { id: 'content', label: 'Wiki & Studio', icon: BookOpen },
    { id: 'store', label: 'Loja & Afiliados', icon: ShoppingBag },
    { id: 'financial', label: 'Financeiro', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* --- HEADER DO SIDEBAR (Igual ao App) --- */}
        <div className="p-6 pb-2 flex flex-col items-center border-b border-gray-50 mb-2">
           {/* Tenta usar a imagem do logo, fallback para texto estilizado */}
           <div className="w-32 h-12 relative flex items-center justify-center mb-2">
             <img 
               src="/logo-full.png" 
               alt="Gatedo" 
               className="w-full h-full object-contain"
               onError={(e) => {
                 e.target.style.display = 'none'; // Esconde se falhar
                 e.target.nextSibling.style.display = 'flex'; // Mostra texto
               }} 
             />
             <h1 
               className="hidden text-3xl font-black tracking-tighter items-center gap-1"
               style={{ color: COLORS.primary }}
             >
               GATE<span style={{ color: COLORS.accent, textShadow: '1px 1px 0 #6158ca' }}>DO</span>
             </h1>
           </div>
           
           <div className="bg-gray-100 px-3 py-1 rounded-full">
             <p className="text-[10px] font-black tracking-widest uppercase text-gray-400">Painel Admin</p>
           </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group
                  ${isActive 
                    ? 'shadow-lg translate-x-1' 
                    : 'hover:bg-gray-50 hover:translate-x-1'
                  }
                `}
                style={{
                  backgroundColor: isActive ? COLORS.primary : 'transparent',
                  color: isActive ? '#fff' : 'gray',
                  boxShadow: isActive ? `0 10px 20px -10px ${COLORS.primary}80` : 'none'
                }}
              >
                <Icon 
                  size={20} 
                  style={{ color: isActive ? COLORS.accent : (activeTab === item.id ? COLORS.primary : 'gray') }}
                  className="transition-colors"
                />
                <span className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#6158ca]'}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer Sidebar (Ações Críticas) */}
        <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/50">
            {/* BOTÃO VOLTAR AO APP (Cor Accent) */}
            <button 
                onClick={() => navigate('/home')} // Força ir para /home para evitar login/onboarding
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:brightness-95 shadow-md transition-transform active:scale-95"
                style={{
                    backgroundColor: COLORS.accent,
                    color: COLORS.primary,
                    boxShadow: `0 4px 15px -5px ${COLORS.accent}80`
                }}
            >
                <ArrowLeft size={18} strokeWidth={3} />
                VOLTAR AO APP
            </button>

            <button 
                onClick={() => {
                    if(window.confirm("Sair do Admin?")) navigate('/home');
                }}
                className="w-full flex items-center justify-center gap-2 text-gray-400 text-xs font-bold hover:text-red-500 py-2 transition-colors"
            >
                <LogOut size={14} /> Fechar Painel
            </button>
        </div>
      </aside>
    </>
  );
}