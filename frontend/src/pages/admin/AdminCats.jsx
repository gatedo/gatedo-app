import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Cat,
  Copy,
  Crown,
  Edit,
  Gem,
  Mail,
  PawPrint,
  RefreshCw,
  Search,
  SortAsc,
  Trash2,
  User,
  X,
} from 'lucide-react';
import api from '../../services/api';
import {
  formatDate,
  formatNumber,
  formatShortId,
  getCatLevelMeta,
  getCatLifeStage,
  getInitials,
  getPetAgeInMonths,
  getPetAgeLabel,
} from '../../utils/adminPanelMeta';

function Avatar({ name, photoUrl, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-base' : 'w-11 h-11 text-sm';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name || 'Avatar'}
        className={`${sizeClass} rounded-2xl object-cover border border-white shadow-sm shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-2xl bg-pink-50 text-pink-500 font-black flex items-center justify-center border border-pink-100 shrink-0`}>
      {getInitials(name || 'Gato')}
    </div>
  );
}

function InfoChip({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${className}`}>
      {children}
    </span>
  );
}

function BadgePill({ label, className, icon }) {
  const IconComponent = icon || Crown;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black border ${className}`}>
      <IconComponent size={9} />
      {label}
    </span>
  );
}

function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h3 className="font-black text-lg text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function toBadgeText(value) {
  return Array.isArray(value) ? value.filter(Boolean).join(', ') : '';
}

function parseBadgeText(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function EditModal({ pet, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: pet?.name || '',
    breed: pet?.breed || '',
    city: pet?.city || '',
    ageYears: pet?.ageYears ?? '',
    ageMonths: pet?.ageMonths ?? '',
    xpg: Number(pet?.xpg || 0),
    badgesText: toBadgeText(pet?.badges),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const levelMeta = getCatLevelMeta(Number(form.xpg || 0));
  const lifeStage = getCatLifeStage({
    ageYears: form.ageYears === '' ? undefined : Number(form.ageYears),
    ageMonths: form.ageMonths === '' ? undefined : Number(form.ageMonths),
    birthDate: pet?.birthDate,
  });

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.patch(`/pets/${pet.id}`, {
        name: form.name,
        breed: form.breed || null,
        city: form.city || null,
        ageYears: form.ageYears === '' ? null : Number(form.ageYears),
        ageMonths: form.ageMonths === '' ? null : Number(form.ageMonths),
        xpg: Math.max(0, Number(form.xpg || 0)),
        badges: parseBadgeText(form.badgesText),
      });

      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao salvar as alteracoes do gato.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <Avatar name={pet?.name} photoUrl={pet?.photoUrl} size="lg" />
            <div>
              <h3 className="font-black text-lg text-gray-800">Editar Gato</h3>
              <p className="text-xs text-gray-400 font-mono">{pet?.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="rounded-[22px] border border-pink-100 bg-pink-50/70 p-4 flex flex-wrap items-center gap-3">
            <InfoChip className="bg-white text-pink-600 border-pink-100">
              <PawPrint size={11} /> Nivel {levelMeta.rank}
            </InfoChip>
            <InfoChip className="bg-white text-gray-700 border-gray-200">
              {levelMeta.emoji} {levelMeta.name}
            </InfoChip>
            <InfoChip className="bg-white text-amber-700 border-amber-200">
              <Gem size={11} /> {formatNumber(form.xpg)} XPG
            </InfoChip>
            <InfoChip className={`bg-white ${lifeStage.className}`}>
              <Cat size={11} /> {lifeStage.label}
            </InfoChip>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nome do gato</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Raca</label>
              <input
                type="text"
                value={form.breed}
                onChange={(event) => setForm((current) => ({ ...current, breed: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Cidade</label>
              <input
                type="text"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">XPG</label>
              <input
                type="number"
                min="0"
                value={form.xpg}
                onChange={(event) => setForm((current) => ({ ...current, xpg: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Idade em anos</label>
              <input
                type="number"
                min="0"
                value={form.ageYears}
                onChange={(event) => setForm((current) => ({ ...current, ageYears: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Meses adicionais</label>
              <input
                type="number"
                min="0"
                max="11"
                value={form.ageMonths}
                onChange={(event) => setForm((current) => ({ ...current, ageMonths: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Badges extras do gato</label>
            <input
              type="text"
              value={form.badgesText}
              onChange={(event) => setForm((current) => ({ ...current, badgesText: event.target.value }))}
              placeholder="Ex.: MEMORIAL, IGENT_STAR"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#8B4AFF]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Os badges BABY, JUNIOR, GROWN e SENIOR aparecem automaticamente conforme a idade.
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-black text-white bg-[#8B4AFF] hover:bg-[#6d42e0] transition-colors disabled:opacity-70"
            >
              {saving ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCats() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [editingPet, setEditingPet] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    loadPets();
  }, []);

  async function loadPets() {
    setLoading(true);
    try {
      const response = await api.get('/pets', { params: { scope: 'admin' } });
      setPets(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Erro ao buscar gatos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deletePet(pet) {
    try {
      await api.delete(`/pets/${pet.id}`);
      setPets((current) => current.filter((item) => item.id !== pet.id));
      setConfirm(null);
    } catch (err) {
      alert(`Erro ao deletar: ${err?.response?.data?.message || err?.message || 'Falha'}`);
    }
  }

  const processedPets = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = pets.filter((pet) => {
      const fields = [
        pet?.name,
        pet?.breed,
        pet?.city,
        pet?.id,
        pet?.owner?.name,
        pet?.owner?.email,
        getCatLifeStage(pet).label,
      ]
        .filter(Boolean)
        .map((item) => String(item).toLowerCase());

      return !term || fields.some((field) => field.includes(term));
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'xpg') return Number(b.xpg || 0) - Number(a.xpg || 0);
      if (sortBy === 'level') return Number(b.level || 0) - Number(a.level || 0);
      if (sortBy === 'owner') return String(a.owner?.name || '').localeCompare(String(b.owner?.name || ''));
      if (sortBy === 'age') return Number(getPetAgeInMonths(b) || 0) - Number(getPetAgeInMonths(a) || 0);
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [pets, searchTerm, sortBy]);

  const stats = useMemo(() => ([
    {
      label: 'Total',
      value: pets.length,
      className: 'bg-pink-50 text-pink-600',
    },
    {
      label: 'Baby / Junior',
      value: pets.filter((pet) => ['BABY', 'JUNIOR'].includes(getCatLifeStage(pet).label)).length,
      className: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Senior',
      value: pets.filter((pet) => getCatLifeStage(pet).label === 'SENIOR').length,
      className: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Nivel 10+',
      value: pets.filter((pet) => Number(pet.level || 0) >= 10).length,
      className: 'bg-[#F4F3FF] text-[#8B4AFF]',
    },
  ]), [pets]);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Cat className="text-[#8B4AFF]" /> Gestao de Gatos
          </h2>
          <p className="text-sm text-gray-400">Veja tutor, avatar, ID, badges, XPG e nivel real de cada gato.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm">
            <SortAsc size={16} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="outline-none text-xs font-bold text-gray-700 bg-transparent"
            >
              <option value="name">Nome</option>
              <option value="owner">Tutor</option>
              <option value="xpg">Mais XPG</option>
              <option value="level">Maior nivel</option>
              <option value="age">Idade</option>
            </select>
          </div>

          <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm flex-1">
            <Search size={16} className="text-gray-400" />
            <input
              placeholder="Buscar gato, tutor, raca, badge ou ID..."
              className="outline-none text-sm font-bold text-gray-700 w-full"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <button
            onClick={loadPets}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-[#8B4AFF] hover:border-[#8B4AFF] transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((item) => (
          <div key={item.label} className={`${item.className} rounded-2xl px-4 py-3 flex items-center gap-3`}>
            <span className="text-2xl font-black">{item.value}</span>
            <span className="text-xs font-bold text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            <p className="text-sm font-bold">Carregando gatos...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1280px]">
            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-black border-b border-gray-100 tracking-wider">
              <tr>
                <th className="px-5 py-4">Gato</th>
                <th className="px-5 py-4">Tutor</th>
                <th className="px-5 py-4">Perfil</th>
                <th className="px-5 py-4">Jornada</th>
                <th className="px-5 py-4">Badges</th>
                <th className="px-5 py-4">Registro</th>
                <th className="px-5 py-4 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {processedPets.map((pet) => {
                const levelMeta = getCatLevelMeta(Number(pet.xpg || 0));
                const lifeStage = getCatLifeStage(pet);
                const customBadges = Array.isArray(pet.badges)
                  ? pet.badges.filter((badge) => badge && badge !== lifeStage.label)
                  : [];

                return (
                  <tr key={pet.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={pet.name} photoUrl={pet.photoUrl} />
                        <div className="min-w-0">
                          <p className="font-black text-gray-800 truncate">{pet.name || 'Sem nome'}</p>
                          <p className="text-[11px] text-gray-400 truncate">{pet.breed || 'SRD / sem raca'}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(pet.id)}
                            className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-500 transition-colors"
                          >
                            <Copy size={9} /> {formatShortId(pet.id)}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={pet.owner?.name} photoUrl={pet.owner?.photoUrl} />
                        <div className="min-w-0">
                          <p className="font-black text-gray-800 truncate">{pet.owner?.name || 'Sem tutor'}</p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                            <Mail size={9} /> {pet.owner?.email || 'Sem e-mail'}
                          </p>
                          {pet.owner?.id && (
                            <button
                              onClick={() => navigator.clipboard.writeText(pet.owner.id)}
                              className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-gray-500 transition-colors"
                            >
                              <Copy size={9} /> Tutor {formatShortId(pet.owner.id)}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <InfoChip className="bg-pink-50 text-pink-600 border-pink-100">
                          <User size={10} />
                          {pet.city || 'Sem cidade'}
                        </InfoChip>
                        <p className="text-[11px] text-gray-400">
                          Idade: {getPetAgeLabel(pet)}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Plano tutor: {pet.owner?.plan || 'FREE'}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <InfoChip className="bg-[#FDF1FF] text-[#8B4AFF] border-[#E8D7FF]">
                          <PawPrint size={10} />
                          Nivel {levelMeta.rank}
                        </InfoChip>
                        <p className="text-[11px] font-black text-gray-700">
                          {levelMeta.emoji} {levelMeta.name}
                        </p>
                        <InfoChip className="bg-amber-50 text-amber-700 border-amber-200">
                          <Gem size={10} />
                          {formatNumber(pet.xpg)} XPG
                        </InfoChip>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        <BadgePill label={lifeStage.label} className={lifeStage.className} icon={Cat} />
                        {customBadges.length > 0
                          ? customBadges.map((badge) => (
                              <BadgePill
                                key={badge}
                                label={badge}
                                className="bg-yellow-50 text-yellow-700 border-yellow-200"
                              />
                            ))
                          : null}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <InfoChip className="bg-white text-gray-600 border-gray-200">
                          <CalendarClock size={10} />
                          Criado em {formatDate(pet.createdAt)}
                        </InfoChip>
                        <p className="text-[11px] text-gray-400">
                          Atualizado em {formatDate(pet.updatedAt)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingPet(pet)}
                          title="Editar gato"
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Edit size={13} />
                        </button>

                        <button
                          onClick={() => setConfirm({ type: 'delete', pet })}
                          title="Deletar gato"
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && processedPets.length === 0 && (
          <div className="p-16 text-center text-gray-400">
            <Cat size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">Nenhum gato encontrado</p>
          </div>
        )}
      </div>

      {editingPet && (
        <EditModal
          pet={editingPet}
          onClose={() => setEditingPet(null)}
          onSaved={() => {
            setEditingPet(null);
            loadPets();
          }}
        />
      )}

      {confirm?.type === 'delete' && (
        <ConfirmModal
          title="Deletar perfil felino"
          message={`Isso vai apagar permanentemente o perfil de "${confirm.pet.name}" e os dados relacionados.`}
          confirmLabel="Deletar gato"
          confirmClass="bg-red-500 hover:bg-red-600"
          onConfirm={() => deletePet(confirm.pet)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
