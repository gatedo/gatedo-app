import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';

import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminCats from './AdminCats';
import AdminContent from './AdminContent';
import AdminPartners from './AdminPartners';
import AdminStore from './AdminStore';
import AdminFinancial from './AdminFinancial';
import AdminProspects from './AdminProspects';
import AdminMetaAds from './AdminMetaAds';
import AdminInstagramOutreach from './AdminInstagramOutreach';

import AdminLinkGenerator from '../../components/admin/AdminLinkGenerator';
import AdminFasesControl from '../../components/admin/AdminFasesControl';
import AdminNoticeManager from '../../components/admin/AdminNoticeManager';

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <AdminOverview />
            <AdminLinkGenerator />
            <AdminFasesControl />
          </div>
        );

      case 'users':
        return <AdminUsers />;

      case 'cats':
        return <AdminCats />;

      case 'content':
        return <AdminContent />;

      case 'partners':
        return <AdminPartners />;

      case 'notices':
        return <AdminNoticeManager />;

      case 'store':
        return <AdminStore />;

      case 'financial':
        return <AdminFinancial />;

      case 'prospects':
        return <AdminProspects />;

      case 'meta-ads':
        return <AdminMetaAds />;

      case 'instagram-outreach':
        return <AdminInstagramOutreach />;

      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="h-dvh bg-[var(--gatedo-light-bg)] flex font-sans w-full overflow-hidden">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-dvh transition-all duration-300 overflow-hidden">
        <div className="lg:hidden bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <img src="/vite.svg" alt="Logo" className="w-6 h-6" />
            <span className="font-black text-[#8B4AFF] text-xs tracking-tighter uppercase">
              Gatedo Admin
            </span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-gray-100 rounded-xl text-[#8B4AFF]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <main className="p-4 md:p-8 lg:p-10 w-full max-w-[1600px] mx-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
