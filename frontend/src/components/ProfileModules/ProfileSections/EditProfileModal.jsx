import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, Ghost, MapPin, Hash, Camera, Award, 
  Upload, Loader2, ChevronRight, HeartPulse, Trash2, AlertCircle 
} from 'lucide-react';
import api from '../../../services/api';

// Paleta com valores hex reais (não classes Tailwind)
const THEME_COLORS = [
  '#6158ca','#8B5CF6','#EC4899','#F97316',
  '#F59E0B','#EF4444','#34D399','#10B981',
  '#06B6D4','#60A5FA','#A78BFA','#F472B6',
  '#FB923C','#4ADE80','#94A3B8','#1C1C2E',
];

export default function EditProfileModal({ isOpen, onClose, cat, onSave }) {
  const [loading, setLoading] = useState(false);
  const [birthMode, setBirthMode] = useState('exact');
  const [showHistory, setShowHistory] = useState(false); 
  const [showMemorial, setShowMemorial] = useState(false);
  
  // CORREÇÃO: Definição do estado que causava a tela branca
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const avatarRef = useRef(null);
  const pedigreeFrontRef = useRef(null);
  const pedigreeBackRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', nicknames: '', breed: '', city: '', microchip: '', gender: 'UNKNOWN',
    traumaHistory: '', deathDate: '', deathCause: '', isMemorial: false, isArchived: false,
    themeColor: '#6158ca', birthDate: '', ageYears: '', ageMonths: '',
  });

  const handleBackup = () => {
    const dataToBackup = {
        ...formData,
        catId: cat.id,
        exportDate: new Date().toISOString(),
        appName: "Gatedo Backup"
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToBackup, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_gatedo_${formData.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

  const [previews, setPreviews] = useState({ avatar: null, front: null, back: null });
  

  useEffect(() => {
    if (cat && isOpen) {
      setFormData({
        name: cat.name || '',
        nicknames: cat.nicknames || '',
        breed: cat.breed || '',
        city: cat.city || '',
        microchip: cat.microchip || '',
        gender: cat.gender || 'UNKNOWN',
        traumaHistory: cat.traumaHistory || '',
        deathDate: cat.deathDate ? new Date(cat.deathDate).toISOString().split('T')[0] : '',
        deathCause: cat.deathCause || '',
        isMemorial: !!cat.isMemorial,
        isArchived: !!cat.isArchived,
        themeColor: (cat.themeColor?.startsWith('#') ? cat.themeColor : '#6158ca'),
        birthDate: cat.birthDate ? new Date(cat.birthDate).toISOString().split('T')[0] : '',
        ageYears: cat.ageYears || '',
        ageMonths: cat.ageMonths || ''
      });
      setPreviews({ avatar: cat.photoUrl, front: cat.pedigreeFrontUrl, back: cat.pedigreeBackUrl });
      setBirthMode(cat.isDateEstimated ? 'approx' : 'exact');
    }
  }, [cat, isOpen]);

  const handleFilePreview = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews(prev => ({ ...prev, [type]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('nicknames', formData.nicknames);
    data.append('breed', formData.breed);
    data.append('city', formData.city);
    data.append('microchip', formData.microchip);
    data.append('gender', formData.gender);
    data.append('traumaHistory', formData.traumaHistory);
    data.append('themeColor', formData.themeColor);
    data.append('isMemorial', String(formData.isMemorial));
    data.append('isArchived', String(formData.isArchived));
    data.append('isDateEstimated', String(birthMode === 'approx'));
    
    if (formData.birthDate) data.append('birthDate', new Date(formData.birthDate).toISOString());
    if (formData.deathDate) data.append('deathDate', new Date(formData.deathDate).toISOString());
    if (formData.deathCause) data.append('deathCause', formData.deathCause);
    if (formData.ageYears) data.append('ageYears', String(formData.ageYears));
    if (formData.ageMonths) data.append('ageMonths', String(formData.ageMonths));

    if (avatarRef.current?.files[0]) data.append('file', avatarRef.current.files[0]);
    if (pedigreeFrontRef.current?.files[0]) data.append('pedigree', pedigreeFrontRef.current.files[0]);

    try {
      await api.patch(`/pets/${cat.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSave();
      onClose();
    } catch (error) { console.error(error); alert("Erro ao sincronizar."); }
    finally { setLoading(false); }
  };

  // FUNÇÃO DE EXCLUSÃO
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/pets/${cat.id}`);
      onClose();
      window.location.href = '/cats';
    } catch (error) { console.error(error); alert("Erro ao excluir."); }
    finally { setLoading(false); setShowDeleteConfirm(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end justify-center text-left">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[95vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Edição Mestre</h2>
            <p className="text-[12px] font-mono font-bold text-indigo-600 uppercase tracking-tighter">{cat.id}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
        </div>

        <div className="space-y-6">
          {/* CARD AVATAR */}
          <section className="bg-gray-50 p-6 rounded-[32px] flex items-center gap-6 border border-gray-100">
            <div className="relative">
              <div className="w-24 h-24 rounded-[30px] overflow-hidden border-4 border-white shadow-xl bg-white">
                <img src={previews.avatar || '/placeholder-cat.png'} className="w-full h-full object-cover" />
              </div>
              <button onClick={() => avatarRef.current.click()} className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg border-2 border-white active:scale-90 transition-transform">
                <Camera size={16}/>
              </button>
              <input type="file" ref={avatarRef} className="hidden" onChange={(e) => handleFilePreview(e, 'avatar')} />
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Cor do Perfil (hex real)</span>
              <div className="flex gap-2.5 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  {THEME_COLORS.map(hex => (
                    <button
                      key={hex}
                      onClick={() => setFormData({...formData, themeColor: hex})}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110 flex items-center justify-center"
                      style={{
                        background: hex,
                        boxShadow: formData.themeColor === hex
                          ? `0 0 0 2px white, 0 0 0 4px ${hex}`
                          : 'none',
                        transform: formData.themeColor === hex ? 'scale(1.2)' : 'scale(1)',
                      }}
                    >
                      {formData.themeColor === hex && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* DADOS VIVOS (CIDADE/CHIP/GÊNERO) */}
          <section className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1 block">Nome Principal</label>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none text-gray-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               <div className="col-span-2">
                  <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1 block">Apelidos Carinhosos</label>
                  <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none text-gray-700" value={formData.nicknames} onChange={e => setFormData({...formData, nicknames: e.target.value})} />
               </div>
               <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1 block">Cidade</label>
                  <div className="flex items-center bg-gray-50 rounded-2xl px-4">
                    <MapPin size={14} className="text-gray-400 mr-2"/>
                    <input className="w-full py-4 bg-transparent font-bold outline-none text-gray-700 text-sm" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
               </div>
               <div>
                  <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1 block">Gênero</label>
                  <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none text-gray-700 text-sm appearance-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="MALE">Macho</option>
                    <option value="FEMALE">Fêmea</option>
                    <option value="UNKNOWN">N/I</option>
                  </select>
               </div>
               <div className="col-span-2">
                  <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1 block">Microchip</label>
                  <div className="flex items-center bg-gray-50 rounded-2xl px-4">
                    <Hash size={14} className="text-gray-400 mr-2"/>
                    <input className="w-full py-4 bg-transparent font-bold outline-none text-gray-700 text-sm font-mono" value={formData.microchip} onChange={e => setFormData({...formData, microchip: e.target.value})} />
                  </div>
               </div>
            </div>
          </section>

          {/* RAÇA E DOCS */}
          <section className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2"><Award size={16} className="text-amber-500"/><span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Raça & Documentação</span></div>
            <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none appearance-none" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})}>
              <option value="">Sem Raça Definida (SRD)</option>
              <option value="Persa">Persa</option>
              <option value="Siamês">Siamês</option>
            </select>
            {formData.breed && (
              <div className="grid grid-cols-2 gap-4">
                {['front', 'back'].map((side) => (
                  <div key={side} className="p-3 bg-amber-50 rounded-[24px] border border-amber-100 text-center space-y-2">
                    <span className="text-[7px] font-black uppercase text-amber-700 block">{side === 'front' ? 'Frente' : 'Verso'}</span>
                    <div className="w-full aspect-video bg-white rounded-xl overflow-hidden border border-amber-200 flex items-center justify-center relative cursor-pointer" onClick={() => (side === 'front' ? pedigreeFrontRef : pedigreeBackRef).current.click()}>
                      {previews[side] ? <img src={previews[side]} className="w-full h-full object-cover" /> : <Upload size={16} className="text-amber-200" />}
                    </div>
                    <input type="file" ref={side === 'front' ? pedigreeFrontRef : pedigreeBackRef} className="hidden" onChange={(e) => handleFilePreview(e, side)} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* HISTÓRICO (BANNER CLEAN) */}
          <section className="bg-gray-50 rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <button type="button" onClick={() => setShowHistory(!showHistory)} className="w-full p-5 flex items-center justify-between hover:bg-gray-100/50 transition-colors">
              <div className="flex items-center gap-3">
                <HeartPulse size={16} className="text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Histórico & Traumas</span>
              </div>
              <ChevronRight size={18} className={`text-gray-300 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="p-6 pt-0">
                    <textarea 
                      placeholder="Traumas, maus tratos, adoção..." 
                      className="w-full p-4 bg-white rounded-2xl text-xs font-medium text-gray-600 border border-gray-100 outline-none min-h-[100px] resize-none"
                      value={formData.traumaHistory}
                      onChange={e => setFormData({...formData, traumaHistory: e.target.value})}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* IDADE */}
          <section className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-4">
             <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm">
                <button onClick={() => setBirthMode('exact')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${birthMode === 'exact' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>Calendário</button>
                <button onClick={() => setBirthMode('approx')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${birthMode === 'approx' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>Aproximada</button>
             </div>
             {birthMode === 'exact' ? 
                <input type="date" className="w-full p-4 bg-white rounded-2xl font-bold outline-none text-gray-700 text-xs" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} /> :
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Anos" className="w-full p-4 bg-white rounded-2xl font-bold outline-none text-gray-700" value={formData.ageYears} onChange={e => setFormData({...formData, ageYears: e.target.value})} />
                  <input type="number" placeholder="Meses" className="w-full p-4 bg-white rounded-2xl font-bold outline-none text-gray-700" value={formData.ageMonths} onChange={e => setFormData({...formData, ageMonths: e.target.value})} />
                </div>
             }
          </section>

          {/* MEMORIAL DISCRETO */}
          <section className="bg-[#1a1a1a] rounded-[40px] shadow-2xl overflow-hidden relative">
            <button type="button" onClick={() => setShowMemorial(!showMemorial)} className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors relative z-10">
              <div className="flex items-center gap-3">
                <Ghost size={18} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[3px]">Memorial de Partida</span>
              </div>
              <ChevronRight size={18} className={`text-indigo-400 transition-transform ${showMemorial ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showMemorial && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="p-8 pt-0 space-y-6 relative z-10">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-indigo-300/60 uppercase tracking-widest ml-1 block">Data da Partida</label>
                        <input type="date" className="w-full p-4 bg-white/5 rounded-2xl text-white border border-white/10 outline-none font-bold text-xs" value={formData.deathDate} onChange={e => setFormData({...formData, deathDate: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-indigo-300/60 uppercase tracking-widest ml-1 block">Causa Mortis <span className="normal-case font-medium opacity-60">(ajuda a IA a proteger outros gatos da mesma raça)</span></label>
                        <select
                          className="w-full p-4 bg-white/5 rounded-2xl text-white border border-white/10 outline-none font-bold text-xs appearance-none"
                          value={formData.deathCause}
                          onChange={e => setFormData({...formData, deathCause: e.target.value})}
                        >
                          <option value="" style={{ background: '#1a1a2e', color: 'white' }}>Não informado</option>
                          <option value="IRC" style={{ background: '#1a1a2e', color: 'white' }}>IRC — Insuficiência Renal Crônica</option>
                          <option value="FIV" style={{ background: '#1a1a2e', color: 'white' }}>FIV — Imunodeficiência Felina</option>
                          <option value="FELV" style={{ background: '#1a1a2e', color: 'white' }}>FeLV — Leucemia Felina</option>
                          <option value="LINFOMA" style={{ background: '#1a1a2e', color: 'white' }}>Linfoma / Câncer</option>
                          <option value="PIF" style={{ background: '#1a1a2e', color: 'white' }}>PIF — Peritonite Infecciosa Felina</option>
                          <option value="TRAUMA" style={{ background: '#1a1a2e', color: 'white' }}>Trauma / Acidente</option>
                          <option value="INFECCAO" style={{ background: '#1a1a2e', color: 'white' }}>Infecção Grave</option>
                          <option value="CARDIACO" style={{ background: '#1a1a2e', color: 'white' }}>Problema Cardíaco</option>
                          <option value="VELHICE" style={{ background: '#1a1a2e', color: 'white' }}>Velhice Natural</option>
                          <option value="DESCONHECIDO" style={{ background: '#1a1a2e', color: 'white' }}>Causa Desconhecida</option>
                          <option value="OUTRO" style={{ background: '#1a1a2e', color: 'white' }}>Outro</option>
                        </select>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between text-indigo-200 text-[9px] font-black uppercase">
                        <span>Card in Memoriam?</span>
                        <input type="checkbox" className="w-6 h-6 accent-indigo-500" checked={formData.isArchived} onChange={e => setFormData({...formData, isArchived: e.target.checked})} />
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between text-indigo-200 text-[9px] font-black uppercase">
                        <span>Apenas no Memorial?</span>
                        <input type="checkbox" className="w-6 h-6 accent-indigo-500" checked={formData.isMemorial} onChange={e => setFormData({...formData, isMemorial: e.target.checked})} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        {/* BOTÃO EXCLUIR REPOSICIONADO */}
          <div className="py-2">
            <button 
              type="button" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="w-full py-4 border-2 border-dashed border-red-100 text-red-300 rounded-[30px] font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-3 hover:bg-red-50 transition-all active:scale-95"
            >
              Excluir Perfil Permanentemente
            </button>
          </div>

          <button onClick={handleUpdate} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-full font-black uppercase tracking-[3px] shadow-xl flex items-center justify-center gap-3 active:scale-95 mb-8">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20}/> Salvar Perfil</>}
          </button>
        </div>
      </motion.div>

     {/* MODAL DE CONFIRMAÇÃO COM BACKUP E MOTIVO */}
<AnimatePresence>
  {showDeleteConfirm && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-end justify-center">
       <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-lg rounded-t-[45px] p-10 pb-14 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <AlertCircle size={32}/>
          </div>
          
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter mb-2">Excluir {formData.name}?</h3>
          
          {/* SELEÇÃO DE MOTIVO */}
          <div className="my-6 space-y-2 text-left">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Qual o motivo?</label>
            <select 
              className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none border border-gray-100"
              value={deleteReason} 
              onChange={(e) => setDeleteReason(e.target.value)}
            >
              <option value="">Selecione um motivo...</option>
              <option value="erro">Erro no cadastro</option>
              <option value="partida">O gatinho faleceu 🕯️</option>
              <option value="doacao">Foi doado / Novo lar</option>
              <option value="outro">Outro motivo</option>
            </select>
          </div>

          {/* BOTÃO DE BACKUP */}
          <button 
            type="button"
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `backup_${formData.name}.json`);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="w-full py-4 mb-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-indigo-100"
          >
            <Upload size={14} className="rotate-180" /> Baixar Backup de Segurança
          </button>
          
          <div className="space-y-3">
             <button 
               onClick={handleDelete} 
               disabled={!deleteReason}
               className={`w-full py-5 rounded-[25px] font-black uppercase text-[10px] tracking-widest shadow-lg ${deleteReason ? 'bg-red-500 text-white' : 'bg-gray-200 text-white cursor-not-allowed'}`}
             >
               Confirmar Exclusão
             </button>
             <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 bg-gray-100 text-gray-400 rounded-[25px] font-black uppercase text-[10px] tracking-widest">Cancelar</button>
          </div>
       </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
}