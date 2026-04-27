import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';

import ProfileHeader from '../components/ProfileModules/ProfileHeader';
import ProfileTabs from '../components/ProfileModules/ProfileTabs';
import ProfileContent from '../components/ProfileModules/ProfileContent';
import ProfileFAB from '../components/ProfileModules/ProfileFAB';
import ProfileHealthBar from '../components/ProfileModules/ProfileHealthBar';
import EditProfileModal from '../components/ProfileModules/ProfileSections/EditProfileModal';

import api from '../services/api';

const ALLOWED_TABS = new Set([
  'BIO',
  'SAUDE',
  'EVOLUCAO',
  'COMPORTAMENTO',
  'IMUNIZANTES',
  'DOCUMENTOS',
]);

function normalizeTab(tab) {
  const value = String(tab || '').toUpperCase();
  return ALLOWED_TABS.has(value) ? value : 'BIO';
}

export default function CatProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const touch = useSensory();
  const { user: loggedUser } = useContext(AuthContext);

  const scrollToDocuments = useCallback((delay = 220) => {
    const timer = setTimeout(() => {
      const el = document.getElementById('documents');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const scrollToTarget = useCallback((targetId, delay = 260) => {
    if (!targetId) return undefined;

    const timer = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('gatedo-target-pulse');
      window.setTimeout(() => el.classList.remove('gatedo-target-pulse'), 1800);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const initialTabFromUrl = useMemo(() => {
    if (location.hash === '#documents') return 'DOCUMENTOS';
    if (['#health-treatments', '#health-predictive'].includes(location.hash)) return 'SAUDE';
    if (location.hash === '#immunization-alerts') return 'IMUNIZANTES';

    const tab = searchParams.get('tab')?.toUpperCase();
    return normalizeTab(tab);
  }, [searchParams, location.hash]);

  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTabFromUrl);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showMemorialContent, setShowMemorialContent] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const fetchCatData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/pets/${id}`);
      setCat(response.data);
    } catch (error) {
      console.error('Erro ao carregar gato:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCatData();
  }, [fetchCatData]);

  useEffect(() => {
    if (location.hash === '#documents') {
      setActiveTab('DOCUMENTOS');
      return scrollToDocuments(220);
    }

    const targetFromHash = location.hash ? location.hash.replace('#', '') : '';
    if (targetFromHash === 'health-treatments' || targetFromHash === 'health-predictive') {
      setActiveTab('SAUDE');
      return scrollToTarget(targetFromHash, targetFromHash === 'health-predictive' ? 140 : 320);
    }

    if (targetFromHash === 'immunization-alerts') {
      setActiveTab('IMUNIZANTES');
      return scrollToTarget(targetFromHash, 320);
    }

    const tab = searchParams.get('tab')?.toUpperCase();
    if (tab) {
      setActiveTab(normalizeTab(tab));
    }
  }, [searchParams, location.hash, scrollToDocuments, scrollToTarget]);

  useEffect(() => {
    const transientState = location.state || {};
    const {
      restoreTab,
      backTab,
      scrollToDocuments: shouldScrollToDocuments,
      openHealthTab,
      scrollTarget,
      highlightTarget,
      ...safeState
    } = transientState;

    let consumed = false;
    let nextTab = null;

    if (restoreTab) {
      nextTab = normalizeTab(restoreTab);
      consumed = true;
    } else if (backTab) {
      nextTab = normalizeTab(backTab);
      consumed = true;
    } else if (openHealthTab) {
      nextTab = 'SAUDE';
      consumed = true;
    } else if (shouldScrollToDocuments) {
      nextTab = 'DOCUMENTOS';
      consumed = true;
    } else if (scrollTarget || highlightTarget) {
      const target = scrollTarget || highlightTarget;
      if (target === 'health-treatments' || target === 'health-predictive') nextTab = 'SAUDE';
      if (target === 'immunization-alerts') nextTab = 'IMUNIZANTES';
      consumed = true;
    }

    if (!consumed) return;

    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }

    if (nextTab === 'DOCUMENTOS' || shouldScrollToDocuments) {
      scrollToDocuments(220);
    }

    if (scrollTarget || highlightTarget) {
      scrollToTarget(scrollTarget || highlightTarget, 320);
    }

    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: Object.keys(safeState).length ? safeState : null,
    });
  }, [
    location.pathname,
    location.search,
    location.hash,
    location.state,
    activeTab,
    navigate,
    scrollToDocuments,
  ]);

  const isInMemoriam = cat?.isArchived || cat?.isMemorial;
  const tutorFirstName =
    cat?.owner?.name?.split(' ')[0] || loggedUser?.name?.split(' ')[0] || 'Tutor';

  if (loading || !cat) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black uppercase text-gray-300">
        Carregando Gatedo...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pb-40 pt-6 px-0 transition-all duration-700 ${
        isInMemoriam && !showMemorialContent ? 'bg-gray-200 overflow-hidden' : 'bg-[var(--gatedo-light-bg)]'
      }`}
    >
      <AnimatePresence>
        {isInMemoriam && !showMemorialContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="fixed inset-0 z-[2000] bg-gray-200/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-8 w-full max-w-xs"
            >
              <div className="relative mx-auto w-fit">
                <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl bg-white grayscale mx-auto">
                  <img
                    src={cat.photoUrl || '/placeholder-cat.png'}
                    alt={cat.name}
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>

                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg">
                  <Heart size={20} className="text-rose-400 fill-rose-400" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-black text-gray-600 uppercase tracking-tighter">
                  {tutorFirstName},
                </h3>

                <p className="text-gray-500 font-medium leading-tight text-sm">
                  Gostaria de relembrar os momentos com
                  <br />
                  <span className="font-black text-gray-700 tracking-tight">{cat.name}</span>?
                </p>
              </div>

              <button
                onClick={() => setShowMemorialContent(true)}
                className="w-full py-4 rounded-2xl bg-white text-gray-700 font-black uppercase tracking-wide shadow-lg active:scale-[0.98] transition"
              >
                Ver memorial
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`transition-all duration-1000 ${
          isInMemoriam && !showMemorialContent
            ? 'blur-2xl grayscale opacity-20 scale-90 pointer-events-none'
            : 'blur-0 grayscale-0 opacity-100 scale-100'
        }`}
      >
        <ProfileHeader
          cat={cat}
          id={id}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onEdit={() => setIsEditProfileOpen(true)}
          onOpenDiary={() => navigate(`/cat/${id}/diary`)}
          restoreTab={location.state?.restoreTab}
          backTab={location.state?.backTab}
          onBack={() => {
            const restoreTab = normalizeTab(location.state?.restoreTab);
            const backTab = normalizeTab(location.state?.backTab);

            if (location.state?.restoreTab && restoreTab !== activeTab) {
              setActiveTab(restoreTab);

              if (restoreTab === 'DOCUMENTOS' || location.state?.scrollToDocuments) {
                scrollToDocuments(180);
              }
              return;
            }

            if (location.state?.backTab && backTab !== activeTab) {
              setActiveTab(backTab);

              if (backTab === 'DOCUMENTOS' || location.state?.scrollToDocuments) {
                scrollToDocuments(180);
              }
              return;
            }

            if (window.history.length > 1) {
              navigate(-1);
              return;
            }

            navigate('/app');
          }}
        />

        <div className="sticky top-[72px] z-30 px-4 pt-2 pb-2 bg-[color:var(--gatedo-light-bg)]/92 backdrop-blur-md">
          <ProfileHealthBar cat={cat} />
        </div>

        <div className="px-4">
          <ProfileTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            touch={touch}
          />
        </div>

        <ProfileContent
          activeTab={activeTab}
          cat={cat}
          touch={touch}
          navigate={navigate}
          refreshCat={fetchCatData}
        />
      </div>

      <ProfileFAB
        id={id}
        cat={cat}
        isFabOpen={isFabOpen}
        setIsFabOpen={setIsFabOpen}
        navigate={navigate}
        refreshCat={fetchCatData}
      />

      <AnimatePresence>
        {isEditProfileOpen && (
          <EditProfileModal
            isOpen={isEditProfileOpen}
            onClose={() => setIsEditProfileOpen(false)}
            cat={cat}
            refreshCat={fetchCatData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
