import React, { useEffect, useMemo, useState } from 'react';
import {
  Heart,
  Edit3,
  ChevronRight,
  BookOpen,
  QrCode,
  Check,
  Camera,
  Images,
  PawPrint,
  MapPin,
  Home,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditBioModal from './EditBioModal';
import GalleryUploadModal from './GalleryUploadModal';
import CatGalleryViewerModal from './CatGalleryViewerModal';
import {
  resolveThemeHex,
  resolveThemeGradient,
  CARD_GRADIENTS,
} from '../CatIdentityCard';
import FelineID from './FelineID';
import api from '../../../services/api';
import DiaryBanner from './DiaryBanner';
import {
  pruneSocialGallerySelection,
  saveSocialGallerySelection,
  toggleSocialGallerySelection,
} from '../../../utils/socialGallerySelection';

function normalizeGalleryItems(gallery) {
  if (!Array.isArray(gallery)) return [];

  return gallery
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `gallery-${index}`,
          url: item,
          alt: `Foto ${index + 1}`,
          raw: item,
        };
      }

      const url = item?.url || item?.img || item?.photoUrl || item?.imageUrl || null;
      if (!url) return null;

      return {
        id: item?.id || `gallery-${index}`,
        url,
        alt: item?.alt || `Foto ${index + 1}`,
        raw: item,
      };
    })
    .filter(Boolean);
}

function formatGender(value) {
  if (!value) return 'Não informado';

  const v = String(value).toLowerCase();

  if (['male', 'macho', 'masculino'].includes(v)) return 'Macho';
  if (['female', 'fêmea', 'femea', 'feminino'].includes(v)) return 'Fêmea';

  return value;
}

function formatArrivalType(value) {
  if (!value) return 'Não informado';

  const map = {
    adopted: 'Adotado',
    adoption: 'Adoção',
    rescued: 'Resgatado',
    rescue: 'Resgate',
    found: 'Encontrado',
    gift: 'Presente',
    born_at_home: 'Nasceu em casa',
    born_home: 'Nasceu em casa',
    foster: 'Lar temporário',
    bought: 'Comprado',
    from_street: 'Veio da rua',
  };

  return map[String(value).toLowerCase()] || value;
}

function formatHousingType(value) {
  if (!value) return 'Não informado';

  const map = {
    apartment: 'Apartamento',
    house: 'Casa',
    farm: 'Sítio / Chácara',
    indoor_only: 'Ambiente interno',
  };

  return map[String(value).toLowerCase()] || value;
}

function formatHabitat(value) {
  if (!value) return 'Não informado';

  const map = {
    indoor: 'Interno',
    outdoor: 'Externo',
    mixed: 'Misto',
    sheltered: 'Abrigado',
  };

  return map[String(value).toLowerCase()] || value;
}

function isSRD(cat) {
  const breed = String(cat?.breed || '')
    .trim()
    .toLowerCase();
  return ['srd', 'sem raça definida', 'sem raca definida', 'vira-lata', 'vira lata'].includes(breed);
}

function hasAnyValue(values = []) {
  return values.some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

function SectionCard({ icon: Icon, title, subtitle, themeColor, children, action }) {
  return (
    <section className="bg-white rounded-[22px] px-5 py-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{ background: `${themeColor}15` }}
          >
            <Icon size={15} style={{ color: themeColor }} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-[1.8px] leading-none">
              {title}
            </p>
            {subtitle ? (
              <p className="text-[9px] text-gray-400 font-bold mt-1 truncate">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {action || null}
      </div>

      {children}
    </section>
  );
}

function InfoGrid({ items = [] }) {
  const validItems = items.filter(
    (item) =>
      item &&
      item.value !== undefined &&
      item.value !== null &&
      String(item.value).trim() !== ''
  );

  if (!validItems.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {validItems.map((item) => (
        <div key={item.label} className="rounded-[16px] border border-gray-100 bg-[#FAFBFF] px-3 py-3">
          <p className="text-[8px] font-black uppercase tracking-[1.6px] text-gray-400 mb-1">
            {item.label}
          </p>
          <p className="text-[12px] leading-snug font-bold text-gray-700 break-words">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ChipList({ items = [], themeColor }) {
  const validItems = items.filter(Boolean);
  if (!validItems.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {validItems.map((item) => (
        <span
          key={item}
          className="text-[9px] font-black px-2.5 py-1 rounded-full"
          style={{
            background: `${themeColor}12`,
            color: themeColor,
            border: `1px solid ${themeColor}25`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function LongNote({ label, value }) {
  if (!value || !String(value).trim()) return null;

  return (
    <div className="rounded-[16px] border border-gray-100 bg-[#FAFBFF] px-3.5 py-3">
      <p className="text-[8px] font-black uppercase tracking-[1.6px] text-gray-400 mb-1.5">
        {label}
      </p>
      <p className="text-[12px] leading-relaxed font-medium text-gray-600 whitespace-pre-line break-words">
        {value}
      </p>
    </div>
  );
}

export default function BioModule({ cat, refreshCat, navigate, tutor }) {
  const themeColor = resolveThemeHex(cat?.themeColor);
  const gradient = resolveThemeGradient(cat?.themeColor);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [savingColor, setSavingColor] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [socialGalleryUrls, setSocialGalleryUrls] = useState([]);

  const galleryItems = useMemo(
    () => normalizeGalleryItems(cat?.gallery || cat?.galleryPhotos || cat?.photos || []),
    [cat]
  );

  useEffect(() => {
    if (!cat?.id) {
      setSocialGalleryUrls([]);
      return;
    }

    const availableUrls = galleryItems.map((item) => item.url).filter(Boolean);
    setSocialGalleryUrls(pruneSocialGallerySelection(cat.id, availableUrls));
  }, [cat?.id, galleryItems]);

  const nicknameList = useMemo(() => {
    if (Array.isArray(cat?.cuteNicknames)) return cat.cuteNicknames.filter(Boolean);

    if (typeof cat?.cuteNicknames === 'string') {
      return cat.cuteNicknames
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (typeof cat?.nicknames === 'string') {
      return cat.nicknames
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }, [cat]);

  const memorialData = useMemo(() => {
    return cat?.memorialTribute || cat?.memorial || null;
  }, [cat]);

  const applyColor = async (gradientId) => {
    setSavingColor(true);

    try {
      await api.patch(`/pets/${cat.id}`, { themeColor: gradientId });
      setShowPicker(false);
      refreshCat?.();
    } catch {
      // silencioso
    } finally {
      setSavingColor(false);
    }
  };

  const openViewer = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handlePrev = () => {
    setViewerIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setViewerIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
  };

  const handleDeletePhoto = async (photo) => {
    if (!photo) return;

    const confirmed = window.confirm('Deseja excluir esta foto da galeria?');
    if (!confirmed) return;

    setDeletingPhoto(true);

    try {
      const currentGalleryRaw = Array.isArray(cat?.gallery) ? cat.gallery : [];
      const normalizedRawUrls = currentGalleryRaw
        .map((item) =>
          typeof item === 'string'
            ? item
            : item?.url || item?.img || item?.photoUrl || item?.imageUrl || null
        )
        .filter(Boolean);

      const targetUrl = photo.url;
      const updatedGallery = normalizedRawUrls.filter(
        (url, i) => !(url === targetUrl && i === normalizedRawUrls.indexOf(targetUrl))
      );

      await api.patch(`/pets/${cat.id}`, { gallery: updatedGallery });

      const nextSelection = socialGalleryUrls.filter((url) => url !== targetUrl);
      saveSocialGallerySelection(cat.id, nextSelection);
      setSocialGalleryUrls(nextSelection);
      refreshCat?.();
      setViewerOpen(false);
    } catch (error) {
      console.error('Erro ao excluir foto da galeria:', error);
      alert('Não foi possível excluir a foto agora.');
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleSharePhoto = (photo) => {
    if (!photo?.url) return;

    if (navigator.share) {
      navigator
        .share({
          title: `Foto de ${cat?.name}`,
          text: `Olha essa foto do ${cat?.name} no GATEDO 🐾`,
          url: photo.url,
        })
        .catch(() => {});
      return;
    }

    navigator.clipboard
      .writeText(photo.url)
      .then(() => alert('Link da foto copiado!'))
      .catch(() => alert('Não foi possível compartilhar agora.'));
  };

  const handleToggleSocialGallery = (event, photo) => {
    event.stopPropagation();
    if (!cat?.id || !photo?.url) return;

    const nextSelection = toggleSocialGallerySelection(cat.id, photo.url);
    setSocialGalleryUrls(nextSelection);
  };

  const identityItems = [
    { label: 'Nome', value: cat?.name || 'Não informado' },
    { label: 'Raça', value: cat?.breed || 'Não informado' },
    { label: 'Pelagem', value: isSRD(cat) ? cat?.coatType || 'Não informado' : null },
    { label: 'Sexo', value: formatGender(cat?.gender) },
    { label: 'Cidade de origem', value: cat?.originCity || cat?.cityOfOrigin || cat?.birthCity || null },
    { label: 'Microchip', value: cat?.microchip ? String(cat.microchip) : 'Não informado' },
  ];

  const originHasContent = hasAnyValue([cat?.arrivalType, cat?.arrivalNotes]);
  const environmentHasContent = hasAnyValue([cat?.habitat, cat?.housingType]);

  return (
    <div className="space-y-4 pb-20">
      {/* TOPO BIO — RG DIGITAL + PAINEL PREDITIVO */}
      <div className="space-y-4">
        <div className="relative z-10">
          <FelineID
            cat={cat}
            tutor={tutor || cat?.owner || null}
          />
        </div>
      </div>

      {/* 0. BARRA PERSONALIZAÇÃO */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Perfil</p>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black transition-all"
            style={
              showPicker
                ? { background: themeColor, color: 'white' }
                : { background: `${themeColor}18`, color: themeColor }
            }
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3a9 9 0 1 0 9 9c0-1.09-.21-2.12-.56-3.07-.16.03-.3.07-.44.07a3 3 0 0 1 0-6c.82 0 1.56.34 2.11.88A8.97 8.97 0 0 0 12 3z" />
            </svg>
            <span>Personalizar</span>
          </button>

          <AnimatePresence>
            {showPicker ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-10 z-50 bg-white rounded-[20px] p-4 shadow-2xl border border-gray-100"
                style={{ width: 240 }}
              >
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Cor do Cartão RG
                </p>

                <div className="grid grid-cols-6 gap-2 mb-2">
                  {CARD_GRADIENTS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => applyColor(g.id)}
                      disabled={savingColor}
                      className="flex flex-col items-center gap-1 group"
                      title={g.label}
                    >
                      <div
                        className="w-8 h-8 rounded-[10px] transition-all flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${g.fromHex}, ${g.toHex})`,
                          outline: gradient.id === g.id ? `2.5px solid ${g.fromHex}` : 'none',
                          outlineOffset: '2px',
                          transform: gradient.id === g.id ? 'scale(1.18)' : 'scale(1)',
                          boxShadow: gradient.id === g.id ? `0 4px 10px ${g.fromHex}60` : 'none',
                        }}
                      >
                        {gradient.id === g.id ? (
                          <Check size={10} color="white" strokeWidth={3} />
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-[8px] text-gray-400 font-medium text-center">
                  {savingColor ? 'Aplicando...' : 'Toque para aplicar instantaneamente'}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      
<DiaryBanner
  cat={cat}
  themeColor={themeColor}
  navigate={navigate}
/>

    

      {/* 2. IDENTIDADE */}
      <SectionCard
        icon={PawPrint}
        title="Identidade"
        subtitle="Dados principais do perfil"
        themeColor={themeColor}
        action={
          <button
            onClick={() => setIsEditOpen(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: `${themeColor}15` }}
          >
            <Edit3 size={12} style={{ color: themeColor }} />
          </button>
        }
      >
        {!!nicknameList.length && (
          <div className="mb-3">
            <p className="text-[8px] font-black uppercase tracking-[1.6px] text-gray-400 mb-1.5">
              Apelidos carinhosos
            </p>
            <ChipList items={nicknameList} themeColor={themeColor} />
          </div>
        )}

        <InfoGrid items={identityItems} />
      </SectionCard>

      {/* 3. ORIGEM */}
      {originHasContent && (
        <SectionCard
          icon={MapPin}
          title="Origem"
          subtitle="Como entrou na família"
          themeColor={themeColor}
        >
          <InfoGrid
            items={[
              { label: 'Como chegou até você', value: formatArrivalType(cat?.arrivalType) },
            ]}
          />

          {cat?.arrivalNotes ? (
            <div className="mt-3">
              <LongNote label="História de chegada" value={cat.arrivalNotes} />
            </div>
          ) : null}
        </SectionCard>
      )}

      {/* 4. AMBIENTE BASE */}
      {environmentHasContent && (
        <SectionCard
          icon={Home}
          title="Ambiente"
          subtitle="Contexto base do lar"
          themeColor={themeColor}
        >
          <InfoGrid
            items={[
              { label: 'Habitat', value: formatHabitat(cat?.habitat) },
              { label: 'Tipo de moradia', value: formatHousingType(cat?.housingType) },
            ]}
          />
        </SectionCard>
      )}

      {/* 5. MEMORIAL */}
      {(cat?.isMemorial || cat?.isArchived || memorialData?.message || memorialData?.title) && (
        <SectionCard
          icon={Heart}
          title="Memorial"
          subtitle="Registro afetivo e homenagem"
          themeColor={themeColor}
        >
          <InfoGrid
            items={[
              { label: 'Título', value: memorialData?.title || 'Em memória' },
              {
                label: 'Visibilidade',
                value: memorialData?.isPublic === false ? 'Privado' : 'Público',
              },
            ]}
          />

          {memorialData?.message ? (
            <div className="mt-3">
              <LongNote label="Mensagem" value={memorialData.message} />
            </div>
          ) : (
            <div className="mt-3 rounded-[16px] border border-rose-100 bg-rose-50 px-3.5 py-3">
              <p className="text-[12px] leading-relaxed font-medium text-rose-700">
                Este perfil guarda com carinho a memória de{' '}
                <span className="font-black">{cat?.name}</span>.
              </p>
            </div>
          )}
        </SectionCard>
      )}

      {/* 6. SOBRE */}
      {cat?.bio && (
        <section className="bg-white rounded-[22px] px-5 py-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Sobre</p>
            <button
              onClick={() => setIsEditOpen(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: `${themeColor}15` }}
            >
              <Edit3 size={12} style={{ color: themeColor }} />
            </button>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            "{cat.bio}"
          </p>
        </section>
      )}

      {/* 7. GALERIA */}
      <section className="bg-white rounded-[22px] overflow-hidden shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-[10px] flex items-center justify-center"
              style={{ background: `${themeColor}15` }}
            >
              <Images size={13} style={{ color: themeColor }} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-700 leading-none">Galeria</p>
              <p className="text-[8px] text-gray-400 font-bold">
                {galleryItems.length}/9 fotos · {socialGalleryUrls.length} no perfil social
              </p>
            </div>
          </div>

          {galleryItems.length < 9 && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black transition-all"
              style={{ background: themeColor, color: 'white' }}
            >
              <Camera size={10} /> Adicionar
            </button>
          )}
        </div>

        {galleryItems.length === 0 ? (
          <div className="px-5 pb-5 text-center">
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full py-8 border-2 border-dashed rounded-[16px] flex flex-col items-center gap-2"
              style={{ borderColor: `${themeColor}30`, background: `${themeColor}06` }}
            >
              <Camera size={22} style={{ color: themeColor }} />
              <p className="text-xs font-black" style={{ color: themeColor }}>
                Adicionar primeira foto
              </p>
              <p className="text-[9px] text-gray-400">Até 9 fotos estilo portfólio</p>
            </button>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <p className="text-[9px] font-bold text-gray-400 mb-3 px-1">
              Marque no selo de cada foto o que deve aparecer na galeria social.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }, (_, i) => {
                const item = galleryItems[i];

                if (!item) {
                  return galleryItems.length < 9 && i === galleryItems.length ? (
                    <button
                      key={i}
                      onClick={() => setShowUploadModal(true)}
                      className="aspect-square rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center"
                      style={{ borderColor: `${themeColor}30`, background: `${themeColor}06` }}
                    >
                      <Camera size={14} style={{ color: themeColor }} />
                    </button>
                  ) : (
                    <div key={i} className="aspect-square rounded-[12px] bg-gray-50" />
                  );
                }

                const isSelectedForSocial = socialGalleryUrls.includes(item.url);

                return (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    className="aspect-square rounded-[12px] overflow-hidden relative group"
                  >
                    <button
                      type="button"
                      onClick={() => openViewer(i)}
                      className="absolute inset-0"
                    >
                      <img src={item.url} className="w-full h-full object-cover" alt={item.alt || ''} />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-active:opacity-100 transition-opacity" />
                    </button>

                    <button
                      type="button"
                      onClick={(event) => handleToggleSocialGallery(event, item)}
                      className="absolute top-1.5 right-1.5 z-10 h-7 min-w-[58px] rounded-full px-2.5 flex items-center justify-center gap-1 text-[8px] font-black shadow-sm"
                      style={isSelectedForSocial
                        ? { background: themeColor, color: '#fff', border: `1px solid ${themeColor}` }
                        : { background: 'rgba(255,255,255,0.94)', color: themeColor, border: `1px solid ${themeColor}35` }}
                    >
                      {isSelectedForSocial ? <Check size={11} /> : <Images size={11} />}
                      Social
                    </button>

                    {isSelectedForSocial ? (
                      <div
                        className="absolute left-1.5 right-1.5 bottom-1.5 z-10 rounded-[10px] px-2 py-1 text-[8px] font-black text-center"
                        style={{ background: 'rgba(15,12,30,0.72)', color: '#fff' }}
                      >
                        Na galeria social
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <CatGalleryViewerModal
        isOpen={viewerOpen}
        items={galleryItems}
        currentIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
        onPrev={handlePrev}
        onNext={handleNext}
        onDelete={(photo, index) => handleDeletePhoto(photo, index)}
        canDelete={!deletingPhoto}
        showDeleteLoading={deletingPhoto}
        accentColor={themeColor}
        onShare={(photo) => handleSharePhoto(photo)}
        onOpenSocialProfile={() => navigate(`/gato/${cat.id}`)}
      />

      <GalleryUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        catId={cat?.id}
        existingCount={galleryItems.length}
        onUploadSuccess={() => {
          refreshCat?.();
        }}
      />

      <AnimatePresence>
        {isEditOpen && (
          <EditBioModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            cat={cat}
            onSave={refreshCat}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
