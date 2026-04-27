import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Check,
  ChevronLeft,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import useSensory from '../hooks/useSensory';
import api from '../services/api';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('gatedo_user') || '{}');
  } catch {
    return {};
  }
}

function buildFormState(profile) {
  return {
    name: profile?.name || '',
    city: profile?.city || '',
    whatsapp: profile?.phone || profile?.whatsapp || '',
  };
}

function mergeProfileSnapshot(...parts) {
  const merged = Object.assign({}, ...parts.filter(Boolean));
  return {
    ...merged,
    phone: merged?.phone ?? merged?.whatsapp ?? '',
    city: merged?.city ?? '',
    name: merged?.name ?? '',
    photoUrl: merged?.photoUrl ?? '',
    email: merged?.email ?? '',
  };
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user, setUser } = useContext(AuthContext);

  const storedUser = useMemo(() => readStoredUser(), []);
  const currentUserId = user?.id || storedUser?.id || null;
  const MotionDiv = motion.div;

  const draftDirtyRef = useRef(false);
  const previewUrlRef = useRef(null);
  const cityDebounceRef = useRef(null);

  const initialProfileRef = useRef(null);
  if (!initialProfileRef.current || initialProfileRef.current.id !== currentUserId) {
    initialProfileRef.current = mergeProfileSnapshot(storedUser, user, {
      id: currentUserId,
    });
  }
  const initialProfile = initialProfileRef.current;

  const [profile, setProfile] = useState(initialProfile);
  const [formData, setFormData] = useState(() => buildFormState(initialProfile));
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(initialProfile?.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [cityQuery, setCityQuery] = useState(initialProfile?.city || '');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);

  const hydrateDraft = useCallback((nextProfile, { force = false } = {}) => {
    if (!nextProfile) return;

    setProfile(nextProfile);

    if (!force && draftDirtyRef.current) {
      return;
    }

    setFormData(buildFormState(nextProfile));
    setCityQuery(nextProfile.city || '');

    if (!previewUrlRef.current) {
      setAvatarPreview(nextProfile.photoUrl || '');
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    let active = true;
    setProfileLoading(true);

    api.get(`/users/${currentUserId}/profile`)
      .then((response) => {
        if (!active || !response?.data) return;

        const freshProfile = mergeProfileSnapshot(readStoredUser(), response.data, {
          id: currentUserId,
        });

        hydrateDraft(freshProfile, { force: !draftDirtyRef.current });

        const authSnapshot = mergeProfileSnapshot(readStoredUser(), freshProfile);
        localStorage.setItem('gatedo_user', JSON.stringify(authSnapshot));
        setUser?.((current) => mergeProfileSnapshot(current, authSnapshot));
      })
      .catch(() => {
        if (!active) return;
        hydrateDraft(initialProfileRef.current);
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentUserId, hydrateDraft, setUser]);

  useEffect(() => {
    if (cityQuery.trim().length < 3) {
      setCitySuggestions([]);
      return;
    }

    clearTimeout(cityDebounceRef.current);
    cityDebounceRef.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const response = await fetch(
          'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome',
        );
        const data = await response.json();
        const filtered = (Array.isArray(data) ? data : [])
          .filter((city) =>
            String(city?.nome || '')
              .toLowerCase()
              .startsWith(cityQuery.toLowerCase()),
          )
          .slice(0, 6)
          .map(
            (city) =>
              `${city.nome} - ${city.microrregiao?.mesorregiao?.UF?.sigla || ''}`,
          );
        setCitySuggestions(filtered);
      } catch {
        setCitySuggestions([]);
      } finally {
        setCityLoading(false);
      }
    }, 350);

    return () => clearTimeout(cityDebounceRef.current);
  }, [cityQuery]);

  useEffect(
    () => () => {
      clearTimeout(cityDebounceRef.current);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    [],
  );

  const markDirty = useCallback(() => {
    draftDirtyRef.current = true;
    if (saved) setSaved(false);
  }, [saved]);

  const updateField = useCallback((key, value) => {
    markDirty();
    setFormData((current) => ({ ...current, [key]: value }));
  }, [markDirty]);

  const selectCity = useCallback((city) => {
    markDirty();
    setFormData((current) => ({ ...current, city }));
    setCityQuery(city);
    setCitySuggestions([]);
    touch();
  }, [markDirty, touch]);

  const handlePhotoChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    markDirty();
    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;
    setAvatarFile(file);
    setAvatarPreview(nextPreview);
  }, [markDirty]);

  async function handleSave() {
    if (!currentUserId) {
      alert('Usuário não encontrado para editar o perfil.');
      return;
    }

    if (!formData.name.trim()) {
      alert('Preencha seu nome antes de salvar.');
      return;
    }

    setSaving(true);
    touch();

    try {
      const payload = {
        name: formData.name.trim(),
        city: formData.city.trim(),
        phone: formData.whatsapp.trim(),
      };

      let response;

      if (avatarFile) {
        const data = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          data.append(key, value);
        });
        data.append('file', avatarFile);
        response = await api.patch(`/users/${currentUserId}`, data);
      } else {
        response = await api.patch(`/users/${currentUserId}`, payload);
      }

      const currentStoredUser = readStoredUser();
      const updatedUser = mergeProfileSnapshot(
        currentStoredUser,
        user,
        profile,
        response.data,
        {
          id: currentUserId,
          name: response.data?.name ?? formData.name.trim(),
          city: response.data?.city ?? formData.city.trim(),
          phone: response.data?.phone ?? formData.whatsapp.trim(),
          photoUrl:
            response.data?.photoUrl ||
            (previewUrlRef.current ? avatarPreview : profile?.photoUrl) ||
            '',
        },
      );

      if (previewUrlRef.current && response.data?.photoUrl) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      draftDirtyRef.current = false;
      setAvatarFile(null);
      setAvatarPreview(updatedUser.photoUrl || '');
      hydrateDraft(updatedUser, { force: true });
      setUser?.((current) => mergeProfileSnapshot(current, updatedUser));
      localStorage.setItem('gatedo_user', JSON.stringify(updatedUser));

      setSaved(true);
      setTimeout(() => navigate('/tutor-profile', { replace: true }), 900);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert(error.response?.data?.message || error.response?.data?.error || 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'bg-transparent border-none outline-none text-sm font-bold text-gray-700 w-full placeholder-gray-300';
  const fieldWrap =
    'bg-white rounded-[24px] p-4 shadow-sm border border-gray-50 flex items-center gap-4';
  const profileEmail = profile?.email || user?.email || storedUser?.email || '—';
  const emailVerified = Boolean(profile?.emailVerified ?? user?.emailVerified);

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] px-6 pt-12 pb-32 font-sans">
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-2xl shadow-sm text-gray-400"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-black text-gray-800 uppercase tracking-widest">
          Editar Perfil
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl bg-gray-100">
            {avatarPreview ? (
              <img src={avatarPreview} className="w-full h-full object-cover" alt="Tutor" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <User size={40} />
              </div>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 bg-gradient-to-br from-[#936cff] via-[#8b4dff] to-[#682adb] text-white p-3 rounded-2xl shadow-lg border-2 border-white cursor-pointer active:scale-90 transition-transform">
            <Camera size={20} />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </label>
        </div>
        <p className="mt-4 text-[10px] font-black text-[#8b4dff] uppercase tracking-widest">
          Toque para trocar a foto
        </p>
        {profileLoading ? (
          <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em]">
            Sincronizando dados salvos...
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mb-2 block">
            E-mail
          </label>
          <div className={`${fieldWrap} bg-gray-50 opacity-70`}>
            <Mail size={18} className="text-gray-300 flex-shrink-0" />
            <span className="text-sm font-bold text-gray-400">{profileEmail}</span>
            <span
              className={`ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                emailVerified
                  ? 'text-green-500 bg-green-50'
                  : 'text-amber-500 bg-amber-50'
              }`}
            >
              {emailVerified ? 'Verificado' : 'Pendente'}
            </span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mb-2 block">
            Seu Nome
          </label>
          <div className={fieldWrap}>
            <User size={18} className="text-[#8b4dff] flex-shrink-0" />
            <input
              className={inputClass}
              type="text"
              placeholder="Seu nome completo"
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mb-2 block">
            WhatsApp
          </label>
          <div className={fieldWrap}>
            <Phone size={18} className="text-[#8b4dff] flex-shrink-0" />
            <input
              className={inputClass}
              type="tel"
              placeholder="(51) 99999-9999"
              value={formData.whatsapp}
              onChange={(event) => updateField('whatsapp', event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4 mb-2 block">
            Cidade
          </label>
          <div className="relative">
            <div className={fieldWrap}>
              <MapPin size={18} className="text-[#8b4dff] flex-shrink-0" />
              <input
                className={inputClass}
                type="text"
                placeholder="Digite sua cidade..."
                value={cityQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  markDirty();
                  setCityQuery(value);
                  setFormData((current) => ({ ...current, city: value }));
                }}
              />
              {cityLoading ? (
                <div className="w-4 h-4 border-2 border-[#8b4dff] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : null}
            </div>

            <AnimatePresence>
              {citySuggestions.length > 0 ? (
                <MotionDiv
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[20px] shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  {citySuggestions.map((city, index) => (
                    <button
                      key={`${city}-${index}`}
                      onClick={() => selectCity(city)}
                      className="w-full px-5 py-3.5 text-left text-sm font-bold text-gray-700 hover:bg-[#8b4dff]/5 flex items-center gap-3 border-b border-gray-50 last:border-none transition-colors"
                    >
                      <MapPin size={14} className="text-[#8b4dff] flex-shrink-0" />
                      {city}
                    </button>
                  ))}
                </MotionDiv>
              ) : null}
            </AnimatePresence>
          </div>
          <p className="text-[9px] font-bold text-gray-300 ml-4 mt-1.5">
            Usamos sua cidade para mostrar petshops e vets próximos
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || profileLoading}
        className={`w-full mt-10 py-4 rounded-[18px] font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-70 ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-gradient-to-br from-[#936cff] via-[#8b4dff] to-[#682adb] text-white'
        }`}
      >
        {saved ? (
          <>
            <Check size={20} /> Salvo!
          </>
        ) : (
          <>
            <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </>
        )}
      </button>
    </div>
  );
}
