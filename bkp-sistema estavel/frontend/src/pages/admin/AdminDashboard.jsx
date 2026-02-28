import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';

// IMPORTS DAS PÁGINAS
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminCats from "./AdminCats";
import AdminContent from "./AdminContent";
import AdminPartners from "./AdminPartners";
import AdminStore from "./AdminStore";
import AdminFinancial from "./AdminFinancial";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminOverview />;
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
    <div className="min-h-screen bg-[#F8F9FE] flex font-sans">
      {/* Sidebar (Fixo ou Estático dependendo da tela) */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* CORREÇÃO AQUI:
         Removi 'lg:ml-64' pois o Sidebar já é estático no desktop e ocupa espaço naturalmente no flex.
         Mantive apenas flex-1 para ocupar o resto da tela.
      */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* Mobile Header (Só aparece no celular) */}
        <div className="lg:hidden bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
           <span className="font-black text-[#6158ca]">GATEDO ADMIN</span>
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 rounded-lg">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}