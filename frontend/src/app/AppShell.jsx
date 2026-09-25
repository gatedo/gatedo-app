import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { AnimatePresence, motion } from 'framer-motion';
import LayoutWrapper from '../components/LayoutWrapper';
import { AuthContext } from '../context/AuthContext';
import { captureFirstTouch } from '../utils/attribution';
import { track } from '../utils/track';

// Componentes Globais e Hooks
import BottomNav from '../components/BottomNav';
import { LoadingScreen } from '../components/LoadingScreen';
import { HealthBanner } from '../components/BannerAlert';
import { useSound } from '../hooks/useSound';
import { usePWAInstall } from '../hooks/usePWAInstall';
import NotificationCenter from '../components/NotificationCenter';
import { Smartphone, X } from 'lucide-react';

// Autenticação e Entrada
import Splash from '../pages/Splash';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import Welcome from '../pages/Welcome';
import WelcomeFounder from '../pages/WelcomeFounder';
import WelcomeMembership from '../pages/WelcomeMembership';
import Onboarding from '../pages/Onboarding';
import GatedoEmbaixadoras from '../pages/GatedoEmbaixadoras';
import ThankYou from '../pages/Thankyou';
import TermsOfUse from '../pages/legal/TermsOfUse';
import PrivacyPolicy from '../pages/legal/PrivacyPolicy';

// Home e Gatos
import Home from '../pages/Home';
import Health from '../pages/Health';
import More from '../pages/More';
import Gatedoland from '../pages/Gatedoland';
import Cats from '../pages/Cats';
import CatProfile from '../pages/CatProfile';
import CatEdit from '../pages/CatEdit';
import CatDiary from '../pages/CatDiary';
import CatAlmanac from '../pages/CatAlmanac';
import Guia from '../pages/Guia';
import GuiaEntry from '../pages/GuiaEntry';
import Protocolos from '../pages/Protocolos';
import Protocolo from '../pages/Protocolo';
import AddCat from '../pages/AddCat';
import FolderList from '../pages/FolderList';
import CatGame from '../pages/CatGame';

// Saúde e IA
import HealthForm from '../pages/HealthForm';
import IGentHelp from '../pages/IGentHelp';
import IGentVet from '../pages/IGentVet';
import IGentVetAbout from '../pages/IGentVetAbout';
import WikiVaccines from '../pages/WikiVaccines';
import VetsDoBem from '../pages/VetsDoBem';

// Tutor e Social
import TutorProfile from '../pages/TutorProfile';
import ProfileEdit from '../pages/ProfileEdit';
import Clube from '../pages/Clube';
import Ongs from '../pages/Ongs';
import OngApply from '../pages/OngApply';
import OngDashboard from '../pages/OngDashboard';
import AdoptInvite from '../pages/AdoptInvite';
import AdocaoBoasVindas from '../pages/AdocaoBoasVindas';
import Store from '../pages/Store';
import Studio from '../pages/Studio';
import Wiki from '../pages/Wiki';
import WikiBreeds from '../pages/WikiBreeds';
import WikiBreedDetail from '../pages/WikiBreedDetail';
import WikiSRD from '../pages/WikiSRD';
import WikiSRDDetail from '../pages/WikiSRDDetail';
import WikiWildFelines from '../pages/WikiWildFelines';
import WikiWildFelineDetail from '../pages/WikiWildFelineDetail';
import JornadaGatedo from '../pages/JornadaGatedo';

// Studio e Novidades
import StickerModulePage from '../pages/StickerModulePage';
import PortraitModulePage from '../pages/PortraitModulePage';
import CatIdModulePage from '../pages/CatIdModulePage';
import MindReaderModulePage from '../pages/MindReaderModulePage';
import TutorCatModulePage from '../pages/TutorCatModulePage';
import DanceModulePage from '../pages/DanceModulePage';
import AlertsPage from '../pages/AlertsPage';
import Memorial from '../pages/Memorial';

import Creative from '../pages/Creative';
import Settings from '../pages/Settings';
import Support from '../pages/Support';
import MundoGatedo from '../pages/MundoGatedo';
import NotificationsPage from '../pages/NotificationsPage';

// Admin
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminCats from '../pages/admin/AdminCats';
import AdminContent from '../pages/admin/AdminContent';
import AdminFinancial from '../pages/admin/AdminFinancial';
import AdminOverview from '../pages/admin/AdminOverview';
import AdminPartners from '../pages/admin/AdminPartners';
import AdminStore from '../pages/admin/AdminStore';
import AdminNoticesPage from '../pages/AdminNoticesPage';
import AdminMarketIntelligence from '../pages/admin/AdminMarketIntelligence';

import NotFound from '../pages/NotFound';
import Comunigato from '../pages/Comunigato';
import CatSocialProfile from '../pages/CatSocialProfile';

// ─── Rotas onde o LoadingScreen NÃO deve aparecer ────────────────────────────
const NO_LOADING_ROUTES = [
  '/',
  '/splash',
  '/welcome',
  '/welcome-founder',
  '/embaixadoras',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/obrigado',
  '/terms',
  '/termos',
  '/privacy',
  '/privacidade',
  '/clube',
  '/planos',
  '/cat-game',
  '/onboarding',
];

// ─── Rotas que exibem a BottomNav ─────────────────────────────────────────────
const APP_ROUTES_WITH_NAV = [
  '/home',
  '/health',
  '/more',
  '/gatedoland',
  '/cats',
  '/notifications',
  '/notification-center',
  '/alerts',
  '/wiki',
  '/wiki-vaccines',
  '/wiki-breeds',
  '/wiki-srd',
  '/memorial',
  '/igent-help',
  '/igent-vet',
  '/igent-vet/sobre',
  '/guia',
  '/protocolos',
  '/vets',
  '/tutor-profile',
  '/gamificacao',
  '/gamification',
  '/comunigato',
  '/ongs',
  '/store',
  '/studio',
  '/creative',
  '/settings',
  '/support',
  '/mundo-gatedo',
  '/jornada-gatedo',
  '/cat-game',
];

const APP_ROUTE_PREFIXES_WITH_NAV = [
  '/cat/',
  '/gato/',
  '/studio/',
  '/product/',
];

// ─── Rotas públicas / pré-venda / auth sem nav ───────────────────────────────
const PUBLIC_ROUTES_WITHOUT_NAV = [
  '/',
  '/splash',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/welcome',
  '/welcome-founder',
  '/embaixadoras',
  '/clube',
  '/planos',
  '/obrigado',
  '/terms',
  '/termos',
  '/privacy',
  '/privacidade',
  '/auth/register',
  '/auth/login',
  '/cat-new',
  '/profile/edit',
  '/onboarding',
];

const APP_BG = '#e6e6ff';
const APP_THEME = '#823fff';

const AppShell = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useContext(AuthContext) || {};
  const { playMeow } = useSound();

  useEffect(() => {
    captureFirstTouch();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    try {
      if (sessionStorage.getItem('gatedo_app_open_fired')) return;
      sessionStorage.setItem('gatedo_app_open_fired', '1');
    } catch {
      return;
    }
    const daysSinceSignup = user?.createdAt
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000)
      : null;
    track('app_open', { days_since_signup: daysSinceSignup });
  }, [authLoading, user?.id]);

  const { installPrompt, handleInstallClick } = usePWAInstall();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bottomNavForcedHidden, setBottomNavForcedHidden] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(() => {
    try { return sessionStorage.getItem('gatedo_pwa_install_dismissed') === '1'; } catch { return false; }
  });

  const [navVisible, setNavVisible] = useState(false);

  const pathname = location.pathname;

  const isNoLoadingRoute = (path) =>
    NO_LOADING_ROUTES.includes(path) ||
    PUBLIC_ROUTES_WITHOUT_NAV.includes(path) ||
    path.startsWith('/admin') ||
    path.startsWith('/auth');

  useEffect(() => {
    if (isNoLoadingRoute(pathname)) {
      setNavVisible(shouldShowBottomNav);
      return;
    }

    setIsTransitioning(true);
    playMeow('soft');

    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setNavVisible(shouldShowBottomNav);
    }, 1200);

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    document.body.style.backgroundColor = APP_BG;
    document.documentElement.style.backgroundColor = APP_BG;

    let themeMeta = document.querySelector("meta[name='theme-color']");
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', APP_THEME);

    return () => {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    const handleBottomNavVisibility = (event) => {
      setBottomNavForcedHidden(Boolean(event.detail?.hidden));
    };

    window.addEventListener('gatedo-bottom-nav-visibility', handleBottomNavVisibility);

    return () => {
      window.removeEventListener('gatedo-bottom-nav-visibility', handleBottomNavVisibility);
    };
  }, []);

  useEffect(() => {
    if (pathname !== '/cat-game') {
      setBottomNavForcedHidden(false);
    }
  }, [pathname]);

  // ─── Lógica de visibilidade da BottomNav ──────────────────────────────────
  const shouldShowBottomNav = useMemo(() => {
    if (pathname.startsWith('/admin')) return false;
    if (pathname.startsWith('/auth'))  return false;
    if (PUBLIC_ROUTES_WITHOUT_NAV.includes(pathname)) return false;

    if (APP_ROUTES_WITH_NAV.includes(pathname)) return true;

    if (APP_ROUTE_PREFIXES_WITH_NAV.some((prefix) => pathname.startsWith(prefix))) {
      if (pathname.startsWith('/cat/')) {
        if (pathname.endsWith('/edit'))       return false;
        if (pathname.endsWith('/health-new')) return false;
      }
      return true;
    }

    return false;
  }, [pathname]);

  const dismissInstallPrompt = (event) => {
    event.stopPropagation();
    setInstallDismissed(true);
    try { sessionStorage.setItem('gatedo_pwa_install_dismissed', '1'); } catch {}
  };


  return (
    <LayoutWrapper>
      <div className="app-shell bg-[var(--gatedo-light-bg)] min-h-screen flex flex-col relative overflow-x-hidden">

        {/* ── Loading Screen ── */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--gatedo-light-bg)]"
            >
              <LoadingScreen isVisible={true} />
            </motion.div>
          )}
        </AnimatePresence>

        <HealthBanner />

        {false && installPrompt && (
          <div
            onClick={handleInstallClick}
            className="bg-[#823fff] p-2 text-white text-[10px] font-black uppercase tracking-[2px] text-center cursor-pointer relative z-50"
          >
            Instalar Gatedo no seu Celular 🐾
          </div>
        )}

        {installPrompt && !installDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="fixed top-0 inset-x-0 z-[90] pointer-events-none flex justify-center"
          >
            <div
              onClick={handleInstallClick}
              className="pointer-events-auto flex h-[52px] max-h-[60px] w-full items-center justify-center gap-3 rounded-b-[26px] px-4 shadow-[0_14px_34px_rgba(70,30,150,0.28)] cursor-pointer"
              style={{
                width: 'clamp(260px, 50vw, 460px)',
                background: 'rgba(130,63,255,0.94)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderTop: 0,
                backdropFilter: 'blur(14px)',
              }}
            >
              <span className="w-8 h-8 rounded-full bg-white/16 flex items-center justify-center flex-shrink-0">
                <Smartphone size={15} className="text-white" />
              </span>
              <span className="text-white text-[10px] sm:text-xs font-black uppercase tracking-[1.4px] whitespace-nowrap">
                Instalar Gatedo
              </span>
              <button
                onClick={dismissInstallPrompt}
                className="w-7 h-7 rounded-full bg-white/14 flex items-center justify-center flex-shrink-0"
                aria-label="Fechar instalador"
              >
                <X size={13} className="text-white/80" />
              </button>
            </div>
          </motion.div>
        )}

        <main className="flex-1 overflow-x-hidden w-full">
          <AnimatePresence mode="wait">
            <Routes location={location} key={pathname}>
              <Route path="/" element={<Splash />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              <Route path="/welcome" element={<Welcome />} />
              <Route path="/welcome-founder" element={<WelcomeFounder />} />
              <Route path="/welcome-prime" element={<WelcomeMembership variant="prime" />} />
              <Route path="/welcome-vip" element={<WelcomeMembership variant="vip" />} />
              <Route path="/embaixadoras" element={<GatedoEmbaixadoras />} />
              <Route path="/embaixadoras/:token" element={<GatedoEmbaixadoras />} />
              <Route path="/clube" element={<Clube />} />
              <Route path="/planos" element={<Clube />} />
              <Route path="/obrigado" element={<ThankYou />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="/termos" element={<TermsOfUse />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/adotar/:token" element={<AdoptInvite />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/health" element={<Health />} />
                <Route path="/more" element={<More />} />
                <Route path="/gatedoland" element={<Gatedoland />} />

                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/cats" element={<Cats />} />
                <Route path="/cat-new" element={<AddCat />} />
                <Route path="/cat/:id" element={<CatProfile />} />
                <Route path="/cat/:id/edit" element={<CatEdit />} />
                <Route path="/cat/:id/diary" element={<CatDiary />} />
                <Route path="/cat/:id/almanac" element={<CatAlmanac />} />
                <Route path="/guia" element={<Guia />} />
                <Route path="/guia/:slug" element={<GuiaEntry />} />
                <Route path="/protocolos" element={<Protocolos />} />
                <Route path="/protocolos/:slug" element={<Protocolo />} />
                <Route path="/cat/:id/folder/:folderId" element={<FolderList />} />
                <Route path="/cat/:id/health-new" element={<HealthForm />} />
                <Route path="/memorial/intro/:petId" element={<Memorial />} />

                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/notification-center" element={<NotificationCenter />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/wiki" element={<Wiki />} />
                <Route path="/wiki-vaccines" element={<WikiVaccines />} />
                <Route path="/wiki-breeds" element={<WikiBreeds />} />
                <Route path="/wiki/breeds/:id" element={<WikiBreedDetail />} />
                <Route path="/wiki-srd" element={<WikiSRD />} />
                <Route path="/wiki-srd/:id" element={<WikiSRDDetail />} />
                <Route path="/wiki-wild-felines" element={<WikiWildFelines />} />
                <Route path="/wiki-wild-felines/:id" element={<WikiWildFelineDetail />} />
                <Route path="/memorial" element={<Memorial />} />

                <Route path="/igent-help" element={<IGentHelp />} />
                <Route path="/igent-vet" element={<IGentVet />} />
                <Route path="/igent-vet/sobre" element={<IGentVetAbout />} />
                <Route path="/vets" element={<VetsDoBem />} />
                <Route path="/tutor-profile" element={<TutorProfile />} />
                <Route path="/gamificacao" element={<TutorProfile />} />
                <Route path="/gamification" element={<TutorProfile />} />
                <Route path="/jornada-gatedo" element={<JornadaGatedo />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/comunigato" element={<Comunigato />} />
                <Route path="/gato/:catId" element={<CatSocialProfile />} />
                <Route path="/ongs" element={<Ongs />} />
                <Route path="/ong/apply" element={<OngApply />} />
                <Route path="/ong/dashboard" element={<OngDashboard />} />
                <Route path="/adocao/boas-vindas/:petId" element={<AdocaoBoasVindas />} />
                <Route path="/store" element={<Store />} />

                <Route path="/studio" element={<Studio />} />
                <Route path="/studio/sticker" element={<StickerModulePage />} />
                <Route path="/studio/portrait" element={<PortraitModulePage />} />
                <Route path="/studio/id" element={<CatIdModulePage />} />
                <Route path="/studio/mind-reader" element={<MindReaderModulePage />} />
                <Route path="/studio/tutor-cat" element={<TutorCatModulePage />} />
                <Route path="/studio/dance" element={<DanceModulePage />} />

                <Route path="/studio/magazine" element={<MindReaderModulePage />} />
                <Route path="/creative" element={<DanceModulePage />} />

                <Route path="/settings" element={<Settings />} />
                <Route path="/support" element={<Support />} />
                <Route path="/product/:id" element={<Store />} />
                <Route path="/mundo-gatedo" element={<MundoGatedo />} />
                <Route path="/cat-game" element={<CatGame />} />

                {/* ── Admin Routes ── */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/:tab" element={<AdminDashboard />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </main>

        {/* ── BottomNav: visível em rotas normais E durante o loading ── */}
        {navVisible && !bottomNavForcedHidden && (
          <div style={{ position: 'relative', zIndex: 99 }}>
            <BottomNav />
          </div>
        )}

      </div>
    </LayoutWrapper>
  );
};

export default AppShell;
