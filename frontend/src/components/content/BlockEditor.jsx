import React, { useRef, useState } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Type, Layers, Image as ImageIcon,
  ListChecks, MessageSquareWarning, Tag, Loader2, Upload,
} from 'lucide-react';
import api from '../../services/api';
import {
  BLOCK_TYPES, OFFER_SLOT_SURFACES, CALLOUT_TONES, SECTION_COLOR_PRESETS, makeBlock,
} from './blockTypes';

const C = { purple: '#8B4AFF' };

const TYPE_META = {
  [BLOCK_TYPES.TEXT]:       { label: 'Texto',           icon: Type },
  [BLOCK_TYPES.SECTION]:    { label: 'Seção colorida',  icon: Layers },
  [BLOCK_TYPES.IMAGE]:      { label: 'Imagem',          icon: ImageIcon },
  [BLOCK_TYPES.CHECKLIST]:  { label: 'Checklist',       icon: ListChecks },
  [BLOCK_TYPES.CALLOUT]:    { label: 'Destaque',        icon: MessageSquareWarning },
  [BLOCK_TYPES.OFFER_SLOT]: { label: 'Slot de oferta',  icon: Tag },
};

const fieldCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] font-medium text-gray-700 outline-none focus:border-[#8B4AFF]';
const labelCls = 'text-[9px] font-black uppercase tracking-wide text-gray-400 mb-1 block';

function ImageUploadField({ url, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data?.url || '');
    } catch {
      alert('Não foi possível enviar a imagem. Tente de novo.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className={labelCls}>Imagem</label>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
      {url ? (
        <div className="relative rounded-xl overflow-hidden mb-2" style={{ maxHeight: 140 }}>
          <img src={url} alt="" className="w-full h-full object-cover" style={{ maxHeight: 140 }} />
          <button type="button" onClick={pick}
            className="absolute bottom-2 right-2 text-[10px] font-black px-2.5 py-1 rounded-full bg-black/60 text-white">
            Trocar
          </button>
        </div>
      ) : (
        <button type="button" onClick={pick} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-[12px] font-bold mb-2">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Enviando...' : 'Enviar imagem'}
        </button>
      )}
    </div>
  );
}

function BlockFields({ block, onUpdate }) {
  const set = (patch) => onUpdate({ ...block, ...patch });

  switch (block.type) {
    case BLOCK_TYPES.TEXT:
      return (
        <div>
          <label className={labelCls}>Texto (aceita **negrito**, *itálico*, listas com "- ")</label>
          <textarea className={fieldCls} rows={4} value={block.markdown || ''} onChange={(e) => set({ markdown: e.target.value })} />
        </div>
      );

    case BLOCK_TYPES.SECTION:
      return (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Título (opcional)</label>
            <input className={fieldCls} value={block.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Cor de fundo</label>
            <div className="flex items-center gap-2 flex-wrap">
              {SECTION_COLOR_PRESETS.map((c) => (
                <button key={c} type="button" onClick={() => set({ color: c })}
                  className="w-7 h-7 rounded-full shrink-0"
                  style={{ background: c, outline: block.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
              <input type="color" value={block.color || '#8B4AFF'} onChange={(e) => set({ color: e.target.value })}
                className="w-7 h-7 rounded-full border-0 cursor-pointer" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Texto</label>
            <textarea className={fieldCls} rows={3} value={block.body || ''} onChange={(e) => set({ body: e.target.value })} />
          </div>
        </div>
      );

    case BLOCK_TYPES.IMAGE:
      return (
        <div className="space-y-2">
          <ImageUploadField url={block.url} onChange={(url) => set({ url })} />
          <div>
            <label className={labelCls}>Legenda (opcional)</label>
            <input className={fieldCls} value={block.caption || ''} onChange={(e) => set({ caption: e.target.value })} />
          </div>
        </div>
      );

    case BLOCK_TYPES.CHECKLIST: {
      const items = Array.isArray(block.items) ? block.items : [''];
      const setItem = (i, value) => {
        const next = [...items];
        next[i] = value;
        set({ items: next });
      };
      const removeItem = (i) => set({ items: items.filter((_, idx) => idx !== i) });
      return (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Título (opcional)</label>
            <input className={fieldCls} value={block.title || ''} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Itens</label>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input className={fieldCls} value={item} onChange={(e) => setItem(i, e.target.value)} />
                  <button type="button" onClick={() => removeItem(i)} className="shrink-0 text-gray-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => set({ items: [...items, ''] })}
              className="mt-1.5 text-[11px] font-black" style={{ color: C.purple }}>
              + Adicionar item
            </button>
          </div>
        </div>
      );
    }

    case BLOCK_TYPES.CALLOUT:
      return (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Tom</label>
            <div className="flex gap-1.5">
              {CALLOUT_TONES.map((t) => (
                <button key={t.id} type="button" onClick={() => set({ tone: t.id })}
                  className="px-3 py-1.5 rounded-full text-[10px] font-black"
                  style={block.tone === t.id ? { background: t.color, color: '#fff' } : { background: '#F3F4F6', color: '#9CA3AF' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Texto</label>
            <textarea className={fieldCls} rows={2} value={block.text || ''} onChange={(e) => set({ text: e.target.value })} />
          </div>
        </div>
      );

    case BLOCK_TYPES.OFFER_SLOT:
      return (
        <div>
          <label className={labelCls}>Onde esse slot se encaixa</label>
          <select className={fieldCls} value={block.surface || 'PAIN_ALMANAC'} onChange={(e) => set({ surface: e.target.value })}>
            {OFFER_SLOT_SURFACES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <p className="text-[10px] text-gray-400 font-medium mt-1.5 leading-relaxed">
            Isso só reserva o lugar — o motor único de ofertas decide se mostra algo aqui, e o quê.
            Pode não aparecer nada, e nunca aparece mais de uma oferta na mesma tela.
          </p>
        </div>
      );

    default:
      return null;
  }
}

// Editor genérico de blocos — usado pelo editor de Almanaque e de Protocolo.
export default function BlockEditor({ blocks, onChange }) {
  const list = Array.isArray(blocks) ? blocks : [];

  const update = (i, next) => {
    const copy = [...list];
    copy[i] = next;
    onChange(copy);
  };
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  const add = (type) => onChange([...list, makeBlock(type)]);

  return (
    <div className="space-y-3">
      {list.map((block, i) => {
        const meta = TYPE_META[block.type] || TYPE_META[BLOCK_TYPES.TEXT];
        const Icon = meta.icon;
        return (
          <div key={block.id || i} className="rounded-[18px] border border-gray-100 bg-white shadow-sm p-3.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Icon size={13} style={{ color: C.purple }} />
                <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: C.purple }}>{meta.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-20">
                  <ChevronUp size={14} className="text-gray-400" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="p-1 disabled:opacity-20">
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                <button type="button" onClick={() => remove(i)} className="p-1">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
            <BlockFields block={block} onUpdate={(next) => update(i, next)} />
          </div>
        );
      })}

      <div className="rounded-[18px] border-2 border-dashed border-gray-200 p-3">
        <p className="text-[9px] font-black uppercase tracking-wide text-gray-400 mb-2">Adicionar bloco</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(TYPE_META).map(([type, meta]) => (
            <button key={type} type="button" onClick={() => add(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black"
              style={{ background: '#F4F3FF', color: C.purple }}>
              <Plus size={11} /> {meta.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
