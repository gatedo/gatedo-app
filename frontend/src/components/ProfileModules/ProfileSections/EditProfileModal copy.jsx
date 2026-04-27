import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Ghost, Camera, Upload, Loader2,
  ChevronRight, AlertCircle, Check
} from 'lucide-react';
import api from '../../../services/api';
import { CARD_GRADIENTS } from '../CatIdentityCard';

const HEX_TO_ID = {
  '#8B4AFF':'violet','#6B61FF':'violet','#8B5CF6':'violet','#A78BFA':'galaxy',
  '#EC4899':'rose',  '#FF6B9D':'rose',  '#F472B6':'rose',
  '#2ECC71':'mint',  '#34D399':'mint',  '#10B981':'mint',  '#4ADE80':'mint',
  '#0EA5E9':'ocean', '#60A5FA':'ocean', '#06B6D4':'ocean',
  '#F97316':'sunset','#F59E0B':'sunset','#FB923C':'sunset',
  '#312E81':'galaxy','#1E1B4B':'galaxy',
  '#E11D48':'cherry','#EF4444':'cherry',
  '#166534':'forest','#14532D':'forest',
  '#D97706':'gold',  '#92400E':'gold',
  '#475569':'slate', '#94A3B8':'slate', '#1C1C2E':'slate',
};

function normalizeThemeColor(raw) {
  if (!raw) return 'violet';
  if (CARD_GRADIENTS.find(g => g.id === raw)) return raw;
  return HEX_TO_ID[raw] || 'violet';
}

export default function EditProfileModal({ isOpen, onClose, cat, onSave }) {
  const [loading, setLoading]                     = useState(false);
  const [birthMode, setBirthMode]                 = useState('exact');
  const [showMemorial, setShowMemorial]           = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason]           = useState('');

  const avatarRef   = useRef(null);
  const pedigreeRef = useRef(null);

  const [formData, setFormData] = useState({
    name:'', nicknames:'', breed:'', city:'', microchip:'', gender:'UNKNOWN',
    traumaHistory:'', deathDate:'', deathCause:'', isMemorial:false, isArchived:false,
    themeColor:'violet', birthDate:'', ageYears:'', ageMonths:'',
  });

  const [previews, setPreviews] = useState({ avatar: null, pedigree: null });

  useEffect(() => {
    if (cat && isOpen) {
      setFormData({
        name:          cat.name || '',
        nicknames:     cat.nicknames || '',
        breed:         cat.breed || '',
        city:          cat.city || '',
        microchip:     cat.microchip || '',
        gender:        cat.gender || 'UNKNOWN',
        traumaHistory: cat.traumaHistory || '',
        deathDate:     cat.deathDate ? new Date(cat.deathDate).toISOString().split('T')[0] : '',
        deathCause:    cat.deathCause || '',
        isMemorial:    !!cat.isMemorial,
        isArchived:    !!cat.isArchived,
        themeColor:    normalizeThemeColor(cat.themeColor),
        birthDate:     cat.birthDate ? new Date(cat.birthDate).toISOString().split('T')[0] : '',
        ageYears:      cat.ageYears || '',
        ageMonths:     cat.ageMonths || '',
      });
      setPreviews({ avatar: cat.photoUrl || null, pedigree: cat.pedigreeFrontUrl || null });
      setBirthMode(cat.isDateEstimated ? 'approx' : 'exact');
    }
  }, [cat, isOpen]);

  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleUpdate = async () => {
    setLoading(true);
    const data = new FormData();
    [
      ['name', formData.name], ['nicknames', formData.nicknames],
      ['breed', formData.breed], ['city', formData.city],
      ['microchip', formData.microchip], ['gender', formData.gender],
      ['traumaHistory', formData.traumaHistory], ['themeColor', formData.themeColor],
      ['isMemorial', String(formData.isMemorial)], ['isArchived', String(formData.isArchived)],
      ['isDateEstimated', String(birthMode === 'approx')],
    ].forEach(([k, v]) => data.append(k, v));
    if (formData.birthDate)  data.append('birthDate', new Date(formData.birthDate).toISOString());
    if (formData.deathDate)  data.append('deathDate', new Date(formData.deathDate).toISOString());
    if (formData.deathCause) data.append('deathCause', formData.deathCause);
    if (formData.ageYears)   data.append('ageYears',  String(formData.ageYears));
    if (formData.ageMonths)  data.append('ageMonths', String(formData.ageMonths));
    if (avatarRef.current?.files[0])   data.append('file',    avatarRef.current.files[0]);
    if (pedigreeRef.current?.files[0]) data.append('pedigree', pedigreeRef.current.files[0]);
    try {
      await api.patch(`/pets/${cat.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSave(); onClose();
    } catch (e) { console.error(e); alert('Erro ao salvar.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/pets/${cat.id}`);
      onClose(); window.location.href = '/cats';
    } catch (e) { console.error(e); alert('Erro ao excluir.'); }
    finally { setLoading(false); setShowDeleteConfirm(false); }
  };

  const activeGradient = CARD_GRADIENTS.find(g => g.id === formData.themeColor) || CARD_GRADIENTS[0];

  if (!isOpen) return null;

  const ic = 'w-full p-4 bg-white rounded-2xl font-bold outline-none text-gray-700 text-xs border border-gray-100';
  const lc = 'text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 ml-1';

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-end justify-center">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }}
        className="bg-white w-full max-w-lg rounded-t-[40px] p-6 max-h-[95vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Edição do Perfil</p>
            <p className="text-xl font-black text-gray-800">{formData.name || cat?.name}</p>
          </div>
          <button onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">

          <section className="bg-gray-50 rounded-[24px] p-4">
            <label className={lc}>Foto do Perfil</label>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const file = e.target.files[0];
                if (file) setPreviews(p => ({ ...p, avatar: URL.createObjectURL(file) }));
              }} />
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-[20px] overflow-hidden border-4 border-white shadow cursor-pointer flex-shrink-0"
                onClick={() => avatarRef.current?.click()}>
                {previews.avatar
                  ? <img src={previews.avatar} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Camera size={22} className="text-gray-400" />
                    </div>}
              </div>
              <button type="button" onClick={() => avatarRef.current?.click()}
                className="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest hover:border-gray-300 transition-all">
                Trocar Foto
              </button>
            </div>
          </section>

          <section className="bg-gray-50 rounded-[24px] p-4">
            <label className={lc}>Cor do Cartão RG</label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {CARD_GRADIENTS.map(g => (
                <button key={g.id} type="button" onClick={() => set('themeColor', g.id)}
                  className="flex flex-col items-center gap-1.5">
                  <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all ${
                    formData.themeColor === g.id ? 'scale-110' : ''}`}
                    style={{
                      background: `linear-gradient(135deg, ${g.fromHex}, ${g.toHex})`,
                      outline: formData.themeColor === g.id ? `3px solid ${g.fromHex}` : 'none',
                      outlineOffset: '2px',
                      boxShadow: formData.themeColor === g.id ? `0 4px 14px ${g.fromHex}60` : 'none',
                    }}>
                    {formData.themeColor === g.id && <Check size={13} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-[8px] font-black text-gray-400">{g.label}</span>
                </button>
              ))}
            </div>
            <div className="rounded-[16px] overflow-hidden h-11 flex items-center px-4 gap-3"
              style={{ background: `linear-gradient(135deg, ${activeGradient.fromHex}, ${activeGradient.toHex})` }}>
              <div className="w-7 h-7 rounded-full border-2 border-white/40 overflow-hidden bg-white/20 flex-shrink-0">
                {previews.avatar && <img src={previews.avatar} className="w-full h-full object-cover" />}
              </div>
              <p className="font-black text-white text-sm truncate flex-1">{formData.name || cat?.name}</p>
              <p className="text-[9px] font-black flex-shrink-0" style={{ color: activeGradient.accent }}>
                {activeGradient.label}
              </p>
            </div>
          </section>

          <section className="bg-gray-50 rounded-[24px] p-4 space-y-3">
            <label className={lc}>Dados Básicos</label>
            {[
              ['Nome', 'name', 'Nome do gatinho'],
              ['Apelidos', 'nicknames', 'Apelidos carinhosos'],
              ['Raça', 'breed', 'Raça ou SRD'],
              ['Cidade', 'city', 'Cidade'],
              ['Microchip', 'microchip', 'Código do microchip'],
            ].map(([label, key, placeholder]) => (
              <div key={key}>
                <label className={lc}>{label}</label>
                <input className={ic} placeholder={placeholder}
                  value={formData[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
            <div>
              <label className={lc}>Gênero</label>
              <div className="flex gap-2">
                {[['MALE','Macho'],['FEMALE','Fêmea'],['UNKNOWN','Indefinido']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set('gender', v)}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-black border-2 transition-all ${
                      formData.gender === v ? 'border-transparent text-white' : 'border-gray-100 text-gray-400 bg-white'
                    }`}
                    style={formData.gender === v
                      ? { background: `linear-gradient(135deg, ${activeGradient.fromHex}, ${activeGradient.toHex})` }
                      : {}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-gray-50 rounded-[24px] p-4 space-y-3">
            <label className={lc}>Nascimento</label>
            <div className="flex gap-2">
              {[['exact','Data exata'],['approx','Estimada']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setBirthMode(v)}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-black border-2 transition-all ${
                    birthMode === v ? 'border-transparent text-white' : 'border-gray-100 text-gray-400 bg-white'
                  }`}
                  style={birthMode === v
                    ? { background: `linear-gradient(135deg, ${activeGradient.fromHex}, ${activeGradient.toHex})` }
                    : {}}>
                  {l}
                </button>
              ))}
            </div>
            {birthMode === 'exact'
              ? <input type="date" className={ic}
                  value={formData.birthDate} onChange={e => set('birthDate', e.target.value)} />
              : <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Anos" className={ic}
                    value={formData.ageYears} onChange={e => set('ageYears', e.target.value)} />
                  <input type="number" placeholder="Meses" className={ic}
                    value={formData.ageMonths} onChange={e => set('ageMonths', e.target.value)} />
                </div>}
          </section>

          <section className="bg-gray-50 rounded-[24px] p-4 space-y-3">
            <label className={lc}>Pedigree</label>
            <input ref={pedigreeRef} type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.type.startsWith('image/'))
                  setPreviews(p => ({ ...p, pedigree: URL.createObjectURL(file) }));
                else setPreviews(p => ({ ...p, pedigree: 'pdf' }));
              }} />
            {previews.pedigree
              ? <div className="relative rounded-2xl overflow-hidden border border-green-200">
                  {previews.pedigree === 'pdf'
                    ? <div className="h-16 bg-green-50 flex items-center justify-center gap-2">
                        <Upload size={16} className="text-green-600" />
                        <span className="text-xs font-black text-green-700">PDF Enviado</span>
                      </div>
                    : <img src={previews.pedigree} className="w-full h-24 object-cover" />}
                  <button onClick={() => setPreviews(p => ({ ...p, pedigree: null }))}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                    <X size={12} className="text-gray-600" />
                  </button>
                </div>
              : <button type="button" onClick={() => pedigreeRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-gray-400 hover:border-gray-300 transition-all">
                  <Upload size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Enviar Pedigree</span>
                </button>}
          </section>

          <section className="bg-gray-50 rounded-[24px] p-4">
            <label className={lc}>Histórico de Trauma</label>
            <textarea className={`${ic} h-20`} placeholder="Medos, traumas, histórico relevante..."
              value={formData.traumaHistory} onChange={e => set('traumaHistory', e.target.value)} />
          </section>

          <section className="bg-[#1a1a1a] rounded-[24px] overflow-hidden">
            <button type="button" onClick={() => setShowMemorial(!showMemorial)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Ghost size={15} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[2px]">Memorial de Partida</span>
              </div>
              <ChevronRight size={15}
                className={`text-indigo-400 transition-transform ${showMemorial ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {showMemorial && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden">
                  <div className="px-5 pb-5 space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-indigo-300/60 uppercase tracking-widest block mb-1">Data da Partida</label>
                      <input type="date"
                        className="w-full p-3 bg-white/5 rounded-2xl text-white border border-white/10 outline-none font-bold text-xs"
                        value={formData.deathDate} onChange={e => set('deathDate', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-indigo-300/60 uppercase tracking-widest block mb-1">Causa Mortis</label>
                      <select
                        className="w-full p-3 bg-white/5 rounded-2xl text-white border border-white/10 outline-none font-bold text-xs appearance-none"
                        value={formData.deathCause} onChange={e => set('deathCause', e.target.value)}>
                        {[
                          ['','Não informado'],['IRC','IRC — Insuf. Renal'],['FIV','FIV — Imunodeficiência'],
                          ['FELV','FeLV — Leucemia Felina'],['LINFOMA','Linfoma / Câncer'],
                          ['PIF','PIF — Peritonite Felina'],['TRAUMA','Trauma / Acidente'],
                          ['INFECCAO','Infecção Grave'],['CARDIACO','Problema Cardíaco'],
                          ['VELHICE','Velhice Natural'],['DESCONHECIDO','Causa Desconhecida'],['OUTRO','Outro'],
                        ].map(([v, l]) => (
                          <option key={v} value={v} style={{ background: '#1a1a2e' }}>{l}</option>
                        ))}
                      </select>
                    </div>
                    {[
                      ['Card in Memoriam?', 'isArchived'],
                      ['Apenas no Memorial?', 'isMemorial'],
                    ].map(([label, key]) => (
                      <div key={key}
                        className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between text-indigo-200 text-[9px] font-black uppercase">
                        <span>{label}</span>
                        <input type="checkbox" className="w-5 h-5 accent-indigo-500"
                          checked={formData[key]} onChange={e => set(key, e.target.checked)} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <button type="button" onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-4 border-2 border-dashed border-red-100 text-red-300 rounded-[24px] font-black uppercase text-[10px] tracking-[2px] hover:bg-red-50 transition-all active:scale-95">
            Excluir Perfil Permanentemente
          </button>

          <button type="button" onClick={handleUpdate} disabled={loading}
            className="w-full py-5 text-white rounded-[24px] font-black uppercase tracking-[3px] shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mb-6"
            style={{ background: `linear-gradient(135deg, ${activeGradient.fromHex}, ${activeGradient.toHex})` }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={16}/> Salvar Perfil</>}
          </button>

        </div>
      </motion.div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-end justify-center">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[40px] p-8 pb-12 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter mb-4">
                Excluir {formData.name}?
              </h3>
              <div className="text-left mb-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">
                  Motivo
                </label>
                <select
                  className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs outline-none border border-gray-100"
                  value={deleteReason} onChange={e => setDeleteReason(e.target.value)}>
                  <option value="">Selecione um motivo...</option>
                  <option value="erro">Erro no cadastro</option>
                  <option value="partida">O gatinho faleceu</option>
                  <option value="doacao">Foi doado / Novo lar</option>
                  <option value="outro">Outro motivo</option>
                </select>
              </div>
              <button type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData));
                  a.download = `backup_${formData.name}.json`;
                  a.click(); a.remove();
                }}
                className="w-full py-3.5 mb-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-indigo-100">
                <Upload size={13} className="rotate-180" /> Baixar Backup
              </button>
              <div className="space-y-2">
                <button onClick={handleDelete} disabled={!deleteReason}
                  className={`w-full py-5 rounded-[24px] font-black uppercase text-[10px] tracking-widest ${
                    deleteReason ? 'bg-red-500 text-white' : 'bg-gray-200 text-white cursor-not-allowed'
                  }`}>
                  Confirmar Exclusão
                </button>
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-gray-100 text-gray-400 rounded-[24px] font-black uppercase text-[10px] tracking-widest">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}