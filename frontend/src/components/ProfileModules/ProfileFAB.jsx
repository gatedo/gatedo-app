import React, { useState } from 'react';
import { Syringe, PenTool, Stethoscope, Pill, Scale, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function ProfileFAB({
  id,
  cat,
  isFabOpen,
  setIsFabOpen,
  navigate,
  refreshCat,
}) {
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const saveWeight = async () => {
    if (!newWeight || !id) return;

    setLoading(true);
    try {
      const weightNum = parseFloat(String(newWeight).replace(',', '.'));

      await api.patch(`/pets/${id}`, { weight: weightNum });

      await api.post('/health-records', {
        petId: id,
        type: 'EXAM',
        title: `Check-in de Peso: ${weightNum}kg`,
        date: new Date(),
        notes: 'Peso registrado via FAB.',
      });

      await refreshCat?.();
      setIsWeightModalOpen(false);
      setNewWeight('');
    } catch (err) {
      console.error(err);
      alert('Não foi possível registrar o peso agora.');
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { label: 'Consulta',   icon: Stethoscope, color: '#6366F1', type: 'consultation' },
    { label: 'Medicação',  icon: Pill,         color: '#F59E0B', type: 'medicine' },
    { label: 'Vacina',     icon: Syringe,      color: '#EC4899', type: 'vaccine' },
    { label: 'Vermífugo',  icon: Pill,         color: '#3B82F6', type: 'vermifuge' },
    { label: 'Antipulgas', icon: Pill,         color: '#8B4AFF', type: 'parasite' },
    { label: 'Peso',       icon: Scale,        color: '#10B981', type: 'weight_quick' },
    { label: 'Diário',     icon: PenTool,      color: '#F97316', type: 'diary' },
  ];

  const handleAction = (action) => {
    setIsFabOpen(false);

    if (action.type === 'weight_quick') {
      setIsWeightModalOpen(true);
      return;
    }

    if (action.type === 'diary') {
      navigate?.(`/cat/${id}/diary`);
      return;
    }

    navigate?.(`/cat/${id}/health-new?type=${action.type}`);
  };

  return (
    <>
      <AnimatePresence>
        {isFabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFabOpen(false)}
            className="fixed inset-0 z-[998] bg-black/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-[96px] z-[999] pointer-events-none">
        <div className="mx-auto w-full max-w-[560px] px-4 sm:px-5">
          <div className="flex justify-end">
            <div className="flex flex-col items-end">
              <AnimatePresence>
                {isFabOpen && (
                  <div className="flex flex-col items-end mb-3">
                    {actions.map((action, idx) => (
                      <motion.button
                        key={action.type}
                        initial={{ opacity: 0, x: 20, scale: 0.85 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.85 }}
                        transition={{
                          delay: idx * 0.04,
                          type: 'spring',
                          stiffness: 400,
                          damping: 28,
                        }}
                        onClick={() => handleAction(action)}
                        className="flex items-center gap-3 mb-2.5 pointer-events-auto"
                      >
                        <span className="bg-white/95 px-3 py-1.5 rounded-2xl text-[11px] font-black shadow-lg text-gray-700 uppercase tracking-wide border border-gray-100">
                          {action.label}
                        </span>

                        <div
                          className="w-11 h-11 rounded-2xl shadow-lg flex items-center justify-center text-white flex-shrink-0"
                          style={{
                            background: action.color,
                            boxShadow: `0 4px 16px ${action.color}55`,
                          }}
                        >
                          <action.icon size={18} />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <motion.button
                type="button"
                onClick={() => setIsFabOpen((prev) => !prev)}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="w-14 h-14 rounded-[20px] flex items-center justify-center text-white pointer-events-auto"
                style={
                  isFabOpen
                    ? {
                        background: '#1F1F2E',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      }
                    : {
                        background: 'linear-gradient(135deg, #8B4AFF, #6B30E0)',
                        boxShadow:
                          '0 0 0 3px rgba(223,255,64,0.35), 0 8px 28px rgba(139,74,255,0.55)',
                        border: '3px solid white',
                      }
                }
              >
                <motion.div
                  animate={{ rotate: isFabOpen ? 45 : 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                >
                  {isFabOpen ? (
                    <X size={24} />
                  ) : (
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        lineHeight: 1,
                        marginTop: -2,
                        display: 'block',
                      }}
                    >
                      +
                    </span>
                  )}
                </motion.div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isWeightModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="bg-white w-full max-w-xs rounded-[36px] p-8 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Scale size={28} className="text-emerald-500" />
              </div>

              <p className="text-xl font-black text-gray-800 mb-1 uppercase tracking-tight">
                Novo Peso
              </p>
              <p className="text-xs text-gray-400 font-bold mb-5">
                Digite o peso atual em kg
              </p>

              <input
                type="number"
                step="0.1"
                autoFocus
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveWeight()}
                className="w-full bg-gray-50 rounded-2xl p-4 text-center text-3xl font-black text-[#8B4AFF] outline-none mb-5 border-2 border-transparent focus:border-[#8B4AFF]/30"
                placeholder="0.0"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsWeightModalOpen(false);
                    setNewWeight('');
                  }}
                  className="flex-1 py-4 bg-gray-100 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-wider"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={saveWeight}
                  disabled={loading || !newWeight}
                  className="flex-1 py-4 bg-emerald-500 rounded-2xl font-black text-white uppercase text-[10px] tracking-wider shadow-lg disabled:opacity-50"
                  style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}
                >
                  {loading ? '...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}