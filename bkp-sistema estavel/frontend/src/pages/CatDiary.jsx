import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Check, Droplets, Utensils, Smile, Frown, Meh, Zap, Trash2, PenTool } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import useSensory from '../hooks/useSensory';
import api from '../services/api';

const CORES = { primary: "#6158ca", accent: "#ebfc66" };

const MOODS = [
  { id: 'happy', label: 'Feliz', icon: Smile, color: 'bg-green-100 text-green-600' },
  { id: 'sleepy', label: 'Preguiça', icon: Meh, color: 'bg-blue-100 text-blue-600' },
  { id: 'zoomies', label: 'Zoomies', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'spicy', label: 'Bravo', icon: Frown, color: 'bg-red-100 text-red-600' },
];

const HABITS = [
  { id: 'Agua', label: 'Água Fresca', icon: Droplets },
  { id: 'Banheiro', label: 'Caixa Limpa', icon: Trash2 },
  { id: 'Comida', label: 'Alimentou', icon: Utensils },
  { id: 'Brincou', label: 'Brincou', icon: Zap },
];

export default function CatDiary() {
  const navigate = useNavigate();
  const { id } = useParams();
  const touch = useSensory();
  
  const [selectedMood, setSelectedMood] = useState('happy');
  const [completedHabits, setCompletedHabits] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleHabit = (habitId) => {
    touch('tap');
    if (completedHabits.includes(habitId)) setCompletedHabits(prev => prev.filter(i => i !== habitId));
    else setCompletedHabits(prev => [...prev, habitId]);
  };

  // --- AQUI ESTÁ A CORREÇÃO DO SALVAMENTO ---
  const handleSave = async () => {
    setLoading(true);
    touch('success');
    
    try {
        // Monta o texto dos hábitos
        const habitsText = completedHabits.length > 0 
            ? `Checklist: ${completedHabits.map(h => HABITS.find(ref => ref.id === h)?.label).join(', ')}.` 
            : '';
        
        // Junta tudo no conteúdo
        const fullContent = `${habitsText}\n${note}`.trim();
        const moodLabel = MOODS.find(m => m.id === selectedMood)?.label;

        // Payload compatível com schema DiaryEntry
        const payload = {
            petId: id,
            title: `Dia ${moodLabel}`, 
            content: fullContent || "Sem anotações.",
            type: selectedMood, // ID do humor (happy, sleepy...)
            date: new Date()
        };

        await api.post('/diary-entries', payload);
        navigate(-1);
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar diário.");
    } finally {
        setLoading(false);
    }
  };

  const progress = (completedHabits.length / HABITS.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-48 font-sans relative">
      
      {/* HEADER */}
      <div className="bg-white pt-8 pb-6 px-5 rounded-b-[40px] shadow-sm relative z-10">
         <div className="flex justify-between items-center mb-6">
            <button onClick={() => { touch(); navigate(-1); }} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
                <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col items-center">
                <h1 className="text-xl font-black text-gray-800">Diário do Gatedo</h1>
            </div>
            <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
                <span className="text-xs font-black text-orange-600">Novo</span>
            </div>
         </div>
      </div>

      {/* CONTEÚDO */}
      <div className="px-5 pt-6 space-y-8">

        {/* HUMOR */}
        <div>
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Smile size={18} className="text-[#6158ca]" /> Como ele está hoje?
            </h2>
            <div className="flex justify-between gap-2">
                {MOODS.map((mood) => {
                    const isSelected = selectedMood === mood.id;
                    return (
                        <motion.button key={mood.id} whileTap={{ scale: 0.9 }} onClick={() => { setSelectedMood(mood.id); touch(); }} className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-[20px] border-2 transition-all ${isSelected ? `border-transparent shadow-md bg-white scale-105` : 'border-transparent bg-white/50 opacity-60 grayscale'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mood.color} ${isSelected ? 'ring-2 ring-offset-2 ring-[#6158ca]' : ''}`}><mood.icon size={20} /></div>
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>{mood.label}</span>
                        </motion.button>
                    )
                })}
            </div>
        </div>

        {/* HABITS */}
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center gap-2"><Check size={18} className="text-[#6158ca]" /> Checklist</h2>
                <span className="text-xs font-bold text-[#6158ca] bg-[#6158ca]/10 px-2 py-1 rounded-full">{completedHabits.length}/{HABITS.length}</span>
            </div>
            <div className="absolute top-0 left-0 h-1 bg-[#F0F0F0] w-full"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[#ebfc66]" /></div>
            <div className="grid grid-cols-2 gap-3">
                {HABITS.map((habit) => {
                    const isDone = completedHabits.includes(habit.id);
                    return (
                        <motion.button key={habit.id} whileTap={{ scale: 0.98 }} onClick={() => toggleHabit(habit.id)} className={`p-3 rounded-[18px] flex items-center gap-3 border-2 transition-all ${isDone ? 'bg-[#ebfc66]/20 border-[#ebfc66] shadow-sm' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone ? 'bg-[#ebfc66] text-[#6158ca]' : 'bg-white text-gray-400'}`}><habit.icon size={16} /></div>
                            <span className={`text-xs font-bold ${isDone ? 'text-gray-800' : 'text-gray-400'}`}>{habit.label}</span>
                            {isDone && <Check size={14} className="ml-auto text-[#6158ca]" />}
                        </motion.button>
                    )
                })}
            </div>
        </div>

        {/* NOTE */}
        <div className="bg-white p-4 rounded-[24px] shadow-sm">
             <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2"><PenTool size={18} className="text-[#6158ca]" /> Observações</h2>
             <textarea rows="3" placeholder="Escreva aqui..." className="w-full text-sm font-medium text-gray-700 outline-none bg-transparent resize-none" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

      </div>

      {/* BOTÃO SALVAR (Fixo acima da BottomBar) */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-[800px] px-5 z-20 pointer-events-none">
         <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={loading} className="w-full py-4 rounded-[24px] font-black text-lg shadow-xl flex items-center justify-center gap-2 text-white relative overflow-hidden group pointer-events-auto" style={{ backgroundColor: CORES.primary }}>
            {loading ? 'Salvando...' : <span>Salvar o Dia (+50 XP) <Check size={20} className="inline ml-2"/></span>}
         </motion.button>
      </div>

    </div>
  );
}