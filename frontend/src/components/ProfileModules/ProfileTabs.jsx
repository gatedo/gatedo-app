import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, TrendingUp, ShieldAlert, Syringe, FileText } from 'lucide-react';

export default function ProfileTabs({ activeTab, setActiveTab, touch }) {
  const tabs = [
    { id: 'BIO', label: 'Bio', icon: Book, color: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100' },
    { id: 'EVOLUCAO', label: 'Evolução', icon: TrendingUp, color: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-100' },
    { id: 'SAUDE', label: 'Saúde', icon: ShieldAlert, color: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-100' },
    { id: 'IMUNIZANTES', label: 'Vacinas', icon: Syringe, color: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100' },
    { id: 'DOCUMENTOS', label: 'Docs', icon: FileText, color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-100' },
  ];

  return (
    <div className="w-full py-4 mb-2">
      <div className="flex items-center justify-center gap-2 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              layout // Adicionado para suavizar a troca de posição dos vizinhos
              onClick={() => { touch?.(); setActiveTab(tab.id); }}
              animate={{ 
                flex: isActive ? 3.5 : 1, // Aumento leve na expansão
              }}
              /* Ajuste de Mola: Mais rápido e com um "balanço" sutil */
              transition={{ 
                type: "spring", 
                stiffness: 450, // Mais rígida = mais rápida
                damping: 35,    // Menos amortecimento = mais viva
                mass: 0.8       // Menos massa = mais ágil
              }}
              className={`
                relative flex items-center justify-center h-12 rounded-2xl border transition-colors duration-200
                ${isActive 
                  ? `${tab.color} border-transparent shadow-lg shadow-black/10` 
                  : `bg-white ${tab.text} ${tab.border}`
                }
              `}
            >
              <motion.div layout className="flex items-center justify-center gap-2 px-2">
                <tab.icon 
                  size={18} 
                  className={`${isActive ? 'text-white' : tab.text} shrink-0`} 
                  strokeWidth={isActive ? 3 : 2.5} 
                />
                
                <AnimatePresence mode="popLayout">
                  {isActive && (
                    <motion.span 
                      initial={{ opacity: 0, x: -8, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap overflow-hidden"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}