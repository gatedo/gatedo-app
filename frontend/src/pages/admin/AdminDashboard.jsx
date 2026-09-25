import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';

import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminCats from './AdminCats';
import AdminContent from './AdminContent';
import AdminGuideEditor from './AdminGuideEditor';
import AdminProtocolEditor from './AdminProtocolEditor';
import AdminOng from './AdminOng';
import AdminPartners from './AdminPartners';
import AdminStore from './AdminStore';
import AdminFinancial from './AdminFinancial';
import AdminProspects from './AdminProspects';
import AdminMetaAds from './AdminMetaAds';
import AdminInstagramOutreach from './AdminInstagramOutreach';
import AdminAmbassadors from './AdminAmbassadors';
import AdminMarketIntelligence from './AdminMarketIntelligence';
import AdminStrategicPlan from './AdminStrategicPlan';
import AdminNetworkOps from './AdminNetworkOps';
import AdminExpansionRadar from './AdminExpansionRadar';
import AdminVentureOS from './AdminVentureOS';
import AdminCampaignStudio from './AdminCampaignStudio';
import AdminCampaignGenese from './AdminCampaignGenese';
import AdminCopyBank from './AdminCopyBank';
import AdminOpsCenter from './AdminOpsCenter';
import AdminRevenueJourney from './AdminRevenueJourney';
import AdminFunnelBuilder from './AdminFunnelBuilder';
import AdminIgentAlmanac from './AdminIgentAlmanac';
import AdminEntitlements from './AdminEntitlements';
import AdminAnalytics from './AdminAnalytics';
import AdminFunil from './AdminFunil';
import AdminSettings from './AdminSettings';

import AdminLinkGenerator from '../../components/admin/AdminLinkGenerator';
import AdminFasesControl from '../../components/admin/AdminFasesControl';
import AdminNoticeManager from '../../components/admin/AdminNoticeManager';

const ADMIN_TABS = new Set([
  'dashboard',
  'users',
  'cats',
  'content',
  'guides',
  'protocols',
  'ong',
  'igent-almanac',
  'partners',
  'notices',
  'store',
  'financial',
  'prospects',
  'meta-ads',
  'instagram-outreach',
  'ambassadors',
  'campaign-studio',
  'campaign-genese',
  'copy-bank',
  'funnel-builder',
  'ops-center',
  'revenue-journey',
  'market-intel',
  'strategy',
  'network-ops',
  'expansion',
  'venture-os',
  'entitlements',
  'analytics',
  'funil',
  'settings',
]);

const TAB_ALIASES = {
  overview: 'dashboard',
  market: 'market-intel',
  genese: 'campaign-genese',
  genesis: 'campaign-genese',
};

function normalizeTab(value) {
  const raw = String(value || '').trim();
  const tab = TAB_ALIASES[raw] || raw;
  return ADMIN_TABS.has(tab) ? tab : 'dashboard';
}

export default function AdminDashboard() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTabState] = useState(() => normalizeTab(searchParams.get('tab') || params.tab));

  useEffect(() => {
    setActiveTabState(normalizeTab(searchParams.get('tab') || params.tab));
  }, [params.tab, searchParams]);

  const setActiveTab = (tab) => {
    const nextTab = normalizeTab(tab);
    setActiveTabState(nextTab);
    setSearchParams(nextTab === 'dashboard' ? {} : { tab: nextTab }, { replace: true });
  };

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

      case 'guides':
        return <AdminGuideEditor />;

      case 'protocols':
        return <AdminProtocolEditor />;

      case 'ong':
        return <AdminOng />;

      case 'igent-almanac':
        return <AdminIgentAlmanac />;

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

      case 'ambassadors':
        return <AdminAmbassadors />;

      case 'campaign-studio':
        return <AdminCampaignStudio />;

      case 'campaign-genese':
        return <AdminCampaignGenese />;

      case 'copy-bank':
        return <AdminCopyBank />;

      case 'funnel-builder':
        return <AdminFunnelBuilder />;

      case 'ops-center':
        return <AdminOpsCenter />;

      case 'revenue-journey':
        return <AdminRevenueJourney />;

      case 'market-intel':
        return <AdminMarketIntelligence />;

      case 'strategy':
        return <AdminStrategicPlan />;

      case 'network-ops':
        return <AdminNetworkOps />;

      case 'expansion':
        return <AdminExpansionRadar />;

      case 'venture-os':
        return <AdminVentureOS />;

      case 'entitlements':
        return <AdminEntitlements />;

      case 'analytics':
        return <AdminAnalytics />;

      case 'funil':
        return <AdminFunil />;

      case 'settings':
        return <AdminSettings />;

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
