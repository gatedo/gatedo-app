import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, User, MapPin, Save, Check, Phone, Mail, Search } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import useSensory from '../hooks/useSensory';
import api from '../services/api';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user, setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({ name: '', city: '', whatsapp: '' });
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);

  // ── Busca de cidade via IBGE ──────────────────────────────────────────────
  const [cityQuery, setCityQuery]     = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const cityDebounce = useRef(null);

  // Carrega dados do usuário
  useEffect(() => {
    if (!user) return;
    setFormData({
      name:      user.name      || '',
      city:      user.city      || '',
      whatsapp:  user.phone     || '',
    });
    setAvatarPreview(user.photoUrl || '');
    setCityQuery(user.city || '');
  }, [user]);

  // Busca cidades no IBGE ao digitar (debounce 400ms)
  useEffect(() => {
    if (cityQuery.length < 3) { setCitySuggestions([]); return; }
    clearTimeout(cityDebounce.current);
    cityDebounce.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome`
        );
        const data = await res.json();
        const filtered = data
          .filter(m => m.nome.toLowerCase().startsWith(cityQuery.toLowerCase()))
          .slice(0, 6)
          .map(m => `${m.nome} - ${m.microrregiao.mesorregiao.UF.sigla}`);
        setCitySuggestions(filtered);
      } catch {
        setCitySuggestions([]);
      } finally {
        setCityLoading(false);
      }
    }, 400);
    return () => clearTimeout(cityDebounce.current);
  }, [cityQuery]);

  const selectCity = (city) => {
    setFormData(p => ({ ...p, city }));
    setCityQuery(city);
    setCitySuggestions([]);
    touch();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  async function handleSave() {
    setSaving(true);
    touch();
    try {
      const data = new FormData();
      data.append('name',  formData.name);
      data.append('city',  formData.city);
      data.append('phone', formData.whatsapp);
      if (avatarFile) data.append('file', avatarFile);

      const res = await api.patch(`/users/${user.id}`, data);
      const updatedUser = { ...user, ...res.data, phone: res.data.phone ?? formData.whatsapp };

      setUser(updatedUser);
      localStorage.setItem('gatedo_user', JSON.stringify(updatedUser));

      setSaved(true);
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "bg-transparent border-none outline-none text-sm font-bold text-gray-700 w-full placeholder-gray-300";
  const fieldWrap  = "bg-white rounded-[24px] p-4 shadow-sm border border-gray-50 flex items-center gap-4";

  return (
    <div className="min-h-screen bg-[#F8F9FE] px-6 pt-12 pb-32 font-sans">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-2xl shadow-sm text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-gray-800 uppercase tracking-widest">Editar Perfil</h1>
        <div className="w-10" />
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl bg-gray-100">
            {avatarPreview
              ? <img src={avatarPreview} className="w-full h-full object-cover" alt="Tutor" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40} /></div>}
          </div>
          <label className="absolute -bottom-2 -right-2 bg-[#6158ca] text-white p-3 rounded-2xl shadow-lg border-2 border-white cursor-pointer active:scale-90 transition-transform">
            <Camera size={20} />
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
          </label>
        </div>
        <p className="mt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
          Toque para trocar a foto
        </p>
      </div>

      {/* Campos */}
      <div className="space-y-4">

        {/* Email — somente leitura */}
        <div>
          <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mb-2 block">
            E-mail
          </label>
          <div className={`${fieldWrap} bg-gray-50 opacity-70`}>
            <Mail size={18} className="text-gray-300 flex-shrink-0" />
            <span className="text-sm font-bold text-gray-400">{user?.email || '—'}</span>
            <span className="ml-auto text-[9px] font-black text-green-500 uppercase tracking-wider bg-green-50 px-2 py-1 rounded-full">
              Verificado
            </span>
          </div>
        </div>

        {/* Nome */}
        <div>
          <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mb-2 block">
            Seu Nome
          </label>
          <div className={fieldWrap}>
            <User size={18} className="text-[#6158ca] flex-shrink-0" />
            <input className={inputClass} type="text" placeholder="Seu nome completo"
              value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mb-2 block">
            WhatsApp
          </label>
          <div className={fieldWrap}>
            <Phone size={18} className="text-[#6158ca] flex-shrink-0" />
            <input className={inputClass} type="tel" placeholder="(51) 99999-9999"
              value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
          </div>
        </div>

        {/* Cidade com autocomplete IBGE */}
        <div>
          <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mb-2 block">
            Cidade
          </label>
          <div className="relative">
            <div className={fieldWrap}>
              <MapPin size={18} className="text-[#6158ca] flex-shrink-0" />
              <input className={inputClass} type="text"
                placeholder="Digite sua cidade..."
                value={cityQuery}
                onChange={e => { setCityQuery(e.target.value); setFormData(p => ({...p, city: e.target.value})); }}
              />
              {cityLoading && (
                <div className="w-4 h-4 border-2 border-[#6158ca] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </div>

            {/* Sugestões */}
            <AnimatePresence>
              {citySuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[20px] shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  {citySuggestions.map((city, i) => (
                    <button key={i} onClick={() => selectCity(city)}
                      className="w-full px-5 py-3.5 text-left text-sm font-bold text-gray-700 hover:bg-[#6158ca]/5 flex items-center gap-3 border-b border-gray-50 last:border-none transition-colors"
                    >
                      <MapPin size={14} className="text-[#6158ca] flex-shrink-0" />
                      {city}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[9px] font-bold text-gray-300 ml-4 mt-1.5">
            Usamos sua cidade para mostrar petshops e vets próximos 🐾
          </p>
        </div>
      </div>

      {/* Botão Salvar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full mt-10 py-5 rounded-[28px] font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-70 ${
          saved ? 'bg-green-500 text-white' : 'bg-[#6158ca] text-white'
        }`}
      >
        {saved
          ? <><Check size={20} /> Salvo!</>
          : <><Save size={20} /> {saving ? 'Salvando...' : 'Salvar Alterações'}</>}
      </button>
    </div>
  );
}
