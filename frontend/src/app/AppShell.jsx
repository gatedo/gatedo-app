import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { AnimatePresence, motion } from 'framer-motion';
import LayoutWrapper from '../components/LayoutWrapper';

// Componentes Globais e Hooks
import BottomNav from '../components/BottomNav';
import { LoadingScreen } from '../components/LoadingScreen';
import { HealthBanner } from '../components/BannerAlert';
import { useSound } from '../hooks/useSound';
import { usePWAInstall } from '../hooks/usePWAInstall';
import NotificationCenter from '../components/NotificationCenter';

// Autenticação e Entrada
import Splash from '../pages/Splash';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import Welcome from '../pages/Welcome';
import WelcomeFounder from '../pages/WelcomeFounder';
import ThankYou from '../pages/Thankyou';
import TermsOfUse from '../pages/legal/TermsOfUse';
import PrivacyPolicy from '../pages/legal/PrivacyPolicy';

// Home e Gatos
import Home from '../pages/Home';
import Cats from '../pages/Cats';
import CatProfile from '../pages/CatProfile';
import CatEdit from '../pages/CatEdit';
import CatDiary from '../pages/CatDiary';
import CatAlmanac from '../pages/CatAlmanac';
import AddCat from '../pages/AddCat';
import FolderList from '../pages/FolderList';
import CatGame from '../pages/CatGame';

// Saúde e IA
import HealthForm from '../pages/HealthForm';
import IGentHelp from '../pages/IGentHelp';
import IGentVet from '../pages/IGentVet';
import WikiVaccines from '../pages/WikiVaccines';
import VetsDoBem from '../pages/VetsDoBem';

// Tutor e Social
import TutorProfile from '../pages/TutorProfile';
import ProfileEdit from '../pages/ProfileEdit';
import Clube from '../pages/Clube';
import Ongs from '../pages/Ongs';
import Store from '../pages/Store';
import Studio from '../pages/Studio';
import Wiki from '../pages/Wiki';
import WikiBreeds from '../pages/WikiBreeds';
import WikiSRD from '../pages/WikiSRD';
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

import NotFound from '../pages/NotFound';
import Comunigato from '../pages/Comunigato';
import CatSocialProfile from '../pages/CatSocialProfile';

// ─── Rotas onde o LoadingScreen NÃO deve aparecer ────────────────────────────
const NO_LOADING_ROUTES = [
  '/',
  '/splash',
  '/welcome',
  '/welcome-founder',
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
];

// ─── Rotas que exibem a BottomNav ─────────────────────────────────────────────
// ⚠️  Formulários de adição/edição foram REMOVIDOS desta lista:
//    - /cat-new   → formulário de adicionar gato
//    As demais exceções são tratadas em shouldShowBottomNav (sufixos /edit, /health-new)
const APP_ROUTES_WITH_NAV = [
  '/home',
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
  '/clube',
  '/planos',
  '/obrigado',
  '/terms',
  '/termos',
  '/privacy',
  '/privacidade',
  '/auth/register',
  '/auth/login',
  // Formulários de adição de gato e dados pessoais
  '/cat-new',
  '/profile/edit',
];

const APP_BG = '#e6e6ff';
const APP_THEME = '#823fff';

const AppShell = () => {
  const location = useLocation();
  const { playMeow } = useSound();
  const { installPrompt, handleInstallClick } = usePWAInstall();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bottomNavForcedHidden, setBottomNavForcedHidden] = useState(false);

  // Congela o estado da nav durante a transição para não desmontar/remontar
  // o BottomNav no meio do loading — isso quebraria o efeito morph dos botões.
  // O valor só é atualizado depois que a animação de loading termina.
  const [navVisible, setNavVisible] = useState(false);

  const pathname = location.pathname;

  const isNoLoadingRoute = (path) =>
    NO_LOADING_ROUTES.includes(path) ||
    PUBLIC_ROUTES_WITHOUT_NAV.includes(path) ||
    path.startsWith('/admin') ||
    path.startsWith('/auth');

  useEffect(() => {
    if (isNoLoadingRoute(pathname)) {
      // Sem loading: atualiza nav imediatamente
      setNavVisible(shouldShowBottomNav);
      return;
    }

    setIsTransitioning(true);
    playMeow('soft');

    const timer = setTimeout(() => {
      setIsTransitioning(false);
      // Só atualiza a nav DEPOIS que o loading fecha —
      // assim o BottomNav nunca é desmontado no meio da animação morph.
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
      // ── Exceções: formulários de edição e saúde sob /cat/:id ──────────────
      if (pathname.startsWith('/cat/')) {
        if (pathname.endsWith('/edit'))       return false; // editar gato
        if (pathname.endsWith('/health-new')) return false; // novo registro de saúde
      }
      return true;
    }

    return false;
  }, [pathname]);


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

        {installPrompt && (
          <div
            onClick={handleInstallClick}
            className="bg-[#823fff] p-2 text-white text-[10px] font-black uppercase tracking-[2px] text-center cursor-pointer relative z-50"
          >
            Instalar Gatedo no seu Celular 🐾
          </div>
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
              <Route path="/clube" element={<Clube />} />
              <Route path="/planos" element={<Clube />} />
              <Route path="/obrigado" element={<ThankYou />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="/termos" element={<TermsOfUse />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />

                <Route path="/cats" element={<Cats />} />
                <Route path="/cat-new" element={<AddCat />} />
                <Route path="/cat/:id" element={<CatProfile />} />
                <Route path="/cat/:id/edit" element={<CatEdit />} />
                <Route path="/cat/:id/diary" element={<CatDiary />} />
                <Route path="/cat/:id/almanac" element={<CatAlmanac />} />
                <Route path="/cat/:id/folder/:folderId" element={<FolderList />} />
                <Route path="/cat/:id/health-new" element={<HealthForm />} />
                <Route path="/memorial/intro/:petId" element={<Memorial />} />

                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/notification-center" element={<NotificationCenter />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/wiki" element={<Wiki />} />
                <Route path="/wiki-vaccines" element={<WikiVaccines />} />
                <Route path="/wiki-breeds" element={<WikiBreeds />} />
                <Route path="/wiki-srd" element={<WikiSRD />} />
                <Route path="/memorial" element={<Memorial />} />

                <Route path="/igent-help" element={<IGentHelp />} />
                <Route path="/igent-vet" element={<IGentVet />} />
                <Route path="/vets" element={<VetsDoBem />} />
                <Route path="/tutor-profile" element={<TutorProfile />} />
                <Route path="/gamificacao" element={<TutorProfile />} />
                <Route path="/gamification" element={<TutorProfile />} />
                <Route path="/jornada-gatedo" element={<JornadaGatedo />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/comunigato" element={<Comunigato />} />
                <Route path="/gato/:catId" element={<CatSocialProfile />} />
                <Route path="/ongs" element={<Ongs />} />
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

                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/cats" element={<AdminCats />} />
                <Route path="/admin/content" element={<AdminContent />} />
                <Route path="/admin/financial" element={<AdminFinancial />} />
                <Route path="/admin/overview" element={<AdminOverview />} />
                <Route path="/admin/partners" element={<AdminPartners />} />
                <Route path="/admin/store" element={<AdminStore />} />
                <Route path="/admin/notices" element={<AdminNoticesPage />} />
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
