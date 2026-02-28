import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, Info, CheckCircle2, AlertCircle, Utensils, 
  Store, MessageCircle, Trash2, Plus, Share2, X, ChevronDown
} from 'lucide-react';

export default function NutritionModule({ cat, touch }) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({ name: '', whatsapp: '' });

  // --- LÓGICA DE PESO (REFERÊNCIA VISUAL) ---
  const getWeightStatus = () => {
    const w = cat.weight || 0;
    const breed = cat.breed?.toUpperCase() || 'SRD';
    let min = 3.5, max = 5.5;
    if (breed.includes('MAINE')) { min = 6; max = 11; }

    if (w === 0) return { label: "PENDENTE", msg: "Registe o peso para análise", color: "bg-gray-400" };
    if (w < min) return { label: "SUBPESO", msg: `${cat.name} está abaixo do seu peso ideal`, color: "bg-[#FFB800]" }; 
    if (w > max) return { label: "SOBREPESO", msg: `${cat.name} está acima do seu peso ideal`, color: "bg-[#FF006B]" }; 
    return { label: "PESO IDEAL", msg: `${cat.name} está no peso ideal`, color: "bg-[#2D7FF9]" }; 
  };

  const status = getWeightStatus();

  // --- FUNÇÃO DE CONVITE ---
  const inviteSupplier = (supplierName) => {
    const msg = encodeURIComponent(`Olá ${supplierName}! Sou o tutor do ${cat.name} e uso a iGent. Gostava de te ter como meu fornecedor oficial na App: igent.app`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* CARD DE PESO (DASHBOARD MÉDICO) */}
      <motion.div className={`${status.color} rounded-[40px] p-8 text-white shadow-2xl relative`}>
        <div className="flex justify-between items-start">
          <div className="flex gap-5 items-center">
            <div className="bg-white/20 p-4 rounded-[24px] backdrop-blur-lg border border-white/30">
              <Scale size={28} />
            </div>
            <div>
              <div className="flex items-end gap-1 leading-none">
                <span className="text-5xl font-black tracking-tighter">{cat.weight || '0.0'}</span>
                <span className="text-sm font-bold mb-1">KG</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-90">{status.label}</p>
            </div>
          </div>
          <button onClick={() => setShowInfoModal(true)} className="p-3 bg-white/20 rounded-full border border-white/20 active:scale-90 transition-all">
            <Info size={20} />
          </button>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs font-bold italic opacity-95">"{status.msg}"</p>
        </div>
      </motion.div>

      {/* ANÁLISE BIO TIPO (UI BARRINHAS) */}
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50">
        <h3 className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8">Análise Bio Tipo</h3>
        <div className="space-y-6">
          {[
            { label: "Estágio idade", pct: 85, color: "bg-[#3DDC97]" },
            { label: `Padrão ${cat.gender === 'MALE' ? 'Macho' : 'Fêmea'}`, pct: 92, color: "bg-[#7071FF]" },
            { label: `Média ${cat.breed || 'SRD'}`, pct: 70, color: "bg-[#D97BFF]" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase text-gray-500 w-24 leading-tight">{item.label}</span>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} className={`h-full ${item.color}`} />
              </div>
              <span className="text-[10px] font-black text-gray-800 w-8 text-right">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO FORNECEDORES (CLEAN) */}
      <div className="bg-white rounded-[32px] p-6 border border-gray-50 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Store size={14} className="text-emerald-500" />
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Meus Fornecedores</h3>
        </div>

        <div className="space-y-2 mb-4">
          <input 
            type="text" placeholder="Nome da Loja" value={newSupplier.name}
            onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none"
          />
          <div className="flex gap-2">
            <input 
              type="tel" placeholder="WhatsApp" value={newSupplier.whatsapp}
              onChange={(e) => setNewSupplier({...newSupplier, whatsapp: e.target.value})}
              className="flex-1 bg-gray-50 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none"
            />
            <button 
              onClick={() => { if(newSupplier.name) setSuppliers([...suppliers, {...newSupplier, id: Date.now()}]); setNewSupplier({name:'', whatsapp:''}); }}
              className="bg-emerald-500 text-white p-3 rounded-xl active:scale-95"
            ><Plus size={20}/></button>
          </div>
        </div>

        {/* LISTA DE CARDS */}
        <div className="space-y-2">
          {suppliers.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm"><Store size={14} /></div>
                <p className="text-[10px] font-black text-gray-800 uppercase">{s.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => inviteSupplier(s.name)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:scale-90"><Share2 size={14} /></button>
                <a href={`https://wa.me/${s.whatsapp.replace(/\D/g,'')}`} target="_blank" className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><MessageCircle size={14} /></a>
                <button onClick={() => confirm("Remover fornecedor?") && setSuppliers(suppliers.filter(x => x.id !== s.id))} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE EXPLICAÇÃO */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInfoModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-white rounded-[40px] p-8 max-w-sm shadow-2xl">
              <h4 className="text-lg font-black text-gray-800 uppercase tracking-tighter mb-4">Metodologia iGent</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Cruzamos o peso real com tabelas de crescimento específicas para cada raça e género, garantindo que o teu gato se mantém na zona de performance ideal.</p>
              <button onClick={() => setShowInfoModal(false)} className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px]">Entendido</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}