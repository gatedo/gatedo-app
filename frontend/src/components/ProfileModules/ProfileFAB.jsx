import React, { useState } from 'react';
import { PawPrint, Syringe, PenTool, Stethoscope, Pill, Scale, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api'; 

export default function ProfileFAB({ id, isFabOpen, setIsFabOpen, navigate, refreshCat }) {
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const saveWeight = async () => {
    if (!newWeight) return;
    setLoading(true);
    try {
      const weightNum = parseFloat(newWeight.replace(',', '.'));
      await api.patch(`/pets/${id}`, { weight: weightNum });
      await api.post('/health-records', {
        petId: id,
        type: 'EXAM',
        title: `Check-in de Peso: ${weightNum}kg`,
        date: new Date(),
        notes: "Peso registrado via iGentVET FAB."
      });
      if (refreshCat) await refreshCat();
      setIsWeightModalOpen(false);
      setNewWeight('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { label: 'Vacina', icon: Syringe, color: 'bg-pink-500', type: 'vaccine' },
    { label: 'Peso', icon: Scale, color: 'bg-emerald-500', type: 'weight_quick' },
    { label: 'Vermífugo', icon: Pill, color: 'bg-blue-500', type: 'vermifuge' },
    { label: 'Antipulgas', icon: Pill, color: 'bg-purple-500', type: 'parasite' },
    { label: 'Consulta', icon: Stethoscope, color: 'bg-[#6158ca]', type: 'consultation' },
    { label: 'Diário', icon: PenTool, color: 'bg-orange-500', type: 'diary' },
  ];

  return (
    <>
      {/* OVERLAY DE DESFOQUE E ESMAECIMENTO */}
      <AnimatePresence>
        {isFabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFabOpen(false)}
            className="fixed inset-0 z-[998] bg-white/40 backdrop-blur-sm pointer-events-auto"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-28 right-5 z-[999] flex flex-col items-end pointer-events-none">
  <AnimatePresence>
    {isFabOpen && (
      <div className="flex flex-col items-end mb-4">
        {actions.map((action, idx) => (
          <motion.button
            key={idx}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setIsFabOpen(false);
                    if (action.type === 'weight_quick') setIsWeightModalOpen(true);
                    else if (action.type === 'diary') navigate(`/cat/${id}/diary`);
                    else navigate(`/cat/${id}/health-new?type=${action.type}`);
                  }}
                  className="flex items-center gap-3 mb-3 pointer-events-auto group"
                >
                  <span className="bg-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm text-gray-700 uppercase italic border border-gray-50">
                    {action.label}
                  </span>
                  <div className={`w-12 h-12 ${action.color} rounded-2xl shadow-lg flex items-center justify-center text-white border-4 border-white/20`}>
                    <action.icon size={20} />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        <button
    onClick={() => setIsFabOpen(!isFabOpen)}
    className={`w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center text-white z-50 transition-all pointer-events-auto active:scale-90 ${
      isFabOpen ? 'bg-gray-800 rotate-45 scale-90' : 'bg-[#6158ca] border-4 border-white'
    }`}
  >
    {isFabOpen ? <X size={32} /> : <PawPrint size={32} fill="currentColor" />}
  </button>
</div>

      {/* MODAL DE PESO (Mantém o foco próprio) */}
      <AnimatePresence>
        {isWeightModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md pointer-events-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xs rounded-[40px] p-8 shadow-2xl text-center">
              <p className="text-2xl font-black italic text-gray-800 mb-6 uppercase tracking-tighter">Quantos KG?</p>
              <input type="number" step="0.1" autoFocus value={newWeight} onChange={(e) => setNewWeight(e.target.value)} className="w-full bg-gray-50 rounded-2xl p-4 text-center text-2xl font-black text-[#6158ca] outline-none mb-6" placeholder="0.0" />
              <div className="flex gap-3">
                <button onClick={() => setIsWeightModalOpen(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black text-gray-400 uppercase text-[10px]">Sair</button>
                <button onClick={saveWeight} disabled={loading} className="flex-1 py-4 bg-emerald-500 rounded-2xl font-black text-white uppercase text-[10px] shadow-lg">{loading ? '...' : 'Confirmar'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}