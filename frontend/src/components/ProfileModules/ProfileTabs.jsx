import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Book,
  TrendingUp,
  Brain,
  ShieldAlert,
  Syringe,
  FileText,
} from 'lucide-react';

const TABS = [
  {
    id: 'BIO',
    label: 'Bio',
    mobileLabel: 'Bio',
    icon: Book,
    color: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-100',
  },
  {
    id: 'EVOLUCAO',
    label: 'Evolução',
    mobileLabel: 'Evolução',
    icon: TrendingUp,
    color: 'bg-rose-500',
    text: 'text-rose-600',
    border: 'border-rose-100',
  },
  {
    id: 'COMPORTAMENTO',
    label: 'Comportamento',
    mobileLabel: 'Comporta.',
    icon: Brain,
    color: 'bg-fuchsia-500',
    text: 'text-fuchsia-600',
    border: 'border-fuchsia-100',
  },
  {
    id: 'SAUDE',
    label: 'Saúde',
    mobileLabel: 'Saúde',
    icon: ShieldAlert,
    color: 'bg-emerald-500',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
  },
  {
    id: 'IMUNIZANTES',
    label: 'Imunização',
    mobileLabel: 'Imuniz.',
    icon: Syringe,
    color: 'bg-indigo-500',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
  },
  {
    id: 'DOCUMENTOS',
    label: 'Docs',
    mobileLabel: 'Docs',
    icon: FileText,
    color: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-100',
  },
];

const spring = {
  type: 'spring',
  stiffness: 360,
  damping: 32,
  mass: 0.72,
};

const TabButton = memo(function TabButton({ tab, isActive, onPress }) {
  const Icon = tab.icon;

  return (
    <motion.button
      type="button"
      onClick={onPress}
      initial={false}
      animate={{
        flexGrow: isActive ? 2.35 : 1,
        opacity: isActive ? 1 : 0.98,
        scale: isActive ? 1 : 0.985,
      }}
      transition={spring}
      className={`
        relative flex items-center justify-center h-11 rounded-2xl border transition-colors duration-200
        min-w-[50px] sm:min-w-[56px] will-change-transform [transform:translateZ(0)]
        ${isActive
          ? `${tab.color} border-transparent shadow-md shadow-black/8`
          : `bg-white ${tab.text} ${tab.border}`
        }
      `}
      aria-pressed={isActive}
    >
      <div className="flex items-center justify-center gap-1.5 px-2 sm:px-2.5 min-w-0">
        <Icon
          size={16}
          className={`${isActive ? 'text-white' : tab.text} shrink-0`}
          strokeWidth={isActive ? 2.8 : 2.35}
        />

        <motion.span
          initial={false}
          animate={{
            opacity: isActive ? 1 : 0,
            width: isActive ? 'auto' : 0,
            marginLeft: isActive ? 0 : -2,
          }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.08em] sm:tracking-[0.12em] text-white whitespace-nowrap overflow-hidden"
        >
          <span className="sm:hidden">{tab.mobileLabel}</span>
          <span className="hidden sm:inline">{tab.label}</span>
        </motion.span>
      </div>
    </motion.button>
  );
});

function ProfileTabs({ activeTab, setActiveTab, touch }) {
  const tabs = useMemo(() => TABS, []);

  const handleTabClick = useCallback(
    (tabId) => {
      if (tabId === activeTab) return;
      touch?.();
      setActiveTab(tabId);
    },
    [activeTab, setActiveTab, touch]
  );

  return (
    <div className="w-full py-3 mb-2">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] pb-1">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onPress={() => handleTabClick(tab.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileTabs);
