import React, { useMemo, useState } from 'react';
import { BookOpen, Brain, CheckCircle, Eye, Loader2, RotateCcw, Save, Search, ShieldAlert, Trash2, Upload } from 'lucide-react';
import {
  fetchIgentAlmanacSections,
  getIgentAlmanacSections,
  IGENT_ALMANAC_SCOPE,
  persistIgentAlmanacSections,
  resetIgentAlmanacSections,
  resetIgentAlmanacOnServer,
  IGENT_ALMANAC_SEED_COUNT,
  IGENT_VISUAL_ATLAS_SCOPE,
  IGENT_VISUAL_ATLAS_SEED_COUNT,
} from '../../services/igentAlmanacStore';
import api from '../../services/api';

const C = { purple: '#8B4AFF', lime: '#ebfc66' };

export default function AdminIgentAlmanac() {
  const [scope, setScope] = useState(IGENT_ALMANAC_SCOPE);
  const [sections, setSections] = useState(() => getIgentAlmanacSections(IGENT_ALMANAC_SCOPE));
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(sections[0]?.id || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  React.useEffect(() => {
    setLoading(true);
    fetchIgentAlmanacSections(scope)
      .then((remote) => {
        setSections(remote);
        setActiveId(remote[0]?.id || remote[0]?.slug || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [scope]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return sections;
    return sections.filter((section) =>
      `${section.title} ${section.tags} ${section.content}`.toLowerCase().includes(q),
    );
  }, [query, sections]);

  const active = sections.find((section) => section.id === activeId) || filtered[0] || sections[0];

  const updateActive = (patch) => {
    setSections((prev) => prev.map((section) => (
      section.id === active.id ? { ...section, ...patch } : section
    )));
    setSaved(false);
  };

  const addReferenceImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !active) return;
    setUploadingImage(true);
    try {
      const image = await uploadAtlasReferenceImage(file);
      const nextImages = [
        ...(Array.isArray(active.referenceImages) ? active.referenceImages : []),
        {
          id: `ref-${Date.now()}`,
          url: image.url,
          mimeType: image.mimeType,
          label: active.title,
          notes: '',
        },
      ].slice(0, 8);
      updateActive({
        referenceImages: nextImages,
        metadata: { ...(active.metadata || {}), referenceImages: nextImages },
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const updateReferenceImage = (id, patch) => {
    const nextImages = (active.referenceImages || []).map((image) => (
      image.id === id ? { ...image, ...patch } : image
    ));
    updateActive({
      referenceImages: nextImages,
      metadata: { ...(active.metadata || {}), referenceImages: nextImages },
    });
  };

  const removeReferenceImage = (id) => {
    const nextImages = (active.referenceImages || []).filter((image) => image.id !== id);
    updateActive({
      referenceImages: nextImages,
      metadata: { ...(active.metadata || {}), referenceImages: nextImages },
    });
  };

  const persist = () => {
    setLoading(true);
    persistIgentAlmanacSections(sections, 'admin', scope)
      .then((remote) => {
        setSections(remote);
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      })
      .finally(() => setLoading(false));
  };

  const reset = () => {
    setLoading(true);
    resetIgentAlmanacOnServer('admin', scope)
      .then((seed) => {
        setSections(seed);
        setActiveId(seed[0]?.id || '');
        setSaved(false);
      })
      .catch(() => {
        const seed = resetIgentAlmanacSections(scope);
        setSections(seed);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] p-6 text-white overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${C.purple}, #4b1fa6)` }}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-widest mb-3">
              <Brain size={14} /> iGentVet Knowledge OS
            </div>
            <h1 className="text-3xl font-black leading-tight">Almanaque iGentVet</h1>
            <p className="text-white/75 text-sm max-w-2xl mt-2">
              Base estruturada usada pelo iGentVet para enriquecer triagem clinica, racas, comportamento e orientacao visual por imagem.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-[320px]">
            <Stat label="Secoes" value={sections.length} />
            <Stat label="Ativas" value={sections.filter(s => s.active !== false).length} />
            <Stat label="Seed" value={scope === IGENT_VISUAL_ATLAS_SCOPE ? IGENT_VISUAL_ATLAS_SEED_COUNT : IGENT_ALMANAC_SEED_COUNT} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[22px] border border-gray-100 shadow-sm p-2 flex flex-wrap gap-2">
        <ScopeButton
          active={scope === IGENT_ALMANAC_SCOPE}
          icon={BookOpen}
          label="Almanaque clinico"
          description="Doencas, racas, comportamento e prevencao"
          onClick={() => setScope(IGENT_ALMANAC_SCOPE)}
        />
        <ScopeButton
          active={scope === IGENT_VISUAL_ATLAS_SCOPE}
          icon={Eye}
          label="Atlas visual"
          description="Olho, pele, pelo, feridas, boca e ouvidos"
          onClick={() => setScope(IGENT_VISUAL_ATLAS_SCOPE)}
        />
      </div>

      <div className="bg-white rounded-[22px] border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Diferencial publico</p>
            <h2 className="text-xl font-black text-gray-900">Narrativa do iGentVet no app</h2>
            <p className="text-sm text-gray-500 max-w-3xl mt-1">
              A pagina "Sobre a ferramenta" usa o Almanaque Clinico e o Atlas Visual como prova de produto: IA felina especializada, contexto individual, analise por imagem e prontuario compilado para consulta presencial.
            </p>
          </div>
          <button
            onClick={() => window.open('/igent-vet/sobre', '_blank', 'noopener,noreferrer')}
            className="px-5 py-3 rounded-2xl text-sm font-black text-white flex-shrink-0"
            style={{ background: C.purple }}
          >
            Ver pagina no app
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <AdminDifferential title="Tutor" text="Posicione como clareza antes da consulta, nao como substituto do veterinario." />
          <AdminDifferential title="Veterinario" text="Valorize o resumo clinico, historico e perguntas de triagem ja organizadas." />
          <AdminDifferential title="Ativo proprietario" text="Almanaque e Atlas Visual ficam editaveis aqui e evoluem com curadoria." />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5">
        <div className="bg-white rounded-[22px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={scope === IGENT_VISUAL_ATLAS_SCOPE ? 'Buscar olho, pele, ferida, pelo...' : 'Buscar racas, doencas, sintomas...'}
                className="bg-transparent outline-none text-sm flex-1" />
            </div>
          </div>
          <div className="max-h-[620px] overflow-y-auto p-2 space-y-1">
            {filtered.map((section) => (
              <button key={section.id} onClick={() => setActiveId(section.id)}
                className="w-full text-left rounded-2xl px-3 py-3 border transition"
                style={{
                  borderColor: active?.id === section.id ? C.purple : 'transparent',
                  background: active?.id === section.id ? '#F4F3FF' : '#fff',
                }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-sm text-gray-800 line-clamp-1">{section.title}</p>
                  {section.active !== false ? <CheckCircle size={14} className="text-emerald-500" /> : <ShieldAlert size={14} className="text-gray-300" />}
                </div>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{section.excerpt}</p>
              </button>
            ))}
          </div>
        </div>

        {active && (
          <div className="bg-white rounded-[22px] border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {scope === IGENT_VISUAL_ATLAS_SCOPE ? 'Padrao visual ativo no agente' : 'Secao ativa no agente'} {loading ? '- sincronizando...' : ''}
              </p>
                <h2 className="text-xl font-black text-gray-900">{active.title}</h2>
              </div>
              <label className="flex items-center gap-2 text-sm font-black text-gray-600">
                <input type="checkbox" checked={active.active !== false} onChange={(e) => updateActive({ active: e.target.checked })} />
                {scope === IGENT_VISUAL_ATLAS_SCOPE ? 'Usar na analise por imagem' : 'Usar no iGentVet'}
              </label>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status editorial</label>
              <select value={active.status || 'PUBLISHED'} onChange={(e) => updateActive({ status: e.target.value })}
                className="w-full mt-1 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8B4AFF]">
                <option value="PUBLISHED">Publicado no agente</option>
                <option value="DRAFT">Rascunho interno</option>
                <option value="ARCHIVED">Arquivado</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tags de busca</label>
              <input value={active.tags || ''} onChange={(e) => updateActive({ tags: e.target.value })}
                className="w-full mt-1 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8B4AFF]" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {scope === IGENT_VISUAL_ATLAS_SCOPE ? 'Criterios visuais, diferenciais e perguntas' : 'Conteudo da secao'}
              </label>
              <textarea value={active.content || ''} onChange={(e) => updateActive({ content: e.target.value })}
                className="w-full min-h-[420px] mt-1 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8B4AFF] leading-relaxed" />
            </div>

            {scope === IGENT_VISUAL_ATLAS_SCOPE && (
              <div className="rounded-[22px] border border-violet-100 bg-[#FCFBFF] p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Imagens de referencia</p>
                    <p className="text-xs text-gray-500 font-semibold">
                      Exemplos visuais que o iGent cruza com a foto enviada pelo tutor.
                    </p>
                  </div>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm cursor-pointer text-white"
                    style={{ background: C.purple }}>
                    {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {uploadingImage ? 'Subindo...' : 'Adicionar imagem'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={addReferenceImage} disabled={uploadingImage} />
                  </label>
                </div>

                {(active.referenceImages || []).length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(active.referenceImages || []).map((image) => (
                      <div key={image.id || image.url} className="rounded-2xl bg-white border border-gray-100 p-3">
                        <div className="flex gap-3">
                          <img src={image.url} alt={image.label || active.title}
                            className="w-24 h-24 rounded-2xl object-cover border border-gray-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0 space-y-2">
                            <input
                              value={image.label || ''}
                              onChange={(e) => updateReferenceImage(image.id, { label: e.target.value })}
                              placeholder="Ex: ulceracao corneana leve"
                              className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-bold outline-none focus:border-[#8B4AFF]"
                            />
                            <textarea
                              value={image.notes || ''}
                              onChange={(e) => updateReferenceImage(image.id, { notes: e.target.value })}
                              placeholder="Notas visuais: cor, borda, secrecao, gravidade, diferencas..."
                              className="w-full h-16 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-[#8B4AFF] resize-none"
                            />
                          </div>
                          <button onClick={() => removeReferenceImage(image.id)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 text-red-500 flex-shrink-0">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-violet-200 bg-white px-4 py-6 text-center">
                    <p className="text-sm font-black text-gray-700">Nenhuma imagem de referencia ainda.</p>
                    <p className="text-xs text-gray-400 mt-1">Suba exemplos reais ou didaticos para melhorar o cruzamento visual.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={persist} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-white"
                style={{ background: C.purple }}>
                <Save size={16} /> {saved ? 'Salvo' : scope === IGENT_VISUAL_ATLAS_SCOPE ? 'Salvar atlas visual' : 'Salvar almanaque'}
              </button>
              <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black border border-gray-200 text-gray-500">
                <RotateCcw size={16} /> Restaurar original
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function uploadAtlasReferenceImage(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Formato invalido. Use JPG, PNG ou WebP.');
  }

  const compressed = await compressImageToDataUrl(file);
  const blob = await (await fetch(compressed.url)).blob();
  const form = new FormData();
  form.append('file', new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: compressed.mimeType }));

  try {
    const response = await api.post('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      url: response.data?.url || compressed.url,
      mimeType: compressed.mimeType,
    };
  } catch {
    return compressed;
  }
}

function compressImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxSide = 960;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ url: canvas.toDataURL('image/jpeg', 0.82), mimeType: 'image/jpeg' });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/12 px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-white/55">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function ScopeButton({ active, icon: Icon, label, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[240px] flex items-center gap-3 rounded-2xl px-4 py-3 text-left border transition"
      style={{
        borderColor: active ? C.purple : '#F1EEF8',
        background: active ? '#F4F3FF' : '#fff',
      }}
    >
      <span
        className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{
          background: active ? C.purple : '#F7F4FF',
          color: active ? '#fff' : C.purple,
        }}
      >
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-sm font-black text-gray-900">{label}</span>
        <span className="block text-[11px] text-gray-400">{description}</span>
      </span>
    </button>
  );
}

function AdminDifferential({ title, text }) {
  return (
    <div className="rounded-2xl bg-[#F8F7FF] border border-violet-100 p-4">
      <p className="text-sm font-black text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 leading-relaxed mt-1">{text}</p>
    </div>
  );
}
