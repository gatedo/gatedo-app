import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Heart, Star, Zap, Shield, Target, Smile } from 'lucide-react';
import api from '../../../services/api'; 

export default function EditBioModal({ isOpen, onClose, cat, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: cat?.bio || '',
    skillSocial: String(cat?.skillSocial || "80"),
    skillDocile: String(cat?.skillDocile || "95"),
    skillCuriosity: String(cat?.skillCuriosity || "90"),
    skillIndep: String(cat?.skillIndep || "60"),
    skillEnergy: String(cat?.skillEnergy || "75"),
    skillAgility: String(cat?.skillAgility || "85"),
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch(`/pets/${cat.id}`, formData);
      if (onSave) onSave(); 
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-white w-full max-w-lg rounded-t-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-800 uppercase italic">Atributos RPG</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full"><X size={20}/></button>
        </div>

        <div className="space-y-4">
          <textarea 
            className="w-full bg-gray-50 rounded-3xl p-5 text-sm font-bold text-gray-700 outline-none min-h-[100px]"
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
          />

          <div className="grid grid-cols-1 gap-3">
            <SkillSlider label="Social" icon={Heart} value={formData.skillSocial} onChange={(v) => setFormData({...formData, skillSocial: v})} color="accent-rose-400" />
            <SkillSlider label="Dócil" icon={Smile} value={formData.skillDocile} onChange={(v) => setFormData({...formData, skillDocile: v})} color="accent-pink-500" />
            <SkillSlider label="Curioso" icon={Star} value={formData.skillCuriosity} onChange={(v) => setFormData({...formData, skillCuriosity: v})} color="accent-amber-400" />
            <SkillSlider label="Indep." icon={Shield} value={formData.skillIndep} onChange={(v) => setFormData({...formData, skillIndep: v})} color="accent-orange-500" />
            <SkillSlider label="Energia" icon={Zap} value={formData.skillEnergy} onChange={(v) => setFormData({...formData, skillEnergy: v})} color="accent-indigo-400" />
            <SkillSlider label="Agilidade" icon={Target} value={formData.skillAgility} onChange={(v) => setFormData({...formData, skillAgility: v})} color="accent-purple-500" />
          </div>

          <button disabled={loading} onClick={handleSave} className="w-full bg-[#6158ca] text-white h-16 rounded-[28px] font-black text-lg shadow-xl flex items-center justify-center gap-2">
            {loading ? "Gravando..." : <><Save size={20}/> Salvar Alterações</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const SkillSlider = ({ label, icon: Icon, value, onChange, color }) => (
  <div className="bg-gray-50 p-3 rounded-2xl">
    <div className="flex justify-between items-center mb-1 px-1">
      <div className="flex items-center gap-2 text-gray-400"><Icon size={14}/><span className="text-[9px] font-black uppercase">{label}</span></div>
      <span className="text-xs font-black text-indigo-600">{value}%</span>
    </div>
    <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(String(e.target.value))} className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer ${color}`} />
  </div>
);