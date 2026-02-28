import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Ghost, ShieldAlert, Fingerprint, MapPin, Hash, Camera, Calendar, Award, Upload, ChevronRight, Check, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const THEME_COLORS = [
  { hex: 'bg-[#FFF5E6]' }, { hex: 'bg-[#E6FDFF]' }, { hex: 'bg-[#F5D8E8]' },
  { hex: 'bg-[#EFFFDE]' }, { hex: 'bg-[#F0F0F0]' }, { hex: 'bg-[#E6E6FA]' },
];

const GENDER_LABELS = {
  MALE: 'Macho',
  FEMALE: 'Fêmea',
  UNKNOWN: 'Não Informado'
};

export default function EditProfileModal({ isOpen, onClose, cat, onSave }) {
  const [loading, setLoading] = useState(false);
  const [birthMode, setBirthMode] = useState('exact');
  const [showMemorialDetail, setShowMemorialDetail] = useState(false);
  
  const avatarRef = useRef(null);
  const pedigreeFrontRef = useRef(null);
  const pedigreeBackRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', nicknames: '', breed: '', city: '', microchip: '', gender: 'UNKNOWN',
    traumaHistory: '', deathDate: '', isMemorial: false, isArchived: false,
    themeColor: 'bg-[#FFF5E6]', birthDate: '', ageYears: '', ageMonths: '',
    photoUrl: '', pedigreeFrontUrl: '', pedigreeBackUrl: ''
  });

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
        isMemorial: !!cat.isMemorial,
        isArchived: !!cat.isArchived,
        themeColor: cat.themeColor || 'bg-[#FFF5E6]',
        birthDate: cat.birthDate ? new Date(cat.birthDate).toISOString().split('T')[0] : '',
        ageYears: cat.ageYears || '',
        ageMonths: cat.ageMonths || '',
        photoUrl: cat.photoUrl || '',
        pedigreeFrontUrl: cat.pedigreeFrontUrl || '',
        pedigreeBackUrl: cat.pedigreeBackUrl || ''
      });
      setBirthMode(cat.isDateEstimated ? 'approx' : 'exact');
    }
  }, [cat, isOpen]);

  // FUNÇÃO PARA ESTAMPAR IMAGEM IMEDIATAMENTE
  const handleImageChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.patch(`/pets/${cat.id}`, {
        ...formData,
        ageYears: formData.ageYears !== '' ? parseInt(formData.ageYears) : null,
        ageMonths: formData.ageMonths !== '' ? parseInt(formData.ageMonths) : null,
        isDateEstimated: birthMode === 'approx'
      });
      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end justify-center text-left">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} className="bg-white w-full max-w-lg rounded-t-[40px] p-8 max-h-[95vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none">Módulo de Edição</h2>
            <p className="text-[12px] font-mono font-bold text-indigo-600 mt-1">{cat.id}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="space-y-8 pb-10">
          
          {/* AVATAR E CORES */}
          <section className="flex items-center gap-6 bg-gray-50 p-6 rounded-[32px]">
            <div className="relative">
              <div className="w-24 h-24 rounded-[30px] overflow-hidden border-4 border-white shadow-xl bg-white">
                <img src={formData.photoUrl || '/placeholder-cat.png'} className="w-full h-full object-cover" alt="Avatar" />
              </div>
              <button onClick={() => avatarRef.current.click()} className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg border-4 border-gray-50 active:scale-90 transition-transform"><Camera size={16}/></button>
              <input type="file" ref={avatarRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'photoUrl')} />
            </div>
            <div className="flex-1 space-y-3">
              <span className="text-[9px] font-black uppercase text-gray-400">Cor do Tema</span>
              <div className="flex gap-2 flex-wrap">
                {THEME_COLORS.map(c => (
                  <button key={c.hex} onClick={() => setFormData({...formData, themeColor: c.hex})} className={`w-8 h-8 rounded-full border-2 ${formData.themeColor === c.hex ? 'border-indigo-600 scale-110 shadow-md' : 'border-transparent'} ${c.hex}`} />
                ))}
              </div>
            </div>
          </section>

          {/* IDENTIFICAÇÃO E GÊNERO */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1"><Fingerprint size={14} className="text-indigo-600" /><span className="text-[10px] font-black text-gray-400 uppercase">Identidade</span></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1 block tracking-widest">Nome Principal</label>
                    <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="col-span-2">
                    <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1 block tracking-widest">Apelidos Carinhosos</label>
                    <input className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700" value={formData.nicknames} onChange={e => setFormData({...formData, nicknames: e.target.value})} />
                </div>
                <div className="col-span-2">
                    <label className="text-[8px] font-black text-gray-400 uppercase ml-2 mb-1 block tracking-widest">Gênero Informado</label>
                    <div className="w-full p-4 bg-gray-100/50 rounded-2xl font-bold text-gray-500 border border-gray-200/50">
                        {GENDER_LABELS[formData.gender]}
                    </div>
                </div>
            </div>
          </section>

          {/* LOCALIZAÇÃO E CHIP */}
          <section className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1"><MapPin size={14} className="text-gray-400"/><span className="text-[10px] font-black text-gray-400 uppercase">Cidade</span></div>
                <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1"><Hash size={14} className="text-gray-400"/><span className="text-[10px] font-black text-gray-400 uppercase">Microchip</span></div>
                <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none font-mono" value={formData.microchip} onChange={e => setFormData({...formData, microchip: e.target.value})} />
             </div>
          </section>

          {/* RAÇA E PEDIGREE */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1"><Award size={14} className="text-amber-500" /><span className="text-[10px] font-black text-gray-400 uppercase">Raça & Pedigree</span></div>
            <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none appearance-none" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})}>
              <option value="">Sem Raça Definida (SRD)</option>
              <option value="Persa">Persa</option>
              <option value="Maine Coon">Maine Coon</option>
              <option value="Siamês">Siamês</option>
              <option value="Bengala">Bengala</option>
            </select>
            
            {formData.breed && (
              <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 space-y-4">
                <span className="text-[9px] font-black uppercase text-amber-600 block mb-2 tracking-widest">Documentação Digital</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative cursor-pointer" onClick={() => pedigreeFrontRef.current.click()}>
                    <div className="aspect-video bg-white rounded-2xl border-2 border-dashed border-amber-200 flex items-center justify-center overflow-hidden">
                      {formData.pedigreeFrontUrl ? <img src={formData.pedigreeFrontUrl} className="w-full h-full object-cover" /> : <Upload size={20} className="text-amber-300"/>}
                    </div>
                    <p className="text-[8px] font-black text-center mt-2 uppercase text-amber-700">Frente</p>
                  </div>
                  <div className="relative cursor-pointer" onClick={() => pedigreeBackRef.current.click()}>
                    <div className="aspect-video bg-white rounded-2xl border-2 border-dashed border-amber-200 flex items-center justify-center overflow-hidden">
                      {formData.pedigreeBackUrl ? <img src={formData.pedigreeBackUrl} className="w-full h-full object-cover" /> : <Upload size={20} className="text-amber-300"/>}
                    </div>
                    <p className="text-[8px] font-black text-center mt-2 uppercase text-amber-700">Verso</p>
                  </div>
                </div>
                <input type="file" ref={pedigreeFrontRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'pedigreeFrontUrl')} />
                <input type="file" ref={pedigreeBackRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'pedigreeBackUrl')} />
              </div>
            )}
          </section>

          {/* IDADE MODO DUAL */}
          <section className="bg-gray-50 p-6 rounded-[32px] space-y-4">
             <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm mb-4">
              <button onClick={() => setBirthMode('exact')} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${birthMode === 'exact' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>Calendário</button>
              <button onClick={() => setBirthMode('approx')} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${birthMode === 'approx' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>Idade Aprox.</button>
            </div>
            {birthMode === 'exact' ? (
              <input type="date" className="w-full p-4 bg-white rounded-2xl font-bold outline-none" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Anos" className="w-full p-4 bg-white rounded-2xl font-bold outline-none" value={formData.ageYears} onChange={e => setFormData({...formData, ageYears: e.target.value})} />
                <input type="number" placeholder="Meses" className="w-full p-4 bg-white rounded-2xl font-bold outline-none" value={formData.ageMonths} onChange={e => setFormData({...formData, ageMonths: e.target.value})} />
              </div>
            )}
          </section>

          {/* MEMORIAL (ACCORDION BANNER) */}
          <section className="space-y-3 text-left">
            <button 
              onClick={() => setShowMemorialDetail(!showMemorialDetail)}
              className="w-full p-6 bg-indigo-50 rounded-[32px] flex items-center justify-between group"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600"><Ghost size={20}/></div>
                <div>
                  <span className="text-[11px] font-black text-indigo-900 uppercase block tracking-widest">Memorial & Jardim</span>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase block mt-0.5">Gerenciar despedida e tributo</span>
                </div>
              </div>
              <ChevronRight size={20} className={`text-indigo-300 transition-transform ${showMemorialDetail ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showMemorialDetail && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-6 bg-gray-50 rounded-[32px] space-y-4 border border-indigo-100">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase ml-2">Data da Partida</label>
                      <input type="date" className="w-full p-4 bg-white rounded-2xl font-bold outline-none" value={formData.deathDate} onChange={e => setFormData({...formData, deathDate: e.target.value})} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-gray-500">Exibir no Jardim das Estrelas</span>
                      <input type="checkbox" className="w-6 h-6 accent-indigo-600" checked={formData.isMemorial} onChange={e => setFormData({...formData, isMemorial: e.target.checked})} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-gray-500">Arquivar Cadastro</span>
                      <input type="checkbox" className="w-6 h-6 accent-indigo-600" checked={formData.isArchived} onChange={e => setFormData({...formData, isArchived: e.target.checked})} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* BOTÃO SALVAR */}
          <button onClick={handleUpdate} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20}/> Salvar Dados</>}
          </button>

          {/* RODAPÉ AUDITORIA */}
          <div className="opacity-20 flex flex-col items-center gap-1 pt-4 pb-2">
            <p className="text-[8px] font-black uppercase tracking-widest">Registro criado: {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '---'}</p>
            <p className="text-[8px] font-black uppercase tracking-widest">Última edição: {cat.updatedAt ? new Date(cat.updatedAt).toLocaleDateString() : '---'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}