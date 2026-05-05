import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Cat,
  BookOpen,
  ShoppingBag,
  Settings,
  LogOut,
  ArrowLeft,
  HeartHandshake,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  UserSearch,
  BarChart3,
  Instagram
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = {
  primary: "#8B4AFF",
  accent: "#ebfc66",
  bg_hover: "#F8F9FE"
};

export default function AdminSidebar({ activeTab, setActiveTab, isOpen, onClose }) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'users', label: 'Tutores', icon: Users },
    { id: 'cats', label: 'Gatos', icon: Cat },
    { id: 'partners', label: 'Parceiros (Vets)', icon: HeartHandshake },
    { id: 'content', label: 'Wiki & Studio', icon: BookOpen },
    { id: 'notices', label: 'Comunicados', icon: Megaphone },
    { id: 'store', label: 'Loja & Afiliados', icon: ShoppingBag },
    { id: 'prospects', label: 'Prospecção', icon: UserSearch },
    { id: 'meta-ads', label: 'Meta Ads', icon: BarChart3 },
    { id: 'instagram-outreach', label: 'Instagram', icon: Instagram },
    { id: 'financial', label: 'Financeiro', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-dvh border-r border-gray-100
          transition-all duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20 bg-[#8B4AFF]' : 'w-64 bg-white'}
        `}
      >
        <div className="p-4 flex flex-col items-center border-b border-gray-50/10 mb-2 relative flex-shrink-0">
          <div className={`${isCollapsed ? 'w-10 h-10' : 'w-32 h-12'} transition-all duration-300 flex items-center justify-center mb-2`}>
            <img
              src={isCollapsed ? "/vite.svg" : "assets/logo_gatedo_full.webp"} 
              alt="Gatedo"
              className="w-full h-full object-contain"
            />
          </div>

          {!isCollapsed && (
            <div className="bg-gray-100 px-3 py-1 rounded-full">
              <p className="text-[10px] font-black tracking-widest uppercase text-gray-400">
                Painel Admin
              </p>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-10 bg-white border border-gray-100 rounded-full p-1 shadow-md text-[#8B4AFF] hover:scale-110 transition-transform"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className={`flex-1 min-h-0 ${isCollapsed ? 'px-2' : 'px-4'} py-4 space-y-2 overflow-y-auto overscroll-contain custom-scrollbar`}>
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
                title={isCollapsed ? item.label : ''}
                className={`
                  w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-200 group relative
                  ${isCollapsed ? 'justify-center py-4' : 'px-4 py-3.5 gap-3'}
                  ${isActive ? (isCollapsed ? '' : 'shadow-lg translate-x-1') : 'hover:translate-x-1'}
                `}
                style={{
                  backgroundColor: !isCollapsed && isActive ? COLORS.primary : 'transparent',
                  color: isCollapsed ? '#fff' : (isActive ? '#fff' : 'gray'),
                }}
              >
                {isCollapsed && isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-[#ebfc66] rounded-r-full" />
                )}

                <Icon
                  size={20}
                  style={{
                    color: isCollapsed
                      ? (isActive ? COLORS.accent : '#fff')
                      : (isActive ? COLORS.accent : 'gray')
                  }}
                  className="transition-colors"
                />

                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={`flex-shrink-0 mt-auto p-4 border-t border-gray-100 space-y-3 ${isCollapsed ? 'bg-transparent' : 'bg-gray-50/50'}`}>
          <button
            onClick={() => navigate('/home')}
            className={`w-full rounded-2xl flex items-center justify-center transition-all active:scale-95 ${isCollapsed ? 'h-12' : 'py-3.5 gap-2 font-black shadow-md'}`}
            style={{
              backgroundColor: COLORS.accent,
              color: COLORS.primary,
            }}
          >
            <ArrowLeft size={18} strokeWidth={3} />
            {!isCollapsed && "VOLTAR AO APP"}
          </button>

          {!isCollapsed && (
            <button
              onClick={() => {
                if (window.confirm("Sair do Admin?")) navigate('/home');
              }}
              className="w-full flex items-center justify-center gap-2 text-gray-400 text-xs font-bold hover:text-red-500 py-2 transition-colors"
            >
              <LogOut size={14} /> Fechar Painel
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
