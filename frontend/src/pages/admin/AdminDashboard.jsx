import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';

// IMPORTS DAS PÁGINAS E MÓDULOS
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminCats from "./AdminCats";
import AdminContent from "./AdminContent";
import AdminPartners from "./AdminPartners";
import AdminStore from "./AdminStore";
import AdminFinancial from "./AdminFinancial";
import AdminLinkGenerator from "../../components/admin/AdminLinkGenerator";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return (
          <div className="space-y-10">
            {/* Bloco 1: Métricas e Progresso das Fases de Lançamento */}
            <AdminOverview /> 
            
            {/* Bloco 2: Gerador de Convites Nominais (VIP/Founder) */}
            <AdminLinkGenerator /> 
          </div>
        );
      case 'users': return <AdminUsers />;
      case 'cats': return <AdminCats />;
      case 'content': return <AdminContent />;
      case 'partners': return <AdminPartners />;
      case 'store': return <AdminStore />;
      case 'financial': return <AdminFinancial />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex font-sans w-full">
      
      {/* Sidebar Retrátil (Controla a própria largura internamente) */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Conteúdo Principal Flexível */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        
        {/* Mobile Header (Visível apenas em telas pequenas) */}
        <div className="lg:hidden bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
           <div className="flex items-center gap-2">
             <img src="/vite.svg" alt="Logo" className="w-6 h-6" />
             <span className="font-black text-[#6158ca] text-xs tracking-tighter uppercase">Gatedo Admin</span>
           </div>
           <button 
             onClick={() => setIsSidebarOpen(true)} 
             className="p-2 bg-gray-100 rounded-xl text-[#6158ca]"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
             </svg>
           </button>
        </div>

        {/* Área do Conteúdo - Full Width com limite de conforto visual */}
        <main className="p-4 md:p-8 lg:p-10 w-full max-w-[1600px] mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}