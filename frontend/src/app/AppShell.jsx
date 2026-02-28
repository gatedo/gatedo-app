import React, { useState, useEffect } from 'react';
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

// Home e Gatos
import Home from '../pages/Home';
import Cats from '../pages/Cats';
import CatProfile from '../pages/CatProfile';
import CatEdit from '../pages/CatEdit';
import CatDiary from '../pages/CatDiary';
import CatAlmanac from '../pages/CatAlmanac';
import AddCat from '../pages/AddCat';
import FolderList from '../pages/FolderList';


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

// Studio
import StudioPortrait from '../pages/StudioPortrait';
import StudioID from '../pages/StudioID';
import StudioMagazine from '../pages/StudioMagazine';
import Memorial from '../pages/Memorial';

import Creative from '../pages/Creative';
import Settings from '../pages/Settings';
import Support from '../pages/Support';
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

import NotFound from '../pages/NotFound';
import Comunigato from '../pages/Comunigato';
import CatSocialProfile from '../pages/CatSocialProfile';

const AppShell = () => {
  const location = useLocation();
  const { playMeow } = useSound();
  const { installPrompt, handleInstallClick } = usePWAInstall();
  
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    playMeow('soft'); 

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [location.pathname]);

const hideNavRoutes = ['/', '/login', '/register', '/welcome', '/welcome-founder', '/splash', '/add-cat', '/cat-new', 'profile/edit', 'cat/:id/edit'];
 const shouldHideNav = hideNavRoutes.includes(location.pathname) || location.pathname.startsWith('/admin');
 
  return (
    <LayoutWrapper>
      <div className="app-shell bg-[#f4f3ff] min-h-screen flex flex-col relative overflow-x-hidden">
        
        <AnimatePresence>
          {isTransitioning && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#f4f3ff]"
            >
              <LoadingScreen isVisible={true} />
            </motion.div>
          )}
        </AnimatePresence>

        <HealthBanner />

        {installPrompt && (
          <div onClick={handleInstallClick} className="bg-[#6158ca] p-2 text-white text-[10px] font-black uppercase tracking-[2px] text-center cursor-pointer relative z-50">
            Instalar Gatedo no seu Celular 🐾
          </div>
        )}

        <main className="flex-1 overflow-x-hidden w-full">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Splash />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />
              <Route path="/verify-email"    element={<VerifyEmail />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/welcome-founder" element={<WelcomeFounder />} />
                <Route path="/home" element={<Home />} />
                
                {/* Gatos */}
                <Route path="/cats" element={<Cats />} />
                <Route path="/cat-new" element={<AddCat />} />
                <Route path="/cat/:id" element={<CatProfile />} />
                <Route path="/cat/:id/edit" element={<CatEdit />} /> 
                <Route path="/cat/:id/diary" element={<CatDiary />} />
                <Route path="/cat/:id/almanac" element={<CatAlmanac />} />
                <Route path="/cat/:id/folder/:folderId" element={<FolderList />} />
                <Route path="/cat/:id/health-new" element={<HealthForm />} />

                {/* Conteúdo */}
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/notifications" element={<NotificationCenter />} />
                <Route path="/wiki" element={<Wiki />} />
                <Route path="/wiki-vaccines" element={<WikiVaccines />} />
                <Route path="/wiki-breeds" element={<WikiBreeds />} />
                <Route path="/wiki-srd" element={<WikiSRD />} />
                <Route path="/memorial" element={<Memorial />} />

                {/* IA / Social */}
                <Route path="/igent-help" element={<IGentHelp />} />
                <Route path="/igent-vet" element={<IGentVet />} />
                <Route path="/vets" element={<VetsDoBem />} />
                <Route path="/tutor-profile" element={<TutorProfile />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/comunigato" element={<Comunigato />} />
                <Route path="/gato/:catId" element={<CatSocialProfile />} />
                <Route path="/clube" element={<Clube />} />
                <Route path="/ongs" element={<Ongs />} />
                <Route path="/store" element={<Store />} />
                
                
                {/* Studio */}
                <Route path="/studio" element={<Studio />} />
                <Route path="/studio/portrait" element={<StudioPortrait />} />
                <Route path="/studio/id" element={<StudioID />} />
                <Route path="/studio/magazine" element={<StudioMagazine />} />
                
                
                {/* Outros */}
                <Route path="/creative" element={<Creative />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/support" element={<Support />} />

                {/* 🛠️ AJUSTE: Rota de detalhe de produto aponta para Store ou um componente visual */}
                <Route path="/product/:id" element={<Store />} /> 

                {/* Admin */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/cats" element={<AdminCats />} />
                <Route path="/admin/content" element={<AdminContent />} />
                <Route path="/admin/financial" element={<AdminFinancial />} />
                <Route path="/admin/overview" element={<AdminOverview />} />
                <Route path="/admin/partners" element={<AdminPartners />} />
                <Route path="/admin/store" element={<AdminStore />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </main>

        {!shouldHideNav && <BottomNav />}
      </div>
    </LayoutWrapper>
  );
};

export default AppShell;