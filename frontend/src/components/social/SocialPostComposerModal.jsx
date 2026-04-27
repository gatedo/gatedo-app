import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Image,
  MessageCircle,
  Sparkles,
  Send,
  X,
  Check,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import { useGamification } from '../../context/GamificationContext';
import { AuthContext } from '../../context/AuthContext';

const FALLBACK_USER = '/assets/App_gatedo_logo1.webp';
const FALLBACK_CAT = '/assets/App_gatedo_logo1.webp';

function safeImg(url, fallback = FALLBACK_CAT) {
  return url && String(url).trim() ? url : fallback;
}

function isMemorialPet(pet) {
  if (!pet) return false;

  const memorialFlag =
    pet.isMemorial === true ||
    pet.isMemorial === 'true' ||
    pet.isMemorial === 1 ||
    pet.isMemorial === '1' ||
    pet.memorial === true ||
    pet.memorial === 'true' ||
    pet.memorial === 1 ||
    pet.memorial === '1' ||
    pet.status === 'MEMORIAL' ||
    pet.profileStatus === 'MEMORIAL';

  const hasDeathDate =
    !!pet.deathDate &&
    String(pet.deathDate).trim() !== '' &&
    String(pet.deathDate).trim().toLowerCase() !== 'null';

  return memorialFlag || hasDeathDate;
}

function normalizeGalleryFromPet(pet) {
  if (!pet) return [];

  const raw =
    pet.gallery ||
    pet.photos ||
    pet.images ||
    pet.media ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `gallery_${index}`,
          imageUrl: item,
          type: 'gallery',
          label: `Galeria ${index + 1}`,
        };
      }

      return {
        id: item.id || `gallery_${index}`,
        imageUrl: item.imageUrl || item.url || item.img || item.src || null,
        type: 'gallery',
        label: item.label || `Galeria ${index + 1}`,
      };
    })
    .filter((item) => !!item.imageUrl)
    .slice(0, 9);
}

function normalizeStudioAssets(list, currentPetId) {
  if (!Array.isArray(list)) return [];

  return list
    .filter((item) => {
      if (!currentPetId) return true;
      return !item.petId || item.petId === currentPetId;
    })
    .map((item, index) => ({
      id: item.id || `studio_${index}`,
      imageUrl:
        item.imageUrl ||
        item.url ||
        item.outputUrl ||
        item.previewUrl ||
        item.resultUrl ||
        item.outputImageUrl ||
        null,
      type: 'studio',
      label: item.title || item.name || item.type || 'Studio',
      petId: item.petId || null,
      studioCreationId:
        item.studioCreationId ??
        item.creationId ??
        item.id ??
        null,
    }))
    .filter((item) => !!item.imageUrl);
}

function normalizePets(list) {
  if (!Array.isArray(list)) return [];

  return list
    .filter((pet) => !isMemorialPet(pet))
    .map((pet, index) => ({
      id: pet.id || `pet_${index}`,
      name: pet.name || `Gato ${index + 1}`,
      breed: pet.breed || 'SRD',
      photoUrl:
        pet.photoUrl ||
        pet.avatar ||
        pet.imageUrl ||
        pet.coverUrl ||
        FALLBACK_CAT,
      isMemorial: !!pet.isMemorial,
      deathDate: pet.deathDate || null,
      raw: pet,
    }));
}

function extractWalletData(gami) {
  const ctxXp = Number(
    gami?.xpt ??
      gami?.xp ??
      gami?.totalEarned ??
      0,
  ) || 0;

  const ctxPoints = Number(
    gami?.gpts ??
      gami?.points ??
      gami?.gatedoPoints ??
      0,
  ) || 0;

  return {
    xp: ctxXp,
    points: ctxPoints,
  };
}

const apiPost = (url, payload) => api.post(url, payload);
const apiGet = (url, params) => api.get(url, params ? { params } : undefined);

export default function SocialPostComposerModal({
  isOpen = true,
  cat = null,
  selectedPetId = null,
  selectedStudioCreation = null,
  themeHex = '#e1ff00',
  tutorName,
  tutorAvatar,
  onClose,
  onPublished,
  onSuccess,
}) {
  const { user: authUser } = useContext(AuthContext);
  const gami = useGamification();

  const [text, setText] = useState('');
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [postType, setPostType] = useState('PHOTO');
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [pets, setPets] = useState([]);
  const [currentPet, setCurrentPet] = useState(cat && !isMemorialPet(cat) ? cat : null);

  const [galleryAssets, setGalleryAssets] = useState([]);
  const [studioAssets, setStudioAssets] = useState([]);
  const [tab, setTab] = useState(selectedStudioCreation ? 'studio' : 'gallery');
  const [visibility, setVisibility] = useState('PUBLIC');

  const [userXP, setUserXP] = useState(0);
  const [userPoints, setUserPoints] = useState(0);

  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingPets, setLoadingPets] = useState(false);

  const fileRef = useRef(null);

  const PUBLISH_MIN_XP = 100;
  const NORMAL_COST = 5;
  const EXTERNAL_COST = 10;

  const isAdmin = authUser?.role === 'ADMIN';

  const resolvedTutorName = tutorName || authUser?.name || 'Tutor';
  const resolvedTutorAvatar =
  tutorAvatar?.trim?.() ||
  authUser?.photoUrl?.trim?.() ||
  FALLBACK_USER;

  const currentPetId = useMemo(() => {
    if (currentPet && !isMemorialPet(currentPet)) {
      return currentPet.id;
    }

    if (cat && !isMemorialPet(cat)) {
      return cat.id;
    }

    return null;
  }, [currentPet, cat]);

  const isCurrentPetMemorial = useMemo(
    () => isMemorialPet(currentPet),
    [currentPet],
  );

  const resolvedCatName =
    currentPet && !isMemorialPet(currentPet)
      ? currentPet.name
      : cat && !isMemorialPet(cat)
        ? cat.name
        : 'seu gato';

  const publishCost = useMemo(() => {
    if (isAdmin) return 0;
    if (tab === 'external') return EXTERNAL_COST;
    return NORMAL_COST;
  }, [tab, isAdmin]);

  const canPublish = useMemo(() => {
    if (isCurrentPetMemorial) return false;
    if (!currentPetId) return false;

    const hasContent = !!text.trim() || !!selectedPhotoPreview || !!selectedAsset;
    if (!hasContent) return false;

    if (isAdmin) return true;

    return userXP >= PUBLISH_MIN_XP && userPoints >= publishCost;
  }, [
    currentPetId,
    isCurrentPetMemorial,
    isAdmin,
    text,
    selectedPhotoPreview,
    selectedAsset,
    userXP,
    userPoints,
    publishCost,
  ]);

  const types = [
    { id: 'PHOTO', label: 'Foto', icon: Camera, color: '#EC4899' },
    { id: 'HEALTH_WIN', label: 'Saúde', icon: Check, color: '#16A34A' },
    { id: 'QUESTION', label: 'Dúvida', icon: MessageCircle, color: '#D97706' },
    { id: 'MEME', label: 'Humor', icon: Sparkles, color: '#8B5CF6' },
  ];

  const walletLoadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      walletLoadedRef.current = false;
      return;
    }

    if (walletLoadedRef.current) return;
    walletLoadedRef.current = true;

    const resolved = extractWalletData(gami);
    setUserXP(isAdmin ? 999999 : resolved.xp || 0);
    setUserPoints(isAdmin ? 999999 : resolved.points || 0);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const loadPets = async () => {
      setLoadingPets(true);

      try {
        const res = await apiGet('/pets');
        const normalized = normalizePets(Array.isArray(res.data) ? res.data : []);

        if (!active) return;

        setPets(normalized);

        if (cat?.id && !isMemorialPet(cat)) {
          const found = normalized.find((item) => item.id === cat.id);
          setCurrentPet(found?.raw || cat);
        } else if (selectedPetId) {
          const found = normalized.find((item) => item.id === selectedPetId);
          if (found) setCurrentPet(found.raw);
          else setCurrentPet(null);
        } else if (selectedStudioCreation?.petId) {
          const found = normalized.find((item) => item.id === selectedStudioCreation.petId);
          if (found) setCurrentPet(found.raw);
          else setCurrentPet(null);
        } else if (normalized.length === 1) {
          setCurrentPet(normalized[0].raw);
        } else if (!normalized.length) {
          setCurrentPet(null);
        }
      } catch {
        if (!active) return;
        setPets([]);
        setCurrentPet(cat && !isMemorialPet(cat) ? cat : null);
      } finally {
        if (active) setLoadingPets(false);
      }
    };

    loadPets();

    return () => {
      active = false;
    };
  }, [isOpen, cat, selectedPetId, selectedStudioCreation?.petId]);

  useEffect(() => {
    if (!isOpen) return;

    if (selectedStudioCreation) {
      const studioAsset = {
        id: selectedStudioCreation.id || 'studio_selected',
        imageUrl:
          selectedStudioCreation.imageUrl ||
          selectedStudioCreation.url ||
          selectedStudioCreation.outputUrl ||
          selectedStudioCreation.previewUrl ||
          selectedStudioCreation.resultUrl ||
          selectedStudioCreation.outputImageUrl ||
          null,
        type: 'studio',
        label:
          selectedStudioCreation.title ||
          selectedStudioCreation.name ||
          selectedStudioCreation.type ||
          'Studio',
        petId: selectedStudioCreation.petId || currentPetId || null,
        studioCreationId: selectedStudioCreation.id || null,
      };

      if (studioAsset.imageUrl) {
        setSelectedAsset(studioAsset);
        setSelectedPhotoPreview(null);
        setTab('studio');
      }
    }
  }, [selectedStudioCreation, currentPetId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!currentPetId || isCurrentPetMemorial) {
      setGalleryAssets([]);
      setStudioAssets([]);
      if (!selectedStudioCreation) {
        setSelectedAsset(null);
        setSelectedPhotoPreview(null);
      }
      return;
    }

    let active = true;

    const loadAssets = async () => {
      setLoadingAssets(true);

      try {
        const [assetsRes, petRes, studioRes] = await Promise.allSettled([
          apiGet(`/social/pets/${currentPetId}/assets`),
          apiGet(`/pets/${currentPetId}`),
          apiGet('/studio/creations', { petId: currentPetId }),
        ]);

        let gallery = [];
        let studio = [];

        if (assetsRes.status === 'fulfilled' && assetsRes.value?.data) {
          const data = assetsRes.value.data;
          gallery = normalizeGalleryFromPet({ gallery: data.gallery || [] });
          studio = normalizeStudioAssets(data.studio || [], currentPetId);
        }

        if (!gallery.length && petRes.status === 'fulfilled' && petRes.value?.data) {
          gallery = normalizeGalleryFromPet(petRes.value.data);
        }

        if (!studio.length && studioRes.status === 'fulfilled' && studioRes.value?.data) {
          const raw = Array.isArray(studioRes.value.data)
            ? studioRes.value.data
            : studioRes.value.data?.items || studioRes.value.data?.creations || [];
          studio = normalizeStudioAssets(raw, currentPetId);
        }

        if (selectedStudioCreation?.id) {
          const selectedStudioImage =
            selectedStudioCreation.imageUrl ||
            selectedStudioCreation.url ||
            selectedStudioCreation.outputUrl ||
            selectedStudioCreation.previewUrl ||
            selectedStudioCreation.resultUrl ||
            selectedStudioCreation.outputImageUrl ||
            null;

          if (selectedStudioImage) {
            const exists = studio.some((item) => item.id === selectedStudioCreation.id);
            if (!exists) {
              studio.unshift({
                id: selectedStudioCreation.id,
                imageUrl: selectedStudioImage,
                type: 'studio',
                label: selectedStudioCreation.title || selectedStudioCreation.name || 'Studio',
                petId: selectedStudioCreation.petId || currentPetId,
                studioCreationId: selectedStudioCreation.id,
              });
            }
          }
        }

        if (!active) return;
        setGalleryAssets(gallery);
        setStudioAssets(studio);
      } catch {
        if (!active) return;
        setGalleryAssets(normalizeGalleryFromPet(currentPet));
        setStudioAssets([]);
      } finally {
        if (active) setLoadingAssets(false);
      }
    };

    loadAssets();

    return () => {
      active = false;
    };
  }, [currentPetId, currentPet, selectedStudioCreation, isCurrentPetMemorial, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setDone(false);
    setError('');
  }, [isOpen]);

  const handlePublish = async () => {
  if (isCurrentPetMemorial) {
    setError('Este perfil está em memorial e não pode publicar na Comunigato.');
    return;
  }

  if (!canPublish || !currentPetId) return;

  setPublishing(true);
  setError('');

  let uploadedImageUrl = selectedAsset?.imageUrl || null;
  let source = 'INTERNAL_GALLERY';
  let studioCreationId = null;

  if (tab === 'gallery' && selectedAsset) {
    source = 'INTERNAL_GALLERY';
  }

  if (tab === 'studio' && selectedAsset) {
    source = 'STUDIO_CREATION';
    studioCreationId =
      selectedAsset?.studioCreationId ??
      selectedAsset?.id ??
      null;

    uploadedImageUrl =
      selectedAsset?.imageUrl ??
      selectedAsset?.url ??
      null;
  }

  try {
    if (tab === 'external' && fileRef.current?.files?.[0]) {
      const mediaForm = new FormData();
      mediaForm.append('file', fileRef.current.files[0]);

      const uploadRes = await api.post('/media/upload', mediaForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      uploadedImageUrl = uploadRes.data?.url || uploadRes.data?.imageUrl || null;
      source = 'EXTERNAL_UPLOAD';
    }

    const normalizedVisibility =
      visibility === 'FOLLOWERS' ? 'PUBLIC' : visibility;

    let payload = {
      type: postType,
      source,
      visibility: normalizedVisibility,
      content: text || '',
      imageUrl: uploadedImageUrl || null,
      studioCreationId: studioCreationId || null,
      petId: currentPetId,
      allowComments: true,
      allowShare: true,
    };

    console.log('publish payload', payload);

    let res;

    try {
      res = await apiPost('/social/posts', payload);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      console.error('Erro ao publicar (tentativa studio):', {
        url: err?.config?.url,
        method: err?.config?.method,
        status,
        data,
        payload,
      });

      const isStudioFailure =
        payload.source === 'STUDIO_CREATION' &&
        (status === 404 || status === 400 || status === 403);

      if (!isStudioFailure) {
        throw err;
      }

      let fallbackImageUrl = payload.imageUrl;

      if (
        fallbackImageUrl &&
        typeof fallbackImageUrl === 'string' &&
        fallbackImageUrl.startsWith('data:image/')
      ) {
        const blob = await fetch(fallbackImageUrl).then((r) => r.blob());
        const ext = blob.type.split('/')[1] || 'png';
        const file = new File([blob], `studio-post.${ext}`, { type: blob.type });

        const mediaForm = new FormData();
        mediaForm.append('file', file);

        const uploadRes = await api.post('/media/upload', mediaForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        fallbackImageUrl = uploadRes.data?.url || uploadRes.data?.imageUrl || null;
      }

      payload = {
        ...payload,
        source: 'INTERNAL_GALLERY',
        studioCreationId: null,
        imageUrl: fallbackImageUrl || payload.imageUrl || null,
      };

      console.log('publish fallback payload', payload);

      res = await apiPost('/social/posts', payload);
    }

    if (!isAdmin) {
      setUserPoints((prev) => Math.max(0, prev - publishCost));
    }

    window.dispatchEvent(new CustomEvent('comunigato:new_post'));
    window.dispatchEvent(new CustomEvent('gatedo-social-published'));
    window.dispatchEvent(
      new CustomEvent('gatedo:xp-updated', {
        detail: {
          amount: 6,
          source: 'publish',
        },
      }),
    );

    onPublished?.(res?.data);
    onSuccess?.(res?.data);

    setDone(true);

    setTimeout(() => {
      onClose?.();
    }, 1000);
  } catch (err) {
    console.error('Erro final ao publicar:', {
      url: err?.config?.url,
      method: err?.config?.method,
      status: err?.response?.status,
      data: err?.response?.data,
      petId: currentPetId,
      source,
      studioCreationId,
      uploadedImageUrl,
    });

    setError(
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      'Erro ao publicar na Comunigato.',
    );
  } finally {
    setPublishing(false);
  }
};

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[350] flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-t-[32px] pb-10"
          style={{ background: '#fff', maxHeight: '92vh', overflowY: 'auto' }}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />

          <div className="flex items-center justify-between px-5 mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} style={{ color: themeHex }} />
              <p className="font-black text-gray-800 text-sm">Publicar na ComuniGato</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="px-5 mb-3">
            <p className="text-[11px] font-black text-gray-700 mb-2">Escolha o gato</p>

            {loadingPets ? (
              <div className="rounded-[16px] p-3 bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold">Carregando gatos...</p>
              </div>
            ) : pets.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pets
  .filter((pet) => !isMemorialPet(pet.raw || pet))
  .map((pet) => {
                  const active = currentPetId === pet.id;
                  return (
                    <button
                      type="button"
                      key={pet.id}
                      onClick={() => {
                        setCurrentPet(pet.raw);
                        setSelectedAsset(null);
                        setSelectedPhotoPreview(null);
                        setError('');
                      }}
                      className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-[16px] border"
                      style={{
                        background: active ? `${themeHex}20` : '#fff',
                        borderColor: active ? themeHex : '#E5E7EB',
                      }}
                    >
                      <img
                        src={safeImg(pet.photoUrl)}
                        alt={pet.name}
                        className="w-12 h-12 rounded-[14px] object-cover"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_CAT;
                        }}
                      />
                      <span className="text-[9px] font-black text-gray-700 max-w-[64px] truncate">
                        {pet.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[16px] p-3 bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold">Nenhum gato elegível para publicação.</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-5 mb-3">
            <img
              src={safeImg(resolvedTutorAvatar, FALLBACK_USER)}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              style={{ border: `2px solid ${themeHex}` }}
              alt={resolvedTutorName}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_USER;
              }}
            />
            <div>
              <p className="text-xs font-black text-gray-700">{resolvedTutorName}</p>
              <p className="text-[9px] text-gray-400 font-bold">
                sobre <span style={{ color: themeHex }}>{resolvedCatName}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2 px-5 mb-4 overflow-x-auto pb-1">
            {types.map((t) => {
              const TIcon = t.icon;
              const active = postType === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setPostType(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-[10px] flex-shrink-0 transition-all"
                  style={active ? { background: t.color, color: '#fff' } : { background: `${t.color}12`, color: t.color }}
                >
                  <TIcon size={11} /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="px-5 mb-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Conte algo sobre ${resolvedCatName} ...`}
              rows={3}
              className="w-full text-sm text-gray-700 font-medium leading-relaxed resize-none outline-none rounded-[16px] p-3 border border-gray-100"
              style={{ background: '#F9FAFB' }}
            />
          </div>

          <div className="flex items-center gap-2 px-5 mb-3">
            <button
              type="button"
              onClick={() => setTab('gallery')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-black text-[10px]"
              style={tab === 'gallery' ? { background: '#EC4899', color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
            >
              <Camera size={13} /> Puxar foto
            </button>

            <button
              type="button"
              onClick={() => setTab('external')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-black text-[10px]"
              style={tab === 'external' ? { background: '#111827', color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
            >
              <Upload size={13} /> Foto externa
            </button>

            <button
              type="button"
              onClick={() => setTab('studio')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-black text-[10px]"
              style={tab === 'studio' ? { background: '#8B4AFF', color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
            >
              <Sparkles size={13} /> Usar Studio
            </button>
          </div>

          {!currentPetId && (
            <div className="px-5 mb-4">
              <div className="rounded-[16px] p-3 bg-amber-50 border border-amber-200">
                <p className="text-[11px] font-black text-amber-700">Selecione um gato antes de publicar</p>
                <p className="text-[10px] text-amber-600 font-medium mt-1">
                  O modal precisa estar vinculado a um perfil felino para carregar galeria, Studio e publicar corretamente.
                </p>
              </div>
            </div>
          )}

          {isCurrentPetMemorial && (
            <div className="px-5 mb-4">
              <div className="rounded-[16px] p-3 bg-rose-50 border border-rose-200">
                <p className="text-[11px] font-black text-rose-700">
                  Este perfil está em memorial
                </p>
                <p className="text-[10px] text-rose-600 font-medium mt-1">
                  Publicações comuns na Comunigato não são permitidas após a partida. Use apenas a área de memorial.
                </p>
              </div>
            </div>
          )}

          {currentPetId && !isCurrentPetMemorial && tab === 'gallery' && (
            <div className="px-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-black text-gray-700">Galeria interna do gato</p>
                <p className="text-[9px] text-gray-400 font-bold">custo normal</p>
              </div>

              {loadingAssets ? (
                <div className="rounded-[16px] p-3 bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold">Carregando galeria...</p>
                </div>
              ) : galleryAssets.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {galleryAssets.map((asset) => {
                    const active = selectedAsset?.id === asset.id;
                    return (
                      <button
                        type="button"
                        key={asset.id}
                        onClick={() => {
                          setSelectedAsset(asset);
                          setSelectedPhotoPreview(null);
                          setError('');
                        }}
                        className="relative aspect-square rounded-[14px] overflow-hidden border-2"
                        style={{
                          borderColor: active ? themeHex : 'transparent',
                          boxShadow: active ? `0 0 0 2px ${themeHex}30` : 'none',
                        }}
                      >
                        <img src={asset.imageUrl} className="w-full h-full object-cover" alt={asset.label} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[16px] p-3 bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold">
                    Nenhuma imagem da galeria encontrada para este gato.
                  </p>
                </div>
              )}
            </div>
          )}

          {currentPetId && !isCurrentPetMemorial && tab === 'studio' && (
            <div className="px-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-black text-gray-700">Criações do Studio</p>
                <p className="text-[9px] text-gray-400 font-bold">custo normal</p>
              </div>

              {loadingAssets ? (
                <div className="rounded-[16px] p-3 bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold">Carregando criações...</p>
                </div>
              ) : studioAssets.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {studioAssets.map((asset) => {
                    const active = selectedAsset?.id === asset.id;
                    return (
                      <button
                        type="button"
                        key={asset.id}
                        onClick={() => {
                          setSelectedAsset(asset);
                          setSelectedPhotoPreview(null);
                          setError('');
                        }}
                        className="relative aspect-square rounded-[14px] overflow-hidden border-2"
                        style={{
                          borderColor: active ? themeHex : 'transparent',
                          boxShadow: active ? `0 0 0 2px ${themeHex}30` : 'none',
                        }}
                      >
                        <img src={asset.imageUrl} className="w-full h-full object-cover" alt={asset.label} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[16px] p-3 bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold">
                    Nenhuma criação do Studio encontrada para este gato.
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === 'external' && !isCurrentPetMemorial && (
            <div className="px-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-black text-gray-700">Foto externa do dispositivo</p>
                <p className="text-[9px] text-gray-400 font-bold">custo dobrado</p>
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full font-black text-[10px] text-gray-500"
                style={{ background: '#F3F4F6' }}
              >
                <Image size={13} /> Selecionar imagem
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSelectedAsset(null);
                  setSelectedPhotoPreview(URL.createObjectURL(file));
                  setError('');
                }}
              />
            </div>
          )}

          {selectedPhotoPreview && (
            <div className="px-5 mb-3 relative">
              <img src={selectedPhotoPreview} className="w-full h-40 object-cover rounded-[16px]" alt="preview" />
              <button
                type="button"
                onClick={() => setSelectedPhotoPreview(null)}
                className="absolute top-2 right-7 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          )}

          {selectedAsset && (
            <div className="px-5 mb-3 relative">
              <img src={selectedAsset.imageUrl} className="w-full h-40 object-cover rounded-[16px]" alt="asset selecionado" />
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="absolute top-2 right-7 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          )}

          <div className="px-5 mb-3">
            <select
              className="w-full rounded-[16px] p-3 border border-gray-100 text-sm text-gray-700 font-medium outline-none"
              style={{ background: '#fff' }}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PUBLIC">Público</option>
              <option value="FOLLOWERS">Seguidores</option>
            </select>
          </div>

          {!!error && (
            <div className="px-5 mb-3">
              <div className="rounded-[16px] px-4 py-3 bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-black text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="px-5 mb-3">
            <div
              className="rounded-[16px] px-4 py-3"
              style={
                canPublish
                  ? { background: '#F0FDF4', border: '1px solid #86EFAC' }
                  : { background: '#FEF3C7', border: '1px solid #FCD34D' }
              }
            >
              <p
                className="text-[11px] font-black"
                style={{ color: canPublish ? '#166534' : '#92400E' }}
              >
                {!currentPetId
                  ? 'Selecione um gato para publicar'
                  : isCurrentPetMemorial
                    ? 'Perfil em memorial não pode publicar na Comunigato'
                    : isAdmin
                      ? 'ADMIN: publicação liberada sem consumo'
                      : canPublish
                        ? `Pronto para publicar • custo ${publishCost} points`
                        : `Você precisa de 100 XP e saldo suficiente para publicar`}
              </p>

              <p
                className="text-[10px] font-bold mt-1"
                style={{ color: canPublish ? '#15803D' : '#B45309' }}
              >
                {`XP atual: ${userXP} • Points atuais: ${userPoints}`}
              </p>
            </div>
          </div>

          <div className="px-5 mt-3">
            {done ? (
              <div
                className="w-full py-3.5 rounded-[18px] flex items-center justify-center gap-2 font-black text-sm"
                style={{ background: '#F0FDF4', color: '#16A34A' }}
              >
                <Check size={16} /> Publicado com sucesso!
              </div>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handlePublish}
                disabled={publishing || !canPublish}
                className="w-full py-3.5 rounded-[18px] flex items-center justify-center gap-2 font-black text-sm transition-all"
                style={
                  canPublish
                    ? { background: themeHex, color: '#1a1a00', boxShadow: `0 6px 24px ${themeHex}50` }
                    : { background: '#F3F4F6', color: '#9CA3AF' }
                }
              >
                {publishing ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <Send size={14} /> Publicar na ComuniGato
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}