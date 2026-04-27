import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Megaphone,
  Calendar,
  ShieldAlert,
  Info,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import api from '../../services/api';

const NOTICE_TYPES = [
  { value: 'INFO', label: 'Informativo', icon: Info },
  { value: 'UPDATE', label: 'Atualização', icon: Sparkles },
  { value: 'WARNING', label: 'Aviso', icon: ShieldAlert },
  { value: 'EVENT', label: 'Evento', icon: Calendar },
];

const defaultForm = {
  title: '',
  content: '',
  imageUrl: '',
  type: 'INFO',
  isActive: true,
  xpReward: 3,
  expiresAt: '',
};

function toDatetimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function NoticeFormModal({
  open,
  onClose,
  onSaved,
  initialData = null,
}) {
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        title: initialData.title || '',
        content: initialData.content || '',
        imageUrl: initialData.imageUrl || '',
        type: initialData.type || 'INFO',
        isActive:
          typeof initialData.isActive === 'boolean'
            ? initialData.isActive
            : true,
        xpReward:
          initialData.xpReward !== undefined && initialData.xpReward !== null
            ? Number(initialData.xpReward)
            : 3,
        expiresAt: toDatetimeLocal(initialData.expiresAt),
      });
    } else {
      setForm(defaultForm);
    }

    setError('');
  }, [open, initialData]);

  const selectedType = useMemo(
    () => NOTICE_TYPES.find((item) => item.value === form.type) || NOTICE_TYPES[0],
    [form.type]
  );

  if (!open) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'Informe o título do comunicado.';
    if (!form.content.trim()) return 'Informe o conteúdo do comunicado.';
    if (Number(form.xpReward) < 0) return 'O XP não pode ser negativo.';
    return '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      imageUrl: form.imageUrl?.trim() || null,
      type: form.type || 'INFO',
      isActive: !!form.isActive,
      xpReward: Number(form.xpReward || 0),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };

    try {
      setLoading(true);
      setError('');

      if (isEdit) {
        await api.patch(`/notices/${initialData.id}`, payload);
      } else {
        await api.post('/notices', payload);
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error('Erro ao salvar comunicado:', err);
      setError(
        err?.response?.data?.message || 'Não foi possível salvar o comunicado.'
      );
    } finally {
      setLoading(false);
    }
  };

  const TypeIcon = selectedType.icon;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center md:items-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-t-[28px] md:rounded-[28px] bg-white shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 rounded-t-[28px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Megaphone size={18} className="text-violet-600" />
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-black text-gray-800 leading-tight">
                  {isEdit ? 'Editar comunicado' : 'Novo comunicado'}
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  Painel oficial de notices do GATEDO
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-black text-gray-700 block mb-2">
                Título
              </span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Ex.: Nova atualização do Comunigato"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black text-gray-700 block mb-2">
                Tipo
              </span>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-800 outline-none"
                >
                  {NOTICE_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <TypeIcon size={16} className="text-violet-500" />
                </div>
              </div>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-black text-gray-700 block mb-2">
              Conteúdo
            </span>
            <textarea
              value={form.content}
              onChange={(e) => updateField('content', e.target.value)}
              placeholder="Escreva o texto oficial que será exibido aos usuários..."
              rows={6}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none resize-none"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black text-gray-700 block mb-2">
              Banner do comunicado (URL da imagem)
            </span>
            <div className="relative">
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                placeholder="https://..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-800 outline-none"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <ImageIcon size={16} className="text-gray-400" />
              </div>
            </div>

            {form.imageUrl?.trim() ? (
              <div className="mt-3 rounded-[20px] overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={form.imageUrl}
                  alt="Preview do banner"
                  className="w-full max-h-[220px] object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : null}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-black text-gray-700 block mb-2">
                XP por leitura
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.xpReward}
                onChange={(e) => updateField('xpReward', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black text-gray-700 block mb-2">
                Expira em
              </span>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => updateField('expiresAt', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="w-4 h-4"
            />
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-800">Comunicado ativo</p>
              <p className="text-xs text-gray-500 font-medium">
                Se marcado, o comunicado poderá aparecer para os usuários.
              </p>
            </div>
          </label>

          <div className="rounded-[22px] border border-violet-100 bg-violet-50 px-4 py-4">
            <p className="text-xs font-black text-violet-700 mb-2">Preview técnico</p>
            <div className="space-y-1 text-xs text-violet-900">
              <p><strong>Título:</strong> {form.title || '—'}</p>
              <p><strong>Tipo:</strong> {form.type}</p>
              <p><strong>Ativo:</strong> {form.isActive ? 'Sim' : 'Não'}</p>
              <p><strong>XP:</strong> {Number(form.xpReward || 0)}</p>
              <p><strong>Expira:</strong> {form.expiresAt || 'Sem expiração'}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 font-black text-sm"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-2xl font-black text-sm text-white"
              style={
                loading
                  ? { background: '#9CA3AF' }
                  : { background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' }
              }
            >
              {loading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Publicar comunicado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}