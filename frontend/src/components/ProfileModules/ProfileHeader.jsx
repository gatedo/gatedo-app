import React, { useEffect, useMemo, useState, memo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  Edit3,
  Globe,
  X,
  Book,
  TrendingUp,
  Brain,
  ShieldAlert,
  Syringe,
  Cat,
  BookOpen,
  FileText,
  Sparkles,
  Stethoscope,
  Shield,
  UserRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveThemeHex } from './CatIdentityCard';

const NUN = { fontFamily: 'Nunito, sans-serif' };

const NAV_ITEMS = [
  {
    id: 'DIARIO',
    label: 'Diário',
    subtitle: 'CatDiary',
    icon: BookOpen,
    color: '#F97316',
    bg: '#FFEDD5',
    action: 'route',
  },
  {
    id: 'PERFIL',
    label: 'Perfil',
    subtitle: 'Bio',
    icon: UserRound,
    color: '#F59E0B',
    bg: '#FEF3C7',
    action: 'tab',
    targetTab: 'BIO',
  },
  {
    id: 'NUTRICAO',
    label: 'Nutrição',
    subtitle: 'Evolução',
    icon: TrendingUp,
    color: '#22C55E',
    bg: '#DCFCE7',
    action: 'tab',
    targetTab: 'EVOLUCAO',
  },
  {
    id: 'DADOS_PREDITIVOS',
    label: 'Dados preditivos',
    subtitle: 'Saúde',
    icon: Sparkles,
    color: '#8B5CF6',
    bg: '#EDE9FE',
    action: 'tab',
    targetTab: 'SAUDE',
  },
  {
    id: 'VETS_CONSULTAS',
    label: 'Vets e consultas',
    subtitle: 'Saúde',
    icon: Stethoscope,
    color: '#14B8A6',
    bg: '#CCFBF1',
    action: 'tab',
    targetTab: 'SAUDE',
  },
  {
    id: 'VACINAS',
    label: 'Vacinas',
    subtitle: 'Imunização',
    icon: Syringe,
    color: '#3B82F6',
    bg: '#DBEAFE',
    action: 'tab',
    targetTab: 'IMUNIZANTES',
  },
  {
    id: 'PARASITARIOS',
    label: 'Parasitários',
    subtitle: 'Imunização',
    icon: Shield,
    color: '#6366F1',
    bg: '#E0E7FF',
    action: 'tab',
    targetTab: 'IMUNIZANTES',
  },
  {
    id: 'DOCS_RECEITAS',
    label: 'Docs e receitas',
    subtitle: 'Documentos',
    icon: FileText,
    color: '#EC4899',
    bg: '#FCE7F3',
    action: 'tab',
    targetTab: 'DOCUMENTOS',
  },
];

const SocialPill = memo(function SocialPill({ cat, onClick }) {
  const photo = cat?.photoUrl || null;
  const name = cat?.name || 'Gato';

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      title="Abrir perfil social do gato"
      style={{
        ...NUN,
        height: 40,
        maxWidth: 148,
        borderRadius: 999,
        padding: '0 10px 0 6px',
        border: 'none',
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(91,33,182,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          background: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
            }}
          />
        ) : (
          <Cat size={14} color="#4C1D95" />
        )}
      </div>

      <div
        style={{
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            ...NUN,
            fontSize: 8,
            fontWeight: 900,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: '#4C1D95',
            marginBottom: 3,
          }}
        >
          Comunigato
        </span>
        <span
          style={{
            ...NUN,
            fontSize: 10,
            fontWeight: 800,
            color: '#374151',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 86,
          }}
        >
          Perfil social
        </span>
      </div>
    </motion.button>
  );
});

const RightSidebar = memo(function RightSidebar({
  open,
  onClose,
  cat,
  activeTab,
  setActiveTab,
  themeHex,
  onEdit,
  onOpenSocial,
  onOpenDiary,
}) {
  const photo = cat?.photoUrl || null;
  const name = cat?.name || 'Gato';
  const breed = cat?.breed || 'Sem raça definida';
  const xpg = Number(cat?.xpg ?? cat?.petXp ?? cat?.xp ?? 0);
  const level = Number(cat?.petLevel ?? cat?.level ?? 1);
  const xpgToNext = Number(cat?.xpgToNextLevel ?? 100);
  const xpgPct = Math.min((xpg / Math.max(xpgToNext, 1)) * 100, 100);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleNavItemClick = (item) => {
    if (item.action === 'route' && item.id === 'DIARIO') {
      onOpenDiary?.();
      onClose?.();
      return;
    }

    if (item.action === 'tab' && item.targetTab) {
      setActiveTab?.(item.targetTab);
      onClose?.();
    }
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <>
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            margin: 0,
            padding: 0,
            background: 'rgba(0,0,0,0.52)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />

        <motion.div
          key="drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{
            ...NUN,
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            width: '78vw',
            maxWidth: 290,
            minWidth: 280,
            margin: 0,
            padding: 0,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '-8px 0 28px rgba(0,0,0,0.18)',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              background: `linear-gradient(135deg,${themeHex}20 0%,${themeHex}08 100%)`,
              borderBottom: `1px solid ${themeHex}18`,
              padding: '18px 18px 14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.07)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={13} color="#6B7280" />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 13 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 15,
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: `2.5px solid ${themeHex}45`,
                  background: `${themeHex}15`,
                  boxShadow: `0 4px 14px ${themeHex}28`,
                }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Cat size={22} color={themeHex} />
                  </div>
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    ...NUN,
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: themeHex,
                    marginBottom: 4,
                  }}
                >
                  Painel do gato
                </div>
                <div
                  style={{
                    ...NUN,
                    fontSize: 18,
                    fontWeight: 900,
                    color: '#111827',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 5,
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    ...NUN,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#6B7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {breed}
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 16,
                background: '#ffffff',
                border: `1px solid ${themeHex}20`,
                padding: '10px 12px',
                boxShadow: `0 6px 18px ${themeHex}12`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span
                  style={{
                    ...NUN,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Level {level}
                </span>
                <span
                  style={{
                    ...NUN,
                    fontSize: 10,
                    fontWeight: 900,
                    color: themeHex,
                  }}
                >
                  {xpg} XPG
                </span>
              </div>

              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: '#EEF2F7',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${xpgPct}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${themeHex}, ${themeHex}CC)`,
                    boxShadow: `0 0 14px ${themeHex}35`,
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '14px 12px 18px',
            }}
          >
            <div style={{ display: 'grid', gap: 8 }}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  item.action === 'tab' && item.targetTab
                    ? activeTab === item.targetTab
                    : false;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavItemClick(item)}
                    style={{
                      ...NUN,
                      width: '100%',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      textAlign: 'left',
                      padding: '11px 12px',
                      borderRadius: 16,
                      background: active ? item.bg : '#F8FAFC',
                      boxShadow: active ? `0 4px 14px ${item.color}18` : 'none',
                      outline: active ? `1px solid ${item.color}35` : '1px solid #EEF2F7',
                      transition: 'all .18s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: active ? item.color : '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={17} color={active ? '#fff' : '#6B7280'} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          ...NUN,
                          fontSize: 13,
                          fontWeight: 900,
                          color: '#111827',
                          lineHeight: 1.1,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          ...NUN,
                          fontSize: 10,
                          fontWeight: 800,
                          color: '#6B7280',
                          marginTop: 2,
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ height: 12 }} />

            <div style={{ display: 'grid', gap: 8 }}>
              <button
                onClick={() => {
                  onOpenSocial?.();
                  onClose?.();
                }}
                style={{
                  ...NUN,
                  width: '100%',
                  border: '1px solid #E9D5FF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  textAlign: 'left',
                  padding: '11px 12px',
                  borderRadius: 16,
                  background: '#FAF5FF',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Globe size={17} color="#fff" />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      ...NUN,
                      fontSize: 13,
                      fontWeight: 900,
                      color: '#111827',
                      lineHeight: 1.1,
                    }}
                  >
                    Perfil social
                  </div>
                  <div
                    style={{
                      ...NUN,
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#6B7280',
                      marginTop: 2,
                    }}
                  >
                    SocialProfile
                  </div>
                </div>
              </button>

              {!!onEdit && (
                <button
                  onClick={() => {
                    onClose?.();
                    onEdit?.();
                  }}
                  style={{
                    ...NUN,
                    width: '100%',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    textAlign: 'left',
                    padding: '11px 12px',
                    borderRadius: 16,
                    background: '#FFFFFF',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Edit3 size={17} color="#fff" />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        ...NUN,
                        fontSize: 13,
                        fontWeight: 900,
                        color: '#111827',
                        lineHeight: 1.1,
                      }}
                    >
                      Editar perfil
                    </div>
                    <div
                      style={{
                        ...NUN,
                        fontSize: 10,
                        fontWeight: 800,
                        color: '#6B7280',
                        marginTop: 2,
                      }}
                    >
                      ProfileEdit
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div style={{ height: 22 }} />
          </div>
        </motion.div>
      </>
    </AnimatePresence>,
    document.body
  );
});

function ProfileHeader({
  cat,
  id,
  activeTab,
  setActiveTab,
  onEdit,
  restoreTab,
  backTab,
  onBack,
  onOpenDiary,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const themeHex = useMemo(() => {
    return resolveThemeHex(cat?.themeColor || cat?.theme || cat?.profileColor || '#8B4AFF');
  }, [cat]);

  const currentLabel = useMemo(() => {
    switch (activeTab) {
      case 'EVOLUCAO':
        return 'Nutrição';
      case 'SAUDE':
        return 'Saúde';
      case 'IMUNIZANTES':
        return 'Imunização';
      case 'DOCUMENTOS':
        return 'Docs e receitas';
      case 'COMPORTAMENTO':
        return 'Comportamento';
      case 'BIO':
      default:
        return 'Perfil';
    }
  }, [activeTab]);

  const socialTargetId = cat?.id || id;

  const handleOpenSocial = useCallback(() => {
    if (!socialTargetId) return;

    navigate(`/gato/${socialTargetId}`, {
      state: {
        from: location.pathname,
        fromCatProfile: true,
        restoreTab: activeTab || restoreTab || backTab || 'BIO',
      },
    });
  }, [socialTargetId, navigate, location.pathname, activeTab, restoreTab, backTab]);

  const handleDiaryOpen = useCallback(() => {
    if (typeof onOpenDiary === 'function') {
      onOpenDiary();
      return;
    }

    if (!socialTargetId) return;
    navigate(`/cat/${socialTargetId}/diary`);
  }, [onOpenDiary, socialTargetId, navigate]);

  const handleBack = useCallback(() => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }

    if (restoreTab && restoreTab !== activeTab && setActiveTab) {
      setActiveTab(restoreTab);
      return;
    }

    if (backTab && backTab !== activeTab && setActiveTab) {
      setActiveTab(backTab);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (id) {
      navigate(`/cat/${id}`);
      return;
    }

    navigate('/app');
  }, [onBack, restoreTab, activeTab, setActiveTab, backTab, navigate]);

  return (
    <>
      <div
        style={{
          ...NUN,
          position: 'sticky',
          top: 0,
          zIndex: 0,
          
          
          padding: '16px 14px 40px',
          background: 'linear-gradient(to bottom, rgb(130, 63, 255), rgba(130, 63, 255, 0.51),)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div
          style={{
            position: 'relative',
            minHeight: 62,
            borderRadius: 999,
            background: '#ffffff',
            boxShadow: '0 10px 28px rgba(0,0,0,0.10)',
            display: 'flex',
            alignItems: 'center',
            padding: '8px 10px 8px 8px',
            gap: 8,
          }}
        >
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleBack}
            title="Voltar"
            style={{
              width: 44,
              height: 44,
              minWidth: 44,
              borderRadius: '50%',
              border: 'none',
              background: '#dedce4',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} color="#111827" />
          </motion.button>

          <div
            style={{
              minWidth: 0,
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                minWidth: 42,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#dedce4',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {cat?.photoUrl ? (
                <img
                  src={cat.photoUrl}
                  alt={cat?.name || 'Gato'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                  }}
                />
              ) : (
                <Cat size={18} color={themeHex} />
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1, lineHeight: 1 }}>
              <div
                style={{
                  ...NUN,
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: '#6B4F00',
                  marginBottom: 5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentLabel}
              </div>

              <div
                style={{
                  ...NUN,
                  fontSize: 15,
                  fontWeight: 900,
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cat?.name || 'Perfil do Gato'}
              </div>
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <SocialPill cat={cat} onClick={handleOpenSocial} />
          </div>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setSidebarOpen(true)}
            title="Abrir menu"
            style={{
              width: 44,
              height: 44,
              minWidth: 44,
              borderRadius: '50%',
              border: 'none',
              background: '#dedce4',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <MoreVertical size={18} color="#111827" />
          </motion.button>
        </div>
      </div>

      <RightSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        cat={cat}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        themeHex={themeHex}
        onEdit={onEdit}
        onOpenSocial={handleOpenSocial}
        onOpenDiary={handleDiaryOpen}
      />
    </>
  );
}

export default memo(ProfileHeader);
